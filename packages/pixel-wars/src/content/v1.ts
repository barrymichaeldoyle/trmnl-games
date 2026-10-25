import type { PixelWarsCatalog } from '../sim/types'

/**
 * Pixel Wars content v1 (pixel-wars.md "Rules"). Every number here is a starting mark the harness confirms
 * (tools/balance/pixel-wars.ts); the fade intervals, the underdog multiplier, the caps and the XP table are the knobs.
 */
export const contentV1: PixelWarsCatalog = {
  contentVersion: 'v1',
  factions: [
    { id: 1, key: 'ink', name: 'Ink', pattern: 'solid' },
    { id: 2, key: 'hatch', name: 'Hatch', pattern: 'hatch' },
    { id: 3, key: 'dots', name: 'Dots', pattern: 'dots' },
    { id: 4, key: 'weave', name: 'Weave', pattern: 'weave' },
  ],
  latticeSpacing: 3,
  maxSide: 64,
  cellInkCap: 3,
  deskInkCap: 5,
  fadeTicksByRank: [16, 24, 32, 48],
  deskFadeMultiplier: 2,
  underdogMultiplier: 2,
  leaderClaimsAtOne: true,
  liberateMultiplier: 3,
  wellCap: 48,
  dropsPerTick: 1,
  deskScoreWeight: 3,
  shield: { fromHour: 23, toHour: 7 },
  fullFactionPercent: 40,
  clearAfterDays: 14,
  xp: { heldCellPerHour: 1, flip: 5, deskTaken: 25, liberatedOwn: 15, liberatedOther: 10, deskFullHour: 2, seasonWon: 50 },
  goals: [
    { id: 'paint', title: 'Paint a cell', predicate: { kind: 'counter', counter: 'cellsPainted', at: 1 }, xp: 10 },
    { id: 'stamp', title: 'Stamp a cell your faction holds', predicate: { kind: 'counter', counter: 'stamps', at: 1 }, xp: 10 },
    { id: 'desk_full', title: 'Hold your desk full for an hour', predicate: { kind: 'counter', counter: 'deskFullHours', at: 1 }, xp: 15 },
    { id: 'flip', title: 'Take a cell from another faction', predicate: { kind: 'counter', counter: 'cellsFlipped', at: 1 }, xp: 25 },
    { id: 'invite', title: 'Invite a neighbour', predicate: { kind: 'counter', counter: 'invitesPlaced', at: 1 }, xp: 50 },
    { id: 'desk_taken', title: 'Take a desk', predicate: { kind: 'counter', counter: 'desksTaken', at: 1 }, xp: 50 },
    { id: 'liberate', title: 'Liberate a desk', predicate: { kind: 'counter', counter: 'desksLiberated', at: 1 }, xp: 50 },
    { id: 'season', title: 'Finish a season', predicate: { kind: 'counter', counter: 'seasonsPlayed', at: 1 }, xp: 100 },
    { id: 'win', title: 'Win a season', predicate: { kind: 'counter', counter: 'seasonsWon', at: 1 }, xp: 200 },
  ],
}
