import { v } from 'convex/values'
import { titleFor } from '@trmnl-games/idle-angler/sim'
import { paginator } from 'convex-helpers/server/pagination'
import { platformAchievements, PLATFORM_ACHIEVEMENTS } from '@trmnl-games/platform'
import schema from './schema'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, query, type QueryCtx } from './_generated/server'
import { MAX_UNLOCK_ROWS } from './lib/achievements'
import { currentHero } from './lib/gameProfile'
import { readEngineWorld } from './lib/engine/world'
import { DESK_CRAWLER_RUNTIME } from './lib/engine/deskCrawler'
import { ALIAS_RULE, normalizeAlias } from './lib/names'
import { pagePublic } from './lib/publicPage'
import { adminRef } from './lib/adminAccess'
import { gameStatusOf } from './platform'
import { MAX_SW_UNLOCKS } from './idleAngler/achievements'
import { currentAngler } from './idleAngler/profile'
import { currentLife, paperLivesProfile } from './paperLives/profile'
import { MAX_PL_UNLOCKS } from './paperLives/achievements'
import { currentPlot } from './littlePlot/profile'
import { MAX_LP_UNLOCKS } from './littlePlot/achievements'
import { LITTLE_PLOT_RUNTIME } from './littlePlot/runtime'
import { kindsGrown } from '@trmnl-games/little-plot/sim'
import { contentV1 as littlePlotContent } from '@trmnl-games/little-plot/content'
import { currentDesk } from './pixelWars/profile'
import { MAX_PW_UNLOCKS } from './pixelWars/achievements'
import { PIXEL_WARS_RUNTIME } from './pixelWars/runtime'
import { contentV1 as pixelWarsContent } from '@trmnl-games/pixel-wars/content'
import { contentV1 as paperLivesContent } from '@trmnl-games/paper-lives/content'
import type { EngineRuntime } from './lib/engine/runtime'

/**
 * The shared public profile (idle-angler.md "Platform profile and achievements", D115): one page per public name
 * listing each game whose page the player has not hidden (D144), with its level, start date and all-time rank, plus platform achievements.
 * Missing, private, suspended and name-repair profiles all read as the same null, as D109. A game that is not live
 * appears only to admins.
 */

