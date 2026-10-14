import type { DecisionDef, Education, PaperLivesCatalog } from '../../sim/types'
import { contentV2 } from '../v2'
import { packAmbient, packDecisions } from './decisions'
import { packEvents } from './events'

/**
 * Paper Lives content v3 (2026-10-14), the first content pack: v2 plus about 190 events, 30 decisions and 30 quiet
 * lines, most of them for adult and senior life where years are many and repeats were highest.
 *
 * It also changes when a year's events happen (Barry: Age up felt like it might cost the year its stories). In v1 and
 * v2 about two events fell inside the year's two-hour minimum and one more trickled in afterwards, so ageing up at
 * the minimum gave up a third of the year. In v3 every event happens inside the minimum and the rest of the year is
 * quiet lines only, so Age up skips nothing but the quiet.
 *
 * Retirement and the will are asked once with one reminder, and the lines the core writes for falling out, making
 * up, exams, money and losses have more versions, so a long life does not repeat them.
 *
 * And three fixes the v2 review left for later: at most four events a year, jobs that need a degree or a trade
 * need it, and an epitaph names the grown-up job held longest rather than a teenage Saturday job.
 */
/**
 * The training some jobs need. v1 only capped the tier by education, so a trade apprentice could qualify as a nurse.
 * Jobs not listed take anyone who reaches their tier.
 */
const NEEDS: Record<string, readonly Education[]> = {
  nurse: ['degree'],
  librarian: ['degree'],
  teacher: ['degree'],
  software_developer: ['degree'],
  architect: ['degree'],
  vet: ['degree'],
  accountant: ['degree'],
  pharmacist: ['degree'],
  surgeon: ['degree'],
  headteacher: ['degree'],
  museum_director: ['degree'],
  electrician: ['trade'],
  plumber: ['trade'],
  carpenter: ['trade'],
}

/**
 * Retirement and the will were asked every year until answered, so a player who let them be read "Kept working
 * another year" five years running. Now each is asked once, with one reminder later on.
 */
function askOnce(d: DecisionDef): DecisionDef {
  if (d.id === 'sn_retire') return { ...d, when: { ...d.when, notFlags: ['kept_working'] }, options: d.options.map((o) => (o.id === 'keep' ? { ...o, effects: { ...o.effects, flag: 'kept_working' } } : o)) }
  if (d.id === 'sn_will') return { ...d, when: { ...d.when, notFlags: ['will_later'] }, options: d.options.map((o) => (o.id === 'later' ? { ...o, effects: { ...o.effects, flag: 'will_later' } } : o)) }
  // Moving out after a wedding is not a rented room with a sink in the corner.
  if (d.id === 'yg_leave_home') return { ...d, options: d.options.map((o) => (o.id === 'move' ? { ...o, line: 'Moved out of the family home into a rented place.' } : o)) }
  return d
}

const REMINDERS: readonly DecisionDef[] = [
  {
    id: 'sn3_retire_later',
    stage: 'senior',
    rarity: 'common',
    major: true,
    glyph: 'work',
    prompt: 'Still working at {age}. Retire now?',
    options: [
      { id: 'retire', label: 'Retire', line: 'Retired at last, with a cake and a card signed by everyone.', note: 'retirement', effects: { job: 'retire', stats: { happiness: 5 } } },
      { id: 'keep', label: 'Keep going', line: 'Kept working. The place would miss you.', note: 'working on' },
    ],
    default: 'keep',
    when: { job: true, flags: ['kept_working'], minAge: 65 },
  },
  {
    id: 'sn3_will_again',
    stage: 'senior',
    rarity: 'common',
    major: true,
    glyph: 'family',
    prompt: 'The will is still not written. Write it now?',
    options: [
      { id: 'split', label: 'Split it among the children', gate: { hasChildren: true }, gateReason: 'No children to leave it to.', line: 'Wrote a will at last, splitting everything among the children.', note: 'a will', effects: { will: 'split' } },
      { id: 'one', label: 'Leave it to one child', gate: { hasChildren: true }, gateReason: 'No children to leave it to.', line: 'Wrote a will at last, leaving everything to one child.', note: 'a will', effects: { will: 'one_child' } },
      { id: 'partner', label: 'Leave it to your partner', gate: { partner: true }, gateReason: 'No partner to leave it to.', line: 'Wrote a will at last, leaving everything to your partner.', note: 'a will', effects: { will: 'partner' } },
      { id: 'cause', label: 'Leave it to a good cause', line: 'Wrote a will at last, leaving everything to the animal shelter.', note: 'a will to a good cause', effects: { will: 'cause', flag: 'will_cause' } },
      { id: 'later', label: 'Leave it to the family', line: 'Left the will unwritten. The family can sort it out.', note: 'no will' },
    ],
    default: 'later',
    when: { will: false, flags: ['will_later'], minAge: 72 },
  },
]

