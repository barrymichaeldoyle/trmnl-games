// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedWorld, type T } from './helpers'
import { nextPaperLivesTick, runPaperLivesTick } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const UUID_A = 'aaaaaaaa-1111-4aed-8464-bad68368e97c'
const UUID_B = 'bbbbbbbb-2222-4aed-8464-bad68368e97c'

const link = (t: T, alias: string, token: string) =>
  t.mutation(internal.trmnl.linkInstall, { gameSlug: 'paper-lives', tokenIdentifier: `issuer|${alias}`, tokenHash: sha256Hex(token), publicAlias: alias, timezone: 'UTC' })
const confirm = (t: T, token: string, uuid: string) => t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'paper-lives', tokenHash: sha256Hex(token), uuid, confirmedBy: 'success_callback' })
const screen = (t: T, token: string, uuid: string, path = '/trmnl/paper-lives/v1/screen') =>
  t.fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ user_uuid: uuid, 'trmnl[user][utc_offset]': '3600' }).toString() })

describe('Paper Lives screen route (D159, L2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
    await seedWorld(t)
    await runPaperLivesTick(t)
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'paper-lives', status: 'live' })
  })
  afterEach(() => vi.useRealTimers())

  it('serves the payload for an active installation and 404s for anything else', async () => {
    await link(t, 'Ana', 'pl-tok-ana')
    const pending = await screen(t, 'pl-tok-ana', UUID_A)
    // The first screen request confirms a lost Save callback and activates the life.
    expect(pending.status).toBe(200)
    for (let i = 0; i < 7; i += 1) await nextPaperLivesTick(t)
    const response = await screen(t, 'pl-tok-ana', UUID_A)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.markup).toContain('Paper Lives')
    expect(body.merge_variables).toMatchObject({ v: 1, game: 'paper-lives', data_state: 'ready', status: 'living', age: 6, stage: 'child', utc_offset: 3600 })
    expect(body.merge_variables.status_label).toMatch(/, 6, at school, at home$/)
    expect(body.merge_variables.lines.length).toBeGreaterThan(0)
    expect(body.merge_variables.closes_at).toBeGreaterThan(Date.now() / 1000)
    expect(body.merge_variables.board).toMatchObject({ label: 'Longest lives this week', rows: [], own_label: 'No finished life this week' })
    expect(await t.run(async (ctx) => (await ctx.db.query('users').first())!.trmnlUtcOffset)).toBe(3600)
    expect((await screen(t, 'pl-tok-ana', UUID_B)).status).toBe(404)
    expect((await screen(t, 'wrong-token', UUID_A)).status).toBe(404)
    // A Paper Lives token never reads another game's screen.
    expect((await screen(t, 'pl-tok-ana', UUID_A, '/trmnl/idle-angler/v1/screen')).status).toBe(404)
    expect((await screen(t, 'pl-tok-ana', UUID_A, '/trmnl/v1/screen')).status).toBe(404)
  })

  it('gives the owner the same payload as a preview, and shows a pending life as waiting', async () => {
    await link(t, 'Bo', 'pl-tok-bo')
    const preview = await t.withIdentity({ issuer: 'issuer', subject: 'Bo' }).query(api.paperLives.payload.preview, {})
    expect(preview).toMatchObject({ game: 'paper-lives', status: 'pending', status_label: 'Waiting for TRMNL Save' })
    await confirm(t, 'pl-tok-bo', UUID_A)
    const active = await t.withIdentity({ issuer: 'issuer', subject: 'Bo' }).query(api.paperLives.payload.preview, {})
    expect(active).toMatchObject({ status: 'living', age: 0, stage: 'infant', closes_at: null })
  })

  it('uninstalls the installation and stops serving it', async () => {
    await link(t, 'Cy', 'pl-tok-cy')
    await confirm(t, 'pl-tok-cy', UUID_A)
    const response = await t.fetch('/trmnl/paper-lives/uninstall', { method: 'POST', headers: { Authorization: 'Bearer pl-tok-cy', 'Content-Type': 'application/json' }, body: JSON.stringify({ user_uuid: UUID_A }) })
    expect(response.status).toBe(200)
    expect((await screen(t, 'pl-tok-cy', UUID_A)).status).toBe(404)
    // The life stays with the account.
    expect(await t.run(async (ctx) => (await ctx.db.query('lives').collect()).length)).toBe(1)
  })
})
