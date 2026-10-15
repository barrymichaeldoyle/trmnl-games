import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'
import { reportError } from './errorReporting'
import { isStaleChunkError, reloadingForNewBuild } from './staleChunks'
import { useT } from './i18n'
import { commonMessages } from '../i18n/common'

export function RouteError({ reset, error }: ErrorComponentProps) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)
  const t = useT(commonMessages)
  // A stale chunk is a deploy reaching this tab, not a fault: offer the reload rather than reporting it.
  const newBuild = isStaleChunkError(error)
  useEffect(() => { if (!reloadingForNewBuild() && !isStaleChunkError(error)) reportError(error, 'route') }, [error])
  // Inside a shell the error sits in its <main>; at the top level it is the page, so it takes the skip link's target.
  const section = useRef<HTMLElement>(null)
  useEffect(() => { if (section.current && !document.getElementById('main')) section.current.id = 'main' }, [])
  // A stale chunk is reloading the page onto the new build: show nothing rather than an error for that moment.
  if (reloadingForNewBuild()) return null
  return <section ref={section} aria-labelledby="page-error-title" className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
    <h1 id="page-error-title" className="font-display text-3xl font-bold">{t.pageErrorTitle}</h1>
    <p role="alert">{newBuild ? t.newVersionLive : retryFailed ? t.stillNotLoading : t.checkConnection}</p>
    <div className="flex flex-wrap gap-3">
      {newBuild ? <Button onClick={() => window.location.reload()}>{t.reload}</Button> : <Button pending={retrying} busyLabel={t.tryingAgain} onClick={async () => { setRetrying(true); setRetryFailed(false); try { await router.invalidate(); reset() } catch { setRetryFailed(true) } finally { setRetrying(false) } }}>{t.tryAgain}</Button>}
      <Link to="/app" className="inline-flex min-h-11 items-center px-4 font-semibold underline underline-offset-4">{t.myGames}</Link>
      <Link to="/support" className="inline-flex min-h-11 items-center px-4 underline underline-offset-4">{t.getHelp}</Link>
    </div>
  </section>
}
