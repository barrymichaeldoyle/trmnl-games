import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOpenGame } from '../lib/gameAccess'

/**
 * The short link Little Plot's screen codes encode (D206), like Paper Lives' `/pl`: a shorter URL draws a smaller QR.
 * Not-found until the game is open to the visitor, so a hidden game's link does not announce it.
 */
export const Route = createFileRoute('/lp')({
  beforeLoad: async ({ context }) => {
    await requireOpenGame(context, 'little-plot')
    throw redirect({ to: '/app/little-plot', replace: true })
  },
})
