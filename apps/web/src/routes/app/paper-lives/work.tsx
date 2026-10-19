import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { EDUCATION_LABEL, HOME_LABEL, money, WILL_LABEL, type LifeView } from '../../../lib/paperLives'
import { Card } from '../../../lib/ui'

/** Work and money (paper-lives.md "Companion"): education, the job and its tier, income and living cost as labelled rows, the home and the will once made. */
export const Route = createFileRoute('/app/paper-lives/work')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.lives.view, {})),
  component: WorkPage,
})

function Rows({ rows }: { rows: Array<[string, ReactNode] | null> }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      {rows.filter((row): row is [string, ReactNode] => row !== null).map(([label, value]) => (
        <div key={label} className="contents"><dt className="text-muted">{label}</dt><dd className="min-w-0">{value}</dd></div>
      ))}
    </dl>
  )
}

function WorkPage() {
  const { data } = useQuery(convexQuery(api.paperLives.lives.view, {}))
  const view = data as LifeView | undefined
  const life = view?.life
  const work = view?.work
  if (!life || !work) return null
  const net = work.income - work.livingCost
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Work and money</h1>
      <Card title="Work">
        <Rows rows={[
          ['Education', EDUCATION_LABEL[work.education] ?? work.education],
          ['Job', work.job ? <><strong>{work.job.name}</strong>{work.job.since !== null ? <span className="text-muted"> since age {work.job.since}</span> : null}</> : work.retired ? 'Retired' : life.age < 18 ? 'Too young to work' : 'Between jobs'],
          work.job ? ['Tier', `${work.job.tier} of 5`] : null,
          ['Hobby', work.hobby ?? 'None yet'],
        ]} />
      </Card>
      <Card title="Money">
        <Rows rows={[
          ['Savings', <strong className="tabular-nums">{money(life.gold)}</strong>],
          ['Income a year', <span className="tabular-nums">{money(work.income)}</span>],
          ['Living cost a year', <span className="tabular-nums">{money(work.livingCost)}</span>],
          ['Left over each year', <span className={`tabular-nums ${net < 0 ? 'text-hp-ink' : ''}`}>{net >= 0 ? `+${money(net)}` : money(net)}</span>],
        ]} />
        <p className="mt-3 text-sm text-muted">Savings can dip to -2,000 but never lower.</p>
      </Card>
      <Card title="Home">
        <Rows rows={[
          ['Home', HOME_LABEL[work.home]],
          work.house ? ['House', work.house.charAt(0).toUpperCase() + work.house.slice(1)] : null,
          ['Will', work.will ? WILL_LABEL[work.will] : life.age >= 60 ? 'Not written yet' : 'Can be written from 60'],
        ]} />
      </Card>
    </>
  )
}
