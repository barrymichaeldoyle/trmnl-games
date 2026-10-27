import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import { contentNeededAt, preloadContent } from './lib/content'
import { documentLocale } from './lib/i18n'

/**
 * TanStack Start's default client entry, with one wait in front: a page that shows game content in another language
 * hydrates only once that language's dictionary is here, and the Desk Crawler help page once its guide is (lib/content),
 * so the client's first render matches the server's. English pages, and pages without game content, hydrate at once.
 */
/**
 * What this page waits for: the dictionary for a content page, and for the Desk Crawler help page its guide too (written
 * out at module scope, so it needs the dictionary first). The guide loader is imported here, not from lib/content: a
 * test imports that module, and the guides' import graph would drag the backend's types into the test typecheck.
 */
function prepareHydration(pathname: string, locale: ReturnType<typeof documentLocale>): Promise<void> {
  if (pathname.replace(/\/$/, '') === '/help/desk-crawler') return import('./routes/help/-deskCrawlerHelp').then((m) => m.loadDeskCrawlerHelp(locale)).catch(() => {})
  return contentNeededAt(pathname) ? preloadContent(locale) : Promise.resolve()
}

void prepareHydration(window.location.pathname, documentLocale()).then(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    )
  })
})
