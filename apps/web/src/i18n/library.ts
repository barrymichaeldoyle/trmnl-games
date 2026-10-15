import { defineMessages } from '../lib/i18n'

/** D169: the signed-in games library (/app). */
export const libraryMessages = defineMessages({
  en: {
    title: 'My games',
    loading: 'Loading your games…',
    removing: 'Removing your game progress…',
    open: (game: string) => `Open ${game}`,
    about: (game: string) => `About ${game}`,
    sampleAlt: 'A sample Idle Angler screen',
    hiddenAdmins: 'Hidden: only admins can see this',
  },
  fr: {
    title: 'Mes jeux',
    loading: 'Chargement de vos jeux…',
    removing: 'Suppression de votre progression…',
    open: (game: string) => `Ouvrir ${game}`,
    about: (game: string) => `À propos de ${game}`,
    sampleAlt: 'Un exemple d’écran Idle Angler',
    hiddenAdmins: 'Masqué : seuls les admins le voient',
  },
  de: {
    title: 'Meine Spiele',
    loading: 'Deine Spiele werden geladen …',
    removing: 'Dein Spielfortschritt wird gelöscht …',
    open: (game: string) => `${game} öffnen`,
    about: (game: string) => `Über ${game}`,
    sampleAlt: 'Ein Beispiel-Bildschirm von Idle Angler',
    hiddenAdmins: 'Verborgen: nur für Admins sichtbar',
  },
})
