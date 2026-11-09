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
/** The games a change can belong to (D225). A change without a `game` is for every player: the site, the companion shell, both games. */
export type GameTag = 'desk-crawler' | 'idle-angler'
export const GAME_TAGS: readonly GameTag[] = ['desk-crawler', 'idle-angler']
export const GAME_TAG_NAMES: Readonly<Record<GameTag, string>> = { 'desk-crawler': 'Desk Crawler', 'idle-angler': 'Idle Angler' }

/**
 * One change in English and every other language (D169, D193): an entry without them fails the typecheck. `game` names
 * the one game it is about (D225); leave it out for a change every player sees, and each game's card and the page's
 * filter sort them accordingly.
 */
export interface Change {
  readonly game?: GameTag
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
    date: '2026-11-09',
    changes: [
      {
        game: 'idle-angler',
        title: 'See your TRMNL screen in the companion',
        body: 'Under More, On your TRMNL shows the screen your Idle Angler plugin is drawing right now, in each layout, on each device and in both orientations, as Desk Crawler has had.',
        fr: { title: 'Votre écran TRMNL dans le compagnon', body: 'Sous Plus, Sur votre TRMNL montre l’écran que votre plugin Idle Angler dessine en ce moment, dans chaque mise en page, sur chaque appareil et dans les deux orientations, comme Desk Crawler le proposait déjà.' },
        de: { title: 'Dein TRMNL-Bildschirm im Begleiter', body: 'Unter Mehr zeigt Auf deinem TRMNL den Bildschirm, den dein Idle-Angler-Plugin gerade zeichnet, in jedem Layout, auf jedem Gerät und in beiden Ausrichtungen, wie es Desk Crawler schon hatte.' },
        es: { title: 'Tu pantalla TRMNL en el compañero', body: 'En Más, En tu TRMNL muestra la pantalla que tu plugin de Idle Angler dibuja ahora mismo, en cada disposición, en cada dispositivo y en ambas orientaciones, como ya tenía Desk Crawler.' },
        it: { title: 'Il tuo schermo TRMNL nel compagno', body: 'Sotto Altro, Sul tuo TRMNL mostra la schermata che il tuo plugin di Idle Angler sta disegnando ora, in ogni layout, su ogni dispositivo e in entrambi gli orientamenti, come già aveva Desk Crawler.' },
        pt: { title: 'Sua tela TRMNL no companheiro', body: 'Em Mais, No seu TRMNL mostra a tela que seu plugin do Idle Angler está desenhando agora, em cada layout, em cada aparelho e nas duas orientações, como o Desk Crawler já tinha.' },
        pl: { title: 'Twój ekran TRMNL w aplikacji', body: 'W zakładce Więcej, Na twoim TRMNL pokazuje ekran, który twoja wtyczka Idle Angler rysuje w tej chwili, w każdym układzie, na każdym urządzeniu i w obu orientacjach, tak jak miał już Desk Crawler.' },
        nl: { title: 'Je TRMNL-scherm in de companion', body: 'Onder Meer toont Op je TRMNL het scherm dat je Idle Angler-plugin nu tekent, in elke indeling, op elk apparaat en in beide richtingen, zoals Desk Crawler al had.' },
      },
      {
        game: 'idle-angler',
        title: 'Waters you can compare at a glance',
        body: 'Each water on the Dock now shows its bite chance for the bait you would fish there, beside how many anglers are at it, and your rank there sits by its name. The weather line keeps only the weather and when it changes, with your species logged there. Bait is listed with the tubs you hold, and a zero links to the shop. The water you are fishing is marked, the Fish here buttons are smaller, and the notes on weather and moving have gone to the help page.',
        fr: { title: 'Des plans d’eau comparables d’un coup d’œil', body: 'Chaque plan d’eau du Ponton affiche désormais sa chance de touche avec l’appât que vous y pêcheriez, à côté du nombre de pêcheurs présents, et votre rang y figure près du nom. La ligne météo ne garde que la météo et l’heure de son changement, avec vos espèces notées là-bas. Les appâts sont listés avec les pots que vous avez, et un zéro renvoie au magasin. Le plan d’eau où vous pêchez est signalé, les boutons Pêcher ici sont plus petits, et les notes sur la météo et les déplacements sont passées dans l’aide.' },
        de: { title: 'Gewässer auf einen Blick vergleichen', body: 'Jedes Gewässer am Steg zeigt jetzt seine Bisschance mit dem Köder, den du dort angeln würdest, neben der Zahl der Angler dort, und dein Rang dort steht beim Namen. Die Wetterzeile behält nur das Wetter und seine Wechselzeit, dazu deine dort eingetragenen Arten. Köder stehen mit den Dosen, die du hast, und eine Null führt in den Laden. Das Gewässer, an dem du angelst, ist markiert, die Knöpfe Hier angeln sind kleiner, und die Hinweise zu Wetter und Wechsel stehen jetzt in der Hilfe.' },
        es: { title: 'Aguas que se comparan de un vistazo', body: 'Cada agua del Muelle muestra ahora su probabilidad de picada con el cebo que usarías allí, junto al número de pescadores presentes, y tu rango allí aparece junto al nombre. La línea del tiempo conserva solo el tiempo y cuándo cambia, con tus especies anotadas allí. El cebo se lista con los botes que tienes, y un cero enlaza con la tienda. El agua donde pescas está marcada, los botones Pescar aquí son más pequeños, y las notas sobre el tiempo y los cambios de agua han pasado a la ayuda.' },
        it: { title: 'Acque da confrontare a colpo d’occhio', body: 'Ogni acqua sul Pontile mostra ora la probabilità di abboccata con l’esca che useresti lì, accanto al numero di pescatori presenti, e il tuo grado lì compare accanto al nome. La riga del tempo tiene solo il tempo e quando cambia, con le specie che hai registrato lì. Le esche sono elencate con i barattoli che hai, e uno zero rimanda al negozio. L’acqua in cui peschi è segnata, i pulsanti Pesca qui sono più piccoli, e le note su tempo e spostamenti sono passate nella guida.' },
        pt: { title: 'Águas para comparar num relance', body: 'Cada água no Píer agora mostra sua chance de mordida com a isca que você usaria ali, ao lado do número de pescadores presentes, e seu rank ali aparece junto ao nome. A linha do tempo mantém só o tempo e quando ele muda, com as espécies que você registrou ali. As iscas aparecem com os potes que você tem, e um zero leva à loja. A água onde você pesca está marcada, os botões Pescar aqui estão menores, e as notas sobre o tempo e as mudanças de água foram para a ajuda.' },
        pl: { title: 'Łowiska do porównania jednym spojrzeniem', body: 'Każde łowisko na Pomoście pokazuje teraz szansę na branie z przynętą, której byś tam użył, obok liczby obecnych wędkarzy, a twoja ranga tam stoi przy nazwie. Wiersz pogody zachowuje tylko pogodę i godzinę jej zmiany, z liczbą gatunków, które tam zapisałeś. Przynęty są wypisane z posiadanymi pojemnikami, a zero prowadzi do sklepu. Łowisko, na którym łowisz, jest oznaczone, przyciski Łów tutaj są mniejsze, a uwagi o pogodzie i przenosinach przeniosły się do pomocy.' },
        nl: { title: 'Wateren die je in één oogopslag vergelijkt', body: 'Elk water op de Stek toont nu zijn beetkans met het aas dat je daar zou vissen, naast het aantal vissers daar, en je rang daar staat bij de naam. De weerregel houdt alleen het weer en wanneer het verandert, met de soorten die je daar hebt gelogd. Aas staat vermeld met de potjes die je hebt, en een nul linkt naar de winkel. Het water waar je vist is gemarkeerd, de knoppen Vis hier zijn kleiner, en de uitleg over weer en verhuizen staat nu in de help.' },
      },
      {
        game: 'idle-angler',
        title: 'Permits from the Dock, and a board that names its water',
        body: 'The next locked water on the Dock now links straight to its pass in the shop, with the price. Once your logbook has the species it needs, the line tells you the pass is all that is left. On the TRMNL screen, the weekly board now says which water it is for, such as This week at River Bend.',
        fr: { title: 'Les permis depuis le Ponton, et un tableau qui nomme son eau', body: 'Le prochain plan d’eau fermé sur le Ponton renvoie maintenant directement à son permis au magasin, avec le prix. Quand votre carnet compte les espèces demandées, la ligne indique qu’il ne manque plus que le permis. Sur l’écran TRMNL, le tableau de la semaine dit désormais de quelle eau il s’agit, par exemple Cette semaine au Méandre.' },
        de: { title: 'Karten vom Steg aus, und eine Tafel, die ihr Gewässer nennt', body: 'Das nächste gesperrte Gewässer am Steg verweist jetzt direkt auf seine Karte im Laden, mit Preis. Sobald dein Logbuch die nötigen Arten enthält, sagt die Zeile, dass nur noch die Karte fehlt. Auf dem TRMNL-Bildschirm nennt die Wochentafel jetzt ihr Gewässer, etwa Diese Woche an der Flussbiegung.' },
        es: { title: 'Permisos desde el Muelle, y un tablero que nombra su agua', body: 'La siguiente agua cerrada en el Muelle ahora enlaza directamente con su permiso en la tienda, con el precio. Cuando tu cuaderno tiene las especies necesarias, la línea indica que solo falta el permiso. En la pantalla TRMNL, el tablero semanal ahora dice a qué agua pertenece, por ejemplo Esta semana en el Recodo del río.' },
        it: { title: 'Permessi dal Pontile, e una classifica che nomina la sua acqua', body: 'La prossima acqua chiusa sul Pontile ora rimanda direttamente al suo permesso in negozio, con il prezzo. Quando il registro ha le specie richieste, la riga dice che manca solo il permesso. Sullo schermo TRMNL, la classifica della settimana ora indica a quale acqua si riferisce, per esempio Questa settimana all’Ansa del fiume.' },
        pt: { title: 'Licenças a partir do Píer, e um quadro que diz qual é a água', body: 'A próxima água fechada no Píer agora leva direto à sua licença na loja, com o preço. Quando o seu registro tem as espécies necessárias, a linha diz que só falta a licença. Na tela do TRMNL, o quadro da semana agora diz a qual água pertence, por exemplo Esta semana na Curva do rio.' },
        pl: { title: 'Przepustki z Pomostu i tablica, która nazywa swoje łowisko', body: 'Następne zamknięte łowisko na Pomoście prowadzi teraz prosto do swojej przepustki w sklepie, z ceną. Gdy rejestr ma już wymagane gatunki, wiersz mówi, że brakuje tylko przepustki. Na ekranie TRMNL tygodniowa tablica podaje teraz swoje łowisko, na przykład W tym tygodniu w Zakolu rzeki.' },
        nl: { title: 'Passen vanaf de Stek, en een bord dat zijn water noemt', body: 'Het volgende gesloten water op de Stek linkt nu rechtstreeks naar zijn pas in de winkel, met de prijs. Zodra je logboek de benodigde soorten heeft, zegt de regel dat alleen de pas nog ontbreekt. Op het TRMNL-scherm noemt het weekbord nu zijn water, bijvoorbeeld Deze week bij de Rivierbocht.' },
      },
    ],
  },
  {
    date: '2026-11-08',
    changes: [
      {
        game: 'idle-angler',
        title: "A clearer Dock and a safer cooler",
        body: "Idle Angler keeps its fishing setup and help when you are signed out. The Dock shows fishing status, a full cooler and missing bait before optional updates. Selected catches now have a sale bar that stays within reach, and bulk sales keep trophy-size fish unless you include them. Selling or using a trophy-size fish as bait asks first. Failed confirmations stay open so you can retry.",
        fr: { title: "Un Ponton plus clair et une glacière plus sûre", body: "Idle Angler garde ses explications et son aide à la connexion. Le Ponton montre l’état de la pêche, la glacière pleine et le manque d’appât avant les nouveautés. La barre de vente reste accessible pendant la sélection. Les ventes groupées conservent les poissons de taille trophée sauf si vous les incluez. Leur vente ou leur utilisation comme appât demande confirmation. Une confirmation échouée reste ouverte pour réessayer." },
        de: { title: "Ein übersichtlicherer Steg und eine sicherere Kühlbox", body: "Auch ohne Anmeldung zeigt Idle Angler seine eigene Einrichtung und Hilfe. Am Steg stehen Angelstatus, volle Kühlbox und fehlender Köder vor optionalen Neuigkeiten. Beim Auswählen bleibt die Verkaufsleiste erreichbar. Sammelverkäufe behalten Fische in Trophäengröße, solange du sie nicht einschließt. Vor ihrem Verkauf oder ihrer Verwendung als Köder wirst du gefragt. Fehlgeschlagene Bestätigungen bleiben zum erneuten Versuch offen." },
        es: { title: "Un Muelle más claro y una nevera más segura", body: "Idle Angler mantiene sus instrucciones y ayuda aunque no hayas iniciado sesión. El Muelle muestra el estado de pesca, la nevera llena y la falta de cebo antes de las novedades opcionales. La barra de venta sigue accesible al seleccionar capturas. Las ventas en lote conservan los peces de tamaño trofeo salvo que los incluyas. Venderlos o usarlos como cebo pide confirmación. Si una acción falla, la confirmación queda abierta para reintentar." },
        it: { title: "Un Pontile più chiaro e una ghiacciaia più sicura", body: "Idle Angler mantiene le proprie istruzioni e la propria guida anche senza accesso. Il Pontile mostra lo stato della pesca, la ghiacciaia piena e le esche mancanti prima delle novità facoltative. La barra di vendita resta accessibile durante la selezione. Le vendite in blocco conservano i pesci da trofeo se non li includi. Venderli o usarli come esca richiede conferma. Le conferme non riuscite restano aperte per riprovare." },
        pt: { title: "Um Píer mais claro e capturas mais protegidas", body: "O Idle Angler mantém suas próprias instruções e ajuda mesmo sem login. O Píer mostra o estado da pesca, a caixa térmica cheia e a falta de isca antes das novidades opcionais. A barra de venda fica acessível durante a seleção. Vendas em lote preservam peixes de tamanho troféu, a menos que você os inclua. Vendê-los ou usá-los como isca pede confirmação. Se uma ação falhar, a confirmação fica aberta para tentar de novo." },
        pl: { title: "Czytelniejszy Pomost i bezpieczniejsza chłodziarka", body: "Idle Angler pokazuje własne instrukcje i pomoc także bez logowania. Pomost wyświetla stan łowienia, pełną chłodziarkę i brak przynęty przed opcjonalnymi nowościami. Pasek sprzedaży pozostaje dostępny podczas wybierania ryb. Sprzedaż zbiorcza zachowuje ryby o rozmiarze trofeum, chyba że je uwzględnisz. Ich sprzedaż lub użycie jako przynęty wymaga potwierdzenia. Nieudane potwierdzenie pozostaje otwarte, aby można było spróbować ponownie." },
        nl: { title: "Een duidelijkere Stek en een veiligere koelbox", body: "Idle Angler houdt zijn eigen uitleg en hulp wanneer je niet bent ingelogd. De Stek toont de visstatus, een volle koelbox en ontbrekend aas vóór optionele updates. De verkoopbalk blijft bereikbaar tijdens het selecteren. Bij een gezamenlijke verkoop blijven vissen van trofeeformaat bewaard, tenzij je ze meeneemt. Verkopen of als aas gebruiken vraagt eerst om bevestiging. Mislukte bevestigingen blijven open om opnieuw te proberen." },
      },
      {
        game: 'idle-angler',
        title: 'Clear water around your catch',
        body: 'Held fish on the Dock now show the scenery through the gaps around their tails and fins, instead of pale patches.',
        fr: { title: 'Un décor visible autour de votre prise', body: 'Sur le Ponton, le décor reste désormais visible entre la queue et les nageoires du poisson tenu, à la place des taches pâles.' },
        de: { title: 'Freie Sicht rund um deinen Fang', body: 'Bei gehaltenen Fischen am Steg bleibt die Landschaft jetzt in den Lücken um Schwanz und Flossen sichtbar, statt heller Flecken.' },
        es: { title: 'El paisaje alrededor de tu captura', body: 'Los peces que sostienes en el Muelle ahora dejan ver el paisaje en los huecos alrededor de la cola y las aletas, en lugar de manchas claras.' },
        it: { title: 'Il paesaggio intorno alla tua cattura', body: 'I pesci tenuti sul Pontile ora lasciano vedere il paesaggio negli spazi intorno alla coda e alle pinne, al posto delle macchie chiare.' },
        pt: { title: 'O cenário ao redor da sua captura', body: 'Os peixes segurados no Píer agora mostram o cenário nos espaços ao redor da cauda e das barbatanas, em vez de manchas claras.' },
        pl: { title: 'Widok wokół twojej zdobyczy', body: 'Ryby trzymane na Pomoście pokazują teraz scenerię w przerwach wokół ogona i płetw zamiast jasnych plam.' },
        nl: { title: 'Vrij zicht rond je vangst', body: 'Bij vissen die je op de Stek vasthoudt, blijft het landschap nu zichtbaar in de openingen rond de staart en vinnen, in plaats van bleke vlekken.' },
      },
      {
        title: 'The dev log knows which game a change is for',
        body: 'Each change here is marked Desk Crawler or Idle Angler, or left unmarked when it is for everyone, and the page can show one game at a time. The Dock now has the same New since your last visit card as the Hero page, showing only the Idle Angler and site changes, and the Hero page’s card leaves out changes that are only about Idle Angler.',
        fr: { title: 'Le journal sait à quel jeu appartient un changement', body: 'Chaque changement est ici marqué Desk Crawler ou Idle Angler, ou laissé sans marque quand il concerne tout le monde, et la page peut n’afficher qu’un jeu à la fois. Le Ponton a maintenant la même carte Nouveau depuis votre dernière visite que la page Héros, avec seulement les changements d’Idle Angler et du site, et la carte de la page Héros laisse de côté ceux qui ne concernent qu’Idle Angler.' },
        de: { title: 'Das Änderungslog weiß, zu welchem Spiel eine Änderung gehört', body: 'Jede Änderung ist hier mit Desk Crawler oder Idle Angler markiert, oder ohne Markierung, wenn sie alle betrifft, und die Seite kann ein Spiel allein zeigen. Der Steg hat jetzt dieselbe Karte Neu seit deinem letzten Besuch wie die Helden-Seite, mit nur den Idle-Angler- und Website-Änderungen, und die Karte der Helden-Seite lässt Änderungen weg, die nur Idle Angler betreffen.' },
        es: { title: 'El registro sabe a qué juego pertenece cada cambio', body: 'Cada cambio aparece aquí marcado como Desk Crawler o Idle Angler, o sin marca cuando es para todos, y la página puede mostrar un solo juego. El Muelle tiene ahora la misma tarjeta Novedades desde tu última visita que la página Héroe, solo con los cambios de Idle Angler y del sitio, y la tarjeta de la página Héroe deja fuera los que son solo de Idle Angler.' },
        it: { title: 'Il registro sa a quale gioco appartiene una modifica', body: 'Ogni modifica è qui contrassegnata Desk Crawler o Idle Angler, o lasciata senza contrassegno quando riguarda tutti, e la pagina può mostrare un gioco alla volta. Il Pontile ha ora la stessa scheda Novità dalla tua ultima visita della pagina Eroe, con solo le modifiche di Idle Angler e del sito, e la scheda della pagina Eroe tralascia quelle che riguardano solo Idle Angler.' },
        pt: { title: 'O registro sabe a qual jogo cada mudança pertence', body: 'Cada mudança aparece aqui marcada como Desk Crawler ou Idle Angler, ou sem marca quando é para todos, e a página pode mostrar um jogo por vez. O Píer agora tem o mesmo cartão Novidades desde sua última visita da página Herói, só com as mudanças do Idle Angler e do site, e o cartão da página Herói deixa de fora as que são só do Idle Angler.' },
        pl: { title: 'Dziennik zmian wie, której gry dotyczy zmiana', body: 'Każda zmiana jest tu oznaczona jako Desk Crawler lub Idle Angler, albo bez oznaczenia, gdy dotyczy wszystkich, a strona może pokazywać jedną grę naraz. Pomost ma teraz tę samą kartę Nowe od ostatniej wizyty co strona Bohater, tylko ze zmianami Idle Angler i strony, a karta na stronie Bohater pomija zmiany dotyczące wyłącznie Idle Angler.' },
        nl: { title: 'Het logboek weet bij welk spel een wijziging hoort', body: 'Elke wijziging is hier gemarkeerd als Desk Crawler of Idle Angler, of ongemarkeerd als hij voor iedereen is, en de pagina kan één spel tegelijk tonen. De Stek heeft nu dezelfde kaart Nieuw sinds je laatste bezoek als de Heldpagina, met alleen de Idle Angler- en sitewijzigingen, en de kaart op de Heldpagina laat wijzigingen weg die alleen over Idle Angler gaan.' },
      },
      {
        title: 'Idle Angler is here',
        body: 'The second game on TRMNL Games is a fishing game. Every fifteen minutes your angler casts at one of six waters, and your TRMNL shows the catch, the weather and the week’s heaviest fish. Sell your catch, fill the fishmonger’s orders, enter the weekend Opens and mount your best fish on the wall. Install it from the TRMNL marketplace; it uses the same account as Desk Crawler. The anglers who tested it before the listing start again on the Millpond today.',
        fr: { title: 'Idle Angler est arrivé', body: 'Le deuxième jeu de TRMNL Games est un jeu de pêche. Toutes les quinze minutes, votre pêcheur lance sur l’un des six plans d’eau, et votre TRMNL montre la prise, la météo et les plus gros poissons de la semaine. Vendez vos prises, remplissez les commandes du poissonnier, participez aux Opens du week-end et montez vos plus beaux poissons au mur. Installez-le depuis la marketplace TRMNL ; il utilise le même compte que Desk Crawler. Les pêcheurs qui l’ont testé avant la sortie repartent aujourd’hui de l’Étang du moulin.' },
        de: { title: 'Idle Angler ist da', body: 'Das zweite Spiel auf TRMNL Games ist ein Angelspiel. Alle fünfzehn Minuten wirft dein Angler an einem von sechs Gewässern aus, und dein TRMNL zeigt den Fang, das Wetter und die schwersten Fische der Woche. Verkaufe deinen Fang, erfülle die Aufträge des Fischhändlers, nimm an den Wochenend-Opens teil und bring deine besten Fische an die Wand. Installiere es aus dem TRMNL-Marktplatz; es nutzt dasselbe Konto wie Desk Crawler. Die Angler, die es vor der Veröffentlichung getestet haben, fangen heute am Mühlteich neu an.' },
        es: { title: 'Ya está aquí Idle Angler', body: 'El segundo juego de TRMNL Games es de pesca. Cada quince minutos tu pescador lanza en una de seis aguas, y tu TRMNL muestra la captura, el tiempo y los peces más pesados de la semana. Vende tus capturas, cumple los pedidos del pescadero, participa en los Opens del fin de semana y cuelga tus mejores peces en la pared. Instálalo desde el marketplace de TRMNL; usa la misma cuenta que Desk Crawler. Los pescadores que lo probaron antes del lanzamiento empiezan hoy de nuevo en el Estanque del molino.' },
        it: { title: 'È arrivato Idle Angler', body: 'Il secondo gioco di TRMNL Games è un gioco di pesca. Ogni quindici minuti il tuo pescatore lancia in una di sei acque, e il tuo TRMNL mostra la cattura, il tempo e i pesci più pesanti della settimana. Vendi il pescato, evadi gli ordini del pescivendolo, partecipa agli Open del fine settimana e appendi i tuoi pesci migliori alla parete. Installalo dal marketplace di TRMNL; usa lo stesso account di Desk Crawler. I pescatori che l’hanno provato prima dell’uscita ricominciano oggi dallo Stagno del mulino.' },
        pt: { title: 'O Idle Angler chegou', body: 'O segundo jogo do TRMNL Games é de pesca. A cada quinze minutos seu pescador lança em uma de seis águas, e seu TRMNL mostra a captura, o tempo e os peixes mais pesados da semana. Venda suas capturas, atenda os pedidos do peixeiro, participe dos Opens de fim de semana e pendure seus melhores peixes na parede. Instale pelo marketplace do TRMNL; ele usa a mesma conta do Desk Crawler. Os pescadores que o testaram antes do lançamento recomeçam hoje no Lago do moinho.' },
        pl: { title: 'Idle Angler już jest', body: 'Druga gra w TRMNL Games to gra wędkarska. Co piętnaście minut twój wędkarz zarzuca na jednym z sześciu łowisk, a twój TRMNL pokazuje połów, pogodę i najcięższe ryby tygodnia. Sprzedawaj połów, realizuj zamówienia handlarza ryb, startuj w weekendowych zawodach Open i wieszaj najlepsze ryby na ścianie. Zainstaluj ją z marketplace’u TRMNL; używa tego samego konta co Desk Crawler. Wędkarze, którzy testowali ją przed premierą, zaczynają dziś od nowa nad Stawem młyńskim.' },
        nl: { title: 'Idle Angler is er', body: 'Het tweede spel op TRMNL Games is een visspel. Elk kwartier werpt je visser uit bij een van zes wateren, en je TRMNL toont de vangst, het weer en de zwaarste vissen van de week. Verkoop je vangst, lever de bestellingen van de visboer, doe mee aan de weekend-Opens en hang je mooiste vissen aan de wand. Installeer het vanuit de TRMNL-marketplace; het gebruikt hetzelfde account als Desk Crawler. De vissers die het vóór de lancering testten, beginnen vandaag opnieuw bij de Molenvijver.' },
      },
    ],
  },
  {
    date: '2026-11-07',
    changes: [
      {
        game: 'idle-angler',
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
        game: 'desk-crawler',
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
        game: 'desk-crawler',
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
]

/** A change's stable key: its day and its number within that day, counted from the day's first change. */
export const changeKey = (entry: ChangelogEntry, index: number) => `${entry.date}.${String(entry.changes.length - index).padStart(2, '0')}`

/** The day an entry went live, written out ("14 October 2026", "14 octobre 2026"), the same on the server and in every browser. */
export const changeDay = (date: string, year = true, locale: Locale = 'en') => new Date(`${date}T12:00:00Z`).toLocaleDateString(INTL_TAG[locale], { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' })

/** The newest `count` changes from the recent file, newest first, each with the day it went live and its key on the What's new page. */
export const latestChanges = (count: number, locale: Locale = 'en'): Array<{ key: string; date: string; title: string; body: string }> =>
  RECENT_CHANGES.flatMap((entry) => entry.changes.map((change, index) => ({ key: changeKey(entry, index), date: entry.date, ...changeIn(change, locale) }))).slice(0, count)
