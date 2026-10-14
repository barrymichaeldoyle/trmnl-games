import { createFileRoute, redirect } from '@tanstack/react-router'

/** D158: the plugin's manage URL from before the rename to Idle Angler, kept until the plugin settings on trmnl.com change. */
export const Route = createFileRoute('/connect/trmnl/slow-cast/manage')({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/connect/trmnl/idle-angler/manage${location.searchStr}`, replace: true })
  },
})
