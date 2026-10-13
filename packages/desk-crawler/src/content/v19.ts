import type { ContentCatalog, OccasionRule } from '../sim/core/types'
import { contentV18 } from './v18'

/*
 * Content catalog v19 (D139): world events as an office calendar.
 *
 * Eighteen occasions on fixed date rules, live over the hero's local days
 * (the owner's last TRMNL offset, UTC without one). The hero's first
 * evaluation inside one logs a line naming it, and while it lasts its one
 * effect applies: a modifier, Black Friday's merchant prices and odds,
 * Christmas's gift, or Friday the 13th's raid mishaps. Order decides between
 * overlapping occasions. Dressing for the scene is chosen while the screen is
 * served and is not part of the catalog. Everything else is v18.
 */
const occasions: readonly OccasionRule[] = [
  {
    id: 'christmas',
    name: 'Christmas',
    date: { kind: 'fixed', month: 12, day: 24 },
    days: 3,
    effectLabel: 'One wrapped gift: gear from this floor',
    effect: { gift: { lines: ['Unwrapped a Secret Santa gift.', 'Found a gift with your name on it under the tree.'] } },
    lines: ['Tinsel on every monitor. The office party is tonight.', 'Someone put a tree by the printer. Snow outside the window.'],
  },
  {
    id: 'new_year',
    name: 'New Year',
    date: { kind: 'fixed', month: 12, day: 31 },
    days: 2,
    effectLabel: '+20% XP',
    effect: { modifiers: { xpPct: 20 } },
    lines: ['Party hats on. The New Year countdown is on the whiteboard.', 'New Year resolutions pinned to the corkboard.'],
  },
  {
    id: 'halloween',
    name: 'Halloween',
    date: { kind: 'fixed', month: 10, day: 31 },
    days: 1,
    effectLabel: '+15% gold',
    effect: { modifiers: { goldPct: 15 } },
    lines: ['Someone has hung cobwebs over the printer.', 'A carved pumpkin on reception. The monsters came in costume.'],
  },
  {
    id: 'friday_13th',
    name: 'Friday the 13th',
    date: { kind: 'friday_13th' },
    days: 1,
    effectLabel: 'Every desk raid goes wrong',
    effect: {
      raidMishap: {
        launchPct: 200,
        hpPct: 20,
        goldLossPct: 5,
        raider: [
          "The sprinkler went off over {rival}'s desk mid-raid. You both got soaked.",
          "The fire drill started halfway through raiding {rival}. You both lost out.",
          "Spilled coffee over {rival}'s keyboard and yours. The loot went in the shredder.",
        ],
        target: [
          '{rival} came to raid the desk just as a ceiling tile came down on you both.',
          '{rival} tried a raid during the fire drill. You both lost out.',
          "{rival}'s raid knocked coffee over both keyboards. The shredder ate the loot.",
        ],
      },
    },
    lines: ['Friday the 13th. A black cat is sitting on the photocopier.', 'Friday the 13th. The lights keep flickering.'],
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    date: { kind: 'nth_weekday', month: 11, weekday: 4, nth: 4 },
    days: 1,
    effectLabel: 'Heal 5% of max HP after each win',
    effect: { modifiers: { healOnVictoryPct: 5 } },
    lines: ['Thanksgiving potluck in the break room. Three people brought pie.', 'Paper turkeys taped to every cubicle.'],
  },
  {
    id: 'black_friday',
    name: 'Black Friday',
    date: { kind: 'nth_weekday', month: 11, weekday: 4, nth: 4, offsetDays: 1 },
    days: 1,
    effectLabel: 'Merchant prices −50%, twice as many visits',
    effect: { merchantPricePct: 50, merchantWeightPct: 200 },
    lines: ['Black Friday. SALE signs on every door.', 'Black Friday. The merchant has marked everything down.'],
  },
  {
    id: 'diwali',
    name: 'Diwali',
    date: { kind: 'table', dates: ['2026-11-08', '2027-10-29', '2028-10-17', '2029-11-05', '2030-10-26', '2031-11-14'] },
    days: 1,
    effectLabel: '+15% XP',
    effect: { modifiers: { xpPct: 15 } },
    lines: ['Clay lamps along every window ledge for Diwali.', 'A rangoli by the lifts and sweets on every desk for Diwali.'],
  },
  {
    id: 'lunar_new_year',
    name: 'Lunar New Year',
    date: { kind: 'table', dates: ['2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03', '2031-01-23', '2032-02-11', '2033-01-31', '2034-02-19', '2035-02-08', '2036-01-28'] },
    days: 1,
    effectLabel: '+15% gold',
    effect: { modifiers: { goldPct: 15 } },
    lines: ['Red lanterns over the corridor for Lunar New Year.', 'A red envelope on every desk for Lunar New Year.'],
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    date: { kind: 'fixed', month: 2, day: 14 },
    days: 1,
    effectLabel: '+10% attack and defense',
    effect: { modifiers: { attackPct: 10, defensePct: 10 } },
    lines: ["A string of paper hearts over the water cooler.", "An unsigned Valentine's card on the desk."],
  },
  {
    id: 'pi_day',
    name: 'Pi Day',
    date: { kind: 'fixed', month: 3, day: 14 },
    days: 1,
    effectLabel: '+14% XP',
    effect: { modifiers: { xpPct: 14 } },
    lines: ['Pi Day. Someone wrote 3.14159 on the whiteboard and brought a pie.', 'Pi Day. A pie in the break room, cut into very uneven slices.'],
  },
  {
    id: 'st_patricks',
    name: "St Patrick's Day",
    date: { kind: 'fixed', month: 3, day: 17 },
    days: 1,
    effectLabel: '+15% gold',
    effect: { modifiers: { goldPct: 15 } },
    lines: ["Shamrock bunting over the cubicles for St Patrick's Day.", "A pot of gold coins on reception for St Patrick's Day."],
  },
  {
    id: 'easter',
    name: 'Easter',
    date: { kind: 'easter', offsetDays: -2 },
    days: 4,
    effectLabel: '+15% gold',
    effect: { modifiers: { goldPct: 15 } },
    lines: ['Chocolate eggs hidden around the office for Easter.', 'An Easter egg hunt is on. One egg is in the server cupboard.'],
  },
  {
    id: 'april_fools',
    name: "April Fools' Day",
    date: { kind: 'fixed', month: 4, day: 1 },
    days: 1,
    lines: ["April Fools'. Someone set the stapler in jelly.", "April Fools'. A whoopee cushion on the desk chair."],
  },
  {
    id: 'dog_day',
    name: 'Take Your Dog to Work Day',
    date: { kind: 'nth_weekday', month: 6, weekday: 0, nth: 3, offsetDays: 5 },
    days: 1,
    effectLabel: '+10% defense',
    effect: { modifiers: { defensePct: 10 } },
    lines: ['Take Your Dog to Work Day. A spaniel is guarding the desk.', 'Take Your Dog to Work Day. Water bowls in every corridor.'],
  },
  {
    id: 'pirate_day',
    name: 'Talk Like a Pirate Day',
    date: { kind: 'fixed', month: 9, day: 19 },
    days: 1,
    lines: ['Talk Like a Pirate Day. The stand-up was all "arr".', 'Talk Like a Pirate Day. A paper parrot on the monitor.'],
  },
  {
    id: 'coffee_day',
    name: 'International Coffee Day',
    date: { kind: 'fixed', month: 10, day: 1 },
    days: 1,
    effectLabel: '+10% attack',
    effect: { modifiers: { attackPct: 10 } },
    lines: ['International Coffee Day. The good beans are out.', 'International Coffee Day. A queue at the coffee machine since seven.'],
  },
  {
    id: 'bosses_day',
    name: "Boss's Day",
    date: { kind: 'fixed', month: 10, day: 16 },
    days: 1,
    lines: ["Boss's Day. A \"World's Best Boss\" banner over the corner office.", "Boss's Day. A card for the boss is going round the desks."],
  },
  {
    id: 'leap_day',
    name: 'Leap Day',
    date: { kind: 'fixed', month: 2, day: 29 },
    days: 1,
    effectLabel: '+29% gold',
    effect: { modifiers: { goldPct: 29 } },
    lines: ['Leap Day. An extra square on the wall calendar.', 'Leap Day. A frog is sitting on the filing cabinet.'],
  },
]

export const contentV19: ContentCatalog = {
  ...contentV18,
  contentVersion: 'v19',
  occasions,
  // A mishap is taking part in a raid too; it counts apart from launches so the win/loss record stays exact.
  career: {
    rungs: contentV18.career!.rungs.map((rung) =>
      rung.id === 'first_raid' && rung.predicate.kind === 'anyCounter' ? { ...rung, predicate: { ...rung.predicate, counters: [...rung.predicate.counters, 'raidMishaps'] } } : rung,
    ),
  },
}
