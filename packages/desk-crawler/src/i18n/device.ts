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
  /** D189: an awake hero holding a find on a full bag (v26), a notice rather than an attention line. */
  readonly bagFullKeepGoing: string
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
  /** The template's fixed words, read as `labels.*` (template v58). */
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
    readonly bag_slots: string
    readonly bag_holding: string
    readonly first_soon: string
    readonly first_15: string
    readonly first_15_short: string
    readonly scan_phone: string
    readonly scan_phone_short: string
    readonly scan_manage: string
    readonly goal: string
    readonly goal_claim: string
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
  bagFullFree: 'Bag full. Free a slot and adventures resume.',
  setupNotFinished: 'Setup not finished',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`),
  offTo: (area, time) => (time === null ? `Off to the ${area}.` : `Off to the ${area}, arriving ${time}.`),
  serviceCheck: 'Paused for a service check.',
  delayed: 'Updates are delayed.',
  revives: 'Revives automatically with all XP and gear.',
  makeRoom: 'Make room in your bag in the companion. Adventures resume on their own.',
  maintenance: 'Desk Crawler is down for maintenance.',
  signIn: 'Sign in to the companion, then save this plugin in TRMNL.',
  decisionWaiting: 'A decision is waiting in the companion.',
  merchantVisiting: 'Merchant visiting. Shop in the companion soon.',
  bagFullKeepGoing: 'Bag full. New finds stay behind until you make room.',
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
    bag_full: 'Bag full', bag_paused: 'Clear a slot in your bag to keep adventuring.', bag_slots: 'slots', bag_holding: 'Holding', first_soon: 'The first adventure starts soon.', first_15: 'The first adventure starts within 15 minutes.',
    first_15_short: 'First adventure within 15 minutes', scan_phone: 'Scan with your phone to open the companion.', scan_phone_short: 'Scan with your phone.',
    scan_manage: 'Scan to open your companion: manage gear and pick where to explore.', goal: 'Goal: ', goal_claim: 'Goal reached! Claim your reward in the companion.', todo_today: 'Today\'s to-do', leaves: 'leaves', keepsake: 'Keepsake', keepsake_word: ' code',
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
  bagFullFree: 'Sac plein. Libérez une place et les aventures reprennent.',
  setupNotFinished: 'Installation non terminée',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes}`),
  offTo: (area, time) => (time === null ? `En route pour ${area}.` : `En route pour ${area}, arrivée à ${time}.`),
  serviceCheck: 'En pause pour une vérification technique.',
  delayed: 'Les mises à jour ont du retard.',
  revives: 'Revient tout seul, avec toute son XP et son équipement.',
  makeRoom: 'Faites de la place dans votre sac depuis le compagnon. Les aventures reprennent toutes seules.',
  maintenance: 'Desk Crawler est en maintenance.',
  signIn: 'Connectez-vous au compagnon, puis enregistrez ce plugin dans TRMNL.',
  decisionWaiting: 'Une décision vous attend dans le compagnon.',
  merchantVisiting: 'Un marchand est de passage. Faites vos achats dans le compagnon.',
  bagFullKeepGoing: 'Sac plein. Les nouvelles trouvailles restent sur place jusqu’à ce que vous fassiez de la place.',
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
    bag_full: 'Sac plein', bag_paused: 'Libérez une place dans votre sac pour continuer l’aventure.', bag_slots: 'places', bag_holding: 'Tient', first_soon: 'La première aventure commence bientôt.', first_15: 'La première aventure commence d’ici 15 minutes.',
    first_15_short: 'Première aventure d’ici 15 minutes', scan_phone: 'Scannez avec votre téléphone pour ouvrir le compagnon.', scan_phone_short: 'Scannez avec votre téléphone.',
    scan_manage: 'Scannez pour ouvrir le compagnon : gérez l’équipement et choisissez où explorer.', goal: 'Objectif : ', goal_claim: 'Objectif atteint ! À récupérer dans le compagnon.', todo_today: 'Tâches du jour', leaves: 'part à', keepsake: 'Code', keepsake_word: ' souvenir',
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
  bagFullFree: 'Tasche voll. Mach einen Platz frei, dann gehen die Abenteuer weiter.',
  setupNotFinished: 'Einrichtung nicht abgeschlossen',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} Min.` : minutes === 0 ? `${hours} Std.` : `${hours} Std. ${minutes} Min.`),
  offTo: (area, time) => (time === null ? `Unterwegs ${area}.` : `Unterwegs ${area}, Ankunft um ${time}.`),
  serviceCheck: 'Für eine Wartungsprüfung pausiert.',
  delayed: 'Updates verspäten sich.',
  revives: 'Kommt automatisch zurück, mit allen XP und aller Ausrüstung.',
  makeRoom: 'Schaff in der Begleit-App Platz in deiner Tasche. Die Abenteuer gehen von allein weiter.',
  maintenance: 'Desk Crawler wird gerade gewartet.',
  signIn: 'Melde dich in der Begleit-App an und speichere dann dieses Plugin in TRMNL.',
  decisionWaiting: 'In der Begleit-App wartet eine Entscheidung.',
  merchantVisiting: 'Ein Händler ist da. Kauf bald in der Begleit-App ein.',
  bagFullKeepGoing: 'Tasche voll. Neue Funde bleiben liegen, bis du Platz schaffst.',
  achievement: (title) => `Erfolg: ${title}`,
  levelUp: (level) => `Stufenaufstieg! Jetzt Stufe ${level}`,
  eliteDefeated: 'Elite besiegt!',
  jackpot: 'Jackpot!',
  epicFind: 'Epischer Fund!',
  rareFind: 'Seltener Fund!',
  scanSetup: 'Scannen, um die Einrichtung abzuschließen',
  scanBag: 'Zur Tasche scannen',
  scanCompanion: 'Scannen, um die Begleit-App zu öffnen',
  waitingFirst: 'Warten auf das erste Abenteuer',
  rankingSoon: 'Rangliste innerhalb der Stunde',
  cohort: (key) => `Stufen ${key.replace('-', '–').replace('+', ' und höher')}`,
  nightRecap: 'Die Nacht',
  dayRecap: 'Der Tag',
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
    bag_full: 'Tasche voll', bag_paused: 'Mach einen Platz in deiner Tasche frei, um weiterzuziehen.', bag_slots: 'Plätze', bag_holding: 'Hält', first_soon: 'Das erste Abenteuer beginnt bald.', first_15: 'Das erste Abenteuer startet in 15 Minuten.',
    first_15_short: 'Erstes Abenteuer innerhalb von 15 Minuten', scan_phone: 'Mit dem Handy scannen, um die Begleit-App zu öffnen.', scan_phone_short: 'Mit dem Handy scannen.',
    scan_manage: 'Scannen für die Begleit-App: Ausrüstung verwalten, Stockwerk wählen.', goal: 'Ziel: ', goal_claim: 'Ziel erreicht! Belohnung in der Begleit-App abholen.', todo_today: 'Heutige Aufgaben', leaves: 'geht um', keepsake: 'Andenken', keepsake_word: '-Code',
  },
}

/** Polish counts take three forms: 1, 2–4 (but not 12–14), and the rest. */
const pln = (count: number, one: string, few: string, many: string) => {
  const ten = count % 10
  const hundred = count % 100
  return `${count} ${count === 1 ? one : ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14) ? few : many}`
}

const es: DeviceWords = {
  exploring: (area) => `Explora ${area}`,
  resting: (area) => `Descansa ${area}`,
  arrivalPending: 'Llegada inminente',
  travelling: (area) => `De camino ${area}`,
  // The area comes in its "into" form ("a la [[Sala]]", "al [[Archivo]]"); after "Hacia" it takes the plain article.
  toArriving: (area) => `Hacia ${area.replace(/^al /, 'el ').replace(/^a /, '')}, llegada`,
  revivalPending: 'Vuelta inminente',
  knockedOutBack: (duration) => `K.O. Vuelve en unos ${duration}`,
  knockedOutBackAt: 'K.O., vuelve a las',
  pausedByYou: 'En pausa por ti',
  resumePending: 'Reanudación inminente',
  resumeSoon: 'Las aventuras se reanudan pronto',
  resumeAt: 'Las aventuras se reanudan a las',
  bagFullHolding: 'Bolsa llena, guardando un hallazgo',
  bagFullFree: 'Bolsa llena. Libera un hueco y las aventuras se reanudan.',
  setupNotFinished: 'Configuración sin terminar',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`),
  offTo: (area, time) => (time === null ? `Rumbo ${area}.` : `Rumbo ${area}, llega a las ${time}.`),
  serviceCheck: 'En pausa por una revisión técnica.',
  delayed: 'Las actualizaciones van con retraso.',
  revives: 'Vuelve automáticamente con toda su XP y su equipo.',
  makeRoom: 'Haz sitio en tu bolsa desde la app. Las aventuras se reanudan solas.',
  maintenance: 'Desk Crawler está en mantenimiento.',
  signIn: 'Inicia sesión en la app y guarda este plugin en TRMNL.',
  decisionWaiting: 'Te espera una decisión en la app.',
  merchantVisiting: 'Hay un mercader de paso. Compra pronto en la app.',
  bagFullKeepGoing: 'Bolsa llena. Los nuevos hallazgos se quedan atrás hasta que hagas sitio.',
  achievement: (title) => `Logro: ${title}`,
  levelUp: (level) => `¡Subida de nivel! Ahora nivel ${level}`,
  eliteDefeated: '¡Élite derrotado!',
  jackpot: '¡Premio gordo!',
  epicFind: '¡Hallazgo épico!',
  rareFind: '¡Hallazgo raro!',
  scanSetup: 'Escanea para terminar la configuración',
  scanBag: 'Escanea para abrir tu bolsa',
  scanCompanion: 'Escanea para abrir la app',
  waitingFirst: 'Esperando la primera aventura',
  rankingSoon: 'Clasificación en menos de una hora',
  cohort: (key) => `Niveles ${key.replace('-', '–').replace('+', ' y más')}`,
  nightRecap: 'La noche',
  dayRecap: 'El día',
  partial: 'parcial',
  recap: {
    levels: (c) => `+${n(c, 'nivel', 'niveles')}`,
    reached: (area) => area,
    rareFinds: (c) => n(c, 'hallazgo raro', 'hallazgos raros'),
    elites: (c) => n(c, 'élite', 'élites'),
    jackpots: (c) => n(c, 'premio gordo', 'premios gordos'),
    bagFull: 'Bolsa llena',
    knockouts: (c) => `${c} K.O.`,
    revivals: (c) => n(c, 'vuelta', 'vueltas'),
    raidsWon: (c) => n(c, 'asalto ganado', 'asaltos ganados'),
    raidsLost: (c) => n(c, 'asalto perdido', 'asaltos perdidos'),
    raids: (c, won) => `${n(c, 'asalto', 'asaltos')}, ${won} ${won === 1 ? 'ganado' : 'ganados'}`,
    tasks: (c) => n(c, 'tarea', 'tareas'),
    gold: (c) => `${c} de oro`,
    wins: (c) => n(c, 'victoria', 'victorias'),
    gearFinds: (c) => n(c, 'pieza de equipo', 'piezas de equipo'),
    potions: (c) => n(c, 'poción', 'pociones'),
    breaks: (c) => n(c, 'descanso', 'descansos'),
    continued: 'Las aventuras continuaron',
    noSample: 'No hay aventuras en la muestra',
    noNew: 'No hay aventuras nuevas',
  },
  labels: {
    level: 'nivel', ready: '%name% está listo', back_soon: 'Vuelve pronto', finish_setup: 'Termina la configuración', hp: 'PV', done: 'Hecho', gold: 'oro', potion: 'poción', potions: 'pociones', weapon: 'Arma', armor: 'Armadura', none: 'Nada', no_weapon: 'Sin arma', no_armor: 'Sin armadura',
    this_week: 'Esta semana', levels: 'Niveles ', lv: 'Nv ', not_ranked_paused: 'Sin clasificar en pausa', ranking_soon: 'Clasificación en menos de una hora', your_bag: 'Tu bolsa',
    bag_full: 'Bolsa llena', bag_paused: 'Libera un hueco en tu bolsa para seguir con la aventura.', bag_slots: 'huecos', bag_holding: 'Guardando', first_soon: 'La primera aventura empieza pronto.', first_15: 'La primera aventura empieza en menos de 15 minutos.',
    first_15_short: 'Primera aventura en menos de 15 minutos', scan_phone: 'Escanea con el móvil para abrir la app.', scan_phone_short: 'Escanea con el móvil.',
    scan_manage: 'Escanea para abrir la app: gestiona el equipo y elige dónde explorar.', goal: 'Objetivo: ', goal_claim: '¡Objetivo cumplido! Cobra la recompensa en la app.', todo_today: 'Tareas de hoy', leaves: 'se va a las', keepsake: 'Recuerdo', keepsake_word: ':',
  },
}

