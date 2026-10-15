import { Link } from '@tanstack/react-router'
import { Glyph } from '../../../lib/glyphs'
import { useT } from '../../../lib/i18n'
import { dcScreenMessages } from '../../../i18n/dcScreen'

type Summary = { unlockLevel: number; open: boolean; heroes: number; warriorLevel: number | null }

/**
 * The roster on the Hero page (P37): nothing before the Warrior's unlock level (D157), an invitation once it opens,
 * and a quiet link to switch once the account holds two heroes.
 */
export function RosterCard({ roster, name, className }: { roster: Summary; name: string; className: string }) {
  const t = useT(dcScreenMessages)
  if (roster.heroes > 1) {
    return (
      <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span>{t.rosterAdventuring(name, className)}</span>
        <Link to="/app/desk-crawler/roster" className="flex min-h-11 items-center gap-1.5 font-semibold text-gold-ink underline underline-offset-4">{t.switchHeroes} <Glyph name="play" size={8} /></Link>
      </p>
    )
  }
  // D157: before it opens, the second hero is only the Hero page's "Coming up" line when it is the next unlock.
  if (!roster.open) return null
  return (
    <Link to="/app/desk-crawler/roster" className="flex min-w-0 flex-col gap-1 border-[3px] border-gold px-3 py-3 min-[375px]:px-4">
      <span className="flex items-center gap-3 font-display text-xl font-bold text-gold-ink">
        <Glyph name="hero" className="shrink-0" />
        <span>{t.secondHeroReady}</span>
      </span>
      <span className="text-sm">{t.recruitRogue(name)}</span>
      <span className="flex items-center gap-1.5 text-sm font-semibold text-gold-ink">{t.meetRogue} <Glyph name="play" size={8} /></span>
    </Link>
  )
}
