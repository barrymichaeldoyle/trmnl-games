import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** False on the server and while hydrating, true once the browser owns the page. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

/**
 * A time in the viewer's own zone and locale. The server renders in UTC with its own locale, so until hydration that
 * text stays hidden (keeping its space) instead of flashing a wrong time. The hydrating render must differ from the
 * next one, or React would keep the server's text: it renders a placeholder whose mismatch is suppressed.
 */
export function LocalTime({ at, format, className }: { at: number; format: (date: Date) => string; className?: string }) {
  const hydrated = useHydrated()
  const date = new Date(at)
  const text = hydrated || typeof window === 'undefined' ? format(date) : '\u2007'
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning className={[className, hydrated ? null : 'invisible'].filter(Boolean).join(' ') || undefined}>
      {text}
    </time>
  )
}
