import type { ContentCatalog } from '../sim/core/types'
import { contentV12 } from './v12'

/*
 * Content catalog v13 (D129): salvage and the workbench.
 *
 * Gold had no sink after week two (docs/salvage.md). Beside Sell, bag gear can
 * be stripped for materials: Scrap from common, Parts from uncommon,
 * Components from rare and epic, the found tier in units (epic three times
 * that). The workbench spends materials plus gold on an owned item, in place:
 * Mk II and Mk III raise it a gear tier within its slot, then +1 to +3
 * reinforcement on the top tier; rare and epic gear can have an affix fitted
 * by choice. Nothing is drawn, nothing is automatic; the simulator reads the
 * stats copied onto the item as it always has. Three rungs join the ladder.
 * Everything else is v12.
 */
export const contentV13: ContentCatalog = {
  ...contentV12,
  contentVersion: 'v13',
  workbench: {
    materials: [
      { id: 'scrap', name: 'Scrap', rarities: ['common'], glyph: 'scrap' },
      { id: 'parts', name: 'Parts', rarities: ['uncommon'], glyph: 'parts' },
      { id: 'components', name: 'Components', rarities: ['rare', 'epic'], glyph: 'components' },
    ],
    epicYieldMultiplier: 3,
    steps: [
      { kind: 'tier', toTier: 2, gold: 150, materials: { scrap: 6 } },
      { kind: 'tier', toTier: 3, gold: 500, materials: { scrap: 6, parts: 4 } },
      { kind: 'reinforce', to: 1, gold: 1000, materials: { scrap: 8, parts: 2 } },
      { kind: 'reinforce', to: 2, gold: 3000, materials: { scrap: 12, parts: 4, components: 1 } },
      { kind: 'reinforce', to: 3, gold: 8000, materials: { scrap: 16, parts: 6, components: 2 } },
    ],
    affix: { gold: 1500, materials: { components: 2 } },
  },
  career: {
    rungs: [
      ...contentV12.career!.rungs,
      { id: 'first_salvage', title: 'Salvage a piece of gear', blurb: 'Spare gear can be stripped for parts on the Bag page instead of sold. The workbench runs on them.', predicate: { kind: 'counter', counter: 'itemsSalvaged', atLeast: 1 }, gold: 60, companion: true },
      { id: 'first_upgrade', title: 'Upgrade a piece of gear', blurb: 'The workbench on the Bag page raises what your hero wears, for materials and gold.', predicate: { kind: 'counter', counter: 'gearUpgraded', atLeast: 1 }, gold: 80, companion: true },
      { id: 'reinforce_3', title: 'Reinforce an item to +3', blurb: 'The last three steps on the workbench. Components are the slow part.', predicate: { kind: 'counter', counter: 'topReinforcement', atLeast: 3 }, gold: 150, companion: true },
    ],
  },
}
