let held = false

/**
 * Whether a new browser Convex client should hold its queries until Clerk sends the first token. Clerk's client
 * cookie (`__client_uat`, plus a suffixed copy) holds a non-zero sign-in time while a session exists.
 */
export function holdQueriesForAuth(): boolean {
  if (typeof document === 'undefined') return false
  held = document.cookie.split('; ').some((cookie) => /^__client_uat(_[^=]*)?=[1-9]/.test(cookie))
  return held
}

/** True when the browser client was created holding its queries for a sign-in. */
export const queriesHeldForAuth = () => held
