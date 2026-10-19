import { INTL_TAG, type Locale } from '@trmnl-games/platform'

/**
 * D198: the one reminder a player gets when their hero has run for two days and they have never opened the companion.
 * Plain text in the owner's language, built only from that hero's own facts; a line with nothing to say is left out.
 */
export interface ReminderFacts {
  readonly name: string
  readonly level: number
  /** When the hero started, and the owner's time zone for the date. */
  readonly since: number
  readonly timezone: string
  /** Career rewards waiting for the Claim button: their gold together and how many. */
  readonly gold: number
  readonly goals: number
  /** Gear in the bag, its capacity and the best piece's name in the owner's language (null for an empty bag). */
  readonly finds: number
  readonly capacity: number
  readonly best: string | null
  /** The next career goal in the owner's language; null past the end of the ladder. */
  readonly nextGoal: string | null
}

export interface ReminderLinks {
  readonly app: string
  readonly stop: string
}

interface Words {
  subjectGold: (name: string, gold: number) => string
  subjectFinds: (name: string, finds: number) => string
  subjectLevel: (name: string, level: number) => string
  hi: string
  intro: (name: string, date: string, level: number) => string
  waiting: string
  upNext: string
  gold: (gold: number, goals: number) => string
  finds: (finds: number, capacity: number) => string
  best: (name: string) => string
  next: (goal: string) => string
  why: string
  open: (link: string) => string
  signIn: string
  sign: string
  footer: (link: string) => string
}

