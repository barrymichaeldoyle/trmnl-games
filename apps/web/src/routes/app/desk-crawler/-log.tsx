import { usePaginatedQuery } from 'convex/react'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { LogStory } from './-logStory'
import { Button } from '../../../lib/ui'
import { SectionTitle } from '../../../lib/glyphs'
import { PixelIcon } from './-pixelIcon'
import { KIND_BADGE } from '../../../lib/palette'
import { logPresentation, type LogDeltas, type PresentationOptions } from '@trmnl-games/desk-crawler/log'
import { formatDate, useLocale, useT } from '../../../lib/i18n'
import type { Locale } from '@trmnl-games/platform'
import { useStoryOptions } from '../../../lib/useStory'
import { dcLogMessages } from '../../../i18n/dcLog'
import { firstLogPage, LOG_PAGE } from './-queries'

type Entry = { id: string; at: number; tick: number | null; kind: string; summary: string; source: string; deltas: LogDeltas }

type T = (typeof dcLogMessages)['en']

/** Each filter is a badge wearing the glyph of the log lines it keeps, so all of them fit one phone-width row. */
const FILTERS = [
  { key: 'all', kinds: null, glyph: null },
  { key: 'fights', kinds: ['combat'], glyph: 'combat' },
  { key: 'finds', kinds: ['loot'], glyph: 'loot' },
  { key: 'milestones', kinds: ['levelup', 'achievement', 'career', 'occasion', 'death', 'revive', 'travel'], glyph: 'levelup' },
  { key: 'rest', kinds: ['rest', 'trap'], glyph: 'rest' },
  // D141, D145: raids, meetings and lost property are the ways another player's hero turns up.
  { key: 'raids', kinds: ['raid', 'meeting', 'lost_property'], glyph: 'raid' },
  { key: 'todo', kinds: ['todo'], glyph: 'todo' },
] as const

/** Entries shown before "Show more": the log is the longest thing on the Hero page. */
const FIRST_VIEW = 12
const MORE = 20

type FilterKey = (typeof FILTERS)[number]['key']

const dayLabel = (at: number, t: T, locale: Locale) => {
  const day = new Date(at)
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (day.toDateString() === today.toDateString()) return t.today
  if (day.toDateString() === yesterday.toDateString()) return t.yesterday
  return formatDate(locale, day, { weekday: 'long', day: 'numeric', month: 'short' })
}

const minute = (at: number) => Math.floor(at / 60_000)

/**
 * Achievements earned together (one after another within the same minute) fold into one line naming them all, so a
 * burst of unlocks reads as one moment instead of a column of identical badges. The folded line is written in the
 * reader's language from each entry's told line, so LogStory shows it as it stands.
 */
function foldAchievements(entries: Entry[], t: T, story: PresentationOptions): Entry[] {
  const out: Entry[] = []
  let run: Entry[] = []
  const flush = () => {
    if (run.length > 1) {
      const names = run.map((entry) => logPresentation(entry, story).narrative.replace(/^[^:]*?\s?:\s*/, ''))
      out.push({ ...run[0]!, id: run.map((entry) => entry.id).join('+'), summary: t.achievements(names) })
    } else out.push(...run)
    run = []
  }
  for (const entry of entries) {
    if (entry.kind === 'achievement' && (run.length === 0 || minute(run[0]!.at) === minute(entry.at))) { run.push(entry); continue }
    flush()
    if (entry.kind === 'achievement') run.push(entry)
    else out.push(entry)
  }
  flush()
  return out
}

/** One encounter = the entries a single tick wrote; companion commands stand alone. */
function group(entries: Entry[], t: T, locale: Locale) {
  const days: Array<{ label: string; encounters: Array<{ key: string; at: number; entries: Entry[] }> }> = []
  for (const entry of entries) {
    const label = dayLabel(entry.at, t, locale)
    let day = days.at(-1)
    if (!day || day.label !== label) days.push((day = { label, encounters: [] }))
    const key = entry.source === 'tick' && entry.tick !== null ? `tick-${entry.tick}` : entry.id
    const last = day.encounters.at(-1)
    if (last && last.key === key) last.entries.push(entry)
    else day.encounters.push({ key, at: entry.at, entries: [entry] })
  }
  return days
}

