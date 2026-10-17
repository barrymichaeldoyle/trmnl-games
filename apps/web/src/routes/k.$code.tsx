import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * D180: the short link a waiting keepsake's QR encodes. It carries the six digits to the hero page, which collects the
 * keepsake once the owner is signed in; anything but six digits just opens the hero page.
 */
export const Route = createFileRoute('/k/$code')({
  beforeLoad: ({ params }) => {
    const digits = params.code.replace(/\D/g, '')
    throw redirect({ to: '/app/desk-crawler', search: /^\d{6}$/.test(digits) ? { keepsake: digits } : {}, replace: true })
  },
})
