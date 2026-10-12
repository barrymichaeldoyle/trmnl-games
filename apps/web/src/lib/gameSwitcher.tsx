import { useAuth } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { GAME_SLUGS, games, type GameSlug } from '@trmnl-games/platform'
import { useConvexAuth } from 'convex/react'
import { useEffect, useId, useRef, useState } from 'react'
import { captureAnalytics } from './analytics'
import { useGames } from './gameAccess'
import { Glyph } from './glyphs'

/** Short status words for a character, shared by the library tiles and the switcher. */
export const HERO_STATUS: Record<string, string> = { paused: 'Paused', dead: 'Knocked out', sleeping: 'Bag full' }
export const heroLine = (hero: { name: string; activationState: string; status: string }) => `${hero.name} · ${hero.activationState === 'active' ? HERO_STATUS[hero.status] ?? 'Adventuring' : 'Waiting for TRMNL Save'}`
export const anglerLine = (angler: { title: string; activationState: string; status: string }) => `${angler.title} · ${angler.activationState !== 'active' ? 'Waiting for TRMNL Save' : angler.status === 'paused' ? 'Paused' : 'Fishing'}`

/** The game whose companion the path is inside, if any. */
export function currentGame(pathname: string): GameSlug | null {
  return GAME_SLUGS.find((slug) => pathname === games[slug].companionPath || pathname.startsWith(`${games[slug].companionPath}/`)) ?? null
}

/**
 * The header's game switcher (slow-cast.md "Companion", D124). Inside a game's companion the "My games" link becomes
 * that game's icon and name; when another game is listed for this viewer it opens a menu of the games they play
 * (each with its character and status), the listed games they have not started, and the library. A player who can
 * see one game only keeps a plain link, so nobody meets an empty menu. The visible part depends on the pathname and
 * the preloaded listing alone, so the server render and the first client render agree.
 */
export function GameSwitcher({ slug }: { slug: GameSlug }) {
  const listing = useGames()
  const others = listing?.games.filter((game) => game.slug !== slug) ?? []
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const game = games[slug]
  const icon = <img src={`/games/${slug}/favicon.svg`} alt="" width={20} height={20} className="shrink-0 [image-rendering:pixelated]" />

  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus() } }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key) }
  }, [open])

  if (others.length === 0) {
    return <Link to="/app" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">{icon}<span className="whitespace-nowrap">{game.name}</span></Link>
  }
  return (
    <div ref={root}>
      <button ref={button} type="button" aria-expanded={open} aria-controls={menuId} aria-label={`${game.name}: switch game`} onClick={() => setOpen((value) => !value)} className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
        {icon}<span className="whitespace-nowrap">{game.name}</span><Glyph name="down" size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <SwitcherMenu id={menuId} current={slug} listing={listing!} close={() => setOpen(false)} /> : null}
    </div>
  )
}

type Listing = NonNullable<ReturnType<typeof useGames>>

function SwitcherMenu({ id, current, listing, close }: { id: string; current: GameSlug; listing: Listing; close: () => void }) {
  // Which games this account plays comes from each game's own query, fetched only while the menu is open and the
  // socket is signed in; until then a row says "Loading" rather than guessing "Not started".
  const { isAuthenticated } = useConvexAuth()
  const { isSignedIn } = useAuth()
  const ready = isAuthenticated && isSignedIn === true
  const { data: me } = useQuery({ ...convexQuery(api.users.me, {}), enabled: ready })
  const slowCast = listing.games.find((game) => game.slug === 'slow-cast')
  const { data: dock } = useQuery({ ...convexQuery(api.slowCast.anglers.dock, {}), enabled: ready && slowCast?.canOpen === true })
  const angler = (dock as { angler?: { title: string; activationState: string; status: string } | null } | undefined)?.angler
  const rows = listing.games.map((game) => {
    const entry = games[game.slug]
    const played = game.slug === 'desk-crawler' ? (me ? (me.hero ? heroLine(me.hero) : me.gameState === 'deleting' ? 'Removing progress' : null) : undefined) : dock ? (angler ? anglerLine(angler) : null) : game.canOpen ? undefined : null
    return { slug: game.slug, name: entry.name, status: game.status, canOpen: game.canOpen, played, to: played ? entry.companionPath : entry.publicPath }
  })
  const switched = (to: GameSlug) => { captureAnalytics('game switched', { from: current, to }); close() }
  return (
    <ul id={id} aria-label="Your games" className="absolute top-full right-3 z-40 mt-1 flex w-72 max-w-[calc(100vw-1.5rem)] flex-col border-[3px] border-night bg-panel shadow-[4px_4px_0_var(--color-night)] min-[375px]:right-4">
      {rows.map((row) => (
        <li key={row.slug} className="border-b-2 border-rule">
          {row.status === 'preview' && !row.canOpen ? (
            <span className="flex min-h-12 items-center gap-3 px-3 py-2 text-muted">
              <img src={`/games/${row.slug}/favicon.svg`} alt="" width={24} height={24} className="shrink-0 opacity-60 [image-rendering:pixelated]" />
              <span className="flex min-w-0 flex-col"><span className="font-semibold">{row.name}</span><span className="text-sm">Coming soon</span></span>
            </span>
          ) : (
            <Link to={row.to} aria-current={row.slug === current ? 'page' : undefined} onClick={() => switched(row.slug)} className={`flex min-h-12 items-center gap-3 px-3 py-2 no-underline hover:bg-rule ${row.slug === current ? 'text-gold-ink' : ''}`}>
              <img src={`/games/${row.slug}/favicon.svg`} alt="" width={24} height={24} className="shrink-0 [image-rendering:pixelated]" />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{row.name}{row.slug === current ? <span className="sr-only"> (this game)</span> : null}</span>
                <span className="truncate text-sm text-muted">{row.played === undefined ? 'Loading…' : row.played ?? (row.status === 'hidden' ? 'Hidden · not started' : 'Not started · about the game')}</span>
              </span>
            </Link>
          )}
        </li>
      ))}
      <li><Link to="/app" onClick={close} className="flex min-h-12 items-center gap-3 px-3 py-2 font-semibold no-underline hover:bg-rule"><Glyph name="screen" size={16} className="text-gold-ink" />All my games</Link></li>
    </ul>
  )
}

/** The header's right-hand nav link: the switcher inside a game, "My games" everywhere else. */
export function GamesLink() {
  const pathname = useLocation({ select: (location) => location.pathname.replace(/\/$/, '') })
  const slug = currentGame(pathname)
  if (slug) return <GameSwitcher slug={slug} />
  return <Link to="/app" className="inline-flex min-h-11 items-center underline underline-offset-4">My games</Link>
}
