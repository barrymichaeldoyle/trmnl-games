import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { SiteShell } from '../../lib/prose'
import { artUrl } from '../../lib/intent'
import { DESK_CRAWLER_OG, seo } from '../../lib/seo'
import { Button, Card, NoticeBar, useNotice } from '../../lib/ui'
import { useIntent } from '../../lib/intent'
import { TrophyCase } from '../app/desk-crawler/-achievements'
import { WithName } from '../app/desk-crawler/-withName'
import { Glyph, SectionTitle } from '../../lib/glyphs'
import { RARITY_TONE } from '../../lib/palette'
import { formatDate, formatNumber, messagesFor, useLocale, useT } from '../../lib/i18n'
import { useContent } from '../../lib/useContent'
import { publicPagesMessages } from '../../i18n/publicPages'
import type { Locale } from '@trmnl-games/platform'

type Profile = {
  alias: string
  heroName: string
  level: number
  status: 'exploring' | 'resting' | 'travelling' | 'dead' | 'paused' | 'sleeping'
  biome: string | null
  scenePath: string
  adventuringSince: number
  rank: { rank: number; totalPlayers: number } | null
  lifetime: { combatWins: number; itemsFound: number; trips: number; rescues: number; epicFinds: number }
  raids?: { won: number; failed: number; repelled: number; lost: number }
  achievements: Array<{ id: string; tier: number; name: string; blurb: string; family: string }>
  rarity: { counts: Record<string, number>; totalPlayers: number; scoreAt: number } | null
  achievementCount: number
  /** D145: other players' spares the hero holds, with the name on each; and how many it has found. */
  lostProperty?: Array<{ name: string; rarity: string; kind: 'weapon' | 'armor'; ownerName: string; profile: boolean }>
  lostPropertyFound?: number
}

const profileQuery = (alias: string) => convexQuery(api.profiles.view, { alias })

/**
 * The hero's own social card from the art route (D109), 1200x630. Unfurlers cache images by URL, so the level and
 * rank ride along in the query and a new level or rank gets a fresh card. Without the art origin, the game's card.
 */
const heroCard = (profile: Pick<Profile, 'alias' | 'heroName' | 'level' | 'rank'>, locale: Locale) =>
  import.meta.env.VITE_CONVEX_SITE_URL
    ? { url: artUrl(`/art/card/hero/${encodeURIComponent(profile.alias)}.png?v=${profile.level}-${profile.rank?.rank ?? 0}`), alt: messagesFor(publicPagesMessages, locale).heroCardAlt(profile.heroName, profile.level), width: 1200, height: 630 }
    : DESK_CRAWLER_OG

export const Route = createFileRoute('/desk-crawler/heroes/$alias')({
  loader: async ({ context, params }) => (await context.queryClient.ensureQueryData(profileQuery(params.alias))) as Profile | null,
  head: ({ loaderData, params, match: { context: { locale } } }) => {
    const t = messagesFor(publicPagesMessages, locale)
    return loaderData
      ? seo({ title: t.heroTitle(loaderData.heroName, loaderData.level), path: `/desk-crawler/heroes/${encodeURIComponent(loaderData.alias)}`, description: t.heroDescription(loaderData.alias, loaderData.heroName, loaderData.level, loaderData.rank ? t.rankOf(loaderData.rank.rank, loaderData.rank.totalPlayers) : null, loaderData.achievementCount), image: heroCard(loaderData, locale), locale })
      : seo({ title: t.heroNotFound, path: `/desk-crawler/heroes/${encodeURIComponent(params.alias)}`, index: false, locale })
  },
  component: HeroProfile,
})

/** Public hero page (v1.2), on unless the owner hid it (D144). Hidden and missing heroes read the same. */
function HeroProfile() {
  const { alias } = Route.useParams()
  const { data } = useQuery(profileQuery(alias))
  const profile = data as Profile | null | undefined
  const t = useT(publicPagesMessages)
  return (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-8 px-4 py-10">
        <BackToHero />
        {profile ? <Found profile={profile} /> : (
          <header className="flex flex-col gap-3">
            <h1 className="font-display text-3xl font-bold">{t.noHero}</h1>
            <p>{t.noHeroBody}</p>
          </header>
        )}
        <div className="flex flex-wrap items-center gap-4">
          {profile ? <Link to="/profile/$alias" params={{ alias: profile.alias }} className="inline-flex min-h-11 items-center underline underline-offset-4">{t.aliasProfile(profile.alias)}</Link> : null}
          <Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.whatIs}</Link>
        </div>
      </main>
    </SiteShell>
  )
}

/** A signed-in player reading a hero page gets one tap back to their own hero (the page has no HUD nav); visitors see nothing. */
function BackToHero() {
  const { data } = useQuery(convexQuery(api.heroes.mine, {}))
  const hero = data as { name: string } | null | undefined
  const t = useT(publicPagesMessages)
  if (!hero) return null
  return (
    <Link to="/app/desk-crawler" className="-mb-4 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-gold-ink underline-offset-4 hover:underline">
      <Glyph name="play" size={8} className="rotate-180" />{t.backToHero(hero.name)}
    </Link>
  )
}

