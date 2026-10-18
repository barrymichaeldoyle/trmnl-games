import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, ACHIEVEMENT_FAMILIES, RARITY_PERCENT_MIN_POPULATION, rarityBand, tierLabel, type RarityBand } from '@trmnl-games/desk-crawler/content/achievements'
import { useState, type ReactNode } from 'react'
import { Glyph, SectionTitle, type GlyphName } from '../../../lib/glyphs'
import { Button, Meter } from '../../../lib/ui'
import { Sheet, SheetTitle } from './-bagSlots'
import { LocalTime } from '../../../lib/localTime'
import { AchievementHint } from './-achievementHint'
import { formatDate, formatNumber, useLocale, useT } from '../../../lib/i18n'
import { useContent } from '../../../lib/useContent'
import { dcAchievementsMessages, shelfTitle } from '../../../i18n/dcAchievements'
import { INTL_TAG, type Locale } from '@trmnl-games/platform'

type Earned = { id: string; name: string; blurb: string; tier: number; unlockedAt: number | null }
type Family = { family: string; name: string; category: string; tier: number; tiers: number; earned: Earned | null; next: { id: string; tier: number } | null; value: number; target: number }
type View = { unlocked: Array<{ id: string; unlockedAt: number }>; families: Family[]; rarity: { counts: Record<string, number>; totalPlayers: number; scoreAt: number } | null }

const BAND_TONE: Record<RarityBand, string> = { common: 'text-muted', uncommon: 'text-xp-ink', rare: 'text-rare-ink', legendary: 'text-gold-ink' }
type T = (typeof dcAchievementsMessages)['en']

/** "7% of heroes" from the publication tally; below a small population, "3 of 11 heroes" (achievements.md "Rarity"). */
function rarityOf(id: string, rarity: View['rarity'], t: T): { band: RarityBand; text: string } | null {
  if (!rarity || rarity.totalPlayers <= 0) return null
  const count = rarity.counts[id] ?? 0
  const share = count / rarity.totalPlayers
  const band = rarityBand(share)
  if (rarity.totalPlayers < RARITY_PERCENT_MIN_POPULATION) return { band, text: t.ofHeroes(count, rarity.totalPlayers) }
  const pct = Math.round(share * 100)
  return { band, text: t.percentOfHeroes(pct < 1 ? '<1' : String(pct)) }
}

/** Tile counts stay short (3.8K/10K) so the bar keeps its width; the sheet's meter shows them in full. */
const compact = (locale: Locale) => new Intl.NumberFormat(INTL_TAG[locale], { notation: 'compact', maximumFractionDigits: 1 })

const earnedOn = (locale: Locale) => (date: Date) => formatDate(locale, date, { day: 'numeric', month: 'short' })

function Rarity({ id, rarity }: { id: string; rarity: View['rarity'] }) {
  const t = useT(dcAchievementsMessages)
  const r = rarityOf(id, rarity, t)
  if (!r) return <span className="text-xs text-muted">{t.rarityLater}</span>
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 text-xs">
      <span className={`font-semibold ${BAND_TONE[r.band]}`}>{t.bands[r.band]}</span>
      <span className="text-muted">{r.text}</span>
    </span>
  )
}

/** Each family wears the glyph of what it counts; monster families share the sword, set pieces the trophy. */
const FAMILY_GLYPH: Record<string, GlyphName> = {
  elites: 'star', jackpots: 'coin', rare_finds: 'loot', epics: 'loot', finds: 'loot', adventures: 'travel', trips: 'travel', gold: 'coin',
  levels: 'levelup', knockouts: 'death', rescues: 'revive', retreats: 'flag', potions: 'potion', traps: 'trap', breaks: 'rest',
  bags: 'bag', big_bags: 'bag', sales: 'tag', keepsakes: 'keepsake', purchases: 'coin', merchants: 'merchant', stances: 'shield', choices: 'choice',
  office_raider: 'raid', desk_defender: 'raid', tasks_done: 'todo', networking: 'meeting', lost_and_found: 'lost_property', dug_in: 'star',
}
const familyGlyph = (family: Family): GlyphName => FAMILY_GLYPH[family.family] ?? (family.family.startsWith('slay_') ? 'combat' : 'trophy')


