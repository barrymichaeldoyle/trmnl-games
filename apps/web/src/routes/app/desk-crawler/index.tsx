import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { useIntent } from '../../../lib/intent'
import { BUTTON_PRIMARY, Button, LoadingState, Meter, NoticeBar, useFocusWithin, useNotice } from '../../../lib/ui'
import { BIOME_SWATCH } from '../../../lib/palette'
import { preload } from '../../../lib/preload'
import { Glyph, SectionTitle } from '../../../lib/glyphs'
import { ReturnNudge } from './-recap'
import { GameScreen } from './-gameScreen'
import { latestLogQuery } from './-queries'
import { KeepsakeCallout } from './-keepsakes'
import { TodoCard, type TodoView } from './-todo'
import { ComingUp, GoalCard, type CareerView, type UnlockView } from './-career'
import { ConfirmSheet, Consequences } from './-confirm'
import { Sheet, SheetTitle } from './-bagSlots'
import { AlertNudge } from './-alerts'
import { RosterCard } from './-rosterCard'
import { WhatsNewCard } from './-whatsNew'
import { IdleAnglerNote } from './-idleAnglerNote'
import { messagesFor, useT } from '../../../lib/i18n'
import { headMessages } from '../../../i18n/heads'
import { useContent } from '../../../lib/useContent'
import { dcHeroMessages } from '../../../i18n/dcHero'

export const Route = createFileRoute('/app/desk-crawler/')({
  // D180: a keepsake QR's six digits, collected by the callout and then dropped from the address.
  validateSearch: (search: Record<string, unknown>): { keepsake?: string } => (typeof search.keepsake === 'string' && /^\d{6}$/.test(search.keepsake) ? { keepsake: search.keepsake } : typeof search.keepsake === 'number' && Number.isInteger(search.keepsake) && search.keepsake >= 0 && search.keepsake < 1e6 ? { keepsake: String(search.keepsake).padStart(6, '0') } : {}),
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).dcHero, index: false, locale }),
  loader: ({ context }) =>
    preload(context, convexQuery(api.heroes.mine, {}), convexQuery(api.inventory.mine, {}), convexQuery(api.heroes.returnSummary, {}), convexQuery(api.keepsakes.mine, {}), latestLogQuery()),
  component: HeroHome,
})

type Biome = { id: string; name: string; unlocked: boolean; unlockLevel: number; safe: boolean }

/**
 * The game screen leads, after an unclaimed weekly keepsake's callout (a
 * reason to go and look at the TRMNL): the hero's scene in colour under a
 * platformer HUD, the current goal (P35), then the few commands the game asks for, the to-do list, the stance and the world map.
 * What happened lives on the Log tab, standing on Ranks, and the rest behind More (D124): on a phone this page
 * was seven screens tall when it held all of it.
 */
function HeroHome() {
  const { keepsake: scanned } = Route.useSearch()
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const { data: bag } = useQuery(convexQuery(api.inventory.mine, {}))
  const t = useT(dcHeroMessages)
  if (!hero) return <LoadingState label={t.loading} />
  const biomeName = hero.biomes.find((b: Biome) => b.id === hero.biomeId)?.name ?? ''
  const targetName = hero.biomes.find((b: Biome) => b.id === hero.targetBiomeId)?.name ?? ''
  const bagReady = (bag as { canResume?: boolean } | undefined)?.canResume === true

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {/* The page's title for assistive tech, ahead of the keepsake callout; the game screen's HUD names the hero visibly. */}
      <h1 className="sr-only">{t.yourHero(hero.name)}</h1>
      <KeepsakeCallout scanned={scanned} />
      <PlaylistNudge activatedAt={hero.activatedAt} screenServed={hero.screenServed} />
      <GameScreen hero={{ ...hero, biomeName, targetName, bagReady }} />
      <ReturnNudge />
      <IdleAnglerNote />
      <WhatsNewCard />
      <HeroSheet hero={hero} />
    </div>
  )
}

