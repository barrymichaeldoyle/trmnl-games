import type { Locale } from '@trmnl-games/platform'
import { fishBase, qrBase, sceneBase } from '../art/route'
import { anglerWords } from '../i18n'
import { poseFor } from '../art/scene'
import { WEATHER_WORD } from '../sim/conditions'
import { nextTitle, rankThreshold, titleFor, waterRankAt } from '../sim/titles'
import { seasonAt } from '../sim/seasons'
import type { AnglerStatus, BaitClass, IdleAnglerCatalog, TimeBand, WaterId, Weather } from '../sim/types'

/**
 * Idle Angler device payload v1 (idle-angler.md "Device"). Pure: the backend passes
 * stored facts in, and every layout reads the same flat fields. Required stats
 * are always present; optional ones are null, never zero by accident.
 */
export const PAYLOAD_VERSION = 1
/** Two missed Idle Angler ticks before the device says updates are delayed. */
export const STALE_AFTER_MS = 30 * 60 * 1000
/** Stories sent to the device; each layout shows as many as fit (template v7). */
export const MAX_STORIES = 16
/** The recap covers the last twelve hours of stories (idle-angler.md "Device"). */
export const RECAP_MS = 12 * 3_600_000
/** Stories the backend reads for the recap: a busy twelve hours is under 60 lines. */
export const MAX_RECAP_STORIES = 60

export interface PayloadAngler {
  readonly alias: string
  readonly activationState: 'pending_trmnl' | 'active'
  readonly status: AnglerStatus
  readonly quarantined: boolean
  readonly gold: number
  readonly waterId: WaterId
  readonly travelTo?: WaterId
  readonly rodTier: number
  readonly coolerTier: number
  readonly baitOnHook?: BaitClass
  readonly bait: Readonly<Partial<Record<string, number>>>
  readonly speciesLogged: number
  /** D204: species logged at the angler's water, for its rank there (content v6). */
  readonly speciesHere?: number
  /** The newest fly from the fly box, drawn on the hat; null for none. */
  readonly fly?: string | null
  /** D162: the current goal's line under content v2; absent under v1. */
  readonly goal?: string | null
  /** Issue #8: reached goals whose coins wait for the companion's Claim button (v3 on); absent or null when none wait. */
  readonly goalWaiting?: { readonly count: number; readonly coins: number } | null
}

export interface PayloadStory {
  readonly kind: string
  readonly summary: string
  readonly at: number
  readonly speciesId?: string
  readonly grams?: number
  /** An achievement's name, so several earned on one cast can share a line. */
  readonly title?: string
}

/** Within one cast, the fish comes first, then its milestones (a title, a water opening), then what it earned. */
const STORY_RANK: Readonly<Record<string, number>> = { catch: 0, release: 0, got_away: 0, open: 1, milestone: 1, run: 1, goal: 2, achievement: 3 }

/**
 * The stories as the device lists them (newest first). Lines written at the same moment belong to one cast: the catch
 * leads them, and its achievements share one line. Otherwise a catch that earned a level and three achievements fell
 * sixth, off every layout and out of the scene's hands (Barry, 2026-10-10: "it doesn't show logs of fish that I caught").
 */
export function deviceStories(stories: readonly PayloadStory[], tell: (summary: string) => string = (summary) => summary, combine: (count: number, names: string) => string = (count, names) => `${count} achievements: ${names}`): PayloadStory[] {
  const out: PayloadStory[] = []
  for (let start = 0; start < stories.length; ) {
    let end = start
    while (end < stories.length && stories[end]!.at === stories[start]!.at) end += 1
    const group = stories
      .slice(start, end)
      .map((story, index) => ({ story, index }))
      .sort((a, b) => (STORY_RANK[a.story.kind] ?? 3) - (STORY_RANK[b.story.kind] ?? 3) || a.index - b.index)
      .map(({ story }) => story)
    const earned = group.filter((story) => story.kind === 'achievement')
    for (const story of group) {
      if (story.kind !== 'achievement') out.push({ ...story, summary: tell(story.summary) })
      else if (story === earned[0]) {
        const names = earned.map((a) => a.title ?? a.summary.replace(/^Achievement: /, '').replace(/\.$/, ''))
        out.push(earned.length === 1 ? { ...story, summary: tell(story.summary) } : { kind: 'achievement', at: story.at, summary: combine(earned.length, names.join(', ')) })
      }
    }
    start = end
  }
  return out
}

