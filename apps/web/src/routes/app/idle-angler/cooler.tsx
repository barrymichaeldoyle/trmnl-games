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
import { FishName, FishText } from './-fish'
import type { Id } from '@trmnl-games/backend/data-model'
import { Rows } from './-rows'

/** The cooler: choose fish to sell, or sell them all after a confirmation. Nothing is ever sold automatically. */
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
  const swap = useIntent(api.idleAngler.full.swapFishmongerOrder, { onFeedback: notify })
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
  const sellRows = async (rows: typeof catches) => {
    if (rows.length === 0) return
    if (await sell.run({ catchIds: rows.map((r) => r.id) }, `Sold ${rows.length} fish for ${total(rows)} coins.`)) setChosen(new Set())
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Cooler</h1>
        <span className="text-sm text-muted"><strong className="text-ink">{dock.angler.cooler.name}</strong> · {catches.length} of {dock.angler.cooler.capacity} · <span className="text-gold-ink">{dock.angler.gold} coins</span></span>
      </div>
      {full?.features.orders ? (
        <Card title="The fishmonger's orders">
          {full.orders.length === 0 ? <p>No orders on the slate yet. New ones arrive at 07:00.</p> : (
            <ul className="flex flex-col gap-3">
              {full.orders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="font-semibold"><FishText text={order.line} /></p>
                    {order.hint ? <p className="text-sm text-muted">Not in your logbook yet. Try {order.hint}.</p> : null}
                    <p className="text-sm text-muted">{order.reward !== null ? <span className="text-gold-ink">Pays {order.reward} coins for the fish below</span> : <>Pays half as much again as the market, plus {order.bonus} coins</>}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.reward !== null ? <Button disabled={handOver.pending} onClick={() => void handOver.run({ orderId: order.id, catchIds: order.catchIds }, `Handed over for ${order.reward} coins.`)}>Hand over</Button> : null}
                    <Button variant="secondary" disabled={full.swappedToday || swap.pending} onClick={() => void swap.run({ orderId: order.id }, 'The fishmonger asks for something else.')}>{full.swappedToday ? 'Swapped today' : 'Swap'}</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted">Orders never expire. An empty slot refills at 07:00, and you can swap one order a day.</p>
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
                  <span className="flex min-w-0 flex-1 flex-col leading-tight"><FishName id={fish.speciesId}>{fish.name}</FishName>{' '}<span className="text-sm whitespace-nowrap text-muted">{formatWeight(fish.grams)}{fish.record ? <span className="text-gold-ink"> · personal best</span> : null}</span></span>
                  <span className="shrink-0 tabular-nums text-gold-ink">{fish.value} coins</span>
                </label>
                {full && (full.catchActions[fish.id]?.bait || full.catchActions[fish.id]?.mountCost != null) ? (
                  <div className="flex flex-wrap gap-2 border-b border-rule pb-2 pl-8">
                    {full.catchActions[fish.id]?.bait ? <Button variant="secondary" disabled={asBait.pending} onClick={() => void asBait.run({ catchId: fish.id }, `The ${fish.name} goes in the deadbait box.`)}>Use as bait</Button> : null}
                    {full.catchActions[fish.id]?.mountCost != null ? <Button variant="secondary" disabled={mount.pending} onClick={() => setMounting({ id: fish.id, name: fish.name, grams: fish.grams, cost: full.catchActions[fish.id]!.mountCost! })}>Mount for {full.catchActions[fish.id]!.mountCost} coins</Button> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={picked.length === 0} pending={sell.pending} busyLabel="Selling…" onClick={() => void sellRows(picked)}>
              {picked.length === 0 ? 'Choose fish to sell' : `Sell ${picked.length} for ${total(picked)} coins`}
            </Button>
            <Button variant="secondary" disabled={sell.pending} onClick={() => setAskingAll(true)}>Sell all for {total(catches)} coins</Button>
          </div>
          <Rows className="mt-3" rows={[['Price', 'Heavier fish sell for more, up to double'], ['Cooler full', 'New catches are released. They still count for the logbook, achievements and boards, but earn no coins']]} />
        </Card>
      )}
      <ConfirmSheet
        open={askingAll}
        title={`Sell all ${catches.length} fish?`}
        confirmLabel={`Sell for ${total(catches)} coins`}
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
        <p>Every fish in the {dock.angler.cooler.name.toLowerCase()} goes, and you get {total(catches)} coins. Your logbook keeps every personal best, even once the fish is sold.</p>
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
        {mounting ? <Rows rows={[['Goes to', 'The trophy wall, on a free peg'], ['Cost', `${mounting.cost} coins`], ['Coins left', `${dock.angler.gold - mounting.cost}`], ['Not sold', 'It leaves the cooler without earning coins']]} /> : null}
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
