import { currentHero, gameProfile } from './lib/gameProfile'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { appError } from './lib/errors'
import { isAdminReader, requireAdmin } from './lib/adminAccess'
import { sha256Hex } from './lib/hash'
import { normalizeAlias } from './lib/names'
import { openedCompanion } from './heroReminder'
import { getOrCreateWorld, readWorld, worldContent } from './world'
import { heroMaxHp } from '@trmnl-games/desk-crawler/sim/core/stats'

/**
 * Owner-run support and moderation (D23). Admin authority comes only from the
 * server-side ADMIN_TOKEN_IDENTIFIERS allowlist, never from client data. Every
 * action is audited with a reason; none resets progress.
 */

export async function audit(ctx: MutationCtx, actorRef: string, action: string, targetRef: string, reasonCode: string, outcome: string) {
  await ctx.db.insert('adminAuditEvents', { actorRef, action, targetRef, reasonCode: reasonCode.slice(0, 64), outcome: outcome.slice(0, 120), at: Date.now() })
}

const reason = v.string()

export const isAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    try {
      await requireAdmin(ctx)
      return true
    } catch {
      return false
    }
  },
})

export const health = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    if (!(await isAdminReader(ctx))) return null
    const world = await readWorld(ctx)
    const activeRun = world?.activeRunId ? await ctx.db.get(world.activeRunId) : null
    const quarantined = await ctx.db.query('heroes').withIndex('by_simulationState', (q) => q.eq('simulationState', 'quarantined')).take(50)
    const openIncidents = await ctx.db.query('operationalIncidents').withIndex('by_state_and_openedAt', (q) => q.eq('state', 'open')).take(20)
    const blockedDeletions = await ctx.db.query('accountDeletionJobs').withIndex('by_state_and_lastProgressAt', (q) => q.eq('state', 'blocked')).take(20)
    const recentAudit = await ctx.db.query('adminAuditEvents').withIndex('by_at').order('desc').take(20)
    return {
      world: world && { currentTick: world.currentTick, lastCompletedTick: world.lastCompletedTick ?? null, lastCompletedAt: world.lastCompletedAt ?? null, lastPublishedAt: world.lastPublishedAt ?? null, ticksPaused: world.ticksPaused },
      activeRun: activeRun && { id: activeRun._id, tick: activeRun.tick, state: activeRun.state, lastProgressAt: activeRun.lastProgressAt, failureCode: activeRun.failureCode ?? null, recoveryAttempts: activeRun.recoveryAttempts },
      quarantined: quarantined.map((h) => ({ id: h._id, name: h.name, reasonCode: h.quarantineReasonCode ?? null })),
      openIncidents: openIncidents.map((i) => ({ id: i._id, openedAt: i.openedAt, alert: i.alert.state })),
      blockedDeletions: blockedDeletions.map((j) => ({ id: j._id, phase: j.phase, reasonCode: j.reasonCode ?? null })),
      recentAudit: recentAudit.map((a) => ({ at: a.at, action: a.action, targetRef: a.targetRef, reasonCode: a.reasonCode, outcome: a.outcome })),
    }
  },
})

const ENGAGEMENT_SCAN = 5000
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Operator view of v1.1 engagement for every active hero, consent or not:
 * `npx convex run --prod admin:engagement`. Reads lifetime counters only (no
 * logs); stops at 5,000 heroes and says so with `truncated`. A copy is kept each day (`engagementSnapshots`) so trends
 * and week-by-week retention can be read back with `admin:engagementHistory`.
 */
export const engagement = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await engagementReport(ctx, Date.now())
  },
})

/** The Monday (UTC) of the week a hero started, for the retention cohorts. */
const weekOf = (hero: Doc<'heroes'>) => {
  const start = new Date(hero.activatedAt ?? hero.createdAt)
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
  return start.toISOString().slice(0, 10)
}

