import { Show } from '@clerk/tanstack-react-start'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { analyticsConfigured, captureAnalytics, openAnalyticsPreferences } from './analytics'
import { PlatformHeader, SITE_FRAME } from './platformHeader'

/** Prose styling for a reading page's body: section headings, lists and underlined links. */
const PROSE = 'leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gold-ink [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-lg [&_li]:ml-5 [&_li]:list-disc [&_a]:underline'

/**
 * A public reading page under the site header. `contents` adds a jump list of its sections, for pages long enough to
 * need one; each entry's id must match its section heading's id. On phones the list sits under the title; from 1024px
 * it is a sidebar that stays in view and marks the section being read.
 */
export function ProsePage({ title, updated, contents, children }: { title: string; updated?: string; contents?: ReadonlyArray<readonly [string, string]>; children: ReactNode }) {
  const heading = (
    <header className="flex flex-col gap-4 lg:col-start-2">
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      {updated ? <p className="text-sm text-muted">Last updated {updated}</p> : null}
    </header>
  )
  if (!contents) {
    return (
      <SiteShell>
        <main id="main" className={`mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10 ${PROSE}`}>{heading}{children}</main>
      </SiteShell>
    )
  }
  return (
    <SiteShell>
      {/* One nav for every width: the grid places it under the title on phones and in the left column from 1024px. */}
      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-10 lg:grid lg:max-w-6xl lg:grid-cols-[15rem_minmax(0,42rem)] lg:justify-center lg:gap-x-12 lg:px-6">
        {heading}
        <Contents contents={contents} />
        <div className={`mt-4 flex flex-col gap-4 lg:col-start-2 ${PROSE}`}>{children}</div>
      </main>
    </SiteShell>
  )
}

/** The id of the section being read: the last listed heading whose top has passed just under the top of the window. */
function useCurrentSection(ids: readonly string[]): string | null {
  const [current, setCurrent] = useState<string | null>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let found: string | null = null
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        if (top !== undefined && top <= 120) found = id
      }
      setCurrent(found)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame) }
  }, [ids])
  return current
}

/**
 * Scrolls smoothly to a section (instantly under reduced motion) and moves focus there. The jump goes through the
 * router, which owns hash scrolling: a plain anchor or history call made it jump on its own, instantly, over the top.
 */
function useJumpTo() {
  const navigate = useNavigate()
  return (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    void navigate({ to: '.', hash: id, replace: true, resetScroll: false, hashScrollIntoView: { behavior: reduced ? 'auto' : 'smooth', block: 'start' } })
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }
}

