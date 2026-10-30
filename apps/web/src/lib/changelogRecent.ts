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
    date: '2026-10-30',
    changes: [
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
  {
    date: '2026-10-27',
    changes: [
      {
        title: 'Lighter help and log pages',
        body: 'The Desk Crawler guide now loads in your language alone, about a tenth of what it fetched before, and the Log tab opens straight onto your entries instead of a placeholder. The More tab lists its pages in two columns.',
        fr: { title: 'Aide et journal plus légers', body: 'Le guide de Desk Crawler ne charge plus que votre langue, environ un dixième de ce qu’il récupérait avant, et l’onglet Journal s’ouvre directement sur vos entrées au lieu d’un espace réservé. L’onglet Plus présente ses pages sur deux colonnes.' },
        de: { title: 'Leichtere Hilfe- und Log-Seiten', body: 'Der Desk-Crawler-Leitfaden lädt jetzt nur noch deine Sprache, etwa ein Zehntel von vorher, und der Log-Tab öffnet sich direkt auf deinen Einträgen statt auf einem Platzhalter. Der Mehr-Tab zeigt seine Seiten in zwei Spalten.' },
        es: { title: 'Ayuda y diario más ligeros', body: 'La guía de Desk Crawler ahora carga solo tu idioma, cerca de una décima parte de lo que descargaba antes, y la pestaña Diario se abre directamente en tus entradas en vez de en un marcador. La pestaña Más muestra sus páginas en dos columnas.' },
        it: { title: 'Aiuto e diario più leggeri', body: 'La guida di Desk Crawler ora carica solo la tua lingua, circa un decimo di quanto scaricava prima, e la scheda Diario si apre subito sulle tue voci invece che su un segnaposto. La scheda Altro mostra le sue pagine su due colonne.' },
        pt: { title: 'Ajuda e diário mais leves', body: 'O guia do Desk Crawler agora carrega só o seu idioma, cerca de um décimo do que buscava antes, e a aba Diário abre direto nas suas entradas em vez de um espaço reservado. A aba Mais mostra suas páginas em duas colunas.' },
        pl: { title: 'Lżejsza pomoc i lżejsze wpisy', body: 'Przewodnik po Desk Crawler ładuje teraz tylko Twój język, około jednej dziesiątej tego, co pobierał wcześniej, a zakładka Wpisy otwiera się od razu na Twoich wpisach zamiast na pustym miejscu. Zakładka Więcej pokazuje swoje strony w dwóch kolumnach.' },
        nl: { title: 'Lichtere hulp- en logboekpagina’s', body: 'De Desk Crawler-gids laadt nu alleen jouw taal, ongeveer een tiende van wat hij eerder ophaalde, en het tabblad Logboek opent meteen op je regels in plaats van op een tijdelijke plek. Het tabblad Meer toont zijn pagina’s in twee kolommen.' },
      },
      {
        title: 'A faster, tidier companion',
        body: 'The companion loads much less script: it fetches the game names in your language only when you read in one, instead of every language at once. Changing your hero’s stance no longer asks you to confirm, since it switches back any time. The Bag tab’s number now appears only when a find is waiting for a slot or the bag is nearly full. The Rankings show the five around you and the top five, with the rest a tap away. The Log keeps its raid and coworker counts out of sight until there is one, and the More tab puts the shop under its own heading with the installations folded away.',
        fr: { title: 'Un compagnon plus rapide et plus net', body: 'Le compagnon charge beaucoup moins de script : il ne récupère les noms du jeu dans votre langue que lorsque vous lisez dans celle-ci, au lieu de toutes les langues à la fois. Changer la posture de votre héros ne demande plus de confirmation, puisque vous pouvez revenir en arrière à tout moment. Le chiffre de l’onglet Sac n’apparaît plus que lorsqu’une trouvaille attend une place ou que le sac est presque plein. Les classements montrent les cinq autour de vous et les cinq premiers, le reste en un geste. Le journal garde ses compteurs de raids et de collègues hors de vue tant qu’il n’y en a pas, et l’onglet Plus place la boutique sous son propre titre, avec les installations repliées.' },
        de: { title: 'Ein schnellerer, aufgeräumterer Begleiter', body: 'Der Begleiter lädt viel weniger Skript: Er holt die Spielnamen in deiner Sprache nur, wenn du in ihr liest, statt alle Sprachen auf einmal. Die Haltung deines Helden zu wechseln fragt nicht mehr nach, denn du kannst jederzeit zurück. Die Zahl am Taschen-Tab erscheint jetzt nur, wenn ein Fund auf einen Platz wartet oder die Tasche fast voll ist. Die Ränge zeigen die fünf um dich herum und die Top 5, der Rest ist einen Tipp entfernt. Das Log hält seine Überfall- und Kollegenzähler verborgen, bis es einen gibt, und der Mehr-Tab stellt den Shop unter eine eigene Überschrift, mit eingeklappten Installationen.' },
        es: { title: 'Un compañero más rápido y ordenado', body: 'El compañero carga mucho menos script: obtiene los nombres del juego en tu idioma solo cuando lees en él, en vez de todos los idiomas a la vez. Cambiar la postura de tu héroe ya no pide confirmación, porque puedes volver a cambiarla cuando quieras. El número de la pestaña Bolsa aparece ahora solo cuando un hallazgo espera un hueco o la bolsa está casi llena. La tabla muestra los cinco a tu alrededor y los cinco primeros, con el resto a un toque. El diario mantiene sus cuentas de incursiones y compañeros fuera de la vista hasta que haya una, y la pestaña Más pone la tienda bajo su propio título, con las instalaciones plegadas.' },
        it: { title: 'Un compagno più veloce e ordinato', body: 'Il compagno carica molto meno script: recupera i nomi del gioco nella tua lingua solo quando leggi in quella lingua, invece di tutte le lingue insieme. Cambiare la tattica del tuo eroe non chiede più conferma, perché puoi tornare indietro quando vuoi. Il numero sulla scheda Borsa compare ora solo quando un ritrovamento aspetta un posto o la borsa è quasi piena. Il podio mostra i cinque intorno a te e i primi cinque, con il resto a un tocco. Il diario tiene i conteggi di incursioni e colleghi fuori vista finché non ce n’è uno, e la scheda Altro mette il negozio sotto un titolo suo, con le installazioni ripiegate.' },
        pt: { title: 'Um companheiro mais rápido e arrumado', body: 'O companheiro carrega muito menos script: busca os nomes do jogo no seu idioma só quando você lê nele, em vez de todos os idiomas de uma vez. Mudar a postura do seu herói não pede mais confirmação, já que dá para voltar a qualquer momento. O número da aba Bolsa agora só aparece quando um achado espera por um espaço ou a bolsa está quase cheia. O placar mostra os cinco ao seu redor e os cinco primeiros, com o resto a um toque. O diário deixa as contagens de incursões e colegas fora de vista até existir uma, e a aba Mais coloca a loja sob o próprio título, com as instalações recolhidas.' },
        pl: { title: 'Szybszy i schludniejszy towarzysz', body: 'Towarzysz ładuje znacznie mniej skryptu: pobiera nazwy z gry w Twoim języku tylko wtedy, gdy w nim czytasz, zamiast wszystkich języków naraz. Zmiana postawy bohatera nie prosi już o potwierdzenie, bo w każdej chwili można ją cofnąć. Liczba na zakładce Torba pojawia się teraz tylko wtedy, gdy znalezisko czeka na miejsce albo torba jest prawie pełna. Tabela pokazuje pięcioro wokół Ciebie i pierwszą piątkę, reszta jest o jedno dotknięcie dalej. Wpisy chowają liczniki najazdów i współpracowników, dopóki nie będzie pierwszego, a zakładka Więcej daje sklepowi własny nagłówek, z instalacjami zwiniętymi.' },
        nl: { title: 'Een snellere, nettere begeleider', body: 'De begeleider laadt veel minder script: hij haalt de spelnamen in jouw taal alleen op wanneer je daarin leest, in plaats van alle talen tegelijk. De houding van je held wisselen vraagt niet meer om bevestiging, want je kunt altijd terug. Het getal op het tabblad Tas verschijnt nu alleen als een vondst op een plek wacht of de tas bijna vol is. De stand toont de vijf rond jou en de top 5, de rest is één tik verder. Het logboek houdt zijn tellers voor overvallen en collega’s uit zicht tot er een is, en het tabblad Meer zet de winkel onder een eigen kop, met de installaties ingeklapt.' },
      },
      {
        title: 'A Rogue heals to its own limit',
        body: 'A decision that healed a Rogue could push it past its maximum HP, and the game then paused that hero for a service check until someone looked. Healing now stops at the right limit, the paused hero is back at work, and a pause like this now tells us the same hour it happens.',
        fr: { title: 'Un Voleur se soigne jusqu’à sa propre limite', body: 'Une décision qui soignait un Voleur pouvait le pousser au-delà de ses PV maximum, et le jeu mettait alors ce héros en pause pour une vérification technique jusqu’à ce que quelqu’un s’en occupe. Le soin s’arrête désormais à la bonne limite, le héros en pause a repris le travail, et une pause de ce genre nous est maintenant signalée dans l’heure.' },
        de: { title: 'Ein Schurke heilt bis zu seiner eigenen Grenze', body: 'Eine Entscheidung, die einen Schurken heilte, konnte ihn über seine maximalen LP hinaus bringen, und das Spiel pausierte diesen Helden dann für eine Wartungsprüfung, bis jemand nachsah. Heilung endet jetzt an der richtigen Grenze, der pausierte Held ist wieder im Dienst, und eine solche Pause meldet sich nun in derselben Stunde bei uns.' },
        es: { title: 'Un Pícaro se cura hasta su propio límite', body: 'Una decisión que curaba a un Pícaro podía llevarlo por encima de sus PV máximos, y el juego pausaba entonces a ese héroe por una revisión técnica hasta que alguien lo mirara. La curación ahora se detiene en el límite correcto, el héroe pausado ha vuelto al trabajo, y una pausa así ahora nos avisa en la misma hora en que ocurre.' },
        it: { title: 'Un Ladro si cura fino al proprio limite', body: 'Una decisione che curava un Ladro poteva portarlo oltre i suoi PV massimi, e il gioco metteva quell’eroe in pausa per un controllo tecnico finché qualcuno non controllava. La cura ora si ferma al limite giusto, l’eroe in pausa è tornato al lavoro, e una pausa del genere ora ci avvisa nella stessa ora in cui accade.' },
        pt: { title: 'Um Ladino cura-se até ao seu próprio limite', body: 'Uma decisão que curava um Ladino podia levá-lo acima dos seus PV máximos, e o jogo pausava então esse herói para uma verificação técnica até alguém verificar. A cura agora para no limite certo, o herói pausado voltou ao trabalho, e uma pausa destas passa a avisar-nos na mesma hora em que acontece.' },
        pl: { title: 'Łotrzyk leczy się do własnego limitu', body: 'Decyzja, która leczyła Łotrzyka, mogła wypchnąć go ponad maksymalne PŻ, a gra wstrzymywała wtedy tego bohatera na kontrolę techniczną, aż ktoś to sprawdził. Leczenie zatrzymuje się teraz na właściwym limicie, wstrzymany bohater wrócił do pracy, a taka pauza daje nam teraz znać w tej samej godzinie.' },
        nl: { title: 'Een Schurk geneest tot zijn eigen grens', body: 'Een beslissing die een Schurk genas, kon hem boven zijn maximale HP brengen, waarna het spel die held pauzeerde voor een technische controle tot iemand keek. Genezing stopt nu op de juiste grens, de gepauzeerde held is weer aan het werk, en zo’n pauze meldt zich nu in hetzelfde uur bij ons.' },
      },
    ],
  },
  {
    date: '2026-10-21',
    changes: [
      {
        title: 'A lighter front page',
        body: 'Every page now loads about a sixth of the script it used to, so the site opens faster on a phone. On a phone the front page names each game above its screen, the recent changes link to their full entries, and the analytics question takes one line.',
        fr: { title: 'Une page d’accueil plus légère', body: 'Chaque page charge désormais environ six fois moins de script, et le site s’ouvre plus vite sur un téléphone. Sur un téléphone, la page d’accueil nomme chaque jeu au-dessus de son écran, les changements récents renvoient à leur entrée complète, et la question sur les statistiques tient en une ligne.' },
        de: { title: 'Eine leichtere Startseite', body: 'Jede Seite lädt jetzt etwa ein Sechstel des bisherigen Skripts, sodass die Seite auf dem Handy schneller öffnet. Auf dem Handy nennt die Startseite jedes Spiel über seinem Bildschirm, die neuesten Änderungen verlinken auf ihren vollständigen Eintrag, und die Frage zu den Statistiken passt in eine Zeile.' },
        es: { title: 'Una portada más ligera', body: 'Cada página carga ahora cerca de una sexta parte del script de antes, así que el sitio abre más rápido en el móvil. En el móvil, la portada nombra cada juego encima de su pantalla, los cambios recientes enlazan a su entrada completa y la pregunta sobre las estadísticas ocupa una línea.' },
        it: { title: 'Una pagina iniziale più leggera', body: 'Ogni pagina ora carica circa un sesto dello script di prima, così il sito si apre più in fretta sul telefono. Sul telefono la pagina iniziale nomina ogni gioco sopra il suo schermo, le modifiche recenti rimandano alla loro voce completa e la domanda sulle statistiche sta in una riga.' },
        pt: { title: 'Uma página inicial mais leve', body: 'Cada página agora carrega cerca de um sexto do script de antes, então o site abre mais rápido no celular. No celular, a página inicial nomeia cada jogo acima da sua tela, as mudanças recentes levam à sua entrada completa e a pergunta sobre estatísticas cabe em uma linha.' },
        pl: { title: 'Lżejsza strona główna', body: 'Każda strona ładuje teraz około jednej szóstej dawnego skryptu, więc witryna otwiera się szybciej na telefonie. Na telefonie strona główna podaje nazwę każdej gry nad jej ekranem, ostatnie zmiany prowadzą do pełnego wpisu, a pytanie o statystyki mieści się w jednej linii.' },
        nl: { title: 'Een lichtere voorpagina', body: 'Elke pagina laadt nu ongeveer een zesde van het script van vroeger, zodat de site sneller opent op een telefoon. Op een telefoon noemt de voorpagina elk spel boven zijn scherm, de recente wijzigingen linken naar hun volledige vermelding, en de vraag over statistieken past op één regel.' },
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
