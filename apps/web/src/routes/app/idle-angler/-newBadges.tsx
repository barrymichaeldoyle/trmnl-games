import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { api } from '@trmnl-games/backend/api'
import { Confetti, useBurst } from '../../../lib/confetti'
import { useAngler } from '../../../lib/idleAngler'
import { useIntent } from '../../../lib/intent'
import { useT } from '../../../lib/i18n'
import { Button } from '../../../lib/ui'
import { iaLog } from '../../../i18n/iaLog'
import { BadgeIcon } from './-art'

/** Badges at or under this share of anglers are called rare on the card. */
const RARE_PERCENT = 5

type Fresh = { badges: Array<{ id: string; family: string; tier: number; at: number; percent: number | null }>; newest: number } | null

/** The owner's badges earned since they last looked (P48), shared by the Dock card, the More dot and the New tags. */
export function useNewBadges() {
  const { data } = useQuery(convexQuery(api.idleAngler.badges.fresh, {}))
  const fresh = data as Fresh | undefined
  const markSeen = useIntent(api.idleAngler.badges.markSeen)
  return {
    badges: fresh?.badges ?? [],
    /** Mark everything shown seen, up to the newest unlock the owner saw; quiet, since the card or page already said it. */
    seen: () => (fresh && fresh.badges.length > 0 ? markSeen.run({ upTo: fresh.newest }, '') : Promise.resolve(false)),
  }
}

/**
 * The Dock's celebration (P48): the best new badge pops in with confetti, its name, its blurb and how many anglers hold
 * it, the rest as small badges after it. A card in the page under the warnings, never a modal, so it waits behind
 * anything the angler has to act on. "Nice" marks it seen, as does opening the achievements page, so it shows once.
 */
export function NewBadgesCard() {
  const { badges, seen } = useNewBadges()
  const t = useT(iaLog)
  const words = useAngler()
  const [burst, fireBurst] = useBurst()
  const best = badges[0]
  const fired = useRef<string | null>(null)
  // One burst per card, when it first shows a badge.
  useEffect(() => {
    if (best && fired.current !== best.id) {
      fired.current = best.id
      fireBurst()
    }
  }, [best, fireBurst])
  if (!best) return null
  const shown = words.achievement(best.id)
  const rest = badges.slice(1)
  const dismiss = () => void seen()
  return (
    <section aria-labelledby="new-badge-title" className="relative flex flex-col gap-3 border-4 border-gold bg-panel p-3">
      {burst > 0 ? <Confetti key={burst} /> : null}
      <h2 id="new-badge-title" className="text-sm font-semibold text-gold-ink">{badges.length > 1 ? t.newAchievements(badges.length) : t.newAchievement}</h2>
      <div className="flex items-center gap-3">
        <BadgeIcon family={best.family} tier={best.tier} scale={3} className="badge-pop-in" />
        <div className="min-w-0">
          <p className="font-display text-2xl leading-tight font-bold">{shown.name}</p>
          {shown.blurb ? <p className="text-sm text-muted">{shown.blurb}</p> : null}
          {best.percent !== null ? <p className={`text-sm ${best.percent <= RARE_PERCENT ? 'font-semibold text-rare-ink' : 'text-muted'}`}>{best.percent <= RARE_PERCENT ? t.rareHeld(best.percent) : t.ofAnglers(best.percent)}</p> : null}
        </div>
      </div>
      {rest.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label={t.moreNew(rest.length)}>
          {rest.map((b) => (
            <li key={b.id} title={words.achievement(b.id).name}>
              <BadgeIcon family={b.family} tier={b.tier} scale={1} />
              <span className="sr-only">{words.achievement(b.id).name}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={dismiss}>{t.nice}</Button>
        {/* The achievements page marks them seen itself, after it has tagged them New. */}
        <Link to="/app/idle-angler/achievements" className="font-semibold underline underline-offset-4">{t.seeAchievements}</Link>
      </div>
    </section>
  )
}
