import { httpRouter } from 'convex/server'
import { internal } from './_generated/api'
import { httpAction } from './_generated/server'
import { sha256Hex } from './lib/hash'
import { verifySvix } from './lib/svix'
import { renderScenePng } from '@trmnl-games/desk-crawler/art/route'
import { renderHeroCardPng } from '@trmnl-games/desk-crawler/art/heroCard'
import { sceneUrlsAt } from '@trmnl-games/desk-crawler/art/sceneTime'
import { DEFAULT_COMPANION_ORIGIN, keepsakeQrFields, renderQrPng } from '@trmnl-games/desk-crawler/art/qr'
import { parseUtcOffset, screenMarkup } from '@trmnl-games/desk-crawler/templates/screen'
import { screenMarkup as idleAnglerMarkup } from '@trmnl-games/idle-angler/templates/screen'
import { screenMarkup as paperLivesMarkup } from '@trmnl-games/paper-lives/templates/screen'
import { flyQrBase, renderIdleAnglerArt } from '@trmnl-games/idle-angler/art/route'
import { renderPaperLivesArt } from '@trmnl-games/paper-lives/art/route'
import { screenMarkup as littlePlotMarkup } from '@trmnl-games/little-plot/templates/screen'
import { flowerQrBase, renderLittlePlotArt } from '@trmnl-games/little-plot/art/route'
import type { GameSlug } from '@trmnl-games/platform'
import { parseTrmnlLocale } from './lib/trmnlUser'

/**
 * TRMNL lifecycle and screen routes (trmnl.md). Every route authenticates the
 * installation bearer token first; unknown credentials, instances and owner
 * mismatches all answer the same generic 404. No bearer value is ever logged.
 */
const http = httpRouter()

const MAX_BODY_BYTES = 32 * 1024
const MAX_FORM_FIELDS = 64
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' } })
const notFound = () => json(404, { error: 'not_found' })

function bearerHash(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? ''
  const match = /^Bearer ([\w.~+/=-]{8,512})$/.exec(header)
  return match ? sha256Hex(match[1]!) : null
}

async function readBoundedText(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('Content-Length') ?? '0')
  if (declared > MAX_BODY_BYTES) return null
  const text = await request.text()
  return new TextEncoder().encode(text).length > MAX_BODY_BYTES ? null : text
}

const UUID = /^[0-9a-fA-F-]{8,64}$/

const installSuccess = (gameSlug: GameSlug) =>
  httpAction(async (ctx, request) => {
    const tokenHash = bearerHash(request)
    if (tokenHash === null) return notFound()
    const text = await readBoundedText(request)
    if (text === null) return json(413, { error: 'too_large' })
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      return json(400, { error: 'invalid_json' })
    }
    const user = typeof body === 'object' && body !== null && 'user' in body ? (body as { user: unknown }).user : null
    const uuid = typeof user === 'object' && user !== null && 'uuid' in user ? String((user as { uuid: unknown }).uuid) : ''
    const settingRaw = typeof user === 'object' && user !== null && 'plugin_setting_id' in user ? (user as { plugin_setting_id: unknown }).plugin_setting_id : undefined
    if (!UUID.test(uuid)) return json(400, { error: 'invalid_body' })
    // Only uuid and plugin_setting_id are kept; name/email/profile fields are ignored.
    const pluginSettingId = typeof settingRaw === 'number' || typeof settingRaw === 'string' ? String(settingRaw).slice(0, 64) : undefined
    const result = await ctx.runMutation(internal.trmnl.confirmInstance, {
      gameSlug,
      tokenHash,
      uuid,
      ...(pluginSettingId === undefined ? {} : { pluginSettingId }),
      confirmedBy: 'success_callback',
    })
    if (result.reason === 'unknown_grant' || result.reason === 'foreign_instance') return notFound()
    return json(200, { ok: true })
  })

const uninstall = (gameSlug: GameSlug) =>
  httpAction(async (ctx, request) => {
    const tokenHash = bearerHash(request)
    if (tokenHash === null) return notFound()
    const text = await readBoundedText(request)
    if (text === null) return json(413, { error: 'too_large' })
    let uuid = ''
    try {
      const body = JSON.parse(text) as { user_uuid?: unknown }
      uuid = String(body.user_uuid ?? '')
    } catch {
      return json(400, { error: 'invalid_json' })
    }
    if (!UUID.test(uuid)) return json(400, { error: 'invalid_body' })
    const found = await ctx.runMutation(internal.trmnl.uninstallInstance, { gameSlug, tokenHash, uuid })
    return found ? json(200, { ok: true }) : notFound()
  })

