import { Link, createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'

/**
 * Little Plot's public game page (little-plot.md "Companion"). Hidden with the game until it is live (D206): the
 * loader answers not-found for everyone but admins, so nothing on the site mentions the game while Idle Angler has
 * its launch. G4 fills the page in.
 */
export const Route = createFileRoute('/games/little-plot')({
  loader: ({ context }) => requireOpenGame(context, 'little-plot'),
  head: () => seo({ title: games['little-plot'].name, path: '/games/little-plot', description: 'Little Plot is a cosy garden that grows on your TRMNL: seeds sown in the companion, plants that ripen on the desk, crosses to discover, and gnomes in the night.', index: false }),
  component: () => (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{games['little-plot'].name}</h1>
          <p className="text-lg text-muted">
            {games['little-plot'].description} Four beds to begin with, a tin can and a packet of seeds. Plants grow on the desk whether or not you are watching; you pick them in the companion for coins and seeds, and two kinds side by side can cross into something nobody sells.
          </p>
        </header>
        <ul className="flex flex-col gap-2 [&_li]:ml-5 [&_li]:list-disc">
          <li>Thirty-six kinds of plant, and every rare one found by crossing, never bought.</li>
          <li>The same weather and seasons as the anglers at the Millpond, a whole year in four weeks.</li>
          <li>Slugs, a fox and gnomes in the night, kept off by a fence, a lantern and a garden cat.</li>
          <li>Now and then the gnome is another player’s, and the seed it took turns up in their tin with your name on it.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/app/little-plot" className="inline-flex min-h-11 items-center underline underline-offset-4">Open companion</Link>
        </div>
      </main>
    </SiteShell>
  ),
})
