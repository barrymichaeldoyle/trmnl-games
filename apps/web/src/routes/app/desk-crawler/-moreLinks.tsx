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
      <ul className="flex flex-col">
        {MORE_LINKS.map((link) => (
          <li key={link.to} className="border-b border-rule last:border-b-0">
            <Link to={link.to} className="flex min-h-12 items-center gap-3 py-2">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center border-2 border-night bg-night text-gold-ink"><Glyph name={link.glyph} size={20} /></span>
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold underline underline-offset-4">{t.links[link.key].label}</span>
                <span className="text-sm text-muted">{t.links[link.key].blurb.replace('{day}', day)}</span>
              </span>
            </Link>
          </li>
        ))}
        {/* The one way to give money (D134): optional, off-site, and nothing in the game changes for it. */}
        <li>
          <a href={SPONSOR_URL} className="flex min-h-12 items-center gap-3 py-2" onClick={() => captureAnalytics('sponsor link opened', { place: 'more' })}>
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center border-2 border-night bg-night text-gold-ink"><Glyph name="heart" size={20} /></span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold underline underline-offset-4">{t.sponsor}</span>
              <span className="text-sm text-muted">{t.sponsorBlurb}</span>
            </span>
          </a>
        </li>
      </ul>
    </Card>
  )
}
