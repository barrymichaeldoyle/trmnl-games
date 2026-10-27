import type { Locale } from '@trmnl-games/platform'

/** The dictionary loader, itself loaded on demand: route loaders and the client entry stay out of the game's code (D212). */
export const loadContent = (locale: Locale): Promise<void> => (locale === 'en' ? Promise.resolve() : import('@trmnl-games/desk-crawler/i18n/lazy').then((m) => m.loadContent(locale)))

/**
 * D169: the pages whose first render shows game content (names, catalog lines, stored stories) in the reader's
 * language: the Desk Crawler companion and the public hero pages. Their route loaders await the locale's dictionary,
 * and the client entry awaits it before hydration, so the server render and the first client render agree. English
 * needs no dictionary. Every other page translates game content only in a later message (a server error through
 * `useIntent`), which loads the dictionary in the background instead.
 */
const CONTENT_PATHS = ['/app/desk-crawler', '/desk-crawler/heroes/', '/profile/']

export const contentNeededAt = (pathname: string): boolean => CONTENT_PATHS.some((prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix))

/** Loaders: the locale's dictionary alongside the page's queries; a failed fetch leaves English rather than a broken page. */
export const preloadContent = (locale: Locale): Promise<void> => loadContent(locale).catch(() => {})
