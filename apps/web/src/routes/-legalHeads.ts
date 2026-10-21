import type { Locale } from '@trmnl-games/platform'

/**
 * What the privacy and terms routes' `head` functions read: a route's head stays in the main bundle, so with the titles
 * here the eight languages' pages only load with the page. Each language's page reads its own back.
 */
export interface LegalHead {
  readonly title: string
  readonly seoTitle?: string
  readonly description: string
}

/** The privacy page, by language. */
export const PRIVACY_HEAD: Readonly<Record<Locale, LegalHead>> = {
  en: { title: 'Privacy', description: 'What TRMNL Games stores, what is public on leaderboards and TRMNL screens, and how to delete your account.' },
  fr: { title: 'Confidentialité', description: 'Ce que TRMNL Games conserve, ce qui est public dans les classements et sur les écrans TRMNL, et comment supprimer votre compte.' },
  de: { title: 'Datenschutz', description: 'Was TRMNL Games speichert, was in Ranglisten und auf TRMNL-Bildschirmen öffentlich ist und wie du dein Konto löschst.' },
  es: { title: 'Privacidad', description: 'Qué guarda TRMNL Games, qué es público en las clasificaciones y en las pantallas TRMNL, y cómo borrar tu cuenta.' },
  it: { title: 'Privacy', description: 'Cosa conserva TRMNL Games, cosa è pubblico nelle classifiche e sugli schermi TRMNL, e come eliminare il tuo account.' },
  pt: { title: 'Privacidade', description: 'O que o TRMNL Games guarda, o que é público nos rankings e nas telas TRMNL, e como excluir sua conta.' },
  pl: { title: 'Prywatność', description: 'Co przechowuje TRMNL Games, co jest publiczne w rankingach i na ekranach TRMNL i jak usunąć konto.' },
  nl: { title: 'Privacy', description: 'Wat TRMNL Games bewaart, wat openbaar is in ranglijsten en op TRMNL-schermen, en hoe je je account verwijdert.' },
}

/** The terms page, by language. */
export const TERMS_HEAD: Readonly<Record<Locale, LegalHead>> = {
  en: { title: 'Terms of use', seoTitle: 'Terms', description: 'The rules for playing Desk Crawler: a free game, provided as-is, with fair-play and public-name rules.' },
  fr: { title: 'Conditions d’utilisation', seoTitle: 'Conditions', description: 'Les règles pour jouer à Desk Crawler : un jeu gratuit, fourni en l’état, avec des règles de fair-play et de noms publics.' },
  de: { title: 'Nutzungsbedingungen', description: 'Die Regeln für Desk Crawler: ein kostenloses Spiel, bereitgestellt wie es ist, mit Regeln für Fairplay und öffentliche Namen.' },
  es: { title: 'Condiciones de uso', seoTitle: 'Condiciones', description: 'Las reglas para jugar a Desk Crawler: un juego gratuito, ofrecido tal cual, con normas de juego limpio y de nombres públicos.' },
  it: { title: 'Termini d’uso', seoTitle: 'Termini', description: 'Le regole per giocare a Desk Crawler: un gioco gratuito, fornito così com’è, con regole sul fair play e sui nomi pubblici.' },
  pt: { title: 'Termos de uso', seoTitle: 'Termos', description: 'As regras para jogar Desk Crawler: um jogo gratuito, oferecido como está, com regras de jogo limpo e de nomes públicos.' },
  pl: { title: 'Warunki korzystania', seoTitle: 'Warunki', description: 'Zasady gry w Desk Crawler: darmowa gra udostępniana w obecnej postaci, z zasadami uczciwej gry i nazw publicznych.' },
  nl: { title: 'Gebruiksvoorwaarden', seoTitle: 'Voorwaarden', description: 'De regels voor het spelen van Desk Crawler: een gratis spel, geleverd zoals het is, met regels voor eerlijk spel en openbare namen.' },
}
