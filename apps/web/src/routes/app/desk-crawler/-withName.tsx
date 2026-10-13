import { Link } from '@tanstack/react-router'

/**
 * A line with `{name}` in it, the other player's public name linking to their hero page while it's public (D109).
 * Raids and meetings (D110, D141) both read this way.
 */
export function WithName({ text, name, profile }: { text: string; name: string; profile: boolean }) {
  const [before, after = ''] = text.split('{name}')
  return (
    <>
      {before}
      {profile ? <Link to="/desk-crawler/heroes/$alias" params={{ alias: name }} className="font-semibold underline decoration-dotted underline-offset-4">{name}</Link> : name}
      {after}
    </>
  )
}
