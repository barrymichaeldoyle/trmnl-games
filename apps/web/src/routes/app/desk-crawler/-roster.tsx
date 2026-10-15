import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { HERO_NAME_RULE } from '@trmnl-games/platform'
import { useIntent } from '../../../lib/intent'
import { NameField, nameProblem } from '../../../lib/nameField'
import { GenderPicker, type HeroGender } from '../../../lib/genderPicker'
import { Button, Card } from '../../../lib/ui'
import { Glyph } from '../../../lib/glyphs'
import { ConfirmSheet, Consequences } from './-confirm'
import { formatNumber, formatTime, useLocale, useT } from '../../../lib/i18n'
import { useContent } from '../../../lib/useContent'
import { dcPagesMessages } from '../../../i18n/dcPages'
import { INTL_TAG, type Locale } from '@trmnl-games/platform'

/** What `roster.mine` returns (P37). */
export type RosterView = {
  available: boolean
  open: boolean
  unlockLevel: number | null
  warriorLevel: number | null
  heroes: Array<{ id: string; name: string; class: string; className: string; level: number; status: string; hp: number; maxHp: number; gold: number; biome: string; current: boolean; parkedFor: number | null }>
  classes: Array<{ id: 'warrior' | 'rogue'; name: string; blurb: string; passive: { name: string; blurb: string }; hpPct: number; modifiers: { attackPct?: number; defensePct?: number; goldPct?: number }; raidEdgePct: number; recruited: boolean }>
  canPark: boolean
  nextAt: number | null
  undoHeroId: string | null
  undoUntil: number | null
}

type Notify = (feedback: { error: string | null; message: string | null }) => void

/** "Health 85% · Attack +10% · Defense −15% · Gold +20% · Raids +5 points", the class's numbers in one line. */
const numbersOf = (rule: RosterView['classes'][number]) => ({ hpPct: rule.hpPct, ...rule.modifiers, raidEdgePct: rule.raidEdgePct })

const clock = (locale: Locale, at: number) => new Date(at).toLocaleString(INTL_TAG[locale], { weekday: 'short', hour: '2-digit', minute: '2-digit' })

/** How the roster works, in three lines: shown above the heroes and in the recruit sheet. */
function RosterRules() {
  const t = useT(dcPagesMessages)
  return <Consequences>{t.rules.map((rule) => <li key={rule}>{rule}</li>)}</Consequences>
}

/** A class's name, blurb, passive and numbers, as the recruit card and the classes list show it. */
function ClassBody({ rule }: { rule: RosterView['classes'][number] }) {
  const t = useT(dcPagesMessages)
  const c = useContent()
  return <>
    <p className="font-semibold">{c.text(rule.name)}</p>
    <p className="text-sm">{c.text(rule.blurb)}</p>
    <p className="mt-1 text-sm"><strong>{c.text(rule.passive.name)}:</strong> {c.text(rule.passive.blurb)}</p>
    <p className="mt-1 text-sm text-muted">{t.classNumbers(numbersOf(rule))}</p>
  </>
}

export function Roster({ roster, notify }: { roster: RosterView; notify: Notify }) {
  const current = roster.heroes.find((hero) => hero.current)
  const parked = roster.heroes.filter((hero) => !hero.current)
  const open = roster.classes.filter((rule) => !rule.recruited)
  const t = useT(dcPagesMessages)
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="hud text-hud-sm text-gold-ink">{t.howHeroesWork}</h2>
        <div className="mt-2"><RosterRules /></div>
      </Card>
      {!roster.open ? (
        <Card>
          <p className="flex items-center gap-2 font-semibold"><Glyph name="hero" size={14} /> {t.secondOpens(roster.unlockLevel)}</p>
          <p className="mt-1 text-sm text-muted">{t.warriorLevel(roster.warriorLevel ?? 1)}</p>
        </Card>
      ) : null}
      <section aria-labelledby="heroes-title" className="flex flex-col gap-3">
        <h2 id="heroes-title" className="hud text-hud-sm">{t.yourHeroes}</h2>
        {current ? <HeroRow hero={current} /> : null}
        {parked.map((hero) => <ParkedHero key={hero.id} hero={hero} current={current} roster={roster} notify={notify} />)}
      </section>
      {roster.open && open.length > 0 ? (
        <section aria-labelledby="recruit-title" className="flex flex-col gap-3">
          <h2 id="recruit-title" className="hud text-hud-sm">{t.recruit}</h2>
          {open.map((rule) => <RecruitCard key={rule.id} rule={rule} current={current} roster={roster} notify={notify} />)}
        </section>
      ) : null}
      <section aria-labelledby="classes-title" className="flex flex-col gap-3">
        <h2 id="classes-title" className="hud text-hud-sm">{t.classes}</h2>
        {/* A class with a recruit card above is described there already. */}
        {roster.classes.filter((rule) => !(roster.open && !rule.recruited)).map((rule) => (
          <Card key={rule.id}>
            <ClassBody rule={rule} />
          </Card>
        ))}
      </section>
    </div>
  )
}

