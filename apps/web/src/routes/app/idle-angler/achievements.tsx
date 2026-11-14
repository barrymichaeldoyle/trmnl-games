import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { Card } from '../../../lib/ui'
import { seo } from '../../../lib/seo'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { iaLog } from '../../../i18n/iaLog'
import { useAngler } from '../../../lib/idleAngler'
import { BadgeIcon } from './-art'
import { useNewBadges } from './-newBadges'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/app/idle-angler/achievements')({
  head: () => seo({ title: 'Achievements · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.achievements.mine, {})),
  component: AchievementsPage,
})

type Family = { family: string; name: string; category: string; tiers: number; earned: { id: string; name: string; blurb: string; tier: number; unlockedAt: number | null } | null; next: { id: string; name: string; tier: number } | null; value: number; target: number }
type Mine = { earnedCount: number; families: Family[]; rarity: { counts: Record<string, number>; totalPlayers: number } | null } | null

const CATEGORIES = ['Fishing', 'Logbook', 'Progress', 'Trade', 'Species'] as const

/** The tiers as pips, earned ones filled. */
function Pips({ earned, tiers }: { earned: number; tiers: number }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 gap-1">
      {Array.from({ length: tiers }, (_, i) => <span key={i} className={`size-2 ${i < earned ? 'bg-gold' : 'border border-faint'}`} />)}
    </span>
  )
}

/** A thin progress bar toward the next tier, in the Meter's night track. */
function Progress({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.max(0, Math.min(100, (value * 100) / target)) : 0
  return (
    <div aria-hidden="true" className="mt-1 h-2 overflow-hidden bg-night outline-1 outline-raised">
      <div className="h-full bg-xp" style={{ width: `${pct}%` }} />
    </div>
  )
}

/**
 * Idle Angler achievements (P48): each family's badge in its tier's frame, its tiers as pips, the share of anglers who
 * hold it and a bar to the next tier; the latest badges first; species as a grid of fish badges, silhouettes until
 * the first catch, as the logbook keeps them.
 */
function AchievementsPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.achievements.mine, {}))
  const mine = data as Mine | undefined
  const t = useT(iaLog)
  const words = useAngler()
  const locale = useLocale()
  // P48: badges new since the last look keep a New tag for this visit; opening the page marks them seen.
  const fresh = useNewBadges()
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set())
  const freshKey = fresh.badges.map((b) => b.id).join(',')
  useEffect(() => {
    if (!freshKey) return
    setNewIds((held) => new Set([...held, ...freshKey.split(',')]))
    void fresh.seen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey])
  if (!mine) return null
  const NewTag = ({ id }: { id: string | undefined }) => (id && newIds.has(id) ? <span className="ml-2 inline-block bg-gold px-1 align-middle text-xs font-semibold whitespace-nowrap text-night">{t.newTag}</span> : null)
  // Rarity comes from the last hourly publication; an achievement it has not counted yet shows none.
  const rarity = (id: string) => {
    const held = mine.rarity?.counts[id] ?? 0
    return mine.rarity && mine.rarity.totalPlayers > 0 && held > 0 ? Math.max(1, Math.round((held * 100) / mine.rarity.totalPlayers)) : null
  }
  const total = mine.families.reduce((sum, f) => sum + f.tiers, 0)
  const latest = mine.families.filter((f) => f.earned?.unlockedAt).sort((a, b) => b.earned!.unlockedAt! - a.earned!.unlockedAt!).slice(0, 6)
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-3xl font-bold">{t.achievements}</h1>
          <span className="text-sm text-muted tabular-nums"><span className="sr-only">{t.earned(mine.earnedCount)}: </span><span aria-hidden="true">{formatNumber(locale, mine.earnedCount)}/{formatNumber(locale, total)}</span></span>
        </div>
        <Progress value={mine.earnedCount} target={total} />
      </div>
      {latest.length > 0 ? (
        <Card title={t.latest}>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {latest.map((f) => (
              <li key={f.family} className="flex flex-col items-center gap-1 text-center">
                <BadgeIcon family={f.family} tier={f.earned!.tier} />
                <span className="w-full hyphens-auto text-xs font-semibold leading-tight break-words">{words.achievement(f.earned!.id).name}</span>
                <NewTag id={f.earned!.id} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {CATEGORIES.map((category) => {
        const families = mine.families.filter((f) => f.category === category)
        if (category === 'Species') {
          const started = families.filter((f) => f.earned).length
          return (
            <Card key={category} title={words.lang.achievementCategories.Species}>
              <p className="mb-3 text-sm text-muted">{t.speciesIntro(started, families.length)}</p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-x-2 gap-y-3">
                {families.map((f) => (
                  <li key={f.family} className="flex flex-col items-center gap-1 text-center">
                    <BadgeIcon family={f.family} tier={f.earned?.tier ?? 0} />
                    {f.earned ? (
                      // The top frame already says a specimen is in; the name says which badge for screen readers.
                      <span className="w-full hyphens-auto text-xs leading-tight break-words">
                        <span className="sr-only">{words.achievement(f.earned.id).name}. </span>
                        <span aria-hidden="true">{words.achievement(f.earned.id).family}</span>
                        <NewTag id={f.earned.id} />
                      </span>
                    ) : (
                      <span className="text-xs text-muted">{t.notYet}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )
        }
        return (
          <Card key={category} title={words.lang.achievementCategories[category]}>
            <ul className="flex flex-col gap-3">
              {families.map((f) => {
                const shown = f.earned ? words.achievement(f.earned.id) : null
                const pct = f.earned ? rarity(f.earned.id) : null
                return (
                  <li key={f.family} className="flex items-start gap-3 border-b border-rule pb-3 last:border-b-0">
                    <BadgeIcon family={f.family} tier={f.earned?.tier ?? 0} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{shown ? shown.name : (f.next ? words.achievement(f.next.id).family : f.name)}<NewTag id={f.earned?.id} /></span>
                        <Pips earned={f.earned?.tier ?? 0} tiers={f.tiers} />
                      </p>
                      <p className="text-sm text-muted">
                        <span className="sr-only">{f.earned ? t.tierOf(f.earned.tier, f.tiers) : t.notYet}. </span>
                        {shown ? shown.blurb : t.notYet}{pct !== null ? ` · ${t.ofAnglers(pct)}` : ''}
                      </p>
                      {f.next ? (
                        <>
                          <Progress value={Math.min(f.value, f.target)} target={f.target} />
                          <p className="mt-1 text-xs text-muted">{t.nextTier(words.achievement(f.next.id).name, formatNumber(locale, Math.min(f.value, f.target)), formatNumber(locale, f.target))}</p>
                        </>
                      ) : <p className="text-sm text-xp-ink">{t.everyTier}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        )
      })}
    </>
  )
}