async function engagementReport(ctx: QueryCtx, now: number) {
  const scanned = await ctx.db.query('heroes').withIndex('by_createdAt').take(ENGAGEMENT_SCAN)
  const heroes = scanned.filter((h) => h.isActive && h.activationState === 'active')
  const tally = (values: (string | number)[]) => values.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }), {})
  const sum = (pick: (c: Doc<'heroes'>['counters']) => number | undefined) => heroes.reduce((total, h) => total + (pick(h.counters) ?? 0), 0)
  const reached = (pick: (c: Doc<'heroes'>['counters']) => number | undefined) => heroes.filter((h) => (pick(h.counters) ?? 0) > 0).length
  // D213: a visit belongs to the owner, across every hero they have (parked ones too), and counts companion-only actions
  // when no recap was recorded; those carry no time, so the 1- and 7-day windows read recorded recaps only.
  const owners = new Map<string, { opened: boolean; lastVisit: number | undefined }>()
  for (const h of scanned) {
    const owner = owners.get(h.userId) ?? { opened: false, lastVisit: undefined }
    const at = h.companionVisitBaseline?.at
    owners.set(h.userId, { opened: owner.opened || openedCompanion(h), lastVisit: at === undefined ? owner.lastVisit : Math.max(at, owner.lastVisit ?? 0) })
  }
  const visited = (h: Doc<'heroes'>) => owners.get(h.userId)?.opened ?? false
  const visitedIn = (h: Doc<'heroes'>, days: number) => { const at = owners.get(h.userId)?.lastVisit; return at !== undefined && now - at <= days * DAY_MS }
  const visitedWithin = (days: number) => heroes.filter((h) => visitedIn(h, days)).length
  const users = await ctx.db.query('users').withIndex('by_state', (q) => q.eq('state', 'active')).take(ENGAGEMENT_SCAN)
  const localeOf = new Map(users.flatMap((u) => (u.trmnlLocale === undefined ? [] : [[u._id, u.trmnlLocale] as const])))
  return {
    truncated: scanned.length === ENGAGEMENT_SCAN,
    activeHeroes: heroes.length,
    companionVisits: { within1Day: visitedWithin(1), within7Days: visitedWithin(7), never: heroes.filter((h) => !visited(h)).length },
    stances: tally(heroes.map((h) => h.stance ?? 'balanced')),
    stanceChanges: { total: sum((c) => c.stanceChanges), heroes: reached((c) => c.stanceChanges) },
    choices: { made: sum((c) => c.choicesMade), defaulted: sum((c) => c.choicesDefaulted), heroesWhoChose: reached((c) => c.choicesMade), pending: heroes.filter((h) => h.choice).length },
    merchant: { visits: sum((c) => c.merchantVisits), purchases: sum((c) => c.purchases), heroesMet: reached((c) => c.merchantVisits), heroesBought: reached((c) => c.purchases), open: heroes.filter((h) => h.merchant).length },
    bagCapacity: tally(heroes.map((h) => h.bagCapacity)),
    potionCap: tally(heroes.map((h) => h.potionCap ?? 'default')),
    epicFinds: { total: sum((c) => c.epicFinds), heroes: reached((c) => c.epicFinds) },
    // D110: raids from both sides; launched minus won is failed raids.
    raids: { launched: sum((c) => c.raidsLaunched), won: sum((c) => c.raidsWon), repelled: sum((c) => c.raidsRepelled), lost: sum((c) => c.raidsLost), heroesRaiding: reached((c) => c.raidsLaunched), heroesRaided: heroes.filter((h) => (h.counters.raidsRepelled ?? 0) + (h.counters.raidsLost ?? 0) > 0).length },
    // D112: to-do tasks ticked off, and how many heroes have finished one.
    tasks: { completed: sum((c) => c.tasksCompleted), heroes: reached((c) => c.tasksCompleted) },
    // P35: career rungs reached under the ladder, equips, and where heroes stand on it.
    career: { rungs: sum((c) => c.careerRungs), heroes: reached((c) => c.careerRungs), equips: sum((c) => c.itemsEquipped), standing: tally(heroes.map((h) => h.career?.rung ?? 'none')) },
    // D139: occasions announced to heroes, Friday the 13th mishaps, and the last occurrence each hero saw.
    occasions: { seen: sum((c) => c.occasionsSeen), heroes: reached((c) => c.occasionsSeen), mishaps: sum((c) => c.raidMishaps), heroesInAMishap: reached((c) => c.raidMishaps), lastSeen: tally(heroes.map((h) => h.occasion?.key ?? 'none')) },
    // D141: meetings from either side (each meeting counts once per hero), and how many heroes have met someone.
    meetings: { sides: sum((c) => c.meetings), heroes: reached((c) => c.meetings) },
    // D145: other players' spares found, and how many heroes have found one.
    lostProperty: { found: sum((c) => c.lostPropertyFound), heroes: reached((c) => c.lostPropertyFound) },
    // D163: dug-in elites beaten, how many heroes have beaten one, and how many are dug in now.
    standoffs: { won: sum((c) => c.standoffsWon), heroes: reached((c) => c.standoffsWon), open: heroes.filter((h) => h.standoff).length },
    analyticsConsent: tally(users.map((u) => (u.analyticsConsent === undefined ? 'unset' : u.analyticsConsent ? 'allowed' : 'declined'))),
    // D168: the TRMNL locale of each active hero's owner, from screen requests; `unknown` until their screen next refreshes.
    locales: tally(heroes.map((h) => localeOf.get(h.userId) ?? 'unknown')),
    // Each activation week's heroes, how many have ever opened the companion and how many did in the last 7 days.
    retention: Object.fromEntries([...new Set(heroes.map(weekOf))].sort().map((week) => {
      const cohort = heroes.filter((h) => weekOf(h) === week)
      return [week, { heroes: cohort.length, visitedEver: cohort.filter(visited).length, visited7Days: cohort.filter((h) => visitedIn(h, 7)).length }]
    })),
  }
}

