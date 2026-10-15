import { createFileRoute } from '@tanstack/react-router'
import { ProsePage, SPONSOR_URL, SUPPORT_EMAIL } from '../lib/prose'
import { seo } from '../lib/seo'
import { messagesFor, useT } from '../lib/i18n'
import { pagesMessages } from '../i18n/pages'

export const Route = createFileRoute('/support')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(pagesMessages, locale).supportTitle, path: '/support', description: messagesFor(pagesMessages, locale).supportDescription, locale }),
  component: Support,
})

function Support() {
  const t = useT(pagesMessages)
  return (
    <ProsePage title={t.supportTitle}>
      <ul>
        <li>
          {t.supportAccount}<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{t.supportReply}
        </li>
        <li>
          {t.supportBugs}<a href="https://github.com/barrymichaeldoyle/trmnl-games/issues">{t.githubIssues}</a>.
        </li>
        <li>
          {t.supportIdeas}<a href="/feedback">{t.sendFeedbackLink}</a>.
        </li>
        <li>
          {t.supportSetup}<a href="/help/desk-crawler">{t.trmnlHelp}</a>.
        </li>
      </ul>
      <h2>{t.supportingTitle}</h2>
      <p>
        {t.supportingBefore}<a href={SPONSOR_URL}>{t.sponsorLink}</a>{t.supportingAfter}
      </p>
      <h2>{t.namesTitle}</h2>
      <p>
        {t.namesBody}
      </p>
    </ProsePage>
  )
}
