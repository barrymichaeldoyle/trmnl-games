import { v } from 'convex/values'
import { stageFor } from '@trmnl-games/paper-lives/sim'
import { portraitKey } from '@trmnl-games/paper-lives/art/route'
import { generationLabel } from '@trmnl-games/paper-lives/payload'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { query } from '../_generated/server'
import { adminRef } from '../lib/adminAccess'
import { ALIAS_RULE, normalizeAlias } from '../lib/names'
import { pagePublic } from '../lib/publicPage'
import { gameStatusOf } from '../platform'
import { photosOf } from './photos'
import { currentLife } from './profile'

/**
 * A finished life's public page (paper-lives.md "What a player sees"): `/profile/<public name>/lives/<n>`, with the
 * portrait, the age at death, the generation, the epitaph, the highlights and the photos taken in it. Missing, private, suspended and
 * name-repair names, a life that has not ended, and a game that is not live (to anyone but an admin) all read as
 * the same null, as D109.
 */
export const lifePage = query({
  args: { alias: v.string(), ordinal: v.number() },
  returns: v.any(),
  handler: async (ctx, { alias, ordinal }) => {
    const normalized = normalizeAlias(alias)
    if (normalized.length < ALIAS_RULE.min || normalized.length > ALIAS_RULE.max || !Number.isInteger(ordinal) || ordinal < 1) return null
    const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', normalized)).first()
    if (user === null || user.state !== 'active' || user.nameRepairRequired) return null
    if ((await gameStatusOf(ctx, 'paper-lives')) !== 'live' && (await adminRef(ctx)) === null) return null
    const current = await currentLife(ctx, user)
    if (!current || current.activationState !== 'active' || !pagePublic(current)) return null
    const record = await ctx.db.query('lifeRecords').withIndex('by_userId_and_ordinal', (q) => q.eq('userId', user._id).eq('ordinal', ordinal)).unique()
    if (record === null) return null
    const parent = record.parentRecordId ? await ctx.db.get(record.parentRecordId) : null
    const child = await ctx.db.query('lifeRecords').withIndex('by_userId_and_ordinal', (q) => q.eq('userId', user._id).eq('ordinal', ordinal + 1)).unique()
    const traits = record.traits.map((id) => contentV1.traits.find((t) => t.id === id)?.name ?? id)
    return {
      alias: user.publicAlias,
      ordinal,
      name: `${record.first} ${record.last}`,
      age: record.age,
      generation: generationLabel(record.generation, record.last),
      traits,
      epitaph: record.epitaph,
      highlights: record.highlights,
      endedAt: record.endedAt,
      portrait: portraitKey({ stage: stageFor(record.age), last: record.last, generation: record.generation, traits: [record.traits[0]!, record.traits[1]!], flags: [], status: 'ended' }),
      parent: parent ? { ordinal: parent.ordinal, name: `${parent.first} ${parent.last}` } : null,
      child: child && child.parentRecordId === record._id ? { ordinal: child.ordinal, name: `${child.first} ${child.last}` } : null,
      photos: await photosOf(ctx, user._id, ordinal),
    }
  },
})
