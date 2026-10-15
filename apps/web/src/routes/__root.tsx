import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { getCookie, getRequestHeader } from '@tanstack/react-start/server'
import { DEFAULT_LOCALE, LANGUAGES_LIVE, isLocale, localeFromAcceptLanguage, type Locale } from '@trmnl-games/platform'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Link, Outlet, Scripts, createRootRouteWithContext, useRouteContext } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { SiteShell } from '../lib/prose'
import { OG_VERSION, SITE_NAME, SITE_ORIGIN, seo } from '../lib/seo'
import appCss from '../styles.css?url'
import { NetworkProvider } from '../lib/network'
import { AnalyticsProvider } from '../lib/analyticsProvider'
import { useDeployWatch } from '../lib/deployWatch'
import { queriesHeldForAuth } from '../lib/authHold'
import { LazyClerkUI, clerkFrontendHost } from '../lib/clerkUi'
import { LOCALE_COOKIE, LocaleProvider, documentLocale, messagesFor, useT } from '../lib/i18n'
import { rootMessages } from '../i18n/root'
import { LanguageSync } from '../lib/languageSync'

/**
 * Server-only: read the Clerk session and mint a Convex token from the "convex" JWT template, and pick the page's
 * language (D169): the visitor's saved choice, else what their browser asks for.
 */
const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId, getToken } = await auth()
  const token = userId ? await getToken({ template: 'convex' }) : null
  const saved = getCookie(LOCALE_COOKIE)
  const locale: Locale = isLocale(saved) ? saved : LANGUAGES_LIVE ? localeFromAcceptLanguage(getRequestHeader('accept-language')) : DEFAULT_LOCALE
  return { userId, token, locale }
})

/**
 * Clerk's frontend origin, so the browser can open its connections while the page parses: Clerk's scripts load without
 * credentials and its API calls with them, which need separate connections.
 */
const CLERK_HOST = clerkFrontendHost(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)
const CLERK_ORIGIN = CLERK_HOST ? `https://${CLERK_HOST}` : null

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  beforeLoad: async (ctx) => {
    // The session only matters for SSR, where it authenticates this request's Convex HTTP client.
    // In the browser the Convex socket is already signed in through Clerk, so client-side
    // navigations skip the server round trip that would otherwise delay every tab change.
    // The page's language travels in `<html lang>`, which the server set, so the browser reads it back rather than asking.
    if (!import.meta.env.SSR) return { userId: null, token: null, locale: documentLocale() }
    const { userId, token, locale } = await fetchClerkAuth()
    if (token) ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    return { userId, token, locale }
  },
  // Only the root matching means no page exists at this address: the 404 gets its own title and stays out of search.
  head: ({ matches, match }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ...seo(matches.length > 1 ? { locale: match.context.locale } : { title: messagesFor(rootMessages, match.context.locale).notFoundTitle, index: false, locale: match.context.locale }).meta,
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:image', content: `${SITE_ORIGIN}/og.png?v=${OG_VERSION}` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: messagesFor(rootMessages, match.context.locale).ogImageAlt },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      // Both pixel faces are small latin subsets; preloading them keeps HUD text from reflowing when they swap in.
      { rel: 'preload', href: '/fonts/press-start-2p-latin.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: '/fonts/pixelify-sans-latin.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: '/fonts/tg-pixel-digits.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      ...(CLERK_ORIGIN ? [{ rel: 'preconnect', href: CLERK_ORIGIN }, { rel: 'preconnect', href: CLERK_ORIGIN, crossOrigin: 'anonymous' as const }] : []),
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '16x16 32x32' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  const t = useT(rootMessages)
  return (
    <SiteShell>
      <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16">
        <h1 className="font-display text-3xl font-bold">{t.notFoundTitle}</h1>
        <p>{t.notFoundBody}</p>
        <p>
          <Link to="/" className="underline underline-offset-4">
            {t.backHome}
          </Link>
        </p>
      </main>
    </SiteShell>
  )
}

type ClerkLocalization = ComponentProps<typeof ClerkProvider>['localization']

/** Clerk's own French or German screens, downloaded only for a reader in that language; English is Clerk's default. */
function useClerkLocalization(locale: Locale): ClerkLocalization {
  const [loaded, setLoaded] = useState<{ locale: Locale; localization: ClerkLocalization } | null>(null)
  useEffect(() => {
    if (locale === 'en') return
    let live = true
    const load = locale === 'fr' ? import('@clerk/localizations/fr-FR').then((m) => m.frFR) : import('@clerk/localizations/de-DE').then((m) => m.deDE)
    void load.then((localization) => { if (live) setLoaded({ locale, localization }) }).catch(() => {})
    return () => { live = false }
  }, [locale])
  return loaded?.locale === locale ? loaded.localization : undefined
}

function RootComponent() {
  const context = useRouteContext({ from: Route.id })
  useDeployWatch()
  const localization = useClerkLocalization(context.locale)
  return (
    // Clerk's UI downloads when a page first needs it, not on every page (lib/clerkUi).
    <ClerkProvider ui={{ ClerkUI: LazyClerkUI }} localization={localization}>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <ReleaseSignedOutQueries client={context.convexClient} />
        <LanguageSync />
        <NetworkProvider><Outlet /><AnalyticsProvider /></NetworkProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

/**
 * The router holds Convex queries for a browser whose Clerk cookie says signed in. If Clerk loads signed out (an
 * expired session), no token ever comes: an empty token fetch releases the held queries to run signed out.
 */
function ReleaseSignedOutQueries({ client }: { client: ConvexReactClient }) {
  const { isLoaded, isSignedIn } = useAuth()
  useEffect(() => {
    if (isLoaded && !isSignedIn && queriesHeldForAuth()) client.setAuth(async () => null, () => {})
  }, [client, isLoaded, isSignedIn])
  return null
}

function RootDocument({ children }: { children: ReactNode }) {
  const { locale } = useRouteContext({ from: Route.id })
  return (
    <LocaleProvider locale={locale}>
    <html lang={locale}>
      <head>
        <HeadContent />
        {/* Outside route head: HeadContent keeps only one meta per name. */}
        <meta name="theme-color" content="#15122b" />
        
      </head>
      <body className="antialiased">
        <a href="#main" className="sr-only border-2 border-night bg-gold px-4 py-3 font-semibold text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
          {messagesFor(rootMessages, locale).skipToContent}
        </a>
        {children}
        <Scripts />
      </body>
    </html>
    </LocaleProvider>
  )
}
