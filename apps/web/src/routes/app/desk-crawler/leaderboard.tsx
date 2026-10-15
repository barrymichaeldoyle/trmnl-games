import { convexQuery } from '@convex-dev/react-query'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { Glyph } from '../../../lib/glyphs'
import { seo } from '../../../lib/seo'
import { Button, Card, LoadingState } from '../../../lib/ui'
import { preload } from '../../../lib/preload'
import { levelGroup } from '@trmnl-games/desk-crawler/sim/core/stats'
import { LocalTime } from '../../../lib/localTime'
import { formatNumber, messagesFor, useLocale, useT } from '../../../lib/i18n'
import { INTL_TAG } from '@trmnl-games/platform'
import { dcLogMessages } from '../../../i18n/dcLog'
import { Records } from './-records'
import { FollowingCard } from './-following'
import { useShownName } from './-withName'

export const Route = createFileRoute('/app/desk-crawler/leaderboard')({ head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(dcLogMessages, locale).rankingsTitle, index: false, locale }), loader: ({ context }) => preload(context, convexQuery(api.leaderboard.view, { board: 'recent_24h' }), convexQuery(api.heroes.mine, {}), convexQuery(api.follows.list, {})), component: Leaderboard })

type Board = 'recent_7d' | 'recent_24h' | 'overall'
// Labels short enough to sit on one line in a third of a phone screen. Shortest period first; it opens the page.
const TABS: Board[] = ['recent_24h', 'recent_7d', 'overall']

/** Player names are often one long token ("Marcus_the_Bold"): offer a line break after each underscore before any mid-word break. */
const breakable = (name: string) => name.split(/(?<=_)/).flatMap((part, index) => (index ? [<wbr key={index} />, part] : [part]))


type Row = { rank: number; name: string; hero_name: string; level: number; score: number; profile?: boolean }
/** The neighbours block shows once the hero sits below this many rows (zero-based index), where the top of the list stops showing it. */
const AROUND_FROM = 5

function RankRow({ row, own, board }: { row: Row; own: boolean; board: Board }) {
  const t = useT(dcLogMessages)
  const locale = useLocale()
  const shown = useShownName()
  return (
    <li aria-current={own ? 'true' : undefined} className={`flex min-w-0 items-start gap-3 py-3 ${own ? '-mx-2 bg-ground px-2 outline-2 outline-gold' : ''}`}>
      {/* The podium wears a crown and medals beside its gold numerals; the rest keep a blank column so names stay aligned. */}
      <span aria-hidden="true" className="flex h-6 w-4 shrink-0 items-center text-gold-ink">{row.rank === 1 ? <Glyph name="crown" /> : row.rank <= 3 ? <Glyph name="medal" /> : null}</span>
      <span className={`-ml-1 w-7 text-right font-bold tabular-nums ${row.rank <= 3 ? 'hud text-sm leading-6 text-gold-ink' : ''}`}>{row.rank}</span>
      <span className="min-w-0 flex-1 [overflow-wrap:break-word]">
        {/* D109: a hero whose owner made its page public links to it. */}
        {row.profile ? (
          <Link to="/desk-crawler/heroes/$alias" params={{ alias: row.name }} className="block font-semibold underline decoration-dotted underline-offset-4">{breakable(row.name)}</Link>
        ) : (
          <span className="block font-semibold">{breakable(shown(row.name))}</span>
        )}
        {row.hero_name ? <span className="block text-sm text-muted">{row.hero_name}</span> : null}
      </span>
      <span className={`min-w-0 max-w-[45%] shrink-0 text-right text-sm font-semibold tabular-nums [overflow-wrap:anywhere] ${board === 'overall' ? 'text-gold-ink' : 'text-xp-ink'}`}>{board === 'overall' ? t.level(row.level) : t.xp(formatNumber(locale, row.score))}</span>
    </li>
  )
}

