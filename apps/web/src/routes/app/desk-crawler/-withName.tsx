import { Link } from '@tanstack/react-router'
import { useT } from '../../../lib/i18n'
import { dcLogMessages } from '../../../i18n/dcLog'

/** The backend's stand-in for a player whose name is gone or hidden (D110), shown in the reader's language. */
export const useShownName = () => {
  const t = useT(dcLogMessages)
  return (name: string) => (name === 'Hidden player' ? t.hiddenPlayer : name)
}

/**
 * A line with `{name}` in it, the other player's public name linking to their hero page while it's public (D109).
 * Raids and meetings (D110, D141) both read this way.
 */
export function WithName({ text, name, profile }: { text: string; name: string; profile: boolean }) {
  const [before, after = ''] = text.split('{name}')
  const shown = useShownName()
  return (
    <>
      {before}
      {profile ? <Link to="/desk-crawler/heroes/$alias" params={{ alias: name }} className="font-semibold underline decoration-dotted underline-offset-4">{name}</Link> : shown(name)}
      {after}
    </>
  )
}
