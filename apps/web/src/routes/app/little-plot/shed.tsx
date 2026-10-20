import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { seo } from '../../../lib/seo'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { ConfirmSheet, Consequences } from '../desk-crawler/-confirm'
import { type PlotView, type ShedItem, type ShedSeed } from '../../../lib/littlePlot'
import { Coins, KindName, Price } from './-shared'

/** The Shed (little-plot.md "Picking and the shed"): seeds by rarity, then tools, beds, defences, structures and ornaments. */
export const Route = createFileRoute('/app/little-plot/shed')({
  head: () => seo({ title: 'Shed · Little Plot', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.littlePlot.plots.view, {})),
  component: ShedPage,
})

const GROUPS: ReadonlyArray<{ id: ShedItem['group']; title: string; blurb: string }> = [
  { id: 'tool', title: 'Tools', blurb: 'A bigger can waters for longer. The trowel sows a whole row from one tap.' },
  { id: 'bed', title: 'Beds', blurb: 'More beds, more growing, and more room to put two parents side by side.' },
  { id: 'defence', title: 'Defences', blurb: 'Each one lowers a pest’s chance. Pests set a bed back a stage; they never destroy a plant.' },
  { id: 'structure', title: 'Structures', blurb: 'Compost, bees, a pond, a bird table and glass.' },
  { id: 'ornament', title: 'Ornaments', blurb: 'For the look of the place. A gnome of your own puts the real ones off a little.' },
]

type Offer = { title: string; price: number; lines: string[]; buy: () => Promise<boolean> }

function ShedPage() {
  const { data } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const { notice, notify, dismiss } = useNotice()
  const buySeeds = useIntent(api.littlePlot.plots.buySeeds, { onFeedback: notify })
  const buyItem = useIntent(api.littlePlot.plots.buyShedItem, { onFeedback: notify })
  const [offer, setOffer] = useState<Offer | null>(null)
  const view = data as PlotView | undefined
  const plot = view?.plot
  if (!view || !plot) return null
  const gold = plot.gold
  const busy = buySeeds.pending || buyItem.pending
  const seeds = view.shed.seeds
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Shed</h1>
        <Coins n={gold} className="font-semibold text-gold-ink" />
      </div>
      <Card title="Seeds">
        {seeds.length === 0 ? (
          <p className="text-muted">The seed shelf opens at level {view.shed.nextSeedLevel ?? 2}. Until then, picking returns seeds of its own kind.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">Common and uncommon kinds only. The rare and epic ones are never sold: they come from crossing two parents side by side, the gnome trap and the frost.{view.shed.nextSeedLevel ? ` Uncommon seeds reach the shelf at level ${view.shed.nextSeedLevel}.` : ''}</p>
            <ul className="flex flex-col divide-y divide-rule">
              {seeds.map((s: ShedSeed) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 flex-col"><KindName name={s.name} rarity={s.rarity} className="font-semibold" /><span className="text-xs text-muted">{s.held} in the tin{s.note ? ` · ${s.note}` : ''}</span></span>
                  {gold >= s.price ? <Button variant="secondary" className="inline-flex shrink-0 items-center gap-2" disabled={busy} onClick={() => void buySeeds.run({ kindId: s.id, count: 1 }, `Bought a ${s.name} seed.`)}>Buy <Coins n={s.price} /></Button> : <Price price={s.price} gold={gold} />}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      {GROUPS.map((group) => {
        const items = view.shed.items.filter((i) => i.group === group.id && (i.shown || i.owned || i.reason?.startsWith('Level')))
        if (items.length === 0) return null
        return (
          <Card key={group.id} title={group.title}>
            <p className="mb-3 text-sm text-muted">{group.blurb}</p>
            <ul className="flex flex-col divide-y divide-rule">
              {items.map((item: ShedItem) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 flex-col"><span className="font-semibold">{item.name}</span><span className="text-sm text-muted">{item.blurb}</span>{!item.shown && !item.owned && item.reason ? <span className="text-xs text-muted">{item.reason}</span> : null}</span>
                  {item.owned ? <span className="shrink-0 text-sm font-semibold text-xp-ink">Owned</span> : item.shown ? (gold >= item.price ? <Button className="inline-flex shrink-0 items-center gap-2" disabled={busy} onClick={() => setOffer({ title: item.name, price: item.price, lines: [item.blurb], buy: () => buyItem.run({ itemId: item.id }, `Bought the ${item.name}.`) })}>Buy <Coins n={item.price} /></Button> : <Price price={item.price} gold={gold} />) : null}
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
      <ConfirmSheet open={offer !== null} title={offer ? `Buy the ${offer.title}?` : ''} confirmLabel="Buy" busyLabel="Buying…" cancelLabel="Not now" pending={buyItem.pending} onClose={() => setOffer(null)} onConfirm={async () => { if (!offer || buyItem.pending) return; if (await offer.buy()) setOffer(null) }}>
        {offer ? <Consequences><li>{offer.lines[0]}</li><li>It costs {offer.price} coins, leaving {gold - offer.price}.</li></Consequences> : null}
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
