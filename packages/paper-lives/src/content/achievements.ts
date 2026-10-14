import type { LifeState } from '../sim/types'
import { contentV1 } from './v1'

/**
 * Paper Lives achievements (paper-lives.md "Achievements"), versioned and appended as the other games' catalogs. Every
 * predicate reads the account's career: the totals of its finished lives plus the current life, so an achievement is
 * earned whichever life it falls in. Tiers are set from the harness's life lengths (paper-lives.md "L5 build").
 */
export const ACHIEVEMENTS_VERSION = 1

export type AchievementCategory = 'Lives' | 'Family' | 'Work and money' | 'Choices' | 'Jobs' | 'Set pieces'

/** The account's career: what every life so far adds up to. Sets are bounded by the content (30 jobs, 8 hobbies, 16 traits). */
export interface Career {
  readonly livesEnded: number
  readonly yearsLived: number
  readonly oldestAge: number
  readonly highestGeneration: number
  readonly childrenRaised: number
  readonly grandchildren: number
  readonly marriages: number
  readonly peakMoney: number
  readonly housesOwned: number
  readonly petsKept: number
  readonly decisionsChosen: number
  readonly decisionsDefaulted: number
  readonly remarkableEvents: number
  readonly jobs: readonly string[]
  /** Jobs held for twenty years within one life. */
  readonly longJobs: readonly string[]
  readonly hobbies: readonly string[]
  readonly traits: readonly string[]
  /** Set pieces earned, by id. */
  readonly setPieces: readonly string[]
}

export const emptyCareer = (): Career => ({
  livesEnded: 0,
  yearsLived: 0,
  oldestAge: 0,
  highestGeneration: 0,
  childrenRaised: 0,
  grandchildren: 0,
  marriages: 0,
  peakMoney: 0,
  housesOwned: 0,
  petsKept: 0,
  decisionsChosen: 0,
  decisionsDefaulted: 0,
  remarkableEvents: 0,
  jobs: [],
  longJobs: [],
  hobbies: [],
  traits: [],
  setPieces: [],
})

const union = (a: readonly string[], b: readonly string[]) => [...new Set([...a, ...b])].sort()

/** What one life adds to a career; `ended` counts it as a finished life. */
export function withLife(career: Career, life: LifeState, ended: boolean): Career {
  const c = life.counters
  return {
    livesEnded: career.livesEnded + (ended ? 1 : 0),
    yearsLived: career.yearsLived + c.yearsLived,
    oldestAge: Math.max(career.oldestAge, ended ? life.age : 0),
    highestGeneration: Math.max(career.highestGeneration, life.generation),
    childrenRaised: career.childrenRaised + c.childrenRaised,
    grandchildren: career.grandchildren + c.grandchildren,
    marriages: career.marriages + c.marriages,
    peakMoney: Math.max(career.peakMoney, c.peakMoney),
    housesOwned: career.housesOwned + c.housesOwned,
    petsKept: career.petsKept + c.petsKept,
    decisionsChosen: career.decisionsChosen + c.decisionsChosen,
    decisionsDefaulted: career.decisionsDefaulted + c.decisionsDefaulted,
    remarkableEvents: career.remarkableEvents + c.remarkableEvents,
    jobs: union(career.jobs, Object.keys(life.jobYears)),
    longJobs: union(career.longJobs, Object.entries(life.jobYears).filter(([, years]) => years >= 20).map(([id]) => id)),
    hobbies: union(career.hobbies, life.hobbiesHad ?? (life.hobby ? [life.hobby] : [])),
    traits: union(career.traits, life.traits),
    setPieces: union(career.setPieces, setPiecesOf(life)),
  }
}

