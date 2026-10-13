import { Link } from '@tanstack/react-router'
import { Glyph } from '../../../lib/glyphs'

type Summary = { unlockLevel: number; open: boolean; heroes: number; warriorLevel: number | null }

/**
 * The roster on the Hero page (P37): a locked preview before the Warrior's unlock level, an invitation once it opens,
 * and a quiet link to switch once the account holds two heroes.
 */
export function RosterCard({ roster, name, className }: { roster: Summary; name: string; className: string }) {
  if (roster.heroes > 1) {
    return (
      <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span>{name} the {className} is adventuring.</span>
        <Link to="/app/desk-crawler/roster" className="flex min-h-11 items-center gap-1.5 font-semibold text-gold-ink underline underline-offset-4">Switch heroes <Glyph name="play" size={8} /></Link>
      </p>
    )
  }
  if (!roster.open) {
    return (
      <section aria-label={`A second hero, unlocks at Warrior level ${roster.unlockLevel}`} className="flex min-w-0 flex-col gap-1 border-[3px] border-dashed border-faint px-3 py-3 text-muted min-[375px]:px-4">
        <p className="flex items-center gap-3 font-display text-xl font-bold">
          <Glyph name="hero" className="shrink-0" />
          <span>A second hero</span>
          <span className="hud ml-auto text-hud-sm">Level {roster.unlockLevel}</span>
        </p>
        <p className="text-sm">A Rogue joins the roster when your Warrior reaches level {roster.unlockLevel}. One hero adventures at a time; you choose which.</p>
      </section>
    )
  }
  return (
    <Link to="/app/desk-crawler/roster" className="flex min-w-0 flex-col gap-1 border-[3px] border-gold px-3 py-3 min-[375px]:px-4">
      <span className="flex items-center gap-3 font-display text-xl font-bold text-gold-ink">
        <Glyph name="hero" className="shrink-0" />
        <span>A second hero is ready</span>
      </span>
      <span className="text-sm">Recruit a Rogue to adventure instead of {name}. {name} waits exactly where you leave them, and you can switch back once a day.</span>
      <span className="flex items-center gap-1.5 text-sm font-semibold text-gold-ink">Meet the Rogue <Glyph name="play" size={8} /></span>
    </Link>
  )
}
