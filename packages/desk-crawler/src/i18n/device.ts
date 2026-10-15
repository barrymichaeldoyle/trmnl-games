import type { Locale } from '@trmnl-games/platform'
import { contentTranslator } from './index'

/**
 * D169: what the TRMNL screen says in the owner's language, outside the stories (which the content dictionaries tell):
 * the status line, attention and notice lines, the celebration badge, QR captions, the recap and the template's own
 * labels. Area names arrive already marked bold (`[[…]]`) with their article outside the marks.
 */
export interface DeviceWords {
  readonly exploring: (area: string) => string
  readonly resting: (area: string) => string
  readonly arrivalPending: string
  readonly travelling: (area: string) => string
  readonly toArriving: (area: string) => string
  readonly revivalPending: string
  readonly knockedOutBack: (duration: string) => string
  readonly knockedOutBackAt: string
  readonly pausedByYou: string
  readonly resumePending: string
  readonly resumeSoon: string
  readonly resumeAt: string
  readonly bagFullHolding: string
  readonly bagFullFree: string
  readonly setupNotFinished: string
  readonly duration: (hours: number, minutes: number) => string
  readonly offTo: (area: string, time: string | null) => string
  readonly serviceCheck: string
  readonly delayed: string
  readonly revives: string
  readonly makeRoom: string
  readonly maintenance: string
  readonly signIn: string
  readonly decisionWaiting: string
  readonly merchantVisiting: string
  readonly achievement: (title: string) => string
  readonly levelUp: (level: number) => string
  readonly eliteDefeated: string
  readonly jackpot: string
  readonly epicFind: string
  readonly rareFind: string
  readonly scanSetup: string
  readonly scanBag: string
  readonly scanCompanion: string
  readonly waitingFirst: string
  readonly rankingSoon: string
  readonly cohort: (key: string) => string
  readonly nightRecap: string
  readonly dayRecap: string
  readonly partial: string
  readonly recap: {
    readonly levels: (n: number) => string
    /** Beside the travel mark, which already says the hero got there; French and German keep the narrow views to the name. */
    readonly reached: (area: string) => string
    readonly rareFinds: (n: number) => string
    readonly elites: (n: number) => string
    readonly jackpots: (n: number) => string
    readonly bagFull: string
    readonly knockouts: (n: number) => string
    readonly revivals: (n: number) => string
    readonly raidsWon: (n: number) => string
    readonly raidsLost: (n: number) => string
    readonly raids: (n: number, won: number) => string
    readonly tasks: (n: number) => string
    readonly gold: (n: number) => string
    readonly wins: (n: number) => string
    readonly gearFinds: (n: number) => string
    readonly potions: (n: number) => string
    readonly breaks: (n: number) => string
    readonly continued: string
    readonly noSample: string
    readonly noNew: string
  }
  /** The template's fixed words, read as `labels.*` (template v57). */
  readonly labels: {
    readonly level: string
    /** `%name%` stands for the hero's name (Ruby Liquid will not lex braces inside a string). */
    readonly ready: string
    readonly back_soon: string
    readonly finish_setup: string
    readonly hp: string
    readonly done: string
    readonly gold: string
    readonly potion: string
    readonly potions: string
    readonly weapon: string
    readonly armor: string
    readonly none: string
    readonly no_weapon: string
    readonly no_armor: string
    readonly this_week: string
    readonly levels: string
    readonly lv: string
    readonly not_ranked_paused: string
    readonly ranking_soon: string
    readonly your_bag: string
    readonly bag_full: string
    readonly bag_paused: string
    readonly first_soon: string
    readonly first_15: string
    readonly first_15_short: string
    readonly scan_phone: string
    readonly scan_phone_short: string
    readonly scan_manage: string
    readonly goal: string
    readonly todo_today: string
    readonly leaves: string
    readonly keepsake: string
    readonly keepsake_word: string
  }
}

