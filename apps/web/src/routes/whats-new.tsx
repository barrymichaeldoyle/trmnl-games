import { createFileRoute } from '@tanstack/react-router'
import { CHANGELOG } from '../lib/changelog'
import { ProsePage } from '../lib/prose'
import { seo } from '../lib/seo'

/** The day an entry went live, written out in English ("14 October 2026"), the same on the server and in every browser. */
const day = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export const Route = createFileRoute('/whats-new')({
  head: () => seo({ title: 'What’s new', path: '/whats-new', description: 'What changed in Desk Crawler and when: new features and fixes, newest first.' }),
  component: () => (
    <ProsePage title="What’s new">
      <p>Changes to the games and this site, newest first.</p>
      {CHANGELOG.map((entry) => (
        <section key={entry.date} aria-labelledby={`day-${entry.date}`}>
          <h2 id={`day-${entry.date}`}><time dateTime={entry.date}>{day(entry.date)}</time></h2>
          {entry.changes.map((change) => (
            <div key={change.title}>
              <h3>{change.title}</h3>
              <p>{change.body}</p>
            </div>
          ))}
        </section>
      ))}
    </ProsePage>
  ),
})
