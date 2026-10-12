import { Link } from '@tanstack/react-router'
import { Card } from '../../../lib/ui'
import { Glyph, type GlyphName } from '../../../lib/glyphs'

/** The More tab's pages (D124), each a row with its glyph: what the Hero tab used to hold under the world map. */
const MORE_LINKS = [
  { to: '/app/desk-crawler/career', label: 'Career', blurb: 'The ladder of goals, and what opens at each level.', glyph: 'career' },
  { to: '/app/desk-crawler/achievements', label: 'Achievements', blurb: 'Every one you have earned, and how rare it is.', glyph: 'achievement' },
  { to: '/app/desk-crawler/field-notes', label: 'Field notes', blurb: 'What your hero knows about every floor and monster.', glyph: 'quest' },
  { to: '/app/desk-crawler/keepsakes', label: 'Desk keepsakes', blurb: 'The weekly code from your TRMNL and your shelf.', glyph: 'keepsake' },
  { to: '/app/desk-crawler/trmnl', label: 'On your TRMNL', blurb: 'What the plugin is showing, in every layout.', glyph: 'screen' },
  { to: '/help/desk-crawler', label: 'How Desk Crawler works', blurb: 'Adventures, floors, gear, stances and setup help.', glyph: 'quest' },
] as const satisfies ReadonlyArray<{ to: string; label: string; blurb: string; glyph: GlyphName }>

export function MoreLinks() {
  return (
    <Card>
      <ul className="flex flex-col">
        {MORE_LINKS.map((link) => (
          <li key={link.to} className="border-b border-rule last:border-b-0">
            <Link to={link.to} className="flex min-h-12 items-center gap-3 py-2">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center border-2 border-night bg-night text-gold-ink"><Glyph name={link.glyph} size={20} /></span>
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold underline underline-offset-4">{link.label}</span>
                <span className="text-sm text-muted">{link.blurb}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
