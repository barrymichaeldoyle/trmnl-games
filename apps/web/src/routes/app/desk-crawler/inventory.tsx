import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { nextSlotAfter } from '@trmnl-games/desk-crawler/sim/schedule'
import { api } from '@trmnl-games/backend/api'
import { HERO_NAME_RULE } from '@trmnl-games/platform'
import type { Id } from '@trmnl-games/backend/data-model'
import { useIntent } from '../../../lib/intent'
import { NameField, nameProblem } from '../../../lib/nameField'
import { GENDERS, GenderPicker, type HeroGender } from '../../../lib/genderPicker'
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
import { WithName } from './-withName'
import { LockedCard } from './-career'

export const Route = createFileRoute('/app/desk-crawler/inventory')({ head: () => seo({ title: 'Bag', index: false }), loader: ({ context }) => preload(context, convexQuery(api.inventory.mine, {}), convexQuery(api.heroes.mine, {})), component: Inventory })

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
const statOf = (item: Gear) => item.kind === 'weapon' ? item.attack : item.defense
const statLabel = (item: Gear) => item.kind === 'weapon' ? 'attack' : 'defense'
const count = (n: number, noun: string) => `${n} ${n === 1 ? noun : `${noun}s`}`
/** The materials several pieces yield together. */
const yieldOf = (items: readonly Gear[]): MaterialCount => items.reduce<Record<string, number>>((total, item) => { for (const [id, n] of Object.entries(item.salvage)) total[id] = (total[id] ?? 0) + n; return total }, {})
/** "6 Scrap and 1 Parts", in the catalog's order; "nothing" for an empty count. */
function materialsText(counts: MaterialCount, materials: readonly Material[]): string {
  const parts = materials.filter((m) => (counts[m.id] ?? 0) > 0).map((m) => `${counts[m.id]} ${m.name}`)
  if (parts.length === 0) return 'nothing'
  return parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
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
  const [mode, setMode] = useState<'browse' | 'sell' | 'salvage'>('browse')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | 'potions' | null>(null)
  const [review, setReview] = useState<Review | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [destination, setDestination] = useState('')
  const { notice, notify: announce, dismiss } = useNotice()
  // Errors inside an open sheet show there; the pinned notice carries the rest (the sheet would hide it).
  const sheetOpen = useRef(false)
  sheetOpen.current = openId !== null || review !== null
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
  const buyBag = useIntent(api.inventory.buyBag, { onFeedback: notify })
  const buyPouch = useIntent(api.inventory.buyPouch, { onFeedback: notify })
  const buyOffer = useIntent(api.inventory.buyOffer, { onFeedback: notify })
  const buyNameTag = useIntent(api.inventory.buyNameTag, { onFeedback: notify })
  const buyMakeover = useIntent(api.inventory.buyMakeover, { onFeedback: notify })
  useEffect(() => {
    if (bag) setSelected((current) => retainSellableSelection(current, bag.gear as Gear[]))
  }, [bag])
  if (!bag || !hero) return <LoadingState label="Loading your bag…" />

  const gear = bag.gear as Gear[]
  const manageable = hero.simulationState !== 'quarantined' && ['exploring', 'resting', 'travelling', 'sleeping'].includes(hero.status)
  const reason = manageable ? null : hero.simulationState === 'quarantined' ? 'Gear changes are paused during a service check.' : hero.status === 'paused' ? 'Adventures are paused. Resume from Hero to change or sell gear.' : 'Gear changes open again once your hero is back on their feet.'
  const held = gear.find((item) => item.held) ?? null
  const sellable = gear.filter((item) => !item.equipped && !item.held)
  const inBag = sellable
  const chosen = sellable.filter((item) => selected.has(item.id))
  const goldOf = (items: Gear[]) => items.reduce((sum, item) => sum + item.saleValue, 0)
  const rareOf = (items: Gear[]) => items.filter((item) => item.rarity === 'rare' || item.rarity === 'epic').length
  const materials = bag.materials as Material[]
  const workbench = bag.workbench as WorkbenchRules | null
  const workbenchLevel = bag.workbenchUnlockLevel as number | null
  const validReview = review === null || saleIsCurrent(review.items, gear)
  const reviewing = review === null ? null : review.kind === 'sell' ? sellMany : salvageMany
  const equippedOf = (kind: Gear['kind']) => gear.find((item) => item.equipped && item.kind === kind) ?? null
  const deltaOf = (item: Gear) => { const current = equippedOf(item.kind); return statOf(item) - (current ? statOf(current) : 0) }
  const busy = equip.pending || unequip.pending || sellMany.pending || salvageMany.pending || upgrade.pending || chooseAffix.pending || combine.pending || claim.pending || resume.pending || buyBag.pending || buyPouch.pending || buyOffer.pending || buyNameTag.pending || buyMakeover.pending
  // D131: the strengths in the pouch and the combine recipe; one row and no recipe under a catalog without strengths.
  const potionRows = bag.potionRows as PotionRow[]
  const potionCombine = bag.potionCombine as Combine | null
  const heldStrengths = potionRows.filter((row) => row.count > 0)
  const healsLine = heldStrengths.length === 0 ? `+${potionRows[0]?.heals ?? 0} HP each` : heldStrengths.length === 1 ? `+${heldStrengths[0]!.heals} HP each` : `+${heldStrengths[0]!.heals} to +${heldStrengths.at(-1)!.heals} HP`
  const full = bag.used >= bag.capacity
  // Quiet warning at 80% of the current bag (D61).
  const filling = bag.used >= Math.ceil(bag.capacity * 0.8)
  // A held find needs a free bag slot to be claimed.
  const claimBlocked = full
  const opened = openId === 'potions' ? null : gear.find((item) => item.id === openId) ?? null
  const slotLabel = (item: Gear) => {
    const delta = deltaOf(item)
    const compare = item.requiredLevel > hero.level ? `requires level ${item.requiredLevel}` : delta > 0 ? `${delta} better than equipped` : delta < 0 ? `${-delta} worse than equipped` : 'same as equipped'
    return `${item.label}, ${item.rarity}, +${statOf(item)} ${statLabel(item)}, ${compare}${item.held ? ', held find' : ''}${item.spareOf ? `, ${item.spareOf.ownerName}'s spare` : ''}`
  }
  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(retainSellableSelection(current, gear))
    if (next.has(id)) next.delete(id)
    else if (next.size < SALE_LIMIT) next.add(id)
    else announce({ error: `${mode === 'salvage' ? 'A salvage' : 'A sale'} holds up to ${SALE_LIMIT} items. ${mode === 'salvage' ? 'Salvage' : 'Sell'} these first, then select more.`, message: null })
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
      ? await sellMany.run({ itemIds: ids }, `Sold ${count(review.items.length, 'item')} for ${goldOf(review.items)} gold.`)
      : await salvageMany.run({ itemIds: ids }, `Salvaged ${count(review.items.length, 'item')} for ${materialsText(yieldOf(review.items), materials)}.`)
    if (done) {
      setReview(null)
      leaveSale()
    }
  }

  const slots = Math.max(bag.capacity, inBag.length)
  const claimMessage = (item: Gear) => `${item.label} is in your bag. Keep one slot free, then resume.`
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Your bag</h1>
        <p className="text-sm tabular-nums text-muted">{bag.ladder.name} · {bag.used} of {bag.capacity} slots</p>
      </header>
      {hero.status === 'sleeping' ? (
        <Card title={hero.wakeAtTick !== null ? 'Resuming next adventure' : held ? 'A find is waiting' : 'Resume adventures'}>
          {held ? <>
            <p><strong>{held.label}</strong> didn’t fit, so adventures stopped. Sell gear to free a slot, claim the find, then keep one slot free to resume.</p>
            <Button className="mt-3" pending={claim.pending} busyLabel="Claiming…" disabled={!manageable || busy || claimBlocked} onClick={() => act(held, claim, {}, claimMessage(held))}>Claim find</Button>
            {claimBlocked ? <p className="mt-2 text-sm">Sell an item or get a bigger bag first.</p> : null}
          </> : hero.wakeAtTick !== null ? <ResumeAt /> : <>
            <p>{bag.canResume ? 'Room for more finds. Resume here, or set out for another unlocked area.' : 'Sell one more item to keep a slot free, then resume.'}</p>
            <label className="mt-4 flex flex-col gap-2 text-sm">
              <span className="font-semibold">Resume in</span>
              <select value={destination} disabled={busy || !manageable} onChange={(event) => setDestination(event.target.value)} className="pixel-select min-h-11 border-2 border-edge pr-9 pl-3 text-base">
                <option value="">{hero.biomes.find((biome: Biome) => biome.id === hero.biomeId)?.name ?? 'Current area'}</option>
                {hero.biomes.filter((biome: Biome) => biome.unlocked && biome.id !== hero.biomeId).map((biome: Biome) => <option key={biome.id} value={biome.id}>{biome.name}</option>)}
              </select>
            </label>
            <Button className="mt-3" pending={resume.pending} busyLabel="Scheduling…" disabled={!manageable || busy || !bag.canResume} onClick={() => resume.run(destination ? { biomeId: destination } : {}, 'Resuming on the next adventure.')}>Resume adventures</Button>
            {destination ? <p className="mt-2 text-sm text-muted">Your hero sets out next adventure and arrives the one after.</p> : null}
          </>}
        </Card>
      ) : null}
      {reason ? <p className="text-sm">{hero.status === 'paused' && hero.simulationState !== 'quarantined' ? <>Adventures are paused. <Link to="/app/desk-crawler" className="underline underline-offset-4">Resume from Hero</Link> to change or sell gear.</> : reason}</p> : null}

      <Card title="Equipped" icon="sword">
        <div className="grid grid-cols-3 gap-2 min-[375px]:gap-3 sm:max-w-sm sm:gap-5">
          {(['weapon', 'armor'] as const).map((kind) => {
            const item = equippedOf(kind)
            return <div key={kind} className="flex min-w-0 flex-col gap-1.5">
              <h3 className="caps text-sm text-muted">{kind === 'weapon' ? 'Weapon' : 'Armor'}</h3>
              {item ? <Slot item={item} label={`${item.label}, equipped ${kind}, +${statOf(item)} ${statLabel(item)}`} busy={busyId === item.id} onClick={() => setOpenId(item.id)} /> : <EmptySlot />}
              <p className="text-sm leading-snug">{item ? <StatOf item={item} /> : <span className="text-muted">Empty</span>}</p>
            </div>
          })}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="caps text-sm text-muted">Potions</h3>
            <PotionSlot count={bag.potions} label={`${count(bag.potions, 'potion')}, ${heldStrengths.map((row) => `${row.count} ${row.name.toLowerCase()}`).join(', ') || 'none'}`} onClick={() => setOpenId('potions')} />
            <p className="text-sm leading-snug tabular-nums">{healsLine}</p>
          </div>
        </div>
      </Card>

      <section aria-labelledby="bag-gear-title" className="window min-w-0 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
        {/* The title stays one line beside either button, so the header holds still when Sell gear becomes Done. */}
        <div className="flex min-h-11 items-center justify-between gap-3">
          {/* The page header already names the bag; this window is its gear. */}
          <h2 id="bag-gear-title" className="flex min-w-0 items-center gap-3 font-display text-xl font-bold sm:text-2xl"><Glyph name="bag" size={24} className="text-gold-ink" /><span className="truncate">Gear</span></h2>
          {mode !== 'browse'
            ? <Button allowOffline variant="secondary" className="w-28 shrink-0 whitespace-nowrap" disabled={busy} onClick={leaveSale}>Done</Button>
            : <div className="flex shrink-0 gap-2">
              <Button allowOffline variant="secondary" className="whitespace-nowrap" icon="tag" disabled={sellable.length === 0} onClick={() => setMode('sell')}>Sell</Button>
              {/* D129: the second way out of the bag, beside Sell. */}
              {workbench ? <Button allowOffline variant="secondary" className="whitespace-nowrap" icon="scrap" disabled={sellable.length === 0} onClick={() => setMode('salvage')}>Salvage</Button> : null}
            </div>}
        </div>
        <p className="mt-1 min-h-5 text-sm text-muted">
          {mode !== 'browse'
            ? <>Tap gear to select it.{sellable.length > chosen.length ? <> <button type="button" className="font-semibold text-ink underline underline-offset-4" onClick={() => setSelected(new Set(sellable.slice(0, SALE_LIMIT).map((item) => item.id)))}>Select all</button></> : null}</>
            : inBag.length === 0 ? 'No spare gear yet. Finds land here.' : full ? 'Bag full. The next find is held, and adventures stop until you make room.' : filling ? `Bag nearly full. ${workbench ? 'Sell or salvage' : 'Sell'} gear you no longer need.` : `Tap a piece to compare, equip${workbench ? ', sell or salvage' : ' or sell'} it.`}
        </p>
        <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
          {held ? <li><Slot item={held} held label={slotLabel(held)} busy={busyId === held.id} onClick={() => setOpenId(held.id)} /></li> : null}
          {inBag.map((item) => <li key={item.id}><Slot item={item} label={slotLabel(item)} selectable={mode !== 'browse'} selected={selected.has(item.id)} upgrade={deltaOf(item) > 0 && item.requiredLevel <= hero.level} downgrade={deltaOf(item) < 0 && item.requiredLevel <= hero.level} lockedLevel={item.requiredLevel > hero.level ? item.requiredLevel : null} busy={busyId === item.id} onClick={() => tap(item)} /></li>)}
          {Array.from({ length: Math.max(0, slots - inBag.length) }, (_, index) => <li key={`empty-${index}`}><EmptySlot /></li>)}
        </ul>
      </section>

      {workbench ? <Workbench rules={workbench} materials={materials} equipped={[equippedOf('weapon'), equippedOf('armor')]} hero={hero} disabled={!manageable || busy} intents={{ upgrade, chooseAffix }} /> : workbenchLevel !== null ? <LockedCard title="Workbench" glyph="components" level={workbenchLevel} blurb="Salvage spare gear for materials, then spend them with gold to improve what your hero wears. Until then, sell spares for gold." /> : null}
      {bag.merchant ? <Merchant visit={bag.merchant} gold={hero.gold} potions={bag.potions} cap={bag.pouch.cap} discountPct={bag.ladder.merchantDiscountPct} disabled={!manageable || busy} intent={buyOffer} /> : null}
      <div className="grid gap-8 sm:grid-cols-2">
        <BagLadder ladder={bag.ladder} capacity={bag.capacity} gold={hero.gold} disabled={!manageable || busy} intent={buyBag} />
        <PotionPouch pouch={bag.pouch} potions={bag.potions} gold={hero.gold} disabled={!manageable || busy} intent={buyPouch} />
        {bag.nameTag ? <NameTag tag={bag.nameTag} heroName={hero.name} gold={hero.gold} disabled={busy} intent={buyNameTag} /> : null}
        {bag.makeover ? <Makeover makeover={bag.makeover} heroName={hero.name} gold={hero.gold} disabled={busy} intent={buyMakeover} /> : null}
      </div>

      {mode !== 'browse' ? <div className="window sticky bottom-0 z-20 -mx-3 px-3 pt-3 min-[375px]:-mx-4 min-[375px]:px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:mx-0">
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="min-w-0 text-sm tabular-nums">{chosen.length === 0 ? 'Nothing selected' : mode === 'sell' ? <>{count(chosen.length, 'item')} for <span className="text-gold-ink">{goldOf(chosen)} gold</span>{rareOf(chosen) > 0 ? `, ${rareOf(chosen)} rare` : ''}</> : <>{count(chosen.length, 'item')} for <span className="text-rare-ink">{materialsText(yieldOf(chosen), materials)}</span></>}</p>
          <Button allowOffline disabled={!manageable || busy || chosen.length === 0} onClick={() => setReview({ kind: mode === 'sell' ? 'sell' : 'salvage', items: chosen })}>{mode === 'sell' ? 'Sell' : 'Salvage'} {chosen.length > 0 ? chosen.length : ''}</Button>
        </div>
      </div> : null}

      <Sheet open={openId === 'potions'} onClose={() => { if (!combine.pending) setOpenId(null) }} label="Potions">
        <SheetTitle>Potions</SheetTitle>
        <p className="mt-2 tabular-nums">You have <strong className="text-rare-ink">{bag.potions}</strong>. Your {bag.pouch.name.toLowerCase()} holds {bag.pouch.cap}.</p>
        {/* D131: one line per strength, weakest first, with what one drink restores for this hero. */}
        <ul aria-label="Potions by strength" className="mt-3 flex flex-col gap-1 tabular-nums">
          {potionRows.map((row) => <li key={row.templateId} className={`flex items-center justify-between gap-3 ${row.count === 0 ? 'text-muted' : ''}`}><span>{row.name} <span className="text-sm text-muted">· {row.healPct}%, +{row.heals} HP</span></span><strong className={row.count === 0 ? '' : 'text-rare-ink'}>{row.count}</strong></li>)}
        </ul>
        <p className="mt-2 text-sm text-muted">Your hero drinks the weakest potion that keeps it adventuring, or you choose one from Hero. Potions take no bag slots.</p>
        {potionCombine ? <div className="mt-4 border-t-2 border-faint pt-3">
          <p className="tabular-nums"><strong>Combine:</strong> {potionCombine.from.count} {potionCombine.from.name.toLowerCase()}s + {materialsText(potionCombine.materials, materials)} → 1 {potionCombine.to.name.toLowerCase()}.</p>
          {potionCombine.batches > 0
            ? <div className="mt-2 flex flex-wrap gap-2">
              <Button disabled={!manageable || busy} pending={combine.pending} busyLabel="Combining…" onClick={() => combine.run({ batches: 1 }, `Combined into a ${potionCombine.to.name.toLowerCase()}.`)}>Combine 1</Button>
              {potionCombine.batches > 1 ? <Button variant="secondary" disabled={!manageable || busy} pending={combine.pending} busyLabel="Combining…" onClick={() => combine.run({ batches: Math.min(10, potionCombine.batches) }, `Combined into ${Math.min(10, potionCombine.batches)} ${potionCombine.to.name.toLowerCase()}s.`)}>Combine {Math.min(10, potionCombine.batches)}</Button> : null}
            </div>
            : <p className="mt-1 text-sm tabular-nums">Needs {[potionCombine.shortfall.potions > 0 ? `${potionCombine.shortfall.potions} more ${potionCombine.from.name.toLowerCase()}${potionCombine.shortfall.potions === 1 ? '' : 's'}` : null, Object.keys(potionCombine.shortfall.materials).length > 0 ? `${materialsText(potionCombine.shortfall.materials, materials)}${potionCombine.shortfall.potions > 0 ? '' : ' more'}` : null].filter(Boolean).join(' and ')}.</p>}
          <ErrorNote message={combine.error ?? null} />
        </div> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to="/app/desk-crawler" className={`${LINK_BUTTON} ${BUTTON_SECONDARY} justify-center`}>Go to Hero</Link>
          <Button allowOffline variant="secondary" onClick={() => setOpenId(null)}>Close</Button>
        </div>
      </Sheet>

      <Sheet open={openId !== null && openId !== 'potions'} onClose={() => setOpenId(null)} label="Gear">
        {opened ? <ItemSheet key={opened.id} item={opened} hero={hero} current={equippedOf(opened.kind)} manageable={manageable} reason={reason} busy={busy} claimBlocked={claimBlocked} intents={{ equip, unequip, claim }} onClose={() => setOpenId(null)} onEquip={() => act(opened, equip, { itemId: opened.id }, `${opened.label} equipped.`)} onUnequip={() => act(opened, unequip, { slot: opened.kind }, `${opened.label} unequipped.`)} onClaim={() => act(opened, claim, {}, claimMessage(opened))} onSell={() => { setOpenId(null); setReview({ kind: 'sell', items: [opened] }) }} onSalvage={workbench ? () => { setOpenId(null); setReview({ kind: 'salvage', items: [opened] }) } : null} materials={materials} /> : <>
          <SheetTitle>Gone from your bag</SheetTitle>
          <p className="mt-2 text-sm">That piece was sold, salvaged or moved from another screen.</p>
          <Button allowOffline variant="secondary" className="mt-4 w-full" onClick={() => setOpenId(null)}>Close</Button>
        </>}
      </Sheet>

      <Sheet open={review !== null} onClose={() => { if (!reviewing?.pending) setReview(null) }} label={review?.kind === 'salvage' ? 'Salvage gear' : 'Sell gear'}>
        {review && reviewing ? <>
          <SheetTitle>{review.kind === 'sell' ? <>Sell {count(review.items.length, 'item')} for <span className="text-gold-ink">{goldOf(review.items)} gold</span>?</> : <>Salvage {count(review.items.length, 'item')} for <span className="text-rare-ink">{materialsText(yieldOf(review.items), materials)}</span>?</>}</SheetTitle>
          <p className="mt-2 text-sm">This cannot be undone.{rareOf(review.items) > 0 ? ` Includes ${count(rareOf(review.items), 'rare item')}.` : ''}{review.kind === 'salvage' ? ' Materials go to the workbench and are never sold.' : ''}</p>
          <ul aria-label={review.kind === 'sell' ? 'Items in this sale' : 'Items to salvage'} className="mt-3 max-h-48 overflow-y-auto border-y-2 border-rule text-sm">{review.items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 border-b border-rule py-1.5 last:border-b-0"><span className={`flex min-w-0 items-center gap-2 font-semibold ${RARITY_TONE[item.rarity] ?? ''}`}><Gem rarity={item.rarity} scale={2} /><span className="truncate">{item.label}</span></span>{review.kind === 'sell' ? <span className="shrink-0 tabular-nums text-gold-ink">{item.saleValue} gold</span> : <span className="shrink-0 tabular-nums text-rare-ink">{materialsText(item.salvage, materials)}</span>}</li>)}</ul>
          {!validReview ? <p role="alert" className="mt-3 text-sm font-semibold">Your gear changed. Close this and select the items again.</p> : null}
          {!manageable && reason ? <p className="mt-3 text-sm">{reason}</p> : null}
          <div className="mt-3 empty:hidden"><ErrorNote message={reviewing.error} /></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button disabled={!manageable || busy || !validReview} pending={reviewing.pending} busyLabel={review.kind === 'sell' ? 'Selling…' : 'Salvaging…'} onClick={confirmReview}>Confirm</Button>
            <Button allowOffline variant="secondary" disabled={reviewing.pending} onClick={() => setReview(null)}>Cancel</Button>
          </div>
        </> : null}
      </Sheet>

      <NoticeBar notice={notice} lifted={mode !== 'browse'} onDismiss={dismiss} />
    </div>
  )
}

