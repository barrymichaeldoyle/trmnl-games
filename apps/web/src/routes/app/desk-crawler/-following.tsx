import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import type { FunctionReturnType } from 'convex/server'
import { SectionTitle } from '../../../lib/glyphs'
import { useIntent } from '../../../lib/intent'
import { Button, NoticeBar, useNotice } from '../../../lib/ui'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { dcLogMessages } from '../../../i18n/dcLog'
import { useShownName } from './-withName'

type Following = NonNullable<FunctionReturnType<typeof api.follows.list>>
type Row = Following['follows'][number]
type Hero = NonNullable<Row['hero']>

/** The rival's head-to-head line (D143): rank when both are on the published board, otherwise level. */
function headToHead(name: string, hero: Hero, own: Following['own'], t: (typeof dcLogMessages)['en']): string {
  if (hero.rank !== null && own.rank !== null && hero.rank !== own.rank) return t.placesAhead(Math.abs(hero.rank - own.rank), name, own.rank < hero.rank)
  if (hero.level === own.level) return t.sameLevel(name)
  return t.levelsAhead(Math.abs(hero.level - own.level), name, own.level > hero.level)
}

/**
 * Following (D143): the players this account follows, rival first, each linking to their public page, and the
 * players who named this account their rival, with Rival back. A plain follow is silent; a rival is told. Hidden
 * until there is one or the other.
 */
export function FollowingCard() {
  const { data } = useQuery(convexQuery(api.follows.list, {}))
  const { notice, notify, dismiss } = useNotice()
  const t = useT(dcLogMessages)
  const locale = useLocale()
  const shown = useShownName()
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
      <SectionTitle id="following-title" glyph="eye" tone="text-sky-ink">{t.following}</SectionTitle>
      {data.rivalOf.length > 0 ? (
        <div className="flex flex-col gap-2 border-2 border-gold p-3">
          <p className="font-semibold text-gold-ink">{data.rivalOf.length === 1 && !data.rivalOfMore ? t.namedYou : t.namedYouMany(`${data.rivalOf.length}${data.rivalOfMore ? '+' : ''}`)}</p>
          <p className="text-sm text-muted">{t.rivalExplainer}</p>
          <ul className="flex flex-col gap-1">
            {data.rivalOf.map((row) => (
              <li key={row.name} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3">
                {row.public ? <Link to="/desk-crawler/heroes/$alias" params={{ alias: row.name }} className="min-w-0 font-semibold underline decoration-dotted underline-offset-4 [overflow-wrap:anywhere]">{row.name}</Link> : <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">{row.name}</span>}
                {current?.name === row.name ? (
                  <span className="hud text-hud-sm text-gold-ink">{t.rivals}</span>
                ) : row.public ? (
                  <Button variant="quiet" className="-mr-3 min-[375px]:-mr-4" disabled={busy} onClick={() => rivalBack.run({ alias: row.name, rival: true }, t.isYourRival(row.name))}>{t.rivalBack}</Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.follows.length > 0 ? <p className="text-sm text-muted">{t.followExplainer(data.follows.length, data.limit)}</p> : null}
      <ol aria-label={t.playersYouFollow} className="flex flex-col divide-y divide-rule">
        {data.follows.map((row) => (
          <li key={row.id} className={`flex min-w-0 flex-col gap-2 py-3 ${row.rival ? '-mx-2 bg-ground px-2 outline-2 outline-gold' : ''}`}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 [overflow-wrap:break-word]">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  {row.state === 'public' ? (
                    <Link to="/desk-crawler/heroes/$alias" params={{ alias: row.name }} className="font-semibold underline decoration-dotted underline-offset-4">{row.name}</Link>
                  ) : (
                    <span className="font-semibold">{shown(row.name)}</span>
                  )}
                  {row.rival ? <span className="hud text-hud-sm text-gold-ink">{t.rival}</span> : null}
                </p>
                {row.hero ? (
                  <>
                    <p className="text-sm text-muted">{row.hero.name}, {t.heroClass(row.hero.heroClass === 'rogue' ? 'rogue' : 'warrior')}</p>
                    <p className="text-sm">{t.doing(row.hero.status, row.hero.biome ?? 'Office Cubicles')}.</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">{row.state === 'private' ? t.pagePrivate : t.gone}</p>
                )}
              </div>
              {row.hero ? (
                <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
                  <span className="block text-xp-ink">{t.level(row.hero.level)}</span>
                  {row.hero.rank !== null ? <span className="block text-gold-ink">#{formatNumber(locale, row.hero.rank)}</span> : null}
                </p>
              ) : null}
            </div>
            {row.rival && row.hero ? <p className="text-sm font-semibold">{headToHead(row.name, row.hero, data.own, t)}</p> : null}
            {row.raids.won + row.raids.lost > 0 ? <p className="text-sm">{t.raidsOn(row.name)}<span className="text-xp-ink">{t.won(row.raids.won)}</span>, <span className="text-hp-ink">{t.lost(row.raids.lost)}</span>.</p> : null}
            <div className="-ml-3 flex flex-wrap gap-x-2 min-[375px]:-ml-4">
              {row.state !== 'gone' ? (
                <Button variant="quiet" disabled={busy} onClick={() => setRival.run({ followId: row.rival ? null : row.id }, row.rival ? t.rivalCleared : t.isYourRival(row.name))}>{row.rival ? t.clearRival : t.makeRival}</Button>
              ) : null}
              <Button variant="quiet" disabled={busy} onClick={() => unfollow.run({ followId: row.id }, row.state === 'gone' ? t.removed : t.unfollowed(row.name))}>{t.unfollow}</Button>
            </div>
          </li>
        ))}
      </ol>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </section>
  )
}
