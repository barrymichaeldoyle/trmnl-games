import { createFileRoute, redirect } from '@tanstack/react-router'

/** The pre-launch list page (D105) was shared widely; since the marketplace listing went live it sends visitors to the pitch with its Install button. */
export const Route = createFileRoute('/desk-crawler/waiting-list')({
  beforeLoad: () => {
    throw redirect({ to: '/', statusCode: 301 })
  },
})
