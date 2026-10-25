import { Link, createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'

/**
 * Pixel Wars' public game page (pixel-wars.md "Companion"). Hidden with the game until it is live (D214): the loader
 * answers not-found for everyone but admins, so nothing on the site mentions the game while it is built. W4 fills the
 * page in.
 */
export const Route = createFileRoute('/games/pixel-wars')({
  loader: ({ context }) => requireOpenGame(context, 'pixel-wars'),
  head: () => seo({ title: games['pixel-wars'].name, path: '/games/pixel-wars', description: 'Pixel Wars is a community territory war on your TRMNL: every player’s desk is one cell on a shared map, four factions, ink that fades, and a week that ends as a print.', index: false }),
  component: () => (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{games['pixel-wars'].name}</h1>
          <p className="text-lg text-muted">
            {games['pixel-wars'].description} Your desk is one cell on a map every player’s TRMNL shows. Ink arrives by the hour; you spend it on orders that resolve every quarter-hour, the largest faction fades fastest, and on Monday the map becomes a print.
          </p>
        </header>
        <ul className="flex flex-col gap-2 [&_li]:ml-5 [&_li]:list-disc">
          <li>Four factions drawn as patterns the e-ink can show: Ink, Hatch, Dots and Weave.</li>
          <li>Ink that fades, fastest for the leader, so nobody holds what they do not keep painting.</li>
          <li>When your desk falls, the enemy’s pattern fills your own screen. Taking it back costs almost nothing.</li>
          <li>A week a season, the final map a print for every player who held a desk.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/app/pixel-wars" className="inline-flex min-h-11 items-center underline underline-offset-4">Open companion</Link>
        </div>
      </main>
    </SiteShell>
  ),
})
