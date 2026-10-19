import { Link, createFileRoute } from '@tanstack/react-router'
import { contentV5 as content } from '@trmnl-games/idle-angler/content'
import { games } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { BUTTON_SECONDARY, LINK_BUTTON } from '../../lib/ui'

/** Idle Angler's public game page (idle-angler.md "Companion"). Hidden with the game until it is live (D115). */
export const Route = createFileRoute('/games/idle-angler')({
  loader: ({ context }) => requireOpenGame(context, 'idle-angler'),
  head: () => seo({ title: 'Idle Angler', path: '/games/idle-angler', description: 'Idle Angler is a free fishing game that plays itself on your TRMNL: your angler casts every fifteen minutes, and the screen shows the catch, the weather and the week\'s heaviest fish.', image: { path: '/games/idle-angler/sample.png', alt: 'A sample Idle Angler screen: an angler at River Bend at dusk, the week\'s top five and the latest catches' } }),
  component: () => (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="flex items-center gap-4 font-display text-4xl font-bold leading-tight sm:text-5xl"><img src="/games/idle-angler/icon-192.png" alt="" width={64} height={64} className="size-14 [image-rendering:pixelated] sm:size-16" />{games['idle-angler'].name}</h1>
          <p className="text-lg text-muted">
            {games['idle-angler'].description} Every fifteen minutes your angler casts. What bites depends on the water, the bait, the hour and the weather, and the screen on your desk shows the catch. Every day or two, open the companion to sell your catch, restock bait and save for the rod, passes and boat tickets that open new water.
          </p>
        </header>
        <figure className="flex flex-col gap-2">
          <img src="/games/idle-angler/sample.png" alt="A sample Idle Angler screen: an angler at River Bend at dusk with a barbel just landed, the week's top five and the latest catches" width={780} height={460} className="w-full border-2 border-edge bg-white [image-rendering:pixelated]" />
          <figcaption className="text-sm text-muted">Sample angler on a TRMNL OG. Your own angler starts when you install the plugin and save it in TRMNL.</figcaption>
        </figure>
        <ul className="flex flex-col gap-2 [&_li]:ml-5 [&_li]:list-disc">
          <li>Six waters and {content.species.length} species to log, from minnows to a Wels catfish and a halibut off the charter boat.</li>
          <li>New species open the next water and earn your title, from Newcomer to Master Angler.</li>
          <li>One season a week, the same for every angler, with fish that feed only in their season and a run of one species each week.</li>
          <li>Every weekend each water holds an Open for one fish, with medals for the heaviest three.</li>
          <li>The fishmonger pays extra for the fish on his orders, and the best of your catch can go on your trophy wall.</li>
          <li>A fly code on your TRMNL each week adds a fly to your box, and your angler wears the newest one.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/help/idle-angler" className={`${LINK_BUTTON} ${BUTTON_SECONDARY}`}>How it plays</Link>
          <Link to="/app/idle-angler" className="inline-flex min-h-11 items-center underline underline-offset-4">Open companion</Link>
        </div>
      </main>
    </SiteShell>
  ),
})