export function AdventureLog() {
  // Keyed on the hero, so a recruit or switch starts a fresh page instead of reusing the last hero's cursor.
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const paged = usePaginatedQuery(api.heroes.recentLog, hero ? { heroId: hero.id } : 'skip', { initialNumItems: LOG_PAGE })
  // The loader's copy of the first page stands in while the live pagination fetches its own, so the tab never opens
  // on a skeleton; it is read once from the cache, not watched, so the rows are not subscribed twice.
  const queryClient = useQueryClient()
  const preloaded = hero && paged.status === 'LoadingFirstPage' ? (queryClient.getQueryData(firstLogPage(hero.id).queryKey) as { page: Entry[] } | undefined) : undefined
  const results = preloaded ? preloaded.page : paged.results
  const status = preloaded ? 'Preloaded' : paged.status
  const loadMore = paged.loadMore
  const [filter, setFilter] = useState<FilterKey>('all')
  const [limit, setLimit] = useState(FIRST_VIEW)
  const t = useT(dcLogMessages)
  const locale = useLocale()
  const story = useStoryOptions()
  const chosen = FILTERS.find((item) => item.key === filter)!
  const kinds = chosen.kinds as readonly string[] | null
  const shown = useMemo(() => foldAchievements((results as Entry[]).filter((entry) => kinds === null || kinds.includes(entry.kind)), t, story), [results, kinds, t, story])
  const days = useMemo(() => group(shown.slice(0, limit), t, locale), [shown, limit, t, locale])
  const hidden = shown.length > limit
  const showMore = () => {
    setLimit((value) => value + MORE)
    // Fetch the next page once what is loaded runs short of the next view.
    if (status === 'CanLoadMore' && shown.length < limit + MORE * 2) loadMore(40)
  }

  return (
    <section aria-labelledby="log-title" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <SectionTitle id="log-title" glyph="quest">{t.questLog}</SectionTitle>
        {/* Seven badges share one row on phones (44px tall, as wide as the row allows), so none drops to a row of its own; the chosen one's name reads below. */}
        <div role="group" aria-label={t.filterLog} className="grid w-full grid-cols-7 gap-1 sm:flex sm:w-auto">
          {FILTERS.map((item) => {
            const pressed = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={pressed}
                aria-label={t.filters[item.key]}
                title={t.filters[item.key]}
                onClick={() => { setFilter(item.key); setLimit(FIRST_VIEW) }}
                className={`grid h-11 min-w-0 place-items-center border-2 sm:w-11 sm:shrink-0 ${pressed ? `border-night outline-2 outline-gold ${item.glyph ? KIND_BADGE[item.glyph] : 'bg-gold'} text-night` : 'border-raised bg-panel text-muted hover:border-edge hover:text-ink active:border-edge'}`}
              >
                {item.glyph ? <PixelIcon kind={item.glyph} plain /> : <span className="label-px">{t.allBadge}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <p aria-live="polite" className="mt-2 label-px text-muted">{filter === 'all' ? t.everything : t.filters[filter]}</p>

      {status === 'LoadingFirstPage' ? (
        <div role="status" aria-label={t.readingLog} className="mt-2 flex flex-col">
          <p aria-hidden="true" className="py-2 label-px text-muted">{t.today}</p>
          <ol aria-hidden="true" className="flex flex-col pb-3">
            {[0, 1, 2].map((row) => (
              <li key={row} className="grid min-h-[4.75rem] grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 border-b-2 border-rule py-2.5">
                <span className="size-8 bg-raised" />
                <span className="flex flex-col gap-2 pt-1">
                  <span className={`h-4 bg-raised ${row === 1 ? 'w-3/5' : 'w-4/5'}`} />
                  <span className="h-3 w-24 bg-raised" />
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : days.length === 0 ? (
        <p className="mt-3 text-muted">{filter === 'all' ? t.nothingLogged : t.noEntries}</p>
      ) : (
        <div className="mt-2 flex flex-col">
          {days.map((day) => (
            <section key={day.label} aria-label={day.label}>
              <h3 className="sticky top-14 z-[1] bg-ground py-2 label-px text-muted">{day.label}</h3>
              {/* D156: plain ruled rows, not boxes: a log line is read, never tapped, so it must not look like a button. */}
              <ol className="flex flex-col pb-3">
                {day.encounters.map((encounter) => (
                  <li key={encounter.key}>
                    <ul className="flex flex-col">
                      {encounter.entries.map((entry) => (
                        <li key={entry.id} className="border-b-2 border-rule py-2.5">
                          <LogStory entry={entry} story={story} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {hidden || status === 'CanLoadMore' ? (
        <Button variant="quiet" className="mt-2" onClick={showMore}>
          {t.showMore}
        </Button>
      ) : null}
      {status === 'LoadingMore' ? <p role="status" className="mt-3 text-sm">{t.loadingOlder}</p> : null}
      {status === 'Exhausted' && !hidden && days.length > 0 ? <p className="mt-3 text-xs text-muted">{t.keptThreeDays}</p> : null}
    </section>
  )
}
