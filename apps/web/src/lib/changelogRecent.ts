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
    date: '2026-11-24',
    changes: [
      {
        game: 'idle-angler',
        title: 'Your rosettes and medals on the shelf',
        body: 'The shelf on the Trophy wall page now lists each Open you entered: the fish, the water, your place and the medal it won, or that it is still under way. It shows as soon as the Opens do, before the wall itself opens, and the Dock links to it with your rosette and medal count. Your public page counts your rosettes too.',
        fr: { title: 'Vos rosettes et médailles sur l’étagère', body: 'L’étagère de la page Mur des trophées liste désormais chaque Open auquel vous avez participé : le poisson, le plan d’eau, votre place et la médaille gagnée, ou qu’il est encore en cours. Elle apparaît dès que les Opens s’ouvrent, avant le mur lui-même, et le Ponton y mène avec votre nombre de rosettes et de médailles. Votre page publique compte aussi vos rosettes.' },
        de: { title: 'Deine Rosetten und Medaillen im Regal', body: 'Das Regal auf der Seite Trophäenwand listet jetzt jedes Open, an dem du teilgenommen hast: den Fisch, das Gewässer, deinen Platz und die gewonnene Medaille, oder dass es noch läuft. Es erscheint, sobald die Opens freigeschaltet sind, noch vor der Wand, und der Steg verlinkt es mit der Zahl deiner Rosetten und Medaillen. Deine öffentliche Seite zählt jetzt auch deine Rosetten.' },
        es: { title: 'Tus escarapelas y medallas en la estantería', body: 'La estantería de la página Pared de trofeos ahora lista cada Open en el que participaste: el pez, el agua, tu puesto y la medalla ganada, o que aún está en curso. Aparece en cuanto se abren los Opens, antes que la propia pared, y el Muelle enlaza a ella con tu número de escarapelas y medallas. Tu página pública también cuenta tus escarapelas.' },
        it: { title: 'Le tue coccarde e medaglie sulla mensola', body: 'La mensola della pagina Parete dei trofei ora elenca ogni Open a cui hai partecipato: il pesce, l’acqua, il tuo posto e la medaglia vinta, o che è ancora in corso. Compare appena si aprono gli Open, prima della parete stessa, e il Pontile la collega con il numero di coccarde e medaglie. Anche la tua pagina pubblica conta le tue coccarde.' },
        pt: { title: 'Suas rosetas e medalhas na prateleira', body: 'A prateleira da página Parede de troféus agora lista cada Open de que você participou: o peixe, a água, sua posição e a medalha ganha, ou que ainda está em curso. Ela aparece assim que os Opens abrem, antes da própria parede, e o Píer leva até ela com o número de rosetas e medalhas. Sua página pública também conta suas rosetas.' },
        pl: { title: 'Twoje rozety i medale na półce', body: 'Półka na stronie Ściana trofeów pokazuje teraz każde zawody Open, w których brałeś udział: rybę, łowisko, miejsce i zdobyty medal albo to, że zawody wciąż trwają. Pojawia się razem z zawodami Open, jeszcze przed ścianą, a Pomost prowadzi do niej z liczbą rozet i medali. Twoja strona publiczna też pokazuje liczbę rozet.' },
        nl: { title: 'Je rozetten en medailles op de plank', body: 'De plank op de pagina Trofeeënwand toont nu elke Open waaraan je meedeed: de vis, het water, je plaats en de gewonnen medaille, of dat hij nog bezig is. Hij verschijnt zodra de Opens opengaan, nog voor de wand zelf, en de Stek linkt ernaar met je aantal rozetten en medailles. Je openbare pagina telt nu ook je rozetten.' },
      },
      {
        game: 'desk-crawler',
        title: 'See where you finished last week',
        body: 'From Monday the Hero page shows your hero\'s place on last week\'s board in its level group, its XP for the week and how it moved. A top three comes with confetti. Tap Nice to clear it.',
        fr: { title: 'Votre place la semaine dernière', body: 'Dès lundi, la page Héros montre la place de votre héros au classement de la semaine passée dans son groupe de niveau, son XP de la semaine et son évolution. Un top 3 arrive avec des confettis. Touchez Super pour fermer la carte.' },
        de: { title: 'So hast du letzte Woche abgeschnitten', body: 'Ab Montag zeigt die Seite Held den Platz deines Helden in der Rangliste der letzten Woche in seiner Stufengruppe, seine EP der Woche und wie er sich verändert hat. Die besten drei bekommen Konfetti. Tippe auf Schön, um die Karte zu schließen.' },
        es: { title: 'Tu puesto de la semana pasada', body: 'Desde el lunes, la página Héroe muestra el puesto de tu héroe en la clasificación de la semana pasada de su grupo de nivel, su XP de la semana y cuánto subió o bajó. Los tres primeros llevan confeti. Toca Genial para cerrar la tarjeta.' },
        it: { title: 'Dove sei arrivato la settimana scorsa', body: 'Da lunedì la pagina Eroe mostra il posto del tuo eroe nella classifica della settimana scorsa del suo gruppo di livello, i suoi XP della settimana e quanto è salito o sceso. I primi tre ricevono i coriandoli. Tocca Bello per chiudere la scheda.' },
        pt: { title: 'Sua posição na semana passada', body: 'A partir de segunda, a página Herói mostra a posição do seu herói no ranking da semana passada do grupo de nível, o XP da semana e quanto subiu ou desceu. Os três primeiros ganham confete. Toque em Legal para fechar o cartão.' },
        pl: { title: 'Twoje miejsce w zeszłym tygodniu', body: 'Od poniedziałku strona Bohater pokazuje miejsce bohatera w rankingu zeszłego tygodnia w jego grupie poziomów, jego PD z tygodnia i zmianę miejsca. Pierwsza trójka dostaje konfetti. Dotknij Super, aby zamknąć kartę.' },
        nl: { title: 'Zo eindigde je vorige week', body: 'Vanaf maandag toont de pagina Held de plaats van je held op de ranglijst van vorige week in zijn niveaugroep, zijn XP van die week en hoeveel hij steeg of zakte. Een top drie krijgt confetti. Tik op Mooi om de kaart te sluiten.' },
      },
      {
        game: 'desk-crawler',
        title: 'Your next sword is safe from Select all',
        body: 'Spares that beat what your hero wears are marked to keep. Select all and the one-tap sale for a full bag leave them in the bag, and the sale review names any you pick by hand. When the bag holds something better, the Hero page shows it with one Equip button.',
        fr: { title: 'Votre prochaine épée échappe à Tout sélectionner', body: 'Les pièces de rechange meilleures que celles que porte votre héros sont marquées à garder. Tout sélectionner et la vente en un geste d’un sac plein les laissent dans le sac, et le récapitulatif de vente nomme celles que vous choisissez vous-même. Quand le sac contient mieux, la page Héros le montre avec un seul bouton Équiper.' },
        de: { title: 'Dein nächstes Schwert ist vor Alle auswählen sicher', body: 'Ersatzstücke, die besser sind als das, was dein Held trägt, sind zum Behalten markiert. Alle auswählen und der Ein-Tipp-Verkauf bei voller Tasche lassen sie in der Tasche, und die Verkaufsübersicht nennt alle, die du selbst auswählst. Liegt etwas Besseres in der Tasche, zeigt die Seite Held es mit einem einzigen Anlegen-Knopf.' },
        es: { title: 'Tu próxima espada se salva de Elegir todo', body: 'Los repuestos mejores que lo que lleva tu héroe se marcan para guardar. Elegir todo y la venta de un toque con la bolsa llena los dejan en la bolsa, y el resumen de venta nombra los que elijas a mano. Cuando la bolsa tiene algo mejor, la página Héroe lo muestra con un solo botón Equipar.' },
        it: { title: 'La tua prossima spada è al sicuro da Scegli tutto', body: 'I ricambi migliori di quello che indossa il tuo eroe sono segnati da tenere. Scegli tutto e la vendita con un tocco a borsa piena li lasciano nella borsa, e il riepilogo di vendita nomina quelli che scegli a mano. Quando nella borsa c’è di meglio, la pagina Eroe lo mostra con un solo pulsante Equipaggia.' },
        pt: { title: 'Sua próxima espada fica a salvo do Escolher tudo', body: 'Peças de reserva melhores que as que seu herói usa ficam marcadas para guardar. Escolher tudo e a venda de um toque com a bolsa cheia as deixam na bolsa, e o resumo da venda nomeia as que você escolher à mão. Quando a bolsa tem algo melhor, a página Herói mostra com um único botão Equipar.' },
        pl: { title: 'Twój następny miecz jest bezpieczny przed Wybierz wszystko', body: 'Zapasowe przedmioty lepsze od tych, które nosi bohater, są oznaczone do zachowania. Wybierz wszystko i sprzedaż jednym dotknięciem przy pełnej torbie zostawiają je w torbie, a podsumowanie sprzedaży wymienia te wybrane ręcznie. Gdy w torbie jest coś lepszego, strona Bohater pokazuje to z jednym przyciskiem Załóż.' },
        nl: { title: 'Je volgende zwaard is veilig voor Alles kiezen', body: 'Reserves die beter zijn dan wat je held draagt, zijn gemarkeerd om te bewaren. Alles kiezen en de verkoop met één tik bij een volle tas laten ze in de tas, en het verkoopoverzicht noemt de stukken die je zelf kiest. Zit er iets beters in de tas, dan toont de pagina Held het met één knop Dragen.' },
      },
      {
        game: 'idle-angler',
        title: 'See how you did in the weekend Open',
        body: 'From Monday the Dock shows last weekend\'s Open results: your place, your fish and the winner\'s weight. A medal comes with its prize and confetti. Tap Nice to clear it.',
        fr: { title: 'Votre résultat à l’Open du week-end', body: 'Dès lundi, le Ponton montre les résultats de l’Open du week-end : votre place, votre poisson et le poids du gagnant. Une médaille arrive avec son prix et des confettis. Touchez Super pour fermer la carte.' },
        de: { title: 'So lief dein Wochenend-Open', body: 'Ab Montag zeigt der Steg die Ergebnisse des Opens vom Wochenende: deinen Platz, deinen Fisch und das Gewicht des Siegers. Eine Medaille kommt mit ihrem Preis und Konfetti. Tippe auf Schön, um die Karte zu schließen.' },
        es: { title: 'Tu resultado en el Open del fin de semana', body: 'Desde el lunes, el Muelle muestra los resultados del Open del fin de semana: tu puesto, tu pez y el peso del ganador. Una medalla llega con su premio y confeti. Toca Genial para cerrar la tarjeta.' },
        it: { title: 'Com’è andato il tuo Open del weekend', body: 'Da lunedì il Pontile mostra i risultati dell’Open del weekend: il tuo posto, il tuo pesce e il peso del vincitore. Una medaglia arriva con il suo premio e i coriandoli. Tocca Bello per chiudere la scheda.' },
        pt: { title: 'Seu resultado no Open do fim de semana', body: 'A partir de segunda, o Píer mostra os resultados do Open do fim de semana: sua posição, seu peixe e o peso do vencedor. Uma medalha vem com o prêmio e confete. Toque em Legal para fechar o cartão.' },
        pl: { title: 'Twój wynik w weekendowych zawodach Open', body: 'Od poniedziałku Pomost pokazuje wyniki zawodów Open z weekendu: twoje miejsce, twoją rybę i wagę zwycięzcy. Medal przychodzi z nagrodą i konfetti. Dotknij Super, aby zamknąć kartę.' },
        nl: { title: 'Zo deed je het in de weekend-Open', body: 'Vanaf maandag toont de Stek de uitslag van de Open van het weekend: je plaats, je vis en het gewicht van de winnaar. Een medaille komt met zijn prijs en confetti. Tik op Mooi om de kaart te sluiten.' },
      },
      {
        game: 'idle-angler',
        title: 'One fish of each kind on your trophy wall',
        body: 'Your wall now keeps the heaviest fish of each kind. A heavier one swaps in on the old one\'s peg, even when the wall is full, for the usual mounting price. In the cooler, a fish that would improve your wall is marked for your wall, and Sell all and the fishmonger leave it alone, so Hold is gone. A trophy-size fish that would not improve the wall says which heavier one beats it and sells like any other.',
        fr: { title: 'Un poisson de chaque espèce sur votre mur', body: 'Votre mur garde maintenant le poisson le plus lourd de chaque espèce. Un plus lourd prend le crochet de l’ancien, même quand le mur est plein, au prix habituel du montage. Dans la glacière, un poisson qui améliorerait votre mur est marqué pour votre mur, et Tout vendre comme le poissonnier le laissent de côté : le bouton Garder disparaît. Un poisson de taille trophée qui n’améliorerait pas le mur indique lequel, plus lourd, le bat, et se vend comme les autres.' },
        de: { title: 'Ein Fisch jeder Art an deiner Trophäenwand', body: 'Deine Wand hält jetzt den schwersten Fisch jeder Art. Ein schwererer kommt an den Haken des alten, auch wenn die Wand voll ist, zum üblichen Preis fürs Präparieren. In der Kühlbox ist ein Fisch, der deine Wand verbessern würde, mit für deine Wand markiert, und Alles verkaufen und der Fischhändler lassen ihn liegen; Behalten fällt deshalb weg. Ein Fisch in Trophäengröße, der die Wand nicht verbessern würde, zeigt, welcher schwerere ihn schlägt, und wird wie jeder andere verkauft.' },
        es: { title: 'Un pez de cada especie en tu pared de trofeos', body: 'Tu pared guarda ahora el pez más pesado de cada especie. Uno más pesado ocupa el gancho del anterior, aunque la pared esté llena, por el precio habitual de montaje. En la nevera, un pez que mejoraría tu pared aparece marcado para tu pared, y Vender todo y el pescadero no lo tocan, así que Guardar desaparece. Un pez de tamaño trofeo que no mejoraría la pared dice qué pez más pesado lo supera y se vende como cualquier otro.' },
        it: { title: 'Un pesce per specie sulla parete dei trofei', body: 'La tua parete ora tiene il pesce più pesante di ogni specie. Uno più pesante prende il gancio del vecchio, anche a parete piena, al solito prezzo di imbalsamazione. Nel frigo, un pesce che migliorerebbe la parete è segnato per la tua parete, e Vendi tutto e il pescivendolo lo lasciano stare, quindi Tieni non c’è più. Un pesce da trofeo che non migliorerebbe la parete dice quale pesce più pesante lo batte e si vende come gli altri.' },
        pt: { title: 'Um peixe de cada espécie na parede de troféus', body: 'Sua parede agora guarda o peixe mais pesado de cada espécie. Um mais pesado ocupa o gancho do antigo, mesmo com a parede cheia, pelo preço normal de empalhar. No cooler, um peixe que melhoraria sua parede vem marcado para sua parede, e Vender tudo e o peixeiro o deixam de lado, então o Guardar saiu. Um peixe de tamanho troféu que não melhoraria a parede mostra qual peixe mais pesado o supera e é vendido como qualquer outro.' },
        pl: { title: 'Jedna ryba każdego gatunku na ścianie trofeów', body: 'Ściana trzyma teraz najcięższą rybę każdego gatunku. Cięższa zajmuje haczyk poprzedniej, nawet gdy ściana jest pełna, za zwykłą cenę wypchania. W lodówce ryba, która poprawiłaby ścianę, ma znak na twoją ścianę, a Sprzedaj wszystko i handlarz ryb jej nie biorą, więc Zatrzymaj znika. Ryba trofeowej wielkości, która nie poprawiłaby ściany, pokazuje, która cięższa ją bije, i sprzedaje się jak każda inna.' },
        nl: { title: 'Eén vis van elke soort aan je trofeeënwand', body: 'Je wand houdt nu de zwaarste vis van elke soort. Een zwaardere neemt de haak van de oude over, ook als de wand vol is, voor de gewone prijs van opzetten. In de koelbox staat bij een vis die je wand zou verbeteren voor je wand, en Alles verkopen en de visboer laten hem liggen, dus Bewaren is weg. Een vis van trofeeformaat die de wand niet zou verbeteren, laat zien welke zwaardere hem verslaat en verkoopt als elke andere.' },
      },
    ],
  },
  {
    date: '2026-11-20',
    changes: [
      {
        game: 'idle-angler',
        title: 'Hold a trophy fish, and see if your wall has a bigger one',
        body: 'A trophy-size fish in the cooler now says whether the biggest of its kind on your wall is heavier, so you can sell it without a second thought, or whether it beats the one up there. Tap Hold to set a fish aside: it keeps its cooler slot, and no sale or fishmonger order takes it until you unhold it, so it can wait for the coins or a free peg. The trophy wall now lists the rarest fish first, then the heaviest.',
        fr: { title: 'Gardez un poisson trophée et comparez-le à votre mur', body: 'Un poisson de taille trophée dans la glacière indique désormais si le plus gros de son espèce sur votre mur est plus lourd, pour le vendre sans regret, ou s’il bat celui qui y est accroché. Touchez Garder pour le mettre de côté : il garde sa place dans la glacière, et aucune vente ni commande du poissonnier ne le prend tant que vous ne cessez pas de le garder ; il peut ainsi attendre les pièces ou un crochet libre. Le mur des trophées montre maintenant les poissons les plus rares d’abord, puis les plus lourds.' },
        de: { title: 'Trophäenfische behalten und mit der Wand vergleichen', body: 'Ein Fisch in Trophäengröße in der Kühlbox zeigt jetzt, ob der größte seiner Art an deiner Wand schwerer ist, damit du ihn ohne Reue verkaufen kannst, oder ob er den dort hängenden schlägt. Tippe auf Behalten, um einen Fisch beiseitezulegen: Er behält seinen Platz in der Kühlbox, und kein Verkauf und keine Bestellung des Fischhändlers nimmt ihn, bis du ihn freigibst. So kann er auf die Münzen oder einen freien Haken warten. Die Trophäenwand zeigt jetzt die seltensten Fische zuerst, dann die schwersten.' },
        es: { title: 'Guarda un pez trofeo y compáralo con tu pared', body: 'Un pez de tamaño trofeo en la nevera indica ahora si el mayor de su especie en tu pared pesa más, para venderlo sin remordimientos, o si supera al que está colgado. Toca Guardar para apartarlo: conserva su sitio en la nevera, y ninguna venta ni pedido del pescadero lo toma hasta que dejes de guardarlo, así puede esperar las monedas o un gancho libre. La pared de trofeos muestra ahora primero los peces más raros y luego los más pesados.' },
        it: { title: 'Tieni un pesce da trofeo e confrontalo con la parete', body: 'Un pesce da trofeo nel frigo ora dice se il più grande della sua specie sulla tua parete pesa di più, così puoi venderlo senza rimpianti, o se batte quello appeso. Tocca Tieni per metterlo da parte: conserva il suo posto nel frigo, e nessuna vendita né ordine del pescivendolo lo prende finché non smetti di tenerlo, così può aspettare le monete o un gancio libero. La parete dei trofei ora mostra prima i pesci più rari, poi i più pesanti.' },
        pt: { title: 'Guarde um peixe troféu e compare com a parede', body: 'Um peixe de tamanho troféu no cooler agora mostra se o maior da espécie na sua parede é mais pesado, para vender sem culpa, ou se ele supera o que está pendurado. Toque em Guardar para separá-lo: ele mantém a vaga no cooler, e nenhuma venda ou pedido do peixeiro o leva até você liberar, então ele pode esperar pelas moedas ou por um gancho livre. A parede de troféus agora mostra primeiro os peixes mais raros, depois os mais pesados.' },
        pl: { title: 'Zatrzymaj rybę trofeową i porównaj ją ze ścianą', body: 'Ryba trofeowej wielkości w lodówce pokazuje teraz, czy największa z jej gatunku na twojej ścianie jest cięższa, więc możesz ją sprzedać bez żalu, czy też bije tę, która wisi. Dotknij Zatrzymaj, aby ją odłożyć: zachowuje miejsce w lodówce, a żadna sprzedaż ani zamówienie handlarza ryb jej nie weźmie, dopóki jej nie odblokujesz, więc może poczekać na monety lub wolny haczyk. Ściana trofeów pokazuje teraz najpierw najrzadsze ryby, potem najcięższe.' },
        nl: { title: 'Bewaar een trofeevis en vergelijk hem met je wand', body: 'Een vis van trofeeformaat in de koelbox laat nu zien of de grootste van zijn soort aan je wand zwaarder is, zodat je hem zonder spijt verkoopt, of dat hij die aan de wand verslaat. Tik op Bewaren om hem apart te leggen: hij houdt zijn plek in de koelbox, en geen verkoop of bestelling van de visboer neemt hem tot je hem niet meer bewaart, zodat hij kan wachten op de munten of een vrije haak. De trofeeënwand toont nu eerst de zeldzaamste vissen, dan de zwaarste.' },
      },
    ],
  },
  {
    date: '2026-11-17',
    changes: [
      {
        game: 'idle-angler',
        title: 'Rarer fish rank higher',
        body: 'The weekly and all-time boards now put the rarest fish first: any epic beats any rare, and between two fish of the same rarity the heavier wins. Every row shows the fish and its rarity gem, in Rankings and on your TRMNL. All-time boards were rebuilt from your logbook; this week’s board keeps the fish already on it until something rarer or heavier lands. Weekend Opens are one fish each and still go by weight.',
        fr: { title: 'Les poissons rares passent devant', body: 'Les classements de la semaine et de tous les temps placent désormais le poisson le plus rare en tête : n’importe quel épique bat n’importe quel rare, et entre deux poissons de même rareté le plus lourd l’emporte. Chaque ligne montre le poisson et la gemme de sa rareté, dans Classements et sur votre TRMNL. Les classements de tous les temps ont été refaits à partir de votre carnet ; celui de la semaine garde les poissons déjà inscrits jusqu’à une prise plus rare ou plus lourde. Les Opens du week-end portent sur un seul poisson et se jouent toujours au poids.' },
        de: { title: 'Seltenere Fische liegen vorn', body: 'Die Wochen- und Allzeit-Ranglisten setzen jetzt den seltensten Fisch nach vorn: Jeder epische schlägt jeden seltenen, und bei gleicher Seltenheit gewinnt der schwerere. Jede Zeile zeigt den Fisch und den Edelstein seiner Seltenheit, in den Ranglisten und auf deinem TRMNL. Die Allzeit-Ranglisten wurden aus deinem Fangbuch neu aufgebaut; die Wochenrangliste behält die Fische, die schon darauf stehen, bis etwas Selteneres oder Schwereres anbeißt. Die Wochenend-Opens gelten einer Art und zählen weiter nach Gewicht.' },
        es: { title: 'Los peces más raros suben', body: 'Las clasificaciones semanales y de siempre ponen ahora primero el pez más raro: cualquier épico gana a cualquier raro, y entre dos de la misma rareza gana el más pesado. Cada fila muestra el pez y la gema de su rareza, en Clasificaciones y en tu TRMNL. Las clasificaciones de siempre se rehicieron a partir de tu cuaderno; la de esta semana conserva los peces que ya tiene hasta que entre uno más raro o más pesado. Los Opens del fin de semana son de un solo pez y siguen yendo por peso.' },
        it: { title: 'I pesci più rari salgono', body: 'Le classifiche della settimana e di sempre mettono ora davanti il pesce più raro: qualsiasi epico batte qualsiasi raro, e tra due della stessa rarità vince il più pesante. Ogni riga mostra il pesce e la gemma della sua rarità, in Classifiche e sul tuo TRMNL. Le classifiche di sempre sono state rifatte dal tuo diario; quella della settimana tiene i pesci già presenti finché non arriva qualcosa di più raro o più pesante. Gli Open del weekend sono per un solo pesce e contano ancora il peso.' },
        pt: { title: 'Peixes mais raros sobem', body: 'Os rankings da semana e de todos os tempos agora colocam o peixe mais raro na frente: qualquer épico vence qualquer raro, e entre dois da mesma raridade vence o mais pesado. Cada linha mostra o peixe e a gema da sua raridade, nos Rankings e no seu TRMNL. Os rankings de todos os tempos foram refeitos a partir do seu diário; o da semana mantém os peixes que já estão nele até entrar um mais raro ou mais pesado. Os Opens do fim de semana são de um peixe só e continuam valendo pelo peso.' },
        pl: { title: 'Rzadsze ryby wyżej', body: 'Rankingi tygodniowe i wszech czasów stawiają teraz najrzadszą rybę na czele: każda epicka bije każdą rzadką, a z dwóch ryb tej samej rzadkości wygrywa cięższa. Każdy wiersz pokazuje rybę i klejnot jej rzadkości, w Rankingach i na twoim TRMNL. Rankingi wszech czasów odbudowano z twojego dziennika; tygodniowy zachowuje ryby, które już w nim są, dopóki nie trafi się rzadsza lub cięższa. Weekendowe zawody Open dotyczą jednej ryby i nadal liczy się waga.' },
        nl: { title: 'Zeldzamere vissen staan hoger', body: 'De week- en recordranglijsten zetten nu de zeldzaamste vis vooraan: elke epische vis verslaat elke zeldzame, en tussen twee van dezelfde zeldzaamheid wint de zwaarste. Elke rij toont de vis en het edelsteentje van zijn zeldzaamheid, in Ranglijsten en op je TRMNL. De recordranglijsten zijn opnieuw opgebouwd uit je logboek; die van deze week houdt de vissen die er al op staan tot er iets zeldzamers of zwaarders bijt. De weekend-Opens gaan om één vis en tellen nog steeds op gewicht.' },
      },
      {
        title: 'New to you, near the top',
        body: 'The card that lists changes on the Hero page and the Dock is now called New to you, because it shows what you have not seen yet rather than what changed since your last visit. It sits near the top of the page; tap Nice, or open the changes, and it stays away until something else is added. What’s new is always on the More tab in both games.',
        fr: { title: 'Nouveau pour vous, en haut de page', body: 'La carte qui liste les changements sur la page Héros et le Ponton s’appelle désormais Nouveau pour vous, car elle montre ce que vous n’avez pas encore vu, et non ce qui a changé depuis votre dernière visite. Elle se trouve en haut de la page ; touchez Super, ou ouvrez les changements, et elle disparaît jusqu’au prochain ajout. Les nouveautés restent toujours dans l’onglet Plus des deux jeux.' },
        de: { title: 'Neu für dich, weiter oben', body: 'Die Karte mit den Änderungen auf der Heldenseite und am Steg heißt jetzt Neu für dich, weil sie zeigt, was du noch nicht gesehen hast, und nicht, was sich seit deinem letzten Besuch geändert hat. Sie steht weit oben auf der Seite; tippe auf Super oder öffne die Änderungen, und sie bleibt weg, bis etwas Neues dazukommt. Die Neuigkeiten findest du in beiden Spielen immer im Tab Mehr.' },
        es: { title: 'Nuevo para ti, más arriba', body: 'La tarjeta que lista los cambios en la página del héroe y en el Muelle ahora se llama Nuevo para ti, porque muestra lo que aún no has visto y no lo que cambió desde tu última visita. Está cerca de la parte superior; toca Genial o abre los cambios y no volverá hasta que haya algo nuevo. Las novedades siguen siempre en la pestaña Más de los dos juegos.' },
        it: { title: 'Novità per te, più in alto', body: 'La scheda che elenca le modifiche nella pagina dell’eroe e al Pontile ora si chiama Novità per te, perché mostra ciò che non hai ancora visto e non ciò che è cambiato dalla tua ultima visita. Sta in cima alla pagina; tocca Bello, o apri le modifiche, e non torna finché non arriva qualcosa di nuovo. Le novità restano sempre nella scheda Altro di entrambi i giochi.' },
        pt: { title: 'Novo para você, mais no alto', body: 'O cartão que lista as mudanças na página do herói e no Píer agora se chama Novo para você, porque mostra o que você ainda não viu, e não o que mudou desde sua última visita. Ele fica perto do topo da página; toque em Legal, ou abra as mudanças, e ele some até algo novo chegar. As novidades continuam sempre na aba Mais dos dois jogos.' },
        pl: { title: 'Nowe dla ciebie, wyżej na stronie', body: 'Karta z listą zmian na stronie bohatera i na Pomoście nazywa się teraz Nowe dla ciebie, bo pokazuje to, czego jeszcze nie widziałeś, a nie to, co zmieniło się od ostatniej wizyty. Jest blisko góry strony; dotknij Super albo otwórz zmiany, a zniknie do następnej nowości. Nowości są zawsze w karcie Więcej w obu grach.' },
        nl: { title: 'Nieuw voor jou, bovenaan', body: 'De kaart met de wijzigingen op de heldenpagina en de Stek heet nu Nieuw voor jou, omdat ze toont wat je nog niet hebt gezien en niet wat er sinds je laatste bezoek is veranderd. Ze staat bovenaan de pagina; tik op Top of open de wijzigingen, en ze blijft weg tot er iets nieuws bij komt. Wat is er nieuw staat altijd op het tabblad Meer in beide games.' },
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