/** Daily, just before midnight UTC: keep that day's engagement report (aggregates only, no player data). */
export const snapshotEngagement = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now()
    const day = new Date(now).toISOString().slice(0, 10)
    const report = await engagementReport(ctx, now)
    const existing = await ctx.db.query('engagementSnapshots').withIndex('by_day', (q) => q.eq('day', day)).unique()
    if (existing) await ctx.db.replace('engagementSnapshots', existing._id, { day, at: now, report })
    else await ctx.db.insert('engagementSnapshots', { day, at: now, report })
    return null
  },
})

/**
 * The kept reports, newest first, as one trend line per day plus the latest retention table:
 * `npx convex run --prod admin:engagementHistory '{"days":14}'`.
 */
export const engagementHistory = internalQuery({
  args: { days: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, { days = 14 }) => {
    const rows = await ctx.db.query('engagementSnapshots').withIndex('by_day').order('desc').take(Math.max(1, Math.min(days, 366)))
    return {
      days: rows.map(({ day, report }) => ({
        day,
        heroes: report.activeHeroes,
        visited1Day: report.companionVisits.within1Day,
        visited7Days: report.companionVisits.within7Days,
        neverVisited: report.companionVisits.never,
        careerRungs: report.career.rungs,
        tasks: report.tasks.completed,
        raids: report.raids.launched,
      })),
      retention: rows[0]?.report.retention ?? null,
    }
  },
})

export const findUser = query({
  args: { alias: v.string() },
  returns: v.any(),
  handler: async (ctx, { alias }) => {
    if (!(await isAdminReader(ctx))) return null
    const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', normalizeAlias(alias))).first()
    if (user === null) return null
    const hero = await currentHero(ctx, user)
    return { id: user._id, alias: user.publicAlias, state: user.state, nameRepairRequired: user.nameRepairRequired ?? false, heroName: hero?.name ?? null, heroId: hero?._id ?? null, quarantined: hero?.simulationState === 'quarantined' }
  },
})

/** Mask a reported name at once with a safe temporary alias/hero name; the owner chooses a replacement. */
export const repairPublicNames = mutation({
  args: { userId: v.id('users'), reasonCode: reason },
  returns: v.null(),
  handler: async (ctx, { userId, reasonCode }) => {
    const actor = await requireAdmin(ctx)
    const user = await ctx.db.get(userId)
    if (user === null) throw appError('ACCOUNT_UNAVAILABLE', 'User not found.')
    const suffix = sha256Hex(`${userId}:${user.publicNameVersion}`).slice(0, 5)
    const temporary = `Adventurer-${suffix}`
    await ctx.db.patch(userId, { publicAlias: temporary, normalizedAlias: normalizeAlias(temporary), publicNameVersion: user.publicNameVersion + 1, nameRepairRequired: true })
    const hero = await currentHero(ctx, user)
    if (hero) await ctx.db.patch(hero._id, { name: 'Hero' })
    await audit(ctx, actor, 'repair_public_names', userId, reasonCode, temporary)
    return null
  },
})

export const setSuspended = mutation({
  args: { userId: v.id('users'), suspended: v.boolean(), reasonCode: reason },
  returns: v.null(),
  handler: async (ctx, { userId, suspended, reasonCode }) => {
    const actor = await requireAdmin(ctx)
    const user = await ctx.db.get(userId)
    if (user === null || user.state === 'deleting') throw appError('ACCOUNT_UNAVAILABLE', 'User not available.')
    await ctx.db.patch(userId, { state: suspended ? 'suspended' : 'active' })
    await audit(ctx, actor, suspended ? 'suspend' : 'restore', userId, reasonCode, suspended ? 'suspended' : 'active')
    return null
  },
})