function Contents({ contents }: { contents: ReadonlyArray<readonly [string, string]> }) {
  const ids = useMemo(() => contents.map(([id]) => id), [contents])
  const current = useCurrentSection(ids)
  const jumpTo = useJumpTo()
  return (
    <nav aria-labelledby="contents-title" className="mt-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
      <div className="window px-3 pt-3 pb-2 min-[375px]:px-4 sm:px-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:px-4">
        <h2 id="contents-title" className="font-display text-xl font-semibold text-gold-ink">On this page</h2>
        {/* Two columns on phones, so twenty sections stay about half a screen, with 44px rows for an easy tap; one tighter column in the sidebar. */}
        <ul className="mt-1 grid grid-cols-2 gap-x-4 sm:gap-x-6 lg:grid-cols-1">
          {contents.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} onClick={(event) => jumpTo(event, id)} aria-current={current === id ? 'location' : undefined} className="flex min-h-11 items-center border-l-2 border-transparent py-1 pl-2 text-sm leading-snug text-muted hover:text-ink hover:underline underline-offset-4 aria-[current=location]:border-gold aria-[current=location]:font-semibold aria-[current=location]:text-gold-ink lg:min-h-0 lg:py-1.5">{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

/** A public page's frame: the site header, the page, and the footer pinned to the foot of short pages. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PlatformHeader />
      {children}
      <SiteFooter />
    </div>
  )
}

const FOOTER_LINK = 'inline-flex min-h-11 items-center text-muted underline-offset-4 hover:text-ink hover:underline'

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-1 text-sm font-semibold text-ink">{title}</h2>
      {/* Each link keeps a 44px row, so the list stays an easy tap without extra gaps. */}
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}

/**
 * The site footer: links grouped by what a visitor is looking for, with the account links only for someone signed in,
 * then the unofficial-status line and the author credit.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule bg-night/40 text-sm">
      <div className={`flex flex-col gap-8 py-10 ${SITE_FRAME}`}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <Link to="/" className="flex min-h-11 items-center gap-2 self-start font-display text-lg font-semibold"><img src="/favicon.svg" alt="" width={24} height={24} className="[image-rendering:pixelated]" />TRMNL Games</Link>
            <p className="max-w-xs text-muted">Games that play themselves on a TRMNL e-ink display.</p>
          </div>
          <nav aria-label="Site" className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 md:col-span-4">
            <FooterGroup title="Games">
              <li><Link to="/" className={FOOTER_LINK}>Desk Crawler</Link></li>
              <li><a href={DESK_CRAWLER_INSTALL_URL} className={FOOTER_LINK} onClick={() => captureAnalytics('install link opened', { place: 'footer' })}>Install on TRMNL</a></li>
              <Show when="signed-in"><li><Link to="/app" className={FOOTER_LINK}>My games</Link></li></Show>
            </FooterGroup>
            <FooterGroup title="Help">
              <li><Link to="/help/desk-crawler" className={FOOTER_LINK}>Setup and help</Link></li>
              <li><Link to="/whats-new" className={FOOTER_LINK}>What’s new</Link></li>
              <li><Link to="/support" className={FOOTER_LINK}>Support</Link></li>
              <li><Link to="/feedback" className={FOOTER_LINK}>Feedback</Link></li>
              <Show when="signed-in"><li><Link to="/account" className={FOOTER_LINK}>Account</Link></li></Show>
            </FooterGroup>
            <FooterGroup title="Project">
              <li><a href="https://github.com/barrymichaeldoyle/trmnl-games" className={FOOTER_LINK}>Source on GitHub</a></li>
              <li><a href={SPONSOR_URL} className={FOOTER_LINK} onClick={() => captureAnalytics('sponsor link opened', { place: 'footer' })}>Sponsor on GitHub</a></li>
              <li><a href="https://trmnl.com/recipes/485545" className={FOOTER_LINK}>F1 Race Weekend</a></li>
              <li><a href="https://grandprixpicks.com" className={FOOTER_LINK}>GrandPrixPicks.com</a></li>
            </FooterGroup>
            <FooterGroup title="Legal">
              <li><Link to="/privacy" className={FOOTER_LINK}>Privacy</Link></li>
              <li><Link to="/terms" className={FOOTER_LINK}>Terms</Link></li>
              <AnalyticsLink />
            </FooterGroup>
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-rule pt-6 text-muted sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-8">
          <p>Unofficial companion site. Not operated by <a href="https://trmnl.com" className="underline underline-offset-4 hover:text-ink">TRMNL</a>.</p>
          <p>
            Built by <a href="https://barrymichaeldoyle.com" className="underline underline-offset-4 hover:text-ink">Barry Michael Doyle</a>{' · '}
            <a href="https://www.linkedin.com/in/barry-michael-doyle-11369683/" className="underline underline-offset-4 hover:text-ink">LinkedIn</a>{' · '}
            <a href="https://x.com/barrymdoyle" className="underline underline-offset-4 hover:text-ink">X</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

/** Reopens the analytics consent panel; shown only where analytics can run, after hydration so SSR markup matches. */
function AnalyticsLink() {
  const [shown, setShown] = useState(false)
  useEffect(() => setShown(analyticsConfigured()), [])
  return shown ? <li><button type="button" className={FOOTER_LINK} onClick={openAnalyticsPreferences}>Analytics preferences</button></li> : null
}

export const SUPPORT_EMAIL = 'barry@barrymichaeldoyle.com'
/** Optional support for the games (D134): a plain link out, with nothing in play attached to it. */
export const SPONSOR_URL = 'https://github.com/sponsors/barrymichaeldoyle'
/** One release status line, shared by the public pages and the companion's start card. */
export const RELEASE_STATUS = 'Free on the TRMNL marketplace.'
/** Desk Crawler's public marketplace listing (plugin 564): its Install button starts the TRMNL connect flow. */
export const DESK_CRAWLER_INSTALL_URL = 'https://trmnl.com/integrations/desk-crawler'
/** Shown on the privacy and terms pages; bump whenever either changes. */
export const POLICY_UPDATED = '8 October 2026'
/** The privacy policy alone changed on 9 October 2026 (D110: public names in other players' raid stories). */
export const PRIVACY_UPDATED = '13 October 2026'
