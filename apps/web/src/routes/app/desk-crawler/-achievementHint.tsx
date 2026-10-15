import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { tierLabel } from '@trmnl-games/desk-crawler/content/achievements'
import { keepsakesOpen, keepsakeWeek } from '@trmnl-games/desk-crawler/content/keepsakes'
import { Glyph } from '../../../lib/glyphs'
import { useHydrated } from '../../../lib/localTime'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { useContent } from '../../../lib/useContent'
import { dcAchievementsMessages, shelfTitle } from '../../../i18n/dcAchievements'
import type { Locale } from '@trmnl-games/platform'

type HintFamily = { family: string; name: string; category: string; earned: { unlockedAt: number | null } | null; next: { tier: number } | null; value: number; target: number }
type HeroView = { status: string; biomeId: string; gold: number; choice?: unknown; biomes: Array<{ id: string; name: string; unlocked: boolean }> }
type BagView = { gear: Array<{ equipped: boolean; held: boolean }>; merchant: unknown; ladder: { next: { name: string; price: number; buyable: boolean } | null } }
type KeepsakeView = { connected: boolean; lastClaimWeek: number | null }
type Hint = { family: HintFamily; text: string; hash?: string; to: '/app/desk-crawler' | '/app/desk-crawler/inventory' | '/app/desk-crawler/keepsakes'; link: 'bag' | 'hero' | 'keepsakes' | 'map' }
type T = (typeof dcAchievementsMessages)['en']

const DAY_MS = 86_400_000

/**
 * D127: at most one hint, for an achievement the player can move with a companion action, and only once a day has
 * passed since the last one was earned. Everything else the hero earns alone, so it never gets a hint.
 * Order is the tie-break: a passing merchant or a waiting decision comes first because it will not wait.
 */
function pickHint(families: HintFamily[], hero: HeroView, bag: BagView, keepsakes: KeepsakeView | null | undefined, now: number, t: T, locale: Locale): Hint | null {
  const byId = new Map(families.map((f) => [f.family, f]))
  const free = hero.status === 'exploring' || hero.status === 'resting'
  const otherFloors = hero.biomes.filter((b) => b.unlocked && b.id !== hero.biomeId)
  const candidates: Array<Omit<Hint, 'family'> & { family: HintFamily | undefined }> = []
  if (bag.merchant) candidates.push({ family: byId.get('purchases'), text: t.hintMerchant, to: '/app/desk-crawler/inventory', link: 'bag' })
  if (hero.choice) candidates.push({ family: byId.get('choices'), text: t.hintChoice, to: '/app/desk-crawler', link: 'hero' })
  if (keepsakes?.connected && keepsakesOpen(now) && !(keepsakes.lastClaimWeek != null && keepsakes.lastClaimWeek >= keepsakeWeek(now))) candidates.push({ family: byId.get('keepsakes'), text: t.hintKeepsake, to: '/app/desk-crawler/keepsakes', link: 'keepsakes' })
  if (bag.gear.some((item) => !item.equipped && !item.held)) candidates.push({ family: byId.get('sales'), text: t.hintSell, to: '/app/desk-crawler/inventory', link: 'bag' })
  const nextBag = bag.ladder.next
  if (nextBag?.buyable && hero.gold >= nextBag.price) candidates.push({ family: byId.get('bags'), text: t.hintBag(nextBag.name, formatNumber(locale, nextBag.price)), to: '/app/desk-crawler/inventory', link: 'bag' })
  if (free) {
    // A floor whose monsters are still "?" slots: the first one of them stands for the shelf.
    for (const floor of otherFloors) {
      const unmet = families.find((f) => f.category === `${floor.name} monster` && f.earned === null)
      if (unmet) candidates.push({ family: unmet, text: t.hintFloor(floor.name), to: '/app/desk-crawler', hash: 'map-title', link: 'map' })
    }
    if (otherFloors.length > 0) candidates.push({ family: byId.get('trips'), text: t.hintTrip, to: '/app/desk-crawler', hash: 'map-title', link: 'map' })
  }
  candidates.push({ family: byId.get('stances'), text: t.hintStance, to: '/app/desk-crawler', link: 'hero' })
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
  const t = useT(dcAchievementsMessages)
  const c = useContent()
  const locale = useLocale()
  // The day is counted in the browser, so the hint waits for hydration rather than guessing on the server.
  if (!hydrated || latestAt === null || !hero || !bag) return null
  const now = Date.now()
  if (now - latestAt < DAY_MS) return null
  const hint = pickHint(families, hero as unknown as HeroView, bag as unknown as BagView, keepsakes as KeepsakeView | null | undefined, now, t, locale)
  if (!hint) return null
  const f = hint.family
  return (
    <div className="flex min-w-0 flex-col gap-1 border-t-2 border-dashed border-rule pt-3">
      <p className="flex items-center gap-2 label-px text-muted"><Glyph name="quest" className="shrink-0 text-gold-ink" />{t.hint}</p>
      <p className="pl-6 font-semibold">{hint.text}</p>
      <p className="pl-6 text-xs text-muted tabular-nums">
        {f.earned === null ? t.fillsSlot(shelfTitle(f.category, t, c)) : t.familyTier(c.text(f.name), tierLabel(f.next!.tier), formatNumber(locale, Math.min(f.value, f.target)), formatNumber(locale, f.target))}
      </p>
      <Link to={hint.to} hash={hint.hash} className="inline-flex min-h-11 items-center self-start pl-6 text-sm underline underline-offset-4">{t.links[hint.link]}</Link>
    </div>
  )
}