const L = contentV2.lines

export const contentV3: PaperLivesCatalog = {
  ...contentV2,
  version: 3,
  events: [...contentV2.events, ...packEvents],
  // Thirty more small decisions make the draw a third bigger, so major ones weigh twice as much as the rest
  // and families, homes and wills come up about as often as before.
  decisions: [...contentV2.decisions.map(askOnce), ...packDecisions, ...REMINDERS].map((d) => ({ ...d, weight: (d.weight ?? 1) * (d.major ? 2 : 1) })),
  ambient: [...contentV2.ambient, ...packAmbient],
  // More of the lines the core writes itself, which a long life meets many times over.
  lines: {
    ...L,
    fallingOut: [
      ...L.fallingOut,
      'A row with {person} about the holiday that neither of you won.',
      'Not speaking to {person} for a whole weekend, over the bins.',
      'A sharp word with {person} about the car, and a long silence after.',
      'An argument with {person} that started with the dishwasher and went further.',
      'A row with {person} over Christmas plans. Both sulked, both said sorry.',
    ],
    reconcile: [...L.reconcile, 'Made it up with {person} over breakfast in bed.', 'Talked things through with {person} on a long drive.', '{Person} left a note on the kettle, and that was that.'],
    examGood: [...L.examGood, 'Good exam results, and a phone call to everyone who would listen.', 'Better marks than expected, and a new pen as a reward.'],
    examPoor: [...L.examPoor, 'The exams were a struggle. Passed the ones that mattered.', 'Average marks, and a long talk about what comes next.'],
    tightYear: [...L.tightYear, 'A careful year. Lists for everything, treats for nothing.', 'Counted every coin this year, and a few twice.'],
    friendDied: [...L.friendDied, '{Person} died. Kept the last birthday card on the shelf.', 'Lost {person}, a friend since the old days.', '{Person} died. Raised a glass at the wake to all the old stories.'],
    parentDied: [...L.parentDied, '{Person} died. Kept the old recipe book and used it every Sunday.', 'Lost {person}. The family sat up late swapping stories.'],
    siblingDied: [...L.siblingDied, '{Person} died. Kept their old scarf on the hook by the door.'],
    petDied: [...L.petDied, '{Pet} the {petKind} died in the night, curled up in the usual spot.'],
    childBorn: [
      ...L.childBorn,
      '{Person} arrived in the middle of a thunderstorm, perfectly calm.',
      'A baby, {person}, with a lot of hair and very firm opinions.',
      '{Person} was born just after midnight. Everyone slept through breakfast.',
      '{Person} arrived a week early, in a hurry to meet everyone.',
    ],
    grandchild: [
      ...L.grandchild,
      '{Parent} rang at dawn. A grandchild, {person}, and everyone well.',
      'Another grandchild, {person}, for {parent}. Knitted a blanket in a week.',
      '{Person} was born to {parent} on a bright morning. Visited with a casserole.',
      'A new grandchild, {person}. {Parent} looks very tired and very happy.',
    ],
    wedding: [...L.wedding, 'Married {person} at the register office, then a picnic by the river.', 'Married {person} on a sunny Saturday, in a borrowed car and a lot of confetti.'],
    proposal: [...L.proposal, '{Person} proposed on a walk, with a ring found in a coat pocket.', 'Engaged to {person}, after a proposal at the top of the lighthouse.'],
    meet: [...L.meet, 'Met {person} at a wedding, on the far side of the dance floor.', 'Met {person} in the bakery queue, over the last loaf.'],
  },
  jobs: contentV2.jobs.map((job) => {
    const needs = NEEDS[job.id]
    return needs ? { ...job, needs } : job
  }),
  tuning: {
    ...contentV2.tuning,
    eventPercent: { child: 36, teen: 36, young: 36, adult: 35, senior: 33 },
    yearEndEventPercent: 0,
    maxEventsPerYear: 4,
    adultJobsFirst: true,
  },
}
