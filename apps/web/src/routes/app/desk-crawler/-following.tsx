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
 * Following (D143): the players this account follows, rival first, each linking to their public page, and the
 * players who named this account their rival, with Rival back. A plain follow is silent; a rival is told. Hidden
 * until there is one or the other.
 */
export function FollowingCard() {
  const { data } = useQuery(convexQuery(api.follows.list, {}))
  const { notice, notify, dismiss } = useNotice()
  const unfollow = useIntent(api.follows.unfollow, { onFeedback: notify })
  const rivalBack = useIntent(api.follows.follow, { onFeedback: notify })
  const setRival = useIntent(api.follows.setRival, {
    onFeedback: notify,
    optimisticUpdate: (store, { followId }) => {
      const current = store.getQuery(api.follows.list, {})
      if (current) store.setQuery(api.follows.list, {}, { ...current, follows: current.follows.map((row) => ({ ...row, rival: row.id === followId })) })
    },
  })
  if (!data || (data.follows.length === 0 && data.rivalOf.length === 0)) return null
  const busy = unfollow.pending || setRival.pending || rivalBack.pending
  const current = data.follows.find((row) => row.rival)
  return (
    <section aria-labelledby="following-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="following-title" glyph="eye" tone="text-sky-ink">Following</SectionTitle>
      {data.rivalOf.length > 0 ? (
        <div className="flex flex-col gap-2 border-2 border-gold p-3">
          <p className="font-semibold text-gold-ink">{data.rivalOf.length === 1 && !data.rivalOfMore ? 'Named you their rival' : `${data.rivalOf.length}${data.rivalOfMore ? '+' : ''} players named you their rival`}</p>
          <p className="text-sm text-muted">Half their raids go after your desk when they can. Name one back and yours go after theirs.</p>
          <ul className="flex flex-col gap-1">
            {data.rivalOf.map((row) => (
              <li key={row.name} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3">
                {row.public ? <Link to="/desk-crawler/heroes/$alias" params={{ alias: row.name }} className="min-w-0 font-semibold underline decoration-dotted underline-offset-4 [overflow-wrap:anywhere]">{row.name}</Link> : <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">{row.name}</span>}
                {current?.name === row.name ? (
                  <span className="hud text-hud-sm text-gold-ink">Rivals</span>
                ) : row.public ? (
                  <Button variant="quiet" className="-mr-3 min-[375px]:-mr-4" disabled={busy} onClick={() => rivalBack.run({ alias: row.name, rival: true }, `${row.name} is your rival.`)}>Rival back</Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.follows.length > 0 ? <p className="text-sm text-muted">Players you follow from their hero pages, {data.follows.length} of {data.limit}. They aren't told, except the one you name your rival.</p> : null}
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
            {row.raids.won + row.raids.lost > 0 ? <p className="text-sm">Your raids on {row.name}: <span className="text-xp-ink">{row.raids.won} won</span>, <span className="text-hp-ink">{row.raids.lost} lost</span>.</p> : null}
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