/** How long after the Save the Hero page reminds a new player to add the plugin to a playlist. */
const PLAYLIST_NUDGE_MS = 48 * 3_600_000

/**
 * TRMNL adds the plugin to a playlist on Save, but the device shows it only when the playlist comes round to it, and a
 * new player can take the wait for a fault. For two days after the Save, and only until TRMNL first fetches the screen,
 * the Hero page points at what to check.
 */
function PlaylistNudge({ activatedAt, screenServed }: { activatedAt?: number | null; screenServed?: boolean }) {
  const t = useT(dcHeroMessages)
  if (screenServed || !activatedAt || Date.now() - activatedAt > PLAYLIST_NUDGE_MS) return null
  return (
    <div className="border-[3px] border-sky px-3 py-2 text-sm">
      <strong className="block text-sky-ink">{t.playlistTitle}</strong>
      <span className="mt-1 block">{t.playlistBody}</span>
      <Link to="/help/desk-crawler" hash="not-on-your-screen" className="mt-1 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t.whatToCheck}</Link>
    </div>
  )
}

// heroes.mine is validated as v.any(), so its shape is read structurally here.
type HeroView = {
  name: string
  activatedAt?: number | null
  screenServed?: boolean
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
  /** D192: false until the player picks a stance; the hero plays Balanced meanwhile. */
  stanceChosen?: boolean
  stances: Stance[]
  raidsEnabled?: boolean
  /** D112: present once the world runs the to-do list and the hero has one. */
  todo?: TodoView | null
  /** P35: the ladder, and which features this level has opened; null under a catalog without them. */
  career?: CareerView | null
  unlocks?: UnlockView | null
  merchantTicksLeft: number | null
  /** D163: a dug-in elite, while one lasts. */
  standoff?: Standoff | null
  wakeAtTick: number | null
  choice: Choice | null
  effects: Array<{ id: string; name: string; blurb: string; kind: 'boon' | 'bane'; ticksLeft: number }>
  /** P37: the hero's class name and the roster in brief; null under a catalog without classes. */
  className?: string
  roster?: { unlockLevel: number; open: boolean; heroes: number; warriorLevel: number | null } | null
  /** D139: today's occasion and the next one on the office calendar; null before the world runs one. */
  calendar?: { today: Occasion | null; next: (Omit<Occasion, 'daysLeft'> & { inDays: number }) | null } | null
}

type Occasion = { id: string; name: string; effect: string | null; daysLeft: number }
type Standoff = { monsterId: string; name: string; hp: number; maxHp: number; hpPct: number; ticksLeft: number }


type Choice = { eventId: string; title: string; prompt: string; expiresAtTick: number; ticksLeft: number; defaultOptionId: string; options: Array<{ id: string; label: string; change: { gold: number; hp: number; potions: number } }> }

type StanceId = 'cautious' | 'balanced' | 'bold'
type Stance = { id: StanceId; name: string; blurb: string; potionBelowPct: number; restBelowPct: number; resumeAtPct: number; victoryXpPct: number; raidsPerDay?: number; raidWinPct?: number }


