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
  {
    date: '2026-11-15',
    changes: [
      {
        game: 'idle-angler',
        title: 'Your TRMNL names the weekend Open',
        body: 'From Monday to Friday your TRMNL’s stories start with the coming weekend Open at your water: the target fish and the bait it takes, so you can stock up before Saturday.',
        fr: { title: 'Votre TRMNL annonce l’Open du week-end', body: 'Du lundi au vendredi, les histoires de votre TRMNL commencent par l’Open du week-end à venir sur votre plan d’eau : le poisson cible et l’appât qu’il prend, pour faire vos réserves avant samedi.' },
        de: { title: 'Dein TRMNL nennt das Wochenend-Open', body: 'Von Montag bis Freitag beginnen die Geschichten auf deinem TRMNL mit dem kommenden Wochenend-Open an deinem Gewässer: dem Zielfisch und dem Köder, auf den er beißt, damit du dich vor Samstag eindecken kannst.' },
        es: { title: 'Tu TRMNL anuncia el Open del fin de semana', body: 'De lunes a viernes, las historias de tu TRMNL empiezan con el próximo Open de tu agua: el pez objetivo y el cebo que acepta, para que te abastezcas antes del sábado.' },
        it: { title: 'Il tuo TRMNL annuncia l’Open del weekend', body: 'Dal lunedì al venerdì le storie del tuo TRMNL iniziano con il prossimo Open della tua acqua: il pesce bersaglio e l’esca che prende, così puoi rifornirti prima di sabato.' },
        pt: { title: 'Seu TRMNL anuncia o Open do fim de semana', body: 'De segunda a sexta, as histórias do seu TRMNL começam com o próximo Open da sua água: o peixe-alvo e a isca que ele aceita, para você se abastecer antes de sábado.' },
        pl: { title: 'Twój TRMNL zapowiada weekendowy Open', body: 'Od poniedziałku do piątku historie na twoim TRMNL zaczynają się od nadchodzących zawodów Open na twoim łowisku: ryby docelowej i przynęty, na którą bierze, żebyś zdążył się zaopatrzyć przed sobotą.' },
        nl: { title: 'Je TRMNL noemt de weekend-Open', body: 'Van maandag tot vrijdag beginnen de verhalen op je TRMNL met de komende weekend-Open op je water: de doelvis en het aas waarop hij bijt, zodat je vóór zaterdag kunt inslaan.' },
      },
      {
        game: 'idle-angler',
        title: 'The weekend Open, named from Monday',
        body: 'The Dock now shows the weekend Open at your water all week: the target fish, when it runs and the bait and hours it bites at, with a warning if you have none of that bait. During the weekend it adds your place. Rankings puts the Opens first and has an Open tab with each water’s full board, and your TRMNL shows your water’s Open board in place of the week’s from Saturday to Sunday night. The logbook opens on the water you fish, with the others folded away until you tap them.',
        fr: { title: 'L’Open du week-end, annoncé dès le lundi', body: 'Le Ponton affiche maintenant toute la semaine l’Open de votre plan d’eau : le poisson cible, ses horaires, l’appât et les heures où il mord, avec un avertissement si vous n’avez pas cet appât. Le week-end, il ajoute votre place. Les Classements mettent les Opens en premier avec un onglet Open qui montre le classement complet de chaque plan d’eau, et votre TRMNL affiche le classement de l’Open de votre plan d’eau à la place de celui de la semaine, du samedi au dimanche soir. Le carnet s’ouvre sur le plan d’eau où vous pêchez, les autres repliés jusqu’à ce que vous les touchiez.' },
        de: { title: 'Das Wochenend-Open, ab Montag angekündigt', body: 'Der Steg zeigt jetzt die ganze Woche das Open an deinem Gewässer: den Zielfisch, wann es läuft und auf welchen Köder und zu welchen Zeiten er beißt, mit einem Hinweis, wenn dir dieser Köder fehlt. Am Wochenende kommt dein Platz dazu. Die Ranglisten zeigen die Opens zuerst und haben einen Open-Reiter mit der vollen Rangliste jedes Gewässers, und dein TRMNL zeigt von Samstag bis Sonntagnacht die Open-Rangliste deines Gewässers statt der Wochenrangliste. Das Buch öffnet sich beim Gewässer, an dem du angelst; die anderen bleiben eingeklappt, bis du sie antippst.' },
        es: { title: 'El Open del fin de semana, anunciado desde el lunes', body: 'El Muelle muestra ahora toda la semana el Open de tu agua: el pez objetivo, cuándo se celebra y el cebo y las horas en que pica, con un aviso si no tienes ese cebo. El fin de semana añade tu puesto. Clasificaciones pone los Opens primero y tiene una pestaña Open con la clasificación completa de cada agua, y tu TRMNL muestra la clasificación del Open de tu agua en lugar de la semanal del sábado al domingo por la noche. El diario se abre en el agua donde pescas, con las demás plegadas hasta que las toques.' },
        it: { title: 'L’Open del weekend, annunciato dal lunedì', body: 'Il Pontile ora mostra per tutta la settimana l’Open della tua acqua: il pesce bersaglio, quando si svolge e l’esca e le ore in cui abbocca, con un avviso se non hai quell’esca. Nel weekend aggiunge il tuo posto. Le Classifiche mettono gli Open per primi con una scheda Open che mostra la classifica completa di ogni acqua, e il tuo TRMNL mostra la classifica dell’Open della tua acqua al posto di quella settimanale dal sabato alla domenica sera. Il diario si apre sull’acqua dove peschi, con le altre chiuse finché non le tocchi.' },
        pt: { title: 'O Open do fim de semana, anunciado desde segunda', body: 'O Píer agora mostra a semana toda o Open da sua água: o peixe-alvo, quando acontece e a isca e os horários em que morde, com um aviso se você não tiver essa isca. No fim de semana ele mostra também a sua posição. Rankings põe os Opens primeiro e tem uma aba Open com a classificação completa de cada água, e seu TRMNL mostra a classificação do Open da sua água no lugar da semanal de sábado a domingo à noite. O diário abre na água onde você pesca, com as outras recolhidas até você tocar nelas.' },
        pl: { title: 'Weekendowy Open, ogłaszany od poniedziałku', body: 'Pomost pokazuje teraz przez cały tydzień zawody Open na twoim łowisku: rybę docelową, kiedy trwają oraz przynętę i porę, kiedy bierze, z ostrzeżeniem, jeśli nie masz tej przynęty. W weekend dochodzi twoje miejsce. Rankingi pokazują Openy na początku i mają kartę Open z pełnym rankingiem każdego łowiska, a twój TRMNL od soboty do niedzieli wieczorem pokazuje ranking Open twojego łowiska zamiast tygodniowego. Wpisy otwierają się na łowisku, na którym łowisz; pozostałe są zwinięte, dopóki ich nie dotkniesz.' },
        nl: { title: 'De weekend-Open, al vanaf maandag bekend', body: 'De Stek toont nu de hele week de Open op je water: de doelvis, wanneer hij loopt en op welk aas en welke uren hij bijt, met een waarschuwing als je dat aas niet hebt. In het weekend komt je plaats erbij. Ranglijsten zet de Opens bovenaan en heeft een tab Open met de volledige ranglijst van elk water, en je TRMNL toont van zaterdag tot zondagavond de Open-ranglijst van je water in plaats van die van de week. Het logboek opent bij het water waar je vist; de andere blijven ingeklapt tot je erop tikt.' },
      },
      {
        game: 'desk-crawler',
        title: 'Achievements say how you earned them',
        body: 'Every achievement badge now says what your hero did to earn it, such as Defeat 25 Paper Imps or Reach level 12, under its name on the shelf, in its details and when it is new. Its details also show what the next tier asks for, beside the progress bar.',
        fr: { title: 'Les succès disent comment vous les avez obtenus', body: 'Chaque badge de succès indique maintenant ce que votre héros a fait pour l’obtenir, comme Vaincre 25 Diablotins de papier ou Atteindre le niveau 12, sous son nom sur l’étagère, dans son détail et quand il est nouveau. Le détail montre aussi ce que demande le palier suivant, à côté de la barre de progression.' },
        de: { title: 'Erfolge sagen, wie du sie verdient hast', body: 'Jedes Erfolgsabzeichen sagt jetzt, was dein Held dafür getan hat, etwa Besiege 25 Papierkobolde oder Erreiche Stufe 12: unter seinem Namen im Regal, in seinen Details und wenn es neu ist. Die Details zeigen neben dem Fortschrittsbalken auch, was der nächste Grad verlangt.' },
        es: { title: 'Los logros dicen cómo los conseguiste', body: 'Cada insignia de logro dice ahora qué hizo tu héroe para conseguirla, como Derrotar a 25 Diablillos de papel o Llegar al nivel 12, bajo su nombre en la estantería, en sus detalles y cuando es nueva. Los detalles también muestran qué pide el siguiente nivel, junto a la barra de progreso.' },
        it: { title: 'Gli obiettivi dicono come li hai ottenuti', body: 'Ogni distintivo ora dice cosa ha fatto il tuo eroe per ottenerlo, come Sconfiggere 25 Diavoletti di carta o Raggiungere il livello 12, sotto il nome sullo scaffale, nei dettagli e quando è nuovo. I dettagli mostrano anche cosa chiede il grado successivo, accanto alla barra di avanzamento.' },
        pt: { title: 'As conquistas dizem como você as ganhou', body: 'Cada emblema de conquista agora diz o que seu herói fez para ganhá-lo, como Derrotar 25 Diabretes de papel ou Chegar ao nível 12, sob o nome na prateleira, nos detalhes e quando é novo. Os detalhes também mostram o que o próximo nível pede, ao lado da barra de progresso.' },
        pl: { title: 'Osiągnięcia mówią, skąd się wzięły', body: 'Każda odznaka osiągnięcia mówi teraz, co zrobił twój bohater, żeby ją zdobyć, na przykład Pokonaj: Papierowe chochliki (25×) albo Osiągnij poziom 12: pod nazwą na półce, w szczegółach i gdy jest nowa. Szczegóły pokazują też, czego wymaga następny stopień, obok paska postępu.' },
        nl: { title: 'Prestaties zeggen hoe je ze verdiende', body: 'Elke prestatiebadge zegt nu wat je held ervoor deed, zoals Versla 25 Papierduiveltjes of Bereik niveau 12: onder de naam op de plank, in de details en als hij nieuw is. De details tonen naast de voortgangsbalk ook wat de volgende trede vraagt.' },
      },
      {
        game: 'idle-angler',
        title: 'The fly code fits at the largest screen sizes',
        body: 'With your TRMNL set to its largest text, a long word before the fly code (Fliege in German) pushed the code off the edge of narrow layouts and cut its last digits in the title bar. The code now moves to its own line beside the QR code, and the title bar shows the digits alone when the word will not fit.',
        fr: { title: 'Le code mouche tient aux plus grandes tailles d’écran', body: 'Avec votre TRMNL réglé sur son plus grand texte, un mot long devant le code mouche (Fliege en allemand) poussait le code hors des mises en page étroites et coupait ses derniers chiffres dans la barre de titre. Le code passe maintenant sur sa propre ligne à côté du QR code, et la barre de titre n’affiche que les chiffres quand le mot ne tient pas.' },
        de: { title: 'Der Fliegencode passt auch bei den größten Bildschirmgrößen', body: 'War dein TRMNL auf die größte Schrift eingestellt, schob das Wort Fliege den Code in schmalen Layouts über den Rand und schnitt in der Titelleiste die letzten Ziffern ab. Der Code rückt jetzt neben dem QR-Code in eine eigene Zeile, und die Titelleiste zeigt nur die Ziffern, wenn das Wort nicht passt.' },
        es: { title: 'El código de la mosca cabe en los tamaños de pantalla más grandes', body: 'Con tu TRMNL en su texto más grande, una palabra larga delante del código de la mosca (Fliege en alemán) empujaba el código fuera del borde en los diseños estrechos y cortaba sus últimas cifras en la barra de título. El código pasa ahora a su propia línea junto al código QR, y la barra de título muestra solo las cifras cuando la palabra no cabe.' },
        it: { title: 'Il codice della mosca entra anche alle dimensioni più grandi', body: 'Con il TRMNL impostato sul testo più grande, una parola lunga prima del codice della mosca (Fliege in tedesco) spingeva il codice oltre il bordo nei layout stretti e ne tagliava le ultime cifre nella barra del titolo. Ora il codice va su una riga sua accanto al codice QR, e la barra del titolo mostra solo le cifre quando la parola non ci sta.' },
        pt: { title: 'O código da mosca cabe nos maiores tamanhos de tela', body: 'Com o TRMNL no maior tamanho de texto, uma palavra longa antes do código da mosca (Fliege em alemão) empurrava o código para fora da borda nos layouts estreitos e cortava seus últimos dígitos na barra de título. O código agora vai para uma linha própria ao lado do QR code, e a barra de título mostra só os dígitos quando a palavra não cabe.' },
        pl: { title: 'Kod muchy mieści się przy największych rozmiarach ekranu', body: 'Gdy TRMNL miał ustawiony największy tekst, długie słowo przed kodem muchy (Fliege po niemiecku) wypychało kod poza krawędź wąskich układów i ucinało jego ostatnie cyfry na pasku tytułu. Kod przechodzi teraz do osobnej linii obok kodu QR, a pasek tytułu pokazuje same cyfry, gdy słowo się nie mieści.' },
        nl: { title: 'De vliegcode past ook bij de grootste schermformaten', body: 'Stond je TRMNL op de grootste tekst, dan duwde een lang woord voor de vliegcode (Fliege in het Duits) de code in smalle indelingen over de rand en sneed de titelbalk de laatste cijfers af. De code gaat nu op een eigen regel naast de QR-code, en de titelbalk toont alleen de cijfers als het woord niet past.' },
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
