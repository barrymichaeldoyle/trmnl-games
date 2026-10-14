import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import type { PortraitKey } from '@trmnl-games/paper-lives/art/portrait'
import { preload } from '../../../lib/preload'
import { Portrait } from '../../../lib/paperLives'
import { Card } from '../../../lib/ui'

/** The Album (paper-lives.md "Companion"): finished lives newest first, the family tree, and the lives of players you follow. */
export const Route = createFileRoute('/app/paper-lives/album')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.album.view, {})),
  component: AlbumPage,
})

type Album = {
  alias: string
  publicProfile: boolean
  lives: Array<{ ordinal: number; name: string; age: number; generation: number; generationLabel: string; epitaph: string; highlights: string[]; traits: string[]; endedAt: number; portrait: PortraitKey; parentOrdinal: number | null }>
  tree: Array<{ ordinal: number; name: string; age: number; depth: number; parentOrdinal: number | null }>
  following: Array<{ alias: string; name: string; age: number; job: string | null; status: string }>
} | null

function AlbumPage() {
  const { data } = useQuery(convexQuery(api.paperLives.album.view, {}))
  const album = data as Album | undefined
  if (!album) return null
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Album</h1>
      {album.lives.length === 0 ? <p className="text-muted">No finished lives yet. When a life ends, it becomes a page here with its epitaph and the moments that mattered.</p> : null}
      <ul className="flex flex-col gap-4">
        {album.lives.map((life) => (
          <li key={life.ordinal}>
            <Card>
              <div className="flex flex-wrap items-start gap-4">
                <Portrait portrait={life.portrait} scale={2} label={`${life.name}, in a frame`} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-bold">{life.name}</h2>
                  <p className="text-sm text-muted">Lived to {life.age} · {life.generationLabel}</p>
                  <p className="mt-2">{life.epitaph}</p>
                  <p className="mt-1 text-sm text-muted">{life.traits.join(' · ')}</p>
                </div>
              </div>
              {life.highlights.length > 0 ? (
                <details className="mt-3">
                  <summary className="min-h-11 cursor-pointer py-2 font-semibold">The moments that mattered</summary>
                  <ol className="flex flex-col gap-1 text-sm">{life.highlights.map((line, i) => <li key={i}>{line}</li>)}</ol>
                </details>
              ) : null}
              {album.publicProfile ? <Link to="/profile/$alias/lives/$n" params={{ alias: album.alias, n: String(life.ordinal) }} className="mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Public page</Link> : null}
            </Card>
          </li>
        ))}
      </ul>
      {album.tree.length > 0 ? (
        <Card title="Family tree">
          <p className="mb-3 text-sm text-muted">Each child who carried the story on sits under the life before.</p>
          <ul className="flex flex-col gap-1">
            {album.tree.map((row) => (
              <li key={row.ordinal} className="text-sm" style={{ paddingLeft: `${Math.min(row.depth, 8) * 1}rem` }}>
                {row.depth > 0 ? <span aria-hidden="true" className="text-muted">└ </span> : null}<strong>{row.name}</strong> <span className="text-muted">· {row.age}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card title="Following">
        {album.following.length === 0 ? (
          <p className="text-sm text-muted">Follow a player from their public profile and their current life shows here.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {album.following.map((row) => (
              <li key={row.alias} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2 last:border-b-0">
                <span><strong>{row.name}</strong> <span className="text-sm text-muted">· {row.status === 'ended' ? 'a life remembered' : `age ${row.age}${row.job ? `, ${row.job.toLowerCase()}` : ''}`}</span></span>
                <Link to="/profile/$alias" params={{ alias: row.alias }} className="text-sm underline underline-offset-4">{row.alias}</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
