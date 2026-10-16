import { v } from 'convex/values'
import { contentV1, contentV2 } from '@trmnl-games/paper-lives/content'
import {
  beginChild,
  choose as chooseOption,
  decisionOf,
  familyLabel,
  fill,
  livingCost,
  optionOpen,
  pause as pauseLife,
  rename as renameLife,
  requestAgeUp,
  resume as resumeLife,
  seasonAt,
  setPronouns as setLifePronouns,
  simulateLife,
  PaperLivesInvariantError,
  slotsFor,
  starterLife,
  yearlyIncome,
  type ActionResult,
  type LifeRecord,
  type LifeState,
  type PaperLivesCatalog,
} from '@trmnl-games/paper-lives/sim'
import { deriveLifeSeeds } from '@trmnl-games/paper-lives/sim/seed'
import { portraitKey } from '@trmnl-games/paper-lives/art/route'
import type { Doc } from '../_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'
import { pagePublic } from '../lib/publicPage'
import { currentUser, intentReturns, isIntentRefusal, runIntent, type IntentRefusal, type IntentResult } from '../lib/intent'
import { HERO_NAME_RULE, validateName } from '../lib/names'
import { readEngineWorld } from '../lib/engine/world'
import { fromLifeState, toLifeState } from './adapter'
import { applyStep } from './tick'
import { currentLife, paperLivesProfile } from './profile'
import { recordOf } from './records'
import { awardLife } from './achievements'
import { PAPER_LIVES_RUNTIME, PAPER_LIVES_SCHEDULE } from './runtime'
import { pronouns } from './validators'

/**
 * Paper Lives companion API (paper-lives.md "Decisions" and "Architecture"). Every change is a receipted,
 * rate-limited intent on the owner's own current life; the rules come from the pure core's actions so the
 * companion, the harness and the tick agree.
 */

const TICK_MS = 15 * 60_000

async function worldContentOf(ctx: QueryCtx): Promise<{ world: Doc<'worldState'> | null; content: PaperLivesCatalog }> {
  const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
  return { world, content: (world && PAPER_LIVES_RUNTIME.content(world.activeContentVersion)) ?? contentV1 }
}

/** Intents need an activated, healthy life. */
async function playableLife(ctx: QueryCtx, user: Doc<'users'>): Promise<Doc<'lives'>> {
  const life = await currentLife(ctx, user)
  if (life === null) throw appError('HERO_NOT_FOUND', 'No life yet.')
  if (life.activationState !== 'active') throw appError('TRMNL_REQUIRED', 'Save Paper Lives in TRMNL to start the first year.')
  if (life.simulationState === 'quarantined') throw appError('SERVICE_PAUSED', 'This life is paused for a service check.')
  return life
}

async function commandLog(ctx: MutationCtx, life: Doc<'lives'>, state: LifeState, summary: string): Promise<number> {
  const sequence = life.logSequence + 1
  await ctx.db.insert('plTickLogs', { lifeId: life._id, ordinal: life.ordinal, source: 'command', sequence, at: Date.now(), kind: 'system', glyph: 'none', age: state.age, summary: summary.slice(0, 90) })
  return sequence
}

/** JSON with sorted keys, so two equal states compare equal whatever order their fields were written in. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))) : v))
}

/** Apply a pure action to the current life, optionally with a command log line. */
async function applyAction(ctx: MutationCtx, life: Doc<'lives'>, result: ActionResult, summary?: string): Promise<IntentResult> {
  if (!result.ok) throw appError('INVALID_STATE', result.reason)
  const stored = fromLifeState(result.life)
  if (stable(stored) === stable(life.life)) return { changed: false }
  const patch: Partial<Doc<'lives'>> = { life: stored }
  if (summary) patch.logSequence = await commandLog(ctx, life, result.life, summary)
  await ctx.db.patch(life._id, patch)
  return { changed: true }
}

function lifeIntent(operation: string, act: (ctx: MutationCtx, life: Doc<'lives'>, content: PaperLivesCatalog, input: Record<string, unknown>) => Promise<IntentResult>) {
  return async (ctx: MutationCtx, operationId: string, input: Record<string, unknown>) =>
    await runIntent(ctx, operationId, operation, input, async (user) => {
      const life = await playableLife(ctx, user)
      const { content } = await worldContentOf(ctx)
      return await act(ctx, life, content, input)
    })
}

