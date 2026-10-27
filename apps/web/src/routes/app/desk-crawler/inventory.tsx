import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { nextSlotAfter } from '@trmnl-games/desk-crawler/sim/schedule'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { useIntent } from '../../../lib/intent'
import { seo } from '../../../lib/seo'
import { Glyph } from '../../../lib/glyphs'
import { BUTTON_SECONDARY, Button, Card, ErrorNote, LINK_BUTTON, LoadingState, NoticeBar, useNotice } from '../../../lib/ui'
import { preload } from '../../../lib/preload'
import { retainSellableSelection, saleIsCurrent } from '../../../lib/bagSelection'
import { BATCH_ITEMS } from '@trmnl-games/desk-crawler/sim/core/limits'
import { RARITY_TONE } from '../../../lib/palette'
import { EmptySlot, Gem, PotionSlot, Sheet, SheetTitle, Slot, SlotPreview } from './-bagSlots'
import { useNow } from './-pulse'
import { ConfirmButtons, ConfirmSheet, Consequences } from './-confirm'
import { BuySheet, Price, type PurchaseIntent } from './-shop'
import { WithName } from './-withName'
import { formatNumber, formatTime, messagesFor, useLocale, useT } from '../../../lib/i18n'
import { headMessages } from '../../../i18n/heads'
import { useContent } from '../../../lib/useContent'
import { dcBagMessages, materialsList } from '../../../i18n/dcBag'

// `typeof import()` rather than `typeof dcBagMessages`: a value reference here would keep the catalog in the route's
// shared part, which the main bundle carries, so every page would load the Bag's copy.
type T = (typeof import('../../../i18n/dcBag'))['dcBagMessages']['en']

export const Route = createFileRoute('/app/desk-crawler/inventory')({ head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).dcBag, index: false, locale }), loader: ({ context }) => preload(context, convexQuery(api.inventory.mine, {}), convexQuery(api.heroes.mine, {})), component: Inventory })

type Gear = {
  id: Id<'items'>
  kind: 'weapon' | 'armor'
  templateId: string
  label: string
  rarity: string
  requiredLevel: number
  attack: number
  defense: number
  saleValue: number
  affix: { id: string; name: string; blurb: string } | null
  equipped: boolean
  held: boolean
  /** D129: what salvaging yields, the workbench suffix ("Mk II +1"), the next step and whether an affix can be fitted. */
  salvage: MaterialCount
  suffix: string
  reinforced: number
  nextStep: Step | null
  affixable: boolean
  /** D145: another player's found spare: their public name (masked once renamed) and whether it links to their page. */
  spareOf: { ownerName: string; profile: boolean } | null
}
type MaterialCount = Record<string, number>
type Step = { kind: 'tier' | 'reinforce'; label: string; gold: number; materials: MaterialCount; stat: { from: number; to: number }; requiredLevel: number; shortfall: MaterialCount; affordable: boolean }
type Material = { id: string; name: string; glyph: string; count: number }
type Affix = { id: string; name: string; blurb: string }
type WorkbenchRules = { affix: { gold: number; materials: MaterialCount }; affixes: Affix[] }
type Review = { kind: 'sell' | 'salvage'; items: Gear[] }
type Biome = { id: string; name: string; unlocked: boolean }
/** D131: one potion strength in the pouch (every strength is listed, empty ones too), and the combine recipe. */
type PotionRow = { templateId: string; name: string; healPct: number; heals: number; count: number }
type Combine = { from: { templateId: string; name: string; count: number; have: number }; materials: MaterialCount; to: { templateId: string; name: string }; shortfall: { potions: number; materials: MaterialCount }; batches: number }

const SALE_LIMIT = BATCH_ITEMS
/** Empty slots drawn after the gear: one phone row, as a hint of room rather than a page of it. */
const EMPTY_SLOTS_SHOWN = 4
const statOf = (item: Gear) => item.kind === 'weapon' ? item.attack : item.defense
/** The materials several pieces yield together. */
const yieldOf = (items: readonly Gear[]): MaterialCount => items.reduce<Record<string, number>>((total, item) => { for (const [id, n] of Object.entries(item.salvage)) total[id] = (total[id] ?? 0) + n; return total }, {})
/** "6 Scrap and 1 Parts", in the catalog's order; "nothing" for an empty count. */
function materialsText(counts: MaterialCount, materials: readonly Material[], t: T): string {
  const parts = materials.filter((m) => (counts[m.id] ?? 0) > 0).map((m) => t.material(counts[m.id]!, m.name))
  if (parts.length === 0) return t.nothing
  return materialsList(parts, t.and)
}

/**
 * The bag as a bag (D97): the two equipped slots and the potion stack, then every slot of the current bag with each
 * piece drawn in it. Tapping a piece opens its sheet with the comparison and its actions; Sell gear turns the grid into
 * a selection with a pinned total, and the review is a second sheet. Nothing on the page moves while an action runs:
 * feedback arrives in a pinned notice, and only the acting slot shows busy. The bag is the only container (D123).
 */
