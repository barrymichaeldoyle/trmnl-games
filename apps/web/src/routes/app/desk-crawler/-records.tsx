import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { Glyph, SectionTitle, type GlyphName } from '../../../lib/glyphs'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { dcLogMessages } from '../../../i18n/dcLog'

type Counters = { combatWins: number; retreats: number; deaths: number; rescues: number; goldEarned: number; itemsFound: number; ticksExplored: number; eliteWins: number; potionsUsed: number; potionsCombined: number; trapsAvoided: number; itemsSold: number }

const hours = (ticks: number, t: (typeof dcLogMessages)['en']) => {
  const total = Math.round((ticks * 15) / 60)
  return total < 48 ? t.hours(total) : t.days(Math.round(total / 24))
}

/** This week's rank in the hero's level group (D202), from the same published board as Rankings. */
function Rank({ stopped }: { stopped: boolean }) {
  const { data } = useQuery(convexQuery(api.leaderboard.view, {}))
  const t = useT(dcLogMessages)
  if (!data) return <p className="text-muted">{t.readingRankings}</p>
  const board = data as { published: boolean; cohortKey?: string; totalPlayers?: number; own?: { rank: number; rankDelta: number | null } | null }
  const group = board.cohortKey ? t.group(board.cohortKey) : null
  if (!board.published || !board.own) {
    return <p>{board.published && stopped ? t.unrankedWeek : t.joinsRankings(group)}</p>
  }
  const delta = board.own.rankDelta
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className="hud text-base text-gold-ink">#{board.own.rank}</span>
      <span>
        {t.ofInGroup(board.totalPlayers ?? 0, group ?? '')}
        {delta ? <span className={`ml-1 inline-flex items-center gap-1 font-semibold ${delta > 0 ? 'text-xp-ink' : 'text-hp-ink'}`}><Glyph name={delta > 0 ? 'up' : 'down'} size={8} />{delta > 0 ? t.up(delta) : t.down(Math.abs(delta))}</span> : null}
      </span>
    </p>
  )
}

/** `withRank` draws this week's rank and the link to the Rankings page; the Rankings page itself leaves both out. */
export function Records({ counters, lifetimeXp, stopped = false, withRank = true }: { counters: Counters; lifetimeXp: number; stopped?: boolean; withRank?: boolean }) {
  // Each record wears its stat's glyph in that stat's ink (the One Meaning Rule); the label still names it.
  const t = useT(dcLogMessages)
  const locale = useLocale()
  const n = (value: number) => formatNumber(locale, value)
  const rows: Array<[string, string, GlyphName, string]> = [
    [t.recordRows.lifetimeXp, n(lifetimeXp), 'levelup', 'text-xp-ink'],
    [t.recordRows.fightsWon, n(counters.combatWins), 'combat', 'text-hp-ink'],
    [t.recordRows.retreats, n(counters.retreats), 'flag', 'text-muted'],
    [t.recordRows.knockouts, n(counters.deaths), 'death', 'text-hp-ink'],
    [t.recordRows.rescues, n(counters.rescues), 'revive', 'text-xp-ink'],
    [t.recordRows.itemsFound, n(counters.itemsFound), 'loot', 'text-gold-ink'],
    [t.recordRows.goldEarned, n(counters.goldEarned), 'coin', 'text-gold-ink'],
    [t.recordRows.timeAdventuring, hours(counters.ticksExplored, t), 'clock', 'text-sky-ink'],
    [t.recordRows.elitesBeaten, n(counters.eliteWins), 'star', 'text-hp-ink'],
    [t.recordRows.potionsDrunk, n(counters.potionsUsed), 'potion', 'text-rare-ink'],
    [t.recordRows.potionsCombined, n(counters.potionsCombined), 'potion', 'text-rare-ink'],
    [t.recordRows.trapsAvoided, n(counters.trapsAvoided), 'trap', 'text-rare-ink'],
    [t.recordRows.itemsSold, n(counters.itemsSold), 'tag', 'text-gold-ink'],
  ]
  return (
    <section aria-labelledby="records-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <SectionTitle id="records-title" glyph="medal">{t.records}</SectionTitle>
        {withRank ? <Link to="/app/desk-crawler/leaderboard" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          {t.allRankings}
        </Link> : null}
      </div>
      {withRank ? <Rank stopped={stopped} /> : null}
      {/* Two columns even on phones: twelve single rows made the section a screen tall. */}
      <dl className="grid grid-cols-2 gap-x-3 min-[480px]:gap-x-6">
        {rows.map(([label, value, glyph, tone]) => (
          // Under 480px a half-width row cannot hold a label like "Time adventuring" beside its figure, so the figure sits under it.
          <div key={label} className="flex min-w-0 flex-col gap-0.5 border-t-2 border-dashed border-rule py-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between min-[480px]:gap-2">
            <dt className="flex min-w-0 items-center gap-2 label-px text-muted"><Glyph name={glyph} className={`shrink-0 ${tone}`} />{label}</dt>
            <dd className="pl-6 font-bold whitespace-nowrap tabular-nums min-[480px]:pl-0">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
