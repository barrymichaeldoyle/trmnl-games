/**
 * Canonical TRMNL payload v1 (trmnl.md). Pure mapping: no reads, clocks, RNG or
 * writes. The caller supplies `now` and already-authorized, bounded inputs.
 */
import type { ContentCatalog, HeroClass, StanceId } from '../sim/core/types'
import { baseAttack, baseDefense, classRule, heroMaxHp, xpToLeave } from '../sim/core/stats'
import { scaled } from '../sim/core/modifiers'
import { FULL_SCALE, LARGE_SCALE, MEDIUM_SCALE, SMALL_SCALE } from '../art/scene'
import { QR_LARGE_SCALE, QR_SCALE, qrBasePath, qrPath, type QrTarget } from '../art/qr'
import { sceneFor, scenePath, type LatestEvent } from '../art/sceneKey'
import type { HeroGender } from '../art/hero'
import { isOccasionArt, type OccasionArt } from '../art/occasions'
import { occasionAt } from '../sim/core/occasions'
import { nextSlotAfter, slotEta, SLOT_MS } from '../sim/schedule'
import { bold } from '../sim/core/narrative'
import { logPresentation, type LogDeltas } from './logPresentation'
import { activityRecap, recapPeriod, type ActivityEntry } from './activityRecap'
import { INTL_TAG, type Locale } from '@trmnl-games/platform'
import { contentTranslator } from '../i18n'
import { DEVICE_WORDS, deviceArea, type DeviceWords } from '../i18n/device'

export { activityRecap, MAX_RECAP_EVENTS, RECAP_WINDOW_MS, recapPeriod } from './activityRecap'
export type { ActivityEntry, ActivityRecap, RecapPeriod } from './activityRecap'

export const STALE_AFTER_MS = 30 * 60 * 1000
/** Ten newest stories, independent of the twelve-hour recap and visible layout count. */
export const MAX_LOGS = 20
/** Rows of the own group's board the device receives (`top10`); `top5` stays as the first five for older templates. */
export const TOP_ROWS = 10

export interface PayloadWorld {
  readonly currentTick: number
  readonly lastCompletedTick?: number
  readonly lastCompletedAt?: number
  readonly createdAt: number
  readonly ticksPaused: boolean
  readonly maintenanceMode: boolean
}

export interface PayloadHero {
  readonly name: string
  readonly level: number
  readonly xp: number
  readonly hp: number
  readonly gold: number
  readonly status: 'exploring' | 'resting' | 'travelling' | 'dead' | 'paused' | 'sleeping'
  readonly biomeId: string
  readonly targetBiomeId?: string
  readonly arriveAtTick?: number
  readonly reviveAtTick?: number
  readonly wakeAtTick?: number
  readonly lastTick: number
  readonly lastAdvancedAt?: number
  readonly quarantined: boolean
  /** D78: an open merchant visit ends at this tick. */
  readonly merchantExpiresAtTick?: number
  /** D79: a pending choice resolves by itself at this tick. */
  readonly choiceExpiresAtTick?: number
  /** D76: absent means balanced. */
  readonly stance?: StanceId
  /** P37: absent means warrior. */
  readonly class?: HeroClass
  /** D149: absent means male. */
  readonly gender?: HeroGender
  /** D163: a dug-in elite: its monster, HP and the tick it leaves. */
  readonly standoff?: { readonly monsterId: string; readonly hp: number; readonly maxHp: number; readonly untilTick: number }
}