type EarnedFamily = Family & { earned: Earned }

/** Shelves in reading order: what every hero earns first, then each floor's monsters, then the rarer set pieces. A category not listed gets its own shelf after these. */
const SHELVES: ReadonlyArray<{ category: string; glyph: GlyphName; tone: string }> = [
  { category: 'Lifetime', glyph: 'trophy', tone: 'text-gold-ink' },
  { category: 'Office Cubicles monster', glyph: 'combat', tone: 'text-hp-ink' },
  { category: 'Server Room monster', glyph: 'combat', tone: 'text-hp-ink' },
  { category: 'Cafeteria Depths monster', glyph: 'combat', tone: 'text-hp-ink' },
  { category: 'Archive monster', glyph: 'combat', tone: 'text-hp-ink' },
  { category: 'Parking Garage monster', glyph: 'combat', tone: 'text-hp-ink' },
  { category: 'Set piece', glyph: 'star', tone: 'text-gold-ink' },
  { category: 'Decisions', glyph: 'choice', tone: 'text-gold-ink' },
  { category: 'Raids', glyph: 'raid', tone: 'text-rare-ink' },
  { category: 'Coworkers', glyph: 'meeting', tone: 'text-sky-ink' },
  { category: 'Office calendar', glyph: 'star', tone: 'text-gold-ink' },
]

function shelvesOf(families: Family[]) {
  const known = SHELVES.map((shelf) => ({ ...shelf, families: families.filter((f) => f.category === shelf.category) }))
  const extra = [...new Set(families.map((f) => f.category))].filter((c) => !SHELVES.some((shelf) => shelf.category === c))
    .map((category) => ({ category, glyph: 'trophy' as GlyphName, tone: 'text-gold-ink', families: families.filter((f) => f.category === category) }))
  return [...known, ...extra].filter((shelf) => shelf.families.length > 0)
}

/** A rarity band edges the badge the way rarity edges a bag slot; the band's word always sits beneath, so colour is never alone. */
const BAND_EDGE: Record<RarityBand, string> = { common: 'border-night', uncommon: 'border-xp', rare: 'border-rare', legendary: 'border-gold' }

const tierName = (family: EarnedFamily, c: ReturnType<typeof useContent>) => `${c.text(family.earned.name)}${family.tiers > 1 ? ` ${tierLabel(family.earned.tier)}` : ''}`

/** One square per tier: gold for each earned, hollow for each still ahead. */
function TierPips({ tier, tiers }: { tier: number; tiers: number }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {Array.from({ length: tiers }, (_, i) => <span key={i} className={`size-2 ${i < tier ? 'bg-gold' : 'border-2 border-raised'}`} />)}
    </span>
  )
}

/** An earned family as a badge: its glyph on gold with the tier tab, the name, tier pips and how far the next tier is, and its rarity. Tapping opens its sheet. */
function EarnedTile({ family, rarity, onOpen }: { family: EarnedFamily; rarity: View['rarity']; onOpen: () => void }) {
  const t = useT(dcAchievementsMessages)
  const c = useContent()
  const locale = useLocale()
  const name = c.text(family.earned.name)
  const r = rarityOf(family.earned.id, rarity, t)
  const label = [family.tiers > 1 ? t.tierOf(name, family.earned.tier, family.tiers) : name, r ? t.bands[r.band] : null].filter(Boolean).join(', ')
  return (
    <li className="min-w-0">
      <button type="button" onClick={onOpen} aria-label={label} className={`flex size-full min-h-36 flex-col items-center gap-2 border-[3px] ${r ? BAND_EDGE[r.band] : 'border-night'} bg-panel px-2 pt-3 pb-2.5 text-center hover:bg-raised active:bg-raised`}>
        <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center border-2 border-night bg-gold text-night">
          <Glyph name={familyGlyph(family)} />
          {family.tiers > 1 ? <span className="hud absolute -top-2 -right-3 border-2 border-night bg-night px-0.5 text-[0.5rem] leading-3 text-gold-ink">{tierLabel(family.earned.tier)}</span> : null}
        </span>
        <span className="line-clamp-2 text-sm leading-tight font-semibold hyphens-auto [overflow-wrap:anywhere]">{name}</span>
        <span aria-hidden="true" className="mt-auto flex w-full flex-col items-center gap-1.5">
          {family.tiers > 1 ? <TierPips tier={family.earned.tier} tiers={family.tiers} /> : null}
          {family.next ? (
            <span className="flex w-full items-center gap-1.5">
              <span className="h-1.5 min-w-0 flex-1 bg-night outline-2 outline-raised"><span className="block h-full bg-gold" style={{ width: `${Math.min(100, Math.round((Math.min(family.value, family.target) * 100) / Math.max(1, family.target)))}%` }} /></span>
              <span className="text-[0.6875rem] leading-none text-muted tabular-nums">{compact(locale).format(Math.min(family.value, family.target))}/{compact(locale).format(family.target)}</span>
            </span>
          ) : null}
          {r ? <span className={`text-xs font-semibold ${BAND_TONE[r.band]}`}>{t.bands[r.band]}</span> : null}
        </span>
      </button>
    </li>
  )
}

