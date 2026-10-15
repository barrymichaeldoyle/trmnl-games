import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import { SectionTitle } from '../../../lib/glyphs'
import { RARITY_TONE } from '../../../lib/palette'
import { WithName } from './-withName'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { useContent } from '../../../lib/useContent'
import { dcLogMessages } from '../../../i18n/dcLog'

/**
 * Lost property (D145): where your hero's spare is lying or who found it, and the other players' spares it holds.
 * Like raids and meetings it needs no hand, so this is a window, never a control; it stays hidden until the world has
 * lost property or the hero has found a spare.
 */
export function LostProperty() {
  const { data } = useQuery(convexQuery(api.lostProperty.mine, {}))
  const t = useT(dcLogMessages)
  const locale = useLocale()
  const c = useContent()
  if (!data) return null
  const { enabled, mySpare, held, total } = data
  if (!enabled && total === 0 && held.length === 0) return null
  return (
    <section aria-labelledby="lost-property-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="lost-property-title" glyph="lost_property" tone="text-sky-ink">{t.lostProperty}</SectionTitle>
      <p className="text-sm text-muted">{t.lostExplainer}</p>
      <dl className="grid grid-cols-2 gap-x-4 min-[480px]:gap-x-6">
        <div className="flex min-w-0 items-baseline justify-between gap-2 border-t-2 border-dashed border-rule py-2">
          <dt className="label-px min-w-0 text-muted">{t.sparesFound}</dt>
          <dd className="font-bold whitespace-nowrap tabular-nums">{formatNumber(locale, total)}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-1">
        <h3 className="caps text-sm text-muted">{t.yourSpare}</h3>
        {mySpare === null ? (
          <p className="text-sm">{t.noSpare}</p>
        ) : mySpare.found ? (
          <p className="text-sm"><WithName text={t.spareFound(mySpare.name, mySpare.floor)} name={mySpare.finderName ?? ''} profile={mySpare.finderProfile} /></p>
        ) : (
          <p className="text-sm">{t.spareSomewhere(mySpare.name, mySpare.floor)}</p>
        )}
      </div>
      {held.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="caps text-sm text-muted">{t.othersInBag}</h3>
          <ul aria-label={t.sparesYouHold} className="flex flex-col gap-1">
            {held.map((spare, index) => (
              <li key={`${spare.name}-${spare.ownerName}-${index}`} className="min-w-0 text-sm break-words">
                <span className={`font-semibold ${RARITY_TONE[spare.rarity] ?? ''}`}>{c.name(spare.name)}</span>, <WithName text={t.whose} name={spare.ownerName} profile={spare.profile} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
