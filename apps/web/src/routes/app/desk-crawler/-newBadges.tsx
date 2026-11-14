import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { api } from '@trmnl-games/backend/api'
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, rarityBand, tierLabel, type RarityBand } from '@trmnl-games/desk-crawler/content/achievements'
import { Confetti, useBurst } from '../../../lib/confetti'
import { useIntent } from '../../../lib/intent'
import { useT } from '../../../lib/i18n'
import { Button } from '../../../lib/ui'
import { useContent } from '../../../lib/useContent'
import { dcAchievementsMessages } from '../../../i18n/dcAchievements'
import { DcBadge } from './-badge'

type Fresh = { badges: Array<{ id: string; family: string; tier: number; at: number; share: number | null }>; newest: number } | null

const BAND_TONE: Record<RarityBand, string> = { common: 'text-muted', uncommon: 'text-xp-ink', rare: 'text-rare-ink', legendary: 'text-gold-ink' }

/** The owner's badges earned since they last looked (P49), shared by the Hero card, the More dots and the New tags. */
export function useNewBadges() {
  const { data } = useQuery(convexQuery(api.badges.fresh, {}))
  const fresh = data as Fresh | undefined
  const markSeen = useIntent(api.badges.markSeen)
  return {
    badges: fresh?.badges ?? [],
    /** Mark everything shown seen, up to the newest unlock the owner saw; quiet, since the card or page already said it. */
    seen: () => (fresh && fresh.badges.length > 0 ? markSeen.run({ upTo: fresh.newest }, '') : Promise.resolve(false)),
  }
}

/**
 * The Hero page's celebration (P49, as Idle Angler's Dock card): the best new badge pops in with confetti, its name,
 * blurb and rarity band, the rest as small badges after it. A card in the page, never a modal. "Nice" marks it seen,
 * as does opening the achievements page, so it shows once.
 */
export function NewBadgesCard() {
  const { badges, seen } = useNewBadges()
  const t = useT(dcAchievementsMessages)
  const c = useContent()
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
  const def = best ? ACHIEVEMENT_BY_ID.get(best.id) : undefined
  if (!best || !def) return null
  const band = best.share === null ? null : rarityBand(best.share)
  const tiered = ACHIEVEMENTS.filter((a) => a.family === def.family).length > 1
  const rest = badges.slice(1)
  return (
    <section aria-labelledby="new-badge-title" className="relative flex flex-col gap-3 border-4 border-gold bg-panel p-3">
      {burst > 0 ? <Confetti key={burst} /> : null}
      <h2 id="new-badge-title" className="text-sm font-semibold text-gold-ink">{badges.length > 1 ? t.newAchievements(badges.length) : t.newAchievement}</h2>
      <div className="flex items-center gap-3">
        <DcBadge family={best.family} tier={best.tier} scale={2} className="badge-pop-in" />
        <div className="min-w-0">
          <p className="font-display text-2xl leading-tight font-bold hyphens-auto break-words">{c.text(def.name)}{tiered ? <span className="hud ml-2 align-middle text-hud-sm text-gold-ink">{tierLabel(best.tier)}</span> : null}</p>
          <p className="text-sm text-muted">{c.text(def.blurb)}</p>
          {band && best.share !== null ? <p className="text-sm"><span className={`font-semibold ${BAND_TONE[band]}`}>{t.bands[band]}</span> <span className="text-muted">{t.percentOfHeroes(best.share < 0.01 ? '<1' : String(Math.round(best.share * 100)))}</span></p> : null}
        </div>
      </div>
      {rest.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-2">
          {rest.map((b) => {
            const other = ACHIEVEMENT_BY_ID.get(b.id)
            return (
              <li key={b.id} title={other ? c.text(other.name) : undefined}>
                <DcBadge family={b.family} tier={b.tier} scale={1} />
                <span className="sr-only">{other ? c.text(other.name) : ''}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void seen()}>{t.nice}</Button>
        {/* The achievements page marks them seen itself, after it has tagged them New. */}
        <Link to="/app/desk-crawler/achievements" className="font-semibold underline underline-offset-4">{t.seeAll}</Link>
      </div>
    </section>
  )
}