export interface PayloadInput {
  readonly now: number
  readonly world: PayloadWorld | null
  readonly ownerAlias: string | null
  readonly timezone: string
  /** Null for no activated hero (including pending setup): the privacy-safe unlinked payload. */
  readonly hero: PayloadHero | null
  readonly weaponName: string | null
  readonly armorName: string | null
  /** Attack bonus of the equipped weapon and defense bonus of the equipped armor; 0 with nothing equipped. */
  readonly weaponAttack: number
  readonly armorDefense: number
  readonly potions: number
  readonly bagUsed: number
  readonly bagCapacity: number
  readonly heldItemName: string | null
  /** `compact`: D112's count form of a to-do line, for rows too narrow for its labels. */
  readonly logs: ReadonlyArray<{ readonly at: number; readonly kind: string; readonly summary: string; readonly deltas?: LogDeltas; readonly compact?: string }>
  /** Separate 12-hour read; the ten recent stories cannot imply a complete recap. */
  readonly activity?: { readonly entries: readonly ActivityEntry[]; readonly truncated: boolean }
  /** The owner's UTC offset in seconds (TRMNL's `trmnl[user][utc_offset]`, or the browser's); null means UTC. Sets the recap period (D75). */
  readonly utcOffset?: number | null
  readonly instanceName: string | null
  readonly content: ContentCatalog
  readonly spriteBaseUrl: string | null
  /** Public origin serving `/art/...` scene images (the Convex site URL). */
  readonly artBaseUrl: string | null
  readonly latestEvent: LatestEvent | null
  /** The newest log of any kind, for the celebration; defaults to `latestEvent`. An achievement log carries its `title` (D65). */
  readonly newestEvent?: LatestEvent | null
  /** Seven-day own-group ranking from the published set; null before any publication. */
  readonly ranking: PayloadRanking | null
  /** D138: today's to-do tasks (labels keep their [[bold marks]]); absent before the list arrives. */
  readonly todoTasks?: ReadonlyArray<{ readonly label: string; readonly progress: number; readonly target: number; readonly done: boolean }>
  /**
   * D138: the hero's current career goal; absent off the ladder or past its end. `claimable` (D184) means a reached
   * goal's reward waits in the companion: the screen says so instead of naming the next goal, and `gold` is what waits.
   */
  readonly goal?: { readonly title: string; readonly value: number; readonly target: number; readonly gold: number; readonly claimable?: boolean } | null
  /** D169: the owner's language for everything the screen says; English when absent. */
  readonly locale?: Locale
}

export interface PayloadRanking {
  readonly rank: number | null
  readonly rankDelta: number | null
  readonly status: 'ranked' | 'awaiting' | 'dormant'
  readonly cohortKey: string | null
  readonly cohortLabel: string
  readonly score: number | null
  readonly scoreAt: number
  readonly asOfTick: number
  readonly builtAt: number
  readonly windowStart: number
  readonly totalPlayers: number
  readonly globalTotalPlayers: number
  /** The group's first `TOP_ROWS` rows. */
  readonly top: ReadonlyArray<RankingRow>
  /** Up to `TOP_ROWS` consecutive rows around the hero (D152); the first rows when the hero is not among them. */
  readonly nearby: ReadonlyArray<RankingRow>
  /** The hero's index in `nearby`, or null when the hero is not in it. */
  readonly nearbyOwn: number | null
}

type RankingRow = { rank: number; name: string; hero_name: string; level: number; score: number }

const iso = (timestamp: number) => new Date(timestamp).toISOString().replace(/\.\d{3}Z$/, 'Z')
const clampPct = (value: number) => Math.max(0, Math.min(100, value))

/** Local "DD Mon HH:mm" plus numeric offset ("UTC+02:00"); falls back to UTC for unknown zones. */
export function formatLocal(timestamp: number, timeZone: string, locale: Locale = 'en'): { label: string; offset: string } {
  const format = (zone: string) => {
    const parts = new Intl.DateTimeFormat(INTL_TAG[locale], {
      timeZone: zone,
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    }).formatToParts(new Date(timestamp))
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
    const zoneName = get('timeZoneName').replace('GMT', '')
    return { label: `${get('day')} ${get('month')} ${get('hour')}:${get('minute')}`, offset: `UTC${zoneName === '' ? '+00:00' : zoneName}` }
  }
  try {
    return format(timeZone)
  } catch {
    return format('UTC')
  }
}

