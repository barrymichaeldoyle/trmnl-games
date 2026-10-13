import { Show, SignInButton, useAuth } from '@clerk/tanstack-react-start'
import { PlatformHeader } from './platformHeader'
import { Link, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button, LoadingState } from './ui'
import { OfflineNote } from './network'
import { SiteFooter } from './prose'
import { DeskCrawlerSignedOut } from './deskCrawlerPitch'

export function AuthShell({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth()
  // The screen's QR codes open these routes, often on a stranger's phone: explain the game before asking for a sign-in (D102).
  const deskCrawler = useLocation({ select: (location) => location.pathname.startsWith('/app/desk-crawler') })
  return (
    <div className="flex min-h-screen flex-col">
      <PlatformHeader />
      <OfflineNote />
      {!isLoaded ? <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label="Checking your sign-in…" /></main> : null}
      <Show when="signed-out">
        {deskCrawler ? <DeskCrawlerSignedOut /> : <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
          <section aria-labelledby="signin-title" className="flex flex-col gap-4">
            <h1 id="signin-title" className="font-display text-3xl font-bold">Sign in to TRMNL Games</h1>
            <p>Your heroes, your games and your account settings are here once you sign in.</p>
            <div><SignInButton mode="modal"><Button>Sign in</Button></SignInButton></div>
          </section>
          <section aria-labelledby="new-here" className="flex flex-col gap-3 border-t border-rule pt-6">
            <h2 id="new-here" className="font-display text-xl font-semibold">New here?</h2>
            <p className="text-muted">TRMNL Games makes games for the TRMNL e-ink display. The first, Desk Crawler, is an office RPG that plays itself on your desk.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link to="/games/desk-crawler" className="inline-flex min-h-11 items-center underline underline-offset-4">About Desk Crawler</Link>
              <Link to="/desk-crawler/waiting-list" className="inline-flex min-h-11 items-center underline underline-offset-4">Get one email at launch</Link>
            </div>
          </section>
        </main>}
      </Show>
      <Show when="signed-in">{children}</Show>
      <SiteFooter />
    </div>
  )
}
