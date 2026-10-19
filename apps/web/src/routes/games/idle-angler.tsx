import { Link, createFileRoute } from '@tanstack/react-router'
import { contentV5 as content } from '@trmnl-games/idle-angler/content'
import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { games } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { messagesFor, useLocale, useT } from '../../lib/i18n'
import { SiteShell } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { BUTTON_SECONDARY, LINK_BUTTON } from '../../lib/ui'
import { iaGamePage } from '../../i18n/iaGamePage'

/** Idle Angler's public game page (idle-angler.md "Companion"), in every language (D200). Hidden with the game until it is live (D115). */
export const Route = createFileRoute('/games/idle-angler')({
  loader: ({ context }) => requireOpenGame(context, 'idle-angler'),
  head: ({ match: { context: { locale } } }) => {
    const t = messagesFor(iaGamePage, locale)
    return seo({ title: 'Idle Angler', path: '/games/idle-angler', description: t.description, image: { path: '/games/idle-angler/sample.png', alt: t.imageAlt }, locale })
  },
  component: GamePage,
})

function GamePage() {
  const t = useT(iaGamePage)
  const words = anglerWords(useLocale())
  return (
    <SiteShell>
      <main id="main" className="mx-auto w-full flex max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="flex items-center gap-4 font-display text-4xl font-bold leading-tight sm:text-5xl"><img src="/games/idle-angler/icon-192.png" alt="" width={64} height={64} className="size-14 [image-rendering:pixelated] sm:size-16" />{games['idle-angler'].name}</h1>
          <p className="text-lg text-muted">{t.intro}</p>
        </header>
        <figure className="flex flex-col gap-2">
          <img src="/games/idle-angler/sample.png" alt={t.imageAlt} width={780} height={460} className="w-full border-2 border-edge bg-white [image-rendering:pixelated]" />
          <figcaption className="text-sm text-muted">{t.caption}</figcaption>
        </figure>
        <ul className="flex flex-col gap-2 [&_li]:ml-5 [&_li]:list-disc">
          {t.features(content.species.length, words.title('newcomer'), words.title('master_angler')).map((line) => <li key={line}>{line}</li>)}
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/help/idle-angler" className={`${LINK_BUTTON} ${BUTTON_SECONDARY}`}>{t.howItPlays}</Link>
          <Link to="/app/idle-angler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.openCompanion}</Link>
        </div>
      </main>
    </SiteShell>
  )
}
