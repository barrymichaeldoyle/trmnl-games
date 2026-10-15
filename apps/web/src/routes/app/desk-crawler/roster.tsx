import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor, useT } from '../../../lib/i18n'
import { dcPagesMessages } from '../../../i18n/dcPages'
import { LoadingState, NoticeBar, useNotice } from '../../../lib/ui'
import { Roster, type RosterView } from './-roster'

/** The hero roster under More (P37): the heroes on the account, switching between them, and recruiting a new class. */
export const Route = createFileRoute('/app/desk-crawler/roster')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(dcPagesMessages, locale).rosterTitle, index: false, locale }),
  component: RosterPage,
})

/** The minute the page asks about, refreshed every minute, so the switch clock moves without a refetch per render. */
function useMinute(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 60_000) * 60_000)
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 60_000) * 60_000), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function RosterPage() {
  const now = useMinute()
  const { data } = useQuery(convexQuery(api.roster.mine, { now }))
  const { notice, notify, dismiss } = useNotice()
  const t = useT(dcPagesMessages)
  if (data === undefined) return <LoadingState label={t.loadingHeroes} />
  const roster = data as RosterView | null
  if (roster === null || !roster.available) return <p className="text-muted">{t.moreHeroesSoon}</p>
  return (
    <>
      <Roster roster={roster} notify={notify} />
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
