import { useEffect, useRef, type ReactNode } from 'react'
import { BIG_CHANGE } from '@trmnl-games/paper-lives/sim/rules'
import type { LineChanges } from '@trmnl-games/paper-lives/sim/types'
import { composePortrait, type PortraitKey } from '@trmnl-games/paper-lives/art/portrait'
import { LocalTime } from './localTime'

/** The Life view (`api.paperLives.lives.view`), as the companion reads it. */
export interface LifeView {
  gameState: 'active' | 'deleting' | null
  life: {
    id: string
    ordinal: number
    activationState: 'pending_trmnl' | 'active'
    status: 'living' | 'paused' | 'ended'
    first: string
    last: string
    pronouns: 'they' | 'she' | 'he'
    canRename: boolean
    /** A first generation may change the surname too, while an infant (D182). */
    canRenameLast: boolean
    generation: number
    age: number
    stage: 'infant' | 'child' | 'teen' | 'young' | 'adult' | 'senior'
    traits: Array<{ id: string; name: string; blurb: string }>
    stats: { health: number; happiness: number; smarts: number; charm: number }
    gold: number
    publicProfile: boolean
    recap: string | null
    portrait: PortraitKey
  } | null
  year?: {
    elapsed: number
    minimum: number
    close: number
    season: 'spring' | 'summer' | 'autumn' | 'winter'
    yearEnd: boolean
    ageUpRequested: boolean
    minimumAt: number
    closesAt: number
    decision: {
      id: string
      prompt: string
      major: boolean
      chosen: string | null
      default: string
      options: Array<{ id: string; label: string; open: boolean; reason: string | null }>
    } | null
  } | null
  people?: Array<{ id: string; name: string; role: Role; label?: string; age: number; relationship: number; alive: boolean; step: 'dating' | 'engaged' | 'married' | null; history: string[] }>
  pet?: { name: string; kind: string; age: number; relationship: number } | null
  work?: {
    education: string
    job: { id: string; name: string; tier: number; since: number | null } | null
    retired: boolean
    income: number
    livingCost: number
    home: 'family' | 'renting' | 'owned'
    house: string | null
    will: 'split' | 'one_child' | 'partner' | 'cause' | null
    hobby: string | null
  }
  memorial?: { line: string | null; epitaph: string | null; recorded: boolean; heirs: Array<{ id: string; name: string; age: number }> } | null
  logs?: Array<{ id: string; at: number; kind: string; glyph: string; age: number; summary: string; remarkable: boolean; major: boolean; changes?: LineChanges | null }>
  nextTickAt?: number
}

export type Role = 'parent' | 'sibling' | 'partner' | 'former_partner' | 'child' | 'grandchild' | 'friend' | 'colleague'

export const ROLE_LABEL: Record<Role, string> = {
  parent: 'Parent',
  sibling: 'Sibling',
  partner: 'Partner',
  former_partner: 'Former partner',
  child: 'Child',
  grandchild: 'Grandchild',
  friend: 'Friend',
  colleague: 'Colleague',
}

export const STEP_LABEL = { dating: 'Going out', engaged: 'Engaged', married: 'Married' } as const

/** "girl" or "woman": the character's sex in a word for their age (D182); empty for a `they` life from before content v5. */
export const sexWord = (pronouns: 'they' | 'she' | 'he', age: number) => (pronouns === 'they' ? '' : pronouns === 'she' ? (age < 18 ? 'girl' : 'woman') : age < 18 ? 'boy' : 'man')

export const STAGE_LABEL = { infant: 'Infant', child: 'Child', teen: 'Teen', young: 'Young adult', adult: 'Adult', senior: 'Senior' } as const

export const EDUCATION_LABEL: Record<string, string> = { none: 'Not yet at school', school: 'At school', university: 'At university', degree: 'Degree', trade: 'Trade apprenticeship', work: 'Straight to work' }

