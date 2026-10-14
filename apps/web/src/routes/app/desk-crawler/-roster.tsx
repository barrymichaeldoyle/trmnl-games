import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { HERO_NAME_RULE } from '@trmnl-games/platform'
import { useIntent } from '../../../lib/intent'
import { NameField, nameProblem } from '../../../lib/nameField'
import { GenderPicker, type HeroGender } from '../../../lib/genderPicker'
import { Button, Card } from '../../../lib/ui'
import { Glyph } from '../../../lib/glyphs'
import { ConfirmSheet, Consequences } from './-confirm'

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

const signed = (value: number) => (value > 0 ? `+${value}` : `−${Math.abs(value)}`)

/** "Health 85% · Attack +10% · Defense −15% · Gold +20% · Raids +5 points", the class's numbers in one line. */
function classNumbers(rule: RosterView['classes'][number]): string {
  const parts: string[] = []
  if (rule.hpPct !== 100) parts.push(`Health ${rule.hpPct}%`)
  if (rule.modifiers.attackPct) parts.push(`Attack ${signed(rule.modifiers.attackPct)}%`)
  if (rule.modifiers.defensePct) parts.push(`Defense ${signed(rule.modifiers.defensePct)}%`)
  if (rule.modifiers.goldPct) parts.push(`Gold ${signed(rule.modifiers.goldPct)}%`)
  if (rule.raidEdgePct) parts.push(`Raids ${signed(rule.raidEdgePct)} points`)
  return parts.length === 0 ? 'Full health, attack and defense' : parts.join(' · ')
}

/** How long a parked hero has waited, from its parked adventures (four an hour): "Waiting in the Archive for 13 hours". */
function waiting(ticks: number, biome: string): string {
  const hours = Math.floor(ticks / 4)
  if (hours < 1) return `Just clocked out in the ${biome}`
  return `Waiting in the ${biome} for ${hours < 48 ? `${hours} hour${hours === 1 ? '' : 's'}` : `${Math.floor(hours / 24)} days`}`
}

const clock = (at: number) => new Date(at).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })

/** How the roster works, in three lines: shown above the heroes and in the recruit sheet. */
const RosterRules = () => (
  <Consequences>
    <li>One hero adventures at a time. The others wait exactly where you left them, with no adventures and no catch-up.</li>
    <li>Each hero has its own gear, gold, potions and goals. Achievements belong to you, whichever hero earns them.</li>
    <li>You can switch once a day. Switching straight back within ten minutes does not use it up.</li>
  </Consequences>
)

