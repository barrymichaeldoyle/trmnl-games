import type { ContentCatalog, EffectRule, MeetingRule } from '../sim/core/types'
import { contentV19 } from './v19'

/*
 * Content catalog v20 (D141): meetings. On an exploring tick, when no raid
 * happens, a hero may meet another hero on its floor instead of an encounter:
 * the same chance for every stance, from level 2. Both heroes get the kind's
 * boon for 8 adventures from their own application tick; nothing changes
 * hands and nobody can lose. Five new boons; the shared lunch reuses Well fed.
 * The scene's prop for each kind lives with the art (art/props.ts).
 * Everything else is v19.
 */
const meetingEffects: readonly EffectRule[] = [
  { id: 'caffeinated', name: 'Caffeinated', blurb: 'Hits a little harder after a coffee with a coworker.', kind: 'boon', durationTicks: 8, modifiers: { attackPct: 10 } },
  { id: 'inspired', name: 'Inspired', blurb: "Learns a little more from each win after a coworker's war story.", kind: 'boon', durationTicks: 8, modifiers: { xpPct: 10 } },
  { id: 'shown_the_ropes', name: 'Shown the ropes', blurb: 'A coworker showed the way past the traps; they hurt less.', kind: 'boon', durationTicks: 8, modifiers: { trapDamagePct: 30 } },
  { id: 'backed_up', name: 'Backed up', blurb: 'A pep talk from a coworker; defense is up.', kind: 'boon', durationTicks: 8, modifiers: { defensePct: 10 } },
  { id: 'in_the_loop', name: 'In the loop', blurb: 'Heard where the loose change is; a little more gold.', kind: 'boon', durationTicks: 8, modifiers: { goldPct: 10 } },
]

const meetings: MeetingRule = {
  launchPermille: 5,
  cooldownTicks: 48,
  kinds: [
    {
      id: 'coffee_run',
      name: 'Coffee run',
      effectId: 'caffeinated',
      starter: ['Grabbed a coffee with {rival} by the machine.', 'Queued at the coffee machine with {rival}.'],
      partner: ['{rival} dragged you out for a coffee.', '{rival} bought the coffees.'],
      compact: 'Coffee with {rival}.',
    },
    {
      id: 'war_stories',
      name: 'War stories',
      effectId: 'inspired',
      starter: ['Swapped war stories with {rival} at the printer.', '{rival} told the one about the Stapler Mimic.'],
      partner: ['{rival} had a story about the Stapler Mimic.', 'Traded war stories with {rival} by the printer.'],
      compact: 'War stories with {rival}.',
    },
    {
      id: 'shared_lunch',
      name: 'Shared lunch',
      effectId: 'well_fed',
      starter: ['Split a sandwich with {rival} in the break room.', 'Ate lunch with {rival} at the long table.'],
      partner: ['{rival} shared their lunch.', '{rival} pulled up a chair at lunch.'],
      compact: 'Lunch with {rival}.',
    },
    {
      id: 'shortcut',
      name: 'Shortcut',
      effectId: 'shown_the_ropes',
      starter: ['{rival} showed you a shortcut past the shredders.', '{rival} pointed out the loose floor tiles.'],
      partner: ['Showed {rival} the way past the shredders.', 'Warned {rival} about the loose floor tiles.'],
      compact: 'A shortcut from {rival}.',
    },
    {
      id: 'pep_talk',
      name: 'Pep talk',
      effectId: 'backed_up',
      starter: ['{rival} gave you a pep talk at the whiteboard.', '{rival} drew a battle plan on the whiteboard.'],
      partner: ['Gave {rival} a pep talk at the whiteboard.', 'Drew {rival} a battle plan on the whiteboard.'],
      compact: 'A pep talk with {rival}.',
    },
    {
      id: 'office_gossip',
      name: 'Office gossip',
      effectId: 'in_the_loop',
      starter: ['Caught up on office gossip with {rival}.', 'Heard the news from the fourth floor from {rival}.'],
      partner: ['{rival} had gossip from the water cooler.', 'Told {rival} the news from the fourth floor.'],
      compact: 'Gossip with {rival}.',
    },
  ],
}

export const contentV20: ContentCatalog = {
  ...contentV19,
  contentVersion: 'v20',
  effects: [...contentV19.effects!, ...meetingEffects],
  meetings,
  unlocks: { ...contentV19.unlocks!, meetings: 2 },
}
