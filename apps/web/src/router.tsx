import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ConvexReactClient } from 'convex/react'
import { routeTree } from './routeTree.gen'
import { RouteError } from './lib/routeError'
import { recoverFromStaleChunks } from './lib/staleChunks'
import { holdQueriesForAuth } from './lib/authHold'

/**
 * Called once per request on the server and once in the browser, so the Convex
 * client and any auth token set on it are request-scoped (architecture.md).
 */
export function getRouter() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL
  if (!convexUrl) throw new Error('VITE_CONVEX_URL is not set')
  // A signed-in browser holds Convex queries until Clerk sends the first token: run signed out, they would answer for a
  // stranger (no hero, no admin listing) and replace the server render until sign-in caught up. __root releases the
  // hold if Clerk turns out to be signed out after all.
  const convex = new ConvexReactClient(convexUrl, { unsavedChangesWarning: false, expectAuth: holdQueriesForAuth() })
  const convexQueryClient = new ConvexQueryClient(convex)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        throwOnError: true,
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    context: { queryClient, convexClient: convex, convexQueryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultErrorComponent: RouteError,
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  if (typeof window !== 'undefined') recoverFromStaleChunks()
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