/** Set pieces a life shows now (paper-lives.md "Achievements"). The oldest-ever piece is awarded by the boards. */
export function setPiecesOf(life: LifeState): string[] {
  const out: string[] = []
  const s = life.stats
  if (life.age >= 60 && life.age <= 61 && s.health > 80 && s.happiness > 80 && s.smarts > 80 && s.charm > 80) out.push('all_round')
  if (life.status === 'ended') {
    if (life.home === 'family' && life.age >= 60) out.push('homebody')
    if (life.will === 'cause') out.push('will_cause')
    if (life.pet?.kind === 'dog') out.push('loyal_dog')
    if (life.death) out.push(`cause_${life.death.cause}`)
  }
  if (life.people.some((p) => p.alive && p.role === 'friend' && life.age - p.metAt >= 60)) out.push('old_friend')
  return out
}

export type Predicate =
  | { readonly kind: 'count'; readonly key: Exclude<keyof Career, 'jobs' | 'longJobs' | 'hobbies' | 'traits' | 'setPieces'>; readonly atLeast: number }
  | { readonly kind: 'distinct'; readonly key: 'jobs' | 'hobbies' | 'traits'; readonly atLeast: number }
  | { readonly kind: 'job'; readonly jobId: string; readonly long: boolean }
  | { readonly kind: 'piece'; readonly id: string }

export interface AchievementDef {
  readonly id: string
  readonly family: string
  readonly familyName: string
  readonly category: AchievementCategory
  readonly tier: number
  readonly name: string
  readonly blurb: string
  readonly predicate: Predicate
}

type Tier = readonly [atLeast: number, name: string, blurb: string]

function family(id: string, familyName: string, category: AchievementCategory, make: (atLeast: number) => Predicate, tiers: readonly Tier[]): AchievementDef[] {
  return tiers.map(([atLeast, name, blurb], index) => ({ id: `${id}_${index + 1}`, family: id, familyName, category, tier: index + 1, name, blurb, predicate: make(atLeast) }))
}

const count = (key: Extract<Predicate, { kind: 'count' }>['key']) => (atLeast: number): Predicate => ({ kind: 'count', key, atLeast })
const distinct = (key: Extract<Predicate, { kind: 'distinct' }>['key']) => (atLeast: number): Predicate => ({ kind: 'distinct', key, atLeast })

