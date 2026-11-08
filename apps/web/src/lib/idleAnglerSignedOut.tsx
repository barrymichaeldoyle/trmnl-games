import { SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { iaGamePage } from '../i18n/iaGamePage'
import { iaCommon } from '../i18n/ia'
import { shellMessages } from '../i18n/shell'
import { captureAnalytics } from './analytics'
import { ScreenBezel } from './deskCrawlerPitch'
import { PRELOAD_CLERK_UI } from './clerkUi'
import { useT } from './i18n'
import { Button, BUTTON_PRIMARY, LINK_BUTTON } from './ui'

/** A fishing QR or saved link retains its game before authentication. Loaded only for signed-out anglers. */
export default function IdleAnglerSignedOut() {
  const t = useT(iaGamePage)
  const common = useT(iaCommon)
  const shell = useT(shellMessages)
  const game = games['idle-angler']
  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="flex items-center gap-4 font-display text-3xl font-bold leading-tight sm:text-4xl"><img src="/games/idle-angler/icon-192.png" alt="" width={64} height={64} className="size-12 [image-rendering:pixelated] sm:size-14" />{game.name}</h1>
        <p className="text-lg">{t.tagline}</p>
        <p className="text-muted">{t.intro}</p>
        <div><SignInButton mode="modal"><Button {...PRELOAD_CLERK_UI}>{shell.signIn}</Button></SignInButton></div>
      </header>
      <figure className="flex flex-col gap-3">
        <ScreenBezel slug="idle-angler" alt={t.sampleAlt} priority />
        <figcaption className="text-sm text-muted">{t.caption}</figcaption>
      </figure>
      <section aria-labelledby="start-heading" className="flex flex-col gap-3">
        <h2 id="start-heading" className="font-display text-xl font-semibold">{common.startTitle}</h2>
        <p>{common.startBody}</p>
        {game.marketplaceUrl ? <a href={game.marketplaceUrl} onClick={() => captureAnalytics('install link opened', { place: 'angler sign-in page', game: game.slug })} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{shell.installOnTrmnl}</a> : null}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to={game.publicPath} className="inline-flex min-h-11 items-center underline underline-offset-4">{common.howItWorks}</Link>
          <Link to={game.helpPath} className="inline-flex min-h-11 items-center underline underline-offset-4">{shell.guideFor(game.name)}</Link>
        </div>
      </section>
    </main>
  )
}
