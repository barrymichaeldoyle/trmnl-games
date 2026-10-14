import { createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'

/** Paper Lives' public game page (paper-lives.md "Companion"). Hidden with the game until it is live (D159); the full page comes in L4. */
export const Route = createFileRoute('/games/paper-lives')({
  loader: ({ context }) => requireOpenGame(context, 'paper-lives'),
  head: () => seo({ title: games['paper-lives'].name, path: '/games/paper-lives', description: games['paper-lives'].description, index: false }),
  component: () => (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-4 px-4 py-10">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{games['paper-lives'].name}</h1>
        <p className="text-lg text-muted">{games['paper-lives'].description} This page is being built.</p>
      </main>
    </SiteShell>
  ),
})
