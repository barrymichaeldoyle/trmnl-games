import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '@trmnl-games/backend/api'
import type { PresentationOptions } from '@trmnl-games/desk-crawler/log'
import { useLocale } from './i18n'

/** D169: how the reader's stories are told: their language, and the hero French participles agree with. */
export function useStoryOptions(): PresentationOptions {
  const locale = useLocale()
  const { data: hero } = useQuery({ ...convexQuery(api.heroes.mine, {}), enabled: locale === 'fr' })
  const gender = (hero as { gender?: 'male' | 'female' } | null | undefined)?.gender
  return { locale, ...(gender === undefined ? {} : { heroGender: gender }) }
}
