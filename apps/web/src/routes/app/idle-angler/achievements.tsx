import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { Card } from '../../../lib/ui'
import { seo } from '../../../lib/seo'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { iaLog } from '../../../i18n/iaLog'
import { useAngler } from '../../../lib/idleAngler'

/** Idle Angler achievements: each family's highest tier, progress to the next and how many anglers hold it. */
export const Route = createFileRoute('/app/idle-angler/achievements')({
  head: () => seo({ title: 'Achievements · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.achievements.mine, {})),
  component: AchievementsPage,
})

type Family = { family: string; name: string; category: string; tiers: number; earned: { id: string; name: string; blurb: string; tier: number } | null; next: { id: string; name: string; tier: number } | null; value: number; target: number }
type Mine = { earnedCount: number; families: Family[]; rarity: { counts: Record<string, number>; totalPlayers: number } | null } | null

const CATEGORIES = ['Fishing', 'Logbook', 'Progress', 'Trade', 'Species'] as const

function AchievementsPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.achievements.mine, {}))
  const mine = data as Mine | undefined
  const t = useT(iaLog)
  const words = useAngler()
  const locale = useLocale()
  if (!mine) return null
  // Rarity comes from the last hourly publication; an achievement it has not counted yet shows none.
  const rarity = (id: string) => {
    const held = mine.rarity?.counts[id] ?? 0
    return mine.rarity && mine.rarity.totalPlayers > 0 && held > 0 ? Math.max(1, Math.round((held * 100) / mine.rarity.totalPlayers)) : null
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">{t.achievements}</h1>
        <span className="text-sm text-muted">{t.earned(mine.earnedCount)}</span>
      </div>
      {CATEGORIES.map((category) => {
        const families = mine.families.filter((f) => f.category === category)
        if (category === 'Species') {
          const caught = families.filter((f) => f.earned)
          return (
            <Card key={category} title={words.lang.achievementCategories.Species}>
              <p className="mb-3 text-sm text-muted">{t.speciesIntro(caught.length, families.length)}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {caught.map((f) => (
                  <li key={f.family} className="text-sm"><strong>{words.achievement(f.earned!.id).name}</strong>{f.next ? <span className="text-muted"> · {t.next}: {words.achievement(f.next.id).name}</span> : <span className="text-xp-ink"> · {t.complete}</span>}</li>
                ))}
              </ul>
            </Card>
          )
        }
        return (
          <Card key={category} title={words.lang.achievementCategories[category]}>
            <ul className="flex flex-col gap-3">
              {families.map((f) => (
                <li key={f.family} className="border-b border-rule pb-3 last:border-b-0">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{f.earned ? words.achievement(f.earned.id).name : (f.next ? words.achievement(f.next.id).family : f.name)}</span>
                    <span className="text-sm text-muted">{f.earned ? t.tierOf(f.earned.tier, f.tiers) : t.notYet}{f.earned && rarity(f.earned.id) !== null ? ` · ${t.ofAnglers(rarity(f.earned.id)!)}` : ''}</span>
                  </p>
                  {f.earned ? <p className="text-sm text-muted">{words.achievement(f.earned.id).blurb}</p> : null}
                  {f.next ? <p className="text-sm">{t.nextTier(words.achievement(f.next.id).name, formatNumber(locale, Math.min(f.value, f.target)), formatNumber(locale, f.target))}</p> : <p className="text-sm text-xp-ink">{t.everyTier}</p>}
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </>
  )
}
