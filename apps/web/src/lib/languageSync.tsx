import { useUser } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import { useEffect } from 'react'
import { readLocaleCookie, useLocale, writeLocaleCookie } from './i18n'

const RELOADED = 'tg_locale_synced'

/**
 * D169: a signed-in player's saved language follows them to a new browser. When the account names a language this
 * page was not rendered in, remember it in this browser's cookie and reload once, so the server renders it. The
 * session flag stops a loop where cookies are blocked.
 */
export function LanguageSync() {
  const { user, isLoaded } = useUser()
  const { data: me } = useQuery({ ...convexQuery(api.users.me, {}), enabled: isLoaded && !!user })
  const locale = useLocale()
  const saved = me?.user?.language ?? null
  useEffect(() => {
    if (saved === null || saved === locale) return
    try {
      if (sessionStorage.getItem(RELOADED) === saved) return
      sessionStorage.setItem(RELOADED, saved)
    } catch {
      return
    }
    if (readLocaleCookie() !== saved) writeLocaleCookie(saved)
    window.location.reload()
  }, [saved, locale])
  return null
}
