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
