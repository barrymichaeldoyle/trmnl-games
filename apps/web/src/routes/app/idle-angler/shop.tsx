import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { useAngler, type Dock } from '../../../lib/idleAngler'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { ConfirmSheet } from '../desk-crawler/-confirm'
import { Coins, Price } from './-coins'
import { FishList, FromWater, WaterName, baitCatches } from './-fish'
import { Rows } from './-rows'
import { seo } from '../../../lib/seo'
import { useT } from '../../../lib/i18n'
import { iaShop } from '../../../i18n/iaShop'
import { iaCommon } from '../../../i18n/ia'

/** The tackle shop: the next rod and cooler, the passes on sale and bait tubs, each at a fixed price; upgrades, passes and charters are confirmed before buying, a bait tub buys at once. */
export const Route = createFileRoute('/app/idle-angler/shop')({
  head: () => seo({ title: 'Tackle shop · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {}), convexQuery(api.idleAngler.anglers.logbook, {})),
  component: ShopPage,
})

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
  const t = useT(iaShop)
  const common = useT(iaCommon)
  const words = useAngler()
  const formatWeight = words.weight
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
    ? <Button className="inline-flex items-center justify-center gap-2" disabled={buying} onClick={open}>{t.buy} <Coins n={price} /></Button>
    : <Price price={price} gold={gold} />)
  const gateOf = (water: string) => dock.waters?.find((w) => w.id === water)?.opensAfter ?? null
  const nextRod = dock.shop.rod
  const nextCooler = dock.shop.cooler
  // Only bait for waters the angler can fish is on sale; the rest shows up once its water opens.
  const openWaters = new Set(dock.waters?.filter((w) => w.open).map((w) => w.id))
  // Deadbait comes from the cooler, never a tub.
  const usableBait = angler.bait.filter((b) => b.class !== 'deadbait' && dock.waters?.some((w) => openWaters.has(w.id) && w.baits.includes(b.class)))
  const baitRow = (b: (typeof angler.bait)[number]) => {
    const waters = dock.waters?.filter((w) => w.baits.includes(b.class)).map((w) => words.water(w.id)) ?? []
    const catches = baitCatches(b.class, seen)
    return (
      <li key={b.class} className="flex flex-col gap-2 border-b border-rule pb-4 last:border-b-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-semibold">{words.bait(b.class)}</p>
          <p className="text-sm text-muted">{t.held(b.units)}</p>
        </div>
        <Rows rows={[
          [t.waters, waters.join(', ')],
          ...(catches.only.ids.length + catches.only.unseen > 0 ? [[t.onlyBaitFor, <FishList {...catches.only} />] as const] : []),
          ...(catches.also.ids.length + catches.also.unseen > 0 ? [[t.alsoCatches, <FishList {...catches.also} />] as const] : []),
          [t.tub, <span className="inline-flex flex-wrap items-center gap-x-2">{t.tubFor(b.tubSize)} <Coins n={b.price} /></span>],
        ]} />
        {/* Each button says what it adds and costs, so a tub buys at once without a confirm sheet; a size the angler cannot pay for yet is left out. */}
        <div className="flex flex-wrap items-center gap-2">
          {[1, 3].filter((n) => n <= b.tubsThatFit && gold >= b.price * n).map((n) => (
            <Button key={n} variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={buying} pending={bait.pending} onClick={() => bait.run({ bait: b.class as never, tubs: n }, t.boughtBait(b.tubSize * n, words.bait(b.class).toLowerCase()))}>
              +{b.tubSize * n} <Coins n={b.price * n} />
            </Button>
          ))}
          {b.tubsThatFit === 0 ? <span className="text-sm text-muted">{t.tubFull}</span> : gold < b.price ? <Price price={b.price} gold={gold} /> : null}
        </div>
      </li>
    )
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <Coins n={gold} className="text-sm font-semibold text-gold-ink" />
      </div>

      {!upgradesOpen ? <Card title={t.rodsAndCoolers}><p>{t.upgradesLater(full?.comingUp?.feature === 'shop_upgrades' ? full.comingUp.species : 2)}</p></Card> : null}
      {upgradesOpen ? <Card title={t.rod}>
        <Rows rows={[
          [t.yours, <><strong>{words.rod(angler.rod.name)}</strong>{t.landsUpTo(formatWeight(angler.rod.limitGrams))}</>],
          nextRod ? [t.next, <><strong>{words.rod(nextRod.name)}</strong>{t.landsUpTo(formatWeight(nextRod.limitGrams))}{t.biteBonus(nextRod.biteBonusPercent)}</>] : null,
        ]} />
        <p className="mt-2 text-sm text-muted">{t.heavierGetsAway}</p>
        {nextRod ? (
          <>
            <div className="mt-3">
              {buy(nextRod.price, () => setOffer({ title: t.buyTitle(words.rod(nextRod.name)), price: nextRod.price, rows: [[t.replaces, words.rod(angler.rod.name)], [t.landsUpToRow, t.nowWeight(formatWeight(nextRod.limitGrams), formatWeight(angler.rod.limitGrams))], [t.biteChance, t.overCane(nextRod.biteBonusPercent)]], buy: () => rod.run({}, t.bought(words.rod(nextRod.name))) }))}
            </div>
          </>
        ) : <p className="mt-2 text-sm text-muted">{t.bestRod}</p>}
      </Card> : null}

      {upgradesOpen ? <Card title={t.cooler}>
        <Rows rows={[
          [t.yours, <><strong>{words.cooler(angler.cooler.name)}</strong>{t.holds(angler.cooler.capacity)}</>],
          nextCooler ? [t.next, <><strong>{words.cooler(nextCooler.name)}</strong>{t.holds(nextCooler.capacity)}</>] : null,
        ]} />
        <p className="mt-2 text-sm text-muted">{t.coolerNote}</p>
        {nextCooler ? (
          <>
            <div className="mt-3">
              {buy(nextCooler.price, () => setOffer({ title: t.buyTitle(words.cooler(nextCooler.name)), price: nextCooler.price, rows: [[t.replaces, words.cooler(angler.cooler.name)], [t.holdsRow, t.holdsNow(nextCooler.capacity, angler.cooler.capacity)], [t.yourCatch, t.movesIn]], buy: () => cooler.run({}, t.bought(words.cooler(nextCooler.name))) }))}
            </div>
          </>
        ) : <p className="mt-2 text-sm text-muted">{t.biggestCooler}</p>}
      </Card> : null}

      {full?.charter && seaKnown ? (
        <Card title={t.charter}>
          <Rows rows={[[t.ticket, <span className="inline-flex flex-wrap items-center gap-x-2">{t.castsAtSeaFor(full.charter.casts)} <Coins n={full.charter.price} /></span>], [t.onTicket, t.casts(full.charter.castsLeft)], [t.leavesFrom, t.leavesFromValue]]} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {full.charter.castsLeft > 0 ? <span className="text-sm text-muted">{t.castsStay}</span> : (
              buy(full.charter.price, () => setOffer({ title: t.bookTitle, price: full.charter!.price, rows: [[t.youGet, t.castsAtSea(full.charter!.casts)], [t.then, t.fishFromDock]], buy: () => charter.run({}, t.booked(full.charter!.casts)) }))
            )}
          </div>
        </Card>
      ) : null}

      <Card title={t.passes}>
        <ul className="flex flex-col gap-3">
          {dock.shop.access.map((item) => {
            const water = words.water(item.water)
            const gate = gateOf(item.water)
            const missing = gate ? Math.max(0, gate.species - gate.logged) : 0
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="font-semibold">{words.pass(item.id)}</p>
                  {/* Once the logbook has the species the water needs, say so instead of restating the requirement. */}
                  <p className="text-sm text-muted">{t.letsYouFish} <WaterName id={item.water} />{!gate ? '.' : missing > 0
                    ? <>{t.onceSpecies(gate.species, gate.logged)[0]}<FromWater id={gate.waterId} />{t.onceSpecies(gate.species, gate.logged)[1]}</>
                    : <>{t.logbookHas(gate.species)[0]}<FromWater id={gate.waterId} />{t.logbookHas(gate.species)[1]}</>}</p>
                </div>
                {item.owned ? <span className="text-sm font-semibold text-xp-ink">{t.owned}</span> : buy(item.price, () => setOffer({ title: t.buyTitle(words.pass(item.id)), price: item.price, rows: [[t.opens, water], [t.fishThere, gate && missing > 0 ? t.afterMore(missing, words.water(gate.waterId)) : t.straightAway]], buy: () => access.run({ access: item.id }, t.bought(words.pass(item.id))) }))}
              </li>
            )
          })}
        </ul>
        {/* Issue #7: later passes stay a surprise until their water's way in can be fished. */}
        {dock.shop.moreAccess ? <p className="mt-3 text-sm text-muted">{t.morePasses}</p>
          : dock.shop.access.every((item) => item.owned) ? <p className="mt-3 text-sm text-muted">{t.everyPass}</p> : null}
      </Card>

      <Card title={t.bait}>
        <ul className="flex flex-col gap-3">{usableBait.map(baitRow)}</ul>
        <p className="mt-3 text-sm text-muted">{t.baitNote}</p>
      </Card>
      <ConfirmSheet
        open={offer !== null}
        title={offer?.title ?? ''}
        confirmLabel={offer ? t.buyFor(offer.price) : t.buy}
        busyLabel={t.buying}
        cancelLabel={common.cancel}
        pending={buying}
        onClose={() => setOffer(null)}
        onConfirm={async () => {
          if (!offer || buying) return
          await offer.buy()
          setOffer(null)
        }}
      >
        {offer ? <Rows rows={[...offer.rows, [common.cost, <Coins n={offer.price} />], [common.coinsLeft, <Coins n={gold - offer.price} />]]} /> : null}
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
