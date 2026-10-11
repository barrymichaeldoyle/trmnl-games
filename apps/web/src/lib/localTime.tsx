import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** False on the server and while hydrating, true once the browser owns the page. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

/**
 * A time in the viewer's own zone and locale. The server renders in UTC with its own locale, so until hydration the
 * server's text stays hidden (keeping its space) instead of flashing a wrong time.
 */
export function LocalTime({ at, format, className }: { at: number; format: (date: Date) => string; className?: string }) {
  const hydrated = useHydrated()
  const date = new Date(at)
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning className={[className, hydrated ? null : 'invisible'].filter(Boolean).join(' ') || undefined}>
      {format(date)}
    </time>
  )
}
