import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor, useT } from '../../../lib/i18n'
import { headMessages } from '../../../i18n/heads'
import { dcLogMessages } from '../../../i18n/dcLog'
import { preload } from '../../../lib/preload'
import { LiveGain, ReturnRecap } from './-recap'
import { AdventureLog } from './-log'
import { Raids } from './-raids'
import { Meetings } from './-meetings'
import { LostProperty } from './-lostProperty'
import { useQuery } from '@tanstack/react-query'

/**
 * The Log tab (D124): what happened. The return tally first (acknowledged here, once it has been seen, as D25 asks),
 * then the quest log with its filters, then the desk raids, meetings (D141) and lost property (D145) either way.
 */
export const Route = createFileRoute('/app/desk-crawler/log')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).dcLog, index: false, locale }),
  loader: ({ context }) => preload(context, convexQuery(api.heroes.mine, {}), convexQuery(api.heroes.returnSummary, {}), convexQuery(api.raids.recent, {}), convexQuery(api.meetings.recent, {}), convexQuery(api.lostProperty.mine, {})),
  component: LogPage,
})

function LogPage() {
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const t = useT(dcLogMessages)
  return (
    <>
      <h1 className="sr-only">{t.logTitle}</h1>
      <div className="flex flex-col gap-3">
        <ReturnRecap />
        <LiveGain />
      </div>
      <AdventureLog />
      <Raids enabled={hero?.raidsEnabled === true} />
      <Meetings enabled={hero?.meetingsEnabled === true} />
      <LostProperty />
    </>
  )
}
