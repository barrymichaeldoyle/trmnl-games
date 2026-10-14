import { Link, createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { BUTTON_SECONDARY, LINK_BUTTON } from '../../lib/ui'

/** Paper Lives' public game page (paper-lives.md "Companion"). Hidden with the game until it is live (D159). */
export const Route = createFileRoute('/games/paper-lives')({
  loader: ({ context }) => requireOpenGame(context, 'paper-lives'),
  head: () => seo({ title: games['paper-lives'].name, path: '/games/paper-lives', description: 'Paper Lives is a life story that writes itself on your TRMNL: a year of a life every few hours, one decision a year, and an album of every life lived.', index: false }),
  component: () => (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{games['paper-lives'].name}</h1>
          <p className="text-lg text-muted">
            {games['paper-lives'].description} A year of a life passes every few hours. Things happen on their own, a decision comes most years, and the screen on your desk reads like a diary. Every life ends, and the next one carries on as a child of the last or starts again as a stranger.
          </p>
        </header>
        <ul className="flex flex-col gap-2 [&_li]:ml-5 [&_li]:list-disc">
          <li>Sixteen traits, thirty jobs, six kinds of pet and four hundred things that can happen.</li>
          <li>One decision most years, taken in the companion. Left alone, a life takes the gentle option.</li>
          <li>Partners, children, grandchildren, a house and a will to pass it on.</li>
          <li>An album of every life lived, a family tree, and weekly boards for the longest and wealthiest lives.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/help/paper-lives" className={`${LINK_BUTTON} ${BUTTON_SECONDARY}`}>How it plays</Link>
          <Link to="/app/paper-lives" className="inline-flex min-h-11 items-center underline underline-offset-4">Open companion</Link>
        </div>
      </main>
    </SiteShell>
  ),
})
