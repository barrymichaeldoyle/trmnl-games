import { createFileRoute } from '@tanstack/react-router'
import { CHANGELOG, changeDay as day, changeIn } from '../lib/changelog'
import { ProsePage } from '../lib/prose'
import { seo } from '../lib/seo'
import { messagesFor, useLocale, useT } from '../lib/i18n'
import { pagesMessages } from '../i18n/pages'

export const Route = createFileRoute('/whats-new')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(pagesMessages, locale).newsTitle, path: '/whats-new', description: messagesFor(pagesMessages, locale).newsDescription, locale }),
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
          {entry.changes.map((change) => (
            <div key={change.title}>
              <h3>{changeIn(change, locale).title}</h3>
              <p>{changeIn(change, locale).body}</p>
            </div>
          ))}
        </section>
      ))}
    </ProsePage>
  )
}
