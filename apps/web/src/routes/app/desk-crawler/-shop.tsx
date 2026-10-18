import { useEffect, useState, type ReactNode } from 'react'
import { HERO_NAME_RULE, INTL_TAG } from '@trmnl-games/platform'
import { NameField, nameProblem } from '../../../lib/nameField'
import { GenderPicker, type HeroGender } from '../../../lib/genderPicker'
import { Button, Card } from '../../../lib/ui'
import { ConfirmSheet, Consequences } from './-confirm'
import { useLocale, useT } from '../../../lib/i18n'
import { dcBagMessages } from '../../../i18n/dcBag'

/** Purchases shared by the Bag page and the More tab, where the hero's name tag and makeover live. */
export type PurchaseIntent<A> = { pending: boolean; error?: string | null; run: (args: A, message?: string) => Promise<boolean> }

/** D156: a price the hero cannot pay yet, as plain text where the Buy button will be, so no dead button sits on the page. */
export function Price({ price, gold, className = '' }: { price: number; gold: number; className?: string }) {
  const t = useT(dcBagMessages)
  const [amount, rest] = t.priceToGo(price, gold)
  return <p className={`text-sm tabular-nums ${className}`}><span className="font-semibold text-gold-ink">{amount}</span>{rest}</p>
}

/** Every purchase asks first: a stray tap only opens this sheet, which says what changes and the gold left. */
export function BuySheet({ open, title, price, gold, pending, onConfirm, onClose, children }: { open: boolean; title: string; price: number; gold: number; pending: boolean; onConfirm: () => Promise<boolean>; onClose: () => void; children: ReactNode }) {
  const t = useT(dcBagMessages)
  return (
    <ConfirmSheet open={open} title={title} confirmLabel={t.buyFor(price)} busyLabel={t.buying} cancelLabel={t.cancel} pending={pending} onClose={onClose} onConfirm={async () => { if (pending) return; await onConfirm(); onClose() }}>
      <Consequences>
        {children}
        <li>{t.costs(price)}</li>
        <li>{t.remaining(gold - price)}</li>
      </Consequences>
    </ConfirmSheet>
  )
}

/** D142: one "Hi, my name is" name tag in stock a day; buying it renames the current hero. */
export function NameTag({ tag, heroName, gold, disabled, intent }: { tag: { price: number; inStockAt: number | null }; heroName: string; gold: number; disabled: boolean; intent: PurchaseIntent<{ name: string }> }) {
  const [name, setName] = useState('')
  const [asking, setAsking] = useState(false)
  const inStock = tag.inStockAt === null || tag.inStockAt <= Date.now()
  const affordable = gold >= tag.price
  const valid = nameProblem(name, HERO_NAME_RULE, 'hero name') === null && name.trim() !== heroName
  const t = useT(dcBagMessages)
  const locale = useLocale()
  return <Card title={t.nameTag} icon="tag">
    <p>{t.nameTagBody}</p>
    {inStock && !affordable ? <><Price price={tag.price} gold={gold} className="mt-3" /><p className="mt-1 text-sm text-muted">{t.oneADay}</p></> : inStock ? <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); if (valid && affordable) setAsking(true) }}>
      <NameField label={t.newNameFor(heroName)} small rule={HERO_NAME_RULE} noun="hero name" value={name} onChange={setName} disabled={intent.pending} />
      <Button type="submit" disabled={disabled || !valid} pending={intent.pending} icon="coin" busyLabel={t.buying}>{t.buyFor(tag.price)}</Button>
      <p className="text-sm text-muted">{t.oneADay}</p>
    </form> : <p className="mt-3 text-sm text-muted">{t.tagSold(new Date(tag.inStockAt!).toLocaleString(INTL_TAG[locale], { weekday: 'short', hour: '2-digit', minute: '2-digit' }))}</p>}
    <BuySheet open={asking} title={t.renameTitle(heroName, name.trim())} price={tag.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={async () => { const done = await intent.run({ name: name.trim() }, t.renamed(name.trim())); if (done) setName(''); return done }}>
      <li>{t.goesBy(heroName, name.trim())}</li>
      <li>{t.nextTag}</li>
    </BuySheet>
  </Card>
}

/** D149: a makeover switches the current hero's gender for gold, any time. Purely cosmetic. */
export function Makeover({ makeover, heroName, gold, disabled, intent }: { makeover: { price: number; gender: HeroGender }; heroName: string; gold: number; disabled: boolean; intent: PurchaseIntent<{ gender: HeroGender }> }) {
  const [gender, setGender] = useState<HeroGender>(makeover.gender)
  const [asking, setAsking] = useState(false)
  useEffect(() => setGender(makeover.gender), [makeover.gender])
  const affordable = gold >= makeover.price
  const changed = gender !== makeover.gender
  const t = useT(dcBagMessages)
  return <Card title={t.makeover} icon="hero">
    <p>{t.makeoverBody(heroName)}</p>
    {affordable ? <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); if (changed) setAsking(true) }}>
      <GenderPicker small value={gender} onChange={setGender} disabled={intent.pending} />
      {/* The button waits for a different look to be picked, so it never offers to buy the one the hero has. */}
      {changed ? <Button type="submit" disabled={disabled} pending={intent.pending} icon="coin" busyLabel={t.buying}>{t.buyFor(makeover.price)}</Button> : <p className="text-sm text-muted">{t.pickLook}</p>}
    </form> : <Price price={makeover.price} gold={gold} className="mt-3" />}
    <BuySheet open={asking} title={t.makeTitle(heroName, gender)} price={makeover.price} gold={gold} pending={intent.pending} onClose={() => setAsking(false)} onConfirm={async () => await intent.run({ gender }, t.newLook(heroName))}>
      <li>{t.onlyLook}</li>
      <li>{t.changeBackFor(makeover.price)}</li>
    </BuySheet>
  </Card>
}
