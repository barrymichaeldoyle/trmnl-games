import type { ReactNode } from 'react'
/**
 * What the device preview looks like before its chunk and template render arrive: the same bezel at the TRMNL X
 * aspect ratio holding the stand-in, with the control rows' height reserved, so nothing moves when it takes over.
 */
export function DeviceStandIn({ standIn, caption }: { standIn: ReactNode; caption: string }) {
  return (
    <figure className="flex flex-col gap-3" aria-busy="true">
      <div className="rounded-[1.4rem] bg-[#3a3566] p-[clamp(0.5rem,2.5vw,1rem)]">
        <div className="relative overflow-hidden rounded-md bg-white" style={{ aspectRatio: '1872 / 1404' }}>{standIn}</div>
      </div>
      <figcaption className="text-sm text-muted">
        {/* Matches the preview's three control rows: layout, device and orientation. */}
        <div aria-hidden="true" className="h-[9.25rem]" />
        <p className="mt-3">{caption}</p>
      </figcaption>
    </figure>
  )
}