function HeroRow({ hero, children }: { hero: RosterView['heroes'][number]; children?: React.ReactNode }) {
  const t = useT(dcPagesMessages)
  const locale = useLocale()
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold">{hero.name} <span className="font-normal text-muted">{t.classLevel(hero.className, hero.level)}</span></p>
        {hero.current ? <span className="hud text-hud-sm text-gold-ink">{t.adventuring}</span> : <span className="hud text-hud-sm text-muted">{t.waitingTag}</span>}
      </div>
      <p className="mt-1 text-sm text-muted">
        {hero.current ? t.inBiome(hero.biome) : t.waiting(hero.parkedFor ?? 0, hero.biome)}{t.hpGold(hero.hp, hero.maxHp, formatNumber(locale, hero.gold))}
      </p>
      {children}
    </Card>
  )
}

function ParkedHero({ hero, current, roster, notify }: { hero: RosterView['heroes'][number]; current: RosterView['heroes'][number] | undefined; roster: RosterView; notify: Notify }) {
  const [asking, setAsking] = useState(false)
  const switchHero = useIntent(api.roster.switchHero, { onFeedback: notify })
  const t = useT(dcPagesMessages)
  const locale = useLocale()
  const undo = roster.undoHeroId === hero.id
  const blocked = !undo && roster.nextAt !== null
  return (
    <HeroRow hero={hero}>
      <div className="mt-3 flex flex-col gap-1">
        <Button variant="secondary" disabled={blocked || !roster.canPark} onClick={() => setAsking(true)}>{undo ? t.switchBack(hero.name) : t.switchTo(hero.name)}</Button>
        {blocked ? <p className="text-sm text-muted">{t.oneSwitch(clock(locale, roster.nextAt!))}</p> : null}
        {undo && roster.undoUntil !== null ? <p className="text-sm text-muted">{t.freeUntil(formatTime(locale, roster.undoUntil))}</p> : null}
        {!blocked && !roster.canPark && current ? <p className="text-sm text-muted">{t.canSwitchOut(current.name)}</p> : null}
      </div>
      <ConfirmSheet open={asking} title={t.switchTitle(hero.name)} confirmLabel={t.switchTo(hero.name)} busyLabel={t.switching} cancelLabel={t.keep(current?.name ?? null)} pending={switchHero.pending} onClose={() => setAsking(false)} onConfirm={() => { setAsking(false); void switchHero.run({ heroId: hero.id as never }, t.takesDesk(hero.name)) }}>
        <Consequences>
          <li>{t.stopsWaits(current?.name ?? null)}</li>
          <li>{t.picksUp(hero.name)}</li>
          {undo ? <li>{t.switchBackFree}</li> : <li>{t.daysSwitch}</li>}
        </Consequences>
      </ConfirmSheet>
    </HeroRow>
  )
}

function RecruitCard({ rule, current, roster, notify }: { rule: RosterView['classes'][number]; current: RosterView['heroes'][number] | undefined; roster: RosterView; notify: Notify }) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<HeroGender>('male')
  const [asking, setAsking] = useState(false)
  const recruit = useIntent(api.roster.recruit, { onFeedback: notify })
  const valid = nameProblem(name, HERO_NAME_RULE, 'hero name') === null
  const blocked = roster.nextAt !== null || !roster.canPark
  const t = useT(dcPagesMessages)
  const locale = useLocale()
  return (
    <Card>
      <ClassBody rule={rule} />
      <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); if (valid && !blocked) setAsking(true) }}>
        <NameField label={t.nameYour(rule.name)} small rule={HERO_NAME_RULE} noun="hero name" value={name} onChange={setName} disabled={recruit.pending} />
        <GenderPicker small value={gender} onChange={setGender} disabled={recruit.pending} />
        <Button type="submit" disabled={!valid || blocked}>{t.recruitA(rule.name)}</Button>
        {roster.nextAt !== null ? <p className="text-sm text-muted">{t.recruitCounts(clock(locale, roster.nextAt))}</p> : null}
        {roster.nextAt === null && !roster.canPark && current ? <p className="text-sm text-muted">{t.canHandOver(current.name)}</p> : null}
      </form>
      <ConfirmSheet open={asking} title={t.recruitTitle(name.trim(), rule.name)} confirmLabel={t.recruitName(name.trim())} busyLabel={t.recruiting} cancelLabel={t.notYet} pending={recruit.pending} onClose={() => setAsking(false)} onConfirm={() => { setAsking(false); void recruit.run({ heroClass: rule.id, name: name.trim(), gender }, t.recruited(name.trim(), rule.name)).then((done) => { if (done) setName('') }) }}>
        <Consequences>
          <li>{t.startsAt(name.trim())}</li>
          <li>{t.waitsExactly(current?.name ?? null)}</li>
          <li>{t.daysSwitchBack}</li>
        </Consequences>
      </ConfirmSheet>
    </Card>
  )
}
