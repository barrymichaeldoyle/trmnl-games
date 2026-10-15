import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { Card } from '../../../lib/ui'

/** Paper Lives achievements: each family's highest tier, progress to the next, and how many players hold it. They count across every life. */
export const Route = createFileRoute('/app/paper-lives/achievements')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.achievements.mine, {})),
  component: AchievementsPage,
})

type Family = { family: string; name: string; category: string; tiers: number; earned: { id: string; name: string; blurb: string; tier: number } | null; next: { id: string; name: string; blurb: string; tier: number } | null; value: number; target: number }
type Mine = { earnedCount: number; total: number; families: Family[]; rarity: { counts: Record<string, number>; totalPlayers: number } | null } | null

const CATEGORIES = ['Lives', 'Family', 'Work and money', 'Choices', 'Jobs', 'Set pieces'] as const

function AchievementsPage() {
  const { data } = useQuery(convexQuery(api.paperLives.achievements.mine, {}))
  const mine = data as Mine | undefined
  if (!mine) return null
  const rarity = (id: string) => {
    const held = mine.rarity?.counts[id] ?? 0
    return mine.rarity && mine.rarity.totalPlayers > 0 && held > 0 ? Math.max(1, Math.round((held * 100) / mine.rarity.totalPlayers)) : null
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Achievements</h1>
        <span className="text-sm text-muted">{mine.earnedCount} of {mine.total} earned</span>
      </div>
      <p className="text-sm text-muted">Progress counts across every life.</p>
      {CATEGORIES.map((category) => {
        const families = mine.families.filter((f) => f.category === category)
        if (category === 'Jobs' || category === 'Set pieces') {
          const held = families.filter((f) => f.earned)
          return (
            <Card key={category} title={category}>
              <p className="mb-3 text-sm text-muted">{category === 'Jobs' ? `One for each job held, and one for twenty years in it. ${held.length} of ${families.length} jobs held.` : `Rare moments across the album. ${held.length} of ${families.length} found.`}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {(category === 'Jobs' ? held : families).map((f) => (
                  <li key={f.family} className="text-sm">
                    {f.earned ? <strong>{f.earned.name}</strong> : <span className="text-muted">{f.next?.blurb ?? f.name}</span>}
                    {f.earned && f.next ? <span className="text-muted"> · next: {f.next.name}</span> : null}
                    {f.earned && rarity(f.earned.id) !== null ? <span className="text-muted"> · {rarity(f.earned.id)}% of players</span> : null}
                  </li>
                ))}
              </ul>
            </Card>
          )
        }
        return (
          <Card key={category} title={category}>
            <ul className="flex flex-col gap-3">
              {families.map((f) => (
                <li key={f.family} className="border-b border-rule pb-3 last:border-b-0">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{f.earned ? f.earned.name : f.name}</span>
                    <span className="text-sm text-muted">{f.earned ? `Tier ${f.earned.tier} of ${f.tiers}` : 'Not yet'}{f.earned && rarity(f.earned.id) !== null ? ` · ${rarity(f.earned.id)}% of players` : ''}</span>
                  </p>
                  {f.earned ? <p className="text-sm text-muted">{f.earned.blurb}</p> : null}
                  {f.next ? <p className="text-sm">Next: {f.next.name} · {Math.min(f.value, f.target).toLocaleString('en-GB')} of {f.target.toLocaleString('en-GB')}</p> : <p className="text-sm text-xp-ink">Every tier earned.</p>}
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </>
  )
}
