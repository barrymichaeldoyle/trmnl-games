import { Link } from '@tanstack/react-router'
import { Glyph } from '../../../lib/glyphs'
import { LocalTime } from '../../../lib/localTime'
import { useAngler, type Dock, type DockOpen } from '../../../lib/idleAngler'
import { INTL_TAG } from '@trmnl-games/platform'
import { useLocale, useT } from '../../../lib/i18n'
import { iaDock } from '../../../i18n/iaDock'
import { FishIcon } from './-art'
import { FishName, WaterName } from './-fish'

/**
 * D240: the weekend Open at the angler's water, on the Dock all week. Monday to Friday it names the coming target, when
 * it runs and what it bites on, so there is time to buy the bait; during the weekend it adds the angler's place. Entry
 * stays automatic (D230): this card only tells, it asks for nothing.
 */
export function OpenCard({ open, bait }: { open: DockOpen; bait: NonNullable<Dock['angler']>['bait'] }) {
  const t = useT(iaDock)
  const words = useAngler()
  const locale = useLocale()
  const when = (date: Date) => date.toLocaleString(INTL_TAG[locale], { weekday: 'long', hour: '2-digit', minute: '2-digit' })
  const target = open.target
  const holds = bait.some((b) => target.baits.includes(b.class) && b.units > 0)
  const bites = [target.baits.map((b) => words.bait(b)).join(t.openOr), ...(target.times ? [target.times.map((b) => words.band(b)).join(t.openOr)] : []), ...(target.weather ? [target.weather.map((w) => words.weather(w)).join(t.openOr)] : [])]
  return (
    <section aria-labelledby="open-title" className="flex flex-col gap-2 border-l-4 border-sky pl-3">
      <h2 id="open-title" className="inline-flex items-center gap-2 text-sm font-semibold text-muted"><Glyph name="medal" size={12} className="text-gold-ink" />{open.on ? t.openOn : t.openNext}</h2>
      <p className="flex items-center gap-3">
        <FishIcon id={target.id} scale={2} />
        <span className="min-w-0 leading-tight">
          <span className="block font-display text-2xl font-bold"><FishName id={target.id} /></span>
          <span className="block text-sm text-muted"><WaterName id={open.waterId} /> · {open.on ? <>{t.openUntil} <LocalTime at={open.endsAt} format={when} /></> : <><LocalTime at={open.startsAt} format={when} /> {t.openTo} <LocalTime at={open.endsAt} format={when} /></>}</span>
        </span>
      </p>
      <p className="text-sm">{t.openBites} {bites.join(' · ')}.</p>
      {!holds ? <p className="text-sm font-semibold text-hp-ink">{t.openNoBait} <Link to="/app/idle-angler/shop" className="underline underline-offset-4">{t.buyBait}</Link>.</p> : null}
      {open.on ? (
        <p className="text-sm font-semibold">
          {open.own ? (open.own.rank ? t.openPlace(open.own.rank, words.weight(open.own.grams)) : t.openEntry(words.weight(open.own.grams))) : t.openNotEntered}
          {open.leader && !open.leader.own ? <span className="font-normal text-muted"> · {t.openLeader(words.weight(open.leader.grams))}</span> : null}
          {!open.leader ? <span className="font-normal text-muted"> · {t.openNoEntries}</span> : null}
        </p>
      ) : null}
      <p className="text-sm"><Link to="/app/idle-angler/rankings" className="underline underline-offset-4">{open.on ? t.openBoard : t.openAll}</Link></p>
    </section>
  )
}
