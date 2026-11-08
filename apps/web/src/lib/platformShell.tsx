import { Show, SignInButton, useAuth } from '@clerk/tanstack-react-start'
import { PlatformHeader } from './platformHeader'
import { Link, useLocation } from '@tanstack/react-router'
import { lazy, Suspense, type ReactNode } from 'react'
import { Button, LoadingState } from './ui'
import { OfflineNote } from './network'
import { AppFooter, SiteFooter } from './prose'
import { DeskCrawlerSignedOut } from './deskCrawlerPitch'
import { PRELOAD_CLERK_UI } from './clerkUi'
import { useT } from './i18n'
import { shellMessages } from '../i18n/shell'
import { currentGame } from './gameSwitcher'

const IdleAnglerSignedOut = lazy(() => import('./idleAnglerSignedOut'))

export function AuthShell({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth()
  const t = useT(shellMessages)
  // The screen's QR codes open these routes, often on a stranger's phone: explain the game before asking for a sign-in (D102).
  const game = useLocation({ select: (location) => currentGame(location.pathname) })
  return (
    <div className="flex min-h-screen flex-col">
      <PlatformHeader />
      <OfflineNote />
      {!isLoaded ? <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label={t.checkingSignIn} /></main> : null}
      <Show when="signed-out">
        {game === 'desk-crawler' ? <DeskCrawlerSignedOut /> : game === 'idle-angler' ? <Suspense fallback={<main id="main" className="p-8"><LoadingState label={t.loading} /></main>}><IdleAnglerSignedOut /></Suspense> : <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
          <section aria-labelledby="signin-title" className="flex flex-col gap-4">
            <h1 id="signin-title" className="font-display text-3xl font-bold">{t.signInTitle}</h1>
            <p>{t.signInBody}</p>
            <div><SignInButton mode="modal"><Button {...PRELOAD_CLERK_UI}>{t.signIn}</Button></SignInButton></div>
          </section>
          <section aria-labelledby="new-here" className="flex flex-col gap-3 border-t border-rule pt-6">
            <h2 id="new-here" className="font-display text-xl font-semibold">{t.newHere}</h2>
            <p className="text-muted">{t.tagline}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.footerGames}</Link>
            </div>
          </section>
        </main>}
      </Show>
      <Show when="signed-in">{children}<AppFooter /></Show>
      <Show when="signed-out"><SiteFooter /></Show>
    </div>
  )
}