const FAMILIES: AchievementDef[] = [
  ...family('lives', 'Lives', 'Lives', count('livesEnded'), [
    [1, 'A Life Lived', 'One life, start to finish.'],
    [3, 'Second Chances', 'Three lives in the album.'],
    [6, 'Old Soul', 'Six lives in the album.'],
    [12, 'The Long Shelf', 'Twelve lives on the shelf.'],
    [20, 'Twenty Lives', 'A whole bookcase of them.'],
  ]),
  ...family('years', 'Years', 'Lives', count('yearsLived'), [
    [50, 'Half a Century', 'Fifty years lived, all told.'],
    [150, 'Through the Ages', 'A hundred and fifty years lived.'],
    [300, 'Three Centuries', 'Three hundred years of birthdays.'],
    [600, 'Long Memory', 'Six hundred years lived.'],
    [900, 'Nine Hundred Candles', 'Nine hundred years, all told.'],
  ]),
  ...family('long_life', 'Long life', 'Lives', count('oldestAge'), [
    [60, 'Sixty Not Out', 'A life that reached sixty.'],
    [80, 'Eighty Summers', 'A life that reached eighty.'],
    [90, 'Ninety and Counting', 'A life that reached ninety.'],
    [100, 'A Letter from the Mayor', 'A life of a hundred years.'],
  ]),
  ...family('generations', 'Generations', 'Family', count('highestGeneration'), [
    [2, 'Second Generation', 'A child took up the story.'],
    [3, 'Grandparent’s Grandchild', 'Three generations in the album.'],
    [5, 'Five Generations', 'A family tree with five rungs.'],
    [8, 'An Old Family', 'Eight generations of one name.'],
    [12, 'Dynasty', 'Twelve generations of one name.'],
  ]),
  ...family('family', 'Family', 'Family', count('childrenRaised'), [
    [1, 'New Arrival', 'A first child.'],
    [3, 'Full Table', 'Three children raised.'],
    [10, 'School Run', 'Ten children raised, all told.'],
    [25, 'Village', 'Twenty-five children raised.'],
  ]),
  ...family('grandparent', 'Grandparent', 'Family', count('grandchildren'), [
    [1, 'Grandparent', 'A first grandchild.'],
    [5, 'Biscuit Tin', 'Five grandchildren.'],
    [15, 'Head of the Table', 'Fifteen grandchildren.'],
  ]),
  ...family('vows', 'Vows', 'Family', count('marriages'), [
    [1, 'I Do', 'A wedding.'],
    [3, 'Speeches', 'Three weddings, all told.'],
    [10, 'Confetti', 'Ten weddings across the album.'],
  ]),
  ...family('careers', 'Careers', 'Work and money', distinct('jobs'), [
    [1, 'First Payslip', 'A first job.'],
    [5, 'Varied Work', 'Five different jobs.'],
    [15, 'Jack of All Trades', 'Fifteen different jobs.'],
    [30, 'Every Job Going', 'All thirty jobs.'],
  ]),
  ...family('fortune', 'Fortune', 'Work and money', count('peakMoney'), [
    [10_000, 'Nest Egg', '10,000 saved.'],
    [100_000, 'Comfortable', '100,000 saved.'],
    [1_000_000, 'Millionaire', 'A million, once.'],
  ]),
  ...family('homeowner', 'Homeowner', 'Work and money', count('housesOwned'), [
    [1, 'Keys of Your Own', 'A first home.'],
    [3, 'Property Ladder', 'Three homes bought.'],
    [10, 'Landlord of the Lane', 'Ten homes, all told.'],
  ]),
  ...family('good_company', 'Good company', 'Family', count('petsKept'), [
    [1, 'Good Company', 'A first pet.'],
    [5, 'Full Basket', 'Five pets, all told.'],
    [15, 'Menagerie', 'Fifteen pets across the album.'],
  ]),
  ...family('pastimes', 'Pastimes', 'Lives', distinct('hobbies'), [
    [1, 'Something for Saturdays', 'A first hobby.'],
    [4, 'Hands Full', 'Four different hobbies.'],
    [8, 'Every Club in Town', 'All eight hobbies.'],
  ]),
  ...family('traits', 'Traits', 'Lives', distinct('traits'), [
    [4, 'Characters', 'Four different traits lived.'],
    [8, 'Many Faces', 'Eight different traits lived.'],
    [16, 'Every Kind of Person', 'All sixteen traits.'],
  ]),
  ...family('decisions', 'Decisions', 'Choices', count('decisionsChosen'), [
    [1, 'Made Up My Mind', 'A first decision taken.'],
    [25, 'Decisive', 'Twenty-five decisions taken.'],
    [100, 'Thought It Through', 'A hundred decisions taken.'],
    [250, 'Life’s Work', 'Two hundred and fifty decisions.'],
    [500, 'Captain of the Ship', 'Five hundred decisions taken.'],
  ]),
  ...family('let_it_be', 'Let it be', 'Choices', count('decisionsDefaulted'), [
    [10, 'Let It Be', 'Ten years left to take the gentle choice.'],
    [100, 'Go with the Flow', 'A hundred gentle choices.'],
    [300, 'Easy Does It', 'Three hundred gentle choices.'],
  ]),
  ...family('remarkable', 'Remarkable', 'Choices', count('remarkableEvents'), [
    [1, 'Remarkable', 'Something to tell the grandchildren.'],
    [5, 'Stories to Tell', 'Five remarkable moments.'],
    [15, 'In the Paper', 'Fifteen remarkable moments.'],
    [30, 'Local Legend', 'Thirty remarkable moments.'],
  ]),
]

