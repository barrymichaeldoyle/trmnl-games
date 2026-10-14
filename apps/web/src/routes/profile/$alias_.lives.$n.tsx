import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import type { PortraitKey } from '@trmnl-games/paper-lives/art/portrait'
import { Portrait } from '../../lib/paperLives'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { Card } from '../../lib/ui'

type LifePage = {
  alias: string
  ordinal: number
  name: string
  age: number
  generation: string
  traits: string[]
  epitaph: string
  highlights: string[]
  endedAt: number
  portrait: PortraitKey
  parent: { ordinal: number; name: string } | null
  child: { ordinal: number; name: string } | null
} | null

const pageQuery = (alias: string, n: string) => convexQuery(api.paperLives.public.lifePage, { alias, ordinal: Number(n) })

/** A finished life's public page (D159): the portrait, the age and generation, the epitaph and the highlights. */
export const Route = createFileRoute('/profile/$alias_/lives/$n')({
  loader: async ({ context, params }) => (await context.queryClient.ensureQueryData(pageQuery(params.alias, params.n))) as LifePage,
  head: ({ loaderData, params }) =>
    loaderData
      ? seo({ title: `${loaderData.name}, a life in Paper Lives`, path: `/profile/${encodeURIComponent(loaderData.alias)}/lives/${loaderData.ordinal}`, description: `${loaderData.name}, ${loaderData.generation}, lived to ${loaderData.age}. ${loaderData.epitaph}`, index: false })
      : seo({ title: 'Life not found', path: `/profile/${encodeURIComponent(params.alias)}/lives/${params.n}`, index: false }),
  component: LifePublicPage,
})

function LifePublicPage() {
  const { alias, n } = Route.useParams()
  const { data } = useQuery(pageQuery(alias, n))
  const page = data as LifePage | undefined
  return (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-6 px-4 py-10">
        {page === undefined ? null : page === null ? (
          <>
            <h1 className="font-display text-3xl font-bold">No life here</h1>
            <p>There is no public life at this address. It may be private, or the name may have changed.</p>
          </>
        ) : (
          <>
            <header className="flex flex-col gap-2">
              <h1 className="font-display text-3xl font-bold">{page.name}</h1>
              <p className="text-muted">Lived to {page.age}. {page.generation}.</p>
              <p className="text-sm">From <Link to="/profile/$alias" params={{ alias: page.alias }} className="underline underline-offset-4">{page.alias}</Link>’s album</p>
            </header>
            <Portrait portrait={page.portrait} scale={4} label={`${page.name}, in a frame`} />
            <p className="font-display text-xl">{page.epitaph}</p>
            <p className="text-sm text-muted">{page.traits.join(' · ')}</p>
            {page.highlights.length > 0 ? (
              <Card title="The moments that mattered">
                <ol className="flex flex-col gap-2 text-sm">{page.highlights.map((line, i) => <li key={i}>{line}</li>)}</ol>
              </Card>
            ) : null}
            <nav aria-label="Family" className="flex flex-wrap gap-4 text-sm">
              {page.parent ? <Link to="/profile/$alias/lives/$n" params={{ alias: page.alias, n: String(page.parent.ordinal) }} className="underline underline-offset-4">Child of {page.parent.name}</Link> : null}
              {page.child ? <Link to="/profile/$alias/lives/$n" params={{ alias: page.alias, n: String(page.child.ordinal) }} className="underline underline-offset-4">Carried on by {page.child.name}</Link> : null}
            </nav>
          </>
        )}
      </main>
    </SiteShell>
  )
}
