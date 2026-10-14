import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import type { FunctionReturnType } from 'convex/server'
import { seo } from '../../lib/seo'
import { preload } from '../../lib/preload'
import { BUTTON_PRIMARY, LINK_BUTTON } from '../../lib/ui'
import { games } from '@trmnl-games/platform'
import { gamesQuery, useGames } from '../../lib/gameAccess'
import { HERO_STATUS, anglerLine, lifeLine } from '../../lib/gameSwitcher'

const dockQuery = convexQuery(api.idleAngler.anglers.dock, {})

export const Route = createFileRoute('/app/')({ head: () => seo({ title: 'My games', index: false }), loader: async ({ context }) => {
  await preload(context, convexQuery(api.users.me, {}), gamesQuery)
  // An open Idle Angler tile shows the angler, so fetch it too rather than flash the sample screen first.
  const listing = context.queryClient.getQueryData<FunctionReturnType<typeof api.platform.list>>(gamesQuery.queryKey)
  if (listing?.games.some((game) => game.slug === 'idle-angler' && game.canOpen)) await preload(context, dockQuery)
}, component: Library })

function Library() {
  const { data: me, isPending } = useQuery(convexQuery(api.users.me, {}))
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-bold">My games</h1>
      {isPending ? <p role="status">Loading your games…</p> : (
        <section className="window flex flex-col gap-4 p-5" aria-labelledby="library-dc">
          <div className="flex items-center gap-4">
            <img src="/games/desk-crawler/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 [image-rendering:pixelated]" />
            <div>
              <h2 id="library-dc" className="font-display text-2xl font-bold text-gold-ink">Desk Crawler</h2>
              {me?.hero ? (
                <p className="mt-1 text-muted"><strong className="text-ink">{me.hero.name}</strong> <span className="label-px ml-1">{me.hero.activationState === 'active' ? HERO_STATUS[me.hero.status] ?? 'Adventuring' : 'Waiting for TRMNL Save'}</span></p>
              ) : (
                <p className="mt-1 text-muted">{me?.gameState === 'deleting' ? 'Removing your game progress…' : 'An office RPG that plays itself on your TRMNL.'}</p>
              )}
            </div>
          </div>
          <Link to={me?.hero || me?.gameState === 'deleting' ? '/app/desk-crawler' : '/'} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{me?.hero ? 'Open Desk Crawler' : 'About Desk Crawler'}</Link>
        </section>
      )}
      <UpcomingGames />
      <PaperLivesTile />
    </main>
  )
}

/** Idle Angler in the library (D115): its angler's state once started, a "Coming soon" tile in preview, and a hidden-status mark for admins. */
function UpcomingGames() {
  const data = useGames()
  const game = data?.games.find((g) => g.slug === 'idle-angler')
  const { data: dock, isPending } = useQuery({ ...dockQuery, enabled: game?.canOpen === true })
  if (!game) return null
  const loading = game.canOpen && isPending
  const angler = (dock as { angler?: { activationState: string; status: string; title: string } | null } | undefined)?.angler
  return (
    <section className="window flex flex-col gap-3 p-5" aria-labelledby="library-ia">
      <div className="flex items-center gap-4">
        <img src="/games/idle-angler/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 [image-rendering:pixelated]" />
        <h2 id="library-ia" className="font-display text-2xl font-bold text-gold-ink">{games['idle-angler'].name}</h2>
      </div>
      {!angler && !loading ? <img src="/games/idle-angler/sample.png" alt="A sample Idle Angler screen" width={780} height={460} className="w-full border-2 border-edge bg-white [image-rendering:pixelated]" /> : null}
      {loading ? null : <p className="text-muted">{angler ? anglerLine(angler) : games['idle-angler'].description}</p>}
      {game.status !== 'live' ? <p className="label-px self-start">{game.status === 'hidden' ? 'Hidden: only admins can see this' : 'Coming soon'}</p> : null}
      {game.canOpen && !loading ? <Link to="/app/idle-angler" className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{angler ? 'Open Idle Angler' : 'About Idle Angler'}</Link> : null}
    </section>
  )
}

/** Paper Lives in the library (D159): the current life once started, a "Coming soon" tile in preview, and a hidden-status mark for admins. */
function PaperLivesTile() {
  const data = useGames()
  const game = data?.games.find((g) => g.slug === 'paper-lives')
  const { data: view, isPending } = useQuery({ ...convexQuery(api.paperLives.lives.view, {}), enabled: game?.canOpen === true })
  if (!game) return null
  const loading = game.canOpen && isPending
  const life = (view as { life?: { first: string; last: string; age: number; activationState: string; status: string } | null } | undefined)?.life
  return (
    <section className="window flex flex-col gap-3 p-5" aria-labelledby="library-pl">
      <div className="flex items-center gap-4">
        <img src="/games/paper-lives/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 [image-rendering:pixelated]" />
        <h2 id="library-pl" className="font-display text-2xl font-bold text-gold-ink">{games['paper-lives'].name}</h2>
      </div>
      {loading ? null : <p className="text-muted">{life ? lifeLine(life) : games['paper-lives'].description}</p>}
      {game.status !== 'live' ? <p className="label-px self-start">{game.status === 'hidden' ? 'Hidden: only admins can see this' : 'Coming soon'}</p> : null}
      {game.canOpen && !loading ? <Link to={life ? '/app/paper-lives' : '/games/paper-lives'} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{life ? 'Open Paper Lives' : 'About Paper Lives'}</Link> : null}
    </section>
  )
}

