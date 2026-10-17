import { describe, expect, it } from 'vitest'
import { contentV1, contentV2 } from '@trmnl-games/idle-angler/content'
import { starterAngler, type AnglerState, type IdleAnglerCatalog, type WaterId } from '@trmnl-games/idle-angler/sim'
import { nextAccess } from '@trmnl-games/idle-angler/sim/shop'

/** Every species of the named waters in the logbook, so each water's logbook gate is met. */
const logged = (content: IdleAnglerCatalog, waters: readonly WaterId[]) =>
  Object.fromEntries(content.species.filter((s) => waters.includes(s.water)).map((s) => [s.id, { count: 1, bestGrams: 100, firstTick: 1 }]))

const onSale = (content: IdleAnglerCatalog, angler: Partial<AnglerState>) => nextAccess(content, { ...starterAngler(content, 0), ...angler }).map((a) => a.id)

describe('passes on sale (issue #7)', () => {
  for (const [name, content] of [['v1', contentV1], ['v2', contentV2]] as const) {
    it(`offers a new angler only the Waders under ${name}`, () => {
      expect(onSale(content, {})).toEqual(['waders'])
    })
  }

  it('offers both passes that open off River Bend once River Bend can be fished', () => {
    // River Bend's logbook gate is still unmet, so nothing past it is on sale yet.
    expect(onSale(contentV2, { access: ['waders'] })).toEqual([])
    expect(onSale(contentV2, { access: ['waders'], logbook: logged(contentV2, ['millpond']) })).toEqual(['pier_permit', 'rowing_boat'])
    expect(onSale(contentV1, { access: ['waders'], logbook: logged(contentV1, ['millpond']) })).toEqual(['pier_permit'])
  })

  it('offers the Pier Permit to an angler who bought the Rowing Boat first, and the Ice Auger once Heron Lake is fishable', () => {
    const book = logged(contentV2, ['millpond', 'river_bend'])
    expect(onSale(contentV2, { access: ['waders', 'rowing_boat'], logbook: book })).toEqual(['pier_permit', 'ice_auger'])
  })

  it('offers nothing once every pass is owned', () => {
    expect(onSale(contentV2, { access: contentV2.access.map((a) => a.id), logbook: logged(contentV2, ['millpond', 'river_bend', 'heron_lake']) })).toEqual([])
    expect(onSale(contentV1, { access: ['waders', 'pier_permit'] })).toEqual([])
  })
})
