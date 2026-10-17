import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { HERO_NAME_RULE, validateName } from '@trmnl-games/platform'
import { useIntent } from '../../../lib/intent'
import { sexWord, type LifeView } from '../../../lib/paperLives'
import { ActionFeedback, Button, Card } from '../../../lib/ui'

type Notify = (feedback: { error: string | null; message: string | null }) => void

/**
 * The new baby (D182): a girl or a boy, the first name and, for a first generation, the surname, with the parents
 * the story was born to. Open while the life is an infant (ages 0 to 5), and before TRMNL is saved, so it is the first
 * thing a new player can do.
 */
export function BabySetup({ view, notify, waiting = false }: { view: LifeView; notify?: Notify; waiting?: boolean }) {
  const life = view.life!
  const [first, setFirst] = useState(life.first)
  const [last, setLast] = useState(life.last)
  const rename = useIntent(api.paperLives.lives.rename, notify ? { onFeedback: notify } : {})
  const sex = useIntent(api.paperLives.lives.setPronouns, notify ? { onFeedback: notify } : {})
  const firstChecked = validateName(first, HERO_NAME_RULE)
  const lastChecked = validateName(last, HERO_NAME_RULE)
  const changed = first.trim() !== life.first || (life.canRenameLast && last.trim() !== life.last)
  const valid = firstChecked.ok && (!life.canRenameLast || lastChecked.ok)
  const parents = (view.people ?? []).filter((p) => p.role === 'parent' && p.alive)
  const save = () => {
    if (!firstChecked.ok || (life.canRenameLast && !lastChecked.ok)) return
    const surname = life.canRenameLast && lastChecked.ok ? lastChecked.value : undefined
    void rename.run({ first: firstChecked.value, ...(surname ? { last: surname } : {}) }, `Named ${firstChecked.value} ${surname ?? life.last}.`)
  }
  return (
    <Card title={waiting ? 'Your baby is on the way' : 'Your baby'}>
      <p className="text-sm">
        {parents.length > 0 ? <>Born to {parents.map((p, i) => <span key={p.id}>{i > 0 ? ' and ' : ''}<strong>{p.name}</strong>{p.label ? <span className="text-muted"> ({p.label.toLowerCase()})</span> : null}</span>)}. </> : null}
        Choose a girl or a boy and a name. You can change these until school starts at six.
      </p>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">A girl or a boy</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['she', 'he'] as const).map((choice) => (
            <Button key={choice} variant={life.pronouns === choice ? 'primary' : 'secondary'} aria-pressed={life.pronouns === choice} disabled={sex.pending} onClick={() => { if (life.pronouns !== choice) void sex.run({ pronouns: choice }, choice === 'she' ? 'A girl.' : 'A boy.') }}>
              {choice === 'she' ? 'Girl' : 'Boy'}
            </Button>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">First name</span>
          <input value={first} onChange={(event) => setFirst(event.target.value)} maxLength={HERO_NAME_RULE.max} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" />
          {!firstChecked.ok && first !== life.first ? <span className="text-sm text-hp-ink">{firstChecked.reason}</span> : null}
        </label>
        {life.canRenameLast ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Surname</span>
            <input value={last} onChange={(event) => setLast(event.target.value)} maxLength={HERO_NAME_RULE.max} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" />
            {!lastChecked.ok && last !== life.last ? <span className="text-sm text-hp-ink">{lastChecked.reason}</span> : null}
          </label>
        ) : null}
      </div>
      <div className="mt-3">
        <Button variant="secondary" disabled={!valid || !changed} pending={rename.pending} onClick={save}>Save name</Button>
      </div>
      {life.pronouns === 'they' ? null : <p className="mt-3 text-sm text-muted">{life.first} is a {sexWord(life.pronouns, life.age)}.</p>}
      {notify ? null : <ActionFeedback error={rename.error ?? sex.error} message={rename.message ?? sex.message} />}
    </Card>
  )
}
