import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { printPath } from '@trmnl-games/pixel-wars/art/route'
import type { FactionId } from '@trmnl-games/pixel-wars/sim'
import { artUrl } from '../../../lib/artUrl'
import { useIntent } from '../../../lib/intent'
import { LocalTime } from '../../../lib/localTime'
import { formatNumber, useLocale } from '../../../lib/i18n'
import { preload } from '../../../lib/preload'
import { seo } from '../../../lib/seo'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import type { WarView } from '../../../lib/pixelWars'
import { FactionName, Swatch } from './-shared'

/** The Season page (pixel-wars.md "Companion"): the week's standings, your week, the invite link, a switch in the bell hour, and past prints. */
export const Route = createFileRoute('/app/pixel-wars/season')({
  head: () => seo({ title: 'Season · Pixel Wars', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.pixelWars.desks.view, {}), convexQuery(api.pixelWars.desks.seasons, {})),
  component: SeasonPage,
})

type Season = { id: string; week: number; endedAt: number; winner: FactionId; standings: Array<{ faction: FactionId; score: number; percent: number }>; desks: number; cols: number; rows: number }

function SeasonPage() {
  const { data } = useQuery(convexQuery(api.pixelWars.desks.view, {}))
  const { data: past } = useQuery(convexQuery(api.pixelWars.desks.seasons, {}))
  const { notice, notify, dismiss } = useNotice()
  const switchSide = useIntent(api.pixelWars.desks.switchFaction, { onFeedback: notify })
  const [copied, setCopied] = useState(false)
  const locale = useLocale()
  const view = data as WarView | undefined
  const desk = view?.desk
  if (!view || !desk || !view.map) return null
  const map = view.map
  const score = map.seasonScore
  const total = view.factions.reduce((s, f) => s + (score[f.id] ?? 0), 0)
  const standings = [...view.factions].sort((a, b) => (score[b.id] ?? 0) - (score[a.id] ?? 0) || a.id - b.id)
  const link = `${typeof window === 'undefined' ? '' : window.location.origin}/app/pixel-wars?invite=${desk.inviteCode}`
  const seasons = (past ?? []) as Season[]
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Season</h1>
      <Card title={`Week ${view.season.week}`}>
        <p className="mb-3 text-sm text-muted">The side that holds the most ground for the longest wins. The bell rings <LocalTime at={view.season.endsAt} format={(d) => d.toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })} />, then the map is painted clean.</p>
        <ol className="flex flex-col divide-y divide-rule">
          {standings.map((f, i) => {
            const share = map.shares.find((s) => s.faction === f.id)
            return (
              <li key={f.id} className={`flex items-center justify-between gap-3 py-2 ${f.id === desk.faction ? 'font-semibold' : ''}`}>
                <span className="flex items-center gap-2"><span className="w-5 text-muted">{i + 1}.</span><FactionName faction={f.id} factions={view.factions} /></span>
                <span className="text-sm tabular-nums"><span className="text-muted">{share?.percent ?? 0}% now · </span>{total > 0 ? Math.round(((score[f.id] ?? 0) * 100) / total) : 0}% of the week</span>
              </li>
            )
          })}
        </ol>
      </Card>
      <Card title="Your week">
        <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <li><strong className="block text-xl">{formatNumber(locale, desk.week.painted)}</strong>painted</li>
          <li><strong className="block text-xl">{formatNumber(locale, desk.week.flipped)}</strong>taken</li>
          <li><strong className="block text-xl">{formatNumber(locale, desk.week.desksTaken)}</strong>desks taken</li>
          <li><strong className="block text-xl">{formatNumber(locale, desk.week.lost)}</strong>lost</li>
        </ul>
        <p className="mt-3 text-sm text-muted">{desk.week.fell > 0 ? `Your desk fell ${desk.week.fell === 1 ? 'once' : `${desk.week.fell} times`}${desk.week.liberated > 0 ? `, and you liberated ${desk.week.liberated}` : ''}.` : 'Your desk has held all week.'}</p>
      </Card>
      <Card title="Invite a neighbour">
        <p className="mb-3 text-sm text-muted">A friend who joins by this link lands beside your desk, on your side, whatever its share.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate border-2 border-edge bg-ground px-2 py-2 text-sm">{link}</code>
          <Button variant="secondary" allowOffline onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : 'Copy link'}</Button>
        </div>
      </Card>
      {view.season.bellHour ? (
        <Card title="Switch sides">
          <p className="mb-3 text-sm text-muted">The hour after the bell is the one time a side can change, once a season. Your desk stays where it is.</p>
          {desk.canSwitch ? (
            <ul className="flex flex-wrap gap-2">
              {view.factions.filter((f) => f.id !== desk.faction).map((f) => {
                const o = view.open.find((x) => x.faction === f.id)
                return <li key={f.id}><Button variant="secondary" disabled={switchSide.pending || (o !== undefined && !o.open)} onClick={() => void switchSide.run({ faction: f.id }, `You switched to ${f.name}.`)}><Swatch faction={f.id} factions={view.factions} className="mr-2" />{f.name}{o && !o.open ? ' (full)' : ''}</Button></li>
              })}
            </ul>
          ) : <p className="text-sm">Already switched this season.</p>}
        </Card>
      ) : null}
      <Card title="Prints">
        {seasons.length === 0 ? <p className="text-sm text-muted">The first print comes at the first bell.</p> : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {seasons.map((s) => (
              <li key={s.id} className="flex flex-col gap-1">
                <img src={artUrl(printPath(s.id, Math.max(4, Math.min(12, Math.floor(300 / Math.max(s.cols, s.rows))))))} alt={`The map at the end of week ${s.week}`} className="window block w-full bg-white [image-rendering:pixelated]" />
                <span className="text-sm"><strong>Week {s.week}</strong> · <FactionName faction={s.winner} factions={view.factions} /> won · {s.desks} desks</span>
                <span className="text-xs text-muted">{s.standings.map((r) => `${view.factions.find((f) => f.id === r.faction)?.name ?? ''} ${r.percent}%`).join(' · ')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
