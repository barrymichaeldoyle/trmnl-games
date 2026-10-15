import { inked } from '@trmnl-games/engine/art/canvas'
import { monsterArt } from '@trmnl-games/desk-crawler/art/monsters'
import { FOE } from '@trmnl-games/desk-crawler/art/sceneColour'
import { useMemo } from 'react'
import { Glyph, SectionTitle } from '../../../lib/glyphs'
import { BIOME_SWATCH } from '../../../lib/palette'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { useContent } from '../../../lib/useContent'
import { dcPagesMessages } from '../../../i18n/dcPages'

/** heroes.mine's `lore` (D133): every floor with its note and its monsters' notes, each open or still a "?" slot. */
export type LoreView = {
  biomes: Array<{
    id: string
    name: string
    unlockLevel: number
    safe: boolean
    note: string | null
    open: boolean
    monsters: Array<{ id: string; name: string; wins: number; note: string | null; open: boolean }>
  }>
  open: number
  total: number
}

/** The page's ink for sprite outlines: the same night the painted scene uses. */
const INK = '#1b1530'

/**
 * A monster's 1-bit sprite as a crisp inline SVG, painted as the hero page paints it: outline in ink, paper in the
 * foe's fill, shades on the art's checker. A closed note shows the silhouette only, in the muted tone.
 */
function MonsterSprite({ id, open }: { id: string; open: boolean }) {
  const art = monsterArt[id as keyof typeof monsterArt]
  const paths = useMemo(() => {
    if (art === undefined) return null
    const tones = FOE[`monster:${id}`] ?? {}
    const cells: Record<string, string[]> = {}
    art.rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === ' ') return
        const black = inked(ch, x, y)
        if (black === null) return
        const colour = !open ? 'currentColor' : black ? (ch === '#' ? INK : (tones.shade?.[0] ?? INK)) : ch === 'w' ? (tones.paper ?? '#ffffff') : (tones.shade?.[1] ?? tones.paper ?? '#ffffff')
        if (!open && !black) return
        ;(cells[colour] ??= []).push(`M${x} ${y}h1v1h-1z`)
      }),
    )
    return Object.entries(cells).map(([colour, d]) => ({ colour, d: d.join('') }))
  }, [art, id, open])
  if (art === undefined || paths === null) return null
  const size = Math.max(art.width, art.height)
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${size} ${size}`} width="96" height="96" shapeRendering="crispEdges" className={`shrink-0 ${open ? '' : 'text-faint'}`}>
      <g transform={`translate(${Math.floor((size - art.width) / 2)} ${size - art.height})`}>
        {paths.map((path) => <path key={path.colour} fill={path.colour} d={path.d} />)}
      </g>
    </svg>
  )
}

/**
 * The Field notes page (D133): every floor in order with its note, open once the hero has stood there, then its four
 * monsters with their notes, open after the first win. A closed note is a "?" slot with the silhouette, the way
 * unearned achievements are; nothing here nudges, notifies or explains how to open one beyond the one line.
 */
export function FieldNotes({ lore, level }: { lore: LoreView; level: number }) {
  const t = useT(dcPagesMessages)
  const c = useContent()
  const locale = useLocale()
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section aria-labelledby="notes-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <SectionTitle id="notes-title" glyph="quest" as="h1">{t.notesTitle}</SectionTitle>
          <p className="text-sm text-muted tabular-nums">{t.notesCount(lore.open, lore.total)}</p>
        </div>
        <p className="text-sm">{t.notesIntro}</p>
      </section>

      {lore.biomes.map((biome) => {
        const id = `floor-${biome.id}`
        const locked = biome.unlockLevel > level
        const found = biome.monsters.filter((m) => m.open).length
        return (
          <section key={biome.id} aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <SectionTitle id={id} glyph="travel" tone="text-sky-ink">{c.name(biome.name)}</SectionTitle>
              <p className="text-sm text-muted tabular-nums">{t.monstersCount(found, biome.monsters.length)}</p>
            </div>
            <div className={`flex min-w-0 flex-col gap-2 border-[3px] px-3 py-3 min-[375px]:px-4 ${biome.open ? `border-night ${BIOME_SWATCH[biome.id] ?? 'bg-panel'}` : 'border-dashed border-faint text-muted'}`}>
              {biome.open && biome.note !== null ? (
                <p className="text-sm leading-relaxed">{c.text(biome.note)}</p>
              ) : (
                <p className="flex items-center gap-3 text-sm">
                  <span aria-hidden="true" className="hud grid size-8 shrink-0 place-items-center border-2 border-dashed border-faint text-hud-sm">?</span>
                  <span>{locked ? t.opensAt(biome.unlockLevel) : biome.safe ? t.everyHeroStarts : t.travelThere}</span>
                </p>
              )}
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {biome.monsters.map((monster) => (
                <li key={monster.id} className={`flex min-w-0 gap-3 border-[3px] px-3 py-3 ${monster.open ? 'border-night bg-panel' : 'border-dashed border-faint text-muted'}`}>
                  <MonsterSprite id={monster.id} open={monster.open} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                      <span>{monster.open ? c.name(monster.name) : '?'}</span>
                      {monster.open ? <span className="text-xs text-muted tabular-nums"><Glyph name="combat" size={12} className="mr-1 inline-block align-[-1px]" />{t.wins(formatNumber(locale, monster.wins), monster.wins)}</span> : null}
                    </p>
                    <p className="text-sm leading-relaxed">{monster.open && monster.note !== null ? c.text(monster.note) : t.beatOne}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
