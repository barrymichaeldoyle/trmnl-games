import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reloadIfBehindDeploy } from '../../apps/web/src/lib/deployWatch'

const storage = () => {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) }
}

describe('reload a crashed page onto the deployed build', () => {
  const reload = vi.fn()
  beforeEach(() => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_BUILD_ID', 'old')
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('window', { location: { reload } })
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ id: 'new' }) })))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    reload.mockReset()
  })

  it('reloads once when a newer build is deployed, then lets the crash be reported', async () => {
    expect(await reloadIfBehindDeploy()).toBe(true)
    expect(await reloadIfBehindDeploy()).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reports instead when this bundle is the deployed one', async () => {
    vi.stubEnv('VITE_BUILD_ID', 'new')
    expect(await reloadIfBehindDeploy()).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('never reloads without session storage to stop a loop', async () => {
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => {} })
    expect(await reloadIfBehindDeploy()).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('reports when build.json cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect(await reloadIfBehindDeploy()).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('load the next page fresh on a stale tab', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })
  const page = (href: string) => {
    const url = new URL(href)
    const location = { href: url.href, pathname: url.pathname, search: url.search, assign: vi.fn(), reload: vi.fn() }
    const history = { state: { key: 'k' }, replaceState: vi.fn((_state: unknown, _title: string, next: string) => { const to = new URL(next); Object.assign(location, { href: to.href, pathname: to.pathname, search: to.search }) }) }
    vi.stubGlobal('window', { location, history })
    return { location, history }
  }
  const fresh = async () => (await import('../../apps/web/src/lib/deployWatch')).loadFresh

  it('loads another path once, even when the navigation fires again', async () => {
    const loadFresh = await fresh()
    const { location } = page('https://trmnlgames.com/app/desk-crawler')
    location.assign.mockImplementation(() => loadFresh('https://trmnlgames.com/help/desk-crawler'))
    loadFresh('https://trmnlgames.com/help/desk-crawler')
    expect(location.assign).toHaveBeenCalledTimes(1)
    expect(location.reload).not.toHaveBeenCalled()
  })

  it('reloads instead of jumping when the address bar already shows the target (TRMNL-GAMES-A)', async () => {
    const loadFresh = await fresh()
    const { location, history } = page('https://trmnlgames.com/help/desk-crawler#office-calendar')
    loadFresh('/help/desk-crawler#office-calendar')
    expect(location.assign).not.toHaveBeenCalled()
    expect(history.replaceState).not.toHaveBeenCalled()
    expect(location.reload).toHaveBeenCalledTimes(1)
  })

  it('writes a new hash on the same page into the address bar, then reloads', async () => {
    const loadFresh = await fresh()
    const { location, history } = page('https://trmnlgames.com/help/desk-crawler')
    loadFresh('/help/desk-crawler#office-calendar')
    expect(history.replaceState).toHaveBeenCalledWith({ key: 'k' }, '', 'https://trmnlgames.com/help/desk-crawler#office-calendar')
    expect(location.assign).not.toHaveBeenCalled()
    expect(location.reload).toHaveBeenCalledTimes(1)
  })
})
