import { keepsakeWeek, keepsakeWeekStartsAt } from '@trmnl-games/engine/calendar'

/**
 * Pressed flowers (little-plot.md "Staying on the TRMNL"): one a week for entering the code the TRMNL shows, the D46
 * rules. Twenty-four make the set; after that each comes round again. Cosmetic only. The newest hangs in the shed
 * window on the device.
 */
export interface FlowerDef {
  readonly id: string
  readonly name: string
}

export const FLOWERS: readonly FlowerDef[] = [
  { id: 'forget_me_not', name: 'Forget-me-not' },
  { id: 'buttercup', name: 'Buttercup' },
  { id: 'primrose', name: 'Primrose' },
  { id: 'bluebell', name: 'Bluebell' },
  { id: 'cowslip', name: 'Cowslip' },
  { id: 'speedwell', name: 'Speedwell' },
  { id: 'red_campion', name: 'Red Campion' },
  { id: 'harebell', name: 'Harebell' },
  { id: 'meadowsweet', name: 'Meadowsweet' },
  { id: 'honeysuckle', name: 'Honeysuckle' },
  { id: 'dog_rose', name: 'Dog Rose' },
  { id: 'scabious', name: 'Scabious' },
  { id: 'knapweed', name: 'Knapweed' },
  { id: 'yarrow', name: 'Yarrow' },
  { id: 'heather', name: 'Heather' },
  { id: 'ox_eye_daisy', name: 'Ox-eye Daisy' },
  { id: 'wild_thyme', name: 'Wild Thyme' },
  { id: 'violet', name: 'Violet' },
  { id: 'celandine', name: 'Celandine' },
  { id: 'ragged_robin', name: 'Ragged Robin' },
  { id: 'toadflax', name: 'Toadflax' },
  { id: 'teasel', name: 'Teasel' },
  { id: 'snowdrop', name: 'Snowdrop' },
  { id: 'winter_aconite', name: 'Winter Aconite' },
]

export const flowerWeek = keepsakeWeek
export const flowerWeekStartsAt = keepsakeWeekStartsAt

/** The flower the nth claim gives (1-based); the set repeats after 24. */
export const flowerForClaim = (total: number): FlowerDef => FLOWERS[(Math.max(1, total) - 1) % FLOWERS.length]!

/** The book: each flower with how many times it has been pressed. */
export function flowerBook(total: number): Array<FlowerDef & { count: number }> {
  return FLOWERS.map((f, i) => ({ ...f, count: Math.max(0, Math.floor((total - 1 - i) / FLOWERS.length) + 1) }))
}
