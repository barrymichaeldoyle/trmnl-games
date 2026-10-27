import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import { SectionTitle } from '../../../lib/glyphs'
import { PixelIcon } from './-pixelIcon'
import { KIND_BADGE } from '../../../lib/palette'
import { LocalTime } from '../../../lib/localTime'
import { WithName } from './-withName'
import { formatDate, formatNumber, formatTime, useLocale, useT } from '../../../lib/i18n'
import type { Locale } from '@trmnl-games/platform'
import { dcLogMessages } from '../../../i18n/dcLog'

type Raid = { tick: number; at: number; role: 'raider' | 'target'; rivalName: string; profile: boolean; won: boolean; gold: number; hpLost: number | null; pending: boolean; mishap?: true; rival?: true }

/** One raid from this hero's side, in the log's own voice. */
const describe = (raid: Raid) =>
  raid.mishap ? (raid.role === 'raider' ? 'mishapRaider' : 'mishapTarget')
  : raid.role === 'raider' ? (raid.won ? 'raided' : 'caughtRaiding') : raid.won ? 'caught' : 'raidedBy'

const when = (locale: Locale) => (day: Date) => {
  const today = new Date()
  const time = formatTime(locale, day)
  return day.toDateString() === today.toDateString() ? time : `${formatDate(locale, day, { weekday: 'short' })} ${time}`
}

/**
 * Desk raids (D110): the lifetime record and the last five raids either way. Raids need no hand, so this is a
 * window on what happened, never a control; it stays hidden until the world has raids or the hero has a record.
 */
export function Raids({ enabled }: { enabled: boolean }) {
  const { data } = useQuery(convexQuery(api.raids.recent, {}))
  const t = useT(dcLogMessages)
  const locale = useLocale()
  if (!data) return null
  const { record, raids } = data
  if (!enabled && record.launched + record.repelled + record.lost + record.mishaps === 0) return null
  const tally: Array<[string, number]> = [
    [t.tally.raidsWon, record.won],
    [t.tally.raidsFailed, record.launched - record.won],
    [t.tally.repelled, record.repelled],
    [t.tally.deskRaided, record.lost],
    // D139: Friday the 13th raids, which nobody wins; shown once there has been one.
    ...(record.mishaps > 0 ? [[t.tally.mishaps, record.mishaps] as [string, number]] : []),
  ]
  return (
    <section aria-labelledby="raids-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="raids-title" glyph="raid" tone="text-rare-ink">{t.raids}</SectionTitle>
      <p className="text-sm text-muted">{t.raidsExplainer}</p>
      {/* Before the first raid the card is its explainer and one line: four zeros told the player nothing (D167). */}
      {record.launched + record.repelled + record.lost + record.mishaps > 0 ? <dl className="grid grid-cols-2 gap-x-4 min-[480px]:gap-x-6">
        {tally.map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-baseline justify-between gap-2 border-t-2 border-dashed border-rule py-2">
            <dt className="label-px min-w-0 text-muted">{label}</dt>
            <dd className="font-bold whitespace-nowrap tabular-nums">{formatNumber(locale, value)}</dd>
          </div>
        ))}
      </dl> : null}
      {raids.length === 0 ? (
        <p className="text-sm">{t.noRaids}</p>
      ) : (
        <ol aria-label={t.recentRaids} className="flex flex-col gap-2">
          {raids.map((raid) => (
            <li key={`${raid.role}-${raid.tick}-${raid.rivalName}`} className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3">
              <span aria-hidden="true" className={`grid size-8 place-items-center border-2 border-night ${KIND_BADGE.raid}`}><PixelIcon kind="raid" plain className="text-night" /></span>
              <div className="min-w-0">
                <p className="pt-1 break-words"><WithName text={t.raidLine[describe(raid)]} name={raid.rivalName} profile={raid.profile} /></p>
                <p className="flex flex-wrap gap-x-3 text-xs font-semibold tabular-nums">
                  <span className={raid.won ? 'text-xp-ink' : 'text-hp-ink'}>{raid.mishap ? t.mishap : raid.won ? t.raidWon : t.raidLost}</span>
                  <LocalTime className="text-muted" at={raid.at} format={when(locale)} />
                  <span className="text-gold-ink">{raid.won ? '+' : '−'}{t.gold(formatNumber(locale, raid.gold))}</span>
                  {raid.hpLost !== null ? <span className="text-hp-ink">{t.hp(raid.hpLost)}</span> : null}
                  {raid.pending ? <span className="text-muted">{t.landsNext}</span> : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
