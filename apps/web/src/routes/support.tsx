import { createFileRoute } from '@tanstack/react-router'
import { ProsePage, SPONSOR_URL, SUPPORT_EMAIL } from '../lib/prose'
import { seo } from '../lib/seo'

export const Route = createFileRoute('/support')({
  head: () => seo({ title: 'Support', path: '/support', description: 'Get help with your Desk Crawler account, TRMNL connection or a public-name report.' }),
  component: () => (
    <ProsePage title="Support">
      <ul>
        <li>
          Account, connection, name or safety reports: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We aim to reply within two business days.
        </li>
        <li>
          Bugs that contain no private information: <a href="https://github.com/barrymichaeldoyle/trmnl-games/issues">GitHub issues</a>.
        </li>
        <li>
          Ideas, praise or anything else: <a href="/feedback">send feedback</a>.
        </li>
        <li>
          Setup and screen questions: see <a href="/help/desk-crawler">TRMNL help</a>.
        </li>
      </ul>
      <h2>Supporting the games</h2>
      <p>
        Desk Crawler is free to play and stays that way. If you want to chip in towards running it, you can <a href={SPONSOR_URL}>sponsor Barry on GitHub</a>.
        Sponsoring is optional and changes nothing in the game: no gold, gear, XP or rank.
      </p>
      <h2>Public names</h2>
      <p>
        Public names may not contain hateful or sexual content, threats or harassment, contact details, or impersonation of other players or staff.
        Reported names may be hidden and replaced with a temporary name; your hero's progress is never affected.
      </p>
    </ProsePage>
  ),
})
