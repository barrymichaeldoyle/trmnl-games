import { contentTranslator, type ContentTranslator } from '@trmnl-games/desk-crawler/i18n/lazy'
import { useLocale } from './i18n'

/** D169: the content translator for the reader's language: game names, catalog lines and stored stories. */
export const useContent = (): ContentTranslator => contentTranslator(useLocale())
