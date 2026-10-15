import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor, useT } from '../../../lib/i18n'
import { dcPagesMessages } from '../../../i18n/dcPages'
import { artUrl } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { LoadingState } from '../../../lib/ui'
import { latestLogQuery } from './-queries'

const DevicePreview = lazy(() => import('./-devicePreview').then((module) => ({ default: module.DevicePreview })))

/** What the owner's TRMNL is showing (companion.md "Display help"), on its own page under More (D124). */
export const Route = createFileRoute('/app/desk-crawler/trmnl')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(dcPagesMessages, locale).trmnlTitle, index: false, locale }),
  loader: ({ context }) => preload(context, convexQuery(api.heroes.mine, {}), latestLogQuery()),
  component: DevicePage,
})

function DevicePage() {
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const t = useT(dcPagesMessages)
  if (!hero) return <LoadingState label={t.loadingHero} />
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t.trmnlTitle}</h1>
      <p className="text-muted">{t.trmnlIntro}</p>
      <Suspense fallback={<DeviceStandIn sceneUrl={artUrl(hero.scenePath)} heroName={hero.name} />}>
        <DevicePreview sceneUrl={artUrl(hero.scenePath)} heroName={hero.name} />
      </Suspense>
      <nav aria-label="TRMNL" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link to="/app/desk-crawler/keepsakes" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.enterCode}</Link>
        <Link to="/app/desk-crawler/settings" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.installations}</Link>
        <Link to="/help/desk-crawler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.displayHelp}</Link>
      </nav>
    </>
  )
}

/**
 * What the device preview looks like before its chunk and template render
 * arrive: the same bezel at the TRMNL X aspect ratio holding the hero's scene,
 * with the control rows' height reserved, so nothing moves when it takes over.
 */
function DeviceStandIn({ sceneUrl, heroName }: { sceneUrl: string; heroName: string }) {
  const t = useT(dcPagesMessages)
  return (
    <figure className="flex flex-col gap-3" aria-busy="true">
      <div className="rounded-[1.4rem] bg-[#3a3566] p-[clamp(0.5rem,2.5vw,1rem)]">
        <div className="relative overflow-hidden rounded-md bg-white" style={{ aspectRatio: '1872 / 1404' }}>
          <img src={sceneUrl} alt={t.currentScene(heroName)} width={760} height={200} decoding="async" className="absolute inset-0 m-auto w-full [image-rendering:pixelated]" />
        </div>
      </div>
      <figcaption className="text-sm text-muted">
        {/* Matches the preview's two control rows: 44px tabs, 8px gap, 44px device picker. */}
        <div aria-hidden="true" className="h-24" />
        <p className="mt-3">{t.loadingTrmnl}</p>
      </figcaption>
    </figure>
  )
}
