import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { HERO_NAME_RULE, validateName } from '@trmnl-games/platform'
import { captureAnalytics } from '../../../lib/analytics'
import { useIntent } from '../../../lib/intent'
import { LocalTime, useHydrated } from '../../../lib/localTime'
import { preload } from '../../../lib/preload'
import { money, Named, namesIn, Portrait, STAGE_LABEL, type LifeView } from '../../../lib/paperLives'
import { ActionFeedback, Button, Card, Meter, NoticeBar, useNotice } from '../../../lib/ui'

/** The Life page (paper-lives.md "Companion"): the character, the year card and its decision, the memorial and the next life, the recent story. */
export const Route = createFileRoute('/app/paper-lives/')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.lives.view, {})),
  component: LifePage,
})

const clock = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const time = (at: number) => <LocalTime at={at} format={clock} />
const SEASON = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' } as const
/** "in 1 h 20 min" until a moment, kept current each minute; hidden until the browser owns the page. */
function Until({ at }: { at: number }) {
  const hydrated = useHydrated()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  if (!hydrated) return null
  const minutes = Math.max(1, Math.ceil((at - now) / 60_000))
  const hours = Math.floor(minutes / 60)
  return <span className="text-muted">({hours > 0 ? `in ${hours} h ${minutes % 60} min` : `in ${minutes} min`})</span>
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth']

/** How far into the year Age up was pressed, in bands of the year's two-hour minimum (eight ticks). */
const elapsedBand = (ticks: number) => (ticks < 8 ? 'under 2 hours' : ticks < 16 ? '2 to 4 hours' : ticks < 24 ? '4 to 6 hours' : '6 hours or more')

function LifePage() {
  const { data } = useQuery(convexQuery(api.paperLives.lives.view, {}))
  const { notice, notify, dismiss } = useNotice()
  const choose = useIntent(api.paperLives.lives.choose, { onFeedback: notify })
  const ageUp = useIntent(api.paperLives.lives.ageUp, { onFeedback: notify })
  const [agedFrom, setAgedFrom] = useState<number | null>(null)
  const view = data as LifeView | undefined
  const life = view?.life
  if (!view || !life) return null
  const year = view.year ?? null
  const decision = year?.decision ?? null
  const ended = life.status === 'ended'
  const names = namesIn(view)
  // A year is ready once its two-hour minimum is reached at the next tick; Age up then ends it on the spot.
  const ready = year !== null && year.elapsed + 1 >= year.minimum
  const lastYear = agedFrom !== null && life.age === agedFrom + 1 ? (view.logs ?? []).filter((log) => log.age === agedFrom && (log.kind === 'event' || log.kind === 'decision_resolved' || log.kind === 'check')).reverse() : null
  const generation = `${ORDINALS[life.generation - 1] ?? `${life.generation}th`} generation`
  return (
    <>
      <section aria-labelledby="life-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 id="life-title" className="font-display text-3xl font-bold">{life.first} {life.last}</h1>
          <span className="text-sm text-muted">{ended ? <>Died at {life.age}</> : <>Age {life.age} · {STAGE_LABEL[life.stage]}</>} · {generation}</span>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Portrait portrait={life.portrait} scale={4} label={`${life.first} ${life.last}${ended ? ', in a frame' : `, aged ${life.age}`}`} />
          <ul className="flex flex-wrap gap-2" aria-label="Traits">
            {life.traits.map((trait) => (
              <li key={trait.id} className="border-2 border-edge px-2 py-1 text-sm" title={trait.blurb}><strong>{trait.name}</strong></li>
            ))}
          </ul>
        </div>
        {!ended ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Meter label="Health" value={life.stats.health} max={100} tone="hp" />
            <Meter label="Happiness" value={life.stats.happiness} max={100} tone="gold" />
            <Meter label="Smarts" value={life.stats.smarts} max={100} tone="sky" />
            <Meter label="Charm" value={life.stats.charm} max={100} tone="xp" />
          </div>
        ) : null}
        {!ended ? <p className="text-sm"><span className="text-muted">Money</span> <strong className="tabular-nums">{money(life.gold)}</strong></p> : null}
      </section>

      {life.canRename && !ended ? <FirstYear view={view} notify={notify} /> : null}

      {ended ? <Memorial view={view} notify={notify} /> : null}

      {!ended && life.stage === 'infant' ? (
        <Card title="The first years">
          <p>The first six years pass quickly, one every fifteen minutes. School starts at six, and the first decisions come after that.</p>
        </Card>
      ) : null}

      {!ended && life.status === 'paused' ? (
        <Card title="Life paused">
          <p>No years pass while the life is paused. <Link to="/app/paper-lives/settings" className="underline underline-offset-4">Resume on the More page</Link>.</p>
        </Card>
      ) : null}

      {lastYear !== null ? (
        <Card title={`${life.first} is ${life.age}`}>
          {lastYear.length > 0 ? (
            <>
              <p className="text-sm text-muted">Age {agedFrom}, looking back:</p>
              <ol className="mt-2 flex flex-col gap-1 text-sm">{lastYear.map((log) => <li key={log.id}><Named text={log.summary} names={names} /></li>)}</ol>
            </>
          ) : <p className="text-sm text-muted">A quiet year, and a new one begins.</p>}
          <div className="mt-3"><Button variant="quiet" onClick={() => setAgedFrom(null)}>Carry on</Button></div>
        </Card>
      ) : null}

      {year && life.status === 'living' ? (
        <Card title={`Age ${life.age}, ${year.yearEnd ? 'the year’s end' : SEASON[year.season].toLowerCase()}`}>
          {decision ? (
            <div className="flex flex-col gap-3">
              <p className="text-lg font-semibold"><Named text={decision.prompt} names={names} />{decision.major ? <span className="ml-2 align-middle text-sm font-normal text-gold-ink">A big decision</span> : null}</p>
              <ul className="flex flex-col gap-2">
                {decision.options.map((option) => {
                  const chosen = (decision.chosen ?? null) === option.id
                  return (
                    <li key={option.id} className="flex flex-col gap-1">
                      <Button
                        variant={chosen ? 'primary' : 'secondary'}
                        aria-pressed={chosen}
                        disabled={!option.open || choose.pending}
                        onClick={() => { if (!chosen) void choose.run({ decisionId: decision.id, optionId: option.id }, `Choice saved. It happens when the year ends.`).then((done) => { if (done) captureAnalytics('decision chosen', { major: decision.major }) }) }}
                      >
                        {option.label}
                      </Button>
                      {!option.open && option.reason ? <span className="text-sm text-muted">{option.reason}</span> : null}
                      {option.id === decision.default && !decision.chosen ? <span className="text-sm text-muted">What happens if you choose nothing.</span> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p>No decision this year.</p>
          )}
          <div className="mt-4 flex flex-col gap-2 border-t border-rule pt-3">
            {ready ? (
              <>
                <div>
                  <Button pending={ageUp.pending} busyLabel="Ageing up…" onClick={() => { const from = life.age; void ageUp.run({}, 'A new year begins.').then((done) => { if (done) { setAgedFrom(from); captureAnalytics('aged up', { elapsed: elapsedBand(year.elapsed) }) } }) }}>Age up to {life.age + 1}</Button>
                </div>
                <p className="text-sm text-muted">Everything this year had in store has happened. Age up now, or the year closes by itself at {time(year.closesAt)}{decision && !decision.chosen ? ', with the gentle choice' : ''}.</p>
              </>
            ) : year.ageUpRequested ? (
              <p className="text-sm"><span className="font-semibold">Age up is queued for {time(year.minimumAt)}</span> <Until at={year.minimumAt} />. The rest of the year happens first, so nothing is skipped.</p>
            ) : (
              <>
                <div>
                  <Button variant="secondary" pending={ageUp.pending} onClick={() => void ageUp.run({}, 'Queued. The birthday comes once the year is ready.').then((done) => { if (done) captureAnalytics('aged up', { elapsed: elapsedBand(year.elapsed) }) })}>Queue Age up</Button>
                </div>
                <p className="text-sm text-muted">This year is still happening. It is ready to end at {time(year.minimumAt)} <Until at={year.minimumAt} />, and closes by itself at {time(year.closesAt)} if you are away.</p>
              </>
            )}
            <ActionFeedback error={ageUp.error ?? choose.error} message={null} />
          </div>
        </Card>
      ) : null}

      {life.recap && !ended ? <p className="text-sm"><span className="text-muted">Last year:</span> <Named text={life.recap.replace(/^Age \d+: /, '')} names={names} /></p> : null}

      <Card title="The story so far">
        {(view.logs ?? []).every((log) => log.kind === 'decision_offered' || log.kind === 'ambient') ? <p className="text-muted">Nothing yet. The first lines arrive within fifteen minutes.</p> : null}
        <ol className="flex flex-col gap-2">
          {(view.logs ?? []).filter((log) => log.kind !== 'decision_offered' && log.kind !== 'ambient').slice(0, 20).map((log) => (
            <li key={log.id} className={`flex gap-3 text-sm ${log.kind === 'recap' ? 'text-muted' : ''}`}>
              <span className="w-8 shrink-0 text-right tabular-nums text-muted">{log.kind === 'recap' ? '' : log.age}</span>
              <span className={`min-w-0 ${log.remarkable || log.major ? 'font-semibold' : ''}`}><Named text={log.summary} names={names} /></span>
            </li>
          ))}
        </ol>
      </Card>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

/** The first year: the first name can change and pronouns can be chosen, until the first year closes. */
function FirstYear({ view, notify }: { view: LifeView; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const life = view.life!
  const [first, setFirst] = useState(life.first)
  const rename = useIntent(api.paperLives.lives.rename, { onFeedback: notify })
  const pronouns = useIntent(api.paperLives.lives.setPronouns, { onFeedback: notify })
  const checked = validateName(first, HERO_NAME_RULE)
  return (
    <Card title="Name and pronouns">
      <p className="text-sm text-muted">You can change these until the first year closes.</p>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-sm font-semibold">First name</span>
        <input value={first} onChange={(event) => setFirst(event.target.value)} maxLength={HERO_NAME_RULE.max} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" />
      </label>
      {!checked.ok && first !== life.first ? <p className="mt-1 text-sm text-hp-ink">{checked.reason}</p> : null}
      <div className="mt-3">
        <Button variant="secondary" disabled={!checked.ok || first.trim() === life.first} pending={rename.pending} onClick={() => { if (checked.ok) void rename.run({ first: checked.value }, `Named ${checked.value}.`) }}>Save name</Button>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Pronouns</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['they', 'she', 'he'] as const).map((choice) => (
            <Button key={choice} variant={life.pronouns === choice ? 'primary' : 'secondary'} aria-pressed={life.pronouns === choice} disabled={pronouns.pending} onClick={() => { if (life.pronouns !== choice) void pronouns.run({ pronouns: choice }, 'Pronouns saved.') }}>
              {choice === 'they' ? 'They' : choice === 'she' ? 'She' : 'He'}
            </Button>
          ))}
        </div>
      </fieldset>
    </Card>
  )
}

/** The memorial and the next life: one of the children, the oldest first, or a stranger at birth. */
function Memorial({ view, notify }: { view: LifeView; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const memorial = view.memorial
  const begin = useIntent(api.paperLives.lives.begin, { onFeedback: notify })
  if (!memorial) return null
  const heirs = [...memorial.heirs].sort((a, b) => b.age - a.age)
  return (
    <>
      <Card title="In memory">
        {memorial.epitaph ? <p className="font-display text-xl">{memorial.epitaph}</p> : null}
        {memorial.line ? <p className="mt-2 text-muted">{memorial.line}</p> : null}
      </Card>
      <Card title="The next life">
        {!memorial.recorded ? (
          <p>The album is being written. The next life can begin in a moment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {heirs.length > 0 ? <p>Carry on as one of the children, with the family name and what the will left them, or start again as a stranger.</p> : <p>There is no child to carry on, so the next life starts as a stranger, at birth.</p>}
            <ul className="flex flex-col gap-2">
              {heirs.map((heir) => (
                <li key={heir.id}><Button variant="secondary" pending={begin.pending} onClick={() => void begin.run({ kind: 'child', personId: heir.id }, `${heir.name} takes up the story.`)}>Carry on as {heir.name}, {heir.age}</Button></li>
              ))}
              <li><Button variant={heirs.length > 0 ? 'quiet' : 'primary'} pending={begin.pending} onClick={() => void begin.run({ kind: 'stranger' }, 'A new life begins.')}>Start a stranger’s life</Button></li>
            </ul>
            <ActionFeedback error={begin.error} message={null} />
          </div>
        )}
      </Card>
    </>
  )
}
