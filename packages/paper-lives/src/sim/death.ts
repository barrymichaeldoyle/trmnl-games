import { pickOne, pickWeighted, type Rng } from '@trmnl-games/engine/rng'
import { living, partnerOf, personAge } from './rules'
import { fill } from './text'
import type { Bequest, CauseDef, EpitaphDef, Heir, LifeRecord, LifeState, PaperLivesCatalog, StreamName } from './types'

/** The job held longest, ties to the earlier job. */
export function longestJob(life: Pick<LifeState, 'jobYears'>, content?: Pick<PaperLivesCatalog, 'jobs' | 'tuning'>): string | undefined {
  let entries = Object.entries(life.jobYears).filter(([, years]) => years > 0)
  // Content v3: a grown-up job counts before a Saturday one, so an epitaph never calls the paper round a life's work.
  if (content?.tuning.adultJobsFirst) {
    const adult = entries.filter(([id]) => (content.jobs.find((j) => j.id === id)?.tier ?? 1) > 1)
    if (adult.length > 0) entries = adult
  }
  let best: [string, number] | undefined
  for (const [id, years] of entries) if (!best || years > best[1]) best = [id, years]
  return best?.[0]
}

/** Which epitaph needs this life meets (paper-lives.md "The will, death and the next life"). */
export function lifeTags(life: LifeState, content?: Pick<PaperLivesCatalog, 'jobs' | 'tuning'>): Set<EpitaphDef['needs'][number]> {
  const tags = new Set<EpitaphDef['needs'][number]>()
  if (longestJob(life, content)) tags.add('job')
  if (life.counters.childrenRaised > 0) tags.add('children')
  if (life.counters.housesOwned > 0) tags.add('house')
  if (life.counters.petsKept > 0) tags.add('pet')
  if (life.hobby) tags.add('hobby')
  if (life.counters.remarkableEvents > 0) tags.add('remarkable')
  if (life.counters.marriages > 0) tags.add('partner')
  if (life.age >= 90) tags.add('long')
  return tags
}

/** The cause of death: by age band, likelier when the last ailment matches; remarkable causes are rare. One draw. */
export function chooseCause(life: LifeState, content: PaperLivesCatalog, rng: Rng): CauseDef {
  const pool = content.causes.filter((c) => life.age >= c.minAge && (c.maxAge === undefined || life.age <= c.maxAge))
  const weighted = pool.map((c) => [c, c.weight * (c.ailment !== undefined && c.ailment === life.ailment ? 6 : 1)] as const)
  return pickWeighted(rng, weighted)
}

/**
 * The will (paper-lives.md "The will, death and the next life"). Without one, the partner takes half
 * and the children share half; with no family the money goes with the character. The house goes with
 * the money to the first named heir. Debt is forgiven, never inherited.
 */
export function bequests(life: LifeState): Bequest[] {
  const gold = Math.max(0, life.gold)
  const children = living(life, 'child')
  const partner = partnerOf(life)
  const hasHouse = life.home === 'owned' && life.house !== undefined
  const share = (ids: readonly string[], amount: number): Bequest[] => ids.map((personId, i) => ({ personId, gold: Math.floor(amount / ids.length) + (i === 0 ? amount % ids.length : 0), house: false }))
  let out: Bequest[]
  const will = life.will === 'partner' && !partner ? undefined : life.will === 'one_child' || life.will === 'split' ? (children.length > 0 ? life.will : undefined) : life.will
  if (will === 'cause') return []
  if (will === 'partner' && partner) out = [{ personId: partner.id, gold, house: false }]
  else if (will === 'one_child') out = [{ personId: [...children].sort((a, b) => b.relationship - a.relationship)[0]!.id, gold, house: false }]
  else if (will === 'split') out = share(children.map((c) => c.id), gold)
  else if (partner && children.length > 0) out = [{ personId: partner.id, gold: Math.ceil(gold / 2), house: false }, ...share(children.map((c) => c.id), Math.floor(gold / 2))]
  else if (partner) out = [{ personId: partner.id, gold, house: false }]
  else if (children.length > 0) out = share(children.map((c) => c.id), gold)
  else return []
  return hasHouse && out.length > 0 ? out.map((b, i) => (i === 0 ? { ...b, house: true } : b)) : out
}

export function endLife(life: LifeState, content: PaperLivesCatalog, rngs: Readonly<Record<StreamName, Rng>>): { life: LifeState; record: LifeRecord } {
  const cause = chooseCause(life, content, rngs.mortality)
  const job = longestJob(life, content)
  const jobDef = job ? content.jobs.find((j) => j.id === job) : undefined
  const hobby = life.hobby ? content.hobbies.find((h) => h.id === life.hobby) : undefined
  const slots = { first: life.first, last: life.last, age: String(life.age), ...(jobDef ? { job: jobDef.name.toLowerCase() } : {}), ...(hobby ? { hobby: hobby.noun } : {}) }
  const deathLine = fill(cause.line, life.pronouns, slots)
  const tags = lifeTags(life, content)
  const epitaphs = content.epitaphs.filter((e) => e.needs.every((n) => tags.has(n)))
  // Prefer the most specific epitaph the life earns, so a long full life is not summed up by the plainest line.
  const most = Math.max(...epitaphs.map((e) => e.needs.length))
  const epitaph = fill(pickOne(rngs.narrative, epitaphs.filter((e) => e.needs.length >= Math.min(most, 2))).line, life.pronouns, slots)
  const heirs: Heir[] = life.people
    .filter((p) => p.alive && (p.role === 'child' || p.role === 'grandchild'))
    .map((p) => ({ id: p.id, name: p.name, role: p.role as Heir['role'], age: personAge(life, p), relationship: p.relationship, ...(p.parentId ? { parentId: p.parentId } : {}), ...(content.tuning.gendered && p.gender ? { gender: p.gender } : {}) }))
  const partner = partnerOf(life)
  const record: LifeRecord = {
    first: life.first,
    last: life.last,
    pronouns: life.pronouns,
    traits: life.traits,
    generation: life.generation,
    age: life.age,
    cause: cause.id,
    epitaph,
    finalStats: life.stats,
    peakMoney: life.counters.peakMoney,
    finalGold: life.gold,
    ...(job ? { longestJob: job } : {}),
    ...(life.hobby ? { hobby: life.hobby } : {}),
    counters: life.counters,
    ...(life.home === 'owned' && life.house !== undefined ? { house: life.house } : {}),
    ...(life.will ? { will: life.will } : {}),
    bequests: bequests(life),
    highlights: life.highlights,
    heirs,
    ...(partner ? { partner: { name: partner.name, age: personAge(life, partner), relationship: partner.relationship } } : {}),
  }
  return { life: { ...life, status: 'ended', death: { cause: cause.id, line: deathLine, epitaph } }, record }
}
