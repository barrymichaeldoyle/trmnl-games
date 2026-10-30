import { createFileRoute, redirect } from '@tanstack/react-router'
import { keepsakeLink } from '../lib/scanCodes'

/**
 * D180: the short link a waiting keepsake's QR encodes. It carries the six digits to the keepsakes page, which collects
 * the keepsake once the owner is signed in (D218); anything but six digits just opens the hero page.
 */
export const Route = createFileRoute('/k/$code')({
  beforeLoad: ({ params }) => {
    throw redirect({ ...keepsakeLink(params.code), replace: true })
  },
})
