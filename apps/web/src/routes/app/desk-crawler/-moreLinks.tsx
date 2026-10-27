import { Link } from '@tanstack/react-router'
import { Card } from '../../../lib/ui'
import { Glyph, type GlyphName } from '../../../lib/glyphs'
import { captureAnalytics } from '../../../lib/analytics'
import { SPONSOR_URL } from '../../../lib/prose'
import { CHANGELOG, changeDay } from '../../../lib/changelog'
import { useLocale, useT } from '../../../lib/i18n'
import { dcMoreMessages } from '../../../i18n/dcMore'

/** The More tab's pages (D124), each a row with its glyph: what the Hero tab used to hold under the world map. */
const MORE_LINKS = [
  { to: '/app/desk-crawler/roster', key: 'roster', glyph: 'hero' },
  { to: '/app/desk-crawler/career', key: 'career', glyph: 'career' },
  { to: '/app/desk-crawler/achievements', key: 'achievements', glyph: 'achievement' },
  { to: '/app/desk-crawler/field-notes', key: 'fieldNotes', glyph: 'quest' },
  { to: '/app/desk-crawler/keepsakes', key: 'keepsakes', glyph: 'keepsake' },
  { to: '/app/desk-crawler/trmnl', key: 'trmnl', glyph: 'screen' },
  { to: '/help/desk-crawler', key: 'help', glyph: 'quest' },
  // Always here, so the changes stay one tap away after the Hero tab's card is hidden (D154).
  { to: '/whats-new', key: 'whatsNew', glyph: 'bell' },
] as const satisfies ReadonlyArray<{ to: string; key: string; glyph: GlyphName }>

export function MoreLinks() {
  const t = useT(dcMoreMessages)
  const locale = useLocale()
  const day = changeDay(CHANGELOG[0]!.date, false, locale)
  return (
    <Card>
      {/* Two columns on a phone (one below 360px, where a label broke mid-word), three from 640px: nine rows of links took a screen and a half before the settings began. */}
      <ul className="grid gap-x-4 gap-y-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
        {MORE_LINKS.map((link) => (
          <li key={link.to} className="min-w-0">
            <Link to={link.to} className="flex min-h-11 flex-col gap-1">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center border-2 border-night bg-night text-gold-ink"><Glyph name={link.glyph} size={18} /></span>
                <span className="font-semibold underline underline-offset-4 [overflow-wrap:anywhere]">{t.links[link.key].label}</span>
              </span>
              <span className="text-xs text-muted">{t.links[link.key].blurb.replace('{day}', day)}</span>
            </Link>
          </li>
        ))}
        {/* The one way to give money (D134): optional, off-site, and nothing in the game changes for it. */}
        <li className="min-w-0">
          <a href={SPONSOR_URL} className="flex min-h-11 flex-col gap-1" onClick={() => captureAnalytics('sponsor link opened', { place: 'more' })}>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center border-2 border-night bg-night text-gold-ink"><Glyph name="heart" size={18} /></span>
              <span className="font-semibold underline underline-offset-4 [overflow-wrap:anywhere]">{t.sponsor}</span>
            </span>
            <span className="text-xs text-muted">{t.sponsorBlurb}</span>
          </a>
        </li>
      </ul>
    </Card>
  )
}
