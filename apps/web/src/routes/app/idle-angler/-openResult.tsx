import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { api } from '@trmnl-games/backend/api'
import { Confetti, useBurst } from '../../../lib/confetti'
import { Glyph } from '../../../lib/glyphs'
import { useAngler } from '../../../lib/idleAngler'
import { useIntent } from '../../../lib/intent'
import { useT } from '../../../lib/i18n'
import { Button } from '../../../lib/ui'
import { iaLog } from '../../../i18n/iaLog'
import { iaOpenResult } from '../../../i18n/iaOpenResult'
import { FishIcon } from './-art'
import { Coins } from './-coins'
import { FishName, WaterName } from './-fish'
import { Rows } from './-rows'

type Result = { waterId: string; speciesId: string; grams: number; rank: number | null; entries: number; more: boolean; winnerGrams: number | null; place: number | null; prize: number; passed: boolean }

/**
 * D247: how the angler did in last weekend's Opens, on the Dock from Monday until Friday or until Nice. A medal gets
 * the gold frame and confetti, as a new badge does; any other entry gets its place, the winner's weight and its
 * rosette, so taking part is still marked. A card in the page, never a modal.
 */
export function OpenResultCard() {
  const { data } = useQuery(convexQuery(api.idleAngler.full.openResult, {}))
  const seen = useIntent(api.idleAngler.full.seeOpenResult)
  const t = useT(iaOpenResult)
  const log = useT(iaLog)
  const words = useAngler()
  const [burst, fireBurst] = useBurst()
  const fired = useRef<string | null>(null)
  const medal = data?.results.some((r) => r.place !== null) ?? false
  useEffect(() => {
    if (data && medal && fired.current !== data.period) {
      fired.current = data.period
      fireBurst()
    }
  }, [data, medal, fireBurst])
  if (!data) return null
  const results = data.results as Result[]
  return (
    <section aria-labelledby="open-result-title" className={`relative flex flex-col gap-3 bg-panel p-3 ${medal ? 'border-4 border-gold' : 'border-2 border-rule'}`}>
      {burst > 0 ? <Confetti key={burst} /> : null}
      <h2 id="open-result-title" className="inline-flex items-center gap-2 text-sm font-semibold text-gold-ink"><Glyph name="medal" size={12} />{t.title(results.length)}</h2>
      <ul className="flex flex-col gap-3">
        {results.map((r) => (
          <li key={r.waterId} className="flex flex-col gap-2 border-b border-rule pb-3 last:border-b-0 last:pb-0">
            <p className="flex items-center gap-3">
              <FishIcon id={r.speciesId} scale={2} className={r.place !== null ? 'badge-pop-in' : undefined} />
              <span className="min-w-0 leading-tight">
                <span className={`block font-display text-2xl font-bold ${r.place === 1 ? 'text-gold-ink' : ''}`}>{r.place !== null ? log.place[r.place] : r.rank !== null ? t.rankOf(r.rank, r.entries, r.more) : t.outside(r.entries)}</span>
                <span className="block text-sm text-muted"><FishName id={r.speciesId} /> {t.open} · <WaterName id={r.waterId} />{r.place !== null ? <> · {t.rankOf(r.rank ?? r.place, r.entries, r.more)}</> : null}</span>
              </span>
            </p>
            <Rows rows={[
              [t.yourFish, words.weight(r.grams)],
              r.winnerGrams !== null && r.rank !== 1 ? [t.winner, words.weight(r.winnerGrams)] : null,
              r.place !== null ? [t.prize, <Coins n={r.prize} sign className="text-gold-ink" />] : null,
            ]} />
            {r.passed ? <p className="text-sm text-muted">{t.passed}</p> : r.place === null ? <p className="text-sm text-muted">{t.rosette}</p> : null}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={seen.pending} onClick={() => void seen.run({ period: data.period }, '')}>{log.nice}</Button>
        <Link to="/app/idle-angler/trophies" className="font-semibold underline underline-offset-4">{t.seeShelf}</Link>
      </div>
    </section>
  )
}
