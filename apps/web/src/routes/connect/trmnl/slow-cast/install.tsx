import { createFileRoute, redirect } from '@tanstack/react-router'

/** D158: the plugin's install URL from before the rename to Idle Angler, kept until the plugin settings on trmnl.com change. */
export const Route = createFileRoute('/connect/trmnl/slow-cast/install')({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/connect/trmnl/idle-angler/install${location.searchStr}`, replace: true })
  },
})