// Desk Crawler keeps its original paths; Idle Angler's plugin points at its own (D115).
http.route({ path: '/trmnl/install/success', method: 'POST', handler: installSuccess('desk-crawler') })
http.route({ path: '/trmnl/uninstall', method: 'POST', handler: uninstall('desk-crawler') })
http.route({ path: '/trmnl/idle-angler/install/success', method: 'POST', handler: installSuccess('idle-angler') })
http.route({ path: '/trmnl/idle-angler/uninstall', method: 'POST', handler: uninstall('idle-angler') })
http.route({ path: '/trmnl/paper-lives/install/success', method: 'POST', handler: installSuccess('paper-lives') })
http.route({ path: '/trmnl/paper-lives/uninstall', method: 'POST', handler: uninstall('paper-lives') })
http.route({ path: '/trmnl/little-plot/install/success', method: 'POST', handler: installSuccess('little-plot') })
http.route({ path: '/trmnl/little-plot/uninstall', method: 'POST', handler: uninstall('little-plot') })
http.route({ path: '/trmnl/pixel-wars/install/success', method: 'POST', handler: installSuccess('pixel-wars') })
http.route({ path: '/trmnl/pixel-wars/uninstall', method: 'POST', handler: uninstall('pixel-wars') })

/** Shared screen request parsing: bearer, form type and size, one `user_uuid`. */
async function parseScreenRequest(request: Request): Promise<{ tokenHash: string; form: URLSearchParams; uuid: string } | Response> {
  const tokenHash = bearerHash(request)
  if (tokenHash === null) return notFound()
  if (!(request.headers.get('Content-Type') ?? '').startsWith('application/x-www-form-urlencoded')) return json(415, { error: 'unsupported_media_type' })
  const text = await readBoundedText(request)
  if (text === null) return json(413, { error: 'too_large' })
  const form = new URLSearchParams(text)
  if ([...form.keys()].length > MAX_FORM_FIELDS || form.getAll('user_uuid').length !== 1) return json(400, { error: 'invalid_body' })
  const uuid = form.get('user_uuid') ?? ''
  if (!UUID.test(uuid)) return json(400, { error: 'invalid_body' })
  return { tokenHash, form, uuid }
}

const idleAnglerScreen = httpAction(async (ctx, request) => {
  const parsed = await parseScreenRequest(request)
  if (parsed instanceof Response) return parsed
  const { tokenHash, form, uuid } = parsed
  const now = Date.now()
  const utcOffset = parseUtcOffset(form.get('trmnl[user][utc_offset]'))
  const locale = parseTrmnlLocale(form.get('trmnl[user][locale]'))
  const args = { tokenHash, uuid, now, utcOffset, locale }
  let result = await ctx.runQuery(internal.idleAngler.payload.forInstance, args)
  if (result?.outcome === 'recoverable') {
    await ctx.runMutation(internal.trmnl.confirmInstance, { gameSlug: 'idle-angler', tokenHash, uuid, confirmedBy: 'screen_request' })
    result = await ctx.runQuery(internal.idleAngler.payload.forInstance, args)
  }
  if (result === null || result.outcome !== 'payload') return notFound()
  if (result.recordUserFor !== undefined) await ctx.runMutation(internal.trmnl.recordTrmnlUser, { userId: result.recordUserFor, ...(utcOffset === null ? {} : { utcOffset }), ...(locale === null ? {} : { locale }) })
  // D180: this week's fly code also rides in the standing QR, as Desk Crawler's keepsake does.
  const flyQr = result.flyCode && process.env.CONVEX_SITE_URL ? flyQrBase(result.flyCode) : null
  return json(200, { ...idleAnglerMarkup, merge_variables: { ...result.payload, fly_code: result.flyCode, fly_qr_base: flyQr ? `${process.env.CONVEX_SITE_URL}${flyQr}` : '', utc_offset: utcOffset } })
})
http.route({ path: '/trmnl/idle-angler/v1/screen', method: 'POST', handler: idleAnglerScreen })

