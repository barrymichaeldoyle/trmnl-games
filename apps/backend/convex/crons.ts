import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

/** D42: one logical world tick per quarter-hour, on the hour and at minutes 15, 30 and 45 UTC. */
crons.cron('world tick', '0,15,30,45 * * * *', internal.sim.runs.tick.startTick, {})

/** Idle Angler (D115): its own world, five minutes into each quarter-hour so the two never share a slot. */
crons.cron('idle angler tick', '5,20,35,50 * * * *', internal.idleAngler.tick.startTick, {})
crons.interval('idle angler watchdog', { minutes: 5 }, internal.idleAngler.tick.watchdog, {})
// D162: last weekend's Opens close and award their medals on Monday at 00:10 UTC.
crons.cron('idle angler opens', '10 0 * * 1', internal.idleAngler.full.closeOpens, {})

/** Paper Lives (D159): its own world, ten minutes into each quarter-hour so the three never share a slot. */
crons.cron('paper lives tick', '10,25,40,55 * * * *', internal.paperLives.tick.startTick, {})
crons.interval('paper lives watchdog', { minutes: 5 }, internal.paperLives.tick.watchdog, {})

/** Stalled-run detection and guarded recovery (simulation.md "Watchdog"). */
crons.interval('tick watchdog', { minutes: 5 }, internal.sim.runs.tick.watchdog, {})

/** D115: daily platform achievement rarity, after the cleanup and away from both games' tick slots. */
crons.daily('platform tally', { hourUTC: 3, minuteUTC: 27 }, internal.platformProfile.tally, {})

/** Bounded retention cleanup (data-model.md), away from tick slots. */
crons.daily('retention cleanup', { hourUTC: 3, minuteUTC: 5 }, internal.maintenance.cleanup, {})

export default crons
