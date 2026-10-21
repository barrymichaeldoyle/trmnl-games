import { createFileRoute } from '@tanstack/react-router'
import { CHANGELOG, changeDay as day, changeIn, changeKey } from '../lib/changelog'
import { ProsePage } from '../lib/prose'
import { seo } from '../lib/seo'
import { messagesFor, useLocale, useT } from '../lib/i18n'
import { headMessages } from '../i18n/heads'
import { pagesMessages } from '../i18n/pages'

export const Route = createFileRoute('/whats-new')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).news, path: '/whats-new', description: messagesFor(headMessages, locale).newsDescription, locale }),
  component: WhatsNew,
})

function WhatsNew() {
  const t = useT(pagesMessages)
  const locale = useLocale()
  return (
    <ProsePage title={t.newsTitle}>
      <p>{t.newsIntro}</p>
      {CHANGELOG.map((entry) => (
        <section key={entry.date} aria-labelledby={`day-${entry.date}`}>
          <h2 id={`day-${entry.date}`}><time dateTime={entry.date}>{day(entry.date, true, locale)}</time></h2>
          {entry.changes.map((change, index) => (
            <div key={change.title} id={changeKey(entry, index)}>
              <h3>{changeIn(change, locale).title}</h3>
              <p>{changeIn(change, locale).body}</p>
            </div>
          ))}
        </section>
      ))}
    </ProsePage>
  )
}