function Inventory() {
  const { data: bag } = useQuery(convexQuery(api.inventory.mine, {}))
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const locale = useLocale()
  const [mode, setMode] = useState<'browse' | 'sell' | 'salvage'>('browse')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | 'potions' | null>(null)
  const [review, setReview] = useState<Review | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [destination, setDestination] = useState('')
  const [clearing, setClearing] = useState(false)
  const { notice, notify: announce, dismiss } = useNotice()
  // Errors inside an open sheet show there; the pinned notice carries the rest (the sheet would hide it).
  const sheetOpen = useRef(false)
  sheetOpen.current = openId !== null || review !== null || clearing
  const notify = (feedback: { error: string | null; message: string | null }) => {
    if (feedback.error && sheetOpen.current) return
    announce(feedback)
  }
  const equip = useIntent(api.inventory.equip, { onFeedback: notify })
  const unequip = useIntent(api.inventory.unequip, { onFeedback: notify })
  const sellMany = useIntent(api.inventory.sellMany, { onFeedback: notify })
  const salvageMany = useIntent(api.inventory.salvageMany, { onFeedback: notify })
  const upgrade = useIntent(api.inventory.upgrade, { onFeedback: notify })
  const chooseAffix = useIntent(api.inventory.chooseAffix, { onFeedback: notify })
  const combine = useIntent(api.inventory.combinePotions, { onFeedback: notify })
  const claim = useIntent(api.inventory.claimHeld, { onFeedback: notify })
  const resume = useIntent(api.inventory.resumeAdventures, { onFeedback: notify })
  const clearResume = useIntent(api.inventory.clearAndResume, { onFeedback: notify })
  const buyBag = useIntent(api.inventory.buyBag, { onFeedback: notify })
  const buyPouch = useIntent(api.inventory.buyPouch, { onFeedback: notify })
  const buyOffer = useIntent(api.inventory.buyOffer, { onFeedback: notify })
  const t = useT(dcBagMessages)
  const c = useContent()
  const statLabel = (item: Gear) => t.stat[item.kind]
  const mats = (counts: MaterialCount) => materialsText(counts, materials, t)
  useEffect(() => {
    if (bag) setSelected((current) => retainSellableSelection(current, bag.gear as Gear[]))
  }, [bag])
  if (!bag || !hero) return <LoadingState label={t.loading} />

  const gear = bag.gear as Gear[]
  const manageable = hero.simulationState !== 'quarantined' && ['exploring', 'resting', 'travelling', 'sleeping'].includes(hero.status)
  const reason = manageable ? null : hero.simulationState === 'quarantined' ? t.reasonService : hero.status === 'paused' ? t.reasonPaused : t.reasonDown
  const held = gear.find((item) => item.held) ?? null
  const sellable = gear.filter((item) => !item.equipped && !item.held)
  const inBag = sellable
  const chosen = sellable.filter((item) => selected.has(item.id))
  const goldOf = (items: Gear[]) => items.reduce((sum, item) => sum + item.saleValue, 0)
  const rareOf = (items: Gear[]) => items.filter((item) => item.rarity === 'rare' || item.rarity === 'epic').length
  const materials = bag.materials as Material[]
  const workbench = bag.workbench as WorkbenchRules | null
  const validReview = review === null || saleIsCurrent(review.items, gear)
  const reviewing = review === null ? null : review.kind === 'sell' ? sellMany : salvageMany
  const equippedOf = (kind: Gear['kind']) => gear.find((item) => item.equipped && item.kind === kind) ?? null
  const deltaOf = (item: Gear) => { const current = equippedOf(item.kind); return statOf(item) - (current ? statOf(current) : 0) }
  const busy = equip.pending || unequip.pending || sellMany.pending || salvageMany.pending || upgrade.pending || chooseAffix.pending || combine.pending || claim.pending || resume.pending || clearResume.pending || buyBag.pending || buyPouch.pending || buyOffer.pending
  // D131: the strengths in the pouch and the combine recipe; one row and no recipe under a catalog without strengths.
  const potionRows = bag.potionRows as PotionRow[]
  const potionCombine = bag.potionCombine as Combine | null
  const heldStrengths = potionRows.filter((row) => row.count > 0)
  const healsLine = heldStrengths.length === 0 ? t.healsEach(potionRows[0]?.heals ?? 0) : heldStrengths.length === 1 ? t.healsEach(heldStrengths[0]!.heals) : t.healsRange(heldStrengths[0]!.heals, heldStrengths.at(-1)!.heals)
  const full = bag.used >= bag.capacity
  // Quiet warning at 80% of the current bag (D61).
  const filling = bag.used >= Math.ceil(bag.capacity * 0.8)
  // A held find needs a free bag slot to be claimed.
  const claimBlocked = full
  type SortPlan = { sell: { id: Id<'items'>; label: string; saleValue: number }[]; gold: number; claim: boolean }
  const plan = bag.resumePlan as SortPlan | null
  // D189: an awake hero holding a find (v26) gets the same one-tap sale, with nothing to resume.
  const keepPlan = bag.keepPlan as SortPlan | null | undefined
  const sortPlan = plan ?? (held ? keepPlan ?? null : null)
  const keeping = plan === null && sortPlan !== null
  const opened = openId === 'potions' ? null : gear.find((item) => item.id === openId) ?? null
  const slotLabel = (item: Gear) => {
    const delta = deltaOf(item)
    const compare = item.requiredLevel > hero.level ? t.requiresLevel(item.requiredLevel) : delta > 0 ? t.better(delta) : delta < 0 ? t.worse(-delta) : t.same
    return `${c.name(item.label)}, ${t.rarity[item.rarity] ?? item.rarity}, ${t.statOf(statOf(item), statLabel(item))}, ${compare}${item.held ? t.heldFind : ''}${item.spareOf ? t.spareOf(item.spareOf.ownerName) : ''}`
  }
  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(retainSellableSelection(current, gear))
    if (next.has(id)) next.delete(id)
    else if (next.size < SALE_LIMIT) next.add(id)
    else announce({ error: t.saleFull(mode === 'salvage', SALE_LIMIT), message: null })
    return next
  })
  const leaveSale = () => { setMode('browse'); setSelected(new Set()) }
  const tap = (item: Gear) => { if (mode !== 'browse' && !item.held) toggle(item.id); else setOpenId(item.id) }

  async function act<A>(item: Gear | null, intent: { run: (args: A, message?: string) => Promise<boolean> }, args: A, message: string) {
    setBusyId(item?.id ?? null)
    const done = await intent.run(args, message)
    setBusyId(null)
    if (done) setOpenId(null)
    return done
  }
  async function confirmReview() {
    if (!review || !validReview || !manageable) return
    const ids = review.items.map((item) => item.id)
    const done = review.kind === 'sell'
      ? await sellMany.run({ itemIds: ids }, t.sold(t.items(review.items.length), goldOf(review.items)))
      : await salvageMany.run({ itemIds: ids }, t.salvaged(t.items(review.items.length), mats(yieldOf(review.items))))
    if (done) {
      setReview(null)
      leaveSale()
    }
  }

  // One row of empty slots at most: the header counts the capacity, and ten dashed squares were a screen of nothing.
  const emptyShown = Math.min(EMPTY_SLOTS_SHOWN, Math.max(0, bag.capacity - inBag.length))
  const claimMessage = (item: Gear) => t.claimMessage(item.label)
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <header className="sticky top-13 z-20 -mx-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-4 border-raised bg-night px-3 py-3 min-[375px]:-mx-4 min-[375px]:px-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold">{t.yourBag}</h1>
          <p className="text-sm tabular-nums text-muted">{t.slots(bag.ladder.name, bag.used, bag.capacity)}</p>
        </div>
        <p className="flex items-center gap-2 font-display text-2xl font-bold tabular-nums text-gold-ink">
          <Glyph name="coin" />
          <span>{formatNumber(locale, hero.gold)}</span>
          <span className="font-sans text-sm font-semibold tracking-wide">{t.goldLabel}</span>
        </p>
      </header>
      {hero.status === 'sleeping' ? (
        <Card title={hero.wakeAtTick !== null ? t.resumingNext : plan ? (plan.claim ? t.findWaiting : t.resumeAdventures) : t.resumeAdventures}>
          {hero.wakeAtTick !== null ? <>
            <ResumeAt />
            <label className="mt-4 flex flex-col gap-2 text-sm">
              <span className="font-semibold">{t.resumeIn}</span>
              <select value={destination} disabled={busy || !manageable} onChange={(event) => setDestination(event.target.value)} className="pixel-select min-h-11 border-2 border-edge pr-9 pl-3 text-base">
                <option value="">{c.name(hero.biomes.find((biome: Biome) => biome.id === hero.biomeId)?.name ?? '') || t.currentArea}</option>
                {hero.biomes.filter((biome: Biome) => biome.unlocked && biome.id !== hero.biomeId).map((biome: Biome) => <option key={biome.id} value={biome.id}>{c.name(biome.name)}</option>)}
              </select>
            </label>
            {destination ? <Button className="mt-3" pending={resume.pending} busyLabel={t.scheduling} disabled={!manageable || busy} onClick={() => resume.run({ biomeId: destination }, t.resumingOnNext)}>{t.resumeAdventures}</Button> : null}
            {destination ? <p className="mt-2 text-sm text-muted">{t.setsOut}</p> : null}
          </> : plan ? <>
            <p>{plan.claim && held ? <><strong>{c.name(held.label)}</strong>{t.didntFit}</> : t.bagStopped}</p>
            {plan.sell.length > 0 ? <p className="mt-2 text-sm">{t.sellWeakest(plan.sell.map((item) => c.name(item.label)).join(', '), plan.gold)}</p> : null}
            {plan.sell.length > 0
              ? <Button className="mt-3" disabled={!manageable || busy} onClick={() => setClearing(true)}>{plan.claim ? t.sellClaimResume : t.sellAndResume}</Button>
              : <Button className="mt-3" pending={clearResume.pending} busyLabel={t.claiming} disabled={!manageable || busy} onClick={() => clearResume.run({ itemIds: [] }, t.resumingOnNext)}>{t.claimAndResume}</Button>}
          </> : <>
            <p>{t.roomForMore}</p>
            <label className="mt-4 flex flex-col gap-2 text-sm">
              <span className="font-semibold">{t.resumeIn}</span>
              <select value={destination} disabled={busy || !manageable} onChange={(event) => setDestination(event.target.value)} className="pixel-select min-h-11 border-2 border-edge pr-9 pl-3 text-base">
                <option value="">{c.name(hero.biomes.find((biome: Biome) => biome.id === hero.biomeId)?.name ?? '') || t.currentArea}</option>
                {hero.biomes.filter((biome: Biome) => biome.unlocked && biome.id !== hero.biomeId).map((biome: Biome) => <option key={biome.id} value={biome.id}>{c.name(biome.name)}</option>)}
              </select>
            </label>
            {destination ? <Button className="mt-3" pending={resume.pending} busyLabel={t.scheduling} disabled={!manageable || busy || !bag.canResume} onClick={() => resume.run({ biomeId: destination }, t.resumingOnNext)}>{t.resumeAdventures}</Button> : <p className="mt-3 text-sm text-muted">{t.resumingOnNext}</p>}
            {destination ? <p className="mt-2 text-sm text-muted">{t.setsOut}</p> : null}
          </>}
        </Card>
      ) : held && keeping ? (
        <Card title={t.bagFullTitle}>
          <p>{t.keepingGoing(held.label)}</p>
          {sortPlan.sell.length > 0 ? <>
            <p className="mt-2 text-sm">{t.sellToKeep(sortPlan.sell.map((item) => c.name(item.label)).join(', '), sortPlan.gold)}</p>
            <Button className="mt-3" disabled={!manageable || busy} onClick={() => setClearing(true)}>{t.sellAndKeep}</Button>
          </> : null}
        </Card>
      ) : null}
      {sortPlan && sortPlan.sell.length > 0 ? (
        <ConfirmSheet open={clearing} title={keeping ? t.makeRoomKeep : t.makeRoomResume} confirmLabel={keeping ? t.sellAndKeep : sortPlan.claim ? t.sellClaimResume : t.sellAndResume} busyLabel={keeping ? t.claiming : t.scheduling} cancelLabel={t.keepThem} pending={clearResume.pending} disabled={!manageable} onClose={() => setClearing(false)} onConfirm={async () => {
          const done = await clearResume.run({ itemIds: sortPlan.sell.map((item) => item.id) }, keeping && held ? t.keptMessage(held.label) : t.resumingOnNext)
          if (done) setClearing(false)
        }}>
          <Consequences>
            <li>{keeping ? t.sellToKeep(sortPlan.sell.map((item) => c.name(item.label)).join(', '), sortPlan.gold) : t.sellWeakest(sortPlan.sell.map((item) => c.name(item.label)).join(', '), sortPlan.gold)}</li>
            {!keeping && sortPlan.claim && held ? <li>{t.claimMessage(held.label)}</li> : null}
          </Consequences>
          <ErrorNote message={clearResume.error} />
        </ConfirmSheet>
      ) : null}
      {reason ? <p className="text-sm">{hero.status === 'paused' && hero.simulationState !== 'quarantined' ? <>{t.pausedBefore}<Link to="/app/desk-crawler" className="underline underline-offset-4">{t.resumeFromHero}</Link>{t.pausedAfter}</> : reason}</p> : null}

      <Card title={t.equipped} icon="sword">
        <div className="grid grid-cols-3 gap-2 min-[375px]:gap-3 sm:max-w-sm sm:gap-5">
          {(['weapon', 'armor'] as const).map((kind) => {
            const item = equippedOf(kind)
            return <div key={kind} className="flex min-w-0 flex-col gap-1.5">
              <h3 className="caps text-sm text-muted">{t.kindTitle[kind]}</h3>
              {item ? <Slot item={item} label={t.equippedLabel(c.name(item.label), t.kind[kind], t.statOf(statOf(item), statLabel(item)))} busy={busyId === item.id} onClick={() => setOpenId(item.id)} /> : <EmptySlot />}
              <p className="text-sm leading-snug">{item ? <StatOf item={item} /> : <span className="text-muted">{t.empty}</span>}</p>
            </div>
          })}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="caps text-sm text-muted">{t.potionsTitle}</h3>
            <PotionSlot count={bag.potions} label={t.potionSlot(t.potions(bag.potions), heldStrengths.map((row) => `${row.count} ${c.name(row.name.toLowerCase())}`).join(', ') || t.none)} onClick={() => setOpenId('potions')} />
            <p className="text-sm leading-snug tabular-nums">{healsLine}</p>
          </div>
        </div>
      </Card>

      <section aria-labelledby="bag-gear-title" className="window min-w-0 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
        {/* The title stays one line beside either button, so the header holds still when Sell gear becomes Done. */}
        <div className="flex min-h-11 items-center justify-between gap-3">
          {/* The page header already names the bag; this window is its gear. */}
          <h2 id="bag-gear-title" className="flex min-w-0 items-center gap-3 font-display text-xl font-bold sm:text-2xl"><Glyph name="bag" size={24} className="text-gold-ink" /><span className="truncate">{t.gear}</span></h2>
          {mode !== 'browse'
            ? <Button allowOffline variant="secondary" className="w-28 shrink-0 whitespace-nowrap" disabled={busy} onClick={leaveSale}>{t.done}</Button>
            // D167: nothing to sell, no keys; the line under the title says finds land here.
            : sellable.length === 0 ? null : <div className="flex shrink-0 gap-2">
              <Button allowOffline variant="secondary" className="whitespace-nowrap" icon="tag" onClick={() => setMode('sell')}>{t.sell}</Button>
              {/* D129: the second way out of the bag, beside Sell. */}
              {workbench ? <Button allowOffline variant="secondary" className="whitespace-nowrap" icon="scrap" onClick={() => setMode('salvage')}>{t.salvage}</Button> : null}
            </div>}
        </div>
        <p className="mt-1 min-h-5 text-sm text-muted">
          {mode !== 'browse'
            ? <>{t.tapToSelect}{sellable.length > chosen.length ? <> <button type="button" className="font-semibold text-ink underline underline-offset-4" onClick={() => setSelected(new Set(sellable.slice(0, SALE_LIMIT).map((item) => item.id)))}>{t.selectAll}</button></> : null}</>
            : inBag.length === 0 ? t.noSpare : full ? t.bagFull : filling ? t.nearlyFull(workbench !== null) : t.tapToCompare(workbench !== null)}
        </p>
        <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
          {held ? <li><Slot item={held} held label={slotLabel(held)} busy={busyId === held.id} onClick={() => setOpenId(held.id)} /></li> : null}
          {inBag.map((item) => <li key={item.id}><Slot item={item} label={slotLabel(item)} selectable={mode !== 'browse'} selected={selected.has(item.id)} upgrade={deltaOf(item) > 0 && item.requiredLevel <= hero.level} downgrade={deltaOf(item) < 0 && item.requiredLevel <= hero.level} lockedLevel={item.requiredLevel > hero.level ? item.requiredLevel : null} busy={busyId === item.id} onClick={() => tap(item)} /></li>)}
          {Array.from({ length: emptyShown }, (_, index) => <li key={`empty-${index}`}><EmptySlot /></li>)}
        </ul>
      </section>

      {workbench ? <Workbench rules={workbench} materials={materials} equipped={[equippedOf('weapon'), equippedOf('armor')]} hero={hero} disabled={!manageable || busy} intents={{ upgrade, chooseAffix }} /> : null}
      {bag.merchant ? <Merchant visit={bag.merchant} gold={hero.gold} potions={bag.potions} cap={bag.pouch.cap} discountPct={bag.ladder.merchantDiscountPct} disabled={!manageable || busy} intent={buyOffer} /> : null}
      <div className="grid gap-8 sm:grid-cols-2">
        <div id="bags"><BagLadder ladder={bag.ladder} capacity={bag.capacity} gold={hero.gold} disabled={!manageable || busy} intent={buyBag} /></div>
        {/* A pouch with nothing bigger to buy has nothing to act on, so its card hides (D167). */}
        {bag.pouch.next ? <div id="pouch"><PotionPouch pouch={bag.pouch} potions={bag.potions} gold={hero.gold} disabled={!manageable || busy} intent={buyPouch} /></div> : null}
      </div>

      {mode !== 'browse' ? <div className="window sticky bottom-0 z-20 -mx-3 px-3 pt-3 min-[375px]:-mx-4 min-[375px]:px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:mx-0">
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="min-w-0 text-sm tabular-nums">{chosen.length === 0 ? t.nothingSelected : mode === 'sell' ? <>{t.forGold(t.items(chosen.length))}<span className="text-gold-ink">{t.goldAmount(goldOf(chosen))}</span>{rareOf(chosen) > 0 ? t.rareCount(rareOf(chosen)) : ''}</> : <>{t.forGold(t.items(chosen.length))}<span className="text-rare-ink">{mats(yieldOf(chosen))}</span></>}</p>
          <Button allowOffline disabled={!manageable || busy || chosen.length === 0} onClick={() => setReview({ kind: mode === 'sell' ? 'sell' : 'salvage', items: chosen })}>{mode === 'sell' ? t.sellN(chosen.length) : t.salvageN(chosen.length)}</Button>
        </div>
      </div> : null}

      <Sheet open={openId === 'potions'} onClose={() => { if (!combine.pending) setOpenId(null) }} label={t.potionsTitle}>
        <SheetTitle>{t.potionsTitle}</SheetTitle>
        <p className="mt-2 tabular-nums">{t.youHave}<strong className="text-rare-ink">{bag.potions}</strong>{t.pouchHolds(bag.pouch.name, bag.pouch.cap)}</p>
        {/* D131: one line per strength, weakest first, with what one drink restores for this hero. */}
        <ul aria-label={t.byStrength} className="mt-3 flex flex-col gap-1 tabular-nums">
          {potionRows.map((row) => <li key={row.templateId} className={`flex items-center justify-between gap-3 ${row.count === 0 ? 'text-muted' : ''}`}><span>{c.name(row.name)} <span className="text-sm text-muted">{t.strengthRow(row.healPct, row.heals)}</span></span><strong className={row.count === 0 ? '' : 'text-rare-ink'}>{row.count}</strong></li>)}
        </ul>
        <p className="mt-2 text-sm text-muted">{t.drinksWeakest}</p>
        {potionCombine ? <div className="mt-4 border-t-2 border-faint pt-3">
          <p className="tabular-nums"><strong>{t.combine}</strong>{t.combineRecipe(potionCombine.from.count, potionCombine.from.name, mats(potionCombine.materials), potionCombine.to.name)}</p>
          {potionCombine.batches > 0
            ? <div className="mt-2 flex flex-wrap gap-2">
              <Button disabled={!manageable || busy} pending={combine.pending} busyLabel={t.combining} onClick={() => combine.run({ batches: 1 }, t.combinedOne(potionCombine.to.name))}>{t.combineN(1)}</Button>
              {potionCombine.batches > 1 ? <Button variant="secondary" disabled={!manageable || busy} pending={combine.pending} busyLabel={t.combining} onClick={() => combine.run({ batches: Math.min(10, potionCombine.batches) }, t.combinedMany(Math.min(10, potionCombine.batches), potionCombine.to.name))}>{t.combineN(Math.min(10, potionCombine.batches))}</Button> : null}
            </div>
            : <p className="mt-1 text-sm tabular-nums">{t.needs([potionCombine.shortfall.potions > 0 ? t.needsMorePotions(potionCombine.shortfall.potions, potionCombine.from.name) : null, Object.keys(potionCombine.shortfall.materials).length > 0 ? t.needsMaterials(mats(potionCombine.shortfall.materials), potionCombine.shortfall.potions === 0) : null].filter((part): part is string => part !== null))}</p>}
          <ErrorNote message={combine.error ?? null} />
        </div> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to="/app/desk-crawler" className={`${LINK_BUTTON} ${BUTTON_SECONDARY} justify-center`}>{t.goToHero}</Link>
          <Button allowOffline variant="secondary" onClick={() => setOpenId(null)}>{t.close}</Button>
        </div>
      </Sheet>

      <Sheet open={openId !== null && openId !== 'potions'} onClose={() => setOpenId(null)} label={t.gear}>
        {opened ? <ItemSheet key={opened.id} item={opened} hero={hero} current={equippedOf(opened.kind)} manageable={manageable} reason={reason} busy={busy} claimBlocked={claimBlocked} bagFull={full} intents={{ equip, unequip, claim }} onClose={() => setOpenId(null)} onEquip={() => act(opened, equip, { itemId: opened.id }, t.equippedMsg(opened.label))} onUnequip={() => act(opened, unequip, { slot: opened.kind }, t.unequippedMsg(opened.label))} onClaim={() => act(opened, claim, {}, claimMessage(opened))} onSell={() => { setOpenId(null); setReview({ kind: 'sell', items: [opened] }) }} onSalvage={workbench ? () => { setOpenId(null); setReview({ kind: 'salvage', items: [opened] }) } : null} materials={materials} /> : <>
          <SheetTitle>{t.goneTitle}</SheetTitle>
          <p className="mt-2 text-sm">{t.goneBody}</p>
          <Button allowOffline variant="secondary" className="mt-4 w-full" onClick={() => setOpenId(null)}>{t.close}</Button>
        </>}
      </Sheet>

      <Sheet open={review !== null} onClose={() => { if (!reviewing?.pending) setReview(null) }} label={review?.kind === 'salvage' ? t.salvageGear : t.sellGear}>
        {review && reviewing ? <>
          <SheetTitle>{review.kind === 'sell' ? <>{t.sellTitleBefore(t.items(review.items.length))}<span className="text-gold-ink">{t.goldAmount(goldOf(review.items))}</span>{t.titleEnd}</> : <>{t.salvageTitleBefore(t.items(review.items.length))}<span className="text-rare-ink">{mats(yieldOf(review.items))}</span>{t.titleEnd}</>}</SheetTitle>
          <p className="mt-2 text-sm">{t.cannotUndo}{rareOf(review.items) > 0 ? t.includes(t.rareItems(rareOf(review.items))) : ''}{review.kind === 'salvage' ? t.materialsToBench : ''}</p>
          <ul aria-label={review.kind === 'sell' ? t.itemsInSale : t.itemsToSalvage} className="mt-3 max-h-48 overflow-y-auto border-y-2 border-rule text-sm">{review.items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 border-b border-rule py-1.5 last:border-b-0"><span className={`flex min-w-0 items-center gap-2 font-semibold ${RARITY_TONE[item.rarity] ?? ''}`}><Gem rarity={item.rarity} scale={2} /><span className="truncate">{c.name(item.label)}</span></span>{review.kind === 'sell' ? <span className="shrink-0 tabular-nums text-gold-ink">{t.goldAmount(item.saleValue)}</span> : <span className="shrink-0 tabular-nums text-rare-ink">{mats(item.salvage)}</span>}</li>)}</ul>
          {!validReview ? <p role="alert" className="mt-3 text-sm font-semibold">{t.gearChanged}</p> : null}
          {!manageable && reason ? <p className="mt-3 text-sm">{reason}</p> : null}
          <div className="mt-3 empty:hidden"><ErrorNote message={reviewing.error} /></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button disabled={!manageable || busy || !validReview} pending={reviewing.pending} busyLabel={review.kind === 'sell' ? t.selling : t.salvaging} onClick={confirmReview}>{t.confirm}</Button>
            <Button allowOffline variant="secondary" disabled={reviewing.pending} onClick={() => setReview(null)}>{t.cancel}</Button>
          </div>
        </> : null}
      </Sheet>

      <NoticeBar notice={notice} lifted={mode !== 'browse'} onDismiss={dismiss} />
    </div>
  )
}

