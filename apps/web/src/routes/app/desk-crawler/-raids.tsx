import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import { SectionTitle } from '../../../lib/glyphs'
import { PixelIcon } from './-pixelIcon'
import { KIND_BADGE } from '../../../lib/palette'
import { LocalTime } from '../../../lib/localTime'
import { WithName } from './-withName'

type Raid = { tick: number; at: number; role: 'raider' | 'target'; rivalName: string; profile: boolean; won: boolean; gold: number; hpLost: number | null; pending: boolean; mishap?: true; rival?: true }

/** One raid from this hero's side, in the log's own voice. */
const describe = (raid: Raid) =>
  raid.mishap ? (raid.role === 'raider' ? 'A raid on {name}\'s desk went wrong' : '{name}\'s raid went wrong')
  : raid.role === 'raider' ? (raid.won ? 'Raided {name}\'s desk' : 'Caught raiding {name}\'s desk') : raid.won ? 'Caught {name} raiding' : 'Raided by {name}'

const when = (day: Date) => {
  const today = new Date()
  const time = day.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return day.toDateString() === today.toDateString() ? time : `${day.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`
}

/**
 * Desk raids (D110): the lifetime record and the last five raids either way. Raids need no hand, so this is a
 * window on what happened, never a control; it stays hidden until the world has raids or the hero has a record.
 */
export function Raids({ enabled }: { enabled: boolean }) {
  const { data } = useQuery(convexQuery(api.raids.recent, {}))
  if (!data) return null
  const { record, raids } = data
  if (!enabled && record.launched + record.repelled + record.lost + record.mishaps === 0) return null
  const tally: Array<[string, number]> = [
    ['Raids won', record.won],
    ['Raids failed', record.launched - record.won],
    ['Raiders repelled', record.repelled],
    ['Desk raided', record.lost],
    // D139: Friday the 13th raids, which nobody wins; shown once there has been one.
    ...(record.mishaps > 0 ? [['Mishaps', record.mishaps] as [string, number]] : []),
  ]
  return (
    <section aria-labelledby="raids-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="raids-title" glyph="raid" tone="text-rare-ink">Raids</SectionTitle>
      <p className="text-sm text-muted">Heroes raid each other's desks by chance while exploring. Your stance sets how often yours raids and how often it wins.</p>
      <dl className="grid grid-cols-2 gap-x-4 min-[480px]:gap-x-6">
        {tally.map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-baseline justify-between gap-2 border-t-2 border-dashed border-rule py-2">
            <dt className="label-px min-w-0 text-muted">{label}</dt>
            <dd className="font-bold whitespace-nowrap tabular-nums">{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      {raids.length === 0 ? (
        <p className="text-sm">No raids yet. They happen automatically while your hero explores.</p>
      ) : (
        <ol aria-label="Recent raids" className="flex flex-col gap-2">
          {raids.map((raid) => (
            <li key={`${raid.role}-${raid.tick}-${raid.rivalName}`} className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3">
              <span aria-hidden="true" className={`grid size-8 place-items-center border-2 border-night ${KIND_BADGE.raid}`}><PixelIcon kind="raid" plain className="text-night" /></span>
              <div className="min-w-0">
                <p className="pt-1 break-words"><WithName text={describe(raid)} name={raid.rivalName} profile={raid.profile} /></p>
                <p className="flex flex-wrap gap-x-3 text-xs font-semibold tabular-nums">
                  <span className={raid.won ? 'text-xp-ink' : 'text-hp-ink'}>{raid.mishap ? 'Mishap' : raid.won ? 'Won' : 'Lost'}</span>
                  {/* D143: a raid that went after the raider's rival, told on both sides. */}
                  {raid.rival ? <span className="text-gold-ink">{raid.role === 'raider' ? 'Your rival' : "You're their rival"}</span> : null}
                  <LocalTime className="text-muted" at={raid.at} format={when} />
                  <span className="text-gold-ink">{raid.won ? '+' : '−'}{raid.gold.toLocaleString()} gold</span>
                  {raid.hpLost !== null ? <span className="text-hp-ink">−{raid.hpLost} HP</span> : null}
                  {raid.pending ? <span className="text-muted">lands on the next adventure</span> : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
