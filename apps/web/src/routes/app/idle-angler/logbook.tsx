import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { fishSprite, FISH_LARGE } from '@trmnl-games/idle-angler/art/fish'
import { preload } from '../../../lib/preload'
import { useAnalyticsView } from '../../../lib/analyticsProvider'
import { useAngler } from '../../../lib/idleAngler'
import { Card, NoticeBar, useNotice } from '../../../lib/ui'
import { Gem, SpriteIcon } from '../desk-crawler/-bagSlots'
import { FishIcon } from './-art'
import { FlyBox } from './-flyBox'
import { WaterName, FishName } from './-fish'
import { seo } from '../../../lib/seo'
import { useT } from '../../../lib/i18n'
import { iaLog } from '../../../i18n/iaLog'

/** The logbook: every species by water, then the fly box. A caught fish shows its count, best weight and where to find it; an unseen one is a silhouette with its bait (epics give nothing away). */
export const Route = createFileRoute('/app/idle-angler/logbook')({
  head: () => seo({ title: 'Logbook · Idle Angler', index: false }),
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
  const t = useT(iaLog)
  const words = useAngler()
  const formatWeight = words.weight
  useAnalyticsView('logbook viewed', { species_logged: book ? book.flatMap((w) => w.species).filter((s) => s.seen).length : 0 }, Boolean(book))
  if (!book) return null
  const seen = book.flatMap((w) => w.species).filter((s) => s.seen).length
  const total = book.flatMap((w) => w.species).length
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">{t.logbook}</h1>
        <span className="text-sm text-muted">{t.speciesOf(seen, total)}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <span className="flex gap-4"><Link to="/app/idle-angler/achievements" className="underline underline-offset-4">{t.achievements}</Link><Link to="/app/idle-angler/trophies" className="underline underline-offset-4">{t.trophyWall}</Link></span>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-muted" aria-label={t.rarityKey}>
          {RARITIES.map((rarity) => <li key={rarity} className="flex items-center gap-1.5"><Gem rarity={rarity} scale={2} />{t.rarity[rarity]}</li>)}
        </ul>
      </div>
      {book.map(({ water, species }) => (
        <Card key={water.id} title={words.water(water.id)} icon="pin">
          <ul className="grid gap-3 sm:grid-cols-2">
            {species.map((s) => (
              <li key={s.id} className="flex items-start gap-3 border border-rule p-3">
                {s.seen ? <FishIcon id={s.id} size="large" scale={2} /> : <SpriteIcon sprite={silhouette(s.id)} scale={2} className="opacity-60" />}
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold"><Gem rarity={s.rarity} scale={2} />{s.seen ? <FishName id={s.id} /> : t.notCaught}</p>
                  {s.seen ? (
                    <>
                      <p className="text-sm">{t.caughtBest(s.count, formatWeight(s.bestGrams), formatWeight(s.maxGrams))}</p>
                      {/* Issue #6: what a fish of this species must weigh to go on the wall. */}
                      {s.trophyGrams ? <p className={`text-sm ${s.bestGrams >= s.trophyGrams ? 'text-gold-ink' : 'text-muted'}`}>{t.trophyAt(formatWeight(s.trophyGrams))}</p> : null}
                      <p className="text-sm text-muted">
                        {s.baits.map((b) => words.bait(b)).join(', ')}
                        {s.times ? ` · ${s.times.map((b) => words.band(b)).join(', ')}` : ''}
                        {s.weather ? ` · ${s.weather.map((w) => words.weather(w)).join(t.or)}` : ''}
                        {s.seasons ? ` · ${s.seasons.map((x) => words.season(x)).join(t.or)}` : ''}
                      </p>
                    </>
                  ) : <p className="text-sm text-muted">{s.baits ? t.baitOnly(s.baits.map((b) => words.bait(b)).join(t.or)) : s.rarity === 'epic' ? t.epicHint : <>{t.rareOf(words.rarity(s.rarity))[0]}<WaterName id={water.id} />{t.rareOf(words.rarity(s.rarity))[1]}</>}</p>}
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
