import { Outlet, createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { requireOpenGame, useGames } from '../../lib/gameAccess'
import { seo } from '../../lib/seo'

/**
 * Pixel Wars companion shell (pixel-wars.md "Companion", D214): the lifecycle gate (not-found for anyone who cannot
 * open the game yet). W2 adds the desk's setup states once the backend exists; W4 the tab bar and the pages.
 */
export const Route = createFileRoute('/app/pixel-wars')({
  head: () => seo({ title: games['pixel-wars'].name, index: false }),
  loader: async ({ context }) => {
    await requireOpenGame(context, 'pixel-wars')
  },
  component: Shell,
})

function Shell() {
  const listing = useGames()
  const status = listing?.games.find((game) => game.slug === 'pixel-wars')?.status
  const banner = status && status !== 'live' ? <p className="mx-auto mt-3 w-full max-w-3xl px-4 text-sm font-semibold text-muted">{status === 'hidden' ? 'Hidden: only admins can see Pixel Wars' : 'Preview: only admins can open Pixel Wars'}</p> : null
  return (
    <>
      {banner}
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}