export interface IdleAnglerPayloadInput {
  readonly content: IdleAnglerCatalog
  readonly now: number
  readonly world: { readonly lastCompletedAt?: number; readonly createdAt: number; readonly paused: boolean } | null
  /** Null when no angler is linked to this installation's account yet. */
  readonly angler: PayloadAngler | null
  readonly coolerUsed: number
  readonly weather: Weather
  readonly band: TimeBand
  readonly stories: readonly PayloadStory[]
  /** The Convex site origin that serves `/art/ia/`; null leaves image fields empty. */
  readonly artBaseUrl: string | null
  /** This week's heaviest fish at the angler's water (records.ts); null leaves the board off. */
  readonly board?: PayloadBoard | null
  /** D200: the owner's language for everything the screen says; English when absent. */
  readonly locale?: Locale
  /** D220: the other anglers at this water: up to three public names by species logged there, and how many in all. */
  readonly company?: { readonly names: readonly string[]; readonly others: number } | null
}

export interface PayloadBoard {
  /** The angler's rank when within the board's depth; null when not ranked or further down. */
  readonly rank: number | null
  readonly top: ReadonlyArray<{ readonly rank: number; readonly name: string; readonly grams: number; readonly own: boolean }>
  /** The angler's own heaviest fish this week at this water, for a row below the top; null before one. */
  readonly ownGrams?: number | null
}

/**
 * A board name short enough for the OG's columns (ten characters, then an ellipsis). The framework sizes the story list
 * (template v7) before its clamp pass trims names, and a long name that wrapped there left the stories too little room;
 * the X shows the full name, which fits.
 */
const shortName = (name: string) => (name.length > 10 ? `${name.slice(0, 9)}\u2026` : name)

const BAND_WORD: Readonly<Record<TimeBand, string>> = { dawn: 'dawn', day: 'day', dusk: 'dusk', night: 'night' }

