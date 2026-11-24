import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { Confetti, useBurst } from '../../../lib/confetti'
import { Glyph } from '../../../lib/glyphs'
import { useIntent } from '../../../lib/intent'
import { formatDate, formatNumber, useLocale, useT } from '../../../lib/i18n'
import { Button } from '../../../lib/ui'
import { useContent } from '../../../lib/useContent'
import { RARITY_TONE } from '../../../lib/palette'
import { dcAchievementsMessages } from '../../../i18n/dcAchievements'
import { dcHeroCardsMessages } from '../../../i18n/dcHeroCards'
import { dcLogMessages } from '../../../i18n/dcLog'
import { SlotPreview } from './-bagSlots'

type Upgrade = { id: Id<'items'>; kind: 'weapon' | 'armor'; templateId: string; rarity: string; label: string; delta: number }
type Feedback = { error: string | null; message: string | null }

/**
 * D248: the bag holds a piece the hero can wear that beats what it wears. The hero never changes gear by itself, so
 * the Hero page names it with the gain and puts it on in one tap, one piece of each kind at most.
 */
export function BetterGearCard({ upgrades, notify }: { upgrades: readonly Upgrade[]; notify: (feedback: Feedback) => void }) {
  const t = useT(dcHeroCardsMessages)
  const c = useContent()
  const equip = useIntent(api.inventory.equipBest, { onFeedback: notify })
  if (upgrades.length === 0) return null
  return (
    <section aria-labelledby="better-gear-title" className="flex flex-col gap-3 border-2 border-xp bg-panel p-3">
      <h2 id="better-gear-title" className="inline-flex items-center gap-2 text-sm font-semibold text-xp-ink"><Glyph name="sword" size={12} />{t.betterTitle}</h2>
      <ul className="flex flex-col gap-2">
        {upgrades.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="w-12 shrink-0"><SlotPreview item={{ ...item, requiredLevel: 1 }} /></div>
            <span className="min-w-0 leading-tight">
              <span className={`block font-semibold [overflow-wrap:anywhere] ${RARITY_TONE[item.rarity] ?? ''}`}>{c.name(item.label)}</span>
              <span className="block text-sm font-semibold tabular-nums text-xp-ink">{t.plus(item.delta, t.stat[item.kind])}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button className="self-start" pending={equip.pending} busyLabel={t.equipping} onClick={() => void equip.run({ itemIds: upgrades.map((item) => item.id) }, t.equipped(upgrades.length))}>{t.equip(upgrades.length)}</Button>
    </section>
  )
}

type WeekResult = { week: number; startsAt: number; rank: number; of: number; cohortKey: string; xp: number; moved: number | null }

/**
 * D249: on the Hero page from Monday, how the hero finished last week's This week board in its level group. A top
 * three gets the gold frame and confetti, as a new badge does; any other place still gets its rank and its XP.
 * A card in the page, never a modal; Nice closes it until next Monday.
 */
export function WeekResultCard() {
  const { data } = useQuery(convexQuery(api.weekResults.mine, {}))
  const seen = useIntent(api.weekResults.see)
  const t = useT(dcHeroCardsMessages)
  const log = useT(dcLogMessages)
  const a = useT(dcAchievementsMessages)
  const locale = useLocale()
  const [burst, fireBurst] = useBurst()
  const fired = useRef<number | null>(null)
  const result = (data ?? null) as WeekResult | null
  const podium = result !== null && result.rank <= 3
  useEffect(() => {
    if (result && podium && fired.current !== result.week) {
      fired.current = result.week
      fireBurst()
    }
  }, [result, podium, fireBurst])
  if (result === null) return null
  const date = formatDate(locale, result.startsAt, { day: 'numeric', month: 'long', timeZone: 'UTC' })
  return (
    <section aria-labelledby="week-result-title" className={`relative flex flex-col gap-3 bg-panel p-3 ${podium ? 'border-4 border-gold' : 'border-2 border-rule'}`}>
      {burst > 0 ? <Confetti key={burst} /> : null}
      <h2 id="week-result-title" className="inline-flex items-center gap-2 text-sm font-semibold text-gold-ink"><Glyph name={result.rank === 1 ? 'crown' : 'medal'} size={12} />{t.weekTitle}</h2>
      <p className="leading-tight">
        <span className={`block font-display text-2xl font-bold ${podium ? 'badge-pop-in text-gold-ink' : ''}`}>{podium ? t.place(result.rank) : t.rankOf(result.rank, result.of)}</span>
        <span className="block text-sm text-muted">{t.weekOf(log.group(result.cohortKey), date)}{podium ? <> · {t.rankOf(result.rank, result.of)}</> : null}</span>
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
        <dt className="text-muted">{t.xp}</dt>
        <dd className="text-right font-semibold tabular-nums text-xp-ink">{formatNumber(locale, result.xp)}</dd>
      </dl>
      {result.moved !== null ? <p className="text-sm">{t.moved(result.moved)}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={seen.pending} onClick={() => void seen.run({ week: result.week }, '')}>{a.nice}</Button>
        <Link to="/app/desk-crawler/leaderboard" className="font-semibold underline underline-offset-4">{t.seeRankings}</Link>
      </div>
    </section>
  )
}
