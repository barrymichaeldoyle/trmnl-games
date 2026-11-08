import { describe, expect, it } from 'vitest'
import { catchesForSale } from '../../apps/web/src/lib/coolerSelection'

const catches = [{ id: 'ordinary', value: 10 }, { id: 'trophy', value: 50 }, { id: 'new', value: 12 }]
const actions = { ordinary: { mountCost: null }, trophy: { mountCost: 150 } }

describe('cooler sale review', () => {
  it('keeps trophy specimens out by default, including when mounting would be free', () => {
    expect(catchesForSale(catches, ['ordinary', 'trophy'], actions, false)).toEqual([catches[0]])
    expect(catchesForSale(catches, ['trophy'], { trophy: { mountCost: 0 } }, false)).toEqual([])
  })
  it('includes trophy specimens only when the player explicitly chooses to', () => {
    expect(catchesForSale(catches, ['ordinary', 'trophy'], actions, true)).toEqual(catches.slice(0, 2))
  })
  it('does not add new catches to an open review or resurrect catches sold elsewhere', () => {
    expect(catchesForSale(catches.slice(1), ['ordinary', 'trophy'], actions, true)).toEqual([catches[1]])
  })
  it('supports the original game without trophies and an empty cooler', () => {
    expect(catchesForSale(catches, ['ordinary'], undefined, false)).toEqual([catches[0]])
    expect(catchesForSale([], ['ordinary'], actions, true)).toEqual([])
  })
})
