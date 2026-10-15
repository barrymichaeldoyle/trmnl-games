import type { ComponentType } from 'react'

/** D169: one language's privacy policy or terms. Translations say the English text prevails where they differ. */
export interface LegalPage {
  readonly title: string
  /** The browser tab's title where it differs from the heading ("Terms" for "Terms of use"). */
  readonly seoTitle?: string
  readonly description: string
  /** Shown first in a translation: the English text is the one that counts. */
  readonly translationNote?: ComponentType
  readonly Body: ComponentType
  readonly IdleAngler?: ComponentType
  readonly PaperLives?: ComponentType
}
