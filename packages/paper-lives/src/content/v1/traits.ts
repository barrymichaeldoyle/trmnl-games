import type { TraitDef } from '../../sim/types'

/** Sixteen traits (paper-lives.md "The life and its starting state"). Each tilts one drift and gates content. */
export const traits: readonly TraitDef[] = [
  { id: 'curious', name: 'Curious', blurb: 'Asks how things work. Smarts grow a little each year until 25.', reveal: 'Into every cupboard in the house, and out again with the saucepans.', tilt: { kind: 'stat', stat: 'smarts', perYear: 1, untilAge: 25 } },
  { id: 'stubborn', name: 'Stubborn', blurb: 'Will not be told. Hangs on longer in old age.', reveal: 'Refuses the blue cup. Only the green cup will do.', tilt: { kind: 'mortality', percent: 70, fromAge: 70, untilAge: 130 } },
  { id: 'bookish', name: 'Bookish', blurb: 'Happiest with a book. Smarts grow a little each year until 22.', reveal: 'Chews the corners off every picture book in reach.', tilt: { kind: 'stat', stat: 'smarts', perYear: 1, untilAge: 22 } },
  { id: 'sunny', name: 'Sunny', blurb: 'Finds the good in a wet week. Happiness settles higher.', reveal: 'Laughs at the hoover, the post and the neighbour’s cat.', tilt: { kind: 'happiness', target: 8 } },
  { id: 'shy', name: 'Shy', blurb: 'Warms up slowly. Less likely to meet someone new.', reveal: 'Hides behind {parent} whenever the doorbell goes.', tilt: { kind: 'meet', percent: 40 } },
  { id: 'restless', name: 'Restless', blurb: 'Always wants the next thing. Happiness settles a little lower.', reveal: 'Climbs out of the cot, then out of the playpen.', tilt: { kind: 'happiness', target: -5 } },
  { id: 'thrifty', name: 'Thrifty', blurb: 'Knows the price of bread. Living costs a little less.', reveal: 'Keeps every button found on the carpet in a jam jar.', tilt: { kind: 'cost', percent: 90 } },
  { id: 'generous', name: 'Generous', blurb: 'Gives the last biscuit away. Living costs a little more.', reveal: 'Hands out toys to every visitor, then wants them back.', tilt: { kind: 'cost', percent: 110 } },
  { id: 'hardy', name: 'Hardy', blurb: 'Rarely ill. Health declines more slowly with age.', reveal: 'Shrugs off the cold the whole street had.', tilt: { kind: 'health', percent: 60 } },
  { id: 'delicate', name: 'Delicate', blurb: 'Catches everything going. Health declines faster with age.', reveal: 'Sneezes at the dog, the dust and the first frost.', tilt: { kind: 'health', percent: 150 } },
  { id: 'tidy', name: 'Tidy', blurb: 'A place for everything. Health holds up a little better.', reveal: 'Lines the wooden blocks up by colour before bed.', tilt: { kind: 'health', percent: 75 } },
  { id: 'dreamy', name: 'Dreamy', blurb: 'Away with the clouds. Earns a little less.', reveal: 'Stares at the curtains for an hour and seems content.', tilt: { kind: 'income', percent: 88 } },
  { id: 'sharp', name: 'Sharp', blurb: 'Quick with numbers. Earns a little more.', reveal: 'Counts the stairs every time, and corrects anyone who miscounts.', tilt: { kind: 'income', percent: 110 } },
  { id: 'gentle', name: 'Gentle', blurb: 'Kind to small things. Charm grows a little each year until 25.', reveal: 'Carries a woodlouse outside rather than squash it.', tilt: { kind: 'stat', stat: 'charm', perYear: 1, untilAge: 25 } },
  { id: 'lucky', name: 'Lucky', blurb: 'Things tend to work out. Less risk of dying before 80.', reveal: 'Falls off the sofa and lands on the beanbag.', tilt: { kind: 'mortality', percent: 60, fromAge: 0, untilAge: 80 } },
  { id: 'loyal', name: 'Loyal', blurb: 'Sticks by people. Relationships fade half as fast.', reveal: 'Will not sleep without the same worn rabbit.', tilt: { kind: 'relationshipDrift', percent: 50 } },
]
