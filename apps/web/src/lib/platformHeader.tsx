import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, useLocation } from '@tanstack/react-router'
import { GamesLink, currentGame } from './gameSwitcher'
import { PRELOAD_CLERK_UI } from './clerkUi'

/** The site's outer frame: header, footer and the home page share it, so the bar never changes width between pages. */
export const SITE_FRAME = 'mx-auto w-full max-w-6xl px-3 min-[375px]:px-4 sm:px-6'
const NAV_LINK = 'inline-flex min-h-11 items-center underline-offset-4 hover:underline'

/**
 * The site header on every page. Signed out it offers Help and Sign in (the home page is the game's page, D137). Signed in
 * it carries My games (the game switcher inside a companion, D124), Account and the avatar. Clerk's server-side state
 * renders the right set in the first HTML, so neither set flashes.
 */
export function PlatformHeader() {
  // Inside a game the switcher names the place, so phones read the wordmark but do not show it: the row has no room for both.
  const inGame = useLocation({ select: (location) => currentGame(location.pathname.replace(/\/$/, '')) !== null })
  return (
    <header className="border-b border-rule">
      {/* One row at every width: phones get a slimmer bar, and below 360px the wordmark is read but not shown. */}
      {/* Positioned so the game switcher's menu hangs from this row's right edge, under the bar, whatever the button's width. */}
      <div className={`relative flex items-center justify-between gap-3 py-2 sm:gap-4 sm:py-4 ${SITE_FRAME}`}>
        <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2 font-display text-lg font-semibold"><img src="/favicon.svg" alt="" width={24} height={24} className="shrink-0 [image-rendering:pixelated]" /><span className={`truncate ${inGame ? 'max-sm:sr-only' : 'max-[359px]:sr-only'}`}>TRMNL Games</span></Link>
        <nav aria-label="Platform" className="flex shrink-0 items-center gap-4 text-sm">
          <Show when="signed-out">
            <Link to="/help/desk-crawler" className={NAV_LINK} activeProps={{ 'aria-current': 'page', className: 'underline' }}>Help</Link>
            <SignInButton mode="modal"><button type="button" {...PRELOAD_CLERK_UI} className="hud text-hud-sm min-h-10 border-[3px] border-edge px-3 hover:bg-ink hover:text-night active:bg-ink active:text-night">Sign in</button></SignInButton>
          </Show>
          <Show when="signed-in">
            <GamesLink />
            <Link to="/account" className="inline-flex min-h-11 items-center underline underline-offset-4">Account</Link>
            {/* Clerk's avatar button is client-only; its 28px slot is reserved so the links beside it never shift when it appears. */}
            <span className="inline-flex size-7 shrink-0 items-center justify-center"><UserButton userProfileProps={{ appearance: { elements: { profileSection__danger: { display: 'none' } } } }} /></span>
          </Show>
        </nav>
      </div>
    </header>
  )
}