function HeroSheet({ hero }: { hero: HeroView }) {
  const { data: bag } = useQuery(convexQuery(api.inventory.mine, {}))
  const t = useT(dcHeroMessages)
  const c = useContent()
  // Every command reports into one pinned notice (D98), so nothing under the buttons moves when an action settles.
  const { notice, notify, dismiss } = useNotice()
  const travel = useIntent(api.heroes.changeBiome, { onFeedback: notify })
  const potion = useIntent(api.inventory.usePotion, { onFeedback: notify })
  const resume = useIntent(api.heroes.resume, { onFeedback: notify })
  // The stance is a stored preference: once confirmed it shows as chosen at once, and rolls back if the save fails.
  const stance = useIntent(api.heroes.setStance, {
    onFeedback: notify,
    optimisticUpdate: (store, args) => {
      const current = store.getQuery(api.heroes.mine, {})
      if (current) store.setQuery(api.heroes.mine, {}, { ...current, stance: args.stance, stanceChosen: true })
    },
  })
  const choose = useIntent(api.heroes.choose, { onFeedback: notify })
  const walkAway = useIntent(api.heroes.walkAway, { onFeedback: notify })
  const healthy = hero.simulationState !== 'quarantined'
  const canAct = healthy && (hero.status === 'exploring' || hero.status === 'resting')
  // D118: a travelling hero can drink too, so it arrives ready.
  const canDrink = canAct || (healthy && hero.status === 'travelling')
  // Anything that could set the hero back or slow it down asks first (the to-do swap, travel, a costly decision). Pause lives on the More tab (D191).
  // The stance does not: it applies from the next adventure and switches back any time, and its rule reads under the picker.
  const [ask, setAsk] = useState<Ask | null>(null)
  const close = () => setAsk(null)
  // D131: the strengths in the pouch. One strength drinks at once; more than one opens a picker. The button's figure
  // is what the default drink would do: the smallest potion that heals to full, else the strongest.
  const strengths = ((bag?.potionRows ?? []) as PotionRow[]).filter((row) => row.count > 0)
  const fit = strengths.find((row) => hero.hp + row.heals >= hero.maxHp) ?? strengths.at(-1) ?? null
  const healing = fit === null ? 0 : Math.min(hero.maxHp - hero.hp, fit.heals)
  const potionLabel = t.drinkPotion(healing, bag?.potions ?? 0)
  const drink = () => (strengths.length > 1 ? setAsk({ kind: 'potion' }) : potion.run(fit === null ? {} : { templateId: fit.templateId }, t.potionDrunk(fit === null ? t.potion : fit.name, healing)))
  // D192: nothing is pressed until the player picks; an older backend without the flag reads as chosen.
  const stanceChosen = hero.stanceChosen !== false
  const chosenStance = stanceChosen ? (hero.stances.find((option) => option.id === hero.stance) ?? null) : null
  // D132: what the stance risks where the hero is now; the safe biome turns a knockout into a rescue.
  const here = hero.biomes.find((biome) => biome.id === hero.biomeId)
  const safeBiome = hero.biomes.find((biome) => biome.safe)
  const stanceRisk = here === undefined || safeBiome === undefined ? null : here.safe ? t.stanceRiskSafe(here.name) : t.stanceRisk(safeBiome.name)
  // P35: a feature the hero's level has not reached shows as a locked card where its card will be.
  const locked = (feature: UnlockView[number]['feature']) => hero.unlocks?.find((entry) => entry.feature === feature && !entry.unlocked) ?? null
  // Resume replaces the commands when it succeeds; focus follows to whichever command takes over.
  const commands = useFocusWithin<HTMLElement>(hero.status)

  const bagReady = bag?.canResume === true
  const holding = bag ? { capacity: bag.capacity as number, pouchCap: (bag.pouch?.cap ?? 0) as number, nextBagId: (bag.ladder?.next?.id ?? null) as string | null, nextPouchId: (bag.pouch?.next?.id ?? null) as string | null, nextPrice: (bag.ladder?.next?.id === hero.career?.current?.id ? bag.ladder?.next?.price : bag.pouch?.next?.id === hero.career?.current?.id ? bag.pouch?.next?.price : null) as number | null } : null
  const waking = hero.status === 'sleeping' && hero.wakeAtTick !== null
  const stopNote = hero.status === 'paused' ? t.resumeToTravel : waking || bagReady ? t.resumesNext : hero.status === 'sleeping' ? t.roomToTravel : hero.status === 'dead' ? t.deadTravel : null

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {hero.career ? <GoalCard career={hero.career} level={hero.level} gold={hero.gold} holding={holding} notify={notify} /> : null}
      {hero.roster ? <RosterCard roster={hero.roster} name={hero.name} className={hero.className ?? 'Warrior'} /> : null}
      <section ref={commands} aria-labelledby="commands-title" className="flex flex-col gap-2">
        {/* The keys sit under their own small heading, so one lone key never floats between the goal and the effects. */}
        <h2 id="commands-title" className="caps text-sm text-muted">{t.commands}</h2>
        {canDrink || hero.status === 'paused' || (hero.status === 'sleeping' && !waking && !bagReady) ? (
          // Full-width keys stacked on phones so their edges line up; a row from 640px.
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {hero.status === 'sleeping' && !waking && bag && !bagReady ? (
              <Link to="/app/desk-crawler/inventory" className={`inline-flex min-h-11 items-center justify-center gap-2.5 px-4 ${BUTTON_PRIMARY}`}>
                <Glyph name="bag" />{t.openBag}
              </Link>
            ) : null}
            {hero.status === 'paused' ? (
              <Button icon="play" pending={resume.pending} busyLabel={t.resuming} disabled={!healthy} onClick={() => resume.run({}, t.resumed)}>
                {t.resume}
              </Button>
            ) : null}
            {/* D156: only when a drink would heal; at full health or with an empty pouch there is no dead button. */}
            {canDrink && hero.hp < hero.maxHp && bag?.potions ? (
              <Button icon="potion" pending={potion.pending} busyLabel={t.drinking} onClick={drink}>
                {potionLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
        {hero.effects.length > 0 || hero.calendar?.today || hero.calendar?.next ? (
          <ul aria-label={t.effects} className="flex flex-wrap gap-2 text-sm">
            {/* D139: today's occasion leads the effects, with its one plain bonus. */}
            {hero.calendar?.today ? <li className="border-[3px] border-gold px-2 py-1"><strong>{c.text(hero.calendar.today.name)}</strong>{hero.calendar.today.effect ? ` · ${c.text(hero.calendar.today.effect)}` : ''} · <span className="whitespace-nowrap">{hero.calendar.today.daysLeft === 1 ? t.today : t.daysLeft(hero.calendar.today.daysLeft)}</span></li> : null}
            {hero.effects.map((effect) => <li key={effect.id} className={`border-[3px] px-2 py-1 ${effect.kind === 'bane' ? 'border-hp-ink' : 'border-night'}`}><strong>{c.text(effect.name)}</strong> · {c.text(effect.blurb)} · <span className="whitespace-nowrap">{t.adventuresLeft(effect.ticksLeft)}</span></li>)}
            {/* The next occasion closes the row as a dashed chip, where a sentence of its own read as a stray line; it opens the calendar. */}
            {hero.calendar?.next ? <li><Link to="/help/desk-crawler" hash="office-calendar" className="block border-[3px] border-dashed border-rule px-2 py-1 text-muted"><strong>{c.text(hero.calendar.next.name)}</strong>{hero.calendar.next.effect ? ` · ${c.text(hero.calendar.next.effect)}` : ''} · <span className="whitespace-nowrap">{t.inDays(hero.calendar.next.inDays)}</span></Link></li> : null}
          </ul>
        ) : null}
        {hero.status === 'sleeping' && hero.wakeAtTick === null && !bagReady ? <AlertNudge /> : null}
        {hero.merchantTicksLeft !== null ? <p className="text-sm"><strong>{t.merchantVisiting}</strong> <Link to="/app/desk-crawler/inventory" className="underline underline-offset-4">{t.seeOffers}</Link>{t.withinAdventures(hero.merchantTicksLeft)}</p> : null}
        {!healthy ? <p className="text-sm">{t.serviceCheck}<Link to="/support" className="underline underline-offset-4">{t.contactSupport}</Link>{t.ifItLasts}</p> : null}
      </section>

      {hero.standoff ? <StandoffCard standoff={hero.standoff} status={hero.status} healthy={healthy} pending={walkAway.pending} onWalkAway={() => setAsk({ kind: 'walkAway' })} /> : null}

      {hero.choice ? (
        <section aria-labelledby="choice-title" className="flex flex-col gap-3 border-[3px] border-night bg-panel p-4">
          <SectionTitle id="choice-title" glyph="choice" tone="text-sky-ink" size="text-2xl">{c.text(hero.choice.title)}</SectionTitle>
          <p>{c.text(hero.choice.prompt)}</p>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {hero.choice.options.map((option) => {
              const parts = [option.change.gold ? `${option.change.gold > 0 ? '+' : '−'}${Math.abs(option.change.gold)} ${t.gold}` : null, option.change.hp ? `${option.change.hp > 0 ? '+' : '−'}${Math.abs(option.change.hp)} ${t.hp}` : null, option.change.potions ? `+${option.change.potions} ${t.potions(option.change.potions)}` : null].filter(Boolean)
              return (
                <Button key={option.id} variant={option.id === hero.choice!.defaultOptionId ? 'secondary' : 'primary'} pending={choose.pending} busyLabel={t.deciding} disabled={!healthy} onClick={() => (option.change.gold < 0 || option.change.hp < 0 ? setAsk({ kind: 'choice', optionId: option.id }) : choose.run({ optionId: option.id }, t.decided))}>
                  {/* The stakes sit on their own small line, so a long option never wraps mid-figure in the pixel face. */}
                  <span className="flex flex-col items-center gap-1">{c.text(option.label)}{parts.length ? <>{' '}<span className="label-px">{parts.join(', ')}</span></> : null}</span>
                </Button>
              )
            })}
          </div>
          <p className="text-sm text-muted">{t.decidesItself(hero.choice.ticksLeft, c.text(hero.choice.options.find((option) => option.id === hero.choice!.defaultOptionId)?.label ?? '') || t.theDefault)}</p>
        </section>
      ) : null}

      {hero.todo ? <TodoCard todo={hero.todo} biomes={hero.biomes} healthy={healthy} notify={notify} /> : null}

      {/* D157: locked features are one line for the soonest, not a stack of cards. */}
      <ComingUp unlocks={hero.unlocks} roster={hero.roster} />
      {hero.stances.length > 0 && !locked('stances') ? (
        <section aria-labelledby="stance-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <SectionTitle id="stance-title" glyph="shield" tone="text-sky-ink">{t.stance}</SectionTitle>
            <p className="text-sm text-muted">{t.appliesNext}</p>
          </div>
          {/* One segmented row, like the ranking period: the chosen cell is pressed and its rule reads underneath. */}
          {/* Toggle buttons, like the ranking period: each is one Tab stop, and a busy choice keeps its focus (aria-disabled). */}
          <div role="group" aria-label={t.stance} className="flex border-2 border-edge">
            {hero.stances.map((option) => {
              const chosen = stanceChosen && option.id === hero.stance
              // No sheet: the switch costs nothing and reverses any time, and the rule for the chosen stance reads below.
              const pick = () => void stance.run({ stance: option.id }, t.stanceFromNext(option.name))
              return (
                <button key={option.id} type="button" aria-pressed={chosen} aria-disabled={stance.pending || undefined} disabled={!healthy} onClick={() => { if (chosen || stance.pending) return; pick() }} className={`menu-cursor flex min-h-11 flex-1 items-center justify-center px-2 py-2 label-px uppercase tracking-wide not-last:border-r-2 not-last:border-edge not-aria-pressed:before:hidden ${chosen ? 'bg-navy text-gold' : 'text-muted hover:bg-rule hover:text-ink active:bg-rule active:text-ink disabled:text-muted'}`}>
                  {c.text(option.name)}
                </button>
              )
            })}
          </div>
          {!stanceChosen ? <p className="min-h-10 text-sm" aria-live="polite">{t.noStanceYet}</p> : null}
          {chosenStance ? (
            <p className="min-h-10 text-sm" aria-live="polite">
              <strong>{c.text(chosenStance.name)}.</strong> {c.text(chosenStance.blurb)}{' '}
              <span className="text-muted tabular-nums">{t.stanceRules(chosenStance.potionBelowPct, chosenStance.restBelowPct, chosenStance.resumeAtPct, chosenStance.victoryXpPct)}{chosenStance.raidsPerDay !== undefined && chosenStance.raidWinPct !== undefined ? t.raidWins(t.raidPace(chosenStance.raidsPerDay), chosenStance.raidWinPct) : ''}.</span>
            </p>
          ) : null}
          {stanceRisk ? <p className="text-sm">{stanceRisk}</p> : null}
        </section>
      ) : null}

      <section aria-labelledby="map-title">
        <SectionTitle id="map-title" glyph="pin" tone="text-sky-ink">{t.worldMap}</SectionTitle>
        {/* Phones get one row per world (number, name, status, Travel); from 640px the three tiles sit side by side on their dashed path. */}
        <ol className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-[15px]">
          {hero.biomes.map((biome, index) => {
            // D157: the floors the hero can reach and the next one to open; the rest wait on the Career page.
            if (!biome.unlocked && index !== hero.biomes.findIndex((b) => !b.unlocked)) return null
            const here = biome.id === hero.biomeId
            const onTheWay = biome.id === hero.targetBiomeId
            // D156: the floor's colour lives in its number chip, so a coloured row never passes for a button.
            const chip = biome.unlocked ? BIOME_SWATCH[biome.id] ?? 'bg-night text-gold-ink' : 'bg-night text-faint'
            return (
              <li key={biome.id} aria-current={here ? 'location' : undefined} className={`relative flex min-w-0 items-center gap-3 px-3 py-2 sm:flex-col sm:items-stretch sm:gap-1 sm:p-4 sm:not-last:after:absolute sm:not-last:after:top-1/2 sm:not-last:after:-right-[15px] sm:not-last:after:w-[15px] sm:not-last:after:border-t-4 sm:not-last:after:border-dashed sm:not-last:after:border-gold sm:not-last:after:content-[''] window ${biome.unlocked ? '' : 'text-muted'} ${here ? 'outline-4 outline-gold' : ''}`}>
                <span className="sr-only">{t.world(index + 1)}</span>
                <span aria-hidden="true" className={`hud grid size-7 shrink-0 place-items-center border-[3px] border-night text-hud-sm sm:hidden ${chip}`}>{index + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col sm:gap-1">
                  <span className="flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
                    <span aria-hidden="true" className={`hud hidden size-7 shrink-0 place-items-center border-[3px] border-night text-hud-sm sm:grid ${chip}`}>{index + 1}</span>
                    <span className="leading-tight [overflow-wrap:normal]">{c.name(biome.name)}</span>
                  </span>
                  <span className={`text-sm font-semibold ${here ? 'text-gold-ink' : ''}`}>{biome.unlocked ? (here ? t.youreHere : onTheWay ? t.arrivingNext : t.unlocked) : t.opensAt(biome.unlockLevel)}</span>
                </span>
                {biome.unlocked && !here && !onTheWay ? (
                  <Button icon="travel" className="shrink-0 sm:mt-2 sm:self-start" pending={travel.pending} busyLabel={t.travelling} aria-label={travel.pending ? undefined : t.travelTo(biome.name)} disabled={!canAct} onClick={() => setAsk({ kind: 'travel', biomeId: biome.id })}>
                    {t.travel}
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ol>
        {!canAct && hero.status !== 'travelling' && stopNote ? <p className="mt-3 text-sm text-muted">{stopNote}</p> : null}
      </section>

      <AskSheets ask={ask} hero={hero} close={close} intents={{ travel, choose, potion, walkAway }} strengths={strengths} />

      <NoticeBar notice={notice} onDismiss={dismiss} />
    </div>
  )
}

type Ask = { kind: 'travel'; biomeId: string } | { kind: 'choice'; optionId: string } | { kind: 'potion' } | { kind: 'walkAway' }
type Run<A> = { pending: boolean; run: (args: A, message?: string) => Promise<boolean> }
/** D131: one potion strength in the pouch, with the HP one drink restores for this hero. */
type PotionRow = { templateId: string; name: string; healPct: number; heals: number; count: number }


/**
 * The confirmations for the Hero page's commands that could cost progress or pace. Each says what the action costs and
 * whether it can be undone; only its confirm button commits.
 */
function AskSheets({ ask, hero, close, intents, strengths }: { ask: Ask | null; hero: HeroView; close: () => void; intents: { travel: Run<{ biomeId: string; leaveStandoff?: boolean }>; choose: Run<{ optionId: string }>; potion: Run<{ templateId?: string }>; walkAway: Run<Record<string, never>> }; strengths: readonly PotionRow[] }) {
  const healthy = hero.simulationState !== 'quarantined'
  const t = useT(dcHeroMessages)
  const c = useContent()
  const here = hero.biomes.findIndex((b) => b.id === hero.biomeId)
  const common = { onClose: close, disabled: !healthy }
  if (ask?.kind === 'travel') {
    const index = hero.biomes.findIndex((b) => b.id === ask.biomeId)
    const destination = hero.biomes[index]
    const current = hero.biomes[here]
    const waiting = (hero.todo?.tasks ?? []).filter((task) => !task.done && task.biomeId === hero.biomeId)
    if (!destination) return null
    return (
      <ConfirmSheet open title={t.travelTitle(destination.name)} confirmLabel={t.travel} busyLabel={t.travelling} cancelLabel={t.stayHere} pending={intents.travel.pending} {...common} onConfirm={async () => { if (await intents.travel.run({ biomeId: destination.id, ...(hero.standoff ? { leaveStandoff: true } : {}) }, t.travellingTo(destination.name))) close() }}>
        <Consequences>
          {/* D163: travel leaves a dug-in elite behind for good. */}
          {hero.standoff ? <li>{t.leftBehindBefore}<strong>{t.monster(hero.standoff.name)}</strong>{t.leftBehindAfter(hero.standoff.hpPct)}</li> : null}
          <li>{t.tripTakes}</li>
          {index < here ? <li>{t.easierFloor(current?.name ?? '')}</li> : null}
          {/* Office Cubicles (the first floor) is safe; anywhere else a knockout can happen. */}
          {index > here ? <li>{t.tougherThere}</li> : index > 0 ? <li>{t.outsideOffice}</li> : null}
          {waiting.length > 0 ? <li>{t.tasksWait(waiting.length, current?.name ?? '')}</li> : null}
        </Consequences>
      </ConfirmSheet>
    )
  }
  if (ask?.kind === 'potion') {
    // D131: which strength to drink. Each row says what it restores now and how many are left.
    return (
      <Sheet open onClose={() => { if (!intents.potion.pending) close() }} label={t.drinkAPotion}>
        <SheetTitle>{t.whichPotion}</SheetTitle>
        <p className="mt-2 text-sm text-muted tabular-nums">{t.potionPicker(hero.hp, hero.maxHp)}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {strengths.map((row) => (
            <li key={row.templateId}>
              <Button className="w-full" variant="secondary" icon="potion" disabled={!healthy} pending={intents.potion.pending} busyLabel={t.drinking} onClick={async () => { if (await intents.potion.run({ templateId: row.templateId }, t.potionDrunk(row.name, Math.min(hero.maxHp - hero.hp, row.heals)))) close() }}>
                {/* The figures sit on their own small line, as the decision buttons do, so nothing wraps mid-number in the pixel face. */}
                <span className="flex flex-col items-center gap-1">{c.name(row.name)}<span className="label-px tabular-nums">{t.potionRow(Math.min(hero.maxHp - hero.hp, row.heals), row.count)}</span></span>
              </Button>
            </li>
          ))}
        </ul>
        <Button allowOffline variant="secondary" className="mt-3 w-full" disabled={intents.potion.pending} onClick={close}>{t.notNow}</Button>
      </Sheet>
    )
  }
  if (ask?.kind === 'walkAway' && hero.standoff) {
    const standoff = hero.standoff
    return (
      <ConfirmSheet open title={t.walkAwayTitle(standoff.name)} confirmLabel={t.walkAway} busyLabel={t.walkingAway} cancelLabel={t.keepAtIt} pending={intents.walkAway.pending} {...common} onConfirm={async () => { if (await intents.walkAway.run({}, t.walkedAway(standoff.name))) close() }}>
        <Consequences>
          <li>{t.leavesNow(standoff.hpPct)}</li>
          <li>{t.keepsEverything}</li>
        </Consequences>
      </ConfirmSheet>
    )
  }
  if (ask?.kind === 'choice' && hero.choice) {
    const option = hero.choice.options.find((o) => o.id === ask.optionId)
    if (!option) return null
    const costs = [option.change.gold < 0 ? `${Math.abs(option.change.gold)} ${t.gold}` : null, option.change.hp < 0 ? `${Math.abs(option.change.hp)} ${t.hp}` : null].filter(Boolean).join(t.and)
    const gains = [option.change.gold > 0 ? `${option.change.gold} ${t.gold}` : null, option.change.hp > 0 ? `${option.change.hp} ${t.hp}` : null, option.change.potions > 0 ? `${option.change.potions} ${t.potions(option.change.potions)}` : null].filter(Boolean).join(t.and)
    const label = c.text(option.label)
    return (
      <ConfirmSheet open title={t.question(label)} confirmLabel={label} busyLabel={t.deciding} cancelLabel={t.notYet} pending={intents.choose.pending} {...common} onConfirm={async () => { if (await intents.choose.run({ optionId: option.id }, t.decided)) close() }}>
        <Consequences>
          <li>{t.costsBefore}<strong>{costs}</strong>{gains ? t.costsGains(gains) : ''}.</li>
          <li>{t.cantUndo(c.text(hero.choice.options.find((o) => o.id === hero.choice!.defaultOptionId)?.label ?? ''))}</li>
        </Consequences>
      </ConfirmSheet>
    )
  }
  return null
}

/**
 * D163: a dug-in elite on the Hero page: its HP going down, when it leaves, and Walk away. Drinking stays with the
 * commands above; the stance decides when the hero rests between rounds.
 */
function StandoffCard({ standoff, status, healthy, pending, onWalkAway }: { standoff: Standoff; status: string; healthy: boolean; pending: boolean; onWalkAway: () => void }) {
  const fighting = status === 'exploring'
  const t = useT(dcHeroMessages)
  return (
    <section aria-labelledby="standoff-title" className="flex flex-col gap-3 border-[3px] border-night bg-panel p-4">
      <SectionTitle id="standoff-title" glyph="combat" tone="text-hp-ink" size="text-2xl">{t.dugIn(standoff.name)}</SectionTitle>
      <div className="flex flex-col gap-1">
        <Meter label={t.eliteHp(standoff.name)} value={standoff.hp} max={standoff.maxHp} tone="hp" />
        <p className="text-sm">{t.leavesIn(standoff.ticksLeft, t.aboutTime(standoff.ticksLeft))}</p>
      </div>
      <p className="text-sm">{fighting ? t.fightsEvery : t.restingBack}{t.standoffBody}</p>
      <Button variant="secondary" icon="door" className="self-start" disabled={!healthy} pending={pending} busyLabel={t.walkingAway} onClick={onWalkAway}>
        {t.walkAway}
      </Button>
    </section>
  )
}
