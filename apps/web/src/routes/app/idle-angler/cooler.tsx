import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { formatWeight, type Dock } from '../../../lib/idleAngler'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { ConfirmSheet } from '../desk-crawler/-confirm'
import { FishIcon } from './-art'
import { Coins } from './-coins'
import { FishName, FishText } from './-fish'
import type { Id } from '@trmnl-games/backend/data-model'
import { Rows } from './-rows'

/**
 * The cooler: choose fish to sell, or sell them all after a confirmation. Nothing is ever sold automatically. The
 * fishmonger shows only orders the cooler can fill now (D167): the angler cannot choose its catch, so an order it
 * cannot fill is nothing to act on.
 */
export const Route = createFileRoute('/app/idle-angler/cooler')({
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {})),
  component: CoolerPage,
})

function CoolerPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const dock = data as Dock | undefined
  const { notice, notify, dismiss } = useNotice()
  const sell = useIntent(api.idleAngler.anglers.sellCatches, { onFeedback: notify })
  const handOver = useIntent(api.idleAngler.full.handOverOrder, { onFeedback: notify })
  const asBait = useIntent(api.idleAngler.full.useAsBait, { onFeedback: notify })
  const mount = useIntent(api.idleAngler.full.mountCatch, { onFeedback: notify })
  const [mounting, setMounting] = useState<{ id: Id<'catches'>; name: string; grams: number; cost: number } | null>(null)
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set())
  const [askingAll, setAskingAll] = useState(false)
  if (!dock?.angler) return null
  const full = dock.full ?? null
  const catches = dock.catches ?? []
  const picked = catches.filter((c) => chosen.has(c.id))
  const total = (rows: typeof catches) => rows.reduce((sum, row) => sum + row.value, 0)
  const toggle = (id: string) => setChosen((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  // Orders the cooler fills now, with the fish a sale would take (the cheapest that fit) and their market price.
  const ready = full?.features.orders
    ? full.orders.flatMap((order) => {
        const going = order.catchIds.map((id) => catches.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => c !== undefined)
        return order.reward !== null && going.length === order.count ? [{ order, reward: order.reward, going, market: total(going) }] : []
      })
    : []
  const wanted = new Set(ready.flatMap((r) => r.going.map((c) => c.id)))
  const wantedInCooler = catches.filter((c) => wanted.has(c.id)).length
  const sellRows = async (rows: typeof catches) => {
    if (rows.length === 0) return
    if (await sell.run({ catchIds: rows.map((r) => r.id) }, `Sold ${rows.length} fish for ${total(rows)} coins.`)) setChosen(new Set())
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Cooler</h1>
        <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted"><strong className="text-ink">{dock.angler.cooler.name}</strong> · <span className="tabular-nums">{catches.length}/{dock.angler.cooler.capacity}</span> · <Coins n={dock.angler.gold} className="text-gold-ink" /></span>
      </div>
      {ready.length > 0 ? (
        <Card title="Fishmonger" icon="coin">
          <p className="mb-3 text-sm text-muted">Pays more than the market for these.</p>
          <ul className="flex flex-col gap-3">
            {ready.map(({ order, reward, going, market }) => (
              <li key={order.id} className="flex flex-col gap-2 border-b border-rule pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm font-semibold text-muted"><FishText text={order.line} /></p>
                <ul className="flex flex-col gap-1">
                  {going.map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                      <FishIcon id={c.speciesId} />
                      <span className="min-w-0"><FishName id={c.speciesId}>{c.name}</FishName> <span className="text-sm whitespace-nowrap text-muted">{formatWeight(c.grams)}</span></span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Button className="inline-flex items-center justify-center gap-2" pending={handOver.pending} busyLabel="Selling…" onClick={() => void handOver.run({ orderId: order.id, catchIds: order.catchIds }, `Sold to the fishmonger for ${reward} coins.`)}>
                    Sell <Coins n={reward} sign />
                  </Button>
                  <span className="text-sm text-muted">Market <Coins n={market} /></span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {catches.length === 0 ? (
        <Card><p>The cooler is empty. Fish land here as the angler catches them.</p></Card>
      ) : (
        <Card>
          <ul className="flex flex-col">
            {catches.map((fish) => (
              <li key={fish.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-rule py-2 last:border-b-0">
                  <input type="checkbox" className="pixel-check size-5 shrink-0" checked={chosen.has(fish.id)} onChange={() => toggle(fish.id)} />
                  <FishIcon id={fish.speciesId} />
                  {/* Name over weight: inline, a phone's narrow row split the weight across lines. */}
                  <span className="flex min-w-0 flex-1 flex-col leading-tight"><FishName id={fish.speciesId}>{fish.name}</FishName>{' '}<span className="text-sm text-muted"><span className="whitespace-nowrap">{formatWeight(fish.grams)}</span>{fish.record ? <span className="whitespace-nowrap text-gold-ink"> · personal best</span> : null}{wanted.has(fish.id) ? <span className="whitespace-nowrap text-gold-ink"> · fishmonger</span> : null}</span></span>
                  <Coins n={fish.value} className="shrink-0 text-gold-ink" />
                </label>
                {(() => {
                  // Only what can happen now: Mount needs the coins and a free peg, so it waits rather than refusing.
                  const bait = full?.catchActions[fish.id]?.bait === true
                  const cost = full?.catchActions[fish.id]?.mountCost ?? null
                  const mountable = cost !== null && full !== null && full.pegs.free > 0 && dock.angler!.gold >= cost
                  if (!bait && !mountable) return null
                  return (
                    <div className="flex flex-wrap gap-2 border-b border-rule pb-2 pl-8">
                      {bait ? <Button variant="secondary" disabled={asBait.pending} onClick={() => void asBait.run({ catchId: fish.id }, `The ${fish.name} goes in the deadbait box.`)}>Use as bait</Button> : null}
                      {mountable ? <Button variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={mount.pending} onClick={() => setMounting({ id: fish.id, name: fish.name, grams: fish.grams, cost })}>Mount <Coins n={cost} /></Button> : null}
                    </div>
                  )
                })()}
              </li>
            ))}
          </ul>
          {/* D156: no dead button while nothing is ticked; the Sell button appears with the first fish chosen. */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {picked.length > 0 ? (
              <Button className="inline-flex items-center justify-center gap-2" pending={sell.pending} busyLabel="Selling…" onClick={() => void sellRows(picked)}>
                Sell {picked.length} <Coins n={total(picked)} sign />
              </Button>
            ) : null}
            <Button variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={sell.pending} onClick={() => setAskingAll(true)}>Sell all <Coins n={total(catches)} sign /></Button>
            {picked.length === 0 ? <span className="text-sm text-muted">Or tick fish to sell some.</span> : null}
          </div>
          <Rows className="mt-3" rows={[['Price', 'Heavier fish sell for more, up to ×2'], ['Cooler full', 'New catches are released: logged, but no coins']]} />
        </Card>
      )}
      <ConfirmSheet
        open={askingAll}
        title={`Sell all ${catches.length} fish?`}
        confirmLabel={`Sell for +${total(catches)} coins`}
        busyLabel="Selling…"
        cancelLabel="Cancel"
        pending={sell.pending}
        onClose={() => setAskingAll(false)}
        onConfirm={async () => {
          if (sell.pending) return
          await sellRows(catches)
          setAskingAll(false)
        }}
      >
        <Rows rows={[
          ['Fish', `${catches.length}`],
          ['You get', <Coins n={total(catches)} sign className="text-gold-ink" />],
          wantedInCooler > 0 ? ['Fishmonger', `Pays more for ${wantedInCooler} of them`] : null,
          ['Logbook', 'Keeps every personal best'],
        ]} />
      </ConfirmSheet>
      <ConfirmSheet
        open={mounting !== null}
        title={mounting ? `Mount the ${formatWeight(mounting.grams)} ${mounting.name}?` : ''}
        confirmLabel={mounting ? `Mount for ${mounting.cost} coins` : 'Mount'}
        busyLabel="Mounting…"
        cancelLabel="Cancel"
        pending={mount.pending}
        onClose={() => setMounting(null)}
        onConfirm={async () => {
          if (!mounting) return
          await mount.run({ catchId: mounting.id }, `The ${mounting.name} goes up on the wall.`)
          setMounting(null)
        }}
      >
        {mounting ? <Rows rows={[['Goes to', 'The trophy wall, on a free peg'], ['Cost', <Coins n={mounting.cost} />], ['Coins left', <Coins n={dock.angler.gold - mounting.cost} />], ['Not sold', 'It leaves the cooler without earning coins']]} /> : null}
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
