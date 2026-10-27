import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import { contentNeededAt, preloadContent } from './lib/content'
import { documentLocale } from './lib/i18n'

/**
 * TanStack Start's default client entry, with one wait in front: a page that shows game content in another language
 * hydrates only once that language's dictionary is here (lib/content), so the client's first render matches the
 * server's. English pages, and pages without game content, hydrate at once.
 */
const ready = contentNeededAt(window.location.pathname) ? preloadContent(documentLocale()) : Promise.resolve()
void ready.then(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    )
  })
})
