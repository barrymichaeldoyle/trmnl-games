import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { Glyph } from '../../../lib/glyphs'
import { Button } from '../../../lib/ui'
import { useT } from '../../../lib/i18n'
import { dcHeroMessages } from '../../../i18n/dcHero'
import { Sheet, SheetTitle } from './-bagSlots'

/** How many names the floor's line shows before "and N others", as on the device. */
const LINE_NAMES = 3

/** D216: a floor's head count behind the people mark, for the world map. Nothing when nobody else is there. */
export function FloorCount({ others }: { others: number }) {
  const t = useT(dcHeroMessages)
  if (others <= 0) return null
  return (
    <span className="flex items-center gap-1 text-sm font-semibold tabular-nums" title={t.othersHere(others)}>
      <Glyph name="people" />
      <span aria-hidden="true">{others}</span>
      <span className="sr-only">{t.othersHere(others)}</span>
    </span>
  )
}

/**
 * D216: who else is on the hero's floor, from the last tick: three names and how many more, then everyone in a sheet,
 * each name linking to its public page while that page is open. Hidden while the hero travels or is alone.
 */
export function FloorCompany() {
  const { data } = useQuery(convexQuery(api.presence.here, {}))
  const t = useT(dcHeroMessages)
  const [open, setOpen] = useState(false)
  if (!data || data.others === 0) return null
  const line = data.named.length === 0 ? t.othersHere(data.others) : t.company(data.named.slice(0, LINE_NAMES).map((member) => member.name), data.others)
  const unnamed = data.others - data.named.length
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="flex min-w-0 items-start gap-2">
        <Glyph name="people" className="mt-1 text-sky-ink" />
        <span className="min-w-0 break-words"><span className="sr-only">{t.alsoHere}: </span>{line}</span>
      </p>
      {data.named.length > 0 ? <Button variant="quiet" className="min-h-11" onClick={() => setOpen(true)}>{t.seeEveryone}</Button> : null}
      <Sheet open={open} onClose={() => setOpen(false)} label={t.alsoHere}>
        <SheetTitle>{t.alsoHere}</SheetTitle>
        <ul className="mt-3 flex max-h-[60vh] flex-col overflow-y-auto">
          {data.named.map((member) => (
            <li key={member.name} className="flex min-h-11 flex-wrap items-baseline justify-between gap-x-3 border-t-2 border-dashed border-rule py-2 first:border-t-0">
              {member.profile ? <Link to="/desk-crawler/heroes/$alias" params={{ alias: member.name }} className="font-semibold underline decoration-dotted underline-offset-4">{member.name}</Link> : <span className="font-semibold">{member.name}</span>}
              <span className="text-sm text-muted tabular-nums">{t.heroAtLevel(member.heroName, member.level)}</span>
            </li>
          ))}
        </ul>
        {unnamed > 0 ? <p className="mt-2 text-sm text-muted">{t.unnamed(unnamed)}</p> : null}
        <Button allowOffline variant="secondary" className="mt-4 w-full" onClick={() => setOpen(false)}>{t.closeList}</Button>
      </Sheet>
    </div>
  )
}
