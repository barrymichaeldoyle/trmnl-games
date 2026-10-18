import { internal } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import type { SimulationResult } from '@trmnl-games/desk-crawler/sim/core/types'
import type { LifeState, PaperLivesCatalog } from '@trmnl-games/paper-lives/sim'
import type { Locale } from '@trmnl-games/platform'
import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'

/**
 * P33 hero alerts (alerts.md): an alert goes out only when the hero has stopped or is about to lose something the
 * player can act on. The tick writes one outbox row per qualifying event; the sender rechecks, applies quiet hours
 * and caps, and pushes.
 */
export const ALERTS = {
  /** A player already fixing the bag in the companion gets no alert. */
  asleepDelayMs: 30 * 60_000,
  dailyCap: 2,
  merchantDailyCap: 1,
  batch: 50,
  /** One send and two retries. */
  maxAttempts: 3,
  retryMs: 5 * 60_000,
  retentionMs: 7 * 24 * 60 * 60_000,
  maxSubscriptions: 5,
  quietStart: 21,
  quietEnd: 8,
} as const

export type AlertKind = Doc<'alertOutbox'>['kind']
export type AlertPreferences = NonNullable<Doc<'users'>['alerts']>

/** Every kind's on/off switch on the owner's preferences, across the games. */
export const SWITCHES = ['asleep', 'merchant', 'coolerFull', 'baitOut', 'majorDecision', 'lifeEnded', 'newArrival'] as const
export type AlertSwitch = (typeof SWITCHES)[number]
/** The preference switch for each kind. */
export const PREF_FOR: Readonly<Record<AlertKind, AlertSwitch>> = {
  asleep: 'asleep',
  merchant: 'merchant',
  cooler_full: 'coolerFull',
  bait_out: 'baitOut',
  major_decision: 'majorDecision',
  life_ended: 'lifeEnded',
  new_arrival: 'newArrival',
}
export const kindOn = (prefs: AlertPreferences | undefined, kind: AlertKind) => prefs?.[PREF_FOR[kind]] === true
/** Desk Crawler's kinds, Idle Angler's (D115) and Paper Lives' (D159). */
export const DESK_CRAWLER_KINDS: readonly AlertKind[] = ['asleep', 'merchant']
export const IDLE_ANGLER_KINDS: readonly AlertKind[] = ['cooler_full', 'bait_out']
export const PAPER_LIVES_KINDS: readonly AlertKind[] = ['major_decision', 'life_ended', 'new_arrival']

const STEP_MS = 15 * 60_000

function parts(at: number, timeZone: string): { day: string; hour: number } {
  try {
    const fields = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(at))
    const get = (type: string) => fields.find((field) => field.type === type)?.value ?? '00'
    return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24 }
  } catch {
    return timeZone === 'UTC' ? { day: new Date(at).toISOString().slice(0, 10), hour: new Date(at).getUTCHours() } : parts(at, 'UTC')
  }
}

/** The owner's local date (YYYY-MM-DD) at `at`, for the daily caps. */
export const localDay = (at: number, timeZone: string) => parts(at, timeZone).day

/** Quiet hours run from `start` up to `end` and may wrap midnight (21 to 8 by default). */
export function inQuietHours(at: number, timeZone: string, prefs: Pick<AlertPreferences, 'quietStart' | 'quietEnd'>): boolean {
  const { hour } = parts(at, timeZone)
  const { quietStart: start, quietEnd: end } = prefs
  return start < end ? hour >= start && hour < end : hour >= start || hour < end
}

/**
 * When the quiet window that contains `at` ends. Every timezone offset is a multiple of 15 minutes, so stepping by
 * quarter-hours lands on the local hour boundary exactly, DST included.
 */
export function quietEndsAt(at: number, timeZone: string, prefs: Pick<AlertPreferences, 'quietStart' | 'quietEnd'>): number {
  let t = Math.ceil(at / STEP_MS) * STEP_MS
  for (let i = 0; i < 26 * 4 && inQuietHours(t, timeZone, prefs); i += 1) t += STEP_MS
  return t
}

/** The next bag or pouch on a merchant visit this tick opened, if the hero's gold after the tick covers it. */
export function merchantDeal(result: SimulationResult): { id: 'bag' | 'pouch'; name: string } | undefined {
  const outcome = result.event?.detail.outcome
  if (outcome?.variant !== 'merchant') return undefined
  const gold = result.nextHero.gold
  for (const id of ['bag', 'pouch'] as const) {
    const offer = outcome.offers.find((candidate) => candidate.id === id)
    if (offer !== undefined && offer.price <= gold) return { id, name: offer.name }
  }
  return undefined
}

/**
 * Tick hook: insert an outbox row for each qualifying transition the owner turned on. Reads nothing unless the owner
 * has alerts and the tick produced an event worth one, so ordinary ticks cost no extra read.
 */
