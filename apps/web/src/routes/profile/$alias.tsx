import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { Card } from '../../lib/ui'
import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { FishIcon } from '../app/idle-angler/-art'
import { FishName } from '../app/idle-angler/-fish'
import { formatDate, messagesFor, useLocale, useT } from '../../lib/i18n'
import { headMessages } from '../../i18n/heads'
import { publicPagesMessages } from '../../i18n/publicPages'
import { preloadContent } from '../../lib/content'

type Game = { slug: 'desk-crawler' | 'idle-angler' | 'paper-lives' | 'little-plot' | 'pixel-wars'; name: string; life?: { age: number; status: string; job: string | null; traits: string[]; lives: number; longest: number; album: Array<{ ordinal: number; name: string; age: number; generation: number }> }; level?: number; title?: string; since: number; rank: { rank: number; totalPlayers: number } | null; achievements: number; species?: number; page: string | null; wall?: Array<{ speciesId: string; grams: number }>; medals?: number }
type Profile = { alias: string; games: Game[]; platform: Array<{ id: string; name: string; blurb: string; share: number | null }> } | null

const profileQuery = (alias: string) => convexQuery(api.platformProfile.view, { alias })

/** The shared public profile (D115): each game the player chose to show, and achievements across games. */
export const Route = createFileRoute('/profile/$alias')({
  loader: async ({ context, params }) => (await Promise.all([context.queryClient.ensureQueryData(profileQuery(params.alias)), preloadContent(context.locale)]))[0] as Profile,
  head: ({ loaderData, params, match: { context: { locale } } }) => {
    const t = messagesFor(headMessages, locale)
    return loaderData
      ? seo({ title: t.profileTitle(loaderData.alias), path: `/profile/${encodeURIComponent(loaderData.alias)}`, description: t.profileDescription(loaderData.alias, loaderData.games.map((g) => games[g.slug].name)), locale })
      : seo({ title: t.playerNotFound, path: `/profile/${encodeURIComponent(params.alias)}`, index: false, locale })
  },
  component: ProfilePage,
})


function ProfilePage() {
  const { alias } = Route.useParams()
  const { data } = useQuery(profileQuery(alias))
  const profile = data as Profile | undefined
  const t = useT(publicPagesMessages)
  const locale = useLocale()
  const words = anglerWords(locale)
  const since = (at: number) => formatDate(locale, at, { year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-6 px-4 py-10">
        {profile === undefined ? null : profile === null ? (
          <>
            <h1 className="font-display text-3xl font-bold">{t.noProfile}</h1>
            <p>{t.noProfileBody}</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl font-bold">{profile.alias}</h1>
            {profile.games.map((game) => (
              <Card key={game.slug} title={games[game.slug].name}>
                <p className="text-lg">{game.slug === 'desk-crawler' ? t.heroLevel(game.name, game.level) : game.slug === 'paper-lives' ? (game.life?.status === 'ended' ? `${game.name}, remembered` : `${game.name}, ${game.life?.age}${game.life?.job ? `, ${game.life.job.toLowerCase()}` : ''}`) : (game.title ? words.title(game.title) : games[game.slug].name)}</p>
                <p className="text-sm text-muted">
                  {t.playingSince(since(game.since))}
                  {game.rank ? t.rankAllTime(game.rank.rank, game.rank.totalPlayers) : ''}{t.achievementCount(game.achievements)}
                  {game.species !== undefined ? t.anglerSpecies(game.species) : ''}
                  {game.medals ? t.anglerMedals(game.medals) : ''}
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
                    {game.wall.map((t, i) => <li key={i} className="flex items-center gap-2 text-sm"><FishIcon id={t.speciesId} scale={2} /><span><FishName id={t.speciesId} /> {words.weight(t.grams)}</span></li>)}
                  </ul>
                ) : null}
                {game.page ? <Link to={game.page} className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4">{t.heroPage}</Link> : null}
              </Card>
            ))}
            {profile.platform.length > 0 ? (
              <Card title={t.acrossGames}>
                <ul className="flex flex-col gap-2">
                  {profile.platform.map((a) => (
                    <li key={a.id}><strong>{(t.platform as Record<string, { name: string; blurb: string }>)[a.id]?.name ?? a.name}</strong> <span className="text-sm text-muted">· {(t.platform as Record<string, { name: string; blurb: string }>)[a.id]?.blurb ?? a.blurb}{a.share !== null ? t.ofPlayers(a.share) : ''}</span></li>
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