/** One piece: its icon, stats against the equipped piece, affix and sale value, then the actions open to it. */
function ItemSheet({ item, hero, current, manageable, reason, busy, claimBlocked, intents, onClose, onEquip, onUnequip, onClaim, onSell, onSalvage, materials }: {
  item: Gear
  hero: { level: number }
  current: Gear | null
  manageable: boolean
  reason: string | null
  busy: boolean
  claimBlocked: boolean
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
  return <>
    <div className="flex items-start gap-3">
      <div className="w-16 shrink-0"><SlotPreview item={item} /></div>
      <div className="min-w-0 flex-1">
        <SheetTitle><span className={RARITY_TONE[item.rarity] ?? ''}>{item.label}</span></SheetTitle>
        <p className="mt-1 text-sm text-muted">{item.rarity} {item.kind}, level {item.requiredLevel}{item.equipped ? ', equipped' : item.held ? ', held find' : ''}</p>
      </div>
    </div>
    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      <dt className="caps text-muted">{statLabel(item)}</dt>
      <dd className="tabular-nums"><StatOf item={item} />{!item.equipped ? <Delta delta={delta} /> : null}</dd>
      {!item.equipped ? <><dt className="caps text-muted">Equipped</dt><dd className="tabular-nums">{current ? <>{current.label}, <StatOf item={current} /></> : <span className="text-muted">Nothing</span>}</dd></> : null}
      {item.affix ? <><dt className="caps text-muted">{item.affix.name}</dt><dd>{item.affix.blurb}</dd></> : null}
      {item.spareOf ? <><dt className="caps text-muted">Name on it</dt><dd><WithName text="{name}, in marker. Found in lost property." name={item.spareOf.ownerName} profile={item.spareOf.profile} /></dd></> : null}
      <dt className="caps text-muted">Sells for</dt>
      <dd className="tabular-nums text-gold-ink">{item.saleValue} gold</dd>
      {onSalvage ? <><dt className="caps text-muted">Salvages for</dt><dd className="tabular-nums text-rare-ink">{materialsText(item.salvage, materials)}</dd></> : null}
    </dl>
    {!manageable && reason ? <p className="mt-3 text-sm">{reason}</p> : item.held && claimBlocked ? <p className="mt-3 text-sm">Sell an item or get a bigger bag to claim this find.</p> : !item.equipped && !item.held && !canEquip ? <p className="mt-3 text-sm">Your hero can wear this from level {item.requiredLevel}. It can still be sold.</p> : null}
    <div className="mt-3 empty:hidden"><ErrorNote message={error} /></div>
    {confirming ? (
      <div className="mt-4 flex flex-col gap-3">
        <Consequences>
          {confirming === 'unequip'
            ? <li>Your hero fights without a {item.kind} until you equip another, so its {statLabel(item)} drops by <strong>{statOf(item)}</strong>. The {item.label} goes into your bag.</li>
            : <li>The {item.label} has <strong>{Math.abs(delta)} less {statLabel(item)}</strong> than your {current?.label}, so your hero fights a little worse. The {current?.label} goes into your bag.</li>}
          <li>You can change it back any time on this page.</li>
        </Consequences>
        <ConfirmButtons
          confirmLabel={confirming === 'unequip' ? 'Unequip' : 'Equip anyway'}
          busyLabel={confirming === 'unequip' ? 'Removing…' : 'Equipping…'}
          cancelLabel="Keep it on"
          pending={confirming === 'unequip' ? intents.unequip.pending : intents.equip.pending}
          disabled={!manageable || busy}
          onConfirm={confirming === 'unequip' ? onUnequip : onEquip}
          onCancel={() => setConfirming(null)}
        />
      </div>
    ) : <div className="mt-4 grid grid-cols-2 gap-2">
      {item.equipped
        ? <Button variant="secondary" disabled={!manageable || busy} pending={intents.unequip.pending} busyLabel="Removing…" onClick={() => setConfirming('unequip')}>Unequip</Button>
        : item.held
          ? <Button disabled={!manageable || busy || claimBlocked} pending={intents.claim.pending} busyLabel="Claiming…" onClick={onClaim}>Claim find</Button>
          : <>
            <Button variant={delta > 0 && canEquip ? 'primary' : 'secondary'} disabled={!manageable || busy || !canEquip} pending={intents.equip.pending} busyLabel="Equipping…" onClick={() => (weaker ? setConfirming('equip') : onEquip())}>Equip</Button>
            <Button allowOffline variant="secondary" disabled={!manageable || busy} onClick={onSell}>Sell</Button>
            {onSalvage ? <Button allowOffline variant="secondary" icon="scrap" disabled={!manageable || busy} onClick={onSalvage}>Salvage</Button> : null}
          </>}
      <Button allowOffline variant="quiet" className={item.equipped || item.held || onSalvage ? '' : 'col-span-2'} disabled={busy} onClick={onClose}>Close</Button>
    </div>}
  </>
}

type Ladder = {
  name: string
  findable: boolean
  merchantDiscountPct: number
  next: { id: string; name: string; capacity: number; price: number | null; milestoneLevel: number | null; milestoneAdventures: number | null; buyable: boolean; lockedUntilLevel: number | null } | null
}
type Pouch = { name: string; cap: number; findable: boolean; merchantDiscountPct: number; next: { id: string; name: string; cap: number; price: number | null; milestoneLevel: number | null; buyable: boolean; lockedUntilLevel: number | null } | null }

/**
 * How the next rung arrives (D61/D122): a milestone tier names its level or adventure count and the early routes;
 * a shop tier is bought here, or from the merchant at a discount.
 */
function howToGet(milestone: string | null, findable: boolean, discount: number): string {
  if (milestone !== null) {
    const early = [findable ? 'your hero finds one' : null, 'the merchant has one'].filter((route) => route !== null)
    return `Yours ${milestone}, or sooner if ${early.join(' or ')}.`
  }
  return discount > 0 ? `Buy it here whenever you have the gold, or from a wandering merchant at ${discount}% off.` : 'Buy it here whenever you have the gold.'
}
type Offer = { id: 'potions' | 'pouch' | 'bag'; name: string; quantity: number; price: number; tierId?: string }
type Visit = { offers: Offer[]; expiresAtTick: number; ticksLeft: number; biomeId: string }
type PurchaseIntent<A> = { pending: boolean; error?: string | null; run: (args: A, message?: string) => Promise<boolean> }

/** D77/D122: the potion pouch, its next tier and how to get it, beside the bag ladder. */
function PotionPouch({ pouch, potions, gold, disabled, intent }: { pouch: Pouch; potions: number; gold: number; disabled: boolean; intent: PurchaseIntent<{ tierId: string }> }) {
  const next = pouch.next
  const affordable = next?.price != null && gold >= next.price
  const [asking, setAsking] = useState(false)
  return <Card title={pouch.name} icon="potion">
    <p className="tabular-nums">Holds <strong>{pouch.cap}</strong> potions. You have <strong>{potions}</strong>.</p>
    {next ? <>
      <p className="mt-3"><strong>Next: {next.name}</strong>, {next.cap} potions</p>
      <p className="mt-1 text-sm text-muted">{howToGet(next.milestoneLevel !== null ? `at level ${next.milestoneLevel}` : null, pouch.findable, pouch.merchantDiscountPct)}</p>
      {next.price !== null ? next.buyable ? <>
        <Button className="mt-3" variant={affordable ? 'primary' : 'secondary'} disabled={disabled || !affordable} pending={intent.pending} icon="coin" busyLabel="Buying…" onClick={() => setAsking(true)}>Buy for {next.price} gold</Button>
        <BuySheet open={asking} title={`Buy the ${next.name}?`} price={next.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={() => intent.run({ tierId: next.id }, `${next.name} bought. It holds ${next.cap} potions.`)}>
          <li>Holds {next.cap} potions instead of {pouch.cap}.</li>
        </BuySheet>
        {!affordable ? <p className="mt-2 text-sm tabular-nums">You have <span className="text-gold-ink">{gold} gold</span>.</p> : null}
      </> : <p className="mt-2 text-sm">{next.lockedUntilLevel !== null ? `You can buy it from level ${next.lockedUntilLevel}.` : 'You can buy it after your next pouch milestone.'}</p> : null}
    </> : <p className="mt-3 text-sm text-muted">This is the biggest pouch for now.</p>}
  </Card>
}

/** D78: the visiting merchant's offers, each sold once, open for a few adventures. */
function Merchant({ visit, gold, potions, cap, discountPct, disabled, intent }: { visit: Visit; gold: number; potions: number; cap: number; discountPct: number; disabled: boolean; intent: PurchaseIntent<{ offerId: Offer['id'] }> }) {
  const [asking, setAsking] = useState<Offer | null>(null)
  return <Card title="Wandering Merchant" icon="merchant">
    <p className="text-sm">Leaves in {visit.ticksLeft === 1 ? 'one adventure' : `${visit.ticksLeft} adventures`}. Each offer sells once.</p>
    <ul className="mt-3 flex flex-col gap-3">
      {visit.offers.map((offer) => {
        const affordable = gold >= offer.price
        const overflow = offer.id === 'potions' && potions + offer.quantity > cap
        // D122: a bag or pouch offer undercuts the Bag page, and the card says so.
        const deal = offer.id !== 'potions' && discountPct > 0
        return <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-faint pt-3 first:border-t-0 first:pt-0">
          <span><strong>{offer.name}</strong>{deal ? <span className="block text-sm text-muted">{discountPct}% off the Bag page price.</span> : null}{overflow ? <span className="block text-sm text-muted">Your pouch holds {cap}; make room first.</span> : null}</span>
          <Button variant={affordable && !overflow ? 'primary' : 'secondary'} disabled={disabled || !affordable || overflow} pending={intent.pending} icon="coin" busyLabel="Buying…" onClick={() => setAsking(offer)}>Buy for {offer.price} gold</Button>
        </li>
      })}
    </ul>
    {visit.offers.some((offer) => gold < offer.price) ? <p className="mt-2 text-sm tabular-nums">You have <span className="text-gold-ink">{gold} gold</span>.</p> : null}
    <BuySheet open={asking !== null} title={asking ? `Buy ${asking.name}?` : ''} price={asking?.price ?? 0} gold={gold} pending={intent.pending} onClose={() => setAsking(null)} onConfirm={() => (asking ? intent.run({ offerId: asking.id }, `${asking.name} bought.`) : Promise.resolve(false))}>
      <li>The merchant sells each offer once.</li>
    </BuySheet>
  </Card>
}

/** Every purchase asks first: a stray tap only opens this sheet, which says what changes and the gold left. */
function BuySheet({ open, title, price, gold, pending, onConfirm, onClose, children }: { open: boolean; title: string; price: number; gold: number; pending: boolean; onConfirm: () => Promise<boolean>; onClose: () => void; children: ReactNode }) {
  return (
    <ConfirmSheet open={open} title={title} confirmLabel={`Buy for ${price} gold`} busyLabel="Buying…" cancelLabel="Cancel" pending={pending} onClose={onClose} onConfirm={async () => { if (pending) return; await onConfirm(); onClose() }}>
      <Consequences>
        {children}
        <li>Costs {price} gold, leaving you {gold - price}.</li>
      </Consequences>
    </ConfirmSheet>
  )
}

/** D142: one "Hi, my name is" name tag in stock a day; buying it renames the current hero. */
function NameTag({ tag, heroName, gold, disabled, intent }: { tag: { price: number; inStockAt: number | null }; heroName: string; gold: number; disabled: boolean; intent: PurchaseIntent<{ name: string }> }) {
  const [name, setName] = useState('')
  const [asking, setAsking] = useState(false)
  const inStock = tag.inStockAt === null || tag.inStockAt <= Date.now()
  const affordable = gold >= tag.price
  const valid = nameProblem(name, HERO_NAME_RULE, 'hero name') === null && name.trim() !== heroName
  return <Card title="Name tag" icon="tag">
    <p>A fresh “Hi, my name is” sticker. Your hero goes by the name you write on it, on your TRMNL, the leaderboard and your hero page.</p>
    {inStock ? <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); if (valid && affordable) setAsking(true) }}>
      <NameField label={`New name for ${heroName}`} small rule={HERO_NAME_RULE} noun="hero name" value={name} onChange={setName} disabled={intent.pending} />
      <Button type="submit" variant={affordable ? 'primary' : 'secondary'} disabled={disabled || !valid || !affordable} pending={intent.pending} icon="coin" busyLabel="Buying…">Buy for {tag.price} gold</Button>
      <p className="text-sm text-muted">One in stock a day.{!affordable ? <> You have <span className="text-gold-ink tabular-nums">{gold} gold</span>.</> : null}</p>
    </form> : <p className="mt-3 text-sm text-muted">Today's tag is sold. The next one is in stock {new Date(tag.inStockAt!).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.</p>}
    <BuySheet open={asking} title={`Rename ${heroName} to ${name.trim()}?`} price={tag.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={async () => { const done = await intent.run({ name: name.trim() }, `Hi, my name is ${name.trim()}.`); if (done) setName(''); return done }}>
      <li>{heroName} goes by {name.trim()} from now on. Level, gear and rank stay the same.</li>
      <li>The next name tag is in stock tomorrow.</li>
    </BuySheet>
  </Card>
}

/** D149: a makeover switches the current hero's gender for gold, any time. Purely cosmetic. */
function Makeover({ makeover, heroName, gold, disabled, intent }: { makeover: { price: number; gender: HeroGender }; heroName: string; gold: number; disabled: boolean; intent: PurchaseIntent<{ gender: HeroGender }> }) {
  const [gender, setGender] = useState<HeroGender>(makeover.gender)
  const [asking, setAsking] = useState(false)
  useEffect(() => setGender(makeover.gender), [makeover.gender])
  const affordable = gold >= makeover.price
  const changed = gender !== makeover.gender
  const label = GENDERS.find((option) => option.id === gender)!.label.toLowerCase()
  return <Card title="Makeover" icon="hero">
    <p>A new look for {heroName}, on your TRMNL, your hero page and other players' meetings.</p>
    <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); if (changed && affordable) setAsking(true) }}>
      <GenderPicker small value={gender} onChange={setGender} disabled={intent.pending} />
      <Button type="submit" variant={affordable ? 'primary' : 'secondary'} disabled={disabled || !changed || !affordable} pending={intent.pending} icon="coin" busyLabel="Buying…">Buy for {makeover.price} gold</Button>
      {!affordable ? <p className="text-sm text-muted">You have <span className="text-gold-ink tabular-nums">{gold} gold</span>.</p> : null}
    </form>
    <BuySheet open={asking} title={`Make ${heroName} ${label}?`} price={makeover.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={async () => await intent.run({ gender }, `${heroName} is back with a new look.`)}>
      <li>Only the look changes. Level, gear, stats and rank stay the same.</li>
      <li>You can change it back any time for another {makeover.price} gold.</li>
    </BuySheet>
  </Card>
}

