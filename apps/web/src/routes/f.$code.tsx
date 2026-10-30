import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOpenGame } from '../lib/gameAccess'
import { flyLink } from '../lib/scanCodes'

/**
 * D180: the short link Idle Angler's fly QR encodes, like Desk Crawler's `/k/<code>`. It carries the six digits to the
 * logbook's fly box, which adds the fly once the owner is signed in. Not-found until the game is open to the visitor.
 */
export const Route = createFileRoute('/f/$code')({
  beforeLoad: async ({ context, params }) => {
    await requireOpenGame(context, 'idle-angler')
    throw redirect({ ...flyLink(params.code), replace: true })
  },
})
