import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { expect, it } from 'vitest'
import { clerkFrontendHost, clerkUiScriptUrl } from '../../apps/web/src/lib/clerkUi'

/** @clerk/shared as the installed Clerk SDK resolves it: the web app depends on it only through @clerk/tanstack-react-start. */
async function clerksOwnLoader(): Promise<{ clerkUIScriptUrl: (opts: { publishableKey: string }) => string }> {
  const start = createRequire(import.meta.url).resolve('@clerk/tanstack-react-start/package.json', { paths: ['apps/web'] })
  const react = createRequire(start).resolve('@clerk/react/package.json')
  const loader = createRequire(react).resolve('@clerk/shared/loadClerkJsScript')
  return import(pathToFileURL(loader.replace(/\.js$/, '.mjs')).href)
}

const KEYS = [`pk_live_${btoa('clerk.trmnlgames.com$')}`, `pk_test_${btoa('optimum-stork-2236.clerk.accounts.dev$')}`]

it('loads Clerk UI from the same URL Clerk itself would, so the on-demand UI matches the SDK (D137)', async () => {
  const { clerkUIScriptUrl } = await clerksOwnLoader()
  for (const publishableKey of KEYS) expect(clerkUiScriptUrl(publishableKey)).toBe(clerkUIScriptUrl({ publishableKey }))
})

it('reads the frontend host from a publishable key and refuses anything that is not one', () => {
  expect(clerkFrontendHost(KEYS[0])).toBe('clerk.trmnlgames.com')
  expect(clerkFrontendHost(undefined)).toBeNull()
  expect(clerkFrontendHost('pk_live_%%%')).toBeNull()
  expect(clerkFrontendHost(`pk_live_${btoa('evil.com/x"$')}`)).toBeNull()
})
