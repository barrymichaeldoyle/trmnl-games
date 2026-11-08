import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Keep selected catches actionable, reserving the actual wrapped height in every language and viewport. */
export function SelectionBar({ children, onHeight }: { children: ReactNode; onHeight: (height: number) => void }) {
  const bar = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const element = bar.current
    if (!element) return
    const measure = () => { const next = element.getBoundingClientRect().height; setHeight(next); onHeight(next) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => { observer.disconnect(); onHeight(0) }
  }, [onHeight])
  return <>
    <div aria-hidden="true" style={{ height }} />
    <div ref={bar} className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 min-[375px]:px-4">
      <div className="window pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
    </div>
  </>
}
