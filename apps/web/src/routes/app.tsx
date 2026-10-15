import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AuthShell } from '../lib/platformShell'
import { seo } from '../lib/seo'
import { messagesFor } from '../lib/i18n'
import { libraryMessages } from '../i18n/library'

export const Route = createFileRoute('/app')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(libraryMessages, locale).title, index: false, locale }),
  component: () => <AuthShell><Outlet /></AuthShell>,
})