/** One piece: its icon, stats against the equipped piece, affix and sale value, then the actions open to it. */
function ItemSheet({ item, hero, current, manageable, reason, busy, claimBlocked, bagFull, intents, onClose, onEquip, onUnequip, onClaim, onSell, onSalvage, materials }: {
  item: Gear
  hero: { level: number }
  current: Gear | null
  manageable: boolean
  reason: string | null
  busy: boolean
  claimBlocked: boolean
  bagFull: boolean
  intents: { equip: { pending: boolean; error: string | null }; unequip: { pending: boolean; error: string | null }; claim: { pending: boolean; error: string | null } }
  onClose: () => void
  onEquip: () => void
  onUnequip: () => void
  onClaim: () => void
  onSell: () => void
  /** D129: absent under a catalog without a workbench. */
  onSalvage: (() => void) | null
  materials: readonly Material[]
}) {
  const delta = statOf(item) - (current ? statOf(current) : 0)
  const canEquip = item.requiredLevel <= hero.level
  const error = item.equipped ? intents.unequip.error : item.held ? intents.claim.error : intents.equip.error
  // Unequipping, or equipping something weaker, makes the hero fight worse, so it asks first (in place, inside this sheet).
  const [confirming, setConfirming] = useState<'equip' | 'unequip' | null>(null)
  const weaker = !item.equipped && current !== null && delta < 0
  const t = useT(dcBagMessages)
  const c = useContent()
  const stat = t.stat[item.kind]
  return <>
    <div className="flex items-start gap-3">
      <div className="w-16 shrink-0"><SlotPreview item={item} /></div>
      <div className="min-w-0 flex-1">
        <SheetTitle><span className={RARITY_TONE[item.rarity] ?? ''}>{c.name(item.label)}</span></SheetTitle>
        <p className="mt-1 text-sm text-muted">{t.itemMeta(t.rarity[item.rarity] ?? item.rarity, t.kind[item.kind], item.requiredLevel, item.equipped ? t.equippedState : item.held ? t.heldFind : '')}</p>
      </div>
    </div>
    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      <dt className="caps text-muted">{stat}</dt>
      <dd className="tabular-nums"><StatOf item={item} />{!item.equipped ? <Delta delta={delta} /> : null}</dd>
      {!item.equipped ? <><dt className="caps text-muted">{t.equipped}</dt><dd className="tabular-nums">{current ? <>{c.name(current.label)}, <StatOf item={current} /></> : <span className="text-muted">{t.nothingEquipped}</span>}</dd></> : null}
      {item.affix ? <><dt className="caps text-muted">{c.text(item.affix.name)}</dt><dd>{c.text(item.affix.blurb)}</dd></> : null}
      {item.spareOf ? <><dt className="caps text-muted">{t.nameOnIt}</dt><dd><WithName text={t.inMarker} name={item.spareOf.ownerName} profile={item.spareOf.profile} /></dd></> : null}
      <dt className="caps text-muted">{t.sellsFor}</dt>
      <dd className="tabular-nums text-gold-ink">{t.goldAmount(item.saleValue)}</dd>
      {onSalvage ? <><dt className="caps text-muted">{t.salvagesFor}</dt><dd className="tabular-nums text-rare-ink">{materialsText(item.salvage, materials, t)}</dd></> : null}
    </dl>
    {!manageable && reason ? <p className="mt-3 text-sm">{reason}</p> : item.held && claimBlocked ? <p className="mt-3 text-sm">{t.claimNeedsRoom}</p> : item.equipped && bagFull ? <p className="mt-3 text-sm">{t.freeToUnequip}</p> : !item.equipped && !item.held && !canEquip ? <p className="mt-3 text-sm">{t.wearFrom(item.requiredLevel)}</p> : null}
    <div className="mt-3 empty:hidden"><ErrorNote message={error} /></div>
    {confirming ? (
      <div className="mt-4 flex flex-col gap-3">
        <Consequences>
          {confirming === 'unequip'
            ? <li>{t.unequipBefore(t.kind[item.kind], stat)}<strong>{statOf(item)}</strong>{t.unequipAfter(item.label)}</li>
            : <li>{t.weakerBefore(item.label)}<strong>{t.weakerStrong(Math.abs(delta), stat)}</strong>{t.weakerAfter(current?.label ?? '')}</li>}
          <li>{t.changeBack}</li>
        </Consequences>
        <ConfirmButtons
          confirmLabel={confirming === 'unequip' ? t.unequip : t.equipAnyway}
          busyLabel={confirming === 'unequip' ? t.removing : t.equipping}
          cancelLabel={t.keepItOn}
          pending={confirming === 'unequip' ? intents.unequip.pending : intents.equip.pending}
          disabled={!manageable || busy || (confirming === 'unequip' && bagFull)}
          onConfirm={confirming === 'unequip' ? onUnequip : onEquip}
          onCancel={() => setConfirming(null)}
        />
      </div>
    ) : <div className="mt-4 grid grid-cols-2 gap-2">
      {item.equipped
        ? <Button variant="secondary" disabled={!manageable || busy || bagFull} pending={intents.unequip.pending} busyLabel={t.removing} onClick={() => setConfirming('unequip')}>{t.unequip}</Button>
        : item.held
          ? <Button disabled={!manageable || busy || claimBlocked} pending={intents.claim.pending} busyLabel={t.claiming} onClick={onClaim}>{t.claimFind}</Button>
          : <>
            <Button variant={delta > 0 && canEquip ? 'primary' : 'secondary'} disabled={!manageable || busy || !canEquip} pending={intents.equip.pending} busyLabel={t.equipping} onClick={() => (weaker ? setConfirming('equip') : onEquip())}>{t.equip}</Button>
            <Button allowOffline variant="secondary" disabled={!manageable || busy} onClick={onSell}>{t.sell}</Button>
            {onSalvage ? <Button allowOffline variant="secondary" icon="scrap" disabled={!manageable || busy} onClick={onSalvage}>{t.salvage}</Button> : null}
          </>}
      <Button allowOffline variant="quiet" className={item.equipped || item.held || onSalvage ? '' : 'col-span-2'} disabled={busy} onClick={onClose}>{t.close}</Button>
    </div>}
  </>
}

