import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import type { FunctionReturnType } from 'convex/server'
import { SectionTitle } from '../../../lib/glyphs'
import { useIntent } from '../../../lib/intent'
import { Button, NoticeBar, useNotice } from '../../../lib/ui'

type Following = NonNullable<FunctionReturnType<typeof api.follows.list>>
type Row = Following['follows'][number]
type Hero = NonNullable<Row['hero']>

const DOING: Record<Hero['status'], (biome: string) => string> = {
  exploring: (biome) => `Exploring the ${biome}`,
  resting: (biome) => `Resting in the ${biome}`,
  travelling: () => 'Travelling between floors',
  dead: () => 'Recovering from a knockout',
  paused: () => 'Taking a break',
  sleeping: () => 'Stopped with a full bag',
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

/** The rival's head-to-head line (D143): rank when both are on the published board, otherwise level. */
function headToHead(name: string, hero: Hero, own: Following['own']): string {
  if (hero.rank !== null && own.rank !== null && hero.rank !== own.rank) {
    const gap = Math.abs(hero.rank - own.rank)
    return own.rank < hero.rank ? `You're ${plural(gap, 'place')} ahead of ${name}, all time.` : `${name} is ${plural(gap, 'place')} ahead of you, all time.`
  }
  if (hero.level === own.level) return `Level and level with ${name}.`
  const gap = Math.abs(hero.level - own.level)
  return own.level > hero.level ? `You're ${plural(gap, 'level')} ahead of ${name}.` : `${name} is ${plural(gap, 'level')} ahead of you.`
}

/**
 * Following (D143): the players this account follows, rival first, each linking to their public page. One-way and
 * silent: nobody is told, and no page shows who follows whom. Hidden until the first follow, since following
 * starts from a hero page.
 */
export function FollowingCard() {
  const { data } = useQuery(convexQuery(api.follows.list, {}))
  const { notice, notify, dismiss } = useNotice()
  const unfollow = useIntent(api.follows.unfollow, { onFeedback: notify })
  const setRival = useIntent(api.follows.setRival, {
    onFeedback: notify,
    optimisticUpdate: (store, { followId }) => {
      const current = store.getQuery(api.follows.list, {})
      if (current) store.setQuery(api.follows.list, {}, { ...current, follows: current.follows.map((row) => ({ ...row, rival: row.id === followId })) })
    },
  })
  if (!data || data.follows.length === 0) return null
  const busy = unfollow.pending || setRival.pending
  return (
    <section aria-labelledby="following-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="following-title" glyph="eye" tone="text-sky-ink">Following</SectionTitle>
      <p className="text-sm text-muted">Players you follow from their hero pages, {data.follows.length} of {data.limit}. They aren't told, and nobody sees who follows whom.</p>
      <ol aria-label="Players you follow" className="flex flex-col divide-y divide-rule">
        {data.follows.map((row) => (
          <li key={row.id} className={`flex min-w-0 flex-col gap-2 py-3 ${row.rival ? '-mx-2 bg-ground px-2 outline-2 outline-gold' : ''}`}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 [overflow-wrap:break-word]">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  {row.state === 'public' ? (
                    <Link to="/desk-crawler/heroes/$alias" params={{ alias: row.name }} className="font-semibold underline decoration-dotted underline-offset-4">{row.name}</Link>
                  ) : (
                    <span className="font-semibold">{row.name}</span>
                  )}
                  {row.rival ? <span className="hud text-hud-sm text-gold-ink">Rival</span> : null}
                </p>
                {row.hero ? (
                  <>
                    <p className="text-sm text-muted">{row.hero.name}, {row.hero.heroClass === 'rogue' ? 'Rogue' : 'Warrior'}</p>
                    <p className="text-sm">{DOING[row.hero.status](row.hero.biome ?? 'office')}.</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">{row.state === 'private' ? 'Page is private for now.' : 'No longer here. They changed their name or left.'}</p>
                )}
              </div>
              {row.hero ? (
                <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
                  <span className="block text-xp-ink">Level {row.hero.level}</span>
                  {row.hero.rank !== null ? <span className="block text-gold-ink">#{row.hero.rank.toLocaleString()}</span> : null}
                </p>
              ) : null}
            </div>
            {row.rival && row.hero ? <p className="text-sm font-semibold">{headToHead(row.name, row.hero, data.own)}</p> : null}
            <div className="-ml-3 flex flex-wrap gap-x-2 min-[375px]:-ml-4">
              {row.state !== 'gone' ? (
                <Button variant="quiet" disabled={busy} onClick={() => setRival.run({ followId: row.rival ? null : row.id }, row.rival ? 'Rival cleared.' : `${row.name} is your rival.`)}>{row.rival ? 'Clear rival' : 'Make rival'}</Button>
              ) : null}
              <Button variant="quiet" disabled={busy} onClick={() => unfollow.run({ followId: row.id }, row.state === 'gone' ? 'Removed.' : `Unfollowed ${row.name}.`)}>Unfollow</Button>
            </div>
          </li>
        ))}
      </ol>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </section>
  )
}
