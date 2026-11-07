import { INTL_TAG, type Locale } from '@trmnl-games/platform'
/**
 * The public dev log's newest entries (D153), newest first: changes players can see, in their words, dated by the day
 * they went live. A new change goes at the top of this file, in the same commit as the change it describes, in every
 * language, with no decision numbers or internal names. A later change on the same day goes first in that day's list,
 * so each change keeps its key (see `changeKeys` in changelog.ts).
 *
 * Only the newest few live here: the front page shows the latest three from this file alone, so it never loads the
 * whole log (changelogEarlier.ts). When this file holds more than ten changes, move the oldest days to the top of
 * changelogEarlier.ts; the test in tests/web/changelog.test.ts keeps the two in order.
 */
/** One change in English and every other language (D169, D193): an entry without them fails the typecheck. */
export interface Change {
  readonly title: string
  readonly body: string
  readonly fr: { readonly title: string; readonly body: string }
  readonly de: { readonly title: string; readonly body: string }
  readonly es: { readonly title: string; readonly body: string }
  readonly it: { readonly title: string; readonly body: string }
  readonly pt: { readonly title: string; readonly body: string }
  readonly pl: { readonly title: string; readonly body: string }
  readonly nl: { readonly title: string; readonly body: string }
}

export interface ChangelogEntry {
  /** The day it went live, as YYYY-MM-DD. */
  readonly date: string
  readonly changes: ReadonlyArray<Change>
}

