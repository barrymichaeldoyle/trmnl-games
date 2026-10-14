import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import { SectionTitle } from '../../../lib/glyphs'
import { RARITY_TONE } from '../../../lib/palette'
import { WithName } from './-withName'

/**
 * Lost property (D145): where your hero's spare is lying or who found it, and the other players' spares it holds.
 * Like raids and meetings it needs no hand, so this is a window, never a control; it stays hidden until the world has
 * lost property or the hero has found a spare.
 */
export function LostProperty() {
  const { data } = useQuery(convexQuery(api.lostProperty.mine, {}))
  if (!data) return null
  const { enabled, mySpare, held, total } = data
  if (!enabled && total === 0 && held.length === 0) return null
  return (
    <section aria-labelledby="lost-property-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="lost-property-title" glyph="lost_property" tone="text-sky-ink">Lost property</SectionTitle>
      <p className="text-sm text-muted">A hero knocked out on a floor drops a spare of something it wears, with its owner's name on it. Another player's hero may find it in place of an ordinary find.</p>
      <dl className="grid grid-cols-2 gap-x-4 min-[480px]:gap-x-6">
        <div className="flex min-w-0 items-baseline justify-between gap-2 border-t-2 border-dashed border-rule py-2">
          <dt className="label-px min-w-0 text-muted">Spares found</dt>
          <dd className="font-bold whitespace-nowrap tabular-nums">{total.toLocaleString()}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-1">
        <h3 className="caps text-sm text-muted">Your spare</h3>
        {mySpare === null ? (
          <p className="text-sm">No spare of yours is out there. A knockout outside the Office leaves one.</p>
        ) : mySpare.found ? (
          <p className="text-sm"><WithName text={`{name} found your spare ${mySpare.name} in the ${mySpare.floor}.`} name={mySpare.finderName ?? ''} profile={mySpare.finderProfile} /></p>
        ) : (
          <p className="text-sm">Your spare {mySpare.name} is somewhere in the {mySpare.floor}.</p>
        )}
      </div>
      {held.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="caps text-sm text-muted">Other people's, in your bag</h3>
          <ul aria-label="Spares you hold" className="flex flex-col gap-1">
            {held.map((spare, index) => (
              <li key={`${spare.name}-${spare.ownerName}-${index}`} className="min-w-0 text-sm break-words">
                <span className={`font-semibold ${RARITY_TONE[spare.rarity] ?? ''}`}>{spare.name}</span>, <WithName text="{name}'s" name={spare.ownerName} profile={spare.profile} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
