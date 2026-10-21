import type { Locale } from '@trmnl-games/platform'

/**
 * What the help routes' `head` functions read, apart from the pages themselves: a route's head stays in the main bundle,
 * so with the titles here the eight languages' pages only load with the page. Each language's page reads its own back.
 */
export interface HelpHead {
  readonly seoTitle: string
  readonly description: string
}

/** Desk Crawler help, by language. */
export const DESK_CRAWLER_HELP_HEAD: Readonly<Record<Locale, HelpHead>> = {
  en: { seoTitle: 'Desk Crawler help and setup', description: 'How to set up Desk Crawler on TRMNL and how each part of the game works, with fixes for a screen that looks out of date.' },
  fr: { seoTitle: 'Aide et installation de Desk Crawler', description: 'Comment installer Desk Crawler sur TRMNL et comment fonctionne chaque partie du jeu, avec des solutions quand l’écran semble en retard.' },
  de: { seoTitle: 'Desk Crawler: Hilfe und Einrichtung', description: 'Wie du Desk Crawler auf TRMNL einrichtest und wie jeder Teil des Spiels funktioniert, mit Lösungen, wenn der Bildschirm veraltet aussieht.' },
  es: { seoTitle: 'Ayuda e instalación de Desk Crawler', description: 'Cómo instalar Desk Crawler en TRMNL y cómo funciona cada parte del juego, con soluciones para cuando la pantalla parece desfasada.' },
  it: { seoTitle: 'Aiuto e installazione di Desk Crawler', description: 'Come installare Desk Crawler su TRMNL e come funziona ogni parte del gioco, con le soluzioni quando lo schermo sembra indietro.' },
  pt: { seoTitle: 'Ajuda e instalação do Desk Crawler', description: 'Como instalar o Desk Crawler no TRMNL e como funciona cada parte do jogo, com soluções para quando a tela parece desatualizada.' },
  pl: { seoTitle: 'Desk Crawler: pomoc i instalacja', description: 'Jak zainstalować Desk Crawler na TRMNL i jak działa każda część gry, z rozwiązaniami na wypadek, gdy ekran wydaje się nieaktualny.' },
  nl: { seoTitle: 'Desk Crawler: hulp en installatie', description: 'Hoe je Desk Crawler op TRMNL installeert en hoe elk onderdeel van het spel werkt, met oplossingen als het scherm achterloopt.' },
}

/** Idle Angler help, by language. */
export const IDLE_ANGLER_HELP_HEAD: Readonly<Record<Locale, HelpHead>> = {
  en: { seoTitle: 'Idle Angler help', description: 'How Idle Angler fishes on your TRMNL: bait, the cooler, rods, waters, seasons, the logbook, weekend Opens and the fly box.' },
  fr: { seoTitle: 'Aide Idle Angler', description: 'Comment Idle Angler pêche sur votre TRMNL : appâts, glacière, cannes, plans d’eau, saisons, carnet, Opens du week-end et boîte à mouches.' },
  de: { seoTitle: 'Hilfe zu Idle Angler', description: 'So angelt Idle Angler auf deinem TRMNL: Köder, Kühlbox, Ruten, Gewässer, Jahreszeiten, Fangbuch, Wochenend-Opens und Fliegendose.' },
  es: { seoTitle: 'Ayuda de Idle Angler', description: 'Cómo pesca Idle Angler en tu TRMNL: cebos, nevera, cañas, aguas, estaciones, cuaderno, Opens del fin de semana y caja de moscas.' },
  it: { seoTitle: 'Guida di Idle Angler', description: 'Come pesca Idle Angler sul tuo TRMNL: esche, frigo, canne, acque, stagioni, registro, Open del fine settimana e scatola delle mosche.' },
  pt: { seoTitle: 'Ajuda do Idle Angler', description: 'Como o Idle Angler pesca no seu TRMNL: iscas, cooler, varas, águas, estações, caderno, Opens de fim de semana e caixa de moscas.' },
  pl: { seoTitle: 'Pomoc: Idle Angler', description: 'Jak Idle Angler łowi na twoim TRMNL: przynęty, lodówka, wędki, łowiska, pory roku, rejestr, weekendowe zawody Open i pudełko na muchy.' },
  nl: { seoTitle: 'Hulp bij Idle Angler', description: 'Zo vist Idle Angler op je TRMNL: aas, koelbox, hengels, wateren, seizoenen, logboek, weekend-Opens en vliegendoos.' },
}

/** The game page's social image, which the help page shares. */
export const SAMPLE_IMAGE = { path: '/games/idle-angler/sample.png', alt: 'A sample Idle Angler screen' }
