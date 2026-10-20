import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import type { FunctionReturnType } from 'convex/server'
import { seo } from '../../lib/seo'
import { preload } from '../../lib/preload'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, LINK_BUTTON } from '../../lib/ui'
import { IDLE_ANGLER_MARKETPLACE_URL } from '../../lib/idleAnglerPitch'
import { NotifyMe } from '../../lib/launchList'
import { homeMessages } from '../../i18n/home'
import { games } from '@trmnl-games/platform'
import { gamesQuery, useGames } from '../../lib/gameAccess'
import { messagesFor, useT } from '../../lib/i18n'
import { libraryMessages } from '../../i18n/library'
import { shellMessages } from '../../i18n/shell'

const dockQuery = convexQuery(api.idleAngler.anglers.dock, {})

export const Route = createFileRoute('/app/')({ head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(libraryMessages, locale).title, index: false, locale }), loader: async ({ context }) => {
  await preload(context, convexQuery(api.users.me, {}), gamesQuery)
  // An open Idle Angler tile shows the angler, so fetch it too rather than flash the sample screen first.
  const listing = context.queryClient.getQueryData<FunctionReturnType<typeof api.platform.list>>(gamesQuery.queryKey)
  if (listing?.games.some((game) => game.slug === 'idle-angler' && game.canOpen)) await preload(context, dockQuery)
}, component: Library })

function Library() {
  const { data: me, isPending } = useQuery(convexQuery(api.users.me, {}))
  const t = useT(libraryMessages)
  const shell = useT(shellMessages)
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-bold">{t.title}</h1>
      {isPending ? <p role="status">{t.loading}</p> : (
        <section className="window flex flex-col gap-4 p-5" aria-labelledby="library-dc">
          <div className="flex items-center gap-4">
            <img src="/games/desk-crawler/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 [image-rendering:pixelated]" />
            <div>
              <h2 id="library-dc" className="font-display text-2xl font-bold text-gold-ink">Desk Crawler</h2>
              {me?.hero ? (
                <p className="mt-1 text-muted"><strong className="text-ink">{me.hero.name}</strong> <span className="label-px ml-1">{me.hero.activationState === 'active' ? (me.hero.waking ? shell.heroStatus.resuming : shell.heroStatus[me.hero.status] ?? shell.adventuring) : shell.waitingForSave}</span></p>
              ) : (
                <p className="mt-1 text-muted">{me?.gameState === 'deleting' ? t.removing : shell.games['desk-crawler']}</p>
              )}
            </div>
          </div>
          <Link to={me?.hero || me?.gameState === 'deleting' ? '/app/desk-crawler' : '/games/desk-crawler'} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{me?.hero ? t.open('Desk Crawler') : t.about('Desk Crawler')}</Link>
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
  const t = useT(libraryMessages)
  const shell = useT(shellMessages)
  const home = useT(homeMessages)
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
      {!angler && !loading ? <img src="/games/idle-angler/sample.png" alt={t.sampleAlt} width={780} height={460} className="w-full border-2 border-edge bg-white [image-rendering:pixelated]" /> : null}
      {loading ? null : <p className="text-muted">{angler ? shell.anglerLine(angler) : shell.games['idle-angler']}</p>}
      {game.status !== 'live' ? <p className="label-px self-start">{game.status === 'hidden' ? t.hiddenAdmins : shell.comingSoon}</p> : null}
      {/* D210: with no angler and no TRMNL listing yet, the tile says it is in review and offers Notify me. */}
      {!angler && !loading && !IDLE_ANGLER_MARKETPLACE_URL && game.status === 'live' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink">{home.inReview}</p>
          <NotifyMe gameSlug="idle-angler" />
        </div>
      ) : null}
      {game.canOpen && !loading ? <Link to={angler ? '/app/idle-angler' : '/games/idle-angler'} className={`self-start ${LINK_BUTTON} ${angler ? BUTTON_PRIMARY : BUTTON_SECONDARY}`}>{angler ? t.open('Idle Angler') : t.about('Idle Angler')}</Link> : null}
    </section>
  )
}

/** Paper Lives in the library (D159): the current life once started, a "Coming soon" tile in preview, and a hidden-status mark for admins. */
function PaperLivesTile() {
  const data = useGames()
  const t = useT(libraryMessages)
  const shell = useT(shellMessages)
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
      {loading ? null : <p className="text-muted">{life ? shell.lifeLine(life) : shell.games['paper-lives']}</p>}
      {game.status !== 'live' ? <p className="label-px self-start">{game.status === 'hidden' ? t.hiddenAdmins : shell.comingSoon}</p> : null}
      {game.canOpen && !loading ? <Link to={life ? '/app/paper-lives' : '/games/paper-lives'} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{life ? t.open('Paper Lives') : t.about('Paper Lives')}</Link> : null}
    </section>
  )
}

