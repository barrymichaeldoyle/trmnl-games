import { createFileRoute } from '@tanstack/react-router'
import { CHANGELOG, changeDay as day, changeIn, changeIsFor, changeKey, GAME_TAG_NAMES, GAME_TAGS, type GameTag } from '../lib/changelog'
import { ProsePage } from '../lib/prose'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, LINK_BUTTON } from '../lib/ui'
import { seo } from '../lib/seo'
import { messagesFor, useLocale, useT } from '../lib/i18n'
import { headMessages } from '../i18n/heads'
import { pagesMessages } from '../i18n/pages'

const isGameTag = (value: unknown): value is GameTag => typeof value === 'string' && (GAME_TAGS as readonly string[]).includes(value)

export const Route = createFileRoute('/whats-new')({
  // D225: `?game=idle-angler` opens the page on one game's changes; anything else shows them all.
  validateSearch: (search: Record<string, unknown>): { game?: GameTag } => (isGameTag(search.game) ? { game: search.game } : {}),
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).news, path: '/whats-new', description: messagesFor(headMessages, locale).newsDescription, locale }),
  component: WhatsNew,
})

function WhatsNew() {
  const t = useT(pagesMessages)
  const locale = useLocale()
  const { game } = Route.useSearch()
  const navigate = Route.useNavigate()
  const choice = (value: GameTag | undefined, label: string) => (
    <button
      type="button"
      aria-pressed={game === value}
      onClick={() => void navigate({ search: value ? { game: value } : {}, replace: true, resetScroll: false })}
      className={`${LINK_BUTTON} ${game === value ? BUTTON_PRIMARY : BUTTON_SECONDARY}`}
    >
      {label}
    </button>
  )
  return (
    <ProsePage title={t.newsTitle}>
      <p>{t.newsIntro}</p>
      <div role="group" aria-label={t.newsFilter} className="not-prose flex flex-wrap gap-2">
        {choice(undefined, t.newsAllGames)}
        {GAME_TAGS.map((tag) => choice(tag, GAME_TAG_NAMES[tag]))}
      </div>
      {CHANGELOG.flatMap((entry) => {
        const shown = entry.changes.map((change, index) => ({ change, index })).filter(({ change }) => changeIsFor(change, game))
        if (shown.length === 0) return []
        return [
          <section key={entry.date} aria-labelledby={`day-${entry.date}`}>
            <h2 id={`day-${entry.date}`}><time dateTime={entry.date}>{day(entry.date, true, locale)}</time></h2>
            {shown.map(({ change, index }) => (
              <div key={change.title} id={changeKey(entry, index)}>
                <h3>
                  {changeIn(change, locale).title}
                  {/* The game a change is about (D225); a change for everyone carries no mark. */}
                  {change.game ? <span className="ml-2 align-middle border-[2px] border-night px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">{GAME_TAG_NAMES[change.game]}</span> : null}
                </h3>
                <p>{changeIn(change, locale).body}</p>
              </div>
            ))}
          </section>,
        ]
      })}
    </ProsePage>
  )
}