type Ladder = {
  name: string
  findable: boolean
  merchantDiscountPct: number
  next: { id: string; name: string; capacity: number; price: number | null; milestoneLevel: number | null; milestoneAdventures: number | null; buyable: boolean; lockedUntilLevel: number | null } | null
}
type Pouch = { name: string; cap: number; findable: boolean; next: { id: string; name: string; cap: number; price: number | null; milestoneLevel: number | null; buyable: boolean; lockedUntilLevel: number | null } | null }

/**
 * How a milestone rung arrives (D61/D122): its level or adventure count and the early routes. A shop rung needs no
 * line, since its Buy button or price sits right below, and the merchant's discount is never advertised (D164).
 */
function MilestoneLine({ milestone, findable }: { milestone: string | null; findable: boolean }) {
  const t = useT(dcBagMessages)
  if (milestone === null) return null
  const early = [findable ? t.heroFinds : null, t.merchantHas].filter((route): route is string => route !== null)
  return <p className="mt-1 text-sm text-muted">{t.yoursAt(milestone, early)}</p>
}
type Offer = { id: 'potions' | 'pouch' | 'bag'; name: string; quantity: number; price: number; tierId?: string }
type Visit = { offers: Offer[]; expiresAtTick: number; ticksLeft: number; biomeId: string }