const intentResult = intentReturns({ operationId: v.string(), changed: v.boolean() })
const strip = (r: (IntentResult & { operationId: string }) | IntentRefusal) => (isIntentRefusal(r) ? r : { operationId: r.operationId, changed: r.changed })

/** Choose an option for the open decision; it resolves when the year ends. Choosing again replaces it. */
export const choose = mutation({
  args: { operationId: v.string(), decisionId: v.string(), optionId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId, decisionId, optionId }) =>
    strip(await lifeIntent('paperLives.choose', async (ctx, life, content, i) => await applyAction(ctx, life, chooseOption(toLifeState(life), content, i.decisionId as string, i.optionId as string)))(ctx, operationId, { decisionId, optionId })),
})

/**
 * Age up. Once the year's minimum has passed (or passes at the next tick), the year ends now: the boundary runs here
 * with the scheduled tick's own step and seeds of its own, so the new age, the recap and the next decision appear
 * at once. Before that it queues, and the year ends at the first tick on or after the minimum. A quarantined life only
 * queues, so the tick's guard still sees it.
 */
export const ageUp = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) =>
    strip(
      await lifeIntent('paperLives.ageUp', async (ctx, life, content) => {
        const queued = requestAgeUp(toLifeState(life))
        if (!queued.ok) throw appError('INVALID_STATE', queued.reason)
        const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
        const ready = queued.life.year.elapsed + 1 >= content.tuning.minYearTicks
        if (!ready || world === null || life.simulationState === 'quarantined') return await applyAction(ctx, life, queued)
        const owner = await ctx.db.get(life.userId)
        if (owner === null) throw appError('INVALID_STATE', 'This life has no owner.')
        const streams = deriveLifeSeeds(world.worldSeed, `${life._id}:ageup`, world.currentTick, PAPER_LIVES_RUNTIME.simulationVersion)
        let result
        try {
          result = simulateLife({ life: queued.life, content, streams })
        } catch (error) {
          // A broken life is the tick's to quarantine; here the request simply queues.
          if (error instanceof PaperLivesInvariantError) return await applyAction(ctx, life, queued)
          throw error
        }
        await applyStep(ctx, life, owner, result, content, { tick: world.currentTick }, Date.now())
        return { changed: true }
      })(ctx, operationId, {}),
    ),
})

/** Change the first name, in the first year only, under the hero-name rules. */
export const rename = mutation({
  args: { operationId: v.string(), first: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId, first }) => {
    const name = validateName(first, HERO_NAME_RULE)
    if (!name.ok) throw appError('INVALID_INPUT', `First name: ${name.reason}`)
    return strip(await lifeIntent('paperLives.rename', async (ctx, life, _c, i) => await applyAction(ctx, life, renameLife(toLifeState(life), i.first as string), `Named ${i.first as string}.`))(ctx, operationId, { first: name.value }))
  },
})

export const setPronouns = mutation({
  args: { operationId: v.string(), pronouns },
  returns: intentResult,
  handler: async (ctx, { operationId, pronouns: chosen }) => strip(await lifeIntent('paperLives.setPronouns', async (ctx, life, _c, i) => await applyAction(ctx, life, setLifePronouns(toLifeState(life), i.pronouns as LifeState['pronouns'])))(ctx, operationId, { pronouns: chosen })),
})

export const pause = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) => strip(await lifeIntent('paperLives.pause', async (ctx, life) => (life.life.status === 'paused' ? { changed: false } : await applyAction(ctx, life, pauseLife(toLifeState(life)), 'Life paused.')))(ctx, operationId, {})),
})

export const resume = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) =>
    strip(
      await lifeIntent('paperLives.resume', async (ctx, life) => {
        if (life.life.status === 'living') return { changed: false }
        const result = await applyAction(ctx, life, resumeLife(toLifeState(life)), 'Life resumed.')
        // No catch-up: the next tick is the first that counts.
        const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
        await ctx.db.patch(life._id, { lastTick: Math.max(life.lastTick, world?.currentTick ?? 0) })
        return result
      })(ctx, operationId, {}),
    ),
})

export const setPublicProfile = mutation({
  args: { operationId: v.string(), visible: v.boolean() },
  returns: intentResult,
  handler: async (ctx, { operationId, visible }) =>
    strip(
      await lifeIntent('paperLives.setPublicProfile', async (ctx, life, _c, i) => {
        if (pagePublic(life) === i.visible) return { changed: false }
        await ctx.db.patch(life._id, { publicProfile: i.visible as boolean })
        return { changed: true }
      })(ctx, operationId, { visible }),
    ),
})

