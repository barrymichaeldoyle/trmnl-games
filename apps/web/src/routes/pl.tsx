import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOpenGame } from '../lib/gameAccess'

/**
 * The short link Paper Lives' screen codes encode (D159), like Idle Angler's `/ia`: a shorter URL draws a smaller QR.
 * Not-found until the game is open to the visitor, so a hidden game's link does not announce it.
 */
export const Route = createFileRoute('/pl')({
  beforeLoad: async ({ context }) => {
    await requireOpenGame(context, 'paper-lives')
    throw redirect({ to: '/app/paper-lives', replace: true })
  },
})