/** D77/D122: the potion pouch, its next tier and how to get it, beside the bag ladder. */
function PotionPouch({ pouch, potions, gold, disabled, intent }: { pouch: Pouch; potions: number; gold: number; disabled: boolean; intent: PurchaseIntent<{ tierId: string }> }) {
  const next = pouch.next
  const affordable = next?.price != null && gold >= next.price
  const [asking, setAsking] = useState(false)
  const t = useT(dcBagMessages)
  const c = useContent()
  const holds = t.holdsPotions(pouch.cap, potions)
  const nextLine = next ? t.nextPouch(next.name, next.cap) : []
  return <Card title={c.name(pouch.name)} icon="potion">
    <p className="tabular-nums">{holds[0]}<strong>{holds[1]}</strong>{holds[2]}<strong>{holds[3]}</strong>{holds[4]}</p>
    {next ? <>
      <p className="mt-3"><strong>{nextLine[0]}</strong>{nextLine[1]}</p>
      <MilestoneLine milestone={next.milestoneLevel !== null ? t.atLevel(next.milestoneLevel) : null} findable={pouch.findable} />
      {next.price !== null ? next.buyable ? <>
        {affordable ? <Button className="mt-3" disabled={disabled} pending={intent.pending} icon="coin" busyLabel={t.buying} onClick={() => setAsking(true)}>{t.buyFor(next.price)}</Button> : <Price price={next.price} gold={gold} className="mt-3" />}
        <BuySheet open={asking} title={t.buyTheTitle(next.name)} price={next.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={() => intent.run({ tierId: next.id }, t.pouchBought(next.name, next.cap))}>
          <li>{t.holdsInstead(next.cap, pouch.cap)}</li>
        </BuySheet>
      </> : <p className="mt-2 text-sm">{next.lockedUntilLevel !== null ? t.buyFrom(next.lockedUntilLevel) : t.afterPouchMilestone}</p> : null}
    </> : <p className="mt-3 text-sm text-muted">{t.biggestPouch}</p>}
  </Card>
}

/** D78: the visiting merchant's offers, each sold once, open for a few adventures. */
function Merchant({ visit, gold, potions, cap, discountPct, disabled, intent }: { visit: Visit; gold: number; potions: number; cap: number; discountPct: number; disabled: boolean; intent: PurchaseIntent<{ offerId: Offer['id'] }> }) {
  const [asking, setAsking] = useState<Offer | null>(null)
  const t = useT(dcBagMessages)
  const c = useContent()
  const have = t.haveGold(gold)
  return <Card title={t.merchant} icon="merchant">
    <p className="text-sm">{t.leavesIn(visit.ticksLeft)}</p>
    <ul className="mt-3 flex flex-col gap-3">
      {visit.offers.map((offer) => {
        const affordable = gold >= offer.price
        const overflow = offer.id === 'potions' && potions + offer.quantity > cap
        // D122: a bag or pouch offer undercuts the Bag page, and the card says so.
        const deal = offer.id !== 'potions' && discountPct > 0
        return <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-faint pt-3 first:border-t-0 first:pt-0">
          <span><strong>{c.name(offer.name)}</strong>{deal ? <span className="block text-sm text-muted">{t.offPrice(discountPct)}</span> : null}{overflow ? <span className="block text-sm text-muted">{t.pouchRoom(cap)}</span> : null}</span>
          {affordable && !overflow ? <Button disabled={disabled} pending={intent.pending} icon="coin" busyLabel={t.buying} onClick={() => setAsking(offer)}>{t.buyFor(offer.price)}</Button> : <span className="text-sm font-semibold tabular-nums text-gold-ink">{t.goldAmount(offer.price)}</span>}
        </li>
      })}
    </ul>
    {visit.offers.some((offer) => gold < offer.price) ? <p className="mt-2 text-sm tabular-nums">{have[0]}<span className="text-gold-ink">{have[1]}</span>{have[2]}</p> : null}
    <BuySheet open={asking !== null} title={asking ? t.buyOffer(asking.name) : ''} price={asking?.price ?? 0} gold={gold} pending={intent.pending} onClose={() => setAsking(null)} onConfirm={() => (asking ? intent.run({ offerId: asking.id }, t.offerBought(asking.name)) : Promise.resolve(false))}>
      <li>{t.sellsOnce}</li>
    </BuySheet>
  </Card>
}

/** D61/D122: the current bag, the next one and how to get it. */
function BagLadder({ ladder, capacity, gold, disabled, intent }: { ladder: Ladder; capacity: number; gold: number; disabled: boolean; intent: PurchaseIntent<{ tierId: string }> }) {
  const next = ladder.next
  const affordable = next?.price != null && gold >= next.price
  const [asking, setAsking] = useState(false)
  const t = useT(dcBagMessages)
  const holds = t.yourBagHolds(ladder.name, capacity)
  const nextLine = next ? t.nextBag(next.name, next.capacity) : []
  return <Card title={t.biggerBags} icon="bag">
    <p className="tabular-nums">{holds[0]}<strong>{holds[1]}</strong>{holds[2]}<strong>{holds[3]}</strong>{holds[4]}</p>
    {next ? <>
      <p className="mt-3"><strong>{nextLine[0]}</strong>{nextLine[1]}</p>
      <MilestoneLine milestone={next.milestoneAdventures !== null ? t.afterAdventures(next.milestoneAdventures) : next.milestoneLevel !== null ? t.atLevel(next.milestoneLevel) : null} findable={ladder.findable} />
      {next.price !== null ? next.buyable ? <>
        {affordable ? <Button className="mt-3" disabled={disabled} pending={intent.pending} icon="coin" busyLabel={t.buying} onClick={() => setAsking(true)}>{t.buyFor(next.price)}</Button> : <Price price={next.price} gold={gold} className="mt-3" />}
        <BuySheet open={asking} title={t.buyTheTitle(next.name)} price={next.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={() => intent.run({ tierId: next.id }, t.bagBought(next.name, next.capacity))}>
          <li>{t.holdsGearInstead(next.capacity, capacity)}</li>
        </BuySheet>
      </> : <p className="mt-2 text-sm">{next.lockedUntilLevel !== null ? t.buyFrom(next.lockedUntilLevel) : t.afterBagMilestone}</p> : null}
    </> : <p className="mt-3 text-sm text-muted">{t.biggestBag}</p>}
  </Card>
}

/**
 * D129: the workbench. The materials strip, then one row per equipped piece with its next step (the tier, then the
 * reinforcement), its price, the stat it reaches and what is short; rare and epic gear add an affix picker. Every job
 * asks first. Nothing here is automatic or random.
 */
function Workbench({ rules, materials, equipped, hero, disabled, intents }: { rules: WorkbenchRules; materials: readonly Material[]; equipped: readonly (Gear | null)[]; hero: { level: number; gold: number }; disabled: boolean; intents: { upgrade: PurchaseIntent<{ itemId: Id<'items'> }>; chooseAffix: PurchaseIntent<{ itemId: Id<'items'>; affixId: string }> } }) {
  const [asking, setAsking] = useState<Gear | null>(null)
  const [fitting, setFitting] = useState<Gear | null>(null)
  const [affixId, setAffixId] = useState<string | null>(null)
  const affixPrice = rules.affix
  const affixShort = Object.fromEntries(Object.entries(affixPrice.materials).filter(([id, n]) => (materials.find((m) => m.id === id)?.count ?? 0) < n).map(([id, n]) => [id, n - (materials.find((m) => m.id === id)?.count ?? 0)]))
  const affixAffordable = Object.keys(affixShort).length === 0 && hero.gold >= affixPrice.gold
  const step = asking?.nextStep ?? null
  const t = useT(dcBagMessages)
  const c = useContent()
  const mats = (counts: MaterialCount) => materialsText(counts, materials, t)
  const statTitle = (item: Gear) => t.statTitle[item.kind]
  return <Card title={t.workbench} icon="components">
    <p className="text-sm">{t.workbenchBody}</p>
    <ul aria-label={t.materials} className="mt-3 flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
      {materials.map((m) => <li key={m.id} className="flex items-center gap-1.5"><Glyph name={m.glyph as 'scrap'} size={16} className="text-rare-ink" /><strong>{m.count}</strong> {c.name(m.name)}</li>)}
    </ul>
    <ul className="mt-4 flex flex-col gap-4">
      {(['weapon', 'armor'] as const).map((kind, index) => {
        const item = equipped[index] ?? null
        const next = item?.nextStep ?? null
        return <li key={kind} className="border-t-2 border-faint pt-3">
          <h3 className="caps text-sm text-muted">{t.kindTitle[kind]}</h3>
          {item === null ? <p className="mt-1 text-sm text-muted">{t.equipToWork(t.kind[kind])}</p> : <>
            <p className={`mt-1 font-semibold ${RARITY_TONE[item.rarity] ?? ''}`}>{c.name(item.label)}</p>
            {next && next.requiredLevel > hero.level ? <>
              {/* D167: a step the level has not reached is one line, not a price list for a job that cannot be done yet. */}
              <p className="mt-1 text-sm text-muted">{t.stepNeedsLevel(next.label, next.requiredLevel)}</p>
              {item.affixable ? <Button className="mt-2" variant="secondary" disabled={disabled} onClick={() => { setAffixId(null); setFitting(item) }}>{t.chooseAffix}</Button> : null}
            </> : next ? <>
              <p className="mt-1 text-sm tabular-nums">{t.stepLine(t.stepLabel(next.label), t.priceText(mats(next.materials), next.gold), statTitle(item), next.stat.from)}<strong>{next.stat.to}</strong>.</p>
              {next.affordable || item.affixable ? <div className="mt-2 flex flex-wrap items-center gap-2">
                {next.affordable ? <Button disabled={disabled} pending={intents.upgrade.pending && asking?.id === item.id} busyLabel={t.working} onClick={() => setAsking(item)}>{next.kind === 'tier' ? t.upgrade : t.reinforce}</Button> : null}
                {item.affixable ? <Button variant="secondary" disabled={disabled} onClick={() => { setAffixId(null); setFitting(item) }}>{t.chooseAffix}</Button> : null}
              </div> : null}
              {!next.affordable ? <p className="mt-2 text-sm tabular-nums">{shortText(next, hero, materials, t)}</p> : null}
            </> : <>
              <p className="mt-1 text-sm text-muted">{t.fullyReinforced}</p>
              {item.affixable ? <Button className="mt-2" variant="secondary" disabled={disabled} onClick={() => { setAffixId(null); setFitting(item) }}>{t.chooseAffix}</Button> : null}
            </>}
          </>}
        </li>
      })}
    </ul>
    <ConfirmSheet open={asking !== null && step !== null} title={asking && step ? t.stepTitle(t.stepLabel(step.label), asking.label) : ''} confirmLabel={step ? t.stepConfirm(step.kind, step.gold) : ''} busyLabel={t.working} cancelLabel={t.notNow} pending={intents.upgrade.pending} disabled={disabled} onClose={() => { if (!intents.upgrade.pending) setAsking(null) }} onConfirm={async () => { if (!asking || !step || intents.upgrade.pending) return; await intents.upgrade.run({ itemId: asking.id }, t.stepDone(asking.label, t.stepLabel(step.label))); setAsking(null) }}>
      {asking && step ? <Consequences>
        <li>{t.statGoes(statTitle(asking), step.stat.from)}<strong>{step.stat.to}</strong>{t.staysEquipped(asking.affix !== null)}</li>
        <li>{t.spends(mats(step.materials))}</li>
        <li>{t.costs(step.gold)}</li>
        <li>{t.remaining(hero.gold - step.gold)}</li>
      </Consequences> : null}
    </ConfirmSheet>
    <Sheet open={fitting !== null} onClose={() => { if (!intents.chooseAffix.pending) setFitting(null) }} label={t.chooseAnAffix}>
      {fitting ? <>
        <SheetTitle>{t.affixFor(fitting.label)}</SheetTitle>
        <p className="mt-2 text-sm tabular-nums">{t.affixCosts(mats(affixPrice.materials), affixPrice.gold)}</p>
        <ul className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label={t.affix}>
          {rules.affixes.map((affix) => {
            const current = fitting.affix?.id === affix.id
            const picked = affixId === affix.id
            return <li key={affix.id}>
              <button type="button" role="radio" aria-checked={picked} disabled={current} onClick={() => setAffixId(affix.id)} className={`flex w-full flex-col border-2 px-3 py-2 text-left ${picked ? 'border-gold bg-raised' : 'border-edge'} disabled:opacity-60`}>
                <span className="font-semibold">{c.text(affix.name)}{current ? <span className="ml-2 text-sm text-muted">{t.fittedNow}</span> : null}</span>
                <span className="text-sm text-muted">{c.text(affix.blurb)}</span>
              </button>
            </li>
          })}
        </ul>
        {!affixAffordable ? <p className="mt-3 text-sm tabular-nums">{Object.keys(affixShort).length > 0 ? t.needsMore(mats(affixShort)) : t.youHaveGold(hero.gold)}</p> : null}
        <div className="mt-3 empty:hidden"><ErrorNote message={intents.chooseAffix.error ?? null} /></div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button disabled={disabled || !affixAffordable || affixId === null} pending={intents.chooseAffix.pending} busyLabel={t.fitting} onClick={async () => { if (!fitting || affixId === null) return; const name = rules.affixes.find((a) => a.id === affixId)?.name ?? t.theAffix; if (await intents.chooseAffix.run({ itemId: fitting.id, affixId }, t.fitted(name, fitting.label))) setFitting(null) }}>{t.fitFor(affixPrice.gold)}</Button>
          <Button allowOffline variant="secondary" disabled={intents.chooseAffix.pending} onClick={() => setFitting(null)}>{t.cancel}</Button>
        </div>
      </> : null}
    </Sheet>
  </Card>
}


/** Why a step within the hero's level is out of reach: the materials, then the gold. */
function shortText(step: Step, hero: { level: number; gold: number }, materials: readonly Material[], t: T): string {
  if (Object.keys(step.shortfall).length > 0) return t.needsMore(materialsText(step.shortfall, materials, t))
  return t.goldToGo(step.gold - hero.gold)
}

/** A piece's own figure stays neutral; only a comparison takes a colour (green better, red worse). */
function StatOf({ item }: { item: Gear }) {
  const t = useT(dcBagMessages)
  return <span>{t.statOf(statOf(item), t.stat[item.kind])}</span>
}

/** The difference against the equipped piece, signed and coloured by direction. */
function Delta({ delta }: { delta: number }) {
  const t = useT(dcBagMessages)
  return <span className={`font-semibold ${delta > 0 ? 'text-xp-ink' : delta < 0 ? 'text-hp-ink' : 'text-muted'}`}>{delta > 0 ? t.deltaBetter(delta) : delta < 0 ? t.deltaWorse(delta) : t.deltaSame}</span>
}

function ResumeAt() {
  const now = useNow(60_000)
  const t = useT(dcBagMessages)
  const locale = useLocale()
  const at = now === null ? null : formatTime(locale, nextSlotAfter(now))
  return <p>{t.resumingAt(at)}</p>
}
