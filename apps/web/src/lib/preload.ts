import type { QueryClient } from '@tanstack/react-query'

type EnsureOptions = Parameters<QueryClient['ensureQueryData']>[0]

/**
 * Fetch a signed-in page's Convex queries in its loader, so SSR renders the
 * game state instead of a loading placeholder while Clerk and the Convex
 * socket start up. In the browser the same call runs over the signed-in
 * socket, so a tab change shows the previous page until the next one has its
 * data instead of flashing a skeleton. The live subscription takes over after.
 */
export async function preload(context: { queryClient: QueryClient; token?: string | null }, ...queries: Array<{ queryKey: readonly unknown[] }>): Promise<void> {
  // Signed out on the server: nothing to fetch, and the shell shows the sign-in prompt.
  if (import.meta.env.SSR && !context.token) return
  // convexQuery() options are typed per result; ensureQueryData's generic defaults reject them by variance only.
  const results = await Promise.allSettled(queries.map((query) => context.queryClient.ensureQueryData(query as EnsureOptions)))
  // A failure here must not be fatal, and it was: the error stayed in the cache, so a root-level hook reading the
  // same query (the header's game listing, analytics) threw on render with nothing above it to catch, and a 40-second
  // Convex "Service temporarily unavailable" on 2026-10-26 became a failed page for whoever opened the companion
  // (TRMNL-GAMES-8, -9). Dropping the failed query leaves it pending: the page renders its loading state, and the
  // browser's live subscription fetches it as soon as Convex answers again.
  results.forEach((result, index) => {
    if (result.status !== 'rejected') return
    context.queryClient.removeQueries({ queryKey: queries[index]!.queryKey, exact: true })
    console.error(`preload: ${JSON.stringify(queries[index]!.queryKey[1] ?? queries[index]!.queryKey)} failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`)
  })
}