function Found({ profile }: { profile: Profile }) {
  const t = useT(publicPagesMessages)
  const c = useContent()
  const locale = useLocale()
  const since = formatDate(locale, profile.adventuringSince, { day: 'numeric', month: 'long', year: 'numeric' })
  const biome = profile.biome ?? 'Office Cubicles'
  const r = t.lifetimeRows
  const rows: Array<[string, number]> = [[r.fightsWon, profile.lifetime.combatWins], [r.itemsFound, profile.lifetime.itemsFound], [r.trips, profile.lifetime.trips], [r.rescues, profile.lifetime.rescues], [r.epicFinds, profile.lifetime.epicFinds]]
  // D110: the raid record, once there is one; never who was raided or the gold that moved.
  const raids = profile.raids
  if (raids && raids.won + raids.failed + raids.repelled + raids.lost > 0) rows.push([r.raidsWon, raids.won], [r.repelled, raids.repelled])
  if ((profile.lostPropertyFound ?? 0) > 0) rows.push([r.sparesFound, profile.lostPropertyFound!])
  const spares = profile.lostProperty ?? []
  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="text-muted">{t.aliasHero(profile.alias)}</p>
        <h1 className="font-display text-4xl font-bold leading-tight">{profile.heroName}</h1>
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="hud text-base text-xp-ink">{t.level(profile.level)}</span>
          {profile.rank ? <span><span className="hud text-base text-gold-ink">#{profile.rank.rank}</span>{t.ofAllTime(profile.rank.totalPlayers)}</span> : null}
        </p>
        <p>{t.status(profile.status, biome)}.{t.since(since)}</p>
      </header>
      <FollowControls alias={profile.alias} />
      <img src={artUrl(profile.scenePath)} alt={t.sceneAlt(profile.heroName, biome)} width={760} height={200} className="w-full border-[3px] border-night bg-cream [image-rendering:pixelated]" />
      <Card title={t.lifetime}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {rows.map(([label, value]) => <div key={label} className="flex flex-col"><dt className="text-sm text-muted">{label}</dt><dd className="hud text-base tabular-nums">{formatNumber(locale, value)}</dd></div>)}
        </dl>
      </Card>
      {spares.length > 0 ? (
        <Card title={t.lostProperty}>
          <p className="text-sm text-muted">{t.sparesKept(profile.heroName)}</p>
          <ul aria-label={t.sparesHeld} className="mt-2 flex flex-col gap-1">
            {spares.map((spare, index) => (
              <li key={`${spare.name}-${spare.ownerName}-${index}`} className="min-w-0 break-words">
                <span className={`font-semibold ${RARITY_TONE[spare.rarity] ?? ''}`}>{c.name(spare.name)}</span>, <WithName text={t.whose} name={spare.ownerName} profile={spare.profile} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <section aria-labelledby="achievements-title" className="flex min-w-0 flex-col gap-4">
        <SectionTitle id="achievements-title" glyph="achievement" size="text-2xl">{t.achievements(profile.achievementCount)}</SectionTitle>
        {profile.achievements.length === 0 ? <p className="text-muted">{t.noAchievements}</p> : <TrophyCase achievements={profile.achievements} rarity={profile.rarity} />}
      </section>
    </>
  )
}

/**
 * D143: Follow, then Following with Make rival and Unfollow, for a signed-in player with a hero. Nothing for a
 * visitor, on your own page, or when the page can't be followed. A follow is silent; a rival is told on their card.
 */
function FollowControls({ alias }: { alias: string }) {
  const { data: status } = useQuery(convexQuery(api.follows.status, { alias }))
  const { notice, notify, dismiss } = useNotice()
  const follow = useIntent(api.follows.follow, { onFeedback: notify })
  const unfollow = useIntent(api.follows.unfollow, { onFeedback: notify })
  const rival = useIntent(api.follows.setRival, { onFeedback: notify })
  const t = useT(publicPagesMessages)
  if (!status) return null
  const busy = follow.pending || unfollow.pending || rival.pending
  return (
    <div className="flex flex-col gap-2">
      {status.followId === null ? (
        <>
          <div><Button icon="eye" pending={follow.pending} busyLabel={t.following} disabled={status.full || busy} onClick={() => follow.run({ alias }, t.followingDone(alias))}>{t.follow}</Button></div>
          <p className="text-sm text-muted">{status.full ? t.followFull : t.followBlurb}</p>
        </>
      ) : (
        <>
          <p className="font-semibold">{status.rival ? t.followingRival(alias) : t.followingAlias(alias)}</p>
          <div className="-ml-3 flex flex-wrap gap-x-2 min-[375px]:-ml-4">
            <Button variant="quiet" disabled={busy} onClick={() => rival.run({ followId: status.rival ? null : status.followId }, status.rival ? t.rivalCleared : t.isYourRival(alias))}>{status.rival ? t.clearRival : t.makeRival}</Button>
            <Button variant="quiet" disabled={busy} onClick={() => unfollow.run({ followId: status.followId! }, t.unfollowed(alias))}>{t.unfollow}</Button>
            <Link to="/app/desk-crawler/leaderboard" className="inline-flex min-h-11 items-center font-semibold text-muted underline underline-offset-4">{t.everyoneYouFollow}</Link>
          </div>
        </>
      )}
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </div>
  )
}
