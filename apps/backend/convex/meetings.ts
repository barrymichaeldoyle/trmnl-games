import { v } from 'convex/values'
import { query } from './_generated/server'
import { currentHero } from './lib/gameProfile'
import { currentUser } from './lib/intent'
import { recentMeetings } from './lib/meetings'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/desk-crawler/content'
import { meetingKind } from '@trmnl-games/desk-crawler/sim/core/meeting'

const RECENT_MEETINGS = 5

const meetingRow = v.object({
  tick: v.number(),
  /** When the starter's tick wrote it. */
  at: v.number(),
  role: v.union(v.literal('starter'), v.literal('partner')),
  rivalName: v.string(),
  profile: v.boolean(),
  rivalClass: v.union(v.literal('warrior'), v.literal('rogue')),
  kindId: v.string(),
  biomeId: v.string(),
  /** Readable names from the catalog: the meeting, its boon and the floor; the id when the catalog no longer has it. */
  kindName: v.string(),
  boon: v.string(),
  floor: v.string(),
  pending: v.boolean(),
})

/** D141: the signed-in owner's last five meetings, both directions, and its lifetime count. Null without a hero. */
export const recent = query({
  args: {},
  returns: v.union(v.null(), v.object({ meetings: v.array(meetingRow), total: v.number() })),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const hero = await currentHero(ctx, user)
    if (user === null || hero === null) return null
    const content = catalogs[ACTIVE_CONTENT]
    const rows = await recentMeetings(ctx, hero._id, RECENT_MEETINGS)
    const meetings = rows.map((row) => {
      const kind = meetingKind(content, row.kindId)
      const boon = content.effects?.find((effect) => effect.id === kind?.effectId)
      return { ...row, kindName: kind?.name ?? row.kindId, boon: boon?.name ?? '', floor: content.biomes.find((biome) => biome.id === row.biomeId)?.name ?? row.biomeId }
    })
    return { meetings, total: hero.counters.meetings ?? 0 }
  },
})
