// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedWorld, type T } from './helpers'
import { nextIdleAnglerTick, runIdleAnglerTick } from './idleAnglerHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const DC_UUID = 'dddddddd-1111-4aed-8464-bad68368e97c'
const IA_UUID = 'cccccccc-2222-4aed-8464-bad68368e97c'

const screen = (t: T, token: string, uuid: string, path: string) =>
  t.fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ user_uuid: uuid }).toString() })

describe('Old plugin URLs after the rename to Idle Angler (D158)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 5, 3))
    t = convexTest(schema, modules)
    await seedWorld(t)
    await runIdleAnglerTick(t)
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'idle-angler', status: 'live' })
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'desk-crawler', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('dc-token-ana'), publicAlias: 'Ana', heroName: 'Baz', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'desk-crawler', tokenHash: sha256Hex('dc-token-ana'), uuid: DC_UUID, confirmedBy: 'success_callback' })
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'idle-angler', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('ia-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'idle-angler', tokenHash: sha256Hex('ia-token-ana'), uuid: IA_UUID, confirmedBy: 'success_callback' })
    for (let i = 0; i < 4; i += 1) await nextIdleAnglerTick(t)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('serves the screen at the old plugin path until the plugin settings change', async () => {
    const response = await screen(t, 'ia-token-ana', IA_UUID, '/trmnl/slow-cast/v1/screen')
    expect(response.status).toBe(200)
    expect(await response.json()).toHaveProperty('merge_variables')
  })
})