export const HOME_LABEL = { family: 'The family home', renting: 'Renting', owned: 'Owns a home' } as const

export const WILL_LABEL = { split: 'Split among the children', one_child: 'All to one child', partner: 'All to the partner', cause: 'To a good cause' } as const

/** Plain numbers, as the game writes money: no currency sign. */
export const money = (n: number) => n.toLocaleString('en-GB')

const STAT_WORD = { health: 'Health', happiness: 'Happiness', smarts: 'Smarts', charm: 'Charm' } as const

/** "Health down · Happiness up a lot · Money +1,500": what a story line changed, as the device's marks say it (template v7). */
export function changeWords(changes: LineChanges | null | undefined): string | null {
  if (!changes) return null
  const words = (Object.keys(STAT_WORD) as Array<keyof typeof STAT_WORD>).flatMap((k) => {
    const delta = changes.stats?.[k]
    if (!delta) return []
    return [`${STAT_WORD[k]} ${delta > 0 ? 'up' : 'down'}${Math.abs(delta) >= BIG_CHANGE ? ' a lot' : ''}`]
  })
  if (changes.gold) words.push(`Money ${changes.gold > 0 ? '+' : '−'}${money(Math.abs(changes.gold))}`)
  return words.length > 0 ? words.join(' · ') : null
}

/**
 * The life's portrait, drawn from the same art as the device at a whole-number scale, so every pixel stays crisp.
 * Ink takes the page's text colour.
 */
export function Portrait({ portrait, scale = 4, label }: { portrait: PortraitKey; scale?: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const art = composePortrait(portrait)
  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = getComputedStyle(canvas).color
    for (let y = 0; y < art.height; y += 1) for (let x = 0; x < art.width; x += 1) if (art.ink[y * art.width + x]) context.fillRect(x * scale, y * scale, scale, scale)
  }, [art, scale])
  return <canvas ref={ref} width={art.width * scale} height={art.height * scale} role="img" aria-label={label} className="max-w-full text-ink [image-rendering:pixelated]" />
}

/** A photo taken with the weekly device code (L6): the character as they were that week. */
export interface PhotoView {
  name: string
  age: number
  petName: string | null
  takenAt: number
  portrait: PortraitKey
}

const photoDate = (date: Date) => date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

/** A row of photos with their captions: who, at what age, the pet beside them, and the week it was taken. */
export function Photos({ photos, label }: { photos: readonly PhotoView[]; label: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3">
      {photos.map((photo) => (
        <li key={photo.takenAt} className="flex flex-col items-center gap-1 border border-rule p-2 text-center text-sm">
          <Portrait portrait={photo.portrait} scale={2} label={`${photo.name} at ${photo.age}${photo.petName ? `, with ${photo.petName}` : ''}`} />
          <span className="font-semibold">{photo.age === 0 ? 'A baby' : `At ${photo.age}`}{photo.petName ? `, with ${photo.petName}` : ''}</span>
          <LocalTime at={photo.takenAt} format={photoDate} className="text-xs text-muted" />
        </li>
      ))}
    </ul>
  )
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The names a line may mention: the character, everyone in the life and the pet. Longest first, so "Ada" never splits "Adaeze". */
export function namesIn(view: Pick<LifeView, 'life' | 'people' | 'pet'>): string[] {
  const names = new Set<string>([view.life?.first ?? '', ...(view.people ?? []).map((p) => p.name), view.pet?.name ?? ''].filter(Boolean))
  return [...names].sort((a, b) => b.length - a.length)
}

/** A story line with the people and the pet in it set in bold. */
export function Named({ text, names }: { text: string; names: readonly string[] }): ReactNode {
  if (names.length === 0) return text
  const pattern = new RegExp(`(?<![\\p{L}])(${names.map(escape).join('|')})(?![\\p{L}])`, 'gu')
  const parts = text.split(pattern)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold text-ink">{part}</strong> : part))
}
