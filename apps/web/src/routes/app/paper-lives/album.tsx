import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import type { PortraitKey } from '@trmnl-games/paper-lives/art/portrait'
import { preload } from '../../../lib/preload'
import { Photos, Portrait, type LifeView, type PhotoView } from '../../../lib/paperLives'
import { Card } from '../../../lib/ui'
import { useAnalyticsView } from '../../../lib/analyticsProvider'
import { PhotoClaim } from './-photos'
import { StoryList } from './-story'

/**
 * The Album (paper-lives.md "Companion"): this week's photo, finished lives newest first with their photos, the family
 * tree, and the lives of players you follow.
 */
export const Route = createFileRoute('/app/paper-lives/album')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.album.view, {}), convexQuery(api.paperLives.photos.mine, {})),
  component: AlbumPage,
})

type Album = {
  alias: string
  publicProfile: boolean
  lives: Array<{ ordinal: number; name: string; age: number; generation: number; generationLabel: string; epitaph: string; highlights: string[]; traits: string[]; endedAt: number; portrait: PortraitKey; photos: PhotoView[]; parentOrdinal: number | null }>
  tree: Array<{ ordinal: number; name: string; age: number; depth: number; parentOrdinal: number | null }>
  following: Array<{ alias: string; name: string; age: number; job: string | null; status: string }>
} | null

function AlbumPage() {
  const { data } = useQuery(convexQuery(api.paperLives.album.view, {}))
  const { data: lifeData } = useQuery(convexQuery(api.paperLives.lives.view, {}))
  const album = data as Album | undefined
  const first = (lifeData as LifeView | undefined)?.life?.first
  useAnalyticsView('album viewed', { lives: album?.lives.length ?? 0 }, Boolean(album))
  if (!album) return null
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Album</h1>
      {first ? <PhotoClaim name={first} /> : null}
      {album.lives.length === 0 ? <p className="text-muted">No finished lives yet. When a life ends, it will get its own page here with an epitaph and key moments.</p> : null}
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
                  <summary className="min-h-11 cursor-pointer py-2 font-semibold">Key moments</summary>
                  <ol className="flex flex-col gap-1 text-sm">{life.highlights.map((line, i) => <li key={i}>{line}</li>)}</ol>
                </details>
              ) : null}
              {life.photos.length > 0 ? <div className="mt-3"><Photos photos={life.photos} label={`Photos of ${life.name}`} /></div> : null}
              <WholeStory ordinal={life.ordinal} name={life.name} />
              {album.publicProfile ? <Link to="/profile/$alias/lives/$n" params={{ alias: album.alias, n: String(life.ordinal) }} className="mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Public page</Link> : null}
            </Card>
          </li>
        ))}
      </ul>
      {album.tree.length > 0 ? (
        <Card title="Family tree">
          <p className="mb-3 text-sm text-muted">Each child who carried on the story appears under their parent.</p>
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
          <p className="text-sm text-muted">Follow players from their public profiles to see their current lives here.</p>
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

/** A finished life's every line, read on request so the album stays light (D182). */
function WholeStory({ ordinal, name }: { ordinal: number; name: string }) {
  const [open, setOpen] = useState(false)
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-2 flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Read the whole story</button>
  return (
    <section aria-label={`The story of ${name}`} className="mt-3 border-t border-rule pt-3">
      <StoryList names={[name.split(' ')[0]!]} ordinal={ordinal} />
    </section>
  )
}