const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const en: DeviceWords = {
  exploring: (area) => `Exploring the ${area}`,
  resting: (area) => `Resting in the ${area}`,
  arrivalPending: 'Arrival pending',
  travelling: (area) => `Travelling to the ${area}`,
  toArriving: (area) => `To the ${area}, arriving`,
  revivalPending: 'Revival pending',
  knockedOutBack: (duration) => `Knocked out. Back in about ${duration}`,
  knockedOutBackAt: 'Knocked out, back at',
  pausedByYou: 'Paused by you',
  resumePending: 'Resume pending',
  resumeSoon: 'Adventures resume soon',
  resumeAt: 'Adventures resume at',
  bagFullHolding: 'Bag full, holding a new find',
  bagFullFree: 'Bag full. Free a slot to resume.',
  setupNotFinished: 'Setup not finished',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`),
  offTo: (area, time) => (time === null ? `Off to the ${area}.` : `Off to the ${area}, arriving ${time}.`),
  serviceCheck: 'Paused for a service check.',
  delayed: 'Updates are delayed.',
  revives: 'Revives automatically with all XP and gear.',
  makeRoom: 'Make room in your bag in the companion, then resume.',
  maintenance: 'Desk Crawler is down for maintenance.',
  signIn: 'Sign in to the companion, then save this plugin in TRMNL.',
  decisionWaiting: 'A decision is waiting in the companion.',
  merchantVisiting: 'Merchant visiting. Shop in the companion soon.',
  achievement: (title) => `Achievement: ${title}`,
  levelUp: (level) => `Level up! Now level ${level}`,
  eliteDefeated: 'Elite defeated!',
  jackpot: 'Jackpot!',
  epicFind: 'Epic find!',
  rareFind: 'Rare find!',
  scanSetup: 'Scan to finish setup',
  scanBag: 'Scan to open your bag',
  scanCompanion: 'Scan to open your companion',
  waitingFirst: 'Waiting for the first adventure',
  rankingSoon: 'Ranking within the hour',
  cohort: (key) => `Levels ${key.replace('-', '–').replace('+', ' and up')}`,
  nightRecap: 'Night recap',
  dayRecap: 'Day recap',
  partial: 'partial',
  recap: {
    levels: (c) => `+${n(c, 'level', 'levels')}`,
    reached: (area) => `Reached ${area}`,
    rareFinds: (c) => n(c, 'rare find', 'rare finds'),
    elites: (c) => n(c, 'elite', 'elites'),
    jackpots: (c) => n(c, 'jackpot', 'jackpots'),
    bagFull: 'Bag full',
    knockouts: (c) => n(c, 'knockout', 'knockouts'),
    revivals: (c) => n(c, 'revival', 'revivals'),
    raidsWon: (c) => n(c, 'raid won', 'raids won'),
    raidsLost: (c) => n(c, 'raid lost', 'raids lost'),
    raids: (c, won) => `${n(c, 'raid', 'raids')}, ${won} won`,
    tasks: (c) => n(c, 'task', 'tasks'),
    gold: (c) => `${c} gold`,
    wins: (c) => n(c, 'win', 'wins'),
    gearFinds: (c) => n(c, 'gear find', 'gear finds'),
    potions: (c) => n(c, 'potion', 'potions'),
    breaks: (c) => n(c, 'break', 'breaks'),
    continued: 'Adventures continued',
    noSample: 'No adventures in sample',
    noNew: 'No new adventures',
  },
  labels: {
    level: 'level', ready: '%name% is ready', back_soon: 'Back soon', finish_setup: 'Finish setting up', hp: 'HP', done: 'Done', gold: 'gold', potion: 'potion', potions: 'potions', weapon: 'Weapon', armor: 'Armor', none: 'None', no_weapon: 'No weapon', no_armor: 'No armor',
    this_week: 'This week', levels: 'Levels ', lv: 'Lv ', not_ranked_paused: 'Not ranked while paused', ranking_soon: 'Ranking within the hour', your_bag: 'Your bag',
    bag_full: 'Bag full', bag_paused: 'Adventures are paused until you make room.', first_soon: 'The first adventure starts soon.', first_15: 'The first adventure starts within 15 minutes.',
    first_15_short: 'First adventure within 15 minutes', scan_phone: 'Scan with your phone to open the companion.', scan_phone_short: 'Scan with your phone.',
    scan_manage: 'Scan to open your companion: manage gear and pick where to explore.', goal: 'Goal: ', todo_today: 'Today\'s to-do', leaves: 'leaves', keepsake: 'Keepsake', keepsake_word: ' code',
  },
}

const fr: DeviceWords = {
  exploring: (area) => `Explore ${area}`,
  resting: (area) => `Se repose dans ${area}`,
  arrivalPending: 'Arrivée imminente',
  travelling: (area) => `En route pour ${area}`,
  toArriving: (area) => `Vers ${area}, arrivée à`,
  revivalPending: 'Retour imminent',
  knockedOutBack: (duration) => `K.-O. De retour dans ${duration} environ`,
  knockedOutBackAt: 'K.-O., de retour à',
  pausedByYou: 'Mis en pause par vous',
  resumePending: 'Reprise imminente',
  resumeSoon: 'Les aventures reprennent bientôt',
  resumeAt: 'Reprise des aventures à',
  bagFullHolding: 'Sac plein, une trouvaille en attente',
  bagFullFree: 'Sac plein. Libérez une place pour reprendre.',
  setupNotFinished: 'Installation non terminée',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes}`),
  offTo: (area, time) => (time === null ? `En route pour ${area}.` : `En route pour ${area}, arrivée à ${time}.`),
  serviceCheck: 'En pause pour une vérification technique.',
  delayed: 'Les mises à jour ont du retard.',
  revives: 'Revient tout seul, avec toute son XP et son équipement.',
  makeRoom: 'Faites de la place dans votre sac depuis le compagnon, puis reprenez.',
  maintenance: 'Desk Crawler est en maintenance.',
  signIn: 'Connectez-vous au compagnon, puis enregistrez ce plugin dans TRMNL.',
  decisionWaiting: 'Une décision vous attend dans le compagnon.',
  merchantVisiting: 'Un marchand est de passage. Faites vos achats dans le compagnon.',
  achievement: (title) => `Succès : ${title}`,
  levelUp: (level) => `Niveau supérieur ! Niveau ${level}`,
  eliteDefeated: 'Élite vaincue !',
  jackpot: 'Jackpot !',
  epicFind: 'Trouvaille épique !',
  rareFind: 'Trouvaille rare !',
  scanSetup: 'Scannez pour terminer l’installation',
  scanBag: 'Scannez pour ouvrir votre sac',
  scanCompanion: 'Scannez pour ouvrir le compagnon',
  waitingFirst: 'En attente de la première aventure',
  rankingSoon: 'Classement dans l’heure',
  cohort: (key) => `Niveaux ${key.replace('-', '–').replace('+', ' et plus')}`,
  nightRecap: 'Bilan de la nuit',
  dayRecap: 'Bilan de la journée',
  partial: 'partiel',
  recap: {
    levels: (c) => `+${n(c, 'niveau', 'niveaux')}`,
    reached: (area) => area,
    rareFinds: (c) => n(c, 'trouvaille rare', 'trouvailles rares'),
    elites: (c) => n(c, 'élite', 'élites'),
    jackpots: (c) => n(c, 'jackpot', 'jackpots'),
    bagFull: 'Sac plein',
    knockouts: (c) => `${c} K.-O.`,
    revivals: (c) => n(c, 'retour', 'retours'),
    raidsWon: (c) => n(c, 'raid gagné', 'raids gagnés'),
    raidsLost: (c) => n(c, 'raid perdu', 'raids perdus'),
    raids: (c, won) => `${n(c, 'raid', 'raids')}, ${won} ${won === 1 ? 'gagné' : 'gagnés'}`,
    tasks: (c) => n(c, 'tâche', 'tâches'),
    gold: (c) => `${c} or`,
    wins: (c) => n(c, 'victoire', 'victoires'),
    gearFinds: (c) => n(c, 'équipement trouvé', 'équipements trouvés'),
    potions: (c) => n(c, 'potion', 'potions'),
    breaks: (c) => n(c, 'pause', 'pauses'),
    continued: 'Les aventures continuent',
    noSample: 'Aucune aventure dans l’échantillon',
    noNew: 'Aucune nouvelle aventure',
  },
  labels: {
    level: 'niveau', ready: 'Tout est prêt pour %name%', back_soon: 'De retour bientôt', finish_setup: 'Terminez l’installation', hp: 'PV', done: 'Fait', gold: 'or', potion: 'potion', potions: 'potions', weapon: 'Arme', armor: 'Armure', none: 'Aucune', no_weapon: 'Sans arme', no_armor: 'Sans armure',
    this_week: 'Cette semaine', levels: 'Niveaux ', lv: 'Niv ', not_ranked_paused: 'Non classé pendant la pause', ranking_soon: 'Classement dans l’heure', your_bag: 'Votre sac',
    bag_full: 'Sac plein', bag_paused: 'Les aventures sont en pause jusqu’à ce que vous fassiez de la place.', first_soon: 'La première aventure commence bientôt.', first_15: 'La première aventure commence d’ici 15 minutes.',
    first_15_short: 'Première aventure d’ici 15 minutes', scan_phone: 'Scannez avec votre téléphone pour ouvrir le compagnon.', scan_phone_short: 'Scannez avec votre téléphone.',
    scan_manage: 'Scannez pour ouvrir le compagnon : gérez l’équipement et choisissez où explorer.', goal: 'Objectif : ', todo_today: 'Tâches du jour', leaves: 'part à', keepsake: 'Code', keepsake_word: ' souvenir',
  },
}

