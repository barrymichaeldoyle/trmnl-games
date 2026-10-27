import { describe, expect, it } from 'vitest'
import { preload } from '../../apps/web/src/lib/preload'

type Client = Parameters<typeof preload>[0]['queryClient']

/** A server-side Convex failure during preload must leave the page renderable (TRMNL-GAMES-8, -9). */
describe('preload', () => {
  it('drops a query that failed so render sees it pending, and keeps the ones that answered', async () => {
    const cache = new Map<string, unknown>()
    const removed: unknown[] = []
    const queryClient = {
      ensureQueryData: async (options: { queryKey: readonly unknown[]; queryFn: () => Promise<unknown> }) => { const data = await options.queryFn(); cache.set(JSON.stringify(options.queryKey), data); return data },
      removeQueries: (filters: { queryKey: readonly unknown[] }) => { removed.push(filters.queryKey) },
    } as unknown as Client
    const good = { queryKey: ['convexQuery', 'users:me', {}], queryFn: async () => ({ hero: null }) }
    const bad = { queryKey: ['convexQuery', 'platform:list', {}], queryFn: async () => { throw new Error('{"code":"ServiceUnavailable"}') } }
    const quiet = console.error
    console.error = () => {}
    try {
      await expect(preload({ queryClient, token: 't' }, good, bad)).resolves.toBeUndefined()
    } finally {
      console.error = quiet
    }
    expect(cache.get(JSON.stringify(good.queryKey))).toEqual({ hero: null })
    expect(removed).toEqual([bad.queryKey])
  })
})