/** The stored record as the core's record type. */
export function toLifeRecord(record: Doc<'lifeRecords'>): LifeRecord {
  const { _id: _i, _creationTime: _c, userId: _u, lifeId: _l, ordinal: _o, parentRecordId: _p, endedAt: _e, continuedBy: _b, traits, ...rest } = record
  return { ...rest, traits: [traits[0]!, traits[1]!] } as LifeRecord
}

/**
 * Begin the next life after a death (paper-lives.md "The will, death and the next life"): one of the deceased's
 * living children, who keeps the surname and the inheritance, or a stranger at birth. The life row is replaced in
 * place, so the profile pointer never changes; the ordinal counts the account's lives.
 */
export const begin = mutation({
  args: { operationId: v.string(), kind: v.union(v.literal('child'), v.literal('stranger')), personId: v.optional(v.string()) },
  returns: intentResult,
  handler: async (ctx, { operationId, kind, personId }) =>
    strip(
      await lifeIntent('paperLives.begin', async (ctx, life, content, i) => {
        if (life.life.status !== 'ended') throw appError('INVALID_STATE', 'This life is still being lived.')
        const record = await recordOf(ctx, life.userId, life.ordinal)
        if (record === null) throw appError('INVALID_STATE', 'This life is still being written. Try again shortly.')
        const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
        const seed = deriveLifeSeeds(world?.worldSeed ?? 'world', `${life._id}:${life.ordinal + 1}`, world?.currentTick ?? 0, PAPER_LIVES_RUNTIME.simulationVersion).birth
        let next
        if (i.kind === 'child') {
          const children = record.heirs.filter((h) => h.role === 'child')
          // The oldest by default, or the player's choice.
          const heir = i.personId === undefined ? [...children].sort((a, b) => b.age - a.age)[0] : children.find((h) => h.id === i.personId)
          if (!heir) throw appError('INVALID_INPUT', 'That child cannot take up the story.')
          next = beginChild(toLifeRecord(record), heir.id, content, seed)
        } else {
          next = starterLife(content, seed)
        }
        const now = Date.now()
        const ordinal = life.ordinal + 1
        const sequence = life.logSequence + 1
        await ctx.db.patch(life._id, {
          life: fromLifeState(next.life),
          ordinal,
          logSequence: sequence,
          eligibleFromTick: (world?.currentTick ?? 0) + 1,
          lastTick: world?.currentTick ?? 0,
          lastProgressTick: world?.currentTick ?? 0,
        })
        await ctx.db.patch(record._id, { continuedBy: i.kind as 'child' | 'stranger' })
        await ctx.db.insert('plTickLogs', { lifeId: life._id, ordinal, source: 'lifecycle', sequence, at: now, kind: 'system', glyph: 'pram', age: next.life.age, summary: next.firstLog })
        // A child's life can already meet a goal: a second generation, children of their own.
        await awardLife(ctx, life._id, now, world?.currentTick ?? 0)
        return { changed: true }
      })(ctx, operationId, { kind, ...(personId === undefined ? {} : { personId }) }),
    ),
})

/** When the year closes by itself and when its minimum passes, from the next tick slot. */
export function yearTimes(life: LifeState, content: PaperLivesCatalog, now: number) {
  const next = PAPER_LIVES_SCHEDULE.nextSlotAfter(now)
  const at = (ticksFromNow: number) => next + Math.max(0, ticksFromNow - 1) * TICK_MS
  return { minimumAt: at(content.tuning.minYearTicks - life.year.elapsed), closesAt: at(content.tuning.closeYearTicks - life.year.elapsed) }
}

/**
 * The signed-in owner's Life page: the character, the year card with its decision, the recent story, the people,
 * work and money, and the memorial with its heirs once the life has ended. Fixed bounded reads (the life, at most 40
 * logs, the record, the world). Null when signed out or before the life exists.
 */
