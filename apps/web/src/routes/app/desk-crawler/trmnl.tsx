import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor, useT } from '../../../lib/i18n'
import { headMessages } from '../../../i18n/heads'
import { dcPagesMessages } from '../../../i18n/dcPages'
import { artUrl } from '../../../lib/artUrl'
import { preload } from '../../../lib/preload'
import { LoadingState } from '../../../lib/ui'
import { latestLogQuery } from './-queries'

import { DeviceStandIn } from './-deviceStandIn'

const DevicePreview = lazy(() => import('./-devicePreview').then((module) => ({ default: module.DevicePreview })))

/** What the owner's TRMNL is showing (companion.md "Display help"), on its own page under More (D124). */
export const Route = createFileRoute('/app/desk-crawler/trmnl')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).dcTrmnl, index: false, locale }),
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
      <Suspense fallback={<SceneStandIn sceneUrl={artUrl(hero.scenePath)} heroName={hero.name} />}>
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

/** The bezel holding the hero's scene while the preview's chunk loads. */
function SceneStandIn({ sceneUrl, heroName }: { sceneUrl: string; heroName: string }) {
  const t = useT(dcPagesMessages)
  return <DeviceStandIn standIn={<img src={sceneUrl} alt={t.currentScene(heroName)} width={760} height={200} decoding="async" className="absolute inset-0 m-auto w-full [image-rendering:pixelated]" />} caption={t.loadingTrmnl} />
}