const sanitizeLabel = (raw: string | null, max: number, fallback: string) => {
  const cleaned = (raw ?? '').normalize('NFC').replace(/[^\p{L}\p{N} ._'()&-]/gu, '').trim()
  return cleaned === '' ? fallback : [...cleaned].slice(0, max).join('')
}

function rankingFields(ranking: PayloadRanking | null, unlinked: boolean, timeZone: string, locale: Locale, words: DeviceWords) {
  if (ranking === null || unlinked) {
    return {
      rank: null as number | null,
      rank_delta: null as number | null,
      rank_status: 'awaiting' as 'ranked' | 'awaiting' | 'dormant',
      leaderboard_board: 'recent_7d' as const,
      leaderboard_cohort: null as string | null,
      leaderboard_cohort_label: '',
      leaderboard_score: null as number | null,
      leaderboard_window_start: null as string | null,
      leaderboard_window_end: null as string | null,
      leaderboard_tick: null as number | null,
      leaderboard_built_at: null as string | null,
      total_players: 0,
      global_total_players: unlinked ? 0 : (ranking?.globalTotalPlayers ?? 0),
      top5: [] as Array<{ rank: number; name: string; hero_name: string; level: number; class: string; score: number }>,
      top10: [] as Array<{ rank: number; name: string; hero_name: string; level: number; class: string; score: number }>,
      board: [] as Array<{ rank: number; name: string; hero_name: string; level: number; class: string; score: number }>,
      board_own: null as number | null,
      leaderboard_as_of_label: words.rankingSoon,
    }
  }
  const asOf = formatLocal(ranking.scoreAt, timeZone, locale)
  return {
    rank: ranking.rank,
    rank_delta: ranking.rankDelta,
    rank_status: ranking.status,
    leaderboard_board: 'recent_7d' as const,
    leaderboard_cohort: ranking.cohortKey,
    leaderboard_cohort_label: locale === 'en' || ranking.cohortKey === null ? ranking.cohortLabel : words.cohort(ranking.cohortKey),
    leaderboard_score: ranking.score,
    leaderboard_window_start: iso(ranking.windowStart),
    leaderboard_window_end: iso(ranking.scoreAt),
    leaderboard_tick: ranking.asOfTick,
    leaderboard_built_at: iso(ranking.builtAt),
    total_players: ranking.totalPlayers,
    global_total_players: ranking.globalTotalPlayers,
    top5: ranking.top.slice(0, 5).map((row) => ({ ...row, class: 'warrior' })),
    top10: ranking.top.slice(0, TOP_ROWS).map((row) => ({ ...row, class: 'warrior' })),
    board: ranking.nearby.map((row) => ({ ...row, class: 'warrior' })),
    board_own: ranking.nearbyOwn,
    leaderboard_as_of_label: `${asOf.label} ${asOf.offset}`,
  }
}

/**
 * Joins numbers to their units with a no-break space so wrapped log lines never
 * strand "+2" at the end of a row and "gold" at the start of the next. A reward
 * run ("+7 XP, +2 gold") also stays together across its comma.
 */
export const keepUnitsTogether = (text: string) =>
  text
    .replace(/([+-]?\d+) (XP|gold|HP|ticks?|(?:minor|healing|major) potions?)\b/g, '$1\u00a0$2')
    .replace(/\b(level|Level) (\d+)/g, '$1\u00a0$2')
    .replace(/([+-]\d+\u00a0(?:XP|gold|HP)), (?=[+-]\d)/g, '$1,\u00a0')

/**
 * A short cheer for the newest event when it is a big moment: a level-up, an elite win, a jackpot or a rare find.
 * Shown above the newest story until the next adventure replaces it.
 */
export function celebrationFor(latest: LatestEvent | null, level: number, locale: Locale = 'en'): string | null {
  if (latest === null) return null
  const words = DEVICE_WORDS[locale]
  const t = contentTranslator(locale)
  if (latest.kind === 'achievement') return latest.title ? words.achievement(t.text(latest.title)) : null
  // P35: "Goal reached: Equip a find" or "Unlocked: the to-do list", exactly as the line reads.
  if (latest.kind === 'career') return latest.title === undefined ? null : (t.story(latest.title) ?? latest.title)
  if (latest.kind === 'levelup') return words.levelUp(level)
  const outcome = latest.outcome
  if (outcome?.variant === 'combat' && outcome.elite === true && outcome.outcome === 'victory') return words.eliteDefeated
  if (outcome?.variant === 'loot' && outcome.jackpot === true) return words.jackpot
  if (outcome?.variant === 'loot' && outcome.found === 'gear' && outcome.rarity === 'epic') return words.epicFind
  if (outcome?.variant === 'loot' && outcome.found === 'gear' && outcome.rarity === 'rare') return words.rareFind
  return null
}

/** "45 min", "2 h", "1 h 15 min" for a number of quarter-hour ticks. */
export function aboutDuration(ticks: number, locale: Locale = 'en'): string {
  const minutes = (ticks * SLOT_MS) / 60_000
  return DEVICE_WORDS[locale].duration(Math.floor(minutes / 60), minutes % 60)
}

/** Chip units the template draws as a HUD mark (screen.ts `chip`): these keep their English unit, the number is all that shows. */
const markedUnit = (chip: string) => /^\S+[\s\u00a0](?:XP|gold|HP|HP from potion)$/.test(chip) || /potion|bag slot/.test(chip)

export function buildPayload(input: PayloadInput) {
  const { now, world, hero, content } = input
  const locale = input.locale ?? 'en'
  const words = DEVICE_WORDS[locale]
  const t = contentTranslator(locale)
  const heroGender = hero?.gender === 'female' ? ('female' as const) : ('male' as const)
  const biomeName = (id: string | undefined) => content.biomes.find((b) => b.id === id)?.name ?? ''
  const lastCompletedAt = world?.lastCompletedAt
  const stale = world === null ? false : now - (lastCompletedAt ?? world.createdAt) > STALE_AFTER_MS
  const servicePaused = world !== null && (world.ticksPaused || world.maintenanceMode)
  const gameAsOf = lastCompletedAt === undefined ? null : formatLocal(lastCompletedAt, input.timezone, locale)
  const logs = input.logs.slice(0, MAX_LOGS).map((log) => {
    // The device draws each change behind its mark, so a row without one already reads as no effect (the companion
    // still says so). Every signed number is tied to its unit, which names the mark ("+3 bag slots", "−12k gold").
    // D169: the story in the owner's language; a change the template marks keeps its English unit (only its number
    // shows), and one it spells out (an effect, "Pouch holds 4") reads in the owner's language.
    const { narrative, changes: english } = logPresentation(log, { compactGold: true, locale, chipLocale: 'en', heroGender })
    const local = locale === 'en' ? english : logPresentation(log, { compactGold: true, locale, heroGender }).changes
    const told = english.map((part, index) => (markedUnit(part) ? part : (local[index] ?? part)))
    const changes = told.filter((part) => part !== 'No effect').map((part) => part.replace(/^([+−-]\d+k?) /, '$1\u00a0'))
    const compact = log.compact === undefined ? undefined : locale === 'en' ? log.compact : (t.story(log.compact, { heroGender }) ?? log.compact)
    return { at: iso(log.at), u: Math.floor(log.at / 1000), t: formatLocal(log.at, input.timezone, locale).label, k: log.kind, s: keepUnitsTogether(log.summary), n: keepUnitsTogether(narrative), d: keepUnitsTogether(changes.join(' · ')), ...(compact === undefined ? {} : { c: compact }) }
  })

  const common = {
    v: 1 as const,
    generated_at: iso(now),
    tick: world?.currentTick ?? 0,
    last_completed_tick: world?.lastCompletedTick ?? null,
    last_completed_at: lastCompletedAt === undefined ? null : iso(lastCompletedAt),
    stale,
    plugin_instance_name: sanitizeLabel(input.instanceName, 40, 'Desk Crawler'),
    game_as_of_label: gameAsOf ? `${gameAsOf.label} ${gameAsOf.offset}` : words.waitingFirst,
    recap: hero !== null && input.activity ? activityRecap(input.activity.entries, recapPeriod(now, input.utcOffset ?? null), content, input.activity.truncated, locale) : null,
    ...rankingFields(input.ranking, hero === null, input.timezone, locale, words),
    // D169: the template's own words (template v58).
    labels: words.labels,
  }

  // D139: the scene dresses for the occasion on the device's local date.
  const occasion = sceneOccasion(content, now, input.utcOffset ?? undefined)
  const sceneUrls = (biomeId: string, scene: ReturnType<typeof sceneFor>) =>
    input.artBaseUrl
      ? {
          scene_url: `${input.artBaseUrl}${scenePath(biomeId, scene.pose, scene.subject, FULL_SCALE, 'day', occasion)}`,
          scene_url_small: `${input.artBaseUrl}${scenePath(biomeId, scene.pose, scene.subject, SMALL_SCALE, 'day', occasion)}`,
          scene_url_large: `${input.artBaseUrl}${scenePath(biomeId, scene.pose, scene.subject, LARGE_SCALE, 'day', occasion)}`,
          scene_url_medium: `${input.artBaseUrl}${scenePath(biomeId, scene.pose, scene.subject, MEDIUM_SCALE, 'day', occasion)}`,
        }
      : { scene_url: '', scene_url_small: '', scene_url_large: '', scene_url_medium: '' }

  /** A QR code back to the companion, only when the player has something to do there. */
  const qrFields = (target: QrTarget | null, label: string) =>
    target !== null && input.artBaseUrl
      ? {
          qr_url: `${input.artBaseUrl}${qrPath(target, QR_SCALE)}`,
          qr_url_large: `${input.artBaseUrl}${qrPath(target, QR_LARGE_SCALE)}`,
          qr_base: `${input.artBaseUrl}${qrBasePath(target)}`,
          qr_label: label,
        }
      : { qr_url: '', qr_url_large: '', qr_base: '', qr_label: '' }

  if (hero === null) {
    return {
      ...common,
      ...qrFields(servicePaused ? null : 'app', words.scanSetup),
      companion_qr_base: '',
      home_qr_base: '',
      corner_qr_base: '',
      first_run: false,
      ...sceneUrls(content.safeBiomeId, { pose: 'idle', subject: { kind: 'prop', id: 'signpost' } }),
      hero_tick: null,
      hero_updated_at: null,
      data_state: servicePaused ? ('service_paused' as const) : ('unlinked' as const),
      hero_name: '',
      owner_name: '',
      class: '',
      level: null,
      xp: null,
      xp_to_next: null,
      xp_pct: null,
      hp: null,
      max_hp: null,
      hp_pct: null,
      attack: null,
      defense: null,
      gold: null,
      status: 'unlinked' as const,
      status_label: words.setupNotFinished,
      status_eta_ticks: 0,
      status_eta_at: null,
      status_eta_label: '',
      next_tick_at: null,
      biome_id: '',
      biome_name: '',
      sprite: '',
      sprite_url: '',
      weapon: '',
      armor: '',
      potions: 0,
      bag_used: null,
      bag_capacity: null,
      stance: '' as const,
      stance_name: '',
      held_item: '',
      wake_at_tick: null,
      log: [],
      todo_tasks: [],
      goal: null,
      standoff: null,
      celebration: null,
      attention: servicePaused ? words.maintenance : words.signIn,
      notice: null,
    }
  }

  const stance = content.stances?.[hero.stance ?? 'balanced']
  const max = heroMaxHp(content, hero)
  const classMods = classRule(content, hero.class)?.modifiers ?? {}
  const xpToNext = xpToLeave(hero.level)
  const eta = (deadline: number | undefined) => (deadline === undefined ? 0 : Math.max(0, deadline - hero.lastTick))
  // Area names carry bold marks, rendered by the templates like log summaries; another language's article sits outside them.
  const area = (id: string | undefined, use: 'at' | 'into' | 'object') => (locale === 'en' ? bold(biomeName(id)) : deviceArea(locale, biomeName(id), use))
  let statusLabel: string
  /** With an ETA, the status leading into its HH:MM ("Knocked out, back at"); the template appends the time. */
  let etaLabel = ''
  let etaTicks = 0
  switch (hero.status) {
    case 'exploring':
      statusLabel = words.exploring(area(hero.biomeId, 'object'))
      break
    case 'resting':
      statusLabel = words.resting(area(hero.biomeId, 'at'))
      break
    case 'travelling':
      etaTicks = eta(hero.arriveAtTick)
      statusLabel = etaTicks === 0 ? words.arrivalPending : words.travelling(area(hero.targetBiomeId, 'into'))
      etaLabel = words.toArriving(area(hero.targetBiomeId, 'into'))
      break
    case 'dead':
      etaTicks = eta(hero.reviveAtTick)
      statusLabel = etaTicks === 0 ? words.revivalPending : words.knockedOutBack(aboutDuration(etaTicks, locale))
      etaLabel = words.knockedOutBackAt
      break
    case 'paused':
      statusLabel = words.pausedByYou
      break
    case 'sleeping':
      if (hero.wakeAtTick !== undefined) {
        etaTicks = eta(hero.wakeAtTick)
        statusLabel = etaTicks === 0 ? words.resumePending : words.resumeSoon
        etaLabel = words.resumeAt
      } else if (input.heldItemName) {
        statusLabel = words.bagFullHolding
      } else if (input.bagUsed >= input.bagCapacity) {
        statusLabel = words.bagFullFree
      } else {
        statusLabel = words.resumeSoon
      }
      break
  }

  // While travelling, the destination and arrival lead the story list, where players look for what is happening; the
  // header keeps its status line. The entry is live, never stored, and says the owner-local arrival time in its story
  // (D91): the HH:MM column is when something happened, so `live` tells the template to leave it empty here.
  const arrivesAt = hero.status === 'travelling' && etaTicks > 0 ? slotEta(now, etaTicks) : null
  const travelLine = arrivesAt === null ? null : (() => {
    const offset = input.utcOffset
    const story = words.offTo(area(hero.targetBiomeId, 'into'), typeof offset === 'number' && Number.isInteger(offset) ? new Date(arrivesAt + offset * 1000).toISOString().slice(11, 16) : null)
    return { at: iso(arrivesAt), u: Math.floor(arrivesAt / 1000), t: formatLocal(arrivesAt, input.timezone, locale).label, k: 'travel', s: story, n: story, d: '', live: true }
  })()

  const bagBlocking = hero.status === 'sleeping' && hero.wakeAtTick === undefined && (Boolean(input.heldItemName) || input.bagUsed >= input.bagCapacity)
  let attention: string | null = null
  if (hero.quarantined || servicePaused) attention = words.serviceCheck
  else if (stale) attention = words.delayed
  else if (hero.status === 'dead') attention = words.revives
  else if (bagBlocking) attention = words.makeRoom
  // D78: a merchant visit is a cheerful notice, never an attention line (attention collapses the stories), and only while its offers are open.
  const tickNow = world?.currentTick ?? hero.lastTick
  // D79 outranks D78: a decision waiting is the more useful line; neither ever outranks a problem.
  // D189: under v26 a full bag holding a find does not stop the hero, so it is a notice, ahead of the decision and merchant.
  const keepingGoing = hero.status !== 'sleeping' && Boolean(input.heldItemName)
  const notice = attention !== null ? null : keepingGoing ? words.bagFullKeepGoing : hero.choiceExpiresAtTick !== undefined && hero.choiceExpiresAtTick > tickNow ? words.decisionWaiting : hero.merchantExpiresAtTick !== undefined && hero.merchantExpiresAtTick > tickNow ? words.merchantVisiting : null

  const needsBag = bagBlocking && !hero.quarantined && !servicePaused
  // A brand-new hero has no adventures yet: the screen welcomes them and links the companion.
  const firstRun = input.logs.length === 0 && attention === null && (hero.status === 'exploring' || hero.status === 'resting')
  // D42: when the next scheduled tick starts (UTC seconds), only while this hero will take part in it.
  // The template formats it in the owner's TRMNL timezone; nothing is promised when delayed or stopped.
  const adventuring = hero.status === 'exploring' || hero.status === 'resting' || hero.status === 'travelling'
  const nextTickAt = adventuring && attention === null ? Math.floor(nextSlotAfter(now) / 1000) : null
  return {
    ...common,
    ...(needsBag ? qrFields('bag', words.scanBag) : qrFields(firstRun ? 'app' : null, words.scanCompanion)),
    // The standing link to the bag (gear and potions): the full layout shows it whenever no action QR takes its place.
    companion_qr_base: input.artBaseUrl ? `${input.artBaseUrl}${qrBasePath('bag')}` : '',
    // D88: the full layout's small corner code to the companion home; the bag link stays for older templates and narrow views.
    // D108: both go through the `/dc` short link; the OG landscape draws `corner`, flush into the screen's corner.
    home_qr_base: input.artBaseUrl ? `${input.artBaseUrl}${qrBasePath('home')}` : '',
    corner_qr_base: input.artBaseUrl ? `${input.artBaseUrl}${qrBasePath('corner')}` : '',
    first_run: firstRun,
    ...sceneUrls(hero.biomeId, sceneFor(hero.status, hero.wakeAtTick !== undefined, input.latestEvent, hero.class, hero.gender)),
    hero_tick: hero.lastTick,
    hero_updated_at: hero.lastAdvancedAt === undefined ? null : iso(hero.lastAdvancedAt),
    data_state: hero.quarantined || servicePaused ? ('service_paused' as const) : ('ready' as const),
    hero_name: hero.name,
    owner_name: input.ownerAlias ?? '',
    class: hero.class ?? 'warrior',
    level: hero.level,
    xp: hero.xp,
    xp_to_next: xpToNext,
    xp_pct: clampPct(Math.floor((hero.xp * 100) / xpToNext)),
    hp: hero.hp,
    max_hp: max,
    hp_pct: clampPct(Math.round((hero.hp * 100) / max)),
    // The same derived stats the companion HUD shows (deriveStats): level base plus the equipped gear bonus.
    attack: scaled(baseAttack(hero.level) + input.weaponAttack, classMods.attackPct ?? 0),
    defense: scaled(baseDefense(hero.level) + input.armorDefense, classMods.defensePct ?? 0),
    gold: hero.gold,
    status: hero.status,
    status_label: statusLabel,
    status_eta_ticks: etaTicks,
    // D44/D45: when a pending status ends (UTC seconds); the template shows `status_eta_label` + HH:MM, else `status_label`.
    status_eta_at: etaTicks > 0 ? Math.floor(slotEta(now, etaTicks) / 1000) : null,
    status_eta_label: etaTicks > 0 ? etaLabel : '',
    next_tick_at: nextTickAt,
    biome_id: hero.biomeId,
    biome_name: t.name(biomeName(hero.biomeId)),
    sprite: hero.status === 'dead' ? 'warrior_dead_v1' : 'warrior_idle_v1',
    sprite_url: input.spriteBaseUrl ? `${input.spriteBaseUrl}/sprites/${hero.status === 'dead' ? 'warrior-dead-v1' : 'warrior-idle-v1'}.png` : '',
    weapon: input.weaponName === null ? '' : t.name(input.weaponName),
    armor: input.armorName === null ? '' : t.name(input.armorName),
    potions: input.potions,
    bag_used: input.bagUsed,
    bag_capacity: input.bagCapacity,
    // D103: the stance outlasts its log line, so the HUD shows it under its gauge mark; empty under a catalog without stances.
    stance: stance ? stance.id : ('' as const),
    stance_name: stance ? t.text(stance.name) : '',
    held_item: input.heldItemName === null ? '' : t.name(input.heldItemName),
    wake_at_tick: hero.wakeAtTick ?? null,
    log: travelLine === null ? logs : [travelLine, ...logs].slice(0, MAX_LOGS),
    // D138: the X full landscape's to-do column and goal line. `p`/`n` are progress and target, capped so "5/5" never reads "6/5".
    todo_tasks: (input.todoTasks ?? []).map((task) => ({ t: locale === 'en' ? task.label : (t.story(task.label, { heroGender }) ?? task.label), p: Math.min(task.progress, task.target), n: task.target, done: task.done })),
    goal: input.goal ? { t: t.text(input.goal.title), v: Math.min(input.goal.value, input.goal.target), n: input.goal.target, g: input.goal.gold, c: input.goal.claimable === true } : null,
    // D163: a dug-in elite's name, its HP left (never 0 while it stands) and when it leaves (UTC seconds); null without one.
    standoff: standoffField(hero, content, now, locale),
    // The badge sits above the newest story, so it waits while the travel line leads.
    celebration: attention === null && travelLine === null && logs.length > 0 ? celebrationFor(input.newestEvent === undefined ? input.latestEvent : input.newestEvent, hero.level, locale) : null,
    attention,
    notice,
  }
}

export type CanonicalPayload = ReturnType<typeof buildPayload>

/** D163: the payload's standoff, or null when there is none the catalog can name. */
function standoffField(hero: PayloadHero, content: ContentCatalog, now: number, locale: Locale): { name: string; hp_pct: number; leaves_at: number } | null {
  const standoff = hero.standoff
  const monster = standoff === undefined ? undefined : content.monsters.find((m) => m.id === standoff.monsterId)
  if (standoff === undefined || monster === undefined || standoff.maxHp <= 0) return null
  const ticksLeft = Math.max(1, standoff.untilTick - hero.lastTick)
  return { name: contentTranslator(locale).name(monster.name), hp_pct: Math.min(100, Math.max(1, Math.ceil((standoff.hp * 100) / standoff.maxHp))), leaves_at: Math.floor(slotEta(now, ticksLeft) / 1000) }
}

/** D139: the occasion a scene dresses for at `now` in an offset, when the catalog has one live and there is art for it. */
export function sceneOccasion(content: ContentCatalog, now: number, utcOffsetSeconds: number | undefined): OccasionArt | undefined {
  const id = occasionAt(content, now, utcOffsetSeconds)?.rule.id
  return id !== undefined && isOccasionArt(id) ? id : undefined
}
