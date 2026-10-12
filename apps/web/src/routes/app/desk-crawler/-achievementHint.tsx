import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { tierLabel } from '@trmnl-games/desk-crawler/content/achievements'
import { keepsakeWeek } from '@trmnl-games/desk-crawler/content/keepsakes'
import { Glyph } from '../../../lib/glyphs'
import { useHydrated } from '../../../lib/localTime'

type HintFamily = { family: string; name: string; category: string; earned: { unlockedAt: number | null } | null; next: { tier: number } | null; value: number; target: number }
type HeroView = { status: string; biomeId: string; gold: number; choice?: unknown; biomes: Array<{ id: string; name: string; unlocked: boolean }> }
type BagView = { gear: Array<{ equipped: boolean; held: boolean }>; merchant: unknown; ladder: { next: { name: string; price: number; buyable: boolean } | null } }
type KeepsakeView = { connected: boolean; lastClaimWeek: number | null }
type Hint = { family: HintFamily; text: string; hash?: string; to: '/app/desk-crawler' | '/app/desk-crawler/inventory' | '/app/desk-crawler/keepsakes'; link: string }

const DAY_MS = 86_400_000
const shelfOf = (category: string) => (category.endsWith(' monster') ? category.slice(0, -' monster'.length) : category)

/**
 * D127: at most one hint, for an achievement the player can move with a companion action, and only once a day has
 * passed since the last one was earned. Everything else the hero earns alone, so it never gets a hint.
 * Order is the tie-break: a passing merchant or a waiting decision comes first because it will not wait.
 */
function pickHint(families: HintFamily[], hero: HeroView, bag: BagView, keepsakes: KeepsakeView | null | undefined, now: number): Hint | null {
  const byId = new Map(families.map((f) => [f.family, f]))
  const free = hero.status === 'exploring' || hero.status === 'resting'
  const otherFloors = hero.biomes.filter((b) => b.unlocked && b.id !== hero.biomeId)
  const candidates: Array<Omit<Hint, 'family'> & { family: HintFamily | undefined }> = []
  if (bag.merchant) candidates.push({ family: byId.get('purchases'), text: 'Buy something from the merchant visiting your hero.', to: '/app/desk-crawler/inventory', link: 'Open Bag' })
  if (hero.choice) candidates.push({ family: byId.get('choices'), text: 'Answer the decision waiting for your hero.', to: '/app/desk-crawler', link: 'Open Hero' })
  if (keepsakes?.connected && !(keepsakes.lastClaimWeek != null && keepsakes.lastClaimWeek >= keepsakeWeek(now))) candidates.push({ family: byId.get('keepsakes'), text: "Enter this week's keepsake code from your TRMNL.", to: '/app/desk-crawler/keepsakes', link: 'Open Desk keepsakes' })
  if (bag.gear.some((item) => !item.equipped && !item.held)) candidates.push({ family: byId.get('sales'), text: 'Sell a piece of spare gear from your bag.', to: '/app/desk-crawler/inventory', link: 'Open Bag' })
  const nextBag = bag.ladder.next
  if (nextBag?.buyable && hero.gold >= nextBag.price) candidates.push({ family: byId.get('bags'), text: `Buy the ${nextBag.name} for ${nextBag.price.toLocaleString()} gold.`, to: '/app/desk-crawler/inventory', link: 'Open Bag' })
  if (free) {
    // A floor whose monsters are still "?" slots: the first one of them stands for the shelf.
    for (const floor of otherFloors) {
      const unmet = families.find((f) => f.category === `${floor.name} monster` && f.earned === null)
      if (unmet) candidates.push({ family: unmet, text: `Travel to the ${floor.name} to meet monsters your hero has not beaten yet.`, to: '/app/desk-crawler', hash: 'map-title', link: 'Open the world map' })
    }
    if (otherFloors.length > 0) candidates.push({ family: byId.get('trips'), text: 'Send your hero to another floor from the world map.', to: '/app/desk-crawler', hash: 'map-title', link: 'Open the world map' })
  }
  candidates.push({ family: byId.get('stances'), text: "Try a different stance for your hero.", to: '/app/desk-crawler', link: 'Open Hero' })
  // A "?" slot comes before a higher tier; among higher tiers, the one nearest its target.
  const score = (f: HintFamily) => (f.earned === null ? 2 : f.target > 0 ? Math.min(f.value, f.target) / f.target : 0)
  let best: Hint | null = null
  for (const c of candidates) {
    if (!c.family?.next) continue
    if (best === null || score(c.family) > score(best.family)) best = { ...c, family: c.family }
  }
  return best
}

export function AchievementHint({ families, latestAt }: { families: HintFamily[]; latestAt: number | null }) {
  const hydrated = useHydrated()
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const { data: bag } = useQuery(convexQuery(api.inventory.mine, {}))
  const { data: keepsakes } = useQuery(convexQuery(api.keepsakes.mine, {}))
  // The day is counted in the browser, so the hint waits for hydration rather than guessing on the server.
  if (!hydrated || latestAt === null || !hero || !bag) return null
  const now = Date.now()
  if (now - latestAt < DAY_MS) return null
  const hint = pickHint(families, hero as unknown as HeroView, bag as unknown as BagView, keepsakes as KeepsakeView | null | undefined, now)
  if (!hint) return null
  const f = hint.family
  return (
    <div className="flex min-w-0 flex-col gap-1 border-t-2 border-dashed border-rule pt-3">
      <p className="flex items-center gap-2 label-px text-muted"><Glyph name="quest" className="shrink-0 text-gold-ink" />Hint</p>
      <p className="pl-6 font-semibold">{hint.text}</p>
      <p className="pl-6 text-xs text-muted tabular-nums">
        {f.earned === null ? `Fills a "?" slot on the ${shelfOf(f.category)} shelf.` : `${f.name} tier ${tierLabel(f.next!.tier)}: ${Math.min(f.value, f.target).toLocaleString()} of ${f.target.toLocaleString()}`}
      </p>
      <Link to={hint.to} hash={hint.hash} className="inline-flex min-h-11 items-center self-start pl-6 text-sm underline underline-offset-4">{hint.link}</Link>
    </div>
  )
}