export function buildPayload(input: IdleAnglerPayloadInput) {
  const { content, now, world, angler } = input
  const words = anglerWords(input.locale ?? 'en')
  const say = words.lang.device
  const formatWeight = words.weight
  const labels = say.labels
  const stale = world !== null && now - (world.lastCompletedAt ?? world.createdAt) > STALE_AFTER_MS
  const servicePaused = world?.paused ?? false
  const conditions = input.locale && input.locale !== 'en' ? `${words.band(input.band).toLowerCase()}, ${words.weather(input.weather).toLowerCase()}` : `${BAND_WORD[input.band]}, ${WEATHER_WORD[input.weather]}`
  if (angler === null || angler.activationState !== 'active') {
    return {
      v: PAYLOAD_VERSION,
      game: 'idle-angler' as const,
      data_state: servicePaused ? ('service_paused' as const) : ('unlinked' as const),
      status: angler === null ? ('unlinked' as const) : ('pending' as const),
      status_label: angler === null ? say.notSetUp : say.waitingForSave,
      alias: angler?.alias ?? null,
      attention: servicePaused ? say.maintenance : say.signIn,
      labels,
      qr: 'app' as const,
      qr_base: input.artBaseUrl && !servicePaused ? `${input.artBaseUrl}${qrBase('home')}` : '',
      // Template v15: the welcome shows the water a new angler starts at, quiet, at the hour's light and weather.
      scene_base: input.artBaseUrl ? `${input.artBaseUrl}${sceneBase({ water: angler?.waterId ?? content.waters[0]!.id, band: input.band, weather: input.weather, season: seasonAt(content, now) ?? null, pose: 'waiting', fish: null, fly: null })}` : '',
      stories: [] as Array<{ kind: string; summary: string; u: number }>,
      stale: false,
    }
  }
  const water = content.waters.find((w) => w.id === angler.waterId)!
  const rod = content.rods.find((r) => r.tier === angler.rodTier)!
  const cooler = content.coolers.find((c) => c.tier === angler.coolerTier)!
  const coolerFull = input.coolerUsed >= cooler.capacity
  const travelling = angler.travelTo !== undefined
  const destination = travelling ? content.waters.find((w) => w.id === angler.travelTo)! : null
  const hook = angler.baitOnHook ? content.baits.find((b) => b.class === angler.baitOnHook) : undefined
  const hookUnits = hook ? (angler.bait[hook.class] ?? 0) : 0
  const hookUsedHere = hook !== undefined && water.baits.includes(hook.class) && hookUnits > 0
  const statusLabel = angler.status === 'paused' ? say.paused : destination ? say.heading(words.waterName(destination.id)) : say.casting(words.waterName(water.id))
  let attention: string | null = null
  /** Which mark leads the attention line (template v2). */
  let attentionKind: 'service' | 'cooler' | 'bait' | 'goal' | null = null
  const waiting = angler.goalWaiting && angler.goalWaiting.count > 0 ? angler.goalWaiting : null
  if (angler.quarantined || servicePaused) [attention, attentionKind] = [say.serviceCheck, 'service']
  else if (stale) [attention, attentionKind] = [say.delayed, 'service']
  else if (coolerFull) [attention, attentionKind] = [say.coolerFull, 'cooler']
  else if (!hookUsedHere) [attention, attentionKind] = [hook && hookUnits === 0 ? say.outOf(words.bait(hook.class)) : say.bareHook, 'bait']
  // Issue #8: a waiting reward is the quietest call to the companion, so anything that stops the fishing goes first.
  else if (waiting) [attention, attentionKind] = [say.goalWaiting(waiting.count, waiting.coins), 'goal']
  const stories = deviceStories(input.stories.map((story) => (story.title ? { ...story, title: words.achievementName(story.title) } : story)), words.story, words.lang.tell.achievements).slice(0, MAX_STORIES)
  // Twelve-hour recap: fish landed (kept or released), the heaviest, and any that got away.
  const recent = input.stories.filter((story) => now - story.at <= RECAP_MS)
  const landed = recent.filter((story) => story.kind === 'catch' || story.kind === 'release')
  const best = landed.reduce<PayloadStory | null>((top, story) => (story.grams !== undefined && (top === null || story.grams > (top.grams ?? 0)) ? story : top), null)
  const gotAway = recent.filter((story) => story.kind === 'got_away').length
  const bestName = best?.speciesId && content.species.some((s) => s.id === best.speciesId) ? words.species(best.speciesId) : undefined
  const recapParts = [`${landed.length} ${landed.length === 1 ? 'fish' : 'fish'}`, ...(best && bestName && best.grams !== undefined ? [`best ${formatWeight(best.grams)} ${bestName}`] : []), ...(gotAway ? [`${gotAway} got away`] : [])]
  const recap = landed.length + gotAway > 0 ? `Last 12 hours: ${recapParts.join(', ')}` : null
  // The same facts one by one, each behind its mark on the device (template v2).
  const recapItems =
    recap === null
      ? null
      : [
          { k: 'catch', text: say.fish(landed.length) },
          ...(best && bestName && best.grams !== undefined ? [{ k: 'best', text: say.best(formatWeight(best.grams), bestName) }] : []),
          ...(gotAway ? [{ k: 'got_away', text: say.gotAway(gotAway) }] : []),
        ]
  const latest = stories[0]
  const latestCatch =
    latest && (latest.kind === 'catch' || latest.kind === 'release') && latest.speciesId
      ? { species_id: latest.speciesId, name: content.species.some((s) => s.id === latest.speciesId) ? words.species(latest.speciesId) : latest.speciesId, weight_label: latest.grams === undefined ? null : formatWeight(latest.grams) }
      : null
  // The newest fish landed among the stories shown, for the catch panel (template v2).
  const newest = stories.find((story) => (story.kind === 'catch' || story.kind === 'release') && story.speciesId !== undefined)
  const newestSpecies = newest ? content.species.find((s) => s.id === newest.speciesId) : undefined
  const newestCatch =
    newest && newestSpecies
      ? { name: words.species(newestSpecies.id), weight_label: newest.grams === undefined ? null : formatWeight(newest.grams), released: newest.kind === 'release', fish_base: input.artBaseUrl ? `${input.artBaseUrl}${fishBase(newestSpecies.id)}` : '' }
      : null
  // Standing (titles.ts): the title, and the ticks filled toward the next one by species logged. Under content v6 (D204)
  // the header shows the rank at the angler's water instead, the status line under it naming the water, and the ticks
  // count that water's species, so the next step is a few fish away rather than ten.
  const standing = (() => {
    if (content.waterRanks && angler.speciesHere !== undefined) {
      const here = angler.speciesHere
      const total = content.species.filter((s) => s.water === water.id).length
      const { rank, next } = waterRankAt(here, total)
      const from = rankThreshold(rank, total)
      return { name: words.lang.waterRanks[rank.id] ?? rank.name, logged: here, nextAt: next?.species ?? null, pct: next ? Math.floor(((here - from) * 100) / (next.species - from)) : 100 }
    }
    const title = titleFor(angler.speciesLogged)
    const next = nextTitle(angler.speciesLogged)
    return { name: words.title(title.id), logged: angler.speciesLogged, nextAt: next?.species ?? null, pct: next ? Math.floor(((angler.speciesLogged - title.species) * 100) / (next.species - title.species)) : 100 }
  })()
  const status = angler.status === 'paused' ? ('paused' as const) : travelling ? ('travelling' as const) : ('fishing' as const)
  const pose = poseFor(status, latest?.kind ?? null)
  // D162: under content v2 the world's season dresses the scene; v1 scenes carry none.
  const season = seasonAt(content, now) ?? null
  const scene = sceneBase({ water: (destination ?? water).id, band: input.band, weather: input.weather, season, pose, fish: latestCatch?.species_id ?? null, fly: angler.fly ?? null })
  return {
    v: PAYLOAD_VERSION,
    game: 'idle-angler' as const,
    data_state: angler.quarantined || servicePaused ? ('service_paused' as const) : ('ready' as const),
    status,
    status_label: statusLabel,
    conditions_label: conditions,
    // D200: the time of day and weather as the screen labels them; the template falls back to the ids, capitalised.
    band_label: words.band(input.band),
    weather_label: words.weather(input.weather),
    labels,
    season,
    goal_line: angler.goal ? words.goal(angler.goal) : null,
    // D220: who else fishes this water, behind the people mark; only while casting here, not heading elsewhere or paused.
    company: status === 'fishing' && input.company && input.company.others > 0 ? say.company(input.company.names, input.company.others) : null,
    // Issue #8: the X's goal row shows the waiting coins instead of the next goal until they are claimed.
    goal_claim: waiting ? { ...waiting, label: say.goalWaiting(waiting.count, waiting.coins) } : null,
    weather: input.weather,
    band: input.band,
    alias: angler.alias,
    title: standing.name,
    title_pct: standing.pct,
    title_next_at: standing.nextAt,
    // D204: what the ticks count, the species at this water under v6 and the whole logbook before.
    title_logged: standing.logged,
    gold: angler.gold,
    water_id: water.id,
    water_name: words.water(water.id),
    rod_name: words.rod(rod.name),
    cooler_used: input.coolerUsed,
    cooler_capacity: cooler.capacity,
    cooler_full: coolerFull,
    cooler_label: `${input.coolerUsed}/${cooler.capacity}`,
    bait_label: hookUsedHere ? `${words.bait(hook!.class)} ${hookUnits}` : words.lang.bareHook.name,
    bait_name: hookUsedHere ? words.bait(hook!.class) : words.lang.bareHook.name,
    bait_count: hookUsedHere ? hookUnits : null,
    species_logged: angler.speciesLogged,
    species_total: content.species.length,
    // Template v15: each story's moment in unix seconds; the screen shows it as the owner's clock time (`utc_offset`).
    stories: stories.map((s) => ({ kind: s.kind, summary: s.summary, u: Math.floor(s.at / 1000) })),
    recap,
    recap_items: recapItems,
    // This week's heaviest fish at this water: the first rows, then the angler's own when it is further down.
    board: input.board
      ? {
          label: say.thisWeek,
          rank_label: input.board.ownGrams == null ? say.noFishYet : input.board.rank === null ? say.yourBest(formatWeight(input.board.ownGrams)) : say.rankBest(input.board.rank, formatWeight(input.board.ownGrams)),
          rows: [
            ...input.board.top.map((row) => ({ rank: row.rank, name: row.name, name_short: shortName(row.name), weight_label: formatWeight(row.grams), own: row.own })),
            ...(input.board.rank !== null && input.board.ownGrams != null && !input.board.top.some((row) => row.own) ? [{ rank: input.board.rank, name: angler.alias, name_short: shortName(angler.alias), weight_label: formatWeight(input.board.ownGrams), own: true }] : []),
          ],
        }
      : null,
    latest_catch: latestCatch,
    newest_catch: newestCatch,
    attention,
    attention_kind: attentionKind,
    // A full cooler sends the code to the cooler page; otherwise to the dock.
    qr: coolerFull ? ('cooler' as const) : ('app' as const),
    qr_base: input.artBaseUrl ? `${input.artBaseUrl}${qrBase(coolerFull ? 'cooler' : 'home')}` : '',
    qr_label: coolerFull ? 'Sell your catch' : 'Your dock',
    scene_base: input.artBaseUrl ? `${input.artBaseUrl}${scene}` : '',
    stale,
  }
}

export type IdleAnglerPayload = ReturnType<typeof buildPayload>