/** An unearned family: a dashed "?" slot with the first tier's rarity, never a name. Legendary first tiers stay a surprise. */
function LockedTile({ family, rarity }: { family: Family; rarity: View['rarity'] }) {
  const t = useT(dcAchievementsMessages)
  const first = ACHIEVEMENTS.find((def) => def.family === family.family && def.tier === 1)
  const r = first ? rarityOf(first.id, rarity, t) : null
  const preview = r && r.band !== 'legendary' ? r : null
  return (
    <li className="flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 border-[3px] border-dashed border-faint px-2 py-3 text-center text-muted">
      <span aria-hidden="true" className="hud grid size-10 place-items-center border-2 border-dashed border-faint text-hud-sm">?</span>
      <span className="text-xs">
        <span className="sr-only">{t.notEarned}{preview ? ', ' : ''}</span>
        {preview ? <span className={`font-semibold ${BAND_TONE[preview.band]}`}>{t.bands[preview.band]}</span> : <span aria-hidden="true">{t.notYet}</span>}
      </span>
    </li>
  )
}

/** One earned achievement's details: what it is, its rarity, when it came and how far the next tier is. */
function EarnedSheet({ family, rarity, onClose, showcase = false }: { family: EarnedFamily | null; rarity: View['rarity']; onClose: () => void; showcase?: boolean }) {
  const t = useT(dcAchievementsMessages)
  const c = useContent()
  const locale = useLocale()
  return (
    <Sheet open={family !== null} onClose={onClose} label={t.achievement}>
      {family ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center border-2 border-night bg-gold text-night"><Glyph name={familyGlyph(family)} size={24} /></span>
            <div className="min-w-0">
              <SheetTitle>{c.text(family.earned.name)}{family.tiers > 1 ? <span className="hud ml-2 align-middle text-hud-sm text-gold-ink">{tierLabel(family.earned.tier)}</span> : null}</SheetTitle>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <span>{c.text(family.name)}{family.tiers > 1 ? t.tierOfShort(family.earned.tier, family.tiers) : ''}</span>
                {family.tiers > 1 ? <TierPips tier={family.earned.tier} tiers={family.tiers} /> : null}
              </p>
            </div>
          </div>
          <p>{c.text(family.earned.blurb)}</p>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Rarity id={family.earned.id} rarity={rarity} />
            {family.earned.unlockedAt ? <span className="text-xs tabular-nums text-muted">{t.earned}<LocalTime at={family.earned.unlockedAt} format={earnedOn(locale)} /></span> : null}
          </div>
          {/* Another hero's progress toward the next tier is theirs; the showcase shows only what is earned. */}
          {showcase ? null : family.next ? <Meter label={t.tier(tierLabel(family.next.tier))} value={Math.min(family.value, family.target)} max={family.target} tone="gold" /> : family.tiers > 1 ? <p className="text-sm text-muted">{t.topTier}</p> : null}
          <Button variant="secondary" className="mt-1" allowOffline onClick={onClose}>{t.close}</Button>
        </div>
      ) : null}
    </Sheet>
  )
}

