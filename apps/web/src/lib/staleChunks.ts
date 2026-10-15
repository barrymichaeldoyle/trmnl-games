let reloading = false

/** True once a stale-chunk reload is under way: the failed import that triggered it is not a real page error. */
export const reloadingForNewBuild = () => reloading

/**
 * A route chunk or its stylesheet failed to load: almost always a tab still on the build a deploy just replaced
 * (Chrome, Firefox and Safari word it differently). A deploy takes a while to reach every edge, so the one automatic
 * reload can land on the old build again and the next click fails inside the reload guard. The browser keeps the
 * failed import, so only a full reload recovers.
 */
export const isStaleChunkError = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  return /^(Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS)/.test(message)
}

/**
 * A deploy replaces the hashed asset files, so a tab opened before it fails to
 * load the next route's chunk and the click silently does nothing. Vite reports
 * that as `vite:preloadError`; one full reload picks up the new build.
 * Cancelling the event makes Vite resolve the import to undefined, so the router
 * still raises an error before the reload lands: callers check reloadingForNewBuild().
 */
export function recoverFromStaleChunks() {
  const KEY = 'trmnl-games.chunk-reload'
  window.addEventListener('vite:preloadError', (event) => {
    // At most one automatic reload a minute, so a genuinely broken chunk cannot loop.
    let recently = false
    try {
      recently = Date.now() - Number(window.sessionStorage.getItem(KEY) ?? 0) < 60_000
      if (!recently) window.sessionStorage.setItem(KEY, String(Date.now()))
    } catch {
      // Storage unavailable: a single reload is still the best recovery.
    }
    if (recently) return
    event.preventDefault()
    reloading = true
    window.location.reload()
  })
}