const de: DeviceWords = {
  exploring: (area) => `Erkundet ${area}`,
  resting: (area) => `Ruht sich ${area} aus`,
  arrivalPending: 'Ankunft steht bevor',
  travelling: (area) => `Unterwegs ${area}`,
  toArriving: (area) => `${area.replace(/^./, (c) => c.toUpperCase())}, Ankunft um`,
  revivalPending: 'Rückkehr steht bevor',
  knockedOutBack: (duration) => `K. o. Zurück in etwa ${duration}`,
  knockedOutBackAt: 'K. o., zurück um',
  pausedByYou: 'Von dir pausiert',
  resumePending: 'Fortsetzen steht bevor',
  resumeSoon: 'Die Abenteuer gehen bald weiter',
  resumeAt: 'Abenteuer gehen weiter um',
  bagFullHolding: 'Tasche voll, ein neuer Fund wartet',
  bagFullFree: 'Tasche voll. Mach einen Platz frei, um fortzusetzen.',
  setupNotFinished: 'Einrichtung nicht abgeschlossen',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} Min.` : minutes === 0 ? `${hours} Std.` : `${hours} Std. ${minutes} Min.`),
  offTo: (area, time) => (time === null ? `Unterwegs ${area}.` : `Unterwegs ${area}, Ankunft um ${time}.`),
  serviceCheck: 'Für eine Wartungsprüfung pausiert.',
  delayed: 'Updates verspäten sich.',
  revives: 'Kommt automatisch zurück, mit allen XP und aller Ausrüstung.',
  makeRoom: 'Schaff in der Begleit-App Platz in deiner Tasche und setz dann fort.',
  maintenance: 'Desk Crawler wird gerade gewartet.',
  signIn: 'Melde dich in der Begleit-App an und speichere dann dieses Plugin in TRMNL.',
  decisionWaiting: 'In der Begleit-App wartet eine Entscheidung.',
  merchantVisiting: 'Ein Händler ist da. Kauf bald in der Begleit-App ein.',
  achievement: (title) => `Erfolg: ${title}`,
  levelUp: (level) => `Stufenaufstieg! Jetzt Stufe ${level}`,
  eliteDefeated: 'Elite besiegt!',
  jackpot: 'Jackpot!',
  epicFind: 'Epischer Fund!',
  rareFind: 'Seltener Fund!',
  scanSetup: 'Scannen, um die Einrichtung abzuschließen',
  scanBag: 'Scannen, um deine Tasche zu öffnen',
  scanCompanion: 'Scannen, um die Begleit-App zu öffnen',
  waitingFirst: 'Warten auf das erste Abenteuer',
  rankingSoon: 'Rangliste innerhalb der Stunde',
  cohort: (key) => `Stufen ${key.replace('-', '–').replace('+', ' und höher')}`,
  nightRecap: 'Nacht-Rückblick',
  dayRecap: 'Tages-Rückblick',
  partial: 'unvollständig',
  recap: {
    levels: (c) => `+${n(c, 'Stufe', 'Stufen')}`,
    reached: (area) => area,
    rareFinds: (c) => n(c, 'seltener Fund', 'seltene Funde'),
    elites: (c) => n(c, 'Elite', 'Elites'),
    jackpots: (c) => n(c, 'Jackpot', 'Jackpots'),
    bagFull: 'Tasche voll',
    knockouts: (c) => `${c} K. o.`,
    revivals: (c) => n(c, 'Rückkehr', 'Rückkehren'),
    raidsWon: (c) => n(c, 'Überfall gewonnen', 'Überfälle gewonnen'),
    raidsLost: (c) => n(c, 'Überfall verloren', 'Überfälle verloren'),
    raids: (c, won) => `${n(c, 'Überfall', 'Überfälle')}, ${won} gewonnen`,
    tasks: (c) => n(c, 'Aufgabe', 'Aufgaben'),
    gold: (c) => `${c} Gold`,
    wins: (c) => n(c, 'Sieg', 'Siege'),
    gearFinds: (c) => n(c, 'Ausrüstungsfund', 'Ausrüstungsfunde'),
    potions: (c) => n(c, 'Trank', 'Tränke'),
    breaks: (c) => n(c, 'Pause', 'Pausen'),
    continued: 'Die Abenteuer gingen weiter',
    noSample: 'Keine Abenteuer in der Stichprobe',
    noNew: 'Keine neuen Abenteuer',
  },
  labels: {
    level: 'Stufe', ready: '%name% ist bereit', back_soon: 'Bald zurück', finish_setup: 'Einrichtung abschließen', hp: 'LP', done: 'Erledigt', gold: 'Gold', potion: 'Trank', potions: 'Tränke', weapon: 'Waffe', armor: 'Rüstung', none: 'Keine', no_weapon: 'Keine Waffe', no_armor: 'Keine Rüstung',
    this_week: 'Diese Woche', levels: 'Stufen ', lv: 'St ', not_ranked_paused: 'Kein Rang während der Pause', ranking_soon: 'Rangliste innerhalb der Stunde', your_bag: 'Deine Tasche',
    bag_full: 'Tasche voll', bag_paused: 'Die Abenteuer pausieren, bis du Platz schaffst.', first_soon: 'Das erste Abenteuer beginnt bald.', first_15: 'Das erste Abenteuer startet in 15 Minuten.',
    first_15_short: 'Erstes Abenteuer innerhalb von 15 Minuten', scan_phone: 'Mit dem Handy scannen, um die Begleit-App zu öffnen.', scan_phone_short: 'Mit dem Handy scannen.',
    scan_manage: 'Scannen für die Begleit-App: Ausrüstung verwalten, Stockwerk wählen.', goal: 'Ziel: ', todo_today: 'Heutige Aufgaben', leaves: 'geht um', keepsake: 'Andenken', keepsake_word: '-Code',
  },
}

export const DEVICE_WORDS: Readonly<Record<Locale, DeviceWords>> = { en, fr, de }

/** The article form each language's status lines ask of an area: "the Server Room", "la Salle des serveurs", "im Serverraum". */
const AREA_FORM: Readonly<Record<Locale, Partial<Record<'at' | 'into' | 'object', string>>>> = {
  en: {},
  fr: { at: 'le', into: 'le', object: 'le' },
  de: { at: 'im', into: 'ins', object: 'den' },
}

/**
 * An area name marked bold for the device, with its article outside the marks: `[[Server Room]]` in English (the
 * line supplies "the"), `la [[Salle des serveurs]]`, `im [[Serverraum]]`. `use` picks the case: where the hero is
 * (`at`), where it goes (`into`), or what it explores (`object`).
 */
export function deviceArea(locale: Locale, english: string, use: 'at' | 'into' | 'object' | 'bare'): string {
  if (english === '') return ''
  if (locale === 'en') return `[[${english}]]`
  const t = contentTranslator(locale)
  const name = t.name(english)
  const form = use === 'bare' ? undefined : AREA_FORM[locale][use]
  if (form === undefined) return `[[${name}]]`
  const phrase = t.nameWith(english, form)
  return phrase.endsWith(name) ? `${phrase.slice(0, phrase.length - name.length)}[[${name}]]` : `[[${phrase}]]`
}
