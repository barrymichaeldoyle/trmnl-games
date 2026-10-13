import type { ContentCatalog, LostPropertyRule } from '../sim/core/types'
import { contentV20 } from './v20'

/*
 * Content catalog v21 (D145): lost property. A knockout outside the Office
 * drops a spare copy of one equipped item, with the owner's name on it, on
 * that floor; the hero keeps its own gear. Another player's hero may find it
 * in place of an ordinary loot gear find, rebuilt at base stats, and the owner
 * hears who found it. Everything else is v20.
 */
const lostProperty: LostPropertyRule = {
  lookPermille: 100,
  narrative: {
    dropped: 'Dropped a spare {item}.',
    found: ['Found a {item} with {rival} written on it in marker.', 'Found a {item} under a desk. The label says {rival}.', 'Fished a {item} out of lost property. Label: {rival}.'],
    foundCompact: "Found {rival}'s {item}.",
    returned: ['{rival} found your spare {item} in the {destination}.', '{rival} picked up your spare {item} in the {destination}.'],
    returnedCompact: '{rival} found your spare {item}.',
  },
}

export const contentV21: ContentCatalog = {
  ...contentV20,
  contentVersion: 'v21',
  lostProperty,
}