/** Paper Lives' screen (D159): the same authorization and lost-callback recovery as Idle Angler's. */
const paperLivesScreen = httpAction(async (ctx, request) => {
  const parsed = await parseScreenRequest(request)
  if (parsed instanceof Response) return parsed
  const { tokenHash, form, uuid } = parsed
  const now = Date.now()
  const utcOffset = parseUtcOffset(form.get('trmnl[user][utc_offset]'))
  const locale = parseTrmnlLocale(form.get('trmnl[user][locale]'))
  const args = { tokenHash, uuid, now, utcOffset, locale }
  let result = await ctx.runQuery(internal.paperLives.payload.forInstance, args)
  if (result?.outcome === 'recoverable') {
    await ctx.runMutation(internal.trmnl.confirmInstance, { gameSlug: 'paper-lives', tokenHash, uuid, confirmedBy: 'screen_request' })
    result = await ctx.runQuery(internal.paperLives.payload.forInstance, args)
  }
  if (result === null || result.outcome !== 'payload') return notFound()
  if (result.recordUserFor !== undefined) await ctx.runMutation(internal.trmnl.recordTrmnlUser, { userId: result.recordUserFor, ...(utcOffset === null ? {} : { utcOffset }), ...(locale === null ? {} : { locale }) })
  return json(200, { ...paperLivesMarkup, merge_variables: { ...result.payload, photo_code: result.photoCode, utc_offset: utcOffset } })
})
http.route({ path: '/trmnl/paper-lives/v1/screen', method: 'POST', handler: paperLivesScreen })

/** Little Plot's screen (D206): the same authorization and lost-callback recovery as the other games'. */
const littlePlotScreen = httpAction(async (ctx, request) => {
  const parsed = await parseScreenRequest(request)
  if (parsed instanceof Response) return parsed
  const { tokenHash, form, uuid } = parsed
  const now = Date.now()
  const utcOffset = parseUtcOffset(form.get('trmnl[user][utc_offset]'))
  const locale = parseTrmnlLocale(form.get('trmnl[user][locale]'))
  const args = { tokenHash, uuid, now, utcOffset, locale }
  let result = await ctx.runQuery(internal.littlePlot.payload.forInstance, args)
  if (result?.outcome === 'recoverable') {
    await ctx.runMutation(internal.trmnl.confirmInstance, { gameSlug: 'little-plot', tokenHash, uuid, confirmedBy: 'screen_request' })
    result = await ctx.runQuery(internal.littlePlot.payload.forInstance, args)
  }
  if (result === null || result.outcome !== 'payload') return notFound()
  if (result.recordUserFor !== undefined) await ctx.runMutation(internal.trmnl.recordTrmnlUser, { userId: result.recordUserFor, ...(utcOffset === null ? {} : { utcOffset }), ...(locale === null ? {} : { locale }) })
  const flowerQr = result.flowerCode && process.env.CONVEX_SITE_URL ? flowerQrBase(result.flowerCode) : null
  return json(200, { ...littlePlotMarkup, merge_variables: { ...result.payload, flower_code: result.flowerCode, flower_qr_base: flowerQr ? `` : '', utc_offset: utcOffset } })
})
http.route({ path: '/trmnl/little-plot/v1/screen', method: 'POST', handler: littlePlotScreen })

http.route({
  path: '/trmnl/v1/screen',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const parsed = await parseScreenRequest(request)
    if (parsed instanceof Response) return parsed
    const { tokenHash, form, uuid } = parsed
    const instanceName = form.get('trmnl[plugin_settings][instance_name]')

    const now = Date.now()
    // TRMNL does not expose its `trmnl` metadata to third-party Liquid, so pass the owner's offset through (D42); it also picks the recap period (D75).
    const utcOffset = parseUtcOffset(form.get('trmnl[user][utc_offset]'))
    // D168: the owner's locale, stored to size translation demand; nothing reads it for rendering yet.
    const locale = parseTrmnlLocale(form.get('trmnl[user][locale]'))
    const args = { tokenHash, uuid, now, instanceName: instanceName === null ? null : instanceName.slice(0, 200), utcOffset, locale }
    let result = await ctx.runQuery(internal.trmnlPayload.forInstance, args)
    if (result?.outcome === 'recoverable') {
      // Lost success callback: confirm a new instance only under a current pending attempt (V06).
      await ctx.runMutation(internal.trmnl.confirmInstance, { tokenHash, uuid, confirmedBy: 'screen_request' })
      result = await ctx.runQuery(internal.trmnlPayload.forInstance, args)
    }
    if (result === null || result.outcome !== 'payload') return notFound()
    if (result.recordUserFor !== undefined) await ctx.runMutation(internal.trmnl.recordTrmnlUser, { userId: result.recordUserFor, ...(utcOffset === null ? {} : { utcOffset }), ...(locale === null ? {} : { locale }) })
    // Telemetry only: a failed write never fails a valid screen.
    if (result.screenServedFor !== undefined) { try { await ctx.runMutation(internal.trmnl.recordScreenServed, { instanceId: result.screenServedFor, at: now }) } catch { /* next request retries */ } }
    // D180: a waiting keepsake's code also rides in the standing QR, so a hidden title bar never hides the claim.
    const keepsakeQr = keepsakeQrFields(result.keepsakeCode, process.env.CONVEX_SITE_URL ?? null)
    return json(200, { ...screenMarkup, merge_variables: { ...sceneUrlsAt(result.payload, now, utcOffset), desk_keepsake_code: result.keepsakeCode, ...keepsakeQr, utc_offset: utcOffset } })
  }),
})