export function Roster({ roster, notify }: { roster: RosterView; notify: Notify }) {
  const current = roster.heroes.find((hero) => hero.current)
  const parked = roster.heroes.filter((hero) => !hero.current)
  const open = roster.classes.filter((rule) => !rule.recruited)
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="hud text-hud-sm text-gold-ink">How heroes work</h2>
        <div className="mt-2"><RosterRules /></div>
      </Card>
      {!roster.open ? (
        <Card>
          <p className="flex items-center gap-2 font-semibold"><Glyph name="hero" size={14} /> A second hero opens at Warrior level {roster.unlockLevel}</p>
          <p className="mt-1 text-sm text-muted">Your Warrior is level {roster.warriorLevel ?? 1}. Keep adventuring; your TRMNL says “Unlocked: a second hero” when it opens.</p>
        </Card>
      ) : null}
      <section aria-labelledby="heroes-title" className="flex flex-col gap-3">
        <h2 id="heroes-title" className="hud text-hud-sm">Your heroes</h2>
        {current ? <HeroRow hero={current} /> : null}
        {parked.map((hero) => <ParkedHero key={hero.id} hero={hero} current={current} roster={roster} notify={notify} />)}
      </section>
      {roster.open && open.length > 0 ? (
        <section aria-labelledby="recruit-title" className="flex flex-col gap-3">
          <h2 id="recruit-title" className="hud text-hud-sm">Recruit</h2>
          {open.map((rule) => <RecruitCard key={rule.id} rule={rule} current={current} roster={roster} notify={notify} />)}
        </section>
      ) : null}
      <section aria-labelledby="classes-title" className="flex flex-col gap-3">
        <h2 id="classes-title" className="hud text-hud-sm">Classes</h2>
        {/* A class with a recruit card above is described there already. */}
        {roster.classes.filter((rule) => !(roster.open && !rule.recruited)).map((rule) => (
          <Card key={rule.id}>
            <p className="font-semibold">{rule.name}</p>
            <p className="text-sm">{rule.blurb}</p>
            <p className="mt-1 text-sm"><strong>{rule.passive.name}:</strong> {rule.passive.blurb}</p>
            <p className="mt-1 text-sm text-muted">{classNumbers(rule)}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}

function HeroRow({ hero, children }: { hero: RosterView['heroes'][number]; children?: React.ReactNode }) {
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold">{hero.name} <span className="font-normal text-muted">· {hero.className}, level {hero.level}</span></p>
        {hero.current ? <span className="hud text-hud-sm text-gold-ink">Adventuring</span> : <span className="hud text-hud-sm text-muted">Waiting</span>}
      </div>
      <p className="mt-1 text-sm text-muted">
        {hero.current ? `In the ${hero.biome}` : waiting(hero.parkedFor ?? 0, hero.biome)} · {hero.hp}/{hero.maxHp} HP · {hero.gold.toLocaleString()} gold
      </p>
      {children}
    </Card>
  )
}

function ParkedHero({ hero, current, roster, notify }: { hero: RosterView['heroes'][number]; current: RosterView['heroes'][number] | undefined; roster: RosterView; notify: Notify }) {
  const [asking, setAsking] = useState(false)
  const switchHero = useIntent(api.roster.switchHero, { onFeedback: notify })
  const undo = roster.undoHeroId === hero.id
  const blocked = !undo && roster.nextAt !== null
  return (
    <HeroRow hero={hero}>
      <div className="mt-3 flex flex-col gap-1">
        <Button variant="secondary" disabled={blocked || !roster.canPark} onClick={() => setAsking(true)}>{undo ? `Switch back to ${hero.name}` : `Switch to ${hero.name}`}</Button>
        {blocked ? <p className="text-sm text-muted">One switch a day. The next opens {clock(roster.nextAt!)}.</p> : null}
        {undo && roster.undoUntil !== null ? <p className="text-sm text-muted">Free until {new Date(roster.undoUntil).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}; after that it waits a day.</p> : null}
        {!blocked && !roster.canPark && current ? <p className="text-sm text-muted">{current.name} can switch out once back on their feet or arrived.</p> : null}
      </div>
      <ConfirmSheet open={asking} title={`Switch to ${hero.name}?`} confirmLabel={`Switch to ${hero.name}`} busyLabel="Switching…" cancelLabel={`Keep ${current?.name ?? 'your hero'}`} pending={switchHero.pending} onClose={() => setAsking(false)} onConfirm={() => { setAsking(false); void switchHero.run({ heroId: hero.id as never }, `${hero.name} takes the desk from the next adventure.`) }}>
        <Consequences>
          <li>{current?.name ?? 'Your hero'} stops adventuring and waits exactly where they are.</li>
          <li>{hero.name} picks up from the next adventure, with nothing lost while they waited.</li>
          {undo ? <li>Switching straight back does not use up the day's switch.</li> : <li>This is the day's switch; you can undo it within ten minutes.</li>}
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
  return (
    <Card>
      <p className="font-semibold">{rule.name}</p>
      <p className="text-sm">{rule.blurb}</p>
      <p className="mt-1 text-sm"><strong>{rule.passive.name}:</strong> {rule.passive.blurb}</p>
      <p className="mt-1 text-sm text-muted">{classNumbers(rule)}</p>
      <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); if (valid && !blocked) setAsking(true) }}>
        <NameField label={`Name your ${rule.name}`} small rule={HERO_NAME_RULE} noun="hero name" value={name} onChange={setName} disabled={recruit.pending} />
        <GenderPicker small value={gender} onChange={setGender} disabled={recruit.pending} />
        <Button type="submit" disabled={!valid || blocked}>Recruit a {rule.name}</Button>
        {roster.nextAt !== null ? <p className="text-sm text-muted">Recruiting counts as the day's switch. It opens {clock(roster.nextAt)}.</p> : null}
        {roster.nextAt === null && !roster.canPark && current ? <p className="text-sm text-muted">{current.name} can hand over once back on their feet or arrived.</p> : null}
      </form>
      <ConfirmSheet open={asking} title={`Recruit ${name.trim()} the ${rule.name}?`} confirmLabel={`Recruit ${name.trim()}`} busyLabel="Recruiting…" cancelLabel="Not yet" pending={recruit.pending} onClose={() => setAsking(false)} onConfirm={() => { setAsking(false); void recruit.run({ heroClass: rule.id, name: name.trim(), gender }, `${name.trim()} the ${rule.name} starts in the Office Cubicles from the next adventure.`).then((done) => { if (done) setName('') }) }}>
        <Consequences>
          <li>{name.trim()} starts at level 1 in the Office Cubicles with starter gear and the full ladder of goals.</li>
          <li>{current?.name ?? 'Your hero'} stops adventuring and waits exactly where they are, until you switch back.</li>
          <li>This is the day's switch; you can switch back within ten minutes.</li>
        </Consequences>
      </ConfirmSheet>
    </Card>
  )
}