const WORDS: Readonly<Record<Locale, Words>> = {
  en: {
    subjectGold: (n, g) => `Desk Crawler for TRMNL: ${n} has ${g} gold waiting`,
    subjectFinds: (n, f) => `Desk Crawler for TRMNL: ${n} has ${f === 1 ? 'a find' : `${f} finds`} in the bag`,
    subjectLevel: (n, l) => `Desk Crawler for TRMNL: ${n} is level ${l}`,
    hi: 'Hi,',
    intro: (n, d, l) => `${n} has been adventuring on your TRMNL since you installed Desk Crawler on ${d}, and is now level ${l}.`,
    waiting: 'A few things are waiting for you in the Desk Crawler app:',
    upNext: 'Here’s what’s next in the Desk Crawler app:',
    gold: (g, c) => `${g} gold from ${c === 1 ? 'a goal' : `${c} goals`} reached, ready to claim`,
    finds: (f, cap) => `${f === 1 ? '1 find' : `${f} finds`} in the bag (${f} of ${cap} slots)`,
    best: (b) => `Best find: ${b}`,
    next: (g) => `Next goal: ${g}`,
    why: 'Your TRMNL shows the adventure as it happens. Claiming gold, equipping gear and selling finds happen in the app.',
    open: (l) => `Open Desk Crawler: ${l}`,
    signIn: 'Sign in with the same account you used to install it.',
    sign: 'Barry, maker of Desk Crawler',
    footer: (l) => `You’re getting this because you installed Desk Crawler on your TRMNL. It’s the only reminder we’ll send. To stop emails about your hero: ${l}`,
  },
  fr: {
    subjectGold: (n, g) => `Desk Crawler pour TRMNL : ${n} vous garde ${g} or`,
    subjectFinds: (n, f) => `Desk Crawler pour TRMNL : ${f === 1 ? 'une trouvaille attend' : `${f} trouvailles attendent`} dans le sac de ${n}`,
    subjectLevel: (n, l) => `Desk Crawler pour TRMNL : ${n} est au niveau ${l}`,
    hi: 'Bonjour,',
    intro: (n, d, l) => `${n} est en aventure sur votre TRMNL depuis que vous avez installé Desk Crawler le ${d}, et en est maintenant au niveau ${l}.`,
    waiting: 'Plusieurs choses vous attendent dans l’application Desk Crawler :',
    upNext: 'Voici la suite dans l’application Desk Crawler :',
    gold: (g, c) => `${g} or pour ${c === 1 ? 'un objectif atteint' : `${c} objectifs atteints`}, à récupérer`,
    finds: (f, cap) => `${f === 1 ? '1 trouvaille' : `${f} trouvailles`} dans le sac (${f} places sur ${cap})`,
    best: (b) => `Meilleure trouvaille : ${b}`,
    next: (g) => `Prochain objectif : ${g}`,
    why: 'Votre TRMNL montre l’aventure en direct. Récupérer l’or, s’équiper et vendre ses trouvailles, cela se fait dans l’application.',
    open: (l) => `Ouvrir Desk Crawler : ${l}`,
    signIn: 'Connectez-vous avec le compte utilisé pour l’installer.',
    sign: 'Barry, créateur de Desk Crawler',
    footer: (l) => `Vous recevez ce message parce que vous avez installé Desk Crawler sur votre TRMNL. C’est le seul rappel que nous enverrons. Pour ne plus recevoir d’e-mails sur votre héros : ${l}`,
  },
  de: {
    subjectGold: (n, g) => `Desk Crawler für TRMNL: ${n} hat ${g} Gold für dich`,
    subjectFinds: (n, f) => `Desk Crawler für TRMNL: ${f === 1 ? 'Ein Fund liegt' : `${f} Funde liegen`} in der Tasche von ${n}`,
    subjectLevel: (n, l) => `Desk Crawler für TRMNL: ${n} ist auf Stufe ${l}`,
    hi: 'Hallo,',
    intro: (n, d, l) => `${n} ist auf deinem TRMNL unterwegs, seit du Desk Crawler am ${d} installiert hast, und ist jetzt auf Stufe ${l}.`,
    waiting: 'In der Desk-Crawler-App wartet einiges auf dich:',
    upNext: 'So geht es in der Desk-Crawler-App weiter:',
    gold: (g, c) => `${g} Gold für ${c === 1 ? 'ein erreichtes Ziel' : `${c} erreichte Ziele`}, bereit zum Abholen`,
    finds: (f, cap) => `${f === 1 ? '1 Fund' : `${f} Funde`} in der Tasche (${f} von ${cap} Plätzen)`,
    best: (b) => `Bester Fund: ${b}`,
    next: (g) => `Nächstes Ziel: ${g}`,
    why: 'Dein TRMNL zeigt das Abenteuer, während es passiert. Gold abholen, Ausrüstung anlegen und Funde verkaufen geht in der App.',
    open: (l) => `Desk Crawler öffnen: ${l}`,
    signIn: 'Melde dich mit demselben Konto an, mit dem du es installiert hast.',
    sign: 'Barry, der Macher von Desk Crawler',
    footer: (l) => `Du bekommst diese Mail, weil du Desk Crawler auf deinem TRMNL installiert hast. Es ist die einzige Erinnerung, die wir schicken. Keine Mails mehr über deinen Helden: ${l}`,
  },
  es: {
    subjectGold: (n, g) => `Desk Crawler para TRMNL: ${n} tiene ${g} de oro esperándote`,
    subjectFinds: (n, f) => `Desk Crawler para TRMNL: ${n} tiene ${f === 1 ? 'un hallazgo' : `${f} hallazgos`} en la bolsa`,
    subjectLevel: (n, l) => `Desk Crawler para TRMNL: ${n} está en el nivel ${l}`,
    hi: 'Hola:',
    intro: (n, d, l) => `${n} está de aventura en tu TRMNL desde que instalaste Desk Crawler el ${d}, y ya va por el nivel ${l}.`,
    waiting: 'Hay unas cuantas cosas esperándote en la app de Desk Crawler:',
    upNext: 'Esto es lo siguiente en la app de Desk Crawler:',
    gold: (g, c) => `${g} de oro por ${c === 1 ? 'un objetivo cumplido' : `${c} objetivos cumplidos`}, listo para cobrar`,
    finds: (f, cap) => `${f === 1 ? '1 hallazgo' : `${f} hallazgos`} en la bolsa (${f} de ${cap} huecos)`,
    best: (b) => `Mejor hallazgo: ${b}`,
    next: (g) => `Siguiente objetivo: ${g}`,
    why: 'Tu TRMNL muestra la aventura mientras ocurre. Cobrar el oro, equiparte y vender lo que encuentras se hace en la app.',
    open: (l) => `Abrir Desk Crawler: ${l}`,
    signIn: 'Inicia sesión con la misma cuenta que usaste para instalarlo.',
    sign: 'Barry, creador de Desk Crawler',
    footer: (l) => `Recibes este correo porque instalaste Desk Crawler en tu TRMNL. Es el único recordatorio que enviaremos. Para no recibir más correos sobre tu héroe: ${l}`,
  },
  it: {
    subjectGold: (n, g) => `Desk Crawler per TRMNL: ${n} ha ${g} d’oro che ti aspettano`,
    subjectFinds: (n, f) => `Desk Crawler per TRMNL: ${n} ha ${f === 1 ? 'un ritrovamento' : `${f} ritrovamenti`} nella borsa`,
    subjectLevel: (n, l) => `Desk Crawler per TRMNL: ${n} è al livello ${l}`,
    hi: 'Ciao,',
    intro: (n, d, l) => `${n} è in avventura sul tuo TRMNL da quando hai installato Desk Crawler il ${d}, e ora è al livello ${l}.`,
    waiting: 'Nell’app di Desk Crawler ti aspetta qualcosa:',
    upNext: 'Ecco cosa viene dopo nell’app di Desk Crawler:',
    gold: (g, c) => `${g} d’oro per ${c === 1 ? 'un obiettivo raggiunto' : `${c} obiettivi raggiunti`}, da riscuotere`,
    finds: (f, cap) => `${f === 1 ? '1 ritrovamento' : `${f} ritrovamenti`} nella borsa (${f} posti su ${cap})`,
    best: (b) => `Il ritrovamento migliore: ${b}`,
    next: (g) => `Prossimo obiettivo: ${g}`,
    why: 'Il tuo TRMNL mostra l’avventura mentre accade. Riscuotere l’oro, equipaggiarsi e vendere i ritrovamenti si fa nell’app.',
    open: (l) => `Apri Desk Crawler: ${l}`,
    signIn: 'Accedi con lo stesso account che hai usato per installarlo.',
    sign: 'Barry, creatore di Desk Crawler',
    footer: (l) => `Ricevi questa email perché hai installato Desk Crawler sul tuo TRMNL. È l’unico promemoria che invieremo. Per non ricevere più email sul tuo eroe: ${l}`,
  },
  pt: {
    subjectGold: (n, g) => `Desk Crawler para TRMNL: ${n} tem ${g} de ouro esperando por você`,
    subjectFinds: (n, f) => `Desk Crawler para TRMNL: ${n} tem ${f === 1 ? 'um achado' : `${f} achados`} na bolsa`,
    subjectLevel: (n, l) => `Desk Crawler para TRMNL: ${n} está no nível ${l}`,
    hi: 'Oi,',
    intro: (n, d, l) => `${n} está em aventura no seu TRMNL desde que você instalou o Desk Crawler em ${d}, e agora está no nível ${l}.`,
    waiting: 'Algumas coisas estão esperando por você no app do Desk Crawler:',
    upNext: 'Veja o que vem a seguir no app do Desk Crawler:',
    gold: (g, c) => `${g} de ouro por ${c === 1 ? 'um objetivo cumprido' : `${c} objetivos cumpridos`}, prontos para resgatar`,
    finds: (f, cap) => `${f === 1 ? '1 achado' : `${f} achados`} na bolsa (${f} de ${cap} espaços)`,
    best: (b) => `Melhor achado: ${b}`,
    next: (g) => `Próximo objetivo: ${g}`,
    why: 'O seu TRMNL mostra a aventura enquanto ela acontece. Resgatar ouro, equipar itens e vender achados é no app.',
    open: (l) => `Abrir o Desk Crawler: ${l}`,
    signIn: 'Entre com a mesma conta que você usou para instalar.',
    sign: 'Barry, criador do Desk Crawler',
    footer: (l) => `Você está recebendo isto porque instalou o Desk Crawler no seu TRMNL. É o único lembrete que vamos enviar. Para não receber mais e-mails sobre o seu herói: ${l}`,
  },
  pl: {
    subjectGold: (n, g) => `Desk Crawler na TRMNL: ${n} ma dla ciebie ${g} złota`,
    subjectFinds: (n, f) => `Desk Crawler na TRMNL: ${n} ma w torbie znaleziska (${f})`,
    subjectLevel: (n, l) => `Desk Crawler na TRMNL: ${n} ma poziom ${l}`,
    hi: 'Cześć,',
    intro: (n, d, l) => `${n} przeżywa przygody na twoim TRMNL od instalacji Desk Crawlera ${d} i ma teraz poziom ${l}.`,
    waiting: 'W aplikacji Desk Crawler czeka na ciebie kilka rzeczy:',
    upNext: 'Oto co dalej w aplikacji Desk Crawler:',
    gold: (g, c) => `${g} złota za ${c === 1 ? 'osiągnięty cel' : 'osiągnięte cele'}, do odebrania`,
    finds: (f, cap) => `Znaleziska w torbie: ${f} (zajęte ${f} z ${cap})`,
    best: (b) => `Najlepsze znalezisko: ${b}`,
    next: (g) => `Następny cel: ${g}`,
    why: 'Twój TRMNL pokazuje przygodę na bieżąco. Odbieranie złota, zakładanie ekwipunku i sprzedaż znalezisk odbywają się w aplikacji.',
    open: (l) => `Otwórz Desk Crawler: ${l}`,
    signIn: 'Zaloguj się na to samo konto, którego użyto do instalacji.',
    sign: 'Barry, twórca Desk Crawlera',
    footer: (l) => `Dostajesz tę wiadomość, bo na twoim TRMNL zainstalowano Desk Crawlera. To jedyne przypomnienie, jakie wyślemy. Aby nie dostawać więcej e-maili o swoim bohaterze: ${l}`,
  },
  nl: {
    subjectGold: (n, g) => `Desk Crawler voor TRMNL: ${n} heeft ${g} goud voor je klaarliggen`,
    subjectFinds: (n, f) => `Desk Crawler voor TRMNL: ${n} heeft ${f === 1 ? 'een vondst' : `${f} vondsten`} in de tas`,
    subjectLevel: (n, l) => `Desk Crawler voor TRMNL: ${n} is level ${l}`,
    hi: 'Hoi,',
    intro: (n, d, l) => `${n} is op avontuur op je TRMNL sinds je Desk Crawler op ${d} installeerde, en is nu level ${l}.`,
    waiting: 'Er ligt een en ander voor je klaar in de Desk Crawler-app:',
    upNext: 'Dit komt hierna in de Desk Crawler-app:',
    gold: (g, c) => `${g} goud voor ${c === 1 ? 'een gehaald doel' : `${c} gehaalde doelen`}, klaar om op te halen`,
    finds: (f, cap) => `${f === 1 ? '1 vondst' : `${f} vondsten`} in de tas (${f} van ${cap} plekken)`,
    best: (b) => `Beste vondst: ${b}`,
    next: (g) => `Volgend doel: ${g}`,
    why: 'Je TRMNL laat het avontuur zien terwijl het gebeurt. Goud ophalen, uitrusting aantrekken en vondsten verkopen doe je in de app.',
    open: (l) => `Open Desk Crawler: ${l}`,
    signIn: 'Log in met hetzelfde account waarmee je het hebt geïnstalleerd.',
    sign: 'Barry, maker van Desk Crawler',
    footer: (l) => `Je krijgt dit omdat je Desk Crawler op je TRMNL hebt geïnstalleerd. Het is de enige herinnering die we sturen. Geen mails meer over je held: ${l}`,
  },
}