export async function queueAlerts(ctx: MutationCtx, args: { owner: Doc<'users'>; hero: Doc<'heroes'>; result: SimulationResult; tick: number; now: number }): Promise<void> {
  const { owner, hero, result, tick, now } = args
  const prefs = owner.alerts
  if (prefs === undefined) return
  const rows: Array<Pick<Doc<'alertOutbox'>, 'kind' | 'notBefore'> & { offerId?: 'bag' | 'pouch'; offerName?: string }> = []
  // D189: the `asleep` switch is the full-bag alert. It fires when the hero falls asleep on a full bag (older catalogs)
  // or the bag starts holding a find, which under v26 no longer stops the hero.
  const filled = (hero.status !== 'sleeping' && result.nextHero.status === 'sleeping') || (hero.heldItemId === undefined && (result.metrics?.heldFinds ?? 0) > 0)
  if (prefs.asleep && filled) rows.push({ kind: 'asleep', notBefore: now + ALERTS.asleepDelayMs })
  if (prefs.merchant) {
    const deal = merchantDeal(result)
    if (deal !== undefined) rows.push({ kind: 'merchant', notBefore: now, offerId: deal.id, offerName: deal.name })
  }
  for (const row of rows) {
    const key = `${hero._id}:${row.kind}:${tick}`
    // The key is the row's identity, so a retried tick inserts nothing more.
    if (await ctx.db.query('alertOutbox').withIndex('by_key', (q) => q.eq('key', key)).first()) continue
    await ctx.db.insert('alertOutbox', { userId: owner._id, heroId: hero._id, key, eventTick: tick, state: 'pending', attempts: 0, createdAt: now, updatedAt: now, ...row })
    await ensureSender(ctx, row.notBefore)
  }
}

/**
 * Make sure one sender run is scheduled no later than `at`. An idle outbox has no run at all; the tick that inserts
 * a row, or a sender run that leaves rows pending, schedules the next.
 */
export async function ensureSender(ctx: MutationCtx, at: number): Promise<void> {
  const now = Date.now()
  const runAt = Math.max(at, now)
  const sender = await ctx.db.query('alertSender').withIndex('by_key', (q) => q.eq('key', 'sender')).unique()
  if (sender?.scheduledId !== undefined) {
    const job = await ctx.db.system.get(sender.scheduledId)
    if (job?.state.kind === 'pending') {
      if ((sender.runAt ?? now) <= runAt) return
      await ctx.scheduler.cancel(sender.scheduledId)
    }
  }
  const scheduledId = await ctx.scheduler.runAt(runAt, internal.alertsPush.deliver, {})
  if (sender) await ctx.db.patch(sender._id, { scheduledId, runAt })
  else await ctx.db.insert('alertSender', { key: 'sender', scheduledId, runAt })
}

/**
 * Idle Angler tick hook (D115): a cooler that filled on this cast (held 30 minutes, like a nap) and a bait that ran out.
 * Reads nothing unless the owner turned the kind on.
 */
export async function queueIdleAnglerAlerts(ctx: MutationCtx, args: { owner: Doc<'users'>; anglerId: Doc<'anglers'>['_id']; filledCooler: boolean; ranOut: boolean; tick: number; now: number }): Promise<void> {
  const { owner, anglerId, tick, now } = args
  const prefs = owner.alerts
  if (prefs === undefined) return
  const rows: Array<{ kind: AlertKind; notBefore: number }> = []
  if (args.filledCooler && prefs.coolerFull) rows.push({ kind: 'cooler_full', notBefore: now + ALERTS.asleepDelayMs })
  if (args.ranOut && prefs.baitOut) rows.push({ kind: 'bait_out', notBefore: now })
  for (const row of rows) {
    const key = `${anglerId}:${row.kind}:${tick}`
    if (await ctx.db.query('alertOutbox').withIndex('by_key', (q) => q.eq('key', key)).first()) continue
    await ctx.db.insert('alertOutbox', { userId: owner._id, anglerId, key, eventTick: tick, state: 'pending', attempts: 0, createdAt: now, updatedAt: now, ...row })
    await ensureSender(ctx, row.notBefore)
  }
}

/**
 * Paper Lives tick hook (D159): a major decision still open once the year's minimum has passed (once per decision), a
 * life that ended, and a child or grandchild born on this tick. Reads nothing unless the owner turned a kind on.
 */
