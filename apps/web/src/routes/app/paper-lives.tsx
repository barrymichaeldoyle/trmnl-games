import { createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'

/** Paper Lives companion (paper-lives.md "Companion"), not-found for anyone who cannot open the game yet (D159). The pages come in L4. */
export const Route = createFileRoute('/app/paper-lives')({
  head: () => seo({ title: games['paper-lives'].name, index: false }),
  loader: ({ context }) => requireOpenGame(context, 'paper-lives'),
  component: () => (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-4 px-4 py-10">
        <h1 className="font-display text-3xl font-bold">{games['paper-lives'].name}</h1>
        <p className="text-muted">The companion pages are being built.</p>
      </main>
    </SiteShell>
  ),
})
