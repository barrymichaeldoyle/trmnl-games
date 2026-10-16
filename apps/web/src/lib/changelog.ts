import { INTL_TAG, type Locale } from '@trmnl-games/platform'
/**
 * The public dev log (D153), newest first: changes players can see, in their words, dated by the day they went live.
 * Add an entry in the same commit as the change it describes, with its French and German. No decision numbers or internal names. A later change on
 * the same day goes first in that day's list, so each change keeps its key (see `changeKeys`).
 */
/** One change in English, with its French and German (D169): an entry without them fails the typecheck. */
export interface Change {
  readonly title: string
  readonly body: string
  readonly fr: { readonly title: string; readonly body: string }
  readonly de: { readonly title: string; readonly body: string }
}

export interface ChangelogEntry {
  /** The day it went live, as YYYY-MM-DD. */
  readonly date: string
  readonly changes: ReadonlyArray<Change>
}

/** A change's title and body in the reader's language. */
export const changeIn = (change: Change, locale: Locale): { title: string; body: string } => (locale === 'en' ? change : change[locale])

export const CHANGELOG: ReadonlyArray<ChangelogEntry> = [
  {
    date: '2026-10-16',
    changes: [
      {
        title: 'More room for portrait adventures',
        body: 'On full-screen portrait displays, the event log uses the whole width. Your goal and today’s tasks sit together below it, beside a compact leaderboard that keeps your own row in view. Available on TRMNL X. On both X and OG portrait screens, health and gear line up beneath the hero, with the QR code at the top right. Portrait events fit on one row when there is room for the icon, full story, closely grouped stats and a separate timestamp; longer stories keep the details below. A vertical rule separates the goal and tasks from the leaderboard.',
        fr: { title: 'Plus de place pour les aventures en portrait', body: 'En plein écran portrait, le journal occupe toute la largeur. Votre objectif et les tâches du jour sont regroupés dessous, à côté d’un classement compact qui garde votre ligne visible. Disponible sur TRMNL X. Sur les écrans portrait X et OG, la santé et l’équipement s’alignent sous le héros, avec le code QR en haut à droite. En portrait, les événements tiennent sur une ligne si l’icône, le récit complet, les statistiques regroupées et l’heure bien séparée y entrent ; sinon les détails restent dessous. Un trait vertical sépare l’objectif et les tâches du classement.' },
        de: { title: 'Mehr Platz für Abenteuer im Hochformat', body: 'Im Vollbild-Hochformat nutzt das Protokoll die ganze Breite. Dein Ziel und die heutigen Aufgaben stehen darunter zusammen, neben einer kompakten Rangliste, die deine eigene Zeile sichtbar hält. Verfügbar auf TRMNL X. Im Hochformat auf X und OG stehen Gesundheit und Ausrüstung links unter dem Helden, der QR-Code oben rechts. Im Hochformat stehen Ereignissymbol, vollständiger Text, eng gruppierte Werte und eine deutlich abgesetzte Uhrzeit in einer Zeile, wenn alles hineinpasst; sonst bleiben die Details darunter. Eine senkrechte Linie trennt Ziel und Aufgaben von der Rangliste.' },
      },
      {
        title: 'Equipping gear and switching to Bold mark the goal done right away',
        body: 'Putting on a piece of gear you found, or landing on Bold after another stance, marks that goal done immediately. The reward still waits on Claim.',
        fr: { title: 'Équiper et passer en Audacieux cochent l’objectif tout de suite', body: 'Enfiler un équipement trouvé, ou arriver sur Audacieux après un autre style, marque cet objectif comme fait immédiatement. La récompense attend toujours sur Récupérer.' },
        de: { title: 'Ausrüsten und zu Draufgängerisch wechseln haken das Ziel sofort ab', body: 'Gefundene Ausrüstung anlegen, oder nach einem anderen Stil bei Draufgängerisch landen, markiert das Ziel sofort als geschafft. Die Belohnung wartet weiter auf Abholen.' },
      },
      {
        title: 'A clearer TRMNL preview in either orientation',
        body: 'The TRMNL preview now lets you switch between landscape and portrait and remembers your choice. Adventure logs in the vertical half layout keep clear of the leaderboard below.',
        fr: { title: 'Un aperçu TRMNL plus clair dans les deux orientations', body: 'L’aperçu TRMNL permet maintenant de passer du paysage au portrait et mémorise votre choix. Dans la demi-page verticale, le journal d’aventure reste au-dessus du classement.' },
        de: { title: 'Eine klarere TRMNL-Vorschau in beiden Ausrichtungen', body: 'Die TRMNL-Vorschau lässt sich jetzt zwischen Querformat und Hochformat umschalten und merkt sich deine Wahl. Im vertikalen Halblayout bleibt das Abenteuerprotokoll über der Rangliste.' },
      },
      {
        title: 'A goal you finish here is marked done right away',
        body: 'A goal you finish in the companion, such as salvaging a piece of gear, is marked done immediately. The reward waits on the Claim button instead of the next adventure.',
        fr: { title: 'Un objectif fini ici est coché tout de suite', body: 'Un objectif que vous terminez dans le compagnon, comme démonter un équipement, est marqué comme fait immédiatement. La récompense attend sur le bouton Récupérer, au lieu de la prochaine aventure.' },
        de: { title: 'Ein Ziel, das du hier schaffst, wird sofort abgehakt', body: 'Ein Ziel, das du in der Begleit-App erledigst, zum Beispiel Ausrüstung zerlegen, ist sofort als geschafft markiert. Die Belohnung wartet auf Abholen, nicht bis zum nächsten Abenteuer.' },
      },
      {
        title: 'The office keeps a public count',
        body: 'The Desk Crawler page now shows how many heroes have started, how many monsters they have defeated and how much gear they have found. One more number joins them, and it changes: gear sold, gear salvaged, potions drunk, and a few others. The numbers update with every adventure.',
        fr: { title: 'Le bureau tient un compte public', body: 'La page Desk Crawler indique maintenant combien de héros ont commencé, combien de monstres ils ont vaincus et combien d’équipement ils ont trouvé. Un chiffre de plus les rejoint, et il change : équipement vendu, équipement démonté, potions bues, et quelques autres. Les chiffres se mettent à jour à chaque aventure.' },
        de: { title: 'Das Büro führt eine öffentliche Zählung', body: 'Die Desk-Crawler-Seite zeigt jetzt, wie viele Helden begonnen haben, wie viele Monster sie besiegt haben und wie viel Ausrüstung sie gefunden haben. Eine weitere Zahl kommt dazu und wechselt: verkaufte Ausrüstung, zerlegte Ausrüstung, getrunkene Tränke und ein paar weitere. Die Zahlen aktualisieren sich bei jedem Abenteuer.' },
      },
      {
        title: 'The site stays in the language you picked',
        body: 'Chrome’s translator was rewriting the page and could crash it. The site already speaks English, French and German, so the browser leaves the page as it is. Switch language with the picker at the bottom of any page, or under Account.',
        fr: { title: 'Le site reste dans la langue que vous avez choisie', body: 'Le traducteur de Chrome réécrivait la page et pouvait la faire planter. Le site parle déjà anglais, français et allemand, donc le navigateur laisse la page telle quelle. Changez de langue avec le sélecteur en bas de chaque page, ou dans Compte.' },
        de: { title: 'Die Website bleibt in der Sprache, die du gewählt hast', body: 'Chrome hat die Seite mit seinem Übersetzer umgeschrieben und konnte sie abstürzen lassen. Die Website spricht schon Englisch, Französisch und Deutsch, also lässt der Browser die Seite, wie sie ist. Die Sprache wechselst du unten auf jeder Seite oder unter Konto.' },
      },
      {
        title: 'A cleared bag says so, and gold stays in view',
        body: 'Once the bag has room, the companion offers Resume instead of sending you back to the bag. After you resume, it says the next adventure is the one that starts again. The bag page keeps your gold in view while you shop.',
        fr: { title: 'Un sac libéré le dit, et l’or reste visible', body: 'Dès que le sac a de la place, le compagnon propose Reprendre au lieu de vous renvoyer au sac. Après la reprise, il dit que la prochaine aventure est celle qui repart. La page du sac garde votre or en vue pendant les achats.' },
        de: { title: 'Eine freie Tasche sagt das, und das Gold bleibt sichtbar', body: 'Sobald die Tasche Platz hat, bietet die Begleit-App Fortsetzen an, statt dich zurück zur Tasche zu schicken. Nach dem Fortsetzen sagt sie, dass das nächste Abenteuer wieder losgeht. Die Taschenseite behält dein Gold im Blick, während du einkaufst.' },
      },
      {
        title: 'A full bag stops the adventure view',
        body: 'When adventures stop because the bag is full, every TRMNL layout says so and shows a large code straight to the bag, with the slots used and anything waiting to be claimed. In the companion, one confirmation sells the weakest spare, claims a waiting find and sends the hero back out.',
        fr: { title: 'Un sac plein arrête la vue d’aventure', body: 'Quand les aventures s’arrêtent parce que le sac est plein, chaque écran TRMNL le dit et montre un grand code qui ouvre le sac, avec les places utilisées et la trouvaille en attente. Dans le compagnon, une confirmation vend le plus faible en trop, récupère la trouvaille et renvoie le héros.' },
        de: { title: 'Eine volle Tasche stoppt die Abenteueransicht', body: 'Wenn die Abenteuer anhalten, weil die Tasche voll ist, sagt das jeder TRMNL-Bildschirm und zeigt einen großen Code direkt zur Tasche, mit den belegten Plätzen und einem wartenden Fund. In der Begleit-App verkauft eine Bestätigung das schwächste Ersatzstück, holt den Fund ab und schickt den Helden wieder los.' },
      },
      {
        title: 'Rankings say when they were updated',
        body: 'The rankings now show the last update beside the group name, instead of a line of explanation under it.',
        fr: { title: 'Le classement indique quand il a été mis à jour', body: 'Le classement affiche maintenant la dernière mise à jour à côté du nom du groupe, à la place d’une ligne d’explication en dessous.' },
        de: { title: 'Die Rangliste sagt, wann sie aktualisiert wurde', body: 'Die Rangliste zeigt das letzte Update jetzt neben dem Gruppennamen, statt einer Erklärung darunter.' },
      },
    ],
  },
  {
    date: '2026-10-15',
    changes: [
      {
        title: 'Desk Crawler speaks French and German',
        body: 'The site, the companion and your TRMNL screen now come in French and German as well as English. Pages follow your browser’s language, and you can pick one at the bottom of any page or under Account. Your TRMNL follows the language of your TRMNL account, or the one you pick. Your hero, gear and history carry over, and older stories are translated too.',
        fr: { title: 'Desk Crawler parle français et allemand', body: 'Le site, le compagnon et l’écran de votre TRMNL existent maintenant en français et en allemand, en plus de l’anglais. Les pages suivent la langue de votre navigateur, et vous pouvez en choisir une en bas de chaque page ou dans Compte. Votre TRMNL suit la langue de votre compte TRMNL, ou celle que vous choisissez. Votre héros, votre équipement et votre historique sont conservés, et les anciennes histoires sont traduites aussi.' },
        de: { title: 'Desk Crawler spricht Französisch und Deutsch', body: 'Die Website, die Begleit-App und deinen TRMNL-Bildschirm gibt es jetzt auch auf Französisch und Deutsch. Seiten folgen der Sprache deines Browsers, und du kannst unten auf jeder Seite oder unter Konto eine wählen. Dein TRMNL folgt der Sprache deines TRMNL-Kontos oder der, die du wählst. Held, Ausrüstung und Verlauf bleiben erhalten, und auch ältere Geschichten werden übersetzt.' },
      },
      {
        title: 'A page that misses an update offers a reload',
        body: 'If the site updates while you have it open and a page can’t load its new parts, the page now says a new version just went live and gives you a Reload button. It used to ask you to check your connection, and Try again could not fix it.',
        fr: { title: 'Une page qui rate une mise à jour propose de la recharger', body: 'Si le site est mis à jour pendant que vous l’avez ouvert et qu’une page ne peut pas charger ses nouveaux éléments, elle indique maintenant qu’une nouvelle version vient d’arriver et propose un bouton Recharger. Avant, elle vous demandait de vérifier votre connexion, et Réessayer n’y changeait rien.' },
        de: { title: 'Eine Seite, die ein Update verpasst, bietet Neu laden an', body: 'Wenn die Website aktualisiert wird, während du sie offen hast, und eine Seite ihre neuen Teile nicht laden kann, sagt sie jetzt, dass gerade eine neue Version online gegangen ist, und zeigt einen Button Neu laden. Früher bat sie dich, deine Verbindung zu prüfen, und Erneut versuchen half nicht.' },
      },
      {
        title: 'Your TRMNL fits at any display scale or text size',
        body: 'If you set a larger display scale or text size on your TRMNL, every layout now keeps inside the screen. Where the header gets too wide, the row of hearts and the XP bar leave their numbers, and smaller details like the stance and gear make way. A very long hero name shortens, and a full bag keeps its code on screen. At the normal size nothing changes.',
        fr: { title: 'Votre TRMNL s’adapte à toutes les échelles d’affichage et tailles de texte', body: 'Si vous choisissez une échelle d’affichage ou une taille de texte plus grande sur votre TRMNL, chaque mise en page reste désormais dans l’écran. Quand l’en-tête devient trop large, la rangée de cœurs et la barre d’XP perdent leurs chiffres, et les petits détails comme la posture et l’équipement s’effacent. Un nom de héros très long se raccourcit, et un sac plein garde son code à l’écran. À la taille normale, rien ne change.' },
        de: { title: 'Dein TRMNL passt bei jeder Anzeigeskalierung und Textgröße', body: 'Wenn du auf deinem TRMNL eine größere Anzeigeskalierung oder Textgröße einstellst, bleibt jetzt jedes Layout innerhalb des Bildschirms. Wird die Kopfzeile zu breit, verlieren die Herzreihe und die XP-Leiste ihre Zahlen, und kleinere Details wie Haltung und Ausrüstung machen Platz. Ein sehr langer Heldenname wird gekürzt, und eine volle Tasche behält ihren Code auf dem Bildschirm. In normaler Größe ändert sich nichts.' },
      },
    ],
  },
  {
    date: '2026-10-14',
    changes: [
      {
        title: 'A dot on the Hero tab when a goal reward is waiting',
        body: 'When your hero reaches a goal, the Hero tab now shows a dot from any page, and the goal card glows with a full-width Claim button. Claiming pops the confetti and the card turns straight into your next goal.',
        fr: { title: 'Un point sur l’onglet Héros quand une récompense d’objectif attend', body: 'Quand votre héros atteint un objectif, l’onglet Héros affiche maintenant un point depuis n’importe quelle page, et la carte d’objectif s’illumine avec un bouton Récupérer sur toute la largeur. Récupérer lance les confettis et la carte passe directement à votre objectif suivant.' },
        de: { title: 'Ein Punkt am Held-Tab, wenn eine Zielbelohnung wartet', body: 'Wenn dein Held ein Ziel erreicht, zeigt der Held-Tab jetzt auf jeder Seite einen Punkt, und die Zielkarte leuchtet mit einem breiten Abholen-Button. Beim Abholen regnet es Konfetti, und die Karte wird sofort zu deinem nächsten Ziel.' },
      },
      {
        title: 'Stories on your TRMNL show icons for what changed',
        body: 'Each story now shows its XP, gold, HP, potions and bag slots as an icon and a number, like the overnight recap, instead of boxed labels. A story that changed nothing simply has no icons. With a larger display scale or text size on a TRMNL X, the numbers no longer spill out of their columns, and a purchase no longer squeezes its story into a narrow column. At the largest sizes, the weekly board, then the scene, then smaller details make room so your latest story still shows.',
        fr: { title: 'Les histoires sur votre TRMNL montrent des icônes pour ce qui a changé', body: 'Chaque histoire affiche maintenant son XP, son or, ses PV, ses potions et ses places de sac sous forme d’icône et de nombre, comme le bilan de la nuit, au lieu d’étiquettes encadrées. Une histoire qui n’a rien changé n’a tout simplement pas d’icônes. Avec une échelle d’affichage ou une taille de texte plus grande sur un TRMNL X, les nombres ne débordent plus de leurs colonnes, et un achat ne tasse plus son histoire dans une colonne étroite. Aux plus grandes tailles, le classement de la semaine, puis la scène, puis les petits détails font de la place pour que votre dernière histoire reste visible.' },
        de: { title: 'Geschichten auf deinem TRMNL zeigen Symbole für das, was sich geändert hat', body: 'Jede Geschichte zeigt ihre XP, ihr Gold, ihre LP, Tränke und Taschenplätze jetzt als Symbol mit Zahl, wie der Nacht-Rückblick, statt als umrandete Beschriftungen. Eine Geschichte, die nichts verändert hat, hat einfach keine Symbole. Mit größerer Anzeigeskalierung oder Textgröße auf einem TRMNL X laufen die Zahlen nicht mehr aus ihren Spalten, und ein Kauf quetscht seine Geschichte nicht mehr in eine schmale Spalte. Bei den größten Einstellungen machen erst die Wochenrangliste, dann die Szene, dann kleinere Details Platz, damit deine neueste Geschichte sichtbar bleibt.' },
      },
      {
        title: 'Elites can dig in',
        body: 'From level 12, on the Cafeteria Depths and deeper, an elite sometimes digs in and takes a few adventures to beat. Your TRMNL shows its health going down, and your hero comes back to it between rests. It hits hard and can knock your hero out, and it leaves after four hours. When it falls it pays many times an elite’s XP and gold and a rare or epic find. You can walk away from it on the Hero page.',
        fr: { title: 'Les élites peuvent se retrancher', body: 'À partir du niveau 12, dans les Profondeurs de la cafétéria et plus bas, une élite se retranche parfois et demande quelques aventures pour être battue. Votre TRMNL montre sa santé qui baisse, et votre héros y revient entre deux pauses. Elle frappe fort, peut mettre votre héros K.-O. et part au bout de quatre heures. Quand elle tombe, elle rapporte plusieurs fois l’XP et l’or d’une élite, plus une trouvaille rare ou épique. Vous pouvez la laisser tranquille depuis la page Héros.' },
        de: { title: 'Elites können sich eingraben', body: 'Ab Stufe 12, in den Kantinentiefen und tiefer, gräbt sich manchmal ein Elite-Monster ein und braucht ein paar Abenteuer, bis es besiegt ist. Dein TRMNL zeigt, wie seine LP sinken, und dein Held kehrt zwischen den Pausen zu ihm zurück. Es schlägt hart zu, kann deinen Helden K. o. schlagen und zieht nach vier Stunden ab. Fällt es, bringt es ein Vielfaches der XP und des Golds eines Elites und dazu einen seltenen oder epischen Fund. Auf der Heldenseite kannst du es in Ruhe lassen.' },
      },
      {
        title: 'What’s new has a home in More',
        body: 'Hiding the What’s new card on the Hero tab used to leave no easy way back to the list of changes. It now has its own row on the More tab, with the day of the latest update.',
        fr: { title: 'Les nouveautés ont leur place dans Plus', body: 'Masquer la carte Nouveautés de l’onglet Héros ne laissait aucun moyen simple de retrouver la liste des changements. Elle a maintenant sa propre ligne dans l’onglet Plus, avec le jour de la dernière mise à jour.' },
        de: { title: 'Neuigkeiten haben ein Zuhause unter Mehr', body: 'Wer die Neuigkeiten-Karte im Held-Tab ausblendete, fand kaum zurück zur Liste der Änderungen. Sie hat jetzt eine eigene Zeile im Tab Mehr, mit dem Tag des letzten Updates.' },
      },
      {
        title: 'The quarter-size TRMNL view says when your hero is paused or knocked out',
        body: 'If Desk Crawler shares your TRMNL with other plugins in a quarter slot, it now says “Paused by you” while you have paused, and the time your hero is back after a knockout. A long hero name no longer hides your level, and the latest adventure gets more of the width.',
        fr: { title: 'La vue en quart de votre TRMNL dit quand votre héros est en pause ou K.-O.', body: 'Si Desk Crawler partage votre TRMNL avec d’autres plugins dans un emplacement d’un quart, il affiche maintenant « Mis en pause par vous » pendant votre pause, et l’heure du retour de votre héros après un K.-O. Un nom de héros long ne cache plus votre niveau, et la dernière aventure profite de plus de largeur.' },
        de: { title: 'Die Viertelansicht auf dem TRMNL zeigt, wenn dein Held pausiert oder K. o. ist', body: 'Wenn Desk Crawler deinen TRMNL in einem Viertel-Platz mit anderen Plugins teilt, steht dort jetzt „Von dir pausiert“, solange du pausiert hast, und nach einem K. o. die Uhrzeit, zu der dein Held zurück ist. Ein langer Heldenname verdeckt deine Stufe nicht mehr, und das neueste Abenteuer bekommt mehr Breite.' },
      },
      {
        title: 'Less on the Hero page until you need it',
        body: 'Features you haven’t reached yet no longer stack up as locked cards. The Hero page names the next one to open and its level, and the world map shows the floors you can visit plus the next one. The Career page still lists everything that opens later.',
        fr: { title: 'Moins de choses sur la page Héros tant que vous n’en avez pas besoin', body: 'Les fonctions que vous n’avez pas encore atteintes ne s’empilent plus en cartes verrouillées. La page Héros nomme la prochaine à s’ouvrir et son niveau, et la carte du monde montre les étages que vous pouvez visiter, plus le suivant. La page Carrière liste toujours tout ce qui s’ouvre plus tard.' },
        de: { title: 'Weniger auf der Heldenseite, bis du es brauchst', body: 'Funktionen, die du noch nicht erreicht hast, stapeln sich nicht mehr als gesperrte Karten. Die Heldenseite nennt die nächste, die sich öffnet, und ihre Stufe, und die Weltkarte zeigt die Stockwerke, die du besuchen kannst, plus das nächste. Die Karriereseite listet weiterhin alles auf, was später kommt.' },
      },
      {
        title: 'Buttons are easier to spot',
        body: 'Only things you can tap look like buttons now. Something you can’t afford yet shows its price and how much more gold you need instead of a greyed-out button, Drink potion appears only when your hero is hurt, the world map marks where you are, and the quest log is a plain list.',
        fr: { title: 'Les boutons se repèrent plus facilement', body: 'Seul ce que vous pouvez toucher ressemble désormais à un bouton. Ce que vous ne pouvez pas encore vous offrir affiche son prix et l’or qui vous manque au lieu d’un bouton grisé, Boire une potion n’apparaît que quand votre héros est blessé, la carte du monde indique où vous êtes, et le journal de quête est une simple liste.' },
        de: { title: 'Buttons sind leichter zu erkennen', body: 'Nur was du antippen kannst, sieht jetzt wie ein Button aus. Was du dir noch nicht leisten kannst, zeigt seinen Preis und wie viel Gold dir fehlt, statt eines ausgegrauten Buttons. Trank trinken erscheint nur, wenn dein Held verletzt ist, die Weltkarte markiert, wo du bist, und das Questlog ist eine schlichte Liste.' },
      },
      {
        title: 'Rankings show the players around you',
        body: 'The weekly board on your TRMNL now centres on your hero, so you see who is just ahead of you and who is just behind as well as the top of the board. In the app, Rankings opens with the two players either side of you once you are below fifth.',
        fr: { title: 'Le classement montre les joueurs autour de vous', body: 'Le classement de la semaine sur votre TRMNL se centre maintenant sur votre héros : vous voyez qui est juste devant et juste derrière vous, en plus du haut du classement. Dans l’app, Classement s’ouvre sur les deux joueurs de chaque côté de vous dès que vous êtes au-delà de la cinquième place.' },
        de: { title: 'Die Rangliste zeigt die Spieler um dich herum', body: 'Die Wochenrangliste auf deinem TRMNL ist jetzt auf deinen Helden zentriert, sodass du siehst, wer knapp vor und knapp hinter dir liegt, und dazu die Spitze. In der App öffnet sich die Rangliste mit den zwei Spielern auf jeder Seite von dir, sobald du unter Platz fünf liegst.' },
      },
      {
        title: 'The workbench opens at level 4',
        body: 'Salvage and the workbench used to be there from your first adventure, but the first upgrade needs level 4, so early materials could not be spent. They now open together at level 4. Your TRMNL says when, and your next goal is to salvage a piece of gear. Before that, sell your spares for gold, which pays for the first bags.',
        fr: { title: 'L’établi s’ouvre au niveau 4', body: 'Le démontage et l’établi étaient là dès votre première aventure, mais la première amélioration demande le niveau 4 : les premiers matériaux ne servaient donc à rien. Ils s’ouvrent maintenant ensemble au niveau 4. Votre TRMNL vous prévient, et votre objectif suivant est de démonter une pièce d’équipement. D’ici là, vendez l’équipement en trop pour de l’or, qui paie les premiers sacs.' },
        de: { title: 'Die Werkbank öffnet sich auf Stufe 4', body: 'Zerlegen und die Werkbank gab es ab deinem ersten Abenteuer, aber das erste Upgrade braucht Stufe 4, also ließ sich frühes Material nicht ausgeben. Beides öffnet sich jetzt zusammen auf Stufe 4. Dein TRMNL sagt Bescheid, und dein nächstes Ziel ist, ein Ausrüstungsteil zu zerlegen. Bis dahin verkaufst du überzählige Teile für Gold, das die ersten Taschen bezahlt.' },
      },
      {
        title: 'Goals done in the app show as done straight away',
        body: 'Equipping a find or changing your stance for a goal used to leave the goal card asking for it until your hero’s next adventure, up to fifteen minutes later. The card now says the goal is done as soon as you do it. Your hero still marks it off, and the reward arrives, on that next adventure.',
        fr: { title: 'Les objectifs remplis dans l’app s’affichent tout de suite', body: 'Équiper une trouvaille ou changer de posture pour un objectif laissait la carte d’objectif le réclamer jusqu’à la prochaine aventure de votre héros, jusqu’à quinze minutes plus tard. La carte indique maintenant l’objectif rempli dès que vous le faites. Votre héros le coche toujours à cette prochaine aventure, et la récompense arrive à ce moment-là.' },
        de: { title: 'In der App erledigte Ziele zeigen sich sofort als erledigt', body: 'Einen Fund anzulegen oder die Haltung für ein Ziel zu wechseln, ließ die Zielkarte bis zum nächsten Abenteuer deines Helden danach fragen, bis zu fünfzehn Minuten später. Jetzt zeigt die Karte das Ziel als erledigt, sobald du es tust. Abgehakt wird es weiterhin beim nächsten Abenteuer, und dann kommt auch die Belohnung.' },
      },
    ],
  },
  {
    date: '2026-10-13',
    changes: [
      {
        title: 'Desk Crawler is on the TRMNL marketplace',
        body: 'Install it from the marketplace listing, link your TRMNL and your hero starts adventuring every fifteen minutes.',
        fr: { title: 'Desk Crawler est sur la boutique TRMNL', body: 'Installez-le depuis sa fiche sur la boutique, liez votre TRMNL et votre héros part à l’aventure toutes les quinze minutes.' },
        de: { title: 'Desk Crawler ist im TRMNL-Marktplatz', body: 'Installiere es über seinen Eintrag im Marktplatz, verbinde deinen TRMNL, und dein Held geht alle fünfzehn Minuten auf Abenteuer.' },
      },
    ],
  },
]

/**
 * D154: every change with a key that sorts by when it was added: its day, then its place in that day counted from the
 * day's first change ("2026-10-14.03"). The companion's card shows the keys after the owner's `whatsNewSince`.
 */
export const changeKeys = (locale: Locale = 'en'): Array<{ key: string; title: string }> =>
  CHANGELOG.flatMap((entry) => entry.changes.map((change, index) => ({ key: `${entry.date}.${String(entry.changes.length - index).padStart(2, '0')}`, title: changeIn(change, locale).title })))

/** The day an entry went live, written out ("14 October 2026", "14 octobre 2026"), the same on the server and in every browser. */
export const changeDay = (date: string, year = true, locale: Locale = 'en') => new Date(`${date}T12:00:00Z`).toLocaleDateString(INTL_TAG[locale], { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' })

/** The newest `count` changes, newest first, each with the day it went live. */
export const latestChanges = (count: number, locale: Locale = 'en'): Array<{ date: string; title: string; body: string }> =>
  CHANGELOG.flatMap((entry) => entry.changes.map((change) => ({ date: entry.date, ...changeIn(change, locale) }))).slice(0, count)
