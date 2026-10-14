import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOpenGame } from '../lib/gameAccess'

/**
 * The short link Idle Angler's screen codes encode (D115), like Desk Crawler's `/dc`: a shorter URL draws a smaller QR.
 * Not-found until the game is open to the visitor, so a hidden game's link does not announce it.
 */
export const Route = createFileRoute('/ia')({
  beforeLoad: async ({ context }) => {
    await requireOpenGame(context, 'idle-angler')
    throw redirect({ to: '/app/idle-angler', replace: true })
  },
})