function Leaderboard() {
  const [board, setBoard] = useState<Board>('recent_24h')
  const [cohortKey, setCohortKey] = useState<string | undefined>(undefined)
  const t = useT(dcLogMessages)
  const locale = useLocale()
  const n = (value: number) => formatNumber(locale, value)
  const updatedAt = (date: Date) => date.toLocaleString(INTL_TAG[locale], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  // The previous board stays while the next one loads, so switching period or group never collapses to a skeleton.
  const { data, isPlaceholderData } = useQuery({ ...convexQuery(api.leaderboard.view, { board, ...(cohortKey ? { cohortKey } : {}) }), placeholderData: keepPreviousData })
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const ownGroup = data?.ownCohortKey ?? (hero ? levelGroup(hero.level).key : '1-3')
  const groups = [...new Set(['1-3', '4-7', '8-11', ownGroup, ...(cohortKey ? [cohortKey] : [])])]
  const stopped = hero && (hero.status === 'paused' || (hero.status === 'sleeping' && hero.wakeAtTick === null))
  // D152: below the top five, the hero's neighbours lead the card, two either side, before the full list.
  const entries: Row[] = data?.published ? data.entries : []
  const ownIndex = data?.published && data.own ? entries.findIndex((row) => row.rank === data.own!.rank) : -1
  const aroundStart = Math.max(0, Math.min(ownIndex - 2, entries.length - 5))
  const around = ownIndex >= AROUND_FROM ? entries.slice(aroundStart, aroundStart + 5) : []
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t.rankingsTitle}</h1>
      <div role="group" aria-label={t.rankingPeriod} className="flex border-2 border-edge">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={board === tab}
            onClick={() => {
              setBoard(tab)
              setCohortKey(undefined)
            }}
            className={`menu-cursor flex min-h-11 flex-1 items-center justify-center px-1 py-2 label-px uppercase tracking-wide whitespace-nowrap not-last:border-r-2 min-[360px]:px-2 not-last:border-edge not-aria-pressed:before:hidden ${board === tab ? 'bg-navy text-gold' : 'text-muted hover:bg-rule hover:text-ink'}`}
          >
            {t.tabs[tab]}
          </button>
        ))}
      </div>
      {board !== 'overall' ? <label className="flex flex-wrap items-center gap-3 text-sm"><span className="font-semibold">{t.levelGroup}</span><select value={cohortKey ?? ownGroup} onChange={(event) => setCohortKey(event.target.value === ownGroup ? undefined : event.target.value)} className="pixel-select min-h-11 flex-1 border-2 border-edge pr-9 pl-3 text-base sm:flex-none">{groups.map((key) => <option key={key} value={key}>{t.group(key)}{key === ownGroup ? t.yourGroup : ''}</option>)}</select></label> : null}
      {!data ? (
        <LoadingState label={t.loadingRankings} />
      ) : !data.published ? (
        <Card title={t.firstRankings}>
          <p>{t.publishesHourly}</p>
        </Card>
      ) : (
        <Card title={t.cardTitle(t.group(data.cohortKey), n(data.totalPlayers), data.totalPlayers)} className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <p className="mb-3 text-sm text-muted">
            {board === 'overall' ? t.rankedByLevel : t.rankedByXp}{t.updatedHourly}
            <LocalTime at={data.scoreAt} format={updatedAt} />.
          </p>
          {data.own ? (
            <p className="mb-3 font-semibold">
              {t.youAre}<span className="text-gold-ink">#{n(data.own.rank)}</span>{t.ofTotal(n(data.totalPlayers))}
              {board !== 'overall' && data.own.score !== null ? t.withXp(n(data.own.score)) : ''}
              {data.own.rankDelta ? <>, <span className={`inline-flex items-center gap-1 ${data.own.rankDelta > 0 ? 'text-xp-ink' : 'text-hp-ink'}`}><Glyph name={data.own.rankDelta > 0 ? 'up' : 'down'} size={8} />{data.own.rankDelta > 0 ? t.up(data.own.rankDelta) : t.down(Math.abs(data.own.rankDelta))}</span>{t.sinceUpdate}</> : ''}
            </p>
          ) : ownGroup !== data.cohortKey && board !== 'overall' ? (
            <Button variant="quiet" onClick={() => setCohortKey(undefined)}>
              {t.backToGroup}
            </Button>
          ) : (
            <p className="mb-3 text-sm text-muted">{stopped && board !== 'overall' ? t.unrankedStopped : t.rankAppears}</p>
          )}
          {around.length > 0 ? (
            <section aria-label={t.aroundYou} className="mb-4">
              <h3 className="mb-1 text-sm font-semibold text-muted">{t.aroundYou}</h3>
              <ol className="flex flex-col divide-y divide-rule">
                {around.map((row: Row) => <RankRow key={row.rank} row={row} own={data.own?.rank === row.rank} board={board} />)}
              </ol>
            </section>
          ) : null}
          {around.length > 0 ? <h3 className="mb-1 text-sm font-semibold text-muted">{t.top(data.entries.length)}</h3> : null}
          {data.entries.length === 0 ? (
            <p>{t.noRanked}</p>
          ) : (
            <ol className="flex flex-col divide-y divide-rule">
              {data.entries.map((row: Row) => <RankRow key={row.rank} row={row} own={data.own?.rank === row.rank} board={board} />)}
            </ol>
          )}
          {data.totalPlayers > data.entries.length ? <p className="mt-3 text-sm text-muted">{t.topOf(data.entries.length, n(data.totalPlayers))}</p> : null}
        </Card>
      )}
      {/* D143: the players this account follows, rival first, between the board and the records. */}
      <FollowingCard />
      {/* The lifetime counts sit under the board (D124): standing and records are one subject. */}
      {hero ? <Records counters={hero.counters} lifetimeXp={hero.lifetimeXp} withRank={false} /> : null}
    </>
  )
}
