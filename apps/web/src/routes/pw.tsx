import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOpenGame } from '../lib/gameAccess'

/**
 * The short link Pixel Wars' screen codes encode (D214), like Little Plot's `/lp`: a shorter URL draws a smaller QR.
 * Not-found until the game is open to the visitor, so a hidden game's link does not announce it.
 */
export const Route = createFileRoute('/pw')({
  beforeLoad: async ({ context }) => {
    await requireOpenGame(context, 'pixel-wars')
    throw redirect({ to: '/app/pixel-wars', replace: true })
  },
})