/** The day the hero started, as the owner reads a date ("13 October", "13. Oktober"), in their time zone. */
function startDate(locale: Locale, at: number, timezone: string): string {
  const format = (timeZone: string) => new Intl.DateTimeFormat(INTL_TAG[locale], { day: 'numeric', month: 'long', timeZone }).format(at)
  try {
    return format(timezone)
  } catch {
    return format('UTC')
  }
}

export function heroReminderEmail(locale: Locale, facts: ReminderFacts, links: ReminderLinks): { subject: string; text: string } {
  const w = WORDS[locale]
  const subject = facts.gold > 0 ? w.subjectGold(facts.name, facts.gold) : facts.finds > 0 ? w.subjectFinds(facts.name, facts.finds) : w.subjectLevel(facts.name, facts.level)
  const items = [
    ...(facts.gold > 0 ? [w.gold(facts.gold, facts.goals)] : []),
    ...(facts.finds > 0 ? [w.finds(facts.finds, facts.capacity) + (facts.best ? `. ${w.best(facts.best)}` : '')] : []),
    ...(facts.nextGoal ? [w.next(facts.nextGoal)] : []),
  ]
  const lead = facts.gold > 0 || facts.finds > 0 ? w.waiting : w.upNext
  const text = [
    w.hi,
    '',
    `${w.intro(facts.name, startDate(locale, facts.since, facts.timezone), facts.level)} ${items.length > 0 ? lead : ''}`.trim(),
    ...(items.length > 0 ? ['', ...items.map((item) => `- ${item}`)] : []),
    '',
    w.why,
    '',
    w.open(links.app),
    w.signIn,
    '',
    w.sign,
    '',
    '--',
    w.footer(links.stop),
  ].join('\n')
  return { subject, text }
}
