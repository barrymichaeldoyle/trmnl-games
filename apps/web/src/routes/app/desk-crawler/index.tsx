import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { useIntent } from '../../../lib/intent'
import { BUTTON_PRIMARY, Button, LoadingState, NoticeBar, useFocusWithin, useNotice } from '../../../lib/ui'
import { BIOME_SWATCH } from '../../../lib/palette'
import { preload } from '../../../lib/preload'
import { Glyph, SectionTitle } from '../../../lib/glyphs'
import { ReturnNudge } from './-recap'
import { GameScreen, latestLogQuery } from './-gameScreen'
import { KeepsakeCallout } from './-keepsakes'
import { TodoCard, type TodoView } from './-todo'
import { GoalCard, LockedCard, type CareerView, type UnlockView } from './-career'
import { ConfirmSheet, Consequences, PauseConsequences } from './-confirm'
import { Sheet, SheetTitle } from './-bagSlots'
import { AlertNudge } from './-alerts'

export const Route = createFileRoute('/app/desk-crawler/')({
  head: () => seo({ title: 'Hero', index: false }),
  loader: ({ context }) =>
    preload(context, convexQuery(api.heroes.mine, {}), convexQuery(api.inventory.mine, {}), convexQuery(api.heroes.returnSummary, {}), convexQuery(api.keepsakes.mine, {}), latestLogQuery()),
  component: HeroHome,
})

type Biome = { id: string; name: string; unlocked: boolean; unlockLevel: number }

/**
 * The game screen leads, after an unclaimed weekly keepsake's callout (a
 * reason to go and look at the TRMNL): the hero's scene in colour under a
 * platformer HUD, the current goal (P35), then the few commands the game asks for, the to-do list, the stance and the world map.
 * What happened lives on the Log tab, standing on Ranks, and the rest behind More (D124): on a phone this page
 * was seven screens tall when it held all of it.
 */
function HeroHome() {
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  if (!hero) return <LoadingState label="Loading your hero…" />
  const biomeName = hero.biomes.find((b: Biome) => b.id === hero.biomeId)?.name ?? ''
  const targetName = hero.biomes.find((b: Biome) => b.id === hero.targetBiomeId)?.name ?? ''

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {/* The page's title for assistive tech, ahead of the keepsake callout; the game screen's HUD names the hero visibly. */}
      <h1 className="sr-only">{hero.name}, your hero</h1>
      <KeepsakeCallout />
      <GameScreen hero={{ ...hero, biomeName, targetName }} />
      <ReturnNudge />
      <HeroSheet hero={hero} />
    </div>
  )
}

// heroes.mine is validated as v.any(), so its shape is read structurally here.
type HeroView = {
  name: string
  level: number
  status: string
  hp: number
  maxHp: number
  xp: number
  xpToNext: number
  attack: number
  defense: number
  gold: number
  biomeId: string
  targetBiomeId: string | null
  simulationState: string
  biomes: Biome[]
  stance: StanceId
  stances: Stance[]
  raidsEnabled?: boolean
  /** D112: present once the world runs the to-do list and the hero has one. */
  todo?: TodoView | null
  /** P35: the ladder, and which features this level has opened; null under a catalog without them. */
  career?: CareerView | null
  unlocks?: UnlockView | null
  merchantTicksLeft: number | null
  wakeAtTick: number | null
  choice: Choice | null
  effects: Array<{ id: string; name: string; blurb: string; kind: 'boon' | 'bane'; ticksLeft: number }>
}

type Choice = { eventId: string; title: string; prompt: string; expiresAtTick: number; ticksLeft: number; defaultOptionId: string; options: Array<{ id: string; label: string; change: { gold: number; hp: number; potions: number } }> }

type StanceId = 'cautious' | 'balanced' | 'bold'
type Stance = { id: StanceId; name: string; blurb: string; potionBelowPct: number; restBelowPct: number; resumeAtPct: number; victoryXpPct: number; raidsPerDay?: number; raidWinPct?: number }

/** D110: how often a stance raids, in words a player can picture (launches per exploring day). */
const raidPace = (perDay: number) => (perDay < 0.75 ? 'raids about every other day' : perDay < 1.5 ? 'raids about once a day' : `raids about ${perDay < 2.5 ? 'twice' : Math.round(perDay) + ' times'} a day`)

