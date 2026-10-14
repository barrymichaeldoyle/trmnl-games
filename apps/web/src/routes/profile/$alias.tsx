import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { Card } from '../../lib/ui'
import { formatWeight } from '../../lib/idleAngler'
import { FishIcon } from '../app/idle-angler/-art'
import { FishName } from '../app/idle-angler/-fish'

type Game = { slug: 'desk-crawler' | 'idle-angler' | 'paper-lives'; name: string; life?: { age: number; status: string; job: string | null; traits: string[]; lives: number; longest: number; album: Array<{ ordinal: number; name: string; age: number; generation: number }> }; level?: number; title?: string; since: number; rank: { rank: number; totalPlayers: number } | null; achievements: number; species?: number; page: string | null; wall?: Array<{ speciesId: string; grams: number }>; medals?: number }
type Profile = { alias: string; games: Game[]; platform: Array<{ id: string; name: string; blurb: string; share: number | null }> } | null

const profileQuery = (alias: string) => convexQuery(api.platformProfile.view, { alias })

/** The shared public profile (D115): each game the player chose to show, and achievements across games. */
export const Route = createFileRoute('/profile/$alias')({
  loader: async ({ context, params }) => (await context.queryClient.ensureQueryData(profileQuery(params.alias))) as Profile,
  head: ({ loaderData, params }) =>
    loaderData
      ? seo({ title: `${loaderData.alias} on TRMNL Games`, path: `/profile/${encodeURIComponent(loaderData.alias)}`, description: `${loaderData.alias} plays ${loaderData.games.map((g) => games[g.slug].name).join(' and ')} on TRMNL.` })
      : seo({ title: 'Player not found', path: `/profile/${encodeURIComponent(params.alias)}`, index: false }),
  component: ProfilePage,
})

const since = (at: number) => new Date(at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })

function ProfilePage() {
  const { alias } = Route.useParams()
  const { data } = useQuery(profileQuery(alias))
  const profile = data as Profile | undefined
  return (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-6 px-4 py-10">
        {profile === undefined ? null : profile === null ? (
          <>
            <h1 className="font-display text-3xl font-bold">No public profile</h1>
            <p>There is no public profile at this name. It may be private, or the name may have changed.</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl font-bold">{profile.alias}</h1>
            {profile.games.map((game) => (
              <Card key={game.slug} title={games[game.slug].name}>
                <p className="text-lg">{game.slug === 'desk-crawler' ? `${game.name}, level ${game.level}` : game.slug === 'paper-lives' ? (game.life?.status === 'ended' ? `${game.name}, remembered` : `${game.name}, ${game.life?.age}${game.life?.job ? `, ${game.life.job.toLowerCase()}` : ''}`) : `${game.title ?? 'Angler'}`}</p>
                <p className="text-sm text-muted">
                  Playing since {since(game.since)}
                  {game.rank ? ` · #${game.rank.rank} of ${game.rank.totalPlayers} all time` : ''} · {game.achievements} achievements
                  {game.species !== undefined ? ` · ${game.species} species logged` : ''}
                  {game.medals ? ` · ${game.medals} ${game.medals === 1 ? 'medal' : 'medals'}` : ''}
                  {game.life ? ` · ${game.life.lives} ${game.life.lives === 1 ? 'life' : 'lives'} lived${game.life.longest ? `, the longest ${game.life.longest} years` : ''}` : ''}
                </p>
                {game.life?.traits.length ? <p className="text-sm text-muted">{game.life.traits.join(' · ')}</p> : null}
                {game.life && game.life.album.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1" aria-label="Album">
                    {game.life.album.map((life) => (
                      <li key={life.ordinal} className="text-sm"><Link to="/profile/$alias/lives/$n" params={{ alias: profile.alias, n: String(life.ordinal) }} className="underline underline-offset-4">{life.name}</Link> <span className="text-muted">· lived to {life.age}{life.generation > 1 ? `, generation ${life.generation}` : ''}</span></li>
                    ))}
                  </ul>
                ) : null}
                {game.wall && game.wall.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-3" aria-label="Trophy wall">
                    {game.wall.map((t, i) => <li key={i} className="flex items-center gap-2 text-sm"><FishIcon id={t.speciesId} scale={2} /><span><FishName id={t.speciesId} /> {formatWeight(t.grams)}</span></li>)}
                  </ul>
                ) : null}
                {game.page ? <Link to={game.page} className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4">Hero page</Link> : null}
              </Card>
            ))}
            {profile.platform.length > 0 ? (
              <Card title="Across games">
                <ul className="flex flex-col gap-2">
                  {profile.platform.map((a) => (
                    <li key={a.id}><strong>{a.name}</strong> <span className="text-sm text-muted">· {a.blurb}{a.share !== null ? ` · ${a.share}% of players` : ''}</span></li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        )}
      </main>
    </SiteShell>
  )
}