/** The case at the top: how much of the collection is found, the rarest one held and the latest. Rarest and latest open their sheets. */
function Summary({ view, earned, onOpen }: { view: View; earned: EarnedFamily[]; onOpen: (family: string) => void }) {
  const t = useT(dcAchievementsMessages)
  const c = useContent()
  const locale = useLocale()
  const n = (value: number) => formatNumber(locale, value)
  // Only what the last hourly tally has counted: one earned since then would read as held by nobody.
  const counted = (f: EarnedFamily) => (view.rarity?.counts[f.earned.id] ?? 0) > 0
  const share = (f: EarnedFamily) => (view.rarity && view.rarity.totalPlayers > 0 ? (view.rarity.counts[f.earned.id] ?? 0) / view.rarity.totalPlayers : 1)
  const rarest = view.rarity ? earned.filter(counted).reduce<EarnedFamily | null>((best, f) => (best === null || share(f) < share(best) ? f : best), null) : null
  const latest = earned.reduce<EarnedFamily | null>((best, f) => ((f.earned.unlockedAt ?? 0) > (best?.earned.unlockedAt ?? 0) ? f : best), null)
  // The next tier nearest to coming, by share of its target: something to look forward to, never a task.
  const progress = (f: EarnedFamily) => (f.next && f.target > 0 ? Math.min(f.value, f.target) / f.target : -1)
  const closest = earned.reduce<EarnedFamily | null>((best, f) => (progress(f) >= 0 && progress(f) < 1 && progress(f) > (best ? progress(best) : -1) ? f : best), null)
  const rows: Array<{ label: string; glyph: GlyphName; tone: string; family: EarnedFamily; name?: string; detail: ReactNode }> = []
  if (closest?.next) rows.push({ label: t.closest, glyph: 'up', tone: 'text-xp-ink', family: closest, name: c.text(closest.name), detail: <span className="text-xs text-muted tabular-nums">{t.forTier(n(Math.min(closest.value, closest.target)), n(closest.target), tierLabel(closest.next.tier))}{closest.category.endsWith(' monster') ? ` · ${shelfTitle(closest.category, t, c)}` : ''}</span> })
  if (rarest) rows.push({ label: t.rarest, glyph: 'crown', tone: 'text-rare-ink', family: rarest, detail: <Rarity id={rarest.earned.id} rarity={view.rarity} /> })
  if (latest?.earned.unlockedAt) rows.push({ label: t.latest, glyph: 'clock', tone: 'text-gold-ink', family: latest, detail: <span className="text-xs text-muted tabular-nums"><LocalTime at={latest.earned.unlockedAt} format={earnedOn(locale)} /></span> })
  return (
    <div className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <Meter label={t.found} value={earned.length} max={view.families.length} tone="gold" />
      <p className="-mt-1 text-xs text-muted tabular-nums">{t.tiersEarned(view.unlocked.length, ACHIEVEMENTS.length)}</p>
      {earned.length === 0 ? <p className="text-sm">{t.firstOne}</p> : null}
      {rows.length > 0 ? (
        <dl className="grid gap-x-6 min-[480px]:grid-cols-2 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-0 flex-col gap-1 border-t-2 border-dashed border-rule py-2">
              <dt className="flex items-center gap-2 label-px text-muted"><Glyph name={row.glyph} className={`shrink-0 ${row.tone}`} />{row.label}</dt>
              <dd className="flex min-w-0 flex-col pl-6">
                <button type="button" onClick={() => onOpen(row.family.family)} className="inline-flex min-h-11 items-center self-start text-left font-semibold underline underline-offset-4 [overflow-wrap:anywhere]">{row.name ?? tierName(row.family, c)}</button>
                {row.detail}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <AchievementHint families={view.families} latestAt={view.unlocked.length > 0 ? Math.max(...view.unlocked.map((u) => u.unlockedAt)) : null} />
      {view.rarity ? <p className="text-xs text-muted">{t.rarityNote}</p> : null}
    </div>
  )
}

/** Achievements on their own page (achievements.md): permanent and retroactive, shelved by kind, with a dashed slot for each one still to find. */
export function Achievements() {
  const { data } = useQuery(convexQuery(api.achievements.mine, {}))
  const [openId, setOpenId] = useState<string | null>(null)
  const t = useT(dcAchievementsMessages)
  const c = useContent()
  if (!data) return null
  const view = data as View
  const earned = view.families.filter((f): f is EarnedFamily => f.earned !== null)
  const opened = earned.find((f) => f.family === openId) ?? null
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section aria-labelledby="achievements-title" className="flex min-w-0 flex-col gap-3">
        <SectionTitle id="achievements-title" glyph="achievement" as="h1">{t.title}</SectionTitle>
        <Summary view={view} earned={earned} onOpen={setOpenId} />
      </section>
      {shelvesOf(view.families).map((shelf) => {
        const id = `shelf-${shelf.category.replace(/\W+/g, '-').toLowerCase()}`
        const got = shelf.families.filter((f): f is EarnedFamily => f.earned !== null)
        const rest = shelf.families.filter((f) => f.earned === null)
        return (
          <section key={shelf.category} aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <SectionTitle id={id} glyph={shelf.glyph} tone={shelf.tone} size="text-2xl">{shelfTitle(shelf.category, t, c)}</SectionTitle>
              <span className="text-sm text-muted tabular-nums">{t.shelfCount(got.length, shelf.families.length)}</span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
              {got.map((family) => <EarnedTile key={family.family} family={family} rarity={view.rarity} onOpen={() => setOpenId(family.family)} />)}
              {rest.map((family) => <LockedTile key={family.family} family={family} rarity={view.rarity} />)}
            </ul>
          </section>
        )
      })}
      <EarnedSheet family={opened} rarity={view.rarity} onClose={() => setOpenId(null)} />
    </div>
  )
}

type Shown = { id: string; tier: number; name: string; blurb: string }

const tiersOf = (family: string) => ACHIEVEMENTS.filter((def) => def.family === family).length

/**
 * A public hero page's achievements (D187): the owner's badges and shelves, earned families only, read-only. The three
 * rarest lead in their own case once rarity is published; a badge opens its sheet without the next tier's progress.
 */
export function TrophyCase({ achievements, rarity }: { achievements: Shown[]; rarity: View['rarity'] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const t = useT(dcAchievementsMessages)
  const c = useContent()
  const families = achievements.flatMap((shown): EarnedFamily[] => {
    const family = ACHIEVEMENT_FAMILIES.find((f) => f.id === ACHIEVEMENT_BY_ID.get(shown.id)?.family)
    if (!family) return []
    return [{ family: family.id, name: family.name, category: family.category, tier: shown.tier, tiers: tiersOf(family.id), earned: { ...shown, unlockedAt: null }, next: null, value: 0, target: 0 }]
  })
  const held = (f: EarnedFamily) => rarity?.counts[f.earned.id] ?? Infinity
  // Rarest first among the uncommon and up; a case of commons would be no showcase.
  const rarest = rarity ? [...families].filter((f) => { const r = rarityOf(f.earned.id, rarity, t); return r !== null && r.band !== 'common' }).sort((a, b) => held(a) - held(b)).slice(0, 3) : []
  const opened = families.find((f) => f.family === openId) ?? null
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {rarest.length > 0 ? (
        <section aria-labelledby="rarest-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
          <h3 id="rarest-title" className="flex items-center gap-2 label-px text-muted"><Glyph name="crown" className="shrink-0 text-rare-ink" />{t.rarest}</h3>
          <ul className="grid grid-cols-3 gap-2">
            {rarest.map((family) => <EarnedTile key={family.family} family={family} rarity={rarity} onOpen={() => setOpenId(family.family)} />)}
          </ul>
        </section>
      ) : null}
      {shelvesOf(families).map((shelf) => {
        const id = `shelf-${shelf.category.replace(/\W+/g, '-').toLowerCase()}`
        return (
          <section key={shelf.category} aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <SectionTitle id={id} glyph={shelf.glyph} tone={shelf.tone} size="text-xl" as="h3">{shelfTitle(shelf.category, t, c)}</SectionTitle>
              <span className="text-sm text-muted tabular-nums">{shelf.families.length}</span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
              {(shelf.families as EarnedFamily[]).map((family) => <EarnedTile key={family.family} family={family} rarity={rarity} onOpen={() => setOpenId(family.family)} />)}
            </ul>
          </section>
        )
      })}
      <EarnedSheet family={opened} rarity={rarity} onClose={() => setOpenId(null)} showcase />
    </div>
  )
}
