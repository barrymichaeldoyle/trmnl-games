import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { fishSprite, FISH_LARGE } from '@trmnl-games/idle-angler/art/fish'
import { preload } from '../../../lib/preload'
import { useAnalyticsView } from '../../../lib/analyticsProvider'
import { BAIT_LABEL, BAND_LABEL, SEASON_LABEL, WEATHER_LABEL, formatWeight } from '../../../lib/idleAngler'
import { Card, NoticeBar, useNotice } from '../../../lib/ui'
import { Gem, SpriteIcon } from '../desk-crawler/-bagSlots'
import { FishIcon } from './-art'
import { FlyBox } from './-flyBox'
import { WaterName, FishName } from './-fish'

/** The logbook: every species by water, then the fly box. A caught fish shows its count, best weight and where to find it; an unseen one is a silhouette with its bait (epics give nothing away). */
export const Route = createFileRoute('/app/idle-angler/logbook')({
  // D180: a fly QR's six digits, added by the fly box and then dropped from the address.
  validateSearch: (search: Record<string, unknown>): { fly?: string } => (typeof search.fly === 'string' && /^\d{6}$/.test(search.fly) ? { fly: search.fly } : typeof search.fly === 'number' && Number.isInteger(search.fly) && search.fly >= 0 && search.fly < 1e6 ? { fly: String(search.fly).padStart(6, '0') } : {}),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.logbook, {}), convexQuery(api.idleAngler.flies.mine, {})),
  component: LogbookPage,
})

type Entry =
  | { id: string; seen: true; name: string; rarity: string; count: number; bestGrams: number; maxGrams: number; trophyGrams?: number | null; baits: string[]; times: string[] | null; weather: string[] | null; seasons?: string[] | null }
  | { id: string; seen: false; rarity: string; baits?: string[] | null }

/** An unseen fish: its outline in full ink, so the shape hints without naming it. */
function silhouette(id: string) {
  const sprite = fishSprite(id, FISH_LARGE.width, FISH_LARGE.height)
  return { ...sprite, rows: sprite.rows.map((row) => row.replace(/[^ ]/g, ':')) }
}

const RARITIES = ['common', 'uncommon', 'rare', 'epic'] as const

function LogbookPage() {
  const { fly: scanned } = Route.useSearch()
  const { data } = useQuery(convexQuery(api.idleAngler.anglers.logbook, {}))
  const { notice, notify, dismiss } = useNotice()
  const book = data as Array<{ water: { id: string; name: string }; species: Entry[] }> | null | undefined
  useAnalyticsView('logbook viewed', { species_logged: book ? book.flatMap((w) => w.species).filter((s) => s.seen).length : 0 }, Boolean(book))
  if (!book) return null
  const seen = book.flatMap((w) => w.species).filter((s) => s.seen).length
  const total = book.flatMap((w) => w.species).length
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Logbook</h1>
        <span className="text-sm text-muted">{seen} of {total} species</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <span className="flex gap-4"><Link to="/app/idle-angler/achievements" className="underline underline-offset-4">Achievements</Link><Link to="/app/idle-angler/trophies" className="underline underline-offset-4">Trophy wall</Link></span>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-muted" aria-label="Rarity key">
          {RARITIES.map((rarity) => <li key={rarity} className="flex items-center gap-1.5"><Gem rarity={rarity} scale={2} />{rarity[0]!.toUpperCase() + rarity.slice(1)}</li>)}
        </ul>
      </div>
      {book.map(({ water, species }) => (
        <Card key={water.id} title={water.name} icon="pin">
          <ul className="grid gap-3 sm:grid-cols-2">
            {species.map((s) => (
              <li key={s.id} className="flex items-start gap-3 border border-rule p-3">
                {s.seen ? <FishIcon id={s.id} size="large" scale={2} /> : <SpriteIcon sprite={silhouette(s.id)} scale={2} className="opacity-60" />}
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold"><Gem rarity={s.rarity} scale={2} />{s.seen ? <FishName id={s.id}>{s.name}</FishName> : 'Not caught yet'}</p>
                  {s.seen ? (
                    <>
                      <p className="text-sm">{s.count} caught · best {formatWeight(s.bestGrams)} of {formatWeight(s.maxGrams)}</p>
                      {/* Issue #6: what a fish of this species must weigh to go on the wall. */}
                      {s.trophyGrams ? <p className={`text-sm ${s.bestGrams >= s.trophyGrams ? 'text-gold-ink' : 'text-muted'}`}>Trophy at {formatWeight(s.trophyGrams)}</p> : null}
                      <p className="text-sm text-muted">
                        {s.baits.map((b) => BAIT_LABEL[b]).join(', ')}
                        {s.times ? ` · ${s.times.map((t) => BAND_LABEL[t]).join(', ')}` : ''}
                        {s.weather ? ` · ${s.weather.map((w) => WEATHER_LABEL[w]).join(' or ')}` : ''}
                        {s.seasons ? ` · ${s.seasons.map((x) => SEASON_LABEL[x]).join(' or ')}` : ''}
                      </p>
                    </>
                  ) : <p className="text-sm text-muted">{s.baits ? `Bait: ${s.baits.map((b) => BAIT_LABEL[b]).join(' or ')}` : s.rarity === 'epic' ? 'Needs the right bait, hour and weather.' : <>A {s.rarity} fish of <WaterName id={water.id} />.</>}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <FlyBox notify={notify} scanned={scanned} />
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