/** The player's achievements earned in each game and the games with an active character. */
async function crossGame(ctx: QueryCtx, user: Doc<'users'>) {
  const hero = await currentHero(ctx, user)
  const angler = await currentAngler(ctx, user)
  const dcUnlocks = (await ctx.db.query('heroAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_UNLOCK_ROWS)).length
  const iaUnlocks = (await ctx.db.query('iaAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_SW_UNLOCKS)).length
  // D159: Paper Lives counts like any game.
  const life = await currentLife(ctx, user)
  const plUnlocks = (await ctx.db.query('plAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_PL_UNLOCKS)).length
  // D206: Little Plot counts like any game.
  const plot = await currentPlot(ctx, user)
  const lpUnlocks = (await ctx.db.query('lpAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_LP_UNLOCKS)).length
  // D214: Pixel Wars counts like any game.
  const desk = await currentDesk(ctx, user)
  const pwUnlocks = (await ctx.db.query('pwAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_PW_UNLOCKS)).length
  const games = (hero?.activationState === 'active' ? 1 : 0) + (angler?.activationState === 'active' ? 1 : 0) + (life?.activationState === 'active' ? 1 : 0) + (plot?.activationState === 'active' ? 1 : 0) + (desk?.activationState === 'active' ? 1 : 0)
  return { hero, angler, life, plot, desk, dcUnlocks, iaUnlocks, plUnlocks, lpUnlocks, pwUnlocks, games, collected: dcUnlocks + iaUnlocks + plUnlocks + lpUnlocks + pwUnlocks }
}

/** All-time rank in a game's published set, or null. */
async function overallRank(ctx: QueryCtx, runtime: EngineRuntime<unknown>, subjectId: string): Promise<{ rank: number; totalPlayers: number } | null> {
  const world = await readEngineWorld(ctx, runtime)
  if (!world?.publishedPublicationId) return null
  const publication = await ctx.db.get(world.publishedPublicationId)
  if (publication === null || publication.state !== 'published') return null
  const table = (runtime.tables.ranks as 'heroRanks')
  const row = await ctx.db.query(table).withIndex('by_publicationId_and_board_and_heroId', (q) => q.eq('publicationId', publication._id).eq('board', 'overall').eq('heroId', subjectId as Id<'heroes'>)).unique()
  return row ? { rank: row.rank, totalPlayers: publication.globalTotalPlayers } : null
}

export const view = query({
  args: { alias: v.string() },
  returns: v.any(),
  handler: async (ctx, { alias }) => {
    const normalized = normalizeAlias(alias)
    if (normalized.length < ALIAS_RULE.min || normalized.length > ALIAS_RULE.max) return null
    const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', normalized)).first()
    if (user === null || user.state !== 'active' || user.nameRepairRequired) return null
    const { hero, angler, life, plot, desk, dcUnlocks, iaUnlocks, plUnlocks, lpUnlocks, pwUnlocks, games, collected } = await crossGame(ctx, user)
    const admin = (await adminRef(ctx)) !== null
    const showIdleAngler = angler !== null && angler.activationState === 'active' && pagePublic(angler) && ((await gameStatusOf(ctx, 'idle-angler')) === 'live' || admin)
    const showDesk = hero !== null && hero.activationState === 'active' && pagePublic(hero)
    const showPaperLives = life !== null && life.activationState === 'active' && pagePublic(life) && ((await gameStatusOf(ctx, 'paper-lives')) === 'live' || admin)
    const showLittlePlot = plot !== null && plot.activationState === 'active' && pagePublic(plot) && ((await gameStatusOf(ctx, 'little-plot')) === 'live' || admin)
    const showPixelWars = desk !== null && desk.activationState === 'active' && desk.faction !== 0 && pagePublic(desk) && ((await gameStatusOf(ctx, 'pixel-wars')) === 'live' || admin)
    if (!showDesk && !showIdleAngler && !showPaperLives && !showLittlePlot && !showPixelWars) return null
    const current = await ctx.db.query('platformStats').withIndex('by_key', (q) => q.eq('key', 'current')).unique()
    return {
      alias: user.publicAlias,
      games: [
        ...(showDesk ? [{ slug: 'desk-crawler' as const, name: hero.name, level: hero.level, since: hero.activatedAt ?? hero.createdAt, rank: await overallRank(ctx, DESK_CRAWLER_RUNTIME, hero._id), achievements: dcUnlocks, page: `/desk-crawler/heroes/${encodeURIComponent(user.publicAlias)}` }] : []),
        ...(showIdleAngler
          ? [{
              slug: 'idle-angler' as const, name: user.publicAlias, title: titleFor(Object.keys(angler.logbook).length).name, since: angler.activatedAt ?? angler.createdAt, rank: null, achievements: iaUnlocks, species: Object.keys(angler.logbook).length, page: null,
              // D162: the trophy wall, at most 24 mounted fish, and the medal count.
              wall: (await ctx.db.query('iaTrophies').withIndex('by_anglerId_and_kind', (q) => q.eq('anglerId', angler._id).eq('kind', 'fish')).take(24)).map((t) => ({ speciesId: t.speciesId ?? '', grams: t.grams ?? 0 })),
              medals: angler.counters.medals ?? 0,
            }]
          : []),
        ...(showPaperLives ? [await paperLivesSection(ctx, user, life, plUnlocks)] : []),
        ...(showLittlePlot
          ? [{
              slug: 'little-plot' as const, name: user.publicAlias, level: plot.level, since: plot.activatedAt ?? plot.createdAt, rank: await overallRank(ctx, LITTLE_PLOT_RUNTIME, plot._id), achievements: lpUnlocks, page: null,
              // The plot as it stands and the catalogue count, with the rarest kind grown.
              plot: { rows: plot.plot.rows, cols: plot.plot.cols, beds: plot.plot.beds.map((b) => ({ kind: b.kindId ? (littlePlotContent.kinds.find((k) => k.id === b.kindId)?.name ?? b.kindId) : null, greenhouse: b.greenhouse === true })), kinds: kindsGrown(plot.plot), kindsTotal: littlePlotContent.kinds.length, rarest: [...littlePlotContent.kinds].reverse().find((k) => plot.plot.catalogue[k.id] !== undefined)?.name ?? null },
            }]
          : []),
        ...(showPixelWars
          ? [{
              slug: 'pixel-wars' as const, name: user.publicAlias, level: desk.level, since: desk.activatedAt ?? desk.createdAt, rank: await overallRank(ctx, PIXEL_WARS_RUNTIME, desk._id), achievements: pwUnlocks, page: null,
              // The side, the week so far and the lifetime desks taken.
              war: { faction: pixelWarsContent.factions[(desk.faction as 1 | 2 | 3 | 4) - 1]!.name, pattern: pixelWarsContent.factions[(desk.faction as 1 | 2 | 3 | 4) - 1]!.pattern, week: desk.week, desksTaken: desk.counters.desksTaken, seasonsWon: desk.counters.seasonsWon, cleared: desk.cleared === true },
            }]
          : []),
      ],
      platform: platformAchievements({ games, collected }).map((a) => ({ id: a.id, name: a.name, blurb: a.blurb, family: a.family, tier: a.tier, share: current && current.totalPlayers > 0 ? Math.max(1, Math.round(((current.counts[a.id] ?? 0) * 100) / current.totalPlayers)) : null })),
    }
  },
})

/**
 * D159: the profile's Paper Lives section: the current character (name, age, job, traits), lives lived, the longest,
 * and the album's finished lives (at most 24, newest first), each linking to its public life page.
 */
async function paperLivesSection(ctx: QueryCtx, user: Doc<'users'>, life: Doc<'lives'>, achievements: number) {
  const career = (await paperLivesProfile(ctx, user._id))?.career
  const records = await ctx.db.query('lifeRecords').withIndex('by_userId_and_endedAt', (q) => q.eq('userId', user._id)).order('desc').take(24)
  const job = life.life.job ? paperLivesContent.jobs.find((j) => j.id === life.life.job)?.name : undefined
  return {
    slug: 'paper-lives' as const,
    name: `${life.life.first} ${life.life.last}`,
    since: life.activatedAt ?? life.createdAt,
    rank: null,
    achievements,
    page: null,
    life: {
      age: life.life.age,
      status: life.life.status,
      job: job ?? null,
      traits: life.life.traits.map((id) => paperLivesContent.traits.find((t) => t.id === id)?.name ?? id),
      lives: career?.livesEnded ?? 0,
      longest: career?.oldestAge ?? 0,
      album: records.map((r) => ({ ordinal: r.ordinal, name: `${r.first} ${r.last}`, age: r.age, generation: r.generation })),
    },
  }
}

const TALLY_PAGE = 100

/**
 * Daily platform rarity tally (cron at 03:20 UTC): pages active users, counting those with an active character in
 * any game and each platform achievement held. Bounded reads per user; the result replaces `current` when done.
 */
export const tally = internalMutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const now = Date.now()
    let building = await ctx.db.query('platformStats').withIndex('by_key', (q) => q.eq('key', 'building')).unique()
    if (cursor === undefined) {
      if (building) await ctx.db.delete(building._id)
      const id = await ctx.db.insert('platformStats', { key: 'building', counts: {}, totalPlayers: 0, at: now })
      building = (await ctx.db.get(id))!
    }
    if (building === null) return null
    const page = await paginator(ctx.db, schema).query('users').withIndex('by_state', (q) => q.eq('state', 'active')).paginate({ numItems: TALLY_PAGE, cursor: cursor ?? null })
    const counts = { ...building.counts }
    let players = building.totalPlayers
    for (const user of page.page) {
      const stats = await crossGame(ctx, user)
      if (stats.games === 0) continue
      players += 1
      for (const a of platformAchievements(stats)) counts[a.id] = (counts[a.id] ?? 0) + 1
    }
    if (!page.isDone) {
      await ctx.db.patch(building._id, { counts, totalPlayers: players, cursor: page.continueCursor })
      await ctx.scheduler.runAfter(0, internal.platformProfile.tally, { cursor: page.continueCursor })
      return null
    }
    const current = await ctx.db.query('platformStats').withIndex('by_key', (q) => q.eq('key', 'current')).unique()
    if (current) await ctx.db.delete(current._id)
    await ctx.db.insert('platformStats', { key: 'current', counts, totalPlayers: players, at: now })
    await ctx.db.delete(building._id)
    return null
  },
})

export { PLATFORM_ACHIEVEMENTS }
