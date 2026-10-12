import { Show, UserButton } from '@clerk/tanstack-react-start'
import { Link, useLocation } from '@tanstack/react-router'
import { GamesLink, currentGame } from './gameSwitcher'

/** The site header on every page: home link, My games (the game switcher inside a companion, D124), Account and the signed-in avatar. */
export function PlatformHeader() {
  // Inside a game the switcher names the place, so phones read the wordmark but do not show it: the row has no room for both.
  const inGame = useLocation({ select: (location) => currentGame(location.pathname.replace(/\/$/, '')) !== null })
  return (
    <header className="border-b border-rule">
      {/* One row at every width: phones get a slimmer bar, and below 360px the wordmark is read but not shown. */}
      {/* Positioned so the game switcher's menu hangs from this row's right edge, under the bar, whatever the button's width. */}
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-2 min-[375px]:px-4 sm:gap-4 sm:py-5">
      <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2 font-display text-lg font-semibold"><img src="/favicon.svg" alt="" width={24} height={24} className="shrink-0 [image-rendering:pixelated]" /><span className={`truncate ${inGame ? 'max-sm:sr-only' : 'max-[359px]:sr-only'}`}>TRMNL Games</span></Link>
      <nav aria-label="Platform" className="flex shrink-0 items-center gap-3 text-sm">
        <GamesLink />
        <Link to="/account" className="inline-flex min-h-11 items-center underline underline-offset-4">Account</Link>
        {/* Clerk's avatar button is client-only; its 28px slot is reserved so the links beside it never shift when it appears. */}
        <span className="inline-flex size-7 shrink-0 items-center justify-center"><Show when="signed-in"><UserButton userProfileProps={{ appearance: { elements: { profileSection__danger: { display: 'none' } } } }} /></Show></span>
      </nav>
      </div>
    </header>
  )
}
