import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor, useT } from '../../../lib/i18n'
import { headMessages } from '../../../i18n/heads'
import { iaMore } from '../../../i18n/iaMore'
import { preload } from '../../../lib/preload'
import { LoadingState } from '../../../lib/ui'
import type { Dock } from '../../../lib/idleAngler'
import { DeviceStandIn } from '../desk-crawler/-deviceStandIn'
import { dockScene, Scene } from './-art'

const GamePreview = lazy(() => import('../desk-crawler/-devicePreview').then((module) => ({ default: module.GamePreview })))

/** What the owner's TRMNL is showing for Idle Angler, on its own page under More, as Desk Crawler's (D124). */
export const Route = createFileRoute('/app/idle-angler/trmnl')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).iaTrmnl, index: false, locale }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {}), convexQuery(api.idleAngler.payload.preview, {})),
  component: DevicePage,
})

function DevicePage() {
  const { data } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const { data: preview } = useQuery(convexQuery(api.idleAngler.payload.preview, {}))
  const dock = data as Dock | undefined
  const t = useT(iaMore)
  const angler = dock?.angler
  if (!angler) return <LoadingState label={t.loadingTrmnl} />
  const scene = dockScene(preview, dock)
  // The dock's painted scene stands in for the render: the same composition the device shows, in colour, centred in the bezel.
  const standIn = scene ? <div className="absolute inset-x-0 top-1/2 -translate-y-1/2"><Scene sceneKey={scene} alt={t.currentScene(angler.alias)} /></div> : null
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t.trmnlTitle}</h1>
      <p className="text-muted">{t.trmnlIntro}</p>
      <Suspense fallback={<DeviceStandIn standIn={standIn} caption={t.loadingTrmnl} />}>
        <GamePreview game="idle-angler" title={angler.alias} standIn={standIn} />
      </Suspense>
      <nav aria-label="TRMNL" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link to="/app/idle-angler/settings" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.installations}</Link>
        <Link to="/help/idle-angler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.displayHelp}</Link>
      </nav>
    </>
  )
}
