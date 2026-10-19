import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { readyOrders, useAngler, type Dock } from '../../../lib/idleAngler'
import { useT } from '../../../lib/i18n'
import { iaCooler } from '../../../i18n/iaCooler'
import { iaCommon } from '../../../i18n/ia'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { ConfirmSheet } from '../desk-crawler/-confirm'
import { FishIcon } from './-art'
import { Coins, Price } from './-coins'
import { FishName, FishText } from './-fish'
import type { Id } from '@trmnl-games/backend/data-model'
import { Rows } from './-rows'
import { seo } from '../../../lib/seo'

/**
 * The cooler: choose fish to sell, or sell them all after a confirmation. Nothing is ever sold automatically. The
 * fishmonger shows only orders the cooler can fill now (D167): the angler cannot choose its catch, so an order it
 * cannot fill is nothing to act on.
 */
export const Route = createFileRoute('/app/idle-angler/cooler')({
  head: () => seo({ title: 'Cooler · Idle Angler', index: false }),
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
  const t = useT(iaCooler)
  const common = useT(iaCommon)
  const words = useAngler()
  const formatWeight = words.weight
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
  const ready = readyOrders(dock)
  const wanted = new Set(ready.flatMap((r) => r.going.map((c) => c.id)))
  const wantedInCooler = catches.filter((c) => wanted.has(c.id)).length
  const sellRows = async (rows: typeof catches) => {
    if (rows.length === 0) return
    if (await sell.run({ catchIds: rows.map((r) => r.id) }, t.sold(rows.length, total(rows)))) setChosen(new Set())
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted"><strong className="text-ink">{words.cooler(dock.angler.cooler.name)}</strong> · <span className="tabular-nums">{catches.length}/{dock.angler.cooler.capacity}</span> · <Coins n={dock.angler.gold} className="text-gold-ink" /></span>
      </div>
      {ready.length > 0 ? (
        <Card title={t.fishmonger} icon="coin">
          <p className="mb-3 text-sm text-muted">{t.paysMore}</p>
          <ul className="flex flex-col gap-3">
            {ready.map(({ order, reward, going, market }) => (
              <li key={order.id} className="flex flex-col gap-2 border-b border-rule pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm font-semibold text-muted"><FishText text={order.line} /></p>
                <ul className="flex flex-col gap-1">
                  {going.map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                      <FishIcon id={c.speciesId} />
                      <span className="min-w-0"><FishName id={c.speciesId} /> <span className="text-sm whitespace-nowrap text-muted">{formatWeight(c.grams)}</span></span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Button className="inline-flex items-center justify-center gap-2" pending={handOver.pending} busyLabel={t.selling} onClick={() => void handOver.run({ orderId: order.id, catchIds: order.catchIds }, t.soldToFishmonger(reward))}>
                    {t.sell} <Coins n={reward} sign />
                  </Button>
                  <span className="text-sm text-muted">{t.market} <Coins n={market} /></span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {catches.length === 0 ? (
        <Card><p>{t.empty}</p></Card>
      ) : (
        <Card>
          <ul className="flex flex-col">
            {catches.map((fish) => (
              <li key={fish.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-rule py-2 last:border-b-0">
                  <input type="checkbox" className="pixel-check size-5 shrink-0" checked={chosen.has(fish.id)} onChange={() => toggle(fish.id)} />
                  <FishIcon id={fish.speciesId} />
                  {/* Name over weight: inline, a phone's narrow row split the weight across lines. */}
                  <span className="flex min-w-0 flex-1 flex-col leading-tight"><FishName id={fish.speciesId} />{' '}<span className="text-sm text-muted"><span className="whitespace-nowrap">{formatWeight(fish.grams)}</span>{fish.record ? <>{' '}<span className="whitespace-nowrap text-gold-ink">· {t.personalBest}</span></> : null}{wanted.has(fish.id) ? <>{' '}<span className="whitespace-nowrap text-gold-ink">· {t.fishmongerTag}</span></> : null}{full?.catchActions[fish.id]?.mountCost != null ? <>{' '}<span className="whitespace-nowrap text-gold-ink">· {t.trophySize}</span></> : null}</span></span>
                  <Coins n={fish.value} className="shrink-0 text-gold-ink" />
                </label>
                {(() => {
                  // A trophy-sized fish always says where it stands (issue #6): Mount when it can go up now, else the
                  // price and coins to go, or that the wall is full with a link to buy pegs.
                  const bait = full?.catchActions[fish.id]?.bait === true
                  const cost = full?.catchActions[fish.id]?.mountCost ?? null
                  if (!bait && cost === null) return null
                  const wallFull = full !== null && full.pegs.free === 0
                  return (
                    <div className="flex flex-wrap items-center gap-2 border-b border-rule pb-2 pl-8">
                      {bait ? <Button variant="secondary" disabled={asBait.pending} onClick={() => void asBait.run({ catchId: fish.id }, t.toDeadbait(words.species(fish.speciesId)))}>{t.useAsBait}</Button> : null}
                      {cost === null ? null : wallFull ? <span className="text-sm text-muted">{t.wallFull} <Link to="/app/idle-angler/trophies" className="underline underline-offset-4">{t.addPegs}</Link></span>
                        : dock.angler!.gold >= cost ? <Button variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={mount.pending} onClick={() => setMounting({ id: fish.id, name: words.species(fish.speciesId), grams: fish.grams, cost })}>{t.mount} <Coins n={cost} /></Button>
                        : <div className="flex flex-wrap items-center gap-x-2 text-sm"><span className="text-muted">{t.mount}</span><Price price={cost} gold={dock.angler!.gold} /></div>}
                    </div>
                  )
                })()}
              </li>
            ))}
          </ul>
          {/* D156: no dead button while nothing is ticked; the Sell button appears with the first fish chosen. */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {picked.length > 0 ? (
              <Button className="inline-flex items-center justify-center gap-2" pending={sell.pending} busyLabel={t.selling} onClick={() => void sellRows(picked)}>
                {t.sellN(picked.length)} <Coins n={total(picked)} sign />
              </Button>
            ) : null}
            <Button variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={sell.pending} onClick={() => setAskingAll(true)}>{t.sellAll} <Coins n={total(catches)} sign /></Button>
            {picked.length === 0 ? <span className="text-sm text-muted">{t.orTick}</span> : null}
          </div>
          <Rows className="mt-3" rows={[[t.price, t.priceValue], [t.coolerFull, t.coolerFullValue]]} />
        </Card>
      )}
      <ConfirmSheet
        open={askingAll}
        title={t.sellAllTitle(catches.length)}
        confirmLabel={t.sellFor(total(catches))}
        busyLabel={t.selling}
        cancelLabel={common.cancel}
        pending={sell.pending}
        onClose={() => setAskingAll(false)}
        onConfirm={async () => {
          if (sell.pending) return
          await sellRows(catches)
          setAskingAll(false)
        }}
      >
        <Rows rows={[
          [t.fish, `${catches.length}`],
          [t.youGet, <Coins n={total(catches)} sign className="text-gold-ink" />],
          wantedInCooler > 0 ? [t.fishmonger, t.paysMoreFor(wantedInCooler)] : null,
          [t.logbook, t.keepsBests],
        ]} />
      </ConfirmSheet>
      <ConfirmSheet
        open={mounting !== null}
        title={mounting ? t.mountTitle(formatWeight(mounting.grams), mounting.name) : ''}
        confirmLabel={mounting ? t.mountFor(mounting.cost) : t.mount}
        busyLabel={t.mounting}
        cancelLabel={common.cancel}
        pending={mount.pending}
        onClose={() => setMounting(null)}
        onConfirm={async () => {
          if (!mounting) return
          await mount.run({ catchId: mounting.id }, t.mounted(mounting.name))
          setMounting(null)
        }}
      >
        {mounting ? <Rows rows={[[t.goesTo, t.goesToValue], [common.cost, <Coins n={mounting.cost} />], [common.coinsLeft, <Coins n={dock.angler.gold - mounting.cost} />], [t.notSold, t.notSoldValue]]} /> : null}
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
