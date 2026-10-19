import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { Named, namesIn, ROLE_LABEL, STEP_LABEL, type LifeView, type Role } from '../../../lib/paperLives'
import { Card, Meter } from '../../../lib/ui'

/** People (paper-lives.md "Companion"): each person with their relationship meter and history, the pet, and the dead under a rule. */
export const Route = createFileRoute('/app/paper-lives/people')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.lives.view, {})),
  component: PeoplePage,
})

const ORDER: readonly Role[] = ['partner', 'child', 'grandchild', 'parent', 'sibling', 'friend', 'colleague', 'former_partner']

function PeoplePage() {
  const { data } = useQuery(convexQuery(api.paperLives.lives.view, {}))
  const view = data as LifeView | undefined
  if (!view?.life) return null
  const people = view.people ?? []
  const byOrder = (a: { role: Role }, b: { role: Role }) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role)
  const living = people.filter((p) => p.alive).sort(byOrder)
  const dead = people.filter((p) => !p.alive).sort(byOrder)
  const names = namesIn(view)
  const label = (person: (typeof people)[number]) => person.label ?? (person.step ? STEP_LABEL[person.step] : ROLE_LABEL[person.role])
  return (
    <>
      <h1 className="font-display text-3xl font-bold">People</h1>
      {living.length === 0 && !view.pet ? <p className="text-muted">No one yet. People will come into {view.life?.first}’s life as the years go by.</p> : null}
      <ul className="flex flex-col gap-4">
        {living.map((person) => (
          <li key={person.id}>
            <Card>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-bold">{person.name}</h2>
                <span className="text-sm text-muted"><span className="font-semibold text-ink">{label(person)}</span> · {person.age < 0 ? 'due soon' : `age ${person.age}`}</span>
              </div>
              <div className="mt-2"><Meter label="Relationship" value={person.relationship} max={100} tone="gold" /></div>
              {person.history.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1 text-sm">{person.history.map((line, i) => <li key={i}><Named text={line} names={names} /></li>)}</ul>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
      {view.pet ? (
        <Card title={view.pet.name}>
          <p className="text-sm text-muted">{view.pet.kind} · age {view.pet.age}</p>
          <div className="mt-2"><Meter label="Fondness" value={view.pet.relationship} max={100} tone="gold" /></div>
        </Card>
      ) : null}
      {dead.length > 0 ? (
        <section aria-labelledby="remembered" className="flex flex-col gap-3 border-t-2 border-rule pt-4">
          <h2 id="remembered" className="font-display text-xl font-bold">Remembered</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {dead.map((person) => (
              <li key={person.id}><strong>{person.name}</strong> <span className="text-muted">· {label(person)}</span>{person.history.at(-1) ? <span className="block text-muted">{person.history.at(-1)}</span> : null}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
