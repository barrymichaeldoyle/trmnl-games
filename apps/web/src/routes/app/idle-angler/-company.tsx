import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { Glyph } from '../../../lib/glyphs'
import { useAngler } from '../../../lib/idleAngler'
import { Button } from '../../../lib/ui'
import { useT } from '../../../lib/i18n'
import { iaDock } from '../../../i18n/iaDock'
import { Sheet, SheetTitle } from '../desk-crawler/-bagSlots'

/** How many names the water's line shows before "and N others", as on the device. */
const LINE_NAMES = 3

/** D220: a water's head count behind the people mark, for the Waters card. Nothing when nobody else is there. */
export function WaterCount({ others }: { others: number }) {
  const t = useT(iaDock)
  if (others <= 0) return null
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums" title={t.othersHere(others)}>
      <Glyph name="people" />
      <span aria-hidden="true">{others}</span>
      <span className="sr-only">{t.othersHere(others)}</span>
    </span>
  )
}

/**
 * D220: who else fishes the angler's water, from the last tick, as Desk Crawler's floors (D216): three names and how
 * many more, then everyone in a sheet with their standing there, each name linking to its public page while that page
 * is open. Hidden while the angler is paused or heading elsewhere, and when nobody else is there.
 */
export function WaterCompany() {
  const { data } = useQuery(convexQuery(api.idleAngler.presence.here, {}))
  const t = useT(iaDock)
  const words = useAngler()
  const [open, setOpen] = useState(false)
  if (!data || data.others === 0) return null
  const line = data.named.length === 0 ? t.othersHere(data.others) : t.company(data.named.slice(0, LINE_NAMES).map((member) => member.name), data.others)
  const unnamed = data.others - data.named.length
  const standing = (member: (typeof data.named)[number]) => (member.standing === null ? '' : member.standing.kind === 'rank' ? (words.lang.waterRanks[member.standing.id] ?? member.standing.id) : words.title(member.standing.id))
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
              {member.profile ? <Link to="/profile/$alias" params={{ alias: member.name }} className="font-semibold underline decoration-dotted underline-offset-4">{member.name}</Link> : <span className="font-semibold">{member.name}</span>}
              <span className="text-sm text-muted">{standing(member)}</span>
            </li>
          ))}
        </ul>
        {unnamed > 0 ? <p className="mt-2 text-sm text-muted">{t.unnamed(unnamed)}</p> : null}
        <Button allowOffline variant="secondary" className="mt-4 w-full" onClick={() => setOpen(false)}>{t.closeList}</Button>
      </Sheet>
    </div>
  )
}
