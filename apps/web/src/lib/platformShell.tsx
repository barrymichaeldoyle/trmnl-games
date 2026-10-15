import { Show, SignInButton, useAuth } from '@clerk/tanstack-react-start'
import { PlatformHeader } from './platformHeader'
import { Link, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button, LoadingState } from './ui'
import { OfflineNote } from './network'
import { AppFooter, DESK_CRAWLER_INSTALL_URL, SiteFooter } from './prose'
import { captureAnalytics } from './analytics'
import { DeskCrawlerSignedOut } from './deskCrawlerPitch'
import { PRELOAD_CLERK_UI } from './clerkUi'
import { useT } from './i18n'
import { shellMessages } from '../i18n/shell'

export function AuthShell({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth()
  const t = useT(shellMessages)
  // The screen's QR codes open these routes, often on a stranger's phone: explain the game before asking for a sign-in (D102).
  const deskCrawler = useLocation({ select: (location) => location.pathname.startsWith('/app/desk-crawler') })
  return (
    <div className="flex min-h-screen flex-col">
      <PlatformHeader />
      <OfflineNote />
      {!isLoaded ? <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label={t.checkingSignIn} /></main> : null}
      <Show when="signed-out">
        {deskCrawler ? <DeskCrawlerSignedOut /> : <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
          <section aria-labelledby="signin-title" className="flex flex-col gap-4">
            <h1 id="signin-title" className="font-display text-3xl font-bold">{t.signInTitle}</h1>
            <p>{t.signInBody}</p>
            <div><SignInButton mode="modal"><Button {...PRELOAD_CLERK_UI}>{t.signIn}</Button></SignInButton></div>
          </section>
          <section aria-labelledby="new-here" className="flex flex-col gap-3 border-t border-rule pt-6">
            <h2 id="new-here" className="font-display text-xl font-semibold">{t.newHere}</h2>
            <p className="text-muted">{t.newHereBody}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.aboutDeskCrawler}</Link>
              <a href={DESK_CRAWLER_INSTALL_URL} onClick={() => captureAnalytics('install link opened', { place: 'sign-in page' })} className="inline-flex min-h-11 items-center underline underline-offset-4">{t.installOnTrmnl}</a>
            </div>
          </section>
        </main>}
      </Show>
      <Show when="signed-in">{children}<AppFooter /></Show>
      <Show when="signed-out"><SiteFooter /></Show>
    </div>
  )
}
