import { fill, stripMarks } from '../sim/core/narrative'
import type { ContentCatalog, NumericCounter } from '../sim/core/types'
import type { AchievementDef, AchievementPredicate } from './achievements'

/**
 * D241: what a player does to earn an achievement, in plain words ("Defeat 25 Paper Imps", "Reach level 12"). The
 * catalog's names and blurbs are jokes; this line says how the badge is earned. It is built from the predicate, so it
 * can never drift from the rule, and every line is an English template the content dictionaries translate (the
 * monster lines are the to-do list's own).
 */
type Pair = readonly [one: string, many: string]

/** Counted deeds: the line for one, and the line for `{target}` of them. */
export const COUNTER_GOALS: Partial<Record<NumericCounter, Pair>> = {
  eliteWins: ['Beat an elite', 'Beat {target} elites'],
  jackpots: ['Hit a jackpot', 'Hit {target} jackpots'],
  rareFinds: ['Find your first rare piece of gear', 'Find {target} rare pieces of gear'],
  ticksExplored: ['Go on an adventure', 'Go on {target} adventures'],
  itemsFound: ['Find a piece of gear', 'Find {target} pieces of gear'],
  goldEarned: ['Earn {gold} gold in total', 'Earn {gold} gold in total'],
  deaths: ['Get knocked out', 'Get knocked out {target} times'],
  rescues: ['Get rescued from a lost fight', 'Get rescued from {target} lost fights'],
  retreats: ['Retreat from a fight', 'Retreat from {target} fights'],
  potionsUsed: ['Drink a potion', 'Drink {target} potions'],
  trapsAvoided: ['Dodge a trap', 'Dodge {target} traps'],
  restTicks: ['Take a break', 'Take {target} breaks'],
  trips: ['Travel to another floor', 'Travel to another floor {target} times'],
  itemsSold: ['Sell your first piece of gear', 'Sell {target} pieces of gear'],
  purchases: ['Buy from the merchant', 'Buy from the merchant {target} times'],
  merchantVisits: ['Meet the wandering merchant for the first time', 'Meet the wandering merchant {target} times'],
  stanceChanges: ["Change your hero's stance", "Change your hero's stance {target} times"],
  choicesMade: ['Answer a decision', 'Answer {target} decisions'],
  epicFinds: ['Find an epic piece of gear', 'Find {target} epic pieces of gear'],
  raidsWon: ['Win a desk raid', 'Win {target} desk raids'],
  raidsRepelled: ['Fight off a desk raid', 'Fight off {target} desk raids'],
  tasksCompleted: ['Finish a to-do task', 'Finish {target} to-do tasks'],
  itemsSalvaged: ['Salvage your first piece of gear', 'Salvage {target} pieces of gear'],
  gearUpgraded: ['Improve a piece of gear at the workbench', 'Improve gear at the workbench {target} times'],
  potionsCombined: ['Combine potions into a stronger one', 'Combine potions {target} times'],
  occasionsSeen: ['Be on duty for an office occasion', 'Be on duty for {target} office occasions'],
  raidMishaps: ['Be caught in a Friday the 13th raid that goes wrong', 'Be caught in a Friday the 13th raid that goes wrong'],
  meetings: ['Meet another hero on your floor', 'Meet other heroes {target} times'],
  lostPropertyFound: ["Find another hero's lost spare", 'Find {target} lost spares from other heroes'],
  standoffsWon: ['Beat an elite that has dug in', 'Beat {target} elites that have dug in'],
}

/** The Rogue's own counters (P37). */
export const ROGUE_GOALS: Partial<Record<NumericCounter, Pair>> = {
  raidsWon: ['Win a desk raid with your Rogue', 'Win {target} desk raids with your Rogue'],
  goldEarned: ['Earn {gold} gold with your Rogue', 'Earn {gold} gold with your Rogue'],
}

/** Every English line the goals use that is not a counter pair, for the dictionaries and their coverage test. */
export const OTHER_GOALS = {
  monsterOne: 'Defeat a {monster}',
  monsterMany: 'Defeat {target} {monsters}',
  everyMonster: 'Defeat every monster in the office at least once',
  everyBiome: 'Win a fight on every floor',
  biomeMonsters: 'Defeat {target} of each monster in the {biome}',
  level: 'Reach level {level}',
  bag: 'Own a bag with {capacity} slots',
  keepsakeOne: 'Collect a desk keepsake',
  keepsakeMany: 'Collect {target} desk keepsakes',
  rogueRecruit: 'Recruit a Rogue',
  rogueLevel: 'Reach level {level} with your Rogue',
} as const

/** English grouping, which the dictionaries' number variables read back ("10,000"). */
const n = (value: number) => value.toLocaleString('en-US')

function pick(pair: Pair | undefined, counter: string, target: number): string {
  if (!pair) throw new Error(`no achievement goal for counter ${counter}`)
  return fill(target === 1 ? pair[0] : pair[1], { target: n(target), gold: n(target) })
}

/** The English goal line for one predicate, names in bold marks as the stories store them (the translator matches on them); `goalText` shows it. */
export function goalOf(predicate: AchievementPredicate, content: ContentCatalog): string {
  switch (predicate.kind) {
    case 'counter':
      return pick(COUNTER_GOALS[predicate.counter], predicate.counter, predicate.atLeast)
    case 'monster': {
      const monster = content.monsters.find((m) => m.id === predicate.monsterId)
      const name = monster?.name ?? predicate.monsterId
      const plural = content.todo?.monsterPlurals[predicate.monsterId] ?? `${name}s`
      return predicate.atLeast === 1 ? fill(OTHER_GOALS.monsterOne, { monster: name }) : fill(OTHER_GOALS.monsterMany, { target: n(predicate.atLeast), monsters: plural })
    }
    case 'level':
      return fill(OTHER_GOALS.level, { level: n(predicate.atLeast) })
    case 'bag':
      return fill(OTHER_GOALS.bag, { capacity: n(predicate.atLeast) })
    case 'keepsakes':
      return predicate.atLeast === 1 ? OTHER_GOALS.keepsakeOne : fill(OTHER_GOALS.keepsakeMany, { target: n(predicate.atLeast) })
    case 'everyMonster':
      return OTHER_GOALS.everyMonster
    case 'everyBiome':
      return OTHER_GOALS.everyBiome
    case 'biomeMonsters': {
      const biome = content.biomes.find((b) => b.id === predicate.biomeId)
      return fill(OTHER_GOALS.biomeMonsters, { target: n(predicate.atLeast), biome: biome?.name ?? predicate.biomeId })
    }
    // Only the Rogue has class achievements so far; a second class needs its own lines.
    case 'classLevel':
      if (predicate.heroClass !== 'rogue') throw new Error(`no achievement goal for class ${predicate.heroClass}`)
      return predicate.atLeast <= 1 ? OTHER_GOALS.rogueRecruit : fill(OTHER_GOALS.rogueLevel, { level: n(predicate.atLeast) })
    case 'classCounter':
      if (predicate.heroClass !== 'rogue') throw new Error(`no achievement goal for class ${predicate.heroClass}`)
      return pick(ROGUE_GOALS[predicate.counter], predicate.counter, predicate.atLeast)
  }
}

export const achievementGoal = (def: AchievementDef, content: ContentCatalog): string => goalOf(def.predicate, content)

/** A goal as the reader sees it: translated, then without the bold marks. */
export const goalText = (goal: string, c: { text(english: string): string }): string => stripMarks(c.text(goal))
