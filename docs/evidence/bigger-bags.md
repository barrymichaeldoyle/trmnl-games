# Bigger bags evidence (D146, content v22)

Built 2026-10-13. [Spec](../inventory.md#cadence-and-capacity). Not yet live: production switches to v22 between runs after the deploy.

## Rules and bounds

- `tests/sim/bigger-bags.test.ts`: v22 is a valid catalog whose first five bag tiers are v21's. The Gym Duffel (24, 4,000 gold), Steamer Trunk (28, 10,000) and Stationery Cupboard (32, 20,000) are sold in order at any level, and v21 still ends at the Rolling Suitcase. A full 32-slot bag with every potion and material row (40 rows) passes the invariants and holds the next find. A hero past `MAX_INVENTORY_ROWS` (48) fails loudly. The validator refuses a top bag larger than one sale (`BATCH_ITEMS`, 32). One career rung is appended, and a hero who finished the v21 ladder gets it as its goal.
- `tests/convex/bigger-bags.test.ts`: the Bag page offers the three tiers in order and refuses one out of order. A 33-item bag is read whole, a 33-item sale is refused, and a 32-item sale goes through.
- `tests/sim/achievements.test.ts`: Bigger bags earns at 24, 28 and 32.
- `tests/sim/workbench.test.ts` and `tests/web/bag-selection.test.ts` read the bounds from the constants instead of 32 and 30.

## Progress

`pnpm balance --heroes 100 --days 90 --content v22` against the same run on v21 (JSON: [v22](balance-v22-bigger-bags-90-days.json), [v21 baseline](balance-v21-baseline-90-days.json)). Visiting cohorts buy the bags up to the Rolling Suitcase as before, then the workbench steps. The three new bags wait until both equipped pieces are at +3, as a player who wants power first would do. The merchant's discounted next bag is bought whenever it's affordable, as before. A new cohort, seven-day-bags-first, buys every bag before the workbench.

| Cohort | Gym Duffel (24) | Steamer Trunk (28) | Stationery Cupboard (32) | Day-90 gold: v21 → v22 | Day-90 level: v21 → v22 | Sleeping share: v21 → v22 |
| --- | --- | --- | --- | --- | --- | --- |
| Daily | 50.1d | 53.8d | 78.0d | 38,647 → 18,985 | 46 → 46 | 0% → 0% |
| Three-day | 51.5d | 60.4d | 81.6d | 35,986 → 15,188 | 44 → 45 | 1.9% → 1.5% |
| Seven-day | 84.4d | >90d | >90d | 11,518 → 8,356 | 34 → 34 | 39.1% → 38.0% |
| Undergeared three-day | 66.2d | 75.1d | >90d | 23,697 → 15,292 | 41 → 41 | 1.9% → 1.6% |
| Seven-day, bags first | 42.2d | 56.3d | 77.3d | — → 9,067 | — → 37 | — → 27.6% |
| Unattended, safe-farming | never | never | never | unchanged | unchanged | unchanged |

What it shows:

- **The sink works where it was aimed.** Daily and three-day managers finish the workbench around day 40 to 45 and then bank about 650 gold a day. The three bags take 34,000 of that. Day-90 gold falls by about half, and the cupboard lands in the last fortnight of the quarter.
- **Levels don't move** for any cohort that buys power first: level 12 is reached on the same day and day-90 levels are equal (three-day 44 → 45 is noise). Bags change how much gear a hero can hold, not how it fights.
- **Weekly visitors get the most from a bigger bag.** If a seven-day hero buys bags before the workbench, its sleeping share falls from 38% to 28% and it ends the quarter three levels higher (37 against 34), but it reaches +3 much later. That's a real choice for the player, and the Bag page leaves it to them.
- **Day-30 gold is a little lower for daily managers** (6,231 → 5,510). That's the merchant: its discounted next bag is now the Gym Duffel at 3,000 gold for a hero holding the Rolling Suitcase. The harness takes the offer whenever it's affordable, so a few heroes buy the Duffel before the workbench is done, and +3 armour lands about two days later (39.8 → 41.7 days).
- Unattended and safe-farming heroes never reach the new prices. Nothing about the first weeks changes.

## Bounds

| Bound | Before | v22 |
| --- | --- | --- |
| Rows a hero can hold | 29 (20 bag + 2 equipped + 1 held + 3 potions + 3 materials) | 41 (32 bag) |
| `MAX_INVENTORY_ROWS` (invariant, validator) | 32 | 48 |
| Backend item reads (`INVENTORY_READ`) | 40 | 56 (the bound + 8, so an over-full hero fails `INVENTORY_SIZE` instead of being truncated) |
| `sellMany`, `salvageMany`, companion selection (`BATCH_ITEMS`) | 30 | 32 (the top bag in one sale; the validator holds it there) |

The device's bag count is two digits either way ("bag 32/32"), so no template changed.

## Checks

- `pnpm check`: typecheck and 779 tests pass (104 files).