/**
 * Public, deterministic art for TRMNL screens. Scenes are immutable per URL
 * (versioned path); QR codes depend on COMPANION_ORIGIN, so they cache for a day.
 */
http.route({
  pathPrefix: '/art/',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const path = new URL(request.url).pathname
    // D115: Idle Angler's scenes and codes live under their own prefix.
    if (path.startsWith('/art/ia/')) {
      const art = renderIdleAnglerArt(path, process.env.COMPANION_ORIGIN ?? DEFAULT_COMPANION_ORIGIN)
      if (art === null) return new Response('Not found', { status: 404 })
      return new Response(new Blob([art.png.slice().buffer as ArrayBuffer], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': art.immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=86400' } })
    }
    // D159: Paper Lives' portraits and code.
    if (path.startsWith('/art/pl/')) {
      const art = renderPaperLivesArt(path, process.env.COMPANION_ORIGIN ?? DEFAULT_COMPANION_ORIGIN)
      if (art === null) return new Response('Not found', { status: 404 })
      return new Response(new Blob([art.png.slice().buffer as ArrayBuffer], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': art.immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=86400' } })
    }
    // D206: Little Plot's scenes and codes.
    if (path.startsWith('/art/lp/')) {
      const art = renderLittlePlotArt(path, process.env.COMPANION_ORIGIN ?? DEFAULT_COMPANION_ORIGIN)
      if (art === null) return new Response('Not found', { status: 404 })
      return new Response(new Blob([art.png.slice().buffer as ArrayBuffer], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': art.immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=86400' } })
    }
    // D109: a public hero page's social card, drawn only while the page is public; an hour's cache follows level and rank.
    const card = /^\/art\/card\/hero\/([^/]{1,80})\.png$/.exec(path)
    if (card) {
      let alias: string
      try {
        alias = decodeURIComponent(card[1]!)
      } catch {
        return new Response('Not found', { status: 404 })
      }
      const data = await ctx.runQuery(internal.profiles.card, { alias })
      const png = data === null ? null : renderHeroCardPng(data)
      if (png === null) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } })
      return new Response(new Blob([png.slice().buffer as ArrayBuffer], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } })
    }
    const isQr = path.startsWith('/art/qr/')
    const png = isQr ? renderQrPng(path, process.env.COMPANION_ORIGIN ?? DEFAULT_COMPANION_ORIGIN) : renderScenePng(path)
    if (png === null) return new Response('Not found', { status: 404 })
    const cache = isQr ? 'public, max-age=86400' : 'public, max-age=31536000, immutable'
    return new Response(new Blob([png.slice().buffer as ArrayBuffer], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': cache } })
  }),
})

/**
 * Clerk user.deleted reconciliation (api.md, V09). Signed with the endpoint's
 * Svix secret; anything unsigned, stale or oversized is refused before a
 * mutation runs. Other event types are acknowledged and ignored.
 */
http.route({
  path: '/auth/clerk/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) return json(503, { error: 'not_configured' })
    const text = await readBoundedText(request)
    if (text === null) return json(413, { error: 'too_large' })
    const headers = { id: request.headers.get('svix-id'), timestamp: request.headers.get('svix-timestamp'), signature: request.headers.get('svix-signature') }
    if (!(await verifySvix(secret, headers, text, Date.now()))) return json(401, { error: 'invalid_signature' })
    let event: { type?: unknown; data?: { id?: unknown } }
    try {
      event = JSON.parse(text) as typeof event
    } catch {
      return json(400, { error: 'invalid_json' })
    }
    if (event.type !== 'user.deleted') return json(200, { ok: true, ignored: true })
    const clerkUserId = typeof event.data?.id === 'string' ? event.data.id : ''
    if (!/^user_[A-Za-z0-9]{8,64}$/.test(clerkUserId)) return json(400, { error: 'invalid_body' })
    await ctx.runMutation(internal.deletion.providerDeleted, { clerkUserId })
    return json(200, { ok: true })
  }),
})

export default http