/**
 * Release a quarantined hero after diagnosis; no retroactive catch-up (simulation.md). The one repair it makes is to
 * bring HP back under the hero's maximum for its level and class, the state behind the only quarantine so far
 * (2026-10-26, a Rogue healed to the Warrior ceiling by a decision); a hero released above its ceiling would be
 * quarantined again on the next tick. The audit outcome names the repair.
 */
async function releaseQuarantinedHero(ctx: MutationCtx, actor: string, heroId: Id<'heroes'>, reasonCode: string): Promise<string> {
  const hero = await ctx.db.get(heroId)
  if (hero === null || hero.simulationState !== 'quarantined') throw appError('INVALID_STATE', 'Hero is not quarantined.')
  const world = await getOrCreateWorld(ctx)
  const max = heroMaxHp(worldContent(world), hero)
  const repaired = hero.hp > max
  await ctx.db.patch(heroId, { simulationState: 'healthy', quarantineReasonCode: undefined, ...(repaired ? { hp: max } : {}) })
  const outcome = repaired ? `healthy, hp ${hero.hp} to ${max}` : 'healthy'
  await audit(ctx, actor, 'release_hero', heroId, reasonCode, outcome)
  return outcome
}

export const releaseHero = mutation({
  args: { heroId: v.id('heroes'), reasonCode: reason },
  returns: v.null(),
  handler: async (ctx, { heroId, reasonCode }) => {
    const actor = await requireAdmin(ctx)
    await releaseQuarantinedHero(ctx, actor, heroId, reasonCode)
    return null
  },
})

/** The same release from the terminal: `npx convex run --prod admin:releaseHeroFromCli '{"heroId":"...","reasonCode":"..."}'`. */
export const releaseHeroFromCli = internalMutation({
  args: { heroId: v.id('heroes'), reasonCode: reason },
  returns: v.object({ outcome: v.string() }),
  handler: async (ctx, { heroId, reasonCode }) => ({ outcome: await releaseQuarantinedHero(ctx, 'cli', heroId, reasonCode) }),
})

/**
 * Stop or restart new Desk Crawler tick starts (operations.md "Content releases"); Idle Angler has its own in
 * idleAngler/operations.ts. `npx convex run --prod admin:setTicksPaused '{"paused":true}'`.
 */
export const setTicksPaused = internalMutation({
  args: { paused: v.boolean() },
  returns: v.object({ paused: v.boolean() }),
  handler: async (ctx, { paused }) => {
    const world = await getOrCreateWorld(ctx)
    await ctx.db.patch(world._id, { ticksPaused: paused })
    return { paused }
  },
})

/** Resume a blocked run at its saved phase and cursor after the cause is fixed. */
export const resumeBlockedRun = mutation({
  args: { reasonCode: reason },
  returns: v.null(),
  handler: async (ctx, { reasonCode }) => {
    const actor = await requireAdmin(ctx)
    const world = await readWorld(ctx)
    const run: Doc<'simulationRuns'> | null = world?.activeRunId ? await ctx.db.get(world.activeRunId) : null
    if (run === null || run.state !== 'blocked') throw appError('INVALID_STATE', 'No blocked run.')
    const publication = await ctx.db.query('leaderboardPublications').withIndex('by_runId', (q) => q.eq('runId', run._id)).unique()
    const now = Date.now()
    if (publication && publication.state === 'building') {
      await ctx.db.patch(run._id, { state: 'ranking', failureCode: undefined, recoveryAttempts: 0, lastProgressAt: now })
      const scheduled = await ctx.scheduler.runAfter(0, internal.leaderboard.buildBatch, { publicationId: publication._id, expectedSequence: publication.batchSequence })
      await ctx.db.patch(publication._id, { nextScheduledFunctionId: scheduled, lastProgressAt: now })
    } else {
      const scheduled = await ctx.scheduler.runAfter(0, internal.sim.runs.tick.simulateBatch, { runId: run._id, expectedSequence: run.batchSequence })
      await ctx.db.patch(run._id, { state: 'simulating', failureCode: undefined, recoveryAttempts: 0, lastProgressAt: now, nextScheduledFunctionId: scheduled })
    }
    await audit(ctx, actor, 'resume_run', run._id, reasonCode, `tick ${run.tick}`)
    return null
  },
})
