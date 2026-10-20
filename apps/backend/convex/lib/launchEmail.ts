import type { Locale } from '@trmnl-games/platform'

/**
 * D201: the one launch email a game's waiting list gets, in plain text in the reader's language. Replies go to Barry,
 * so the sign-off says so. Only Idle Angler has a list today.
 */
interface Words {
  subject: string
  intro: string
  install: (url: string) => string
  steps: string
  signoff: string
  footer: string
  unsubscribe: (url: string) => string
}

const IDLE_ANGLER: Readonly<Record<Locale, Words>> = {
  en: {
    subject: 'Idle Angler is live on TRMNL',
    intro: 'Idle Angler is out on the TRMNL marketplace, and it’s free. It’s a fishing game that plays itself on your TRMNL. Every fifteen minutes your angler casts at the Millpond, River Bend or one of four other waters, and your screen shows the catch, the weather and the week’s heaviest fish. Every day or two you open the companion to sell your catch, fill the fishmonger’s orders and save for the next rod.',
    install: (url) => `Install it here: ${url}`,
    steps: 'After installing, sign in with your TRMNL Games account (the same one as Desk Crawler, if you play it) and click Save in TRMNL. Your angler lands the first fish within fifteen minutes.',
    signoff: 'Thanks for asking to hear about it. Replies to this email come straight to me, so if something breaks or doesn’t make sense, tell me and I’ll fix it.',
    footer: 'You’re getting this because you asked to hear when Idle Angler launched. You’re now off the list, so this is the only email you’ll get from it.',
    unsubscribe: (url) => `Unsubscribe: ${url}`,
  },
  fr: {
    subject: 'Idle Angler est disponible sur TRMNL',
    intro: 'Idle Angler est sur la marketplace TRMNL, et c’est gratuit. C’est un jeu de pêche qui se joue tout seul sur votre TRMNL. Toutes les quinze minutes, votre pêcheur lance à l’Étang du moulin, au Méandre ou sur l’un des quatre autres plans d’eau, et votre écran montre la prise, la météo et les plus gros poissons de la semaine. Tous les un ou deux jours, ouvrez le compagnon pour vendre vos prises, remplir les commandes du poissonnier et économiser pour la canne suivante.',
    install: (url) => `L’installer : ${url}`,
    steps: 'Après l’installation, connectez-vous avec votre compte TRMNL Games (le même que pour Desk Crawler, si vous y jouez) et cliquez sur Enregistrer dans TRMNL. Votre pêcheur prend son premier poisson dans les quinze minutes.',
    signoff: 'Merci d’avoir demandé à être prévenu. Les réponses à cet e-mail m’arrivent directement : si quelque chose ne marche pas ou n’est pas clair, dites-le-moi et je corrigerai.',
    footer: 'Vous recevez cet e-mail parce que vous avez demandé à être prévenu du lancement d’Idle Angler. Vous ne figurez plus sur la liste : c’est le seul e-mail que vous en recevrez.',
    unsubscribe: (url) => `Se désinscrire : ${url}`,
  },
  de: {
    subject: 'Idle Angler ist jetzt auf TRMNL',
    intro: 'Idle Angler ist im TRMNL-Marktplatz und kostenlos. Es ist ein Angelspiel, das sich auf deinem TRMNL von selbst spielt. Alle fünfzehn Minuten wirft dein Angler am Mühlteich, an der Flussbiegung oder an einem von vier weiteren Gewässern aus, und dein Bildschirm zeigt den Fang, das Wetter und die schwersten Fische der Woche. Alle ein, zwei Tage öffnest du die Begleit-App, verkaufst deinen Fang, erfüllst die Aufträge des Fischhändlers und sparst für die nächste Rute.',
    install: (url) => `Hier installieren: ${url}`,
    steps: 'Melde dich nach der Installation mit deinem TRMNL-Games-Konto an (dasselbe wie bei Desk Crawler, falls du es spielst) und klicke in TRMNL auf Speichern. Dein Angler fängt innerhalb von fünfzehn Minuten den ersten Fisch.',
    signoff: 'Danke, dass du Bescheid wissen wolltest. Antworten auf diese E-Mail kommen direkt bei mir an. Wenn etwas kaputt ist oder keinen Sinn ergibt, sag es mir, und ich behebe es.',
    footer: 'Du bekommst diese E-Mail, weil du über den Start von Idle Angler informiert werden wolltest. Du stehst jetzt nicht mehr auf der Liste, also ist das die einzige E-Mail von ihr.',
    unsubscribe: (url) => `Abmelden: ${url}`,
  },
  es: {
    subject: 'Idle Angler ya está en TRMNL',
    intro: 'Idle Angler ya está en el marketplace de TRMNL, y es gratis. Es un juego de pesca que se juega solo en tu TRMNL. Cada quince minutos tu pescador lanza en el Estanque del molino, el Recodo del río u otra de las cuatro aguas, y tu pantalla muestra la captura, el tiempo y los peces más pesados de la semana. Cada uno o dos días abres la app para vender tus capturas, cumplir los pedidos del pescadero y ahorrar para la siguiente caña.',
    install: (url) => `Instálalo aquí: ${url}`,
    steps: 'Después de instalarlo, inicia sesión con tu cuenta de TRMNL Games (la misma que en Desk Crawler, si juegas) y pulsa Guardar en TRMNL. Tu pescador saca su primer pez en menos de quince minutos.',
    signoff: 'Gracias por pedir que te avisáramos. Las respuestas a este correo me llegan directamente, así que si algo falla o no se entiende, dímelo y lo arreglo.',
    footer: 'Recibes este correo porque pediste que te avisáramos del lanzamiento de Idle Angler. Ya no estás en la lista, así que es el único correo que recibirás de ella.',
    unsubscribe: (url) => `Darse de baja: ${url}`,
  },
  it: {
    subject: 'Idle Angler è disponibile su TRMNL',
    intro: 'Idle Angler è sul marketplace di TRMNL, ed è gratis. È un gioco di pesca che si gioca da solo sul tuo TRMNL. Ogni quindici minuti il tuo pescatore lancia allo Stagno del mulino, all’Ansa del fiume o in una delle altre quattro acque, e lo schermo mostra la cattura, il tempo e i pesci più pesanti della settimana. Ogni giorno o due apri l’app per vendere il pescato, evadere gli ordini del pescivendolo e risparmiare per la prossima canna.',
    install: (url) => `Installalo qui: ${url}`,
    steps: 'Dopo l’installazione, accedi con il tuo account TRMNL Games (lo stesso di Desk Crawler, se ci giochi) e fai clic su Salva in TRMNL. Il tuo pescatore prende il primo pesce entro quindici minuti.',
    signoff: 'Grazie per aver chiesto di essere avvisato. Le risposte a questa e-mail arrivano direttamente a me: se qualcosa non funziona o non è chiaro, dimmelo e lo sistemo.',
    footer: 'Ricevi questa e-mail perché hai chiesto di sapere quando sarebbe uscito Idle Angler. Ora non sei più nella lista, quindi è l’unica e-mail che riceverai da lì.',
    unsubscribe: (url) => `Annulla l’iscrizione: ${url}`,
  },
  pt: {
    subject: 'O Idle Angler chegou ao TRMNL',
    intro: 'O Idle Angler já está no marketplace do TRMNL, e é grátis. É um jogo de pesca que se joga sozinho no seu TRMNL. A cada quinze minutos seu pescador lança no Lago do moinho, na Curva do rio ou em uma das outras quatro águas, e a tela mostra a captura, o tempo e os peixes mais pesados da semana. A cada um ou dois dias você abre o app para vender suas capturas, atender os pedidos do peixeiro e juntar para a próxima vara.',
    install: (url) => `Instale aqui: ${url}`,
    steps: 'Depois de instalar, entre com sua conta TRMNL Games (a mesma do Desk Crawler, se você joga) e clique em Salvar no TRMNL. Seu pescador pega o primeiro peixe em até quinze minutos.',
    signoff: 'Obrigado por pedir para ser avisado. As respostas a este e-mail chegam direto para mim, então se algo quebrar ou não fizer sentido, me conte e eu corrijo.',
    footer: 'Você recebeu este e-mail porque pediu para saber quando o Idle Angler fosse lançado. Você não está mais na lista, então este é o único e-mail que receberá dela.',
    unsubscribe: (url) => `Cancelar inscrição: ${url}`,
  },
  pl: {
    subject: 'Idle Angler jest już na TRMNL',
    intro: 'Idle Angler jest już w marketplace TRMNL i jest darmowy. To gra wędkarska, która sama gra się na twoim TRMNL. Co piętnaście minut twój wędkarz zarzuca nad Stawem młyńskim, w Zakolu rzeki albo na jednym z czterech innych łowisk, a ekran pokazuje połów, pogodę i najcięższe ryby tygodnia. Co dzień lub dwa otwierasz aplikację, żeby sprzedać połów, zrealizować zamówienia handlarza ryb i odłożyć na kolejną wędkę.',
    install: (url) => `Zainstaluj tutaj: ${url}`,
    steps: 'Po instalacji zaloguj się na konto TRMNL Games (to samo co w Desk Crawler, jeśli w nią grasz) i kliknij „Zapisz” w TRMNL. Twój wędkarz złowi pierwszą rybę w ciągu piętnastu minut.',
    signoff: 'Dzięki, że chcesz o tym wiedzieć. Odpowiedzi na tego maila trafiają prosto do mnie, więc jeśli coś nie działa albo jest niejasne, napisz, a poprawię.',
    footer: 'Dostajesz tego maila, bo chcesz wiedzieć, kiedy wyjdzie Idle Angler. Nie ma cię już na liście, więc to jedyny mail, jaki z niej dostaniesz.',
    unsubscribe: (url) => `Wypisz się: ${url}`,
  },
  nl: {
    subject: 'Idle Angler staat op TRMNL',
    intro: 'Idle Angler staat in de TRMNL-marketplace, en het is gratis. Het is een visspel dat zichzelf speelt op je TRMNL. Elk kwartier werpt je visser uit bij de Molenvijver, de Rivierbocht of een van de vier andere wateren, en je scherm toont de vangst, het weer en de zwaarste vissen van de week. Elke dag of twee open je de app om je vangst te verkopen, bestellingen van de visboer te leveren en te sparen voor de volgende hengel.',
    install: (url) => `Installeer het hier: ${url}`,
    steps: 'Log na het installeren in met je TRMNL Games-account (hetzelfde als bij Desk Crawler, als je dat speelt) en klik op Opslaan in TRMNL. Je visser vangt binnen vijftien minuten de eerste vis.',
    signoff: 'Bedankt dat je op de hoogte wilde blijven. Antwoorden op deze e-mail komen rechtstreeks bij mij. Als er iets kapot is of niet klopt, laat het me weten, dan los ik het op.',
    footer: 'Je krijgt deze e-mail omdat je wilde horen wanneer Idle Angler uitkwam. Je staat nu niet meer op de lijst, dus dit is de enige e-mail die je ervan krijgt.',
    unsubscribe: (url) => `Afmelden: ${url}`,
  },
}

export function launchEmail(locale: Locale, links: { install: string; unsubscribe: string }): { subject: string; text: string } {
  const w = IDLE_ANGLER[locale] ?? IDLE_ANGLER.en
  return {
    subject: w.subject,
    text: [w.intro, '', w.install(links.install), '', w.steps, '', w.signoff, '', 'Barry', 'TRMNL Games', '', w.footer, '', w.unsubscribe(links.unsubscribe)].join('\n'),
  }
}
