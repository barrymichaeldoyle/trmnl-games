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
    date: '2026-10-18',
    changes: [
      {
        title: 'Choose your own stance',
        body: 'When stances open at level 7, your hero now starts with none chosen and plays Balanced until you pick. A new goal asks you to choose one, and any of the three counts, Balanced included. It takes the place of the old goal that asked for Bold.',
        fr: { title: 'Choisissez votre posture', body: 'Quand les postures s’ouvrent au niveau 7, votre héros commence sans posture et joue Équilibré jusqu’à votre choix. Un nouvel objectif vous demande d’en choisir une, et n’importe laquelle des trois compte, Équilibré compris. Il remplace l’ancien objectif qui demandait Audacieux.' },
        de: { title: 'Wähle deine Haltung selbst', body: 'Wenn die Haltungen auf Stufe 7 freigeschaltet werden, hat dein Held zunächst keine und spielt Ausgewogen, bis du wählst. Ein neues Ziel bittet dich, eine zu wählen, und jede der drei zählt, auch Ausgewogen. Es ersetzt das alte Ziel, das Draufgängerisch verlangte.' },
      },
      {
        title: 'A tidier companion',
        body: 'Rankings open on the 7-day board, the same one your TRMNL shows. The Career page folds the goals you have done, so it opens on the current one. The name tag and makeover moved to the More tab, next to your names, and Pause moved there too. The Bag tab counts the spares waiting to be sold or salvaged.',
        fr: { title: 'Un compagnon plus clair', body: 'Les classements s’ouvrent sur le classement sur 7 jours, le même que sur votre TRMNL. La page Carrière replie les objectifs atteints et s’ouvre sur l’objectif en cours. Le badge nominatif et le relooking sont passés dans l’onglet Plus, à côté de vos noms, tout comme la pause. L’onglet Sac compte les objets en trop à vendre ou recycler.' },
        de: { title: 'Eine aufgeräumtere Begleit-App', body: 'Die Ranglisten öffnen mit der 7-Tage-Rangliste, derselben wie auf deinem TRMNL. Die Karriereseite klappt erreichte Ziele ein und öffnet beim aktuellen Ziel. Namensschild und Umstyling sind in den Tab Mehr gezogen, neben deine Namen, und die Pause ebenfalls. Der Taschen-Tab zählt die Ersatzstücke, die du verkaufen oder zerlegen kannst.' },
      },
      {
        title: 'A full bag no longer stops your hero',
        body: 'When the bag fills up, your hero holds the next find for you and keeps adventuring, earning XP and gold as usual. Further finds stay behind until you make room, and your TRMNL keeps showing the adventure with a short note about the bag. Selling or salvaging a spare moves the held find into the bag, and the Bag page can do it in one tap.',
        fr: { title: 'Un sac plein n’arrête plus votre héros', body: 'Quand le sac est plein, votre héros vous garde la prochaine trouvaille et continue l’aventure, en gagnant XP et or comme d’habitude. Les trouvailles suivantes restent sur place jusqu’à ce que vous fassiez de la place, et votre TRMNL continue d’afficher l’aventure avec une courte note sur le sac. Vendre ou recycler un objet en trop fait passer la trouvaille dans le sac, et la page Sac peut le faire en une touche.' },
        de: { title: 'Eine volle Tasche hält deinen Helden nicht mehr an', body: 'Ist die Tasche voll, legt dein Held den nächsten Fund für dich zurück und zieht weiter, mit XP und Gold wie gewohnt. Weitere Funde bleiben liegen, bis du Platz schaffst, und dein TRMNL zeigt weiter das Abenteuer mit einem kurzen Hinweis zur Tasche. Verkaufen oder Zerlegen eines Ersatzstücks bringt den Fund in die Tasche, und die Taschen-Seite erledigt das mit einem Tipp.' },
      },
      {
        title: 'No more goal asking you to switch to Bold',
        body: 'The “Switch to Bold” goal sent heroes into the Cafeteria Depths on the riskiest stance, and many were knocked out there. It is gone from the ladder: a hero waiting on it moves on to the desk raid goal. Heroes who already reached it keep it.',
        fr: { title: 'Plus d’objectif pour passer en Audacieux', body: 'L’objectif « Passez en Audacieux » envoyait les héros dans les Profondeurs de la cafétéria avec la posture la plus risquée, et beaucoup y étaient mis K.-O. Il quitte l’échelle : un héros qui l’attendait passe à l’objectif de raid de bureau. Les héros qui l’avaient atteint le gardent.' },
        de: { title: 'Kein Ziel mehr, auf Draufgängerisch zu wechseln', body: 'Das Ziel „Wechsle zu Draufgängerisch“ schickte Helden mit der riskantesten Haltung in die Kantinentiefen, und viele gingen dort K. o. Es ist von der Leiter verschwunden: Ein Held, der darauf wartete, geht weiter zum Ziel für Schreibtisch-Überfälle. Helden, die es schon erreicht haben, behalten es.' },
      },
    ],
  },
  {
    date: '2026-10-17',
    changes: [
      {
        title: 'Your TRMNL says when a goal reward is waiting',
        body: 'When you reach a goal, the goal line on your TRMNL turns black and tells you to claim the gold in the companion, instead of showing the next goal. The next goal comes back once you have claimed it.',
        fr: { title: 'Votre TRMNL indique quand une récompense d’objectif attend', body: 'Quand vous atteignez un objectif, la ligne d’objectif de votre TRMNL passe en noir et vous invite à récupérer l’or dans le compagnon, au lieu d’afficher l’objectif suivant. L’objectif suivant revient une fois la récompense récupérée.' },
        de: { title: 'Dein TRMNL zeigt, wenn eine Zielbelohnung wartet', body: 'Erreichst du ein Ziel, wird die Zielzeile auf deinem TRMNL schwarz und erinnert dich, das Gold in der Begleit-App abzuholen, statt das nächste Ziel zu zeigen. Das nächste Ziel erscheint wieder, sobald du es abgeholt hast.' },
      },
      {
        title: 'More of the adventure log fits in the full landscape layout',
        body: 'In the full landscape layout, the newest entry now keeps its XP, gold, HP and time on its own line when they fit, and the changes on older entries take only the room they need. Fewer entries wrap, so the log shows one or two more.',
        fr: { title: 'Le journal d’aventure en montre plus en paysage plein écran', body: 'En paysage plein écran, l’entrée la plus récente garde son XP, son or, ses PV et son heure sur sa propre ligne quand ils tiennent, et les gains des entrées plus anciennes ne prennent que la place nécessaire. Moins d’entrées passent à la ligne, donc le journal en montre une ou deux de plus.' },
        de: { title: 'Im vollen Querformat passt mehr vom Abenteuerprotokoll', body: 'Im vollen Querformat behält der neueste Eintrag XP, Gold, LP und Uhrzeit in seiner eigenen Zeile, wenn sie passen, und die Änderungen älterer Einträge nehmen nur so viel Platz wie nötig. Weniger Einträge brechen um, also zeigt das Protokoll ein oder zwei mehr.' },
      },
      {
        title: 'Desk Crawler’s marks show under the Dark theme',
        body: 'With your TRMNL set to the Dark theme, the hearts, XP bar, gold and potion marks, log icons and the rule under the scene used to vanish. They now draw in the theme’s ink, so they show on every theme.',
        fr: { title: 'Les symboles de Desk Crawler s’affichent avec le thème Sombre', body: 'Avec votre TRMNL réglé sur le thème Sombre, les cœurs, la barre d’XP, les symboles d’or et de potions, les icônes du journal et la ligne sous la scène disparaissaient. Ils s’affichent maintenant dans l’encre du thème, donc sur tous les thèmes.' },
        de: { title: 'Desk Crawlers Symbole erscheinen im dunklen Design', body: 'War dein TRMNL auf das dunkle Design gestellt, verschwanden Herzen, XP-Leiste, Gold- und Tranksymbole, die Protokollsymbole und die Linie unter der Szene. Jetzt zeichnen sie sich in der Farbe des Designs und erscheinen in jedem Design.' },
      },
      {
        title: 'The bag-full panel fits every TRMNL layout',
        body: 'When the bag is full, the panel with the bag’s QR code no longer runs into the header or off the edge in the half, side and quarter layouts. Smaller slots show a smaller code and leave out the scene.',
        fr: { title: 'Le panneau « Sac plein » tient dans toutes les mises en page TRMNL', body: 'Quand le sac est plein, le panneau avec le QR code du sac ne déborde plus sur l’en-tête ni hors de l’écran dans les mises en page demi, côté et quart. Les petits emplacements montrent un code plus petit et laissent la scène de côté.' },
        de: { title: 'Das Tasche-voll-Feld passt in jedes TRMNL-Layout', body: 'Ist die Tasche voll, läuft das Feld mit dem QR-Code der Tasche in den halben, seitlichen und Viertel-Layouts nicht mehr in die Kopfzeile oder über den Rand. Kleine Felder zeigen einen kleineren Code und lassen die Szene weg.' },
      },
      {
        title: 'Scan the screen to collect your keepsake',
        body: 'While a keepsake waits, the QR code on your TRMNL collects it: scan it with your phone and it goes straight onto your shelf. The code is printed beside the QR where there is room, so it shows even with the title bar turned off.',
        fr: { title: 'Scannez l’écran pour récupérer votre souvenir', body: 'Tant qu’un souvenir attend, le QR code de votre TRMNL le récupère : scannez-le avec votre téléphone et il rejoint directement votre étagère. Le code est imprimé à côté du QR quand il y a la place, donc il reste visible même sans barre de titre.' },
        de: { title: 'Scanne den Bildschirm, um dein Andenken abzuholen', body: 'Solange ein Andenken wartet, holt es der QR-Code auf deinem TRMNL ab: Scanne ihn mit dem Handy, und es landet direkt in deinem Regal. Wo Platz ist, steht der Code neben dem QR, also auch bei ausgeblendeter Titelleiste.' },
      },
      {
        title: 'Desk Crawler fits its screen with the title bar hidden',
        body: 'With the TRMNL title bar turned off, older adventure entries ran under the leaderboard and the recap. The screen now drops the oldest entries to fit, as it does with the bar shown.',
        fr: { title: 'Desk Crawler tient dans l’écran sans barre de titre', body: 'Quand la barre de titre TRMNL était masquée, les anciennes aventures passaient sous le classement et le récapitulatif. L’écran retire maintenant les plus anciennes pour tenir, comme avec la barre affichée.' },
        de: { title: 'Desk Crawler passt auch ohne Titelleiste auf den Bildschirm', body: 'Bei ausgeblendeter TRMNL-Titelleiste liefen ältere Abenteuer unter die Rangliste und die Zusammenfassung. Jetzt lässt der Bildschirm die ältesten Einträge weg, damit alles passt, wie mit sichtbarer Leiste.' },
      },
      {
        title: 'Career unlocks are listed by level',
        body: 'On the Career page, What opens when now lists each feature from the lowest unlock level to the highest, so you can see what comes next in order.',
        fr: { title: 'Les déblocages de carrière sont listés par niveau', body: 'Sur la page Carrière, Ce qui s’ouvre et quand liste maintenant chaque fonction du niveau le plus bas au plus élevé, pour voir ce qui vient ensuite dans l’ordre.' },
        de: { title: 'Karriere-Freischaltungen stehen nach Stufe', body: 'Auf der Karriereseite listet Was wann öffnet jede Funktion jetzt von der niedrigsten Freischaltstufe zur höchsten, damit du der Reihe nach siehst, was als Nächstes kommt.' },
      },
    ],
  },
  {
    date: '2026-10-16',
    changes: [
      {
        title: 'A sorted bag starts the next adventure',
        body: 'When your bag has a free slot and nothing is waiting, adventures resume on their own within 15 minutes. You do not need to tap Resume. You can still pick another area from the bag page before the next adventure. If your bag was already sorted, the next adventure picks up where you left off.',
        fr: { title: 'Un sac rangé relance la prochaine aventure', body: 'Quand votre sac a une place libre et que rien n’attend, les aventures reprennent toutes seules en moins de 15 minutes. Inutile d’appuyer sur Reprendre. Vous pouvez encore choisir une autre zone depuis la page Sac avant la prochaine aventure. Si votre sac était déjà rangé, la prochaine aventure reprend là où vous en étiez.' },
        de: { title: 'Eine sortierte Tasche startet das nächste Abenteuer', body: 'Hat deine Tasche einen freien Platz und wartet nichts, gehen die Abenteuer von allein innerhalb von 15 Minuten weiter. Du musst nicht auf Fortsetzen tippen. Vor dem nächsten Abenteuer kannst du auf der Taschen-Seite noch ein anderes Gebiet wählen. War deine Tasche schon sortiert, geht es beim nächsten Abenteuer weiter, wo du aufgehört hast.' },
      },
      {
        title: 'A level goal before each locked one',
        body: 'Office decisions wait until level 5, so Reach level 5 comes first and shows your progress. The wandering merchant at level 6, the Cafeteria at level 8 and the Parking Garage at level 16 get the same. If you were waiting on one of those, that level is your goal now.',
        fr: { title: 'Un objectif de niveau avant chaque chose encore fermée', body: 'Les décisions du bureau attendent le niveau 5, alors Atteignez le niveau 5 passe devant et montre votre progression. Le marchand ambulant au niveau 6, la Cafétéria au niveau 8 et le Parking souterrain au niveau 16 aussi. Si vous attendiez l’un d’eux, ce niveau est maintenant votre objectif.' },
        de: { title: 'Ein Stufen-Ziel vor dem, was noch zu ist', body: 'Büro-Entscheidungen warten bis Stufe 5, also kommt Erreiche Stufe 5 zuerst und zeigt deinen Fortschritt. Der fahrende Händler auf Stufe 6, die Kantinentiefen auf Stufe 8 und die Tiefgarage auf Stufe 16 ebenso. Wenn du auf eines davon gewartet hast, ist diese Stufe jetzt dein Ziel.' },
      },
      {
        title: 'More room for portrait adventures',
        body: 'On full-screen portrait displays, the event log uses the whole width. Your goal and today’s tasks sit together below it, beside a compact leaderboard that keeps your own row in view. Available on TRMNL X. On both X and OG portrait screens, health and gear line up beneath the hero, with the QR code at the top right. Portrait events fit on one row when there is room for the icon, full story, closely grouped stats and a separate timestamp; longer stories keep the details below. A vertical rule separates the goal and tasks from the leaderboard.',
        fr: { title: 'Plus de place pour les aventures en portrait', body: 'En plein écran portrait, le journal occupe toute la largeur. Votre objectif et les tâches du jour sont regroupés dessous, à côté d’un classement compact qui garde votre ligne visible. Disponible sur TRMNL X. Sur les écrans portrait X et OG, la santé et l’équipement s’alignent sous le héros, avec le code QR en haut à droite. En portrait, les événements tiennent sur une ligne si l’icône, le récit complet, les statistiques regroupées et l’heure bien séparée y entrent ; sinon les détails restent dessous. Un trait vertical sépare l’objectif et les tâches du classement.' },
        de: { title: 'Mehr Platz für Abenteuer im Hochformat', body: 'Im Vollbild-Hochformat nutzt das Protokoll die ganze Breite. Dein Ziel und die heutigen Aufgaben stehen darunter zusammen, neben einer kompakten Rangliste, die deine eigene Zeile sichtbar hält. Verfügbar auf TRMNL X. Im Hochformat auf X und OG stehen Gesundheit und Ausrüstung links unter dem Helden, der QR-Code oben rechts. Im Hochformat stehen Ereignissymbol, vollständiger Text, eng gruppierte Werte und eine deutlich abgesetzte Uhrzeit in einer Zeile, wenn alles hineinpasst; sonst bleiben die Details darunter. Eine senkrechte Linie trennt Ziel und Aufgaben von der Rangliste.' },
      },
      {
        title: 'Buy-a-bag goals link to the Bag page',
        body: 'A goal like the Laptop Backpack no longer says it is done, or that the reward is waiting, before you have bought the bag. When you have the gold, the goal links straight to the Bag page.',
        fr: { title: 'Les objectifs d’achat mènent à la page Sac', body: 'Un objectif comme le sac à dos pour ordinateur ne dit plus qu’il est fait, ni que la récompense attend, avant l’achat. Quand vous avez l’or, l’objectif mène directement à la page Sac.' },
        de: { title: 'Kauf-Ziele führen zur Seite Tasche', body: 'Ein Ziel wie der Laptop-Rucksack sagt nicht mehr, es sei geschafft oder die Belohnung warte, bevor du die Tasche gekauft hast. Wenn du das Gold hast, führt das Ziel direkt zur Seite Tasche.' },
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
