import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { formatWeight, type Dock } from '../../../lib/idleAngler'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { ConfirmSheet } from '../desk-crawler/-confirm'
import { Coins, Price } from './-coins'
import { FishList, WaterName, baitCatches } from './-fish'
import { Rows } from './-rows'
import { seo } from '../../../lib/seo'

/** The tackle shop: the next rod and cooler, the passes on sale and bait tubs, each at a fixed price and confirmed before buying. */
export const Route = createFileRoute('/app/idle-angler/shop')({
  head: () => seo({ title: 'Tackle shop · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {}), convexQuery(api.idleAngler.anglers.logbook, {})),
  component: ShopPage,
})

const WATER_NAME: Record<string, string> = { river_bend: 'River Bend', harbour_pier: 'the Harbour Pier', heron_lake: 'Heron Lake', frozen_tarn: 'Frozen Tarn' }

/** A purchase waiting for its confirmation: a stray tap only opens the sheet. Rows say what changes, as label and value. */
type Offer = { title: string; price: number; rows: ReadonlyArray<readonly [string, ReactNode]>; buy: () => Promise<boolean> }

function ShopPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const dock = data as Dock | undefined
  const { data: book } = useQuery(convexQuery(api.idleAngler.anglers.logbook, {}))
  // Fish are named only once caught, as in the logbook.
  const seen = new Set((book as Array<{ species: Array<{ id: string; seen: boolean }> }> | null | undefined)?.flatMap((w) => w.species).filter((f) => f.seen).map((f) => f.id))
  const { notice, notify, dismiss } = useNotice()
  const rod = useIntent(api.idleAngler.anglers.buyNextRod, { onFeedback: notify })
  const cooler = useIntent(api.idleAngler.anglers.buyNextCooler, { onFeedback: notify })
  const access = useIntent(api.idleAngler.anglers.buyAccessItem, { onFeedback: notify })
  const bait = useIntent(api.idleAngler.anglers.buyBaitTubs, { onFeedback: notify })
  const charter = useIntent(api.idleAngler.full.buyCharterTicket, { onFeedback: notify })
  const [offer, setOffer] = useState<Offer | null>(null)
  const angler = dock?.angler
  if (!dock || !angler || !dock.shop) return null
  const gold = angler.gold
  const buying = rod.pending || cooler.pending || access.pending || bait.pending || charter.pending
  const full = dock.full ?? null
  // D157 for Idle Angler (D162): upgrades stay out of sight until the logbook opens them.
  const upgradesOpen = !full || full.features.shop_upgrades
  const sea = dock.waters?.find((w) => w.charter)
  const seaKnown = sea?.opensAfter ? sea.opensAfter.logged >= sea.opensAfter.species : false
  // D156/D167: an affordable purchase is a Buy button with its price; one the angler cannot pay yet is its price and what is still to go.
  const buy = (price: number, open: () => void) => (gold >= price
    ? <Button className="inline-flex items-center justify-center gap-2" disabled={buying} onClick={open}>Buy <Coins n={price} /></Button>
    : <Price price={price} gold={gold} />)
  const gateOf = (water: string) => dock.waters?.find((w) => w.id === water)?.opensAfter ?? null
  const nextRod = dock.shop.rod
  const nextCooler = dock.shop.cooler
  // Bait for waters the angler can fish comes first; the rest waits under its own heading.
  const openWaters = new Set(dock.waters?.filter((w) => w.open).map((w) => w.id))
  // Deadbait comes from the cooler, never a tub.
  const usableBait = angler.bait.filter((b) => b.class !== 'deadbait' && dock.waters?.some((w) => openWaters.has(w.id) && w.baits.includes(b.class)))
  const laterBait = angler.bait.filter((b) => b.class !== 'deadbait' && !usableBait.includes(b))
  const baitRow = (b: (typeof angler.bait)[number]) => {
    const waters = dock.waters?.filter((w) => w.baits.includes(b.class)).map((w) => w.name) ?? []
    const catches = baitCatches(b.class, seen)
    return (
      <li key={b.class} className="flex flex-col gap-2 border-b border-rule pb-4 last:border-b-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-semibold">{b.name}</p>
          <p className="text-sm text-muted">{b.units} held</p>
        </div>
        <Rows rows={[
          ['Waters', waters.join(', ')],
          ...(catches.only.ids.length + catches.only.unseen > 0 ? [['Only bait for', <FishList {...catches.only} />] as const] : []),
          ...(catches.also.ids.length + catches.also.unseen > 0 ? [['Also catches', <FishList {...catches.also} />] as const] : []),
          ['Tub', <span className="inline-flex flex-wrap items-center gap-x-2">{b.tubSize} for <Coins n={b.price} /></span>],
        ]} />
        {/* Each button says what it adds and costs; a size the angler cannot pay for yet is left out. */}
        <div className="flex flex-wrap items-center gap-2">
          {[1, 3].filter((n) => n <= b.tubsThatFit && gold >= b.price * n).map((n) => (
            <Button key={n} variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={buying} onClick={() => setOffer({ title: `Buy ${b.tubSize * n} ${b.name.toLowerCase()}?`, price: b.price * n, rows: [['You get', `+${b.tubSize * n}`], ['You will hold', `${b.units + b.tubSize * n} (now ${b.units})`]], buy: () => bait.run({ bait: b.class as never, tubs: n }, `Bought ${b.tubSize * n} ${b.name.toLowerCase()}.`) })}>
              +{b.tubSize * n} <Coins n={b.price * n} />
            </Button>
          ))}
          {b.tubsThatFit === 0 ? <span className="text-sm text-muted">Full: no room for another tub</span> : gold < b.price ? <Price price={b.price} gold={gold} /> : null}
        </div>
      </li>
    )
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Tackle shop</h1>
        <Coins n={gold} className="text-sm font-semibold text-gold-ink" />
      </div>

      {!upgradesOpen ? <Card title="Rods and coolers"><p>Better rods and bigger coolers arrive once {full?.comingUp?.feature === 'shop_upgrades' ? full.comingUp.species : 2} species are in your logbook.</p></Card> : null}
      {upgradesOpen ? <Card title="Rod">
        <Rows rows={[
          ['Yours', <><strong>{angler.rod.name}</strong>, lands up to {formatWeight(angler.rod.limitGrams)}</>],
          nextRod ? ['Next', <><strong>{nextRod.name}</strong>, lands up to {formatWeight(nextRod.limitGrams)}, +{nextRod.biteBonusPercent}% bite chance</>] : null,
        ]} />
        <p className="mt-2 text-sm text-muted">A fish heavier than your rod can land gets away.</p>
        {nextRod ? (
          <>
            <div className="mt-3">
              {buy(nextRod.price, () => setOffer({ title: `Buy the ${nextRod.name}?`, price: nextRod.price, rows: [['Replaces', `the ${angler.rod.name}`], ['Lands up to', `${formatWeight(nextRod.limitGrams)} (now ${formatWeight(angler.rod.limitGrams)})`], ['Bite chance', `+${nextRod.biteBonusPercent}% over the Cane Rod`]], buy: () => rod.run({}, `Bought the ${nextRod.name}.`) }))}
            </div>
          </>
        ) : <p className="mt-2 text-sm text-muted">This is the best rod.</p>}
      </Card> : null}

      {upgradesOpen ? <Card title="Cooler">
        <Rows rows={[
          ['Yours', <><strong>{angler.cooler.name}</strong>, holds {angler.cooler.capacity} fish</>],
          nextCooler ? ['Next', <><strong>{nextCooler.name}</strong>, holds {nextCooler.capacity} fish</>] : null,
        ]} />
        <p className="mt-2 text-sm text-muted">When the cooler is full, new catches are released and earn no coins.</p>
        {nextCooler ? (
          <>
            <div className="mt-3">
              {buy(nextCooler.price, () => setOffer({ title: `Buy the ${nextCooler.name}?`, price: nextCooler.price, rows: [['Replaces', `the ${angler.cooler.name}`], ['Holds', `${nextCooler.capacity} fish (now ${angler.cooler.capacity})`], ['Your catch', 'Moves into the new cooler']], buy: () => cooler.run({}, `Bought the ${nextCooler.name}.`) }))}
            </div>
          </>
        ) : <p className="mt-2 text-sm text-muted">This is the biggest cooler.</p>}
      </Card> : null}

      {full?.charter && seaKnown ? (
        <Card title="Deep-sea charter">
          <Rows rows={[['Ticket', <span className="inline-flex flex-wrap items-center gap-x-2">{full.charter.casts} casts at sea for <Coins n={full.charter.price} /></span>], ['On your ticket', `${full.charter.castsLeft} casts`], ['Leaves from', 'The Harbour Pier, and sails back there when the ticket runs out']]} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {full.charter.castsLeft > 0 ? <span className="text-sm text-muted">Casts left on a ticket stay for the next trip. Head out from the Dock.</span> : (
              buy(full.charter.price, () => setOffer({ title: 'Book a charter ticket?', price: full.charter!.price, rows: [['You get', `${full.charter!.casts} casts at sea`], ['Then', 'Fish the charter from the Dock']], buy: () => charter.run({}, `Booked a charter for ${full.charter!.casts} casts.`) }))
            )}
          </div>
        </Card>
      ) : null}

      <Card title="Passes">
        <ul className="flex flex-col gap-3">
          {dock.shop.access.map((item) => {
            const water = WATER_NAME[item.water] ?? item.water
            const gate = gateOf(item.water)
            const missing = gate ? Math.max(0, gate.species - gate.logged) : 0
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="font-semibold">{item.name}</p>
                  {/* Once the logbook has the species the water needs, say so instead of restating the requirement. */}
                  <p className="text-sm text-muted">Lets you fish <WaterName id={item.water}>{water}</WaterName>{!gate ? '.' : missing > 0
                    ? <> once {gate.species} <WaterName id={gate.waterId}>{gate.waterName}</WaterName> species are in your logbook ({gate.logged} so far).</>
                    : <>. Your logbook has the {gate.species} <WaterName id={gate.waterId}>{gate.waterName}</WaterName> species it needs.</>}</p>
                </div>
                {item.owned ? <span className="text-sm font-semibold text-xp-ink">Owned</span> : buy(item.price, () => setOffer({ title: `Buy the ${item.name}?`, price: item.price, rows: [['Opens', water[0]!.toUpperCase() + water.slice(1)], ['Fish there', gate && missing > 0 ? `After ${missing} more ${gate.waterName} species` : 'Straight away']], buy: () => access.run({ access: item.id }, `Bought the ${item.name}.`) }))}
              </li>
            )
          })}
        </ul>
        {/* Issue #7: later passes stay a surprise until their water's way in can be fished. */}
        {dock.shop.moreAccess ? <p className="mt-3 text-sm text-muted">More passes appear as you open new waters.</p>
          : dock.shop.access.every((item) => item.owned) ? <p className="mt-3 text-sm text-muted">You have every pass.</p> : null}
      </Card>

      <Card title="Bait">
        <ul className="flex flex-col gap-3">{usableBait.map(baitRow)}</ul>
        {laterBait.length > 0 ? (
          <>
            <h3 className="mt-5 mb-3 font-semibold">For waters you can't fish yet</h3>
            <ul className="flex flex-col gap-3">{laterBait.map(baitRow)}</ul>
          </>
        ) : null}
        <p className="mt-3 text-sm text-muted">Up to 72 of each. Bait never spoils.</p>
      </Card>
      <ConfirmSheet
        open={offer !== null}
        title={offer?.title ?? ''}
        confirmLabel={offer ? `Buy for ${offer.price} coins` : 'Buy'}
        busyLabel="Buying…"
        cancelLabel="Cancel"
        pending={buying}
        onClose={() => setOffer(null)}
        onConfirm={async () => {
          if (!offer || buying) return
          await offer.buy()
          setOffer(null)
        }}
      >
        {offer ? <Rows rows={[...offer.rows, ['Cost', <Coins n={offer.price} />], ['Coins left', <Coins n={gold - offer.price} />]]} /> : null}
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
