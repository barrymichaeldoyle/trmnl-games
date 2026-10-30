import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * D180: the short link a waiting keepsake's QR encodes. It carries the six digits to the keepsakes page, which collects
 * the keepsake once the owner is signed in (D218); anything but six digits just opens the hero page.
 */
export const Route = createFileRoute('/k/$code')({
  beforeLoad: ({ params }) => {
    const digits = params.code.replace(/\D/g, '')
    throw redirect(/^\d{6}$/.test(digits) ? { to: '/app/desk-crawler/keepsakes', search: { keepsake: digits }, replace: true } : { to: '/app/desk-crawler', replace: true })
  },
})