/** D61/D122: the current bag, the next one and how to get it. */
function BagLadder({ ladder, capacity, gold, disabled, intent }: { ladder: Ladder; capacity: number; gold: number; disabled: boolean; intent: PurchaseIntent<{ tierId: string }> }) {
  const next = ladder.next
  const affordable = next?.price != null && gold >= next.price
  const [asking, setAsking] = useState(false)
  return <Card title="Bigger bags" icon="bag">
    <p className="tabular-nums">Your <strong>{ladder.name}</strong> holds <strong>{capacity}</strong> pieces of gear. Equipped gear and potions don’t take up space.</p>
    {next ? <>
      <p className="mt-3"><strong>Next: {next.name}</strong>, {next.capacity} slots</p>
      <p className="mt-1 text-sm text-muted">{howToGet(next.milestoneAdventures !== null ? `after ${next.milestoneAdventures} adventures` : next.milestoneLevel !== null ? `at level ${next.milestoneLevel}` : null, ladder.findable, ladder.merchantDiscountPct)}</p>
      {next.price !== null ? next.buyable ? <>
        <Button className="mt-3" variant={affordable ? 'primary' : 'secondary'} disabled={disabled || !affordable} pending={intent.pending} icon="coin" busyLabel="Buying…" onClick={() => setAsking(true)}>Buy for {next.price} gold</Button>
        <BuySheet open={asking} title={`Buy the ${next.name}?`} price={next.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={() => intent.run({ tierId: next.id }, `${next.name} bought. It holds ${next.capacity}.`)}>
          <li>Holds {next.capacity} pieces of gear instead of {capacity}.</li>
        </BuySheet>
        {!affordable ? <p className="mt-2 text-sm tabular-nums">You have <span className="text-gold-ink">{gold} gold</span>.</p> : null}
      </> : <p className="mt-2 text-sm">{next.lockedUntilLevel !== null ? `You can buy it from level ${next.lockedUntilLevel}.` : 'You can buy it after your next bag milestone.'}</p> : null}
    </> : <p className="mt-3 text-sm text-muted">This is the biggest bag for now.</p>}
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
  return <Card title="Workbench" icon="components">
    <p className="text-sm">Salvaged gear becomes materials. Spend them, with gold, to improve what your hero wears. Materials never sell and take no bag space.</p>
    <ul aria-label="Materials" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
      {materials.map((m) => <li key={m.id} className="flex items-center gap-1.5"><Glyph name={m.glyph as 'scrap'} size={16} className="text-rare-ink" /><strong>{m.count}</strong> {m.name}</li>)}
    </ul>
    <ul className="mt-4 flex flex-col gap-4">
      {(['weapon', 'armor'] as const).map((kind, index) => {
        const item = equipped[index] ?? null
        const next = item?.nextStep ?? null
        return <li key={kind} className="border-t-2 border-faint pt-3">
          <h3 className="caps text-sm text-muted">{kind === 'weapon' ? 'Weapon' : 'Armor'}</h3>
          {item === null ? <p className="mt-1 text-sm text-muted">Nothing equipped. Equip a {kind} to work on it.</p> : <>
            <p className={`mt-1 font-semibold ${RARITY_TONE[item.rarity] ?? ''}`}>{item.label}</p>
            {next ? <>
              <p className="mt-1 text-sm tabular-nums">{next.label}: {priceText(next, materials)}. {statLabel(item).charAt(0).toUpperCase() + statLabel(item).slice(1)} {next.stat.from} → <strong>{next.stat.to}</strong>.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant={next.affordable ? 'primary' : 'secondary'} disabled={disabled || !next.affordable} pending={intents.upgrade.pending && asking?.id === item.id} busyLabel="Working…" onClick={() => setAsking(item)}>{next.kind === 'tier' ? 'Upgrade' : 'Reinforce'}</Button>
                {item.affixable ? <Button variant="secondary" disabled={disabled} onClick={() => { setAffixId(null); setFitting(item) }}>Choose affix</Button> : null}
              </div>
              {!next.affordable ? <p className="mt-2 text-sm tabular-nums">{shortText(next, hero, materials)}</p> : null}
            </> : <>
              <p className="mt-1 text-sm text-muted">Fully reinforced.</p>
              {item.affixable ? <Button className="mt-2" variant="secondary" disabled={disabled} onClick={() => { setAffixId(null); setFitting(item) }}>Choose affix</Button> : null}
            </>}
          </>}
        </li>
      })}
    </ul>
    <ConfirmSheet open={asking !== null && step !== null} title={asking && step ? `${step.label} on the ${asking.label}?` : ''} confirmLabel={step ? `${step.kind === 'tier' ? 'Upgrade' : 'Reinforce'} for ${step.gold} gold` : ''} busyLabel="Working…" cancelLabel="Not now" pending={intents.upgrade.pending} disabled={disabled} onClose={() => { if (!intents.upgrade.pending) setAsking(null) }} onConfirm={async () => { if (!asking || !step || intents.upgrade.pending) return; await intents.upgrade.run({ itemId: asking.id }, `${asking.label}: ${step.label.toLowerCase()}.`); setAsking(null) }}>
      {asking && step ? <Consequences>
        <li>{statLabel(asking).charAt(0).toUpperCase() + statLabel(asking).slice(1)} goes from {step.stat.from} to <strong>{step.stat.to}</strong>. The piece stays equipped and keeps its name{asking.affix ? ' and trait' : ''}.</li>
        <li>Spends {materialsText(step.materials, materials)}.</li>
        <li>Costs {step.gold} gold, leaving you {hero.gold - step.gold}.</li>
        <li>Salvaging it later still pays what it was found at, not what was spent.</li>
      </Consequences> : null}
    </ConfirmSheet>
    <Sheet open={fitting !== null} onClose={() => { if (!intents.chooseAffix.pending) setFitting(null) }} label="Choose an affix">
      {fitting ? <>
        <SheetTitle>Choose an affix for the {fitting.label}</SheetTitle>
        <p className="mt-2 text-sm tabular-nums">Costs {materialsText(affixPrice.materials, materials)} and {affixPrice.gold} gold. The old trait is replaced; nothing else changes.</p>
        <ul className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label="Affix">
          {rules.affixes.map((affix) => {
            const current = fitting.affix?.id === affix.id
            const picked = affixId === affix.id
            return <li key={affix.id}>
              <button type="button" role="radio" aria-checked={picked} disabled={current} onClick={() => setAffixId(affix.id)} className={`flex w-full flex-col border-2 px-3 py-2 text-left ${picked ? 'border-gold bg-raised' : 'border-edge'} disabled:opacity-60`}>
                <span className="font-semibold">{affix.name}{current ? <span className="ml-2 text-sm text-muted">fitted now</span> : null}</span>
                <span className="text-sm text-muted">{affix.blurb}</span>
              </button>
            </li>
          })}
        </ul>
        {!affixAffordable ? <p className="mt-3 text-sm tabular-nums">{Object.keys(affixShort).length > 0 ? `Needs ${materialsText(affixShort, materials)} more.` : `You have ${hero.gold} gold.`}</p> : null}
        <div className="mt-3 empty:hidden"><ErrorNote message={intents.chooseAffix.error ?? null} /></div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button disabled={disabled || !affixAffordable || affixId === null} pending={intents.chooseAffix.pending} busyLabel="Fitting…" onClick={async () => { if (!fitting || affixId === null) return; const name = rules.affixes.find((a) => a.id === affixId)?.name ?? 'the affix'; if (await intents.chooseAffix.run({ itemId: fitting.id, affixId }, `${name} fitted to the ${fitting.label}.`)) setFitting(null) }}>Fit for {affixPrice.gold} gold</Button>
          <Button allowOffline variant="secondary" disabled={intents.chooseAffix.pending} onClick={() => setFitting(null)}>Cancel</Button>
        </div>
      </> : null}
    </Sheet>
  </Card>
}

/** "6 Scrap and 4 Parts + 500 gold". */
const priceText = (step: Step, materials: readonly Material[]) => `${materialsText(step.materials, materials)} + ${step.gold} gold`

/** Why the step is out of reach, one reason at a time: the level, then the materials, then the gold. */
function shortText(step: Step, hero: { level: number; gold: number }, materials: readonly Material[]): string {
  if (step.requiredLevel > hero.level) return `${step.label.replace('Upgrade to ', '')} needs level ${step.requiredLevel}.`
  if (Object.keys(step.shortfall).length > 0) return `Needs ${materialsText(step.shortfall, materials)} more.`
  return `You have ${hero.gold} gold.`
}

/** A piece's own figure stays neutral; only a comparison takes a colour (green better, red worse). */
function StatOf({ item }: { item: Gear }) {
  return <span>+{statOf(item)} {statLabel(item)}</span>
}

/** The difference against the equipped piece, signed and coloured by direction. */
function Delta({ delta }: { delta: number }) {
  return <span className={`font-semibold ${delta > 0 ? 'text-xp-ink' : delta < 0 ? 'text-hp-ink' : 'text-muted'}`}>{delta > 0 ? ` (+${delta} better)` : delta < 0 ? ` (${delta} worse)` : ' (same)'}</span>
}

function ResumeAt() {
  const now = useNow(60_000)
  const at = now === null ? null : new Date(nextSlotAfter(now)).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return <p>Resuming at {at ?? 'the next adventure'}, or the first adventure after that if updates run late.</p>
}
