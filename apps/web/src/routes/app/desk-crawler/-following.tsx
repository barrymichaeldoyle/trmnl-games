import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { SectionTitle } from '../../../lib/glyphs'
import { useIntent } from '../../../lib/intent'
import { Button, NoticeBar, useNotice } from '../../../lib/ui'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { dcLogMessages } from '../../../i18n/dcLog'
import { useShownName } from './-withName'

/**
 * Following (D143): the players this account follows, newest first, each linking to their public page. A follow is
 * silent and changes nothing in play (the rival went in D205). Hidden until there is at least one.
 */
export function FollowingCard() {
  const { data } = useQuery(convexQuery(api.follows.list, {}))
  const { notice, notify, dismiss } = useNotice()
  const t = useT(dcLogMessages)
  const locale = useLocale()
  const shown = useShownName()
  const unfollow = useIntent(api.follows.unfollow, { onFeedback: notify })
  if (!data || data.follows.length === 0) return null
  return (
    <section aria-labelledby="following-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="following-title" glyph="eye" tone="text-sky-ink">{t.following}</SectionTitle>
      <p className="text-sm text-muted">{t.followExplainer(data.follows.length, data.limit)}</p>
      <ol aria-label={t.playersYouFollow} className="flex flex-col divide-y divide-rule">
        {data.follows.map((row) => (
          <li key={row.id} className="flex min-w-0 flex-col gap-2 py-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 [overflow-wrap:break-word]">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  {row.state === 'public' ? (
                    <Link to="/desk-crawler/heroes/$alias" params={{ alias: row.name }} className="font-semibold underline decoration-dotted underline-offset-4">{row.name}</Link>
                  ) : (
                    <span className="font-semibold">{shown(row.name)}</span>
                  )}
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
            <div className="-ml-3 flex flex-wrap gap-x-2 min-[375px]:-ml-4">
              <Button variant="quiet" disabled={unfollow.pending} onClick={() => unfollow.run({ followId: row.id }, row.state === 'gone' ? t.removed : t.unfollowed(row.name))}>{t.unfollow}</Button>
            </div>
          </li>
        ))}
      </ol>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </section>
  )
}
