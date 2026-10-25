import { zeroCounters, type FactionId } from '@trmnl-games/pixel-wars/sim'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { internal } from '../_generated/api'
import { getOrCreateEngineWorld } from '../lib/engine/world'
import { placeDesk } from './maps'
import { currentDesk, setCurrentDesk } from './profile'
import { PIXEL_WARS_RUNTIME } from './runtime'

/**
 * Pixel Wars' half of the TRMNL lifecycle (pixel-wars.md "Desks, maps and placement"). A desk is prepared pending at
 * install and activated once by a confirmed saved installation. It takes its place on the map when the owner has
 * chosen a faction: at activation if they chose first, else the moment they choose.
 */
export const FIRST_LOG = 'You have a desk. Pick a side in the companion and it goes on the map.'
export const zeroWeek = () => ({ painted: 0, flipped: 0, desksTaken: 0, liberated: 0, lost: 0, fell: 0, refunded: 0 })

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export const newInviteCode = (): string => Array.from({ length: 8 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')

export async function prepareDesk(ctx: MutationCtx, user: Doc<'users'>, now: number): Promise<Id<'desks'>> {
  const world = await getOrCreateEngineWorld(ctx, PIXEL_WARS_RUNTIME)
  const content = PIXEL_WARS_RUNTIME.content(world.activeContentVersion)!
  const deskId = await ctx.db.insert('desks', {
    userId: user._id,
    createdAt: now,
    isActive: true,
    activationState: 'pending_trmnl',
    faction: 0,
    level: 1,
    xp: 0,
    lifetimeXp: 0,
    lastLevelUpTick: world.currentTick,
    scoreHourXp: 0,
    counters: zeroCounters(),
    week: zeroWeek(),
    goal: { rung: 0 },
    well: { drops: content.wellCap, tick: world.currentTick },
    seasonWeek: 0,
    inviteCode: newInviteCode(),
    eligibleFromTick: world.currentTick + 1,
    lastTick: world.currentTick,
    lastProgressTick: world.currentTick,
    logSequence: 1,
    simulationState: 'healthy',
  })
  await setCurrentDesk(ctx, user, deskId)
  await ctx.db.insert('pwTickLogs', { deskId, source: 'lifecycle', sequence: 1, at: now, kind: 'system', summary: FIRST_LOG, detail: { v: 1, operation: 'desk_created' } })
  return deskId
}

/** First activation baseline: the next Pixel Wars tick, no catch-up; a faction chosen beforehand puts the desk on the map now. */
export async function activateDesk(ctx: MutationCtx, userId: Id<'users'>, now: number): Promise<void> {
  const user = await ctx.db.get(userId)
  const desk = await currentDesk(ctx, user)
  if (desk === null || desk.activationState === 'active') return
  const world = await getOrCreateEngineWorld(ctx, PIXEL_WARS_RUNTIME)
  await ctx.db.patch(desk._id, { activationState: 'active', activatedAt: now, eligibleFromTick: world.currentTick + 1, lastTick: world.currentTick, lastProgressTick: world.currentTick, well: { drops: desk.well.drops, tick: world.currentTick } })
  if (desk.faction !== 0 && desk.seat === undefined) await placeDesk(ctx, { ...desk, activationState: 'active' }, desk.faction as FactionId, now)
  if (user?.analyticsConsent === true) await ctx.scheduler.runAfter(0, internal.analytics.captureActivation, { userId, event: 'pixel wars started', game: 'pixel-wars' })
}