function HeroSheet({ hero }: { hero: HeroView }) {
  const { data: bag } = useQuery(convexQuery(api.inventory.mine, {}))
  // Every command reports into one pinned notice (D98), so nothing under the buttons moves when an action settles.
  const { notice, notify, dismiss } = useNotice()
  const travel = useIntent(api.heroes.changeBiome, { onFeedback: notify })
  const potion = useIntent(api.inventory.usePotion, { onFeedback: notify })
  const pause = useIntent(api.heroes.pause, { onFeedback: notify })
  const resume = useIntent(api.heroes.resume, { onFeedback: notify })
  // The stance is a stored preference: once confirmed it shows as chosen at once, and rolls back if the save fails.
  const stance = useIntent(api.heroes.setStance, {
    onFeedback: notify,
    optimisticUpdate: (store, args) => {
      const current = store.getQuery(api.heroes.mine, {})
      if (current) store.setQuery(api.heroes.mine, {}, { ...current, stance: args.stance })
    },
  })
  const choose = useIntent(api.heroes.choose, { onFeedback: notify })
  const healthy = hero.simulationState !== 'quarantined'
  const canAct = healthy && (hero.status === 'exploring' || hero.status === 'resting')
  // D118: a travelling hero can drink too, so it arrives ready.
  const canDrink = canAct || (healthy && hero.status === 'travelling')
  // Anything that could set the hero back or slow it down asks first (the to-do swap, pause, travel, stance, a costly decision).
  const [ask, setAsk] = useState<Ask | null>(null)
  const close = () => setAsk(null)
  // D131: the strengths in the pouch. One strength drinks at once; more than one opens a picker. The button's figure
  // is what the default drink would do: the smallest potion that heals to full, else the strongest.
  const strengths = ((bag?.potionRows ?? []) as PotionRow[]).filter((row) => row.count > 0)
  const fit = strengths.find((row) => hero.hp + row.heals >= hero.maxHp) ?? strengths.at(-1) ?? null
  const healing = fit === null ? 0 : Math.min(hero.maxHp - hero.hp, fit.heals)
  const potionLabel = !bag ? 'Drink potion' : !bag.potions ? 'No potions' : hero.hp >= hero.maxHp ? `Drink potion (${bag.potions})` : `Drink potion +${healing} HP (${bag.potions})`
  const drink = () => (strengths.length > 1 ? setAsk({ kind: 'potion' }) : potion.run(fit === null ? {} : { templateId: fit.templateId }, `${fit === null ? 'Potion' : fit.name} drunk, +${healing} HP.`))
  const chosenStance = hero.stances.find((option) => option.id === hero.stance) ?? null
  // P35: a feature the hero's level has not reached shows as a locked card where its card will be.
  const locked = (feature: UnlockView[number]['feature']) => hero.unlocks?.find((entry) => entry.feature === feature && !entry.unlocked) ?? null
  // Pause and Resume swap places when they succeed; focus follows to whichever command takes over.
  const commands = useFocusWithin<HTMLElement>(hero.status)

  const stopNote = hero.status === 'paused' ? 'Resume adventures to travel.' : hero.status === 'sleeping' ? 'Make room in your bag to travel.' : hero.status === 'dead' ? 'Travel opens again once your hero is back on their feet.' : null

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {hero.career ? <GoalCard career={hero.career} level={hero.level} notify={notify} /> : null}
      <section ref={commands} aria-label="Commands" className="flex flex-col gap-2">
        {canDrink || hero.status === 'paused' || hero.status === 'sleeping' ? (
          // Full-width keys stacked on phones so their edges line up; a row from 640px.
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {hero.status === 'sleeping' ? (
              <Link to="/app/desk-crawler/inventory" className={`inline-flex min-h-11 items-center justify-center gap-2.5 px-4 ${BUTTON_PRIMARY}`}>
                <Glyph name="bag" />Open bag
              </Link>
            ) : null}
            {hero.status === 'paused' ? (
              <Button icon="play" pending={resume.pending} busyLabel="Resuming…" disabled={!healthy} onClick={() => resume.run({}, 'Adventures resumed. Your hero joins the next adventure.')}>
                Resume adventures
              </Button>
            ) : null}
            {canDrink ? (
              <Button icon="potion" variant={hero.hp < hero.maxHp && bag?.potions ? 'primary' : 'secondary'} pending={potion.pending} busyLabel="Drinking…" disabled={hero.hp >= hero.maxHp || !bag?.potions} onClick={drink}>
                {potionLabel}
              </Button>
            ) : null}
            {canAct ? (
              <Button icon="pause" variant="secondary" pending={pause.pending} busyLabel="Pausing…" onClick={() => setAsk({ kind: 'pause' })}>
                Pause adventures
              </Button>
            ) : null}
          </div>
        ) : null}
        {hero.effects.length > 0 ? <ul aria-label="Effects" className="flex flex-wrap gap-2 text-sm">{hero.effects.map((effect) => <li key={effect.id} className={`border-[3px] px-2 py-1 ${effect.kind === 'bane' ? 'border-hp-ink' : 'border-night'}`}><strong>{effect.name}</strong> · {effect.blurb} · <span className="whitespace-nowrap">{effect.ticksLeft === 1 ? 'one adventure' : `${effect.ticksLeft} adventures`} left</span></li>)}</ul> : null}
        {hero.status === 'sleeping' && hero.wakeAtTick === null ? <AlertNudge /> : null}
        {hero.merchantTicksLeft !== null ? <p className="text-sm"><strong>A merchant is visiting.</strong> <Link to="/app/desk-crawler/inventory" className="underline underline-offset-4">See the offers in your bag</Link> within {hero.merchantTicksLeft === 1 ? 'one adventure' : `${hero.merchantTicksLeft} adventures`}.</p> : null}
        {!healthy ? <p className="text-sm">Paused for a service check. <Link to="/support" className="underline underline-offset-4">Contact support</Link> if it lasts.</p> : null}
      </section>

      {hero.choice ? (
        <section aria-labelledby="choice-title" className="flex flex-col gap-3 border-[3px] border-night bg-panel p-4">
          <SectionTitle id="choice-title" glyph="choice" tone="text-sky-ink" size="text-2xl">{hero.choice.title}</SectionTitle>
          <p>{hero.choice.prompt}</p>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {hero.choice.options.map((option) => {
              const parts = [option.change.gold ? `${option.change.gold > 0 ? '+' : '−'}${Math.abs(option.change.gold)} gold` : null, option.change.hp ? `${option.change.hp > 0 ? '+' : '−'}${Math.abs(option.change.hp)} HP` : null, option.change.potions ? `+${option.change.potions} ${option.change.potions === 1 ? 'potion' : 'potions'}` : null].filter(Boolean)
              return (
                <Button key={option.id} variant={option.id === hero.choice!.defaultOptionId ? 'secondary' : 'primary'} pending={choose.pending} busyLabel="Deciding…" disabled={!healthy} onClick={() => (option.change.gold < 0 || option.change.hp < 0 ? setAsk({ kind: 'choice', optionId: option.id }) : choose.run({ optionId: option.id }, 'Decided.'))}>
                  {/* The stakes sit on their own small line, so a long option never wraps mid-figure in the pixel face. */}
                  <span className="flex flex-col items-center gap-1">{option.label}{parts.length ? <>{' '}<span className="label-px">{parts.join(', ')}</span></> : null}</span>
                </Button>
              )
            })}
          </div>
          <p className="text-sm text-muted">Decides itself in {hero.choice.ticksLeft === 1 ? 'one adventure' : `${hero.choice.ticksLeft} adventures`}: {hero.choice.options.find((option) => option.id === hero.choice!.defaultOptionId)?.label ?? 'the default'}.</p>
        </section>
      ) : null}

      {hero.todo ? <TodoCard todo={hero.todo} biomes={hero.biomes} healthy={healthy} notify={notify} /> : locked('todo') ? <LockedCard title="To-do list" glyph="todo" level={locked('todo')!.level} blurb="Three small jobs a day from the morning stand-up, which your hero ticks off by itself for a little gold." /> : null}

      {hero.stances.length > 0 && locked('stances') ? <LockedCard title="Stance" glyph="shield" level={locked('stances')!.level} blurb="Cautious, Balanced or Bold: how far your hero pushes before it rests. Balanced until then." /> : null}
      {hero.stances.length > 0 && !locked('stances') ? (
        <section aria-labelledby="stance-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <SectionTitle id="stance-title" glyph="shield" tone="text-sky-ink">Stance</SectionTitle>
            <p className="text-sm text-muted">Applies from the next adventure.</p>
          </div>
          {/* One segmented row, like the ranking period: the chosen cell is pressed and its rule reads underneath. */}
          {/* Toggle buttons, like the ranking period: each is one Tab stop, and a busy choice keeps its focus (aria-disabled). */}
          <div role="group" aria-label="Stance" className="flex border-2 border-edge">
            {hero.stances.map((option) => {
              const chosen = option.id === hero.stance
              return (
                <button key={option.id} type="button" aria-pressed={chosen} aria-disabled={stance.pending || undefined} disabled={!healthy} onClick={() => { if (chosen || stance.pending) return; setAsk({ kind: 'stance', id: option.id }) }} className={`menu-cursor flex min-h-11 flex-1 items-center justify-center px-2 py-2 label-px not-last:border-r-2 not-last:border-edge not-aria-pressed:before:hidden ${chosen ? 'bg-navy text-gold' : 'text-muted hover:bg-rule hover:text-ink active:bg-rule active:text-ink disabled:text-muted'}`}>
                  {option.name}
                </button>
              )
            })}
          </div>
          {chosenStance ? (
            <p className="min-h-10 text-sm" aria-live="polite">
              <strong>{chosenStance.name}.</strong> {chosenStance.blurb}{' '}
              <span className="text-muted tabular-nums">Potion below {chosenStance.potionBelowPct}% · rest below {chosenStance.restBelowPct}% · back out at {chosenStance.resumeAtPct}% · {chosenStance.victoryXpPct}% XP from wins{chosenStance.raidsPerDay !== undefined && chosenStance.raidWinPct !== undefined ? ` · ${raidPace(chosenStance.raidsPerDay)}, wins ${chosenStance.raidWinPct}% of raids against Balanced` : ''}.</span>
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="map-title">
        <SectionTitle id="map-title" glyph="pin" tone="text-sky-ink">World map</SectionTitle>
        {/* Phones get one row per world (number, name, status, Travel); from 640px the three tiles sit side by side on their dashed path. */}
        <ol className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-[15px]">
          {hero.biomes.map((biome, index) => {
            const here = biome.id === hero.biomeId
            const onTheWay = biome.id === hero.targetBiomeId
            return (
              <li key={biome.id} aria-current={here ? 'location' : undefined} className={`relative flex min-w-0 items-center gap-3 px-3 py-2 sm:flex-col sm:items-stretch sm:gap-1 sm:p-4 sm:not-last:after:absolute sm:not-last:after:top-1/2 sm:not-last:after:-right-[15px] sm:not-last:after:w-[15px] sm:not-last:after:border-t-4 sm:not-last:after:border-dashed sm:not-last:after:border-gold sm:not-last:after:content-[''] ${biome.unlocked ? `border-[3px] border-night ${BIOME_SWATCH[biome.id] ?? 'bg-panel'}` : 'border-[3px] border-dashed border-faint bg-panel text-muted'} ${here ? 'outline-4 outline-gold' : ''}`}>
                <span className="sr-only">World {index + 1}: </span>
                <span aria-hidden="true" className="hud grid size-7 shrink-0 place-items-center border-[3px] border-night bg-night text-hud-sm text-gold-ink sm:hidden">{index + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col sm:gap-1">
                  <span className="flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
                    <span aria-hidden="true" className="hud hidden size-7 shrink-0 place-items-center border-[3px] border-night bg-night text-hud-sm text-gold-ink sm:grid">{index + 1}</span>
                    <span className="leading-tight [overflow-wrap:normal]">{biome.name}</span>
                  </span>
                  <span className="text-sm font-semibold">{biome.unlocked ? (here ? 'Exploring' : onTheWay ? 'Arriving next adventure' : 'Unlocked') : `Locked until level ${biome.unlockLevel}`}</span>
                </span>
                {biome.unlocked && !here && !onTheWay ? (
                  <Button icon="travel" className="shrink-0 sm:mt-2 sm:self-start" pending={travel.pending} busyLabel="Travelling…" aria-label={travel.pending ? undefined : `Travel to ${biome.name}`} disabled={!canAct} onClick={() => setAsk({ kind: 'travel', biomeId: biome.id })}>
                    Travel
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ol>
        {!canAct && hero.status !== 'travelling' && stopNote ? <p className="mt-3 text-sm text-muted">{stopNote}</p> : null}
      </section>

      <AskSheets ask={ask} hero={hero} close={close} intents={{ pause, travel, stance, choose, potion }} strengths={strengths} />

      <NoticeBar notice={notice} onDismiss={dismiss} />
    </div>
  )
}

type Ask = { kind: 'pause' } | { kind: 'travel'; biomeId: string } | { kind: 'stance'; id: StanceId } | { kind: 'choice'; optionId: string } | { kind: 'potion' }
type Run<A> = { pending: boolean; run: (args: A, message?: string) => Promise<boolean> }
/** D131: one potion strength in the pouch, with the HP one drink restores for this hero. */
type PotionRow = { templateId: string; name: string; healPct: number; heals: number; count: number }

const KNOCKOUT = 'a knockout costs 10% of your gold and about two hours'
const pct = (value: number) => `${value}%`

/**
 * The confirmations for the Hero page's commands that could cost progress or pace. Each says what the action costs and
 * whether it can be undone; only its confirm button commits.
 */
function AskSheets({ ask, hero, close, intents, strengths }: { ask: Ask | null; hero: HeroView; close: () => void; intents: { pause: Run<Record<string, never>>; travel: Run<{ biomeId: string }>; stance: Run<{ stance: StanceId }>; choose: Run<{ optionId: string }>; potion: Run<{ templateId?: string }> }; strengths: readonly PotionRow[] }) {
  const healthy = hero.simulationState !== 'quarantined'
  const here = hero.biomes.findIndex((b) => b.id === hero.biomeId)
  const common = { onClose: close, disabled: !healthy }
  if (ask?.kind === 'pause') {
    return (
      <ConfirmSheet open title="Pause adventures?" confirmLabel="Pause" busyLabel="Pausing…" cancelLabel="Keep adventuring" pending={intents.pause.pending} {...common} onConfirm={async () => { if (await intents.pause.run({}, 'Adventures paused.')) close() }}>
        <PauseConsequences />
      </ConfirmSheet>
    )
  }
  if (ask?.kind === 'travel') {
    const index = hero.biomes.findIndex((b) => b.id === ask.biomeId)
    const destination = hero.biomes[index]
    const current = hero.biomes[here]
    const waiting = (hero.todo?.tasks ?? []).filter((task) => !task.done && task.biomeId === hero.biomeId)
    if (!destination) return null
    return (
      <ConfirmSheet open title={`Travel to the ${destination.name}?`} confirmLabel="Travel" busyLabel="Travelling…" cancelLabel="Stay here" pending={intents.travel.pending} {...common} onConfirm={async () => { if (await intents.travel.run({ biomeId: destination.id }, `Travelling to ${destination.name}. Arrive on the next adventure.`)) close() }}>
        <Consequences>
          <li>The trip takes one adventure (about 15 minutes) with no encounter.</li>
          {index < here ? <li>It is an easier floor than the {current?.name}: fights pay less XP and gold there.</li> : null}
          {/* Office Cubicles (the first floor) is safe; anywhere else a knockout can happen. */}
          {index > here ? <li>Fights are tougher there, and {KNOCKOUT}.</li> : index > 0 ? <li>Outside the Office Cubicles, {KNOCKOUT}.</li> : null}
          {waiting.length > 0 ? <li>{waiting.length === 1 ? 'A to-do task needs' : `${waiting.length} to-do tasks need`} the {current?.name}; {waiting.length === 1 ? 'it waits' : 'they wait'} until your hero is back.</li> : null}
        </Consequences>
      </ConfirmSheet>
    )
  }
  if (ask?.kind === 'stance') {
    const next = hero.stances.find((s) => s.id === ask.id)
    const now = hero.stances.find((s) => s.id === hero.stance)
    if (!next || !now) return null
    return (
      <ConfirmSheet open title={`Switch to ${next.name}?`} confirmLabel={`Go ${next.name}`} busyLabel="Switching…" cancelLabel={`Stay ${now.name}`} pending={intents.stance.pending} {...common} onConfirm={() => { close(); void intents.stance.run({ stance: next.id }, `${next.name} stance from the next adventure.`) }}>
        <p>{next.blurb}</p>
        <Consequences>
          {next.victoryXpPct < now.victoryXpPct ? <li>Wins give <strong>{pct(next.victoryXpPct)} XP</strong> instead of {pct(now.victoryXpPct)}, so your hero levels more slowly.</li> : next.victoryXpPct > now.victoryXpPct ? <li>Wins give {pct(next.victoryXpPct)} XP instead of {pct(now.victoryXpPct)}.</li> : null}
          {next.restBelowPct < now.restBelowPct ? <li>It keeps fighting down to <strong>{pct(next.restBelowPct)} HP</strong> (now {pct(now.restBelowPct)}), so knockouts are more likely outside the Office; {KNOCKOUT}.</li> : null}
          {next.potionBelowPct > now.potionBelowPct ? <li>It drinks potions sooner (below {pct(next.potionBelowPct)} HP instead of {pct(now.potionBelowPct)}), so they run out faster.</li> : null}
          <li>It applies from the next adventure, and you can switch back any time.</li>
        </Consequences>
      </ConfirmSheet>
    )
  }
  if (ask?.kind === 'potion') {
    // D131: which strength to drink. Each row says what it restores now and how many are left.
    return (
      <Sheet open onClose={() => { if (!intents.potion.pending) close() }} label="Drink a potion">
        <SheetTitle>Which potion?</SheetTitle>
        <p className="mt-2 text-sm text-muted tabular-nums">{hero.hp} of {hero.maxHp} HP. Your hero drinks the weakest one that keeps it adventuring; you can pick.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {strengths.map((row) => (
            <li key={row.templateId}>
              <Button className="w-full" variant="secondary" icon="potion" disabled={!healthy} pending={intents.potion.pending} busyLabel="Drinking…" onClick={async () => { if (await intents.potion.run({ templateId: row.templateId }, `${row.name} drunk, +${Math.min(hero.maxHp - hero.hp, row.heals)} HP.`)) close() }}>
                {/* The figures sit on their own small line, as the decision buttons do, so nothing wraps mid-number in the pixel face. */}
                <span className="flex flex-col items-center gap-1">{row.name}<span className="label-px tabular-nums">+{Math.min(hero.maxHp - hero.hp, row.heals)} HP · {row.count} left</span></span>
              </Button>
            </li>
          ))}
        </ul>
        <Button allowOffline variant="secondary" className="mt-3 w-full" disabled={intents.potion.pending} onClick={close}>Not now</Button>
      </Sheet>
    )
  }
  if (ask?.kind === 'choice' && hero.choice) {
    const option = hero.choice.options.find((o) => o.id === ask.optionId)
    if (!option) return null
    const costs = [option.change.gold < 0 ? `${Math.abs(option.change.gold)} gold` : null, option.change.hp < 0 ? `${Math.abs(option.change.hp)} HP` : null].filter(Boolean).join(' and ')
    const gains = [option.change.gold > 0 ? `${option.change.gold} gold` : null, option.change.hp > 0 ? `${option.change.hp} HP` : null, option.change.potions > 0 ? `${option.change.potions} ${option.change.potions === 1 ? 'potion' : 'potions'}` : null].filter(Boolean).join(' and ')
    return (
      <ConfirmSheet open title={`${option.label}?`} confirmLabel={option.label} busyLabel="Deciding…" cancelLabel="Not yet" pending={intents.choose.pending} {...common} onConfirm={async () => { if (await intents.choose.run({ optionId: option.id }, 'Decided.')) close() }}>
        <Consequences>
          <li>This costs <strong>{costs}</strong>{gains ? `, and gives ${gains}` : ''}.</li>
          <li>A decision can't be undone. If you don't answer, “{hero.choice.options.find((o) => o.id === hero.choice!.defaultOptionId)?.label}” happens by itself.</li>
        </Consequences>
      </ConfirmSheet>
    )
  }
  return null
}
