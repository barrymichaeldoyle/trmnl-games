/**
 * A path on the backend's art route as a full URL. Its own module, apart from `intent` (which carries every server
 * message), because route heads build social card URLs with it and a head's imports load on every page.
 */
export const artUrl = (path: string) => `${import.meta.env.VITE_CONVEX_SITE_URL ?? ''}${path}`