const it: DeviceWords = {
  exploring: (area) => `Esplora ${area}`,
  resting: (area) => `Si riposa ${area}`,
  arrivalPending: 'Arrivo imminente',
  travelling: (area) => `In viaggio verso ${area}`,
  toArriving: (area) => `Verso ${area}, arrivo alle`,
  revivalPending: 'Ritorno imminente',
  knockedOutBack: (duration) => `KO. Torna tra circa ${duration}`,
  knockedOutBackAt: 'KO, torna alle',
  pausedByYou: 'In pausa da te',
  resumePending: 'Ripresa imminente',
  resumeSoon: 'Le avventure riprendono presto',
  resumeAt: 'Le avventure riprendono alle',
  bagFullHolding: 'Borsa piena, un ritrovamento in attesa',
  bagFullFree: 'Borsa piena. Libera un posto e le avventure riprendono.',
  setupNotFinished: 'Configurazione non completata',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`),
  offTo: (area, time) => (time === null ? `In viaggio verso ${area}.` : `In viaggio verso ${area}, arrivo alle ${time}.`),
  serviceCheck: 'In pausa per un controllo tecnico.',
  delayed: 'Gli aggiornamenti sono in ritardo.',
  revives: 'Torna automaticamente con tutti gli XP e l’equipaggiamento.',
  makeRoom: 'Fai spazio nella borsa dall’app. Le avventure riprendono da sole.',
  maintenance: 'Desk Crawler è in manutenzione.',
  signIn: 'Accedi all’app, poi salva questo plugin in TRMNL.',
  decisionWaiting: 'Una decisione ti aspetta nell’app.',
  merchantVisiting: 'C’è un mercante di passaggio. Fai acquisti nell’app.',
  bagFullKeepGoing: 'Borsa piena. I nuovi ritrovamenti restano lì finché non fai spazio.',
  achievement: (title) => `Traguardo: ${title}`,
  levelUp: (level) => `Livello su! Ora livello ${level}`,
  eliteDefeated: 'Élite sconfitta!',
  jackpot: 'Jackpot!',
  epicFind: 'Ritrovamento epico!',
  rareFind: 'Ritrovamento raro!',
  scanSetup: 'Scansiona per completare la configurazione',
  scanBag: 'Scansiona per aprire la borsa',
  scanCompanion: 'Scansiona per aprire l’app',
  waitingFirst: 'In attesa della prima avventura',
  rankingSoon: 'Classifica entro un’ora',
  cohort: (key) => `Livelli ${key.replace('-', '–').replace('+', ' e oltre')}`,
  nightRecap: 'La notte',
  dayRecap: 'Il giorno',
  partial: 'parziale',
  recap: {
    levels: (c) => `+${n(c, 'livello', 'livelli')}`,
    reached: (area) => area,
    rareFinds: (c) => n(c, 'ritrovamento raro', 'ritrovamenti rari'),
    elites: (c) => n(c, 'élite', 'élite'),
    jackpots: (c) => n(c, 'jackpot', 'jackpot'),
    bagFull: 'Borsa piena',
    knockouts: (c) => `${c} KO`,
    revivals: (c) => n(c, 'ritorno', 'ritorni'),
    raidsWon: (c) => n(c, 'incursione vinta', 'incursioni vinte'),
    raidsLost: (c) => n(c, 'incursione persa', 'incursioni perse'),
    raids: (c, won) => `${n(c, 'incursione', 'incursioni')}, ${won} ${won === 1 ? 'vinta' : 'vinte'}`,
    tasks: (c) => n(c, 'cosa fatta', 'cose fatte'),
    gold: (c) => `${c} d’oro`,
    wins: (c) => n(c, 'vittoria', 'vittorie'),
    gearFinds: (c) => n(c, 'pezzo trovato', 'pezzi trovati'),
    potions: (c) => n(c, 'pozione', 'pozioni'),
    breaks: (c) => n(c, 'pausa', 'pause'),
    continued: 'Le avventure sono proseguite',
    noSample: 'Nessuna avventura nel campione',
    noNew: 'Nessuna nuova avventura',
  },
  labels: {
    level: 'livello', ready: '%name% è pronto', back_soon: 'Torna presto', finish_setup: 'Completa la configurazione', hp: 'PS', done: 'Fatto', gold: 'oro', potion: 'pozione', potions: 'pozioni', weapon: 'Arma', armor: 'Armatura', none: 'Nessuna', no_weapon: 'Nessuna arma', no_armor: 'Nessuna armatura',
    this_week: 'Questa settimana', levels: 'Livelli ', lv: 'Liv ', not_ranked_paused: 'Non in classifica durante la pausa', ranking_soon: 'Classifica entro un’ora', your_bag: 'La tua borsa',
    bag_full: 'Borsa piena', bag_paused: 'Libera un posto nella borsa per continuare l’avventura.', bag_slots: 'posti', bag_holding: 'In attesa', first_soon: 'La prima avventura inizia presto.', first_15: 'La prima avventura inizia entro 15 minuti.',
    first_15_short: 'Prima avventura entro 15 minuti', scan_phone: 'Scansiona con il telefono per aprire l’app.', scan_phone_short: 'Scansiona con il telefono.',
    scan_manage: 'Scansiona per aprire l’app: gestisci l’equipaggiamento e scegli dove esplorare.', goal: 'Obiettivo: ', goal_claim: 'Obiettivo raggiunto! Ritira il premio nell’app.', todo_today: 'Da fare oggi', leaves: 'se ne va alle', keepsake: 'Ricordino', keepsake_word: ':',
  },
}

const pt: DeviceWords = {
  exploring: (area) => `Explorando ${area}`,
  resting: (area) => `Descansando ${area}`,
  arrivalPending: 'Chegada iminente',
  travelling: (area) => `A caminho ${area}`,
  toArriving: (area) => `Rumo ${area}, chega às`,
  revivalPending: 'Volta iminente',
  knockedOutBack: (duration) => `Nocaute. Volta em cerca de ${duration}`,
  knockedOutBackAt: 'Nocaute, volta às',
  pausedByYou: 'Pausado por você',
  resumePending: 'Retomada iminente',
  resumeSoon: 'As aventuras voltam em breve',
  resumeAt: 'As aventuras voltam às',
  bagFullHolding: 'Bolsa cheia, guardando um achado',
  bagFullFree: 'Bolsa cheia. Libere um espaço e as aventuras voltam.',
  setupNotFinished: 'Configuração não concluída',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`),
  offTo: (area, time) => (time === null ? `Rumo ${area}.` : `Rumo ${area}, chega às ${time}.`),
  serviceCheck: 'Pausado para uma verificação técnica.',
  delayed: 'As atualizações estão atrasadas.',
  revives: 'Volta sozinho, com todo o XP e o equipamento.',
  makeRoom: 'Abra espaço na sua bolsa pelo app. As aventuras voltam sozinhas.',
  maintenance: 'Desk Crawler está em manutenção.',
  signIn: 'Entre no app e depois salve este plugin no TRMNL.',
  decisionWaiting: 'Uma decisão espera por você no app.',
  merchantVisiting: 'Mercador de passagem. Compre logo no app.',
  bagFullKeepGoing: 'Bolsa cheia. Os novos achados ficam para trás até você abrir espaço.',
  achievement: (title) => `Conquista: ${title}`,
  levelUp: (level) => `Subiu de nível! Agora nível ${level}`,
  eliteDefeated: 'Elite derrotado!',
  jackpot: 'Bolada!',
  epicFind: 'Achado épico!',
  rareFind: 'Achado raro!',
  scanSetup: 'Escaneie para concluir a configuração',
  scanBag: 'Escaneie para abrir sua bolsa',
  scanCompanion: 'Escaneie para abrir o app',
  waitingFirst: 'Esperando a primeira aventura',
  rankingSoon: 'Ranking em até uma hora',
  cohort: (key) => `Níveis ${key.replace('-', '–').replace('+', ' ou mais')}`,
  nightRecap: 'A noite',
  dayRecap: 'O dia',
  partial: 'parcial',
  recap: {
    levels: (c) => `+${n(c, 'nível', 'níveis')}`,
    reached: (area) => area,
    rareFinds: (c) => n(c, 'achado raro', 'achados raros'),
    elites: (c) => n(c, 'elite', 'elites'),
    jackpots: (c) => n(c, 'bolada', 'boladas'),
    bagFull: 'Bolsa cheia',
    knockouts: (c) => n(c, 'nocaute', 'nocautes'),
    revivals: (c) => n(c, 'volta', 'voltas'),
    raidsWon: (c) => n(c, 'assalto vencido', 'assaltos vencidos'),
    raidsLost: (c) => n(c, 'assalto perdido', 'assaltos perdidos'),
    raids: (c, won) => `${n(c, 'assalto', 'assaltos')}, ${won} ${won === 1 ? 'vencido' : 'vencidos'}`,
    tasks: (c) => n(c, 'tarefa', 'tarefas'),
    gold: (c) => `${c} de ouro`,
    wins: (c) => n(c, 'vitória', 'vitórias'),
    gearFinds: (c) => n(c, 'peça achada', 'peças achadas'),
    potions: (c) => n(c, 'poção', 'poções'),
    breaks: (c) => n(c, 'pausa', 'pausas'),
    continued: 'As aventuras continuaram',
    noSample: 'Nenhuma aventura na amostra',
    noNew: 'Nenhuma aventura nova',
  },
  labels: {
    level: 'nível', ready: '%name% está pronto', back_soon: 'Volta logo', finish_setup: 'Conclua a configuração', hp: 'PV', done: 'Feito', gold: 'ouro', potion: 'poção', potions: 'poções', weapon: 'Arma', armor: 'Armadura', none: 'Nenhuma', no_weapon: 'Sem arma', no_armor: 'Sem armadura',
    this_week: 'Esta semana', levels: 'Níveis ', lv: 'Nv ', not_ranked_paused: 'Fora do ranking na pausa', ranking_soon: 'Ranking em até uma hora', your_bag: 'Sua bolsa',
    bag_full: 'Bolsa cheia', bag_paused: 'Libere um espaço na bolsa para continuar a aventura.', bag_slots: 'espaços', bag_holding: 'Guardando', first_soon: 'A primeira aventura começa em breve.', first_15: 'A primeira aventura começa em até 15 minutos.',
    first_15_short: 'Primeira aventura em até 15 minutos', scan_phone: 'Escaneie com o celular para abrir o app.', scan_phone_short: 'Escaneie com o celular.',
    scan_manage: 'Escaneie para abrir o app: cuide do equipamento e escolha onde explorar.', goal: 'Objetivo: ', goal_claim: 'Objetivo alcançado! Resgate a recompensa no app.', todo_today: 'Tarefas de hoje', leaves: 'vai embora às', keepsake: 'Lembrança', keepsake_word: ':',
  },
}

