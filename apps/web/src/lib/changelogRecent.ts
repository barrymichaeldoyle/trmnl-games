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
    date: '2026-11-10',
    changes: [
      {
        game: 'desk-crawler',
        title: 'The +3 goal waits at the end of the ladder',
        body: 'Reinforce an item to +3 is now the last career goal, after the Archive, the Parking Garage, the Gym Duffel and a dug-in elite, so a hero that has done those sees them celebrated instead of waiting on 12,000 gold. Two new goals, Reach level 20 and Reach level 24, come before it. A goal you already reached stays done wherever it now sits.',
        fr: { title: 'L’objectif +3 attend au bout de l’échelle', body: 'Renforcez un objet jusqu’à +3 est désormais le dernier objectif de carrière, après les Archives, le Parking souterrain, le Sac de sport et une élite retranchée : un héros qui les a déjà accomplis les voit célébrés au lieu d’attendre 12 000 pièces d’or. Deux nouveaux objectifs, Atteignez le niveau 20 et Atteignez le niveau 24, le précèdent. Un objectif déjà atteint reste acquis, où qu’il se trouve désormais.' },
        de: { title: 'Das +3-Ziel wartet am Ende der Leiter', body: 'Verstärke einen Gegenstand auf +3 ist jetzt das letzte Karriereziel, nach dem Archiv, der Tiefgarage, der Sporttasche und einer eingegrabenen Elite: Ein Held, der das schon geschafft hat, sieht es gefeiert, statt auf 12.000 Gold zu warten. Zwei neue Ziele, Erreiche Stufe 20 und Erreiche Stufe 24, kommen davor. Ein schon erreichtes Ziel bleibt erledigt, wo immer es jetzt steht.' },
        es: { title: 'La meta +3 espera al final de la escalera', body: 'Refuerza un objeto hasta +3 es ahora la última meta de carrera, después del Archivo, el Aparcamiento subterráneo, la Bolsa de deporte y una élite atrincherada: un héroe que ya las ha hecho las ve celebradas en vez de esperar 12.000 de oro. Dos metas nuevas, Llega al nivel 20 y Llega al nivel 24, van antes. Una meta ya alcanzada sigue hecha, esté donde esté ahora.' },
        it: { title: 'L’obiettivo +3 aspetta in fondo alla scala', body: 'Rinforza un oggetto fino a +3 è ora l’ultimo obiettivo di carriera, dopo l’Archivio, il Parcheggio sotterraneo, il Borsone da palestra e un’élite trincerata: un eroe che li ha già fatti li vede festeggiati invece di aspettare 12.000 monete. Due nuovi obiettivi, Raggiungi il livello 20 e Raggiungi il livello 24, vengono prima. Un obiettivo già raggiunto resta fatto, ovunque si trovi ora.' },
        pt: { title: 'A meta +3 espera no fim da escada', body: 'Reforce um item até +3 agora é a última meta de carreira, depois do Arquivo, do Estacionamento subterrâneo, da Bolsa de academia e de uma elite entrincheirada: um herói que já fez tudo isso vê essas metas celebradas em vez de esperar 12.000 de ouro. Duas metas novas, Chegue ao nível 20 e Chegue ao nível 24, vêm antes. Uma meta já alcançada continua feita, onde quer que esteja agora.' },
        pl: { title: 'Cel +3 czeka na końcu drabiny', body: 'Wzmocnij przedmiot do +3 jest teraz ostatnim celem kariery, po Archiwum, Parkingu podziemnym, Torbie sportowej i okopanej elicie: bohater, który już to zrobił, widzi te cele uczczone, zamiast czekać na 12 000 złota. Dwa nowe cele, Osiągnij poziom 20 i Osiągnij poziom 24, stoją przed nim. Cel już osiągnięty pozostaje zaliczony, gdziekolwiek teraz stoi.' },
        nl: { title: 'Het +3-doel wacht aan het einde van de ladder', body: 'Versterk een voorwerp tot +3 is nu het laatste carrièredoel, na het Archief, de Parkeergarage, de Sporttas en een ingegraven elite: een held die dat al heeft gedaan ziet het gevierd in plaats van te wachten op 12.000 goud. Twee nieuwe doelen, Bereik niveau 20 en Bereik niveau 24, komen ervoor. Een doel dat je al had bereikt blijft behaald, waar het nu ook staat.' },
      },
    ],
  },
  {
    date: '2026-11-09',
    changes: [
      {
        game: 'idle-angler',
        title: 'The Dock, shop and screen know the same things',
        body: 'The Dock scene links to On your TRMNL. The shop names any open water you hold no bait for, above the tubs. A locked water now says which species are still to log at the water that opens it, not just how many. On the TRMNL screen, the weekly board says the day it starts again.',
        fr: { title: 'Le Ponton, le magasin et l’écran savent les mêmes choses', body: 'La scène du Ponton renvoie à Sur votre TRMNL. Le magasin nomme, au-dessus des pots, tout plan d’eau ouvert pour lequel vous n’avez pas d’appât. Un plan d’eau fermé dit désormais quelles espèces restent à noter sur celui qui l’ouvre, pas seulement combien. Sur l’écran TRMNL, le tableau de la semaine indique le jour où il repart.' },
        de: { title: 'Steg, Laden und Bildschirm wissen dasselbe', body: 'Die Szene am Steg verweist auf Auf deinem TRMNL. Der Laden nennt über den Dosen jedes offene Gewässer, für das du keinen Köder hast. Ein gesperrtes Gewässer sagt jetzt, welche Arten am Gewässer davor noch fehlen, nicht nur wie viele. Auf dem TRMNL-Bildschirm nennt die Wochentafel den Tag, an dem sie neu beginnt.' },
        es: { title: 'El Muelle, la tienda y la pantalla saben lo mismo', body: 'La escena del Muelle enlaza con En tu TRMNL. La tienda nombra, encima de los botes, cualquier agua abierta para la que no tienes cebo. Un agua cerrada ahora dice qué especies faltan por anotar en la que la abre, no solo cuántas. En la pantalla TRMNL, el tablero semanal dice el día en que vuelve a empezar.' },
        it: { title: 'Pontile, negozio e schermo sanno le stesse cose', body: 'La scena del Pontile rimanda a Sul tuo TRMNL. Il negozio nomina, sopra i barattoli, ogni acqua aperta per cui non hai esche. Un’acqua chiusa ora dice quali specie restano da registrare in quella che la apre, non solo quante. Sullo schermo TRMNL, la classifica della settimana indica il giorno in cui ricomincia.' },
        pt: { title: 'O Píer, a loja e a tela sabem as mesmas coisas', body: 'A cena do Píer leva a No seu TRMNL. A loja nomeia, acima dos potes, qualquer água aberta para a qual você não tem isca. Uma água fechada agora diz quais espécies faltam registrar na água que a abre, não só quantas. Na tela do TRMNL, o quadro da semana diz o dia em que recomeça.' },
        pl: { title: 'Pomost, sklep i ekran wiedzą to samo', body: 'Scena na Pomoście prowadzi do Na twoim TRMNL. Sklep wymienia nad pojemnikami każde otwarte łowisko, na które nie masz przynęty. Zamknięte łowisko mówi teraz, których gatunków brakuje jeszcze na łowisku, które je otwiera, a nie tylko ilu. Na ekranie TRMNL tygodniowa tablica podaje dzień, w którym zaczyna się od nowa.' },
        nl: { title: 'De Stek, de winkel en het scherm weten hetzelfde', body: 'De scène op de Stek linkt naar Op je TRMNL. De winkel noemt boven de potjes elk open water waarvoor je geen aas hebt. Een gesloten water zegt nu welke soorten je nog moet loggen bij het water dat het opent, niet alleen hoeveel. Op het TRMNL-scherm noemt het weekbord de dag waarop het opnieuw begint.' },
      },
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
]

/** A change's stable key: its day and its number within that day, counted from the day's first change. */
export const changeKey = (entry: ChangelogEntry, index: number) => `${entry.date}.${String(entry.changes.length - index).padStart(2, '0')}`

/** The day an entry went live, written out ("14 October 2026", "14 octobre 2026"), the same on the server and in every browser. */
export const changeDay = (date: string, year = true, locale: Locale = 'en') => new Date(`${date}T12:00:00Z`).toLocaleDateString(INTL_TAG[locale], { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' })

/** The newest `count` changes from the recent file, newest first, each with the day it went live and its key on the What's new page. */
export const latestChanges = (count: number, locale: Locale = 'en'): Array<{ key: string; date: string; title: string; body: string }> =>
  RECENT_CHANGES.flatMap((entry) => entry.changes.map((change, index) => ({ key: changeKey(entry, index), date: entry.date, ...changeIn(change, locale) }))).slice(0, count)
