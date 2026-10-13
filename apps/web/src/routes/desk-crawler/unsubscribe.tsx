import { createFileRoute } from '@tanstack/react-router'
import { ProsePage } from '../../lib/prose'
import { seo } from '../../lib/seo'

export const Route = createFileRoute('/desk-crawler/unsubscribe')({
  headers: () => ({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' }),
  head: () => seo({ title: 'Launch list', index: false }),
  component: Unsubscribe,
})

/**
 * The launch email's unsubscribe link (D105). The one launch email went out on 13 October 2026 and every address was
 * deleted as it was accepted, so there is nothing left to remove, whatever the link carries.
 */
function Unsubscribe() {
  return (
    <ProsePage title="Launch list">
      <p role="status">You’re off the list. The launch email was the only one we sent, and every address on the list has been deleted.</p>
    </ProsePage>
  )
}