const pl: DeviceWords = {
  exploring: (area) => `Eksploruje: ${area}`,
  resting: (area) => `Odpoczywa: ${area}`,
  arrivalPending: 'Zaraz na miejscu',
  travelling: (area) => `W drodze: ${area}`,
  toArriving: (area) => `Cel: ${area}, przybycie o`,
  revivalPending: 'Zaraz wraca',
  knockedOutBack: (duration) => `Nokaut. Powrót za około ${duration}`,
  knockedOutBackAt: 'Nokaut, powrót o',
  pausedByYou: 'Wstrzymane przez ciebie',
  resumePending: 'Zaraz wznowienie',
  resumeSoon: 'Przygody wkrótce się wznowią',
  resumeAt: 'Przygody wznowią się o',
  bagFullHolding: 'Torba pełna, znalezisko czeka',
  bagFullFree: 'Torba pełna. Zwolnij miejsce, a przygody się wznowią.',
  setupNotFinished: 'Konfiguracja niedokończona',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} godz.` : `${hours} godz. ${minutes} min`),
  offTo: (area, time) => (time === null ? `W drodze: ${area}.` : `W drodze: ${area}, przybycie o ${time}.`),
  serviceCheck: 'Wstrzymane na kontrolę techniczną.',
  delayed: 'Aktualizacje się opóźniają.',
  revives: 'Wraca automatycznie, z całym XP i sprzętem.',
  makeRoom: 'Zrób miejsce w torbie w aplikacji. Przygody wznowią się same.',
  maintenance: 'Desk Crawler przechodzi konserwację.',
  signIn: 'Zaloguj się w aplikacji, a potem zapisz ten plugin w TRMNL.',
  decisionWaiting: 'W aplikacji czeka decyzja.',
  merchantVisiting: 'Kupiec przejazdem. Zrób zakupy w aplikacji.',
  bagFullKeepGoing: 'Torba pełna. Nowe znaleziska zostają, aż zrobisz miejsce.',
  achievement: (title) => `Osiągnięcie: ${title}`,
  levelUp: (level) => `Awans! Teraz poziom ${level}`,
  eliteDefeated: 'Elita pokonana!',
  jackpot: 'Jackpot!',
  epicFind: 'Epickie znalezisko!',
  rareFind: 'Rzadkie znalezisko!',
  scanSetup: 'Zeskanuj, by dokończyć konfigurację',
  scanBag: 'Skan otwiera torbę',
  scanCompanion: 'Zeskanuj, by otworzyć aplikację',
  waitingFirst: 'Czekanie na pierwszą przygodę',
  rankingSoon: 'Ranking w ciągu godziny',
  cohort: (key) => `Poziomy ${key.replace('-', '–').replace('+', ' i wyżej')}`,
  nightRecap: 'Noc',
  dayRecap: 'Dzień',
  partial: 'częściowe',
  recap: {
    levels: (c) => `+${pln(c, 'poziom', 'poziomy', 'poziomów')}`,
    reached: (area) => area,
    rareFinds: (c) => pln(c, 'rzadkie znalezisko', 'rzadkie znaleziska', 'rzadkich znalezisk'),
    elites: (c) => pln(c, 'elita', 'elity', 'elit'),
    jackpots: (c) => pln(c, 'jackpot', 'jackpoty', 'jackpotów'),
    bagFull: 'Torba pełna',
    knockouts: (c) => pln(c, 'nokaut', 'nokauty', 'nokautów'),
    revivals: (c) => pln(c, 'powrót', 'powroty', 'powrotów'),
    raidsWon: (c) => pln(c, 'wygrany napad', 'wygrane napady', 'wygranych napadów'),
    raidsLost: (c) => pln(c, 'przegrany napad', 'przegrane napady', 'przegranych napadów'),
    raids: (c, won) => `${pln(c, 'napad', 'napady', 'napadów')}, wygrane: ${won}`,
    tasks: (c) => pln(c, 'zadanie', 'zadania', 'zadań'),
    gold: (c) => `${c} złota`,
    wins: (c) => pln(c, 'wygrana', 'wygrane', 'wygranych'),
    gearFinds: (c) => pln(c, 'element sprzętu', 'elementy sprzętu', 'elementów sprzętu'),
    potions: (c) => pln(c, 'mikstura', 'mikstury', 'mikstur'),
    breaks: (c) => pln(c, 'przerwa', 'przerwy', 'przerw'),
    continued: 'Przygody trwały dalej',
    noSample: 'Brak przygód w próbce',
    noNew: 'Brak nowych przygód',
  },
  labels: {
    level: 'poziom', ready: '%name% jest gotowy', back_soon: 'Zaraz wraca', finish_setup: 'Dokończ konfigurację', hp: 'PŻ', done: 'Zrobione', gold: 'złota', potion: 'mikstura', potions: 'mikstur', weapon: 'Broń', armor: 'Zbroja', none: 'Brak', no_weapon: 'Bez broni', no_armor: 'Bez zbroi',
    this_week: 'Ten tydzień', levels: 'Poziomy ', lv: 'Poz. ', not_ranked_paused: 'Bez rankingu podczas pauzy', ranking_soon: 'Ranking w ciągu godziny', your_bag: 'Twoja torba',
    bag_full: 'Torba pełna', bag_paused: 'Zwolnij miejsce w torbie, by przygoda trwała dalej.', bag_slots: 'miejsc', bag_holding: 'Czeka', first_soon: 'Pierwsza przygoda zaczyna się wkrótce.', first_15: 'Pierwsza przygoda zacznie się w ciągu 15 minut.',
    first_15_short: 'Pierwsza przygoda w ciągu 15 minut', scan_phone: 'Zeskanuj telefonem, by otworzyć aplikację.', scan_phone_short: 'Zeskanuj telefonem.',
    scan_manage: 'Zeskanuj, by otworzyć aplikację: zarządzaj sprzętem i wybierz, gdzie eksplorować.', goal: 'Cel: ', goal_claim: 'Cel osiągnięty! Odbierz nagrodę w aplikacji.', todo_today: 'Dzisiejsze zadania', leaves: 'odchodzi o', keepsake: 'Kod', keepsake_word: ' pamiątki',
  },
}

const nl: DeviceWords = {
  exploring: (area) => `Verkent ${area}`,
  resting: (area) => `Rust uit in ${area}`,
  arrivalPending: 'Komt zo aan',
  travelling: (area) => `Op weg naar ${area}`,
  toArriving: (area) => `Naar ${area}, aankomst om`,
  revivalPending: 'Komt zo terug',
  knockedOutBack: (duration) => `Knock-out. Terug over ongeveer ${duration}`,
  knockedOutBackAt: 'Knock-out, terug om',
  pausedByYou: 'Door jou gepauzeerd',
  resumePending: 'Gaat zo verder',
  resumeSoon: 'De avonturen gaan zo verder',
  resumeAt: 'Avonturen gaan verder om',
  bagFullHolding: 'Tas vol, een nieuwe vondst wacht',
  bagFullFree: 'Tas vol. Maak een plek vrij en de avonturen gaan verder.',
  setupNotFinished: 'Installatie niet afgerond',
  duration: (hours, minutes) => (hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} uur` : `${hours} uur ${minutes} min`),
  offTo: (area, time) => (time === null ? `Op weg naar ${area}.` : `Op weg naar ${area}, aankomst om ${time}.`),
  serviceCheck: 'Gepauzeerd voor een technische controle.',
  delayed: 'Updates lopen vertraging op.',
  revives: 'Komt vanzelf terug, met alle XP en uitrusting.',
  makeRoom: 'Maak ruimte in je tas in de app. De avonturen gaan vanzelf verder.',
  maintenance: 'Desk Crawler is in onderhoud.',
  signIn: 'Log in bij de app en sla deze plugin daarna op in TRMNL.',
  decisionWaiting: 'Er wacht een beslissing in de app.',
  merchantVisiting: 'Er is een koopman op bezoek. Winkel snel in de app.',
  bagFullKeepGoing: 'Tas vol. Nieuwe vondsten blijven liggen tot je ruimte maakt.',
  achievement: (title) => `Prestatie: ${title}`,
  levelUp: (level) => `Niveau omhoog! Nu niveau ${level}`,
  eliteDefeated: 'Elite verslagen!',
  jackpot: 'Jackpot!',
  epicFind: 'Epische vondst!',
  rareFind: 'Zeldzame vondst!',
  scanSetup: 'Scan om de installatie af te ronden',
  scanBag: 'Scan om je tas te openen',
  scanCompanion: 'Scan om de app te openen',
  waitingFirst: 'Wachten op het eerste avontuur',
  rankingSoon: 'Ranglijst binnen het uur',
  cohort: (key) => `Niveaus ${key.replace('-', '–').replace('+', ' en hoger')}`,
  nightRecap: 'De nacht',
  dayRecap: 'De dag',
  partial: 'gedeeltelijk',
  recap: {
    levels: (c) => `+${n(c, 'niveau', 'niveaus')}`,
    reached: (area) => area,
    rareFinds: (c) => n(c, 'zeldzame vondst', 'zeldzame vondsten'),
    elites: (c) => n(c, 'elite', 'elites'),
    jackpots: (c) => n(c, 'jackpot', 'jackpots'),
    bagFull: 'Tas vol',
    knockouts: (c) => n(c, 'knock-out', 'knock-outs'),
    revivals: (c) => n(c, 'terugkeer', 'terugkeren'),
    raidsWon: (c) => n(c, 'overval gewonnen', 'overvallen gewonnen'),
    raidsLost: (c) => n(c, 'overval verloren', 'overvallen verloren'),
    raids: (c, won) => `${n(c, 'overval', 'overvallen')}, ${won} gewonnen`,
    tasks: (c) => n(c, 'taak', 'taken'),
    gold: (c) => `${c} goud`,
    wins: (c) => n(c, 'overwinning', 'overwinningen'),
    gearFinds: (c) => n(c, 'uitrustingsvondst', 'uitrustingsvondsten'),
    potions: (c) => n(c, 'drankje', 'drankjes'),
    breaks: (c) => n(c, 'pauze', 'pauzes'),
    continued: 'De avonturen gingen door',
    noSample: 'Geen avonturen in de steekproef',
    noNew: 'Geen nieuwe avonturen',
  },
  labels: {
    level: 'niveau', ready: '%name% is klaar', back_soon: 'Zo terug', finish_setup: 'Rond de installatie af', hp: 'HP', done: 'Klaar', gold: 'goud', potion: 'drankje', potions: 'drankjes', weapon: 'Wapen', armor: 'Pantser', none: 'Geen', no_weapon: 'Geen wapen', no_armor: 'Geen pantser',
    this_week: 'Deze week', levels: 'Niveaus ', lv: 'Nv ', not_ranked_paused: 'Niet gerangschikt tijdens pauze', ranking_soon: 'Ranglijst binnen het uur', your_bag: 'Je tas',
    bag_full: 'Tas vol', bag_paused: 'Maak een plek vrij in je tas om verder op avontuur te gaan.', bag_slots: 'plekken', bag_holding: 'Bewaard', first_soon: 'Het eerste avontuur begint zo.', first_15: 'Het eerste avontuur begint binnen 15 minuten.',
    first_15_short: 'Eerste avontuur binnen 15 minuten', scan_phone: 'Scan met je telefoon om de app te openen.', scan_phone_short: 'Scan met je telefoon.',
    scan_manage: 'Scan om de app te openen: beheer je uitrusting en kies waar je gaat verkennen.', goal: 'Doel: ', goal_claim: 'Doel bereikt! Haal je beloning op in de app.', todo_today: 'Taken van vandaag', leaves: 'vertrekt om', keepsake: 'Aandenken', keepsake_word: '-code',
  },
}

export const DEVICE_WORDS: Readonly<Record<Locale, DeviceWords>> = { en, fr, de, es, it, pt, pl, nl }

/** The article form each language's status lines ask of an area: "the Server Room", "la Salle des serveurs", "im Serverraum". */
const AREA_FORM: Readonly<Record<Locale, Partial<Record<'at' | 'into' | 'object', string>>>> = {
  en: {},
  fr: { at: 'le', into: 'le', object: 'le' },
  de: { at: 'im', into: 'ins', object: 'den' },
  es: { at: 'en', into: 'al', object: 'el' },
  it: { at: 'nel', into: 'il', object: 'il' },
  pt: { at: 'no', into: 'do', object: 'o' },
  // Polish keeps names in the nominative after a colon, so an area takes no form.
  pl: {},
  nl: { at: 'de', into: 'de', object: 'de' },
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
