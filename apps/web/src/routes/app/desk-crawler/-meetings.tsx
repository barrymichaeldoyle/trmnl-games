import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import { SectionTitle } from '../../../lib/glyphs'
import { PixelIcon } from './-pixelIcon'
import { KIND_BADGE } from '../../../lib/palette'
import { LocalTime } from '../../../lib/localTime'
import { WithName } from './-withName'

type Meeting = { tick: number; at: number; role: 'starter' | 'partner'; rivalName: string; profile: boolean; kindName: string; boon: string; floor: string; pending: boolean }

const when = (day: Date) => {
  const today = new Date()
  const time = day.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return day.toDateString() === today.toDateString() ? time : `${day.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`
}

/** "Coffee run with Quill", in the log's own voice. */
const describe = (meeting: Meeting) => `${meeting.kindName} with {name}`

/**
 * Meetings (D141): the lifetime count and the last five meetings either way. Like raids they need no hand, so this
 * is a window on who your hero ran into, never a control; it stays hidden until the world has meetings or the hero
 * has met someone.
 */
export function Meetings({ enabled }: { enabled: boolean }) {
  const { data } = useQuery(convexQuery(api.meetings.recent, {}))
  if (!data) return null
  const { total, meetings } = data
  if (!enabled && total === 0) return null
  return (
    <section aria-labelledby="meetings-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <SectionTitle id="meetings-title" glyph="meeting" tone="text-sky-ink">Coworkers</SectionTitle>
      <p className="text-sm text-muted">Now and then your hero runs into another player's hero on the same floor. Both get the same small boon for 8 adventures.</p>
      <dl className="grid grid-cols-2 gap-x-4 min-[480px]:gap-x-6">
        <div className="flex min-w-0 items-baseline justify-between gap-2 border-t-2 border-dashed border-rule py-2">
          <dt className="label-px min-w-0 text-muted">Meetings</dt>
          <dd className="font-bold whitespace-nowrap tabular-nums">{total.toLocaleString()}</dd>
        </div>
      </dl>
      {meetings.length === 0 ? (
        <p className="text-sm">Nobody yet. Meetings happen automatically while your hero explores.</p>
      ) : (
        <ol aria-label="Recent meetings" className="flex flex-col gap-2">
          {meetings.map((meeting) => (
            <li key={`${meeting.role}-${meeting.tick}-${meeting.rivalName}`} className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3">
              <span aria-hidden="true" className={`grid size-8 place-items-center border-2 border-night ${KIND_BADGE.meeting}`}><PixelIcon kind="meeting" plain className="text-night" /></span>
              <div className="min-w-0">
                <p className="pt-1 break-words"><WithName text={describe(meeting)} name={meeting.rivalName} profile={meeting.profile} /></p>
                <p className="flex flex-wrap gap-x-3 text-xs font-semibold tabular-nums">
                  {meeting.boon ? <span className="text-sky-ink">{meeting.boon}</span> : null}
                  <span className="text-muted">{meeting.floor}</span>
                  <LocalTime className="text-muted" at={meeting.at} format={when} />
                  {meeting.pending ? <span className="text-muted">lands on their next adventure</span> : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
