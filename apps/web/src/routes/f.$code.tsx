import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOpenGame } from '../lib/gameAccess'

/**
 * D180: the short link Idle Angler's fly QR encodes, like Desk Crawler's `/k/<code>`. It carries the six digits to the
 * logbook's fly box, which adds the fly once the owner is signed in. Not-found until the game is open to the visitor.
 */
export const Route = createFileRoute('/f/$code')({
  beforeLoad: async ({ context, params }) => {
    await requireOpenGame(context, 'idle-angler')
    const digits = params.code.replace(/\D/g, '')
    throw redirect({ to: '/app/idle-angler/logbook', search: /^\d{6}$/.test(digits) ? { fly: digits } : {}, replace: true })
  },
})
