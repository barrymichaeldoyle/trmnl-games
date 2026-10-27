import { convexQuery } from '@convex-dev/react-query'
import { api } from '@trmnl-games/backend/api'

/**
 * The newest log entry. Preloaded by the hero route so the dialogue strip is complete in the server
 * render. It lives apart from the game screen because route loaders ship in the site's main bundle: importing it from
 * -gameScreen put the screen, the scene painter and its timers on every page.
 */
export const latestLogQuery = () => convexQuery(api.heroes.latestLog, {})

/** The log's first page, as the Log tab's loader fetches it: the live pagination takes over from it after hydration. */
export const LOG_PAGE = 40
export const firstLogPage = (heroId: string) => convexQuery(api.heroes.recentLog, { heroId: heroId as never, paginationOpts: { numItems: LOG_PAGE, cursor: null } })