export async function queuePaperLivesAlerts(ctx: MutationCtx, args: { owner: Doc<'users'>; lifeId: Id<'lives'>; before: LifeState; after: LifeState; content: PaperLivesCatalog; tick: number; now: number }): Promise<void> {
  const { owner, lifeId, before, after, content, tick, now } = args
  const prefs = owner.alerts
  if (prefs === undefined) return
  const rows: Array<{ kind: AlertKind; key: string; lifeAge: number; detail?: string }> = []
  if (prefs.majorDecision) {
    const open = (life: LifeState) => {
      const pending = life.status === 'living' ? life.year.pending : undefined
      if (pending === undefined || pending.chosen !== undefined || life.year.elapsed < content.tuning.minYearTicks) return undefined
      return content.decisions.find((d) => d.id === pending.decisionId)?.major ? pending.decisionId : undefined
    }
    const id = open(after)
    // Raised once: on the tick the decision first stands open past the minimum.
    if (id !== undefined && !(open(before) === id && before.age === after.age)) rows.push({ kind: 'major_decision', key: `${lifeId}:major_decision:${after.age}:${id}`, lifeAge: after.age, detail: id })
  }
  if (prefs.lifeEnded && before.status !== 'ended' && after.status === 'ended') rows.push({ kind: 'life_ended', key: `${lifeId}:life_ended`, lifeAge: after.age })
  if (prefs.newArrival) {
    const known = new Set(before.people.map((p) => p.id))
    for (const person of after.people) {
      if (known.has(person.id) || (person.role !== 'child' && person.role !== 'grandchild') || person.bornAt < before.age) continue
      rows.push({ kind: 'new_arrival', key: `${lifeId}:new_arrival:${person.id}`, lifeAge: after.age, detail: person.id })
    }
  }
  for (const row of rows) {
    if (await ctx.db.query('alertOutbox').withIndex('by_key', (q) => q.eq('key', row.key)).first()) continue
    await ctx.db.insert('alertOutbox', { userId: owner._id, lifeId, eventTick: tick, state: 'pending', attempts: 0, notBefore: now, createdAt: now, updatedAt: now, ...row })
    await ensureSender(ctx, now)
  }
}

/** Paper Lives' lock-screen lines (D159): the character's first name and nothing from the story itself. */
export function lifeAlertMessage(row: Pick<Doc<'alertOutbox'>, 'kind'>, first: string, arrival?: { name: string; role: 'child' | 'grandchild' }): { title: string; body: string; url: string } {
  if (row.kind === 'major_decision') return { title: `A big decision for ${first}`, body: `${first} has a choice to make this year. If you don’t choose, the quietest option is picked when the year closes.`, url: '/app/paper-lives?alert=major_decision' }
  if (row.kind === 'life_ended') return { title: `${first}'s life has ended`, body: `${first}'s page is in the album now, and the next life is ready to begin.`, url: '/app/paper-lives?alert=life_ended' }
  const baby = arrival?.name ?? 'A baby'
  return arrival?.role === 'grandchild'
    ? { title: `${first} has a grandchild`, body: `${baby} was born today, a grandchild for ${first}.`, url: '/app/paper-lives/people?alert=new_arrival' }
    : { title: `A baby for ${first}`, body: `${baby} has joined the family.`, url: '/app/paper-lives/people?alert=new_arrival' }
}

/** One sentence in the game's voice, with nothing private on a lock screen, and the page it opens. */
export function alertMessage(row: Pick<Doc<'alertOutbox'>, 'kind' | 'offerName'>, heroName: string, locale: Locale = 'en'): { title: string; body: string; url: string } {
  if (row.kind === 'cooler_full') return { title: 'Your cooler is full', body: 'New catches are being released. Sell some fish to make room.', url: '/app/idle-angler/cooler?alert=cooler_full' }
  if (row.kind === 'bait_out') return { title: 'Out of bait', body: 'Your angler is fishing a bare hook. Restock in the tackle shop.', url: '/app/idle-angler/shop?alert=bait_out' }
  if (row.kind === 'asleep') return { ...DESK_ALERTS[locale].asleep(heroName), url: '/app/desk-crawler/inventory?alert=asleep' }
  return { ...DESK_ALERTS[locale].merchant(heroName, row.offerName ?? null), url: '/app/desk-crawler/inventory?alert=merchant' }
}

const fr = contentTranslator('fr')
const de = contentTranslator('de')

/** D169: Desk Crawler's two alerts in the owner's language (lib/trmnlUser.ts `deviceLocale`). */
const DESK_ALERTS: Readonly<Record<Locale, { asleep: (hero: string) => { title: string; body: string }; merchant: (hero: string, offer: string | null) => { title: string; body: string } }>> = {
  en: {
    asleep: (hero) => ({ title: `${hero}'s bag is full`, body: `${hero} is holding a new find for you. Make room in the bag so the next ones are not left behind.` }),
    merchant: (hero, offer) => ({ title: 'A merchant is visiting', body: `A merchant is offering ${hero} a ${offer ?? 'bigger bag'} at a discount, and they have the gold. The offer lasts about an hour.` }),
  },
  fr: {
    asleep: (hero) => ({ title: `Le sac de ${hero} est plein`, body: `${hero} vous garde une nouvelle trouvaille. Faites de la place dans le sac pour ne pas laisser les suivantes derrière.` }),
    merchant: (hero, offer) => ({ title: 'Un marchand est de passage', body: `Un marchand propose ${offer === null ? 'un sac plus grand' : fr.nameWith(offer, 'un')} à prix réduit à ${hero}, qui a l’or nécessaire. L’offre dure environ une heure.` }),
  },
  de: {
    asleep: (hero) => ({ title: `Die Tasche von ${hero} ist voll`, body: `${hero} hebt einen neuen Fund für dich auf. Schaff Platz in der Tasche, damit die nächsten nicht liegen bleiben.` }),
    merchant: (hero, offer) => ({ title: 'Ein Händler ist da', body: `Ein Händler bietet ${hero} ${offer === null ? 'eine größere Tasche' : de.nameWith(offer, 'einen')} günstiger an, und das Gold reicht. Das Angebot gilt etwa eine Stunde.` }),
  },
}