/** One per job: held it, and held it for twenty years within one life. */
const article = (name: string) => (/^[aeiou]/i.test(name) ? 'an' : 'a')
const JOBS: AchievementDef[] = contentV1.jobs.flatMap((job) => [
  { id: `job_${job.id}`, family: `job_${job.id}`, familyName: job.name, category: 'Jobs' as const, tier: 1, name: job.name, blurb: `Worked as ${article(job.name)} ${job.name.toLowerCase()}.`, predicate: { kind: 'job' as const, jobId: job.id, long: false } },
  // Saturday jobs end at 18, so only adult jobs have a twenty-year tier.
  ...(job.tier > 1 ? [{ id: `job_${job.id}_20`, family: `job_${job.id}`, familyName: job.name, category: 'Jobs' as const, tier: 2, name: `${job.name}, twenty years`, blurb: `Twenty years as ${article(job.name)} ${job.name.toLowerCase()} in one life.`, predicate: { kind: 'job' as const, jobId: job.id, long: true } }] : []),
])

const piece = (id: string, name: string, blurb: string): AchievementDef => ({ id: `piece_${id}`, family: `piece_${id}`, familyName: name, category: 'Set pieces', tier: 1, name, blurb, predicate: { kind: 'piece', id } })

const PIECES: AchievementDef[] = [
  piece('all_round', 'All Round', 'Every stat over 80 at sixty.'),
  piece('homebody', 'Never Left Home', 'Lived past sixty in the family home.'),
  piece('will_cause', 'A Good Cause', 'Left everything to a good cause.'),
  piece('old_friend', 'Friends for Sixty Years', 'A friendship of sixty years.'),
  piece('loyal_dog', 'Faithful', 'A dog that outlived its owner.'),
  piece('oldest_ever', 'The Oldest of All', 'The oldest life on the all-time board.'),
  // The four remarkable causes of death, each gentle.
  piece('cause_summit', 'On the Hilltop', 'Died at the top of a hill always meant to be climbed.'),
  piece('cause_wedding', 'Last Dance', 'Died mid-laugh at a family wedding.'),
  piece('cause_runner_beans', 'Among the Beans', 'Died in the garden, among the runner beans.'),
  piece('cause_deckchair', 'First Warm Day', 'Died in a deckchair on the first warm day of the year.'),
]

export const ACHIEVEMENTS: readonly AchievementDef[] = [...FAMILIES, ...JOBS, ...PIECES]
export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, AchievementDef> = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

/** How far a career is along one predicate. */
export function measure(predicate: Predicate, career: Career): { value: number; target: number } {
  switch (predicate.kind) {
    case 'count':
      return { value: career[predicate.key], target: predicate.atLeast }
    case 'distinct':
      return { value: career[predicate.key].length, target: predicate.atLeast }
    case 'job':
      return { value: (predicate.long ? career.longJobs : career.jobs).includes(predicate.jobId) ? 1 : 0, target: 1 }
    case 'piece':
      return { value: career.setPieces.includes(predicate.id) ? 1 : 0, target: 1 }
  }
}

export const satisfied = (def: AchievementDef, career: Career) => {
  const { value, target } = measure(def.predicate, career)
  return value >= target
}

export const allSatisfied = (career: Career): AchievementDef[] => ACHIEVEMENTS.filter((def) => satisfied(def, career))

/** Each family's earned tier, next tier and progress towards it. */
export function familyProgress(career: Career, unlocked: ReadonlySet<string>) {
  const families = new Map<string, AchievementDef[]>()
  for (const def of ACHIEVEMENTS) families.set(def.family, [...(families.get(def.family) ?? []), def])
  return [...families.entries()].map(([id, tiers]) => {
    const earned = [...tiers].reverse().find((t) => unlocked.has(t.id)) ?? null
    const next = tiers.find((t) => !unlocked.has(t.id)) ?? null
    const goal = next ?? tiers.at(-1)!
    const { value, target } = measure(goal.predicate, career)
    return { family: id, name: tiers[0]!.familyName, category: tiers[0]!.category, tiers: tiers.length, earned, next, value, target }
  })
}
