import { createFileRoute } from '@tanstack/react-router'
import { CHANGELOG, changeDay as day } from '../lib/changelog'
import { ProsePage } from '../lib/prose'
import { seo } from '../lib/seo'

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
