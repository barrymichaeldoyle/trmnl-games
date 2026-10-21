import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

const CHECK_EVERY_MS = 30 * 60 * 1000
const RELOADED_KEY = 'tg_reloaded_for_build'

/** Reload once per deployed build: if a reload still served old code (a stale cache), don't keep reloading. */
const reloadOnce = (deployed: string) => {
  try {
    if (sessionStorage.getItem(RELOADED_KEY) === deployed) return
    sessionStorage.setItem(RELOADED_KEY, deployed)
  } catch {
    // No storage: reload anyway; the check runs only when the tab comes back into view.
  }
  window.location.reload()
}

/** The deployed build id when it differs from this bundle's; null when they match, in dev, or when `/build.json` can't be read. */
async function newerDeployedBuild(): Promise<string | null> {
  const current = import.meta.env.VITE_BUILD_ID as string | undefined
  if (import.meta.env.DEV || !current || !navigator.onLine) return null
  try {
    const response = await fetch('/build.json', { cache: 'no-store' })
    const deployed = response.ok ? ((await response.json()) as { id?: unknown }).id : undefined
    return typeof deployed === 'string' && deployed !== current ? deployed : null
  } catch {
    // Offline or mid-deploy: try again at the next check.
    return null
  }
}

/**
 * A page that crashed may be an old bundle reading data the new backend no longer sends (a Safari tab loaded two
 * days after D205 dropped `rivalOf`, Sentry TRMNL-GAMES-7). If a newer build is deployed, reload onto it once and
 * return true. Without session storage there is no loop guard, so it never reloads.
 */
export async function reloadIfBehindDeploy(): Promise<boolean> {
  const deployed = await newerDeployedBuild()
  if (!deployed) return false
  try {
    if (sessionStorage.getItem(RELOADED_KEY) === deployed) return false
    sessionStorage.setItem(RELOADED_KEY, deployed)
  } catch {
    return false
  }
  window.location.reload()
  return true
}

let holds = 0

/**
 * Hold the return-to-tab reload while `holding` (a half-filled form). Focus alone is not enough: naming a hero, then
 * tapping the gender picker and switching apps, left focus on a button, so the reload threw the name away.
 */
export function useHoldReload(holding: boolean) {
  useEffect(() => {
    if (!holding) return
    holds += 1
    return () => { holds -= 1 }
  }, [holding])
}

/** True while the person is typing or a form holds unsaved input, so a reload never throws away what they entered. */
const typing = () => {
  if (holds > 0) return true
  const active = document.activeElement
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement || (active instanceof HTMLElement && active.isContentEditable)
}

/**
 * A tab left open across a deploy keeps running the old bundle, so new art and layouts never reach it (a hero page
 * open since the morning still multiplied 1-bit scenes after D96 shipped). Compare this bundle's build id with the
 * deployed `/build.json` when the tab comes back into view and every half hour. Once they differ, the next in-app
 * navigation loads the page fresh, and returning to the tab reloads it (once per build) unless a field has focus.
 */
export function useDeployWatch() {
  const router = useRouter()
  useEffect(() => {
    if (import.meta.env.DEV || !import.meta.env.VITE_BUILD_ID) return
    let stale = false
    let deployedId = ''
    let checking = false
    const check = async () => {
      if (stale || checking || !navigator.onLine) return
      checking = true
      const deployed = await newerDeployedBuild()
      checking = false
      if (deployed) {
        stale = true
        deployedId = deployed
      }
    }
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (stale && !typing()) reloadOnce(deployedId)
      else void check().then(() => { if (stale && !typing()) reloadOnce(deployedId) })
    }
    const unsubscribe = router.subscribe('onBeforeNavigate', ({ toLocation, pathChanged }) => {
      if (stale && pathChanged) window.location.assign(toLocation.href)
    })
    const timer = window.setInterval(() => void check(), CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)
    void check()
    return () => {
      unsubscribe()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])
}
