import { useAuth } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import type { GameSlug } from '@trmnl-games/platform'
import { useConvexAuth } from 'convex/react'
import { useRef } from 'react'

/** The games this viewer can see, with each one's lifecycle status (slow-cast.md "Architecture"). */
export const gamesQuery = convexQuery(api.platform.list, {})

/**
 * The games listing for rendering. After a page load the Convex socket runs queries signed out until Clerk hands it a
 * token, so an admin's listing would drop hidden games and then bring them back. This holds the first answer (the
 * server render's, signed in) until the socket's sign-in is confirmed, or Clerk has loaded and says signed out.
 */
export function useGames() {
  const { isAuthenticated } = useConvexAuth()
  const { isLoaded, isSignedIn } = useAuth()
  const { data } = useQuery(gamesQuery)
  const first = useRef(data)
  first.current ??= data
  return isAuthenticated || (isLoaded && !isSignedIn) ? data : first.current
}

/**
 * Route loader gate for a game that may not be live. A hidden or preview game answers with the
 * ordinary not-found page for everyone but admins, so its routes cannot be probed for.
 */
export async function requireOpenGame(context: { queryClient: QueryClient }, slug: GameSlug): Promise<void> {
  const listing = await context.queryClient.ensureQueryData(gamesQuery)
  if (!listing.games.some((game) => game.slug === slug && game.canOpen)) throw notFound()
}