export const view = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const profile = user ? await paperLivesProfile(ctx, user._id) : null
    const doc = await currentLife(ctx, user)
    if (user === null || doc === null) return { gameState: profile?.state ?? null, life: null }
    const { world, content } = await worldContentOf(ctx)
    const now = Date.now()
    const life = toLifeState(doc)
    const slots = slotsFor(life, content)
    const pending = life.year.pending
    const def = pending ? decisionOf(content, pending.decisionId) : null
    const person = pending?.personId ? life.people.find((p) => p.id === pending.personId) : undefined
    const filled = (text: string) => fill(text, life.pronouns, { ...slots, ...(person ? { person: person.name } : {}) })
    const logs = await ctx.db.query('plTickLogs').withIndex('by_lifeId_and_at_and_sequence', (q) => q.eq('lifeId', doc._id)).order('desc').take(40)
    const record = life.status === 'ended' ? await recordOf(ctx, doc.userId, doc.ordinal) : null
    const job = life.job ? content.jobs.find((j) => j.id === life.job) : undefined
    const { season, yearEnd } = seasonAt(Math.max(1, life.year.elapsed), content.tuning.minYearTicks)
    return {
      gameState: profile?.state ?? 'active',
      life: {
        id: doc._id,
        ordinal: doc.ordinal,
        activationState: doc.activationState,
        status: life.status,
        first: life.first,
        last: life.last,
        pronouns: life.pronouns,
        canRename: life.counters.yearsLived === 0,
        generation: life.generation,
        age: life.age,
        stage: life.stage,
        traits: life.traits.map((id) => ({ id, name: content.traits.find((t) => t.id === id)?.name ?? id, blurb: content.traits.find((t) => t.id === id)?.blurb ?? '' })),
        stats: life.stats,
        gold: life.gold,
        publicProfile: pagePublic(doc),
        recap: life.recap ?? null,
        // How the device draws the life; the companion draws the same portrait.
        portrait: portraitKey(life),
      },
      year:
        life.status === 'ended' || life.stage === 'infant'
          ? null
          : {
              elapsed: life.year.elapsed,
              minimum: content.tuning.minYearTicks,
              close: content.tuning.closeYearTicks,
              season,
              yearEnd,
              ageUpRequested: life.year.ageUpRequested,
              ...yearTimes(life, content, now),
              decision: def && pending
                ? {
                    id: def.id,
                    prompt: filled(def.prompt),
                    major: def.major,
                    chosen: pending.chosen ?? null,
                    default: def.default,
                    options: def.options.map((o) => ({ id: o.id, label: filled(o.label), open: optionOpen(life, o), reason: optionOpen(life, o) ? null : (o.gateReason ?? 'Not open to this life.') })),
                  }
                : null,
            },
      // Labels read v2's name lists whatever catalog the world runs, so a v1 life still shows mother and father.
      people: life.people.map((p) => ({ id: p.id, name: p.name, role: p.role, label: familyLabel(p, contentV2), age: life.age - p.bornAt, relationship: p.relationship, alive: p.alive, step: p.step ?? null, history: p.history })),
      pet: life.pet ? { name: life.pet.name, kind: content.pets.find((k) => k.id === life.pet!.kind)?.name ?? life.pet.kind, age: life.age - life.pet.bornAt, relationship: life.pet.relationship } : null,
      work: {
        education: life.education,
        job: job ? { id: job.id, name: job.name, tier: job.tier, since: life.jobSince ?? null } : null,
        retired: life.retired,
        income: yearlyIncome(life, content),
        livingCost: livingCost(life, content),
        home: life.home,
        house: life.house !== undefined ? (content.houses.find((h) => h.band === life.house)?.name ?? null) : null,
        will: life.will ?? null,
        hobby: life.hobby ? (content.hobbies.find((h) => h.id === life.hobby)?.name ?? life.hobby) : null,
      },
      memorial:
        life.status === 'ended'
          ? {
              line: life.death?.line ?? null,
              epitaph: life.death?.epitaph ?? null,
              recorded: record !== null,
              heirs: (record?.heirs ?? []).filter((h) => h.role === 'child').map((h) => ({ id: h.id, name: h.name, age: h.age })),
            }
          : null,
      logs: logs.filter((l) => l.ordinal === doc.ordinal).map((l) => ({ id: l._id, at: l.at, kind: l.kind, glyph: l.glyph, age: l.age, summary: l.summary, remarkable: l.remarkable === true, major: l.major === true, changes: l.changes ?? null })),
      nextTickAt: PAPER_LIVES_SCHEDULE.nextSlotAfter(now),
      worldTick: world?.currentTick ?? 0,
    }
  },
})
