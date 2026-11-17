import { defineMessages } from '../lib/i18n'

/** The companion's New to you card (D154, D243), on the Hero page and the Dock (D225). */
export const whatsNewMessages = defineMessages({
  en: { newToYou: 'New to you', nice: 'Nice', andMore: (n: number) => `and ${n} more`, seeWhatsNew: 'See what’s new' },
  fr: { newToYou: 'Nouveau pour vous', nice: 'Super', andMore: (n: number) => `et ${n} de plus`, seeWhatsNew: 'Voir les nouveautés' },
  de: { newToYou: 'Neu für dich', nice: 'Super', andMore: (n: number) => `und ${n} weitere`, seeWhatsNew: 'Neuigkeiten ansehen' },
  es: { newToYou: 'Nuevo para ti', nice: 'Genial', andMore: (n: number) => `y ${n} más`, seeWhatsNew: 'Ver novedades' },
  it: { newToYou: 'Novità per te', nice: 'Bello', andMore: (n: number) => `e altri ${n}`, seeWhatsNew: 'Vedi le novità' },
  pt: { newToYou: 'Novo para você', nice: 'Legal', andMore: (n: number) => `e mais ${n}`, seeWhatsNew: 'Ver novidades' },
  pl: { newToYou: 'Nowe dla ciebie', nice: 'Super', andMore: (n: number) => `i jeszcze ${n}`, seeWhatsNew: 'Zobacz nowości' },
  nl: { newToYou: 'Nieuw voor jou', nice: 'Top', andMore: (n: number) => `en nog ${n}`, seeWhatsNew: 'Bekijk wat er nieuw is' },
})