/** A change's title and body in the reader's language. */
export const changeIn = (change: Change, locale: Locale): { title: string; body: string } => (locale === 'en' ? change : change[locale])
export const RECENT_CHANGES: ReadonlyArray<ChangelogEntry> = [
  {
    date: '2026-11-07',
    changes: [
      {
        title: 'The fly code is asked for on the Dock',
        body: 'In Idle Angler, while your TRMNL shows this week’s fly code, the Dock now asks for it at the top of the page instead of leaving the fly box at the foot of the Logbook. The Dock’s meter is labelled Cooler, with the bucket or box you own named under it. On a TRMNL X, the half-screen scene is taller and the weekly board starts at the top of its column.',
        fr: { title: 'Le code mouche est demandé sur le Ponton', body: 'Dans Idle Angler, tant que votre TRMNL affiche le code mouche de la semaine, le Ponton le demande maintenant en haut de la page au lieu de laisser la boîte à mouches au bas du Carnet. La jauge du Ponton s’appelle Glacière, avec le seau ou la boîte que vous possédez nommé dessous. Sur un TRMNL X, la scène du demi-écran est plus haute et le tableau de la semaine commence en haut de sa colonne.' },
        de: { title: 'Der Fliegencode wird am Steg abgefragt', body: 'In Idle Angler fragt der Steg jetzt oben auf der Seite nach dem Fliegencode der Woche, solange dein TRMNL ihn zeigt, statt die Fliegendose am Ende des Buchs zu lassen. Die Anzeige am Steg heißt Kühlbox, darunter steht der Eimer oder die Box, die du besitzt. Auf einem TRMNL X ist die Szene des halben Bildschirms höher und die Wochentabelle beginnt oben in ihrer Spalte.' },
        es: { title: 'El código de mosca se pide en el Muelle', body: 'En Idle Angler, mientras tu TRMNL muestra el código de mosca de la semana, el Muelle ahora lo pide en lo alto de la página en vez de dejar la caja de moscas al final del Diario. El medidor del Muelle se llama Nevera, con el cubo o la caja que tienes nombrado debajo. En un TRMNL X, la escena de media pantalla es más alta y la tabla semanal empieza arriba de su columna.' },
        it: { title: 'Il codice mosca viene chiesto al Pontile', body: 'In Idle Angler, finché il tuo TRMNL mostra il codice mosca della settimana, il Pontile ora lo chiede in cima alla pagina invece di lasciare la scatola delle mosche in fondo al Diario. L’indicatore del Pontile si chiama Frigo, con il secchio o la cassetta che possiedi indicato sotto. Su un TRMNL X la scena del mezzo schermo è più alta e la classifica della settimana parte dall’alto della sua colonna.' },
        pt: { title: 'O código da mosca é pedido no Píer', body: 'No Idle Angler, enquanto seu TRMNL mostra o código da mosca da semana, o Píer agora pede por ele no topo da página em vez de deixar a caixa de moscas no fim do Diário. O medidor do Píer chama-se Cooler, com o balde ou a caixa que você tem nomeado abaixo. Em um TRMNL X, a cena de meia tela é mais alta e o quadro da semana começa no topo da sua coluna.' },
        pl: { title: 'Kod muchy pytany na Pomoście', body: 'W Idle Angler, dopóki TRMNL pokazuje kod muchy na ten tydzień, Pomost prosi o niego u góry strony zamiast zostawiać pudełko na muchy na końcu Wpisów. Wskaźnik na Pomoście nazywa się Lodówka, a pod nim widać wiadro lub skrzynkę, które masz. Na TRMNL X scena na pół ekranu jest wyższa, a tygodniowa tabela zaczyna się u góry swojej kolumny.' },
        nl: { title: 'De vliegcode wordt op de Stek gevraagd', body: 'In Idle Angler vraagt de Stek nu bovenaan de pagina om de vliegcode van deze week zolang je TRMNL die toont, in plaats van de vliegendoos onderaan het Logboek te laten. De meter op de Stek heet Koelbox, met daaronder de emmer of box die je hebt. Op een TRMNL X is de scène op het halve scherm hoger en begint de weektabel bovenaan zijn kolom.' },
      },
    ],
  },
  {
    date: '2026-11-04',
    changes: [
      {
        title: 'The merchant stays the day',
        body: 'In Desk Crawler, the wandering merchant now stays about eight hours instead of one, and the Hero page shows what it sells with a button straight to its offers. A merchant deal alert that turns up overnight waits for the morning.',
        fr: { title: 'Le marchand reste la journée', body: 'Dans Desk Crawler, le marchand ambulant reste maintenant environ huit heures au lieu d’une, et la page Héros montre ce qu’il vend avec un bouton qui mène droit à ses offres. Une alerte de bonne affaire qui arrive la nuit attend le matin.' },
        de: { title: 'Der Händler bleibt den ganzen Tag', body: 'In Desk Crawler bleibt der wandernde Händler jetzt etwa acht Stunden statt einer, und die Helden-Seite zeigt, was er verkauft, mit einem Knopf direkt zu seinen Angeboten. Eine Händlerangebot-Benachrichtigung in der Nacht wartet bis zum Morgen.' },
        es: { title: 'El mercader se queda el día', body: 'En Desk Crawler, el mercader ambulante se queda ahora unas ocho horas en lugar de una, y la página Héroe muestra lo que vende con un botón directo a sus ofertas. Una alerta de oferta del mercader que llega de noche espera a la mañana.' },
        it: { title: 'Il mercante resta tutto il giorno', body: 'In Desk Crawler il mercante ambulante ora resta circa otto ore invece di una, e la pagina Eroe mostra cosa vende con un pulsante che porta dritto alle sue offerte. Un avviso di affare del mercante che arriva di notte aspetta il mattino.' },
        pt: { title: 'O mercador fica o dia todo', body: 'No Desk Crawler, o mercador ambulante agora fica cerca de oito horas em vez de uma, e a página Herói mostra o que ele vende com um botão direto para as ofertas. Um alerta de oferta do mercador que chega de madrugada espera a manhã.' },
        pl: { title: 'Kupiec zostaje na cały dzień', body: 'W Desk Crawler wędrowny kupiec zostaje teraz około ośmiu godzin zamiast jednej, a strona Bohater pokazuje, co sprzedaje, z przyciskiem prosto do jego ofert. Alert o okazji u kupca, który przyjdzie w nocy, czeka do rana.' },
        nl: { title: 'De koopman blijft de hele dag', body: 'In Desk Crawler blijft de rondtrekkende koopman nu zo’n acht uur in plaats van één, en de pagina Held laat zien wat hij verkoopt, met een knop die meteen naar zijn aanbiedingen gaat. Een melding over een koopje die ’s nachts binnenkomt, wacht tot de ochtend.' },
      },
      {
        title: 'More potions on the deep floors',
        body: 'In Desk Crawler, potions turn up more often in the Cafeteria Depths, the Archive and the Parking Garage, in place of some gold, so a hero down there no longer runs its pouch dry. The Archive gets the most.',
        fr: { title: 'Plus de potions dans les étages profonds', body: 'Dans Desk Crawler, les potions se trouvent plus souvent dans les Profondeurs de la cafétéria, les Archives et le Parking souterrain, à la place d’un peu d’or : un héros qui y descend ne vide plus sa bourse à potions. Les Archives en reçoivent le plus.' },
        de: { title: 'Mehr Tränke in den tiefen Etagen', body: 'In Desk Crawler findest du in den Kantinentiefen, im Archiv und in der Tiefgarage öfter Tränke, dafür etwas weniger Gold, damit dein Held dort unten nicht mehr mit leerem Trankbeutel dasteht. Das Archiv bekommt die meisten.' },
        es: { title: 'Más pociones en las plantas profundas', body: 'En Desk Crawler, las pociones aparecen más a menudo en las Profundidades de la cafetería, el Archivo y el Aparcamiento subterráneo, a cambio de algo de oro, para que un héroe allí abajo ya no se quede sin pociones. El Archivo recibe más que ninguna.' },
        it: { title: 'Più pozioni ai piani profondi', body: 'In Desk Crawler le pozioni si trovano più spesso nelle Profondità della mensa, nell’Archivio e nel Parcheggio sotterraneo, al posto di un po’ d’oro, così un eroe laggiù non resta più senza pozioni. L’Archivio ne riceve di più.' },
        pt: { title: 'Mais poções nos andares profundos', body: 'No Desk Crawler, as poções aparecem com mais frequência nas Profundezas do refeitório, no Arquivo e no Estacionamento subterrâneo, no lugar de um pouco de ouro, para que um herói lá embaixo não fique mais sem poções. O Arquivo recebe mais.' },
        pl: { title: 'Więcej mikstur na głębokich piętrach', body: 'W Desk Crawler mikstury trafiają się częściej w Czeluściach stołówki, w Archiwum i na Parkingu podziemnym, zamiast części złota, więc bohater na dole nie zostaje już z pustą sakiewką na mikstury. Najwięcej dostaje Archiwum.' },
        nl: { title: 'Meer drankjes op de diepe verdiepingen', body: 'In Desk Crawler vind je vaker drankjes in de Kantinediepten, het Archief en de Parkeergarage, in plaats van wat goud, zodat een held daar beneden niet meer zonder drankjes komt te zitten. Het Archief krijgt de meeste.' },
      },
    ],
  },
  {
    date: '2026-10-30',
    changes: [
      {
        title: 'The Bag tab counts again',
        body: 'In Desk Crawler, the Bag tab shows how many slots are in use whenever your bag holds anything, not only when it is nearly full.',
        fr: { title: 'L’onglet Sac compte de nouveau', body: 'Dans Desk Crawler, l’onglet Sac indique combien d’emplacements sont occupés dès que votre sac contient quelque chose, et plus seulement quand il est presque plein.' },
        de: { title: 'Der Tasche-Tab zählt wieder', body: 'In Desk Crawler zeigt der Tasche-Tab, wie viele Plätze belegt sind, sobald deine Tasche etwas enthält, nicht erst, wenn sie fast voll ist.' },
        es: { title: 'La pestaña Bolsa vuelve a contar', body: 'En Desk Crawler, la pestaña Bolsa muestra cuántos huecos están ocupados siempre que tu bolsa tenga algo, no solo cuando está casi llena.' },
        it: { title: 'La scheda Borsa conta di nuovo', body: 'In Desk Crawler la scheda Borsa mostra quanti spazi sono occupati ogni volta che la borsa contiene qualcosa, non solo quando è quasi piena.' },
        pt: { title: 'A aba Bolsa volta a contar', body: 'No Desk Crawler, a aba Bolsa mostra quantos espaços estão ocupados sempre que sua bolsa tem algo, não só quando está quase cheia.' },
        pl: { title: 'Zakładka Torba znów liczy', body: 'W Desk Crawler zakładka Torba pokazuje, ile miejsc jest zajętych, gdy tylko coś jest w torbie, a nie dopiero gdy jest prawie pełna.' },
        nl: { title: 'Het Tas-tabblad telt weer', body: 'In Desk Crawler laat het Tas-tabblad zien hoeveel plekken bezet zijn zodra je tas iets bevat, niet pas als hij bijna vol is.' },
      },
      {
        title: 'See who fishes your water',
        body: 'Idle Angler now shows who else is fishing your water: on your TRMNL, three names and how many more; on the Dock, a count for every water and the whole list behind See everyone.',
        fr: { title: 'Voyez qui pêche avec vous', body: 'Idle Angler montre maintenant qui d’autre pêche au même endroit que vous : sur votre TRMNL, trois noms et combien d’autres ; sur le Ponton, le nombre pour chaque plan d’eau et la liste complète derrière Voir tout le monde.' },
        de: { title: 'Sieh, wer an deinem Gewässer angelt', body: 'Idle Angler zeigt jetzt, wer sonst noch an deinem Gewässer angelt: auf deinem TRMNL drei Namen und wie viele weitere, am Steg die Zahl für jedes Gewässer und die ganze Liste hinter Alle ansehen.' },
        es: { title: 'Mira quién pesca en tu agua', body: 'Idle Angler muestra ahora quién más pesca en tu agua: en tu TRMNL, tres nombres y cuántos más; en el Muelle, la cifra de cada agua y la lista completa tras Ver a todos.' },
        it: { title: 'Guarda chi pesca nelle tue acque', body: 'Idle Angler ora mostra chi altro pesca nelle tue acque: sul TRMNL tre nomi e quanti altri, al Pontile il numero per ogni specchio d’acqua e l’elenco completo dietro Vedi tutti.' },
        pt: { title: 'Veja quem pesca na sua água', body: 'O Idle Angler agora mostra quem mais está pescando na sua água: no TRMNL, três nomes e quantos mais; no Píer, a contagem de cada água e a lista completa em Ver todos.' },
        pl: { title: 'Zobacz, kto łowi z tobą', body: 'Idle Angler pokazuje teraz, kto jeszcze łowi na twoim łowisku: na TRMNL trzy imiona i ilu jeszcze, na Pomoście liczbę przy każdym łowisku i pełną listę pod Zobacz wszystkich.' },
        nl: { title: 'Zie wie er bij jou vist', body: 'Idle Angler laat nu zien wie er nog meer op jouw water vist: op je TRMNL drie namen en hoeveel anderen, op de Stek het aantal bij elk water en de hele lijst achter Bekijk iedereen.' },
      },
      {
        title: 'Keepsakes land on your shelf',
        body: 'Scanning the keepsake code on your Desk Crawler screen now opens your keepsakes page, with confetti and the new design marked on the shelf.',
        fr: { title: 'Les souvenirs arrivent sur votre étagère', body: 'Scanner le code souvenir de votre écran Desk Crawler ouvre maintenant la page des souvenirs, avec des confettis et le nouveau modèle signalé sur l’étagère.' },
        de: { title: 'Andenken landen in deinem Regal', body: 'Wenn du den Andenken-Code auf deinem Desk-Crawler-Bildschirm scannst, öffnet sich jetzt die Andenken-Seite, mit Konfetti und dem neuen Motiv im Regal markiert.' },
        es: { title: 'Los recuerdos llegan a tu estante', body: 'Al escanear el código de recuerdo de tu pantalla de Desk Crawler se abre ahora la página de recuerdos, con confeti y el nuevo diseño marcado en el estante.' },
        it: { title: 'I ricordi arrivano sul tuo scaffale', body: 'Scansionando il codice ricordo sullo schermo di Desk Crawler si apre ora la pagina dei ricordi, con i coriandoli e il nuovo modello segnato sullo scaffale.' },
        pt: { title: 'As lembranças chegam à sua estante', body: 'Ao escanear o código de lembrança na tela do Desk Crawler, a página de lembranças agora abre, com confete e o novo modelo marcado na estante.' },
        pl: { title: 'Pamiątki trafiają na półkę', body: 'Zeskanowanie kodu pamiątki z ekranu Desk Crawler otwiera teraz stronę pamiątek, z konfetti i nowym wzorem oznaczonym na półce.' },
        nl: { title: 'Aandenkens landen op je plank', body: 'Als je de aandenkencode op je Desk Crawler-scherm scant, opent nu de aandenkenpagina, met confetti en het nieuwe ontwerp gemarkeerd op de plank.' },
      },
      {
        title: 'Buttons hold still',
        body: 'A button keeps its width while it works, so nothing beside it jumps when its label changes.',
        fr: { title: 'Des boutons qui ne bougent plus', body: 'Un bouton garde sa largeur pendant qu’il travaille : rien ne saute à côté quand son texte change.' },
        de: { title: 'Knöpfe bleiben stehen', body: 'Ein Knopf behält seine Breite, während er arbeitet, damit nichts daneben springt, wenn sich seine Beschriftung ändert.' },
        es: { title: 'Los botones se quedan quietos', body: 'Un botón mantiene su ancho mientras trabaja, así nada a su lado salta cuando cambia su texto.' },
        it: { title: 'I pulsanti restano fermi', body: 'Un pulsante mantiene la sua larghezza mentre lavora, così niente accanto salta quando cambia la scritta.' },
        pt: { title: 'Os botões ficam parados', body: 'Um botão mantém a largura enquanto trabalha, então nada ao lado pula quando o texto muda.' },
        pl: { title: 'Przyciski stoją w miejscu', body: 'Przycisk zachowuje szerokość, gdy pracuje, więc nic obok nie skacze, kiedy zmienia się jego napis.' },
        nl: { title: 'Knoppen blijven stilstaan', body: 'Een knop houdt zijn breedte terwijl hij bezig is, zodat er niets naast verspringt als het opschrift verandert.' },
      },
      {
        title: 'Fly codes land with a splash',
        body: 'Scanning the fly code on your Idle Angler screen now opens your fly box at the top of the logbook, with confetti and the new fly marked as it lands.',
        fr: { title: 'Les codes mouche arrivent en fanfare', body: 'Scanner le code mouche de votre écran Idle Angler ouvre maintenant votre boîte à mouches en haut du carnet, avec des confettis et la nouvelle mouche signalée à son arrivée.' },
        de: { title: 'Fliegencodes kommen mit Konfetti an', body: 'Wenn du den Fliegencode auf deinem Idle-Angler-Bildschirm scannst, öffnet sich deine Fliegendose jetzt oben im Fangbuch, mit Konfetti und der neuen Fliege markiert.' },
        es: { title: 'Los códigos de mosca llegan con confeti', body: 'Al escanear el código de mosca de tu pantalla de Idle Angler, tu caja de moscas se abre ahora arriba del Cuaderno, con confeti y la nueva mosca marcada al llegar.' },
        it: { title: 'I codici delle mosche arrivano con i coriandoli', body: 'Scansionando il codice mosca sullo schermo di Idle Angler, la scatola delle mosche si apre ora in cima al registro, con i coriandoli e la nuova mosca segnata appena arriva.' },
        pt: { title: 'Os códigos de mosca chegam com confete', body: 'Ao escanear o código de mosca na tela do Idle Angler, sua caixa de moscas agora abre no topo do Caderno, com confete e a nova mosca marcada assim que chega.' },
        pl: { title: 'Kody much przychodzą z konfetti', body: 'Zeskanowanie kodu muchy z ekranu Idle Angler otwiera teraz pudełko na muchy na górze Rejestru, z konfetti i oznaczoną nową muchą.' },
        nl: { title: 'Vliegcodes komen binnen met confetti', body: 'Als je de vliegcode op je Idle Angler-scherm scant, opent je vliegendoos nu bovenaan het Logboek, met confetti en de nieuwe vlieg gemarkeerd zodra hij binnenkomt.' },
      },
      {
        title: 'See who shares your floor',
        body: 'Your TRMNL now names up to three other heroes on your hero’s floor under the status line, with how many more are there. In the companion, the world map shows how many heroes are on each floor, and See everyone lists everyone on yours, linked to their public pages.',
        fr: { title: 'Voyez qui partage votre étage', body: 'Votre TRMNL nomme désormais jusqu’à trois autres héros présents à l’étage de votre héros, sous la ligne d’état, avec le nombre de ceux qui restent. Dans le compagnon, la carte du monde indique combien de héros se trouvent à chaque étage, et Voir tout le monde liste tous ceux du vôtre, avec un lien vers leur page publique.' },
        de: { title: 'Sieh, wer auf deiner Etage ist', body: 'Dein TRMNL nennt jetzt unter der Statuszeile bis zu drei andere Helden auf der Etage deines Helden und wie viele noch dort sind. In der Begleit-App zeigt die Weltkarte, wie viele Helden auf jeder Etage sind, und Alle ansehen listet alle auf deiner Etage auf, mit Links zu ihren öffentlichen Seiten.' },
        es: { title: 'Mira quién comparte tu planta', body: 'Tu TRMNL ahora nombra, bajo la línea de estado, hasta tres héroes más que están en la planta de tu héroe, y cuántos más hay. En la app, el mapa del mundo muestra cuántos héroes hay en cada planta, y Ver a todos enumera a todos los de la tuya, con enlaces a sus páginas públicas.' },
        it: { title: 'Scopri chi c’è al tuo piano', body: 'Il tuo TRMNL ora nomina, sotto la riga di stato, fino a tre altri eroi al piano del tuo eroe, e quanti altri ce ne sono. Nell’app, la mappa del mondo mostra quanti eroi ci sono a ogni piano, e Vedi tutti elenca tutti quelli del tuo, con i link alle loro pagine pubbliche.' },
        pt: { title: 'Veja quem divide o seu andar', body: 'O seu TRMNL agora mostra, abaixo da linha de status, até três outros heróis no andar do seu herói e quantos mais estão lá. No app, o mapa do mundo mostra quantos heróis há em cada andar, e Ver todos lista todo mundo no seu, com links para as páginas públicas deles.' },
        pl: { title: 'Zobacz, kto jest na twoim piętrze', body: 'Twój TRMNL pokazuje teraz pod linią stanu do trzech innych bohaterów na piętrze twojego bohatera i ilu jest tam jeszcze. W aplikacji mapa świata pokazuje, ilu bohaterów jest na każdym piętrze, a Zobacz wszystkich wymienia wszystkich z twojego, z linkami do ich publicznych stron.' },
        nl: { title: 'Zie wie er op je verdieping is', body: 'Je TRMNL noemt nu onder de statusregel tot drie andere helden op de verdieping van je held, en hoeveel er nog meer zijn. In de app toont de wereldkaart hoeveel helden er op elke verdieping zijn, en Bekijk iedereen toont iedereen op die van jou, met links naar hun openbare pagina’s.' },
      },
    ],
  },
]

/** A change's stable key: its day and its number within that day, counted from the day's first change. */
export const changeKey = (entry: ChangelogEntry, index: number) => `${entry.date}.${String(entry.changes.length - index).padStart(2, '0')}`

/** The day an entry went live, written out ("14 October 2026", "14 octobre 2026"), the same on the server and in every browser. */
export const changeDay = (date: string, year = true, locale: Locale = 'en') => new Date(`${date}T12:00:00Z`).toLocaleDateString(INTL_TAG[locale], { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' })

/** The newest `count` changes from the recent file, newest first, each with the day it went live and its key on the What's new page. */
export const latestChanges = (count: number, locale: Locale = 'en'): Array<{ key: string; date: string; title: string; body: string }> =>
  RECENT_CHANGES.flatMap((entry) => entry.changes.map((change, index) => ({ key: changeKey(entry, index), date: entry.date, ...changeIn(change, locale) }))).slice(0, count)
