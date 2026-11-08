import { defineMessages } from '../lib/i18n'

/** The companion's New since your last visit card (D154), on the Hero page and the Dock (D225). */
export const whatsNewMessages = defineMessages({
  en: { newSinceVisit: 'New since your last visit', hide: 'Hide', andMore: (n: number) => `and ${n} more`, seeWhatsNew: 'See what’s new' },
  fr: { newSinceVisit: 'Nouveau depuis votre dernière visite', hide: 'Masquer', andMore: (n: number) => `et ${n} de plus`, seeWhatsNew: 'Voir les nouveautés' },
  de: { newSinceVisit: 'Neu seit deinem letzten Besuch', hide: 'Ausblenden', andMore: (n: number) => `und ${n} weitere`, seeWhatsNew: 'Neuigkeiten ansehen' },
  es: { newSinceVisit: 'Novedades desde tu última visita', hide: 'Ocultar', andMore: (n: number) => `y ${n} más`, seeWhatsNew: 'Ver novedades' },
  it: { newSinceVisit: 'Novità dalla tua ultima visita', hide: 'Nascondi', andMore: (n: number) => `e altri ${n}`, seeWhatsNew: 'Vedi le novità' },
  pt: { newSinceVisit: 'Novidades desde sua última visita', hide: 'Ocultar', andMore: (n: number) => `e mais ${n}`, seeWhatsNew: 'Ver novidades' },
  pl: { newSinceVisit: 'Nowe od ostatniej wizyty', hide: 'Ukryj', andMore: (n: number) => `i jeszcze ${n}`, seeWhatsNew: 'Zobacz nowości' },
  nl: { newSinceVisit: 'Nieuw sinds je laatste bezoek', hide: 'Verbergen', andMore: (n: number) => `en nog ${n}`, seeWhatsNew: 'Bekijk wat er nieuw is' },
})
