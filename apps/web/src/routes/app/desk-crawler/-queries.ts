import { convexQuery } from '@convex-dev/react-query'
import { api } from '@trmnl-games/backend/api'

/**
 * The newest log entry, as one bounded page. Preloaded by the hero route so the dialogue strip is complete in the server
 * render. It lives apart from the game screen because route loaders ship in the site's main bundle: importing it from
 * -gameScreen put the screen, the scene painter and its timers on every page.
 */
export const latestLogQuery = () => convexQuery(api.heroes.recentLog, { paginationOpts: { numItems: 1, cursor: null } })
