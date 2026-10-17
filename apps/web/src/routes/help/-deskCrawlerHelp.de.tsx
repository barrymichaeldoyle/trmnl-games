import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'

const t = contentTranslator('de')
const n = (value: number) => t.number(value)
const gold = (value: number) => `${n(value)} Gold`
const und = (parts: readonly string[], last = 'und') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
const name = (english: string) => t.name(english)
const rungs = (list: readonly { name: string; size: number; price: number }[]) => und(list.map((rung) => `${name(rung.name)} (${rung.size}) für ${gold(rung.price)}`))
const price = (c: Cost) => `${und(c.materials.map((m) => `${m.n} ${name(m.name)}`))} plus ${gold(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `${signed(m.attackPct)} % Angriff` : '', m.defensePct ? `${signed(m.defensePct)} % Verteidigung` : '', m.xpPct ? `${signed(m.xpPct)} % XP aus Siegen` : '', m.goldPct ? `${signed(m.goldPct)} % Gold` : '', m.trapDamagePct ? `Fallen tun ${m.trapDamagePct} % weniger weh` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = und(F.floors.filter((b) => b.level > 1).map((b) => `${t.nameWith(b.name, 'der')} auf Stufe ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` Verfügbar ab Stufe ${F.unlocks[feature]}.`)
const rarityDe: Record<string, string> = { common: 'gewöhnlicher', uncommon: 'ungewöhnlicher', rare: 'seltener', epic: 'epischer' }

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const NTH = ['erste', 'zweite', 'dritte', 'vierte', 'fünfte']
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, ${rule.days} Tage lang` : ''
  switch (date.kind) {
    case 'fixed':
      return `${date.day}. ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const base = `der ${NTH[date.nth - 1]} ${WEEKDAYS[date.weekday]} im ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      return `${offset === 0 ? base : `der ${WEEKDAYS[(date.weekday + offset) % 7]} nach dem ${NTH[date.nth - 1]}n ${WEEKDAYS[date.weekday]} im ${MONTHS[date.month - 1]}`}${span}`
    }
    case 'friday_13th':
      return 'jeder Freitag, der 13.'
    case 'easter':
      return date.offsetDays === -2 ? 'Karfreitag bis Ostermontag' : `${Math.abs(date.offsetDays)} Tage ${date.offsetDays < 0 ? 'vor' : 'nach'} Ostersonntag${span}`
    case 'table': {
      const next = nextTableDate(date.dates)
      return next === null ? 'ein Datum, das sich jedes Jahr ändert' : `ein Datum, das sich jedes Jahr ändert (nächstes Mal ${next.getUTCDate()}. ${MONTHS[next.getUTCMonth()]} ${next.getUTCFullYear()})`
    }
  }
}

export const de: HelpPage = {
  seoTitle: 'Desk Crawler: Hilfe und Einrichtung',
  description: 'Wie du Desk Crawler auf TRMNL einrichtest und wie jeder Teil des Spiels funktioniert, mit Lösungen, wenn der Bildschirm veraltet aussieht.',
  title: 'Desk Crawler auf TRMNL',
  contents: {
    'getting-started': 'Erste Schritte', 'if-the-qr-sends-you-back-to-setup': 'Wenn der QR-Code zur Einrichtung führt', 'how-time-works': 'Wie die Zeit vergeht', floors: 'Etagen', 'desk-keepsakes': 'Schreibtisch-Andenken', career: 'Karriere', 'heroes-and-classes': 'Helden und Klassen', stances: 'Haltungen', 'desk-raids': 'Schreibtisch-Überfälle', meetings: 'Begegnungen', 'lost-property': 'Fundsachen', 'to-do-list': 'To-do-Liste', potions: 'Tränke', 'the-wandering-merchant': 'Der fahrende Händler', decisions: 'Entscheidungen', effects: 'Effekte', 'office-calendar': 'Bürokalender', 'rare-and-epic-gear': 'Seltene und epische Ausrüstung', 'when-your-bag-fills-up': 'Wenn die Tasche voll ist', 'bigger-bags': 'Größere Taschen', 'salvage-and-the-workbench': 'Zerlegen und Werkbank', 'getting-knocked-out': 'K. o. gehen', recaps: 'Rückblicke', 'understanding-rankings': 'Ranglisten verstehen', 'sharing-your-hero': 'Deinen Helden teilen', 'following-and-rivals': 'Folgen und Rivalen', names: 'Namen', gender: 'Geschlecht', alerts: 'Benachrichtigungen', troubleshooting: 'Fehlerbehebung', 'disconnecting-and-removing': 'Trennen und entfernen', help: 'Hilfe',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Erste Schritte</h2>
      <ul>
        <li>Öffne <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler im TRMNL-Marktplatz</a> und wähle Installieren.</li>
        <li>Melde dich bei Desk Crawler an, wähle einen öffentlichen Namen und einen Heldennamen und verbinde die Installation.</li>
        <li>Klicke zurück in TRMNL auf Speichern. Das erste Abenteuer deines Helden beginnt innerhalb von 15 Minuten.</li>
        <li>Füge das Plugin einer Playlist hinzu, oder einem Mashup, wenn dein Held neben anderen Plugins stehen soll. Alle vier Layoutgrößen werden unterstützt.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">Wenn der QR-Code zur Einrichtung führt</h2>
      <p>Der QR-Code öffnet die Begleit-App für das Konto, mit dem du angemeldet bist. Er startet keine neue Installation. Prüfe die angemeldete E-Mail-Adresse auf der Einrichtungsseite und nutze Konto wechseln, wenn du ursprünglich mit einem anderen Konto verbunden hast.</p>
      <p>Steht bei der Einrichtung „Desk Crawler neu verbinden“, gibt es deine TRMNL-Verbindung, aber der Held fehlt. Das kann nach dem Spiel-Reset vor dem Start passieren. Installiere eine frische Kopie von <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler aus TRMNL</a>, melde dich mit demselben Konto an, wähle einen neuen Heldennamen, verbinde und klicke dann in TRMNL auf Speichern. Sobald die neue Kopie läuft, entferne die alte aus deiner Playlist.</p>
      <p>Steht bei der Einrichtung „In TRMNL speichern, um zu starten“, ist dein Held schon bereit. Geh in TRMNL zu dieser Installation zurück und klicke auf Speichern.</p>
      <h2 id="how-time-works">Wie die Zeit vergeht</h2>
      <p>
        Die Spielwelt läuft alle 15 Minuten weiter, egal ob dein Bildschirm an ist. Dein TRMNL zeigt eine Momentaufnahme und aktualisiert sich nach eigenem Zeitplan.
        Schlafmodus, langsamere Aktualisierung und andere Playlist-Einträge verringern nie den Fortschritt deines Helden. Abenteuerzeiten in der Begleit-App folgen der Zeitzone deines Browsers.
      </p>
      <h2 id="floors">Etagen</h2>
      <p>Das Gebäude hat {F.floors.length} Etagen, und dein Held beginnt {t.nameWith(F.floors[0]?.name ?? '', 'im')}. Jede öffnet auf einer bestimmten Stufe, ob du sie besuchst oder nicht: {FLOORS_LINE}. Dein TRMNL zeigt dann „Neues Gebiet freigeschaltet“; ob du hinreist, entscheidest du über die Weltkarte auf der Helden-Seite. Tiefere Etagen haben zähere Monster, mehr Gold, bessere Tränke und besser bezahlte Aufgaben. {t.nameWith(F.floors[0]?.name ?? '', 'Der')} kann keinen Helden k. o. schlagen; jede andere Etage schon.</p>
      <ul>
        {F.floors.map((f) => <li key={f.id}><strong>{name(f.name)}</strong>{f.level > 1 ? ` (Stufe ${f.level})` : ' (von Anfang an)'}: {f.monsters.map(name).join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>Die Seite Feldnotizen unter Mehr bewahrt auf, was dein Held über jede Etage und jedes Monster aufgeschrieben hat. Die Notiz zu einer Etage öffnet sich, wenn dein Held sie zum ersten Mal betritt, die zu einem Monster mit dem ersten Sieg darüber. Notizen haben keinen Einfluss aufs Spiel.</p> : null}
      <h2 id="desk-keepsakes">Schreibtisch-Andenken</h2>
      <p>Lass Desk Crawler in deiner Playlist und achte in der Titelleiste des Bildschirms auf „Andenken-Code“ und einen sechsstelligen Code wie 482 917 (schmale Hochformat-Mashups kürzen ihn zu „Andenken“). Gib den Code in den Einstellungen der Begleit-App ein, um ein dauerhaftes Büro-Andenken zu sammeln. Vollbild und Mashups zeigen ihn beide; die Vorschau in der Begleit-App blendet ihn aus.</p>
      <p>Du kannst jede Woche ein Andenken sammeln, mit einem neuen Code ab Montag 00:00 UTC. Der Code der Vorwoche funktioniert auch, wenn dein Bildschirm sich langsam aktualisiert. Verpasst du eine Woche, bekommst du dasselbe Motiv in der Woche danach. Nach dem kompletten Set kannst du weitere Exemplare jedes Motivs sammeln. Andenken ändern weder XP noch Ausrüstung noch Ranglisten, und mehrere Geräte oder schnellere Aktualisierung bringen nichts extra.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Karriere</h2>
          <p>Dein Held hat immer ein Ziel, oben auf der Helden-Seite: „Gewinne deinen ersten Kampf“, „Rüste ein gefundenes Ausrüstungsteil aus“, „Reise in den Serverraum“, „Kaufe den Laptop-Rucksack“. Manche erreicht er auf Abenteuern; den Rest erledigst du hier, auf der Taschen- oder Helden-Seite. Ein erreichtes Ziel zeigt „Ziel erreicht“ auf deinem TRMNL und legt etwas Gold zurück ({n(F.career.gold)} über die ganze Leiter); drück auf der Helden-Seite auf Abholen, um es einzusammeln. Ziele geben keine XP und laufen nie ab, und das nächste beginnt, ob du abgeholt hast oder nicht.</p>
          <ul>
            <li>Die Seite Karriere unter Mehr listet die {F.career.goals} Ziele der Reihe nach, mit dem Datum, an dem du jedes erreicht hast. Ein Ziel, das du schon erfüllt hattest, als die Leiter kam, zählt als erreicht.</li>
            {F.unlocks !== undefined ? <li>Funktionen kommen mit der Stufe, ob du vorbeischaust oder nicht: die To-do-Liste auf Stufe {F.unlocks.todo}, Haltungen auf Stufe {F.unlocks.stances}, Büro-Entscheidungen auf Stufe {F.unlocks.choices}, {F.meetings?.level !== undefined ? `Begegnungen mit Kollegen auf Stufe ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `Zerlegen und Werkbank auf Stufe ${F.workbench.level}, ` : ''}der fahrende Händler auf Stufe {F.unlocks.merchant} und Schreibtisch-Überfälle auf Stufe {F.unlocks.raids}. Dein TRMNL zeigt dann jeweils „Freigeschaltet“. Auch die Etagen öffnen nach Stufe: {FLOORS_LINE}.</li> : null}
            <li>Ein Ziel verlangt, die Haltung auf Draufgängerisch zu stellen, die doppelt so oft überfällt wie Ausgewogen. Sobald es zählt, kannst du zurückwechseln.</li>
            <li>Ein paar frühe Ziele kommen garantiert rechtzeitig: der erste Kampf nach wenigen Abenteuern, ein Ausrüstungsteil im ersten Dutzend und eine erste Entscheidung, ein erster Händler und eine erste Elite etwa einen Tag nach ihrer Stufe. Alles andere ist Glückssache.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Helden und Klassen</h2>
          <p>Alle beginnen als Krieger. Erreicht dein Krieger Stufe {F.rosterLevel}, zeigt dein TRMNL „Freigeschaltet: ein zweiter Held“, und du kannst auf der Seite Helden unter Mehr einen Schurken anwerben. Der Schurke beginnt auf Stufe 1 mit eigenem Namen, eigener Ausrüstung, eigenem Gold, eigenen Tränken und Zielen.</p>
          <ul>
            <li>Es geht immer nur ein Held auf Abenteuer, und den zeigt dein TRMNL und die Ranglisten. Der andere bleibt, wo du ihn gelassen hast. Er geht nicht auf Abenteuer und holt nichts nach, und ein Händler, der ihn besucht, zieht weiter.</li>
            <li>Du kannst einmal am Tag wechseln. Direkt innerhalb von zehn Minuten zurückzuwechseln zählt nicht. Ein Held, der k. o. oder unterwegs ist, muss sich erst erholen oder ankommen.</li>
            <li>Du kannst einen Helden jeder Klasse haben. Erfolge gehören dir, egal welcher Held sie holt; ein paar gehören nur dem Schurken.</li>
            <li><strong>Krieger</strong>: {t.text(F.classes.warriorBlurb)}</li>
            <li><strong>Schurke</strong>: {t.text(F.classes.rogueBlurb)} {F.classes.rogue.hpPct} % LP, Angriff {signed(F.classes.rogue.attackPct)} %, Verteidigung {signed(F.classes.rogue.defensePct)} %, {signed(F.classes.rogue.goldPct)} % Gold aus jedem Kampf und Fund und {F.classes.rogue.raidEdgePct} Punkte auf seiner Seite bei jedem Schreibtisch-Überfall. Er steigt im Tempo des Kriegers auf, wird aber etwas öfter k. o. geschlagen.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Haltungen</h2>
      <p>Wähle auf der Helden-Seite, wie vorsichtig dein Held ist.{arrives('stances')} Die Haltung gilt ab dem nächsten Abenteuer, und du kannst sie jederzeit ändern. Dein TRMNL zeigt sie neben der Taschenzahl, unter einer Anzeige, deren Nadel bei Vorsichtig unten, bei Ausgewogen in der Mitte und bei Draufgängerisch oben steht.</p>
      <ul>
        <li><strong>Vorsichtig</strong> trinkt einen Trank unter 65 % LP, ruht unter 50 % und zieht bei 90 % wieder los. Bekommt 90 % der üblichen XP aus Siegen.</li>
        <li><strong>Ausgewogen</strong>, die Standardeinstellung, trinkt unter 50 %, ruht unter 35 % und zieht bei 75 % wieder los, mit den üblichen XP.</li>
        <li><strong>Draufgängerisch</strong> trinkt unter 35 %, ruht unter 20 % und zieht bei 60 % wieder los. Bekommt 115 % XP aus Siegen, wird aber öfter k. o. geschlagen.</li>
      </ul>
      <p>Im Großraumbüro kann kein Held k. o. gehen, also hat Draufgängerisch dort kein Risiko. Auf jeder anderen Etage kostet ein K. o. Gold und schickt deinen Helden ins Großraumbüro zurück, und Draufgängerisch erwischt es am häufigsten.</p>
      <h2 id="desk-raids">Schreibtisch-Überfälle</h2>
      <p>Beim Erkunden überfallen Helden manchmal gegenseitig ihre Schreibtische. Jeder aktive Held{F.unlocks === undefined ? '' : ` ab Stufe ${F.unlocks.raids}`} überfällt und wird automatisch überfallen. Du kannst keinen Überfall starten und kein Ziel wählen.{F.unlocks === undefined ? '' : ` Unter Stufe ${F.unlocks.raids} überfällt ein Held niemanden und wird nicht überfallen.`} Der Überfall erscheint im Abenteuerlog beider Helden mit dem öffentlichen Namen des anderen Spielers, und die Helden-Seite führt eine Liste der Überfälle deines Helden.</p>
      <ul>
        <li>Wer gewinnt, ist ein Münzwurf, den nur die Haltung verschiebt. Stufe, Ausrüstung und Effekte zählen nie. Vorsichtig legt 10 Punkte auf seine Seite, Ausgewogen nichts, und Draufgängerisch nimmt 5 weg, beim Angriff wie in der Verteidigung.</li>
        <li>Wie oft dein Held überfällt, hängt auch von der Haltung ab: Vorsichtig etwa jeden zweiten Erkundungstag, Ausgewogen etwa einmal am Tag, Draufgängerisch etwa zweimal am Tag.</li>
        <li>Der Verlierer gibt dem Gewinner 5 % seines Goldes, Gold wechselt also nur den Besitzer. Beide verlieren LP: der Verlierer 30 % seiner max. LP, der Gewinner 10 %. Sparsame Ausrüstung zieht ihre Punkte vom Goldverlust ab.</li>
        <li>Ein Überfall kann einen Helden k. o. schlagen, genau wie ein Kampf; im Großraumbüro wird dein Held stattdessen gerettet. Überfälle treffen nur Helden, die erkunden oder ruhen, und ein überfallener Held hat danach etwa sechs Stunden Ruhe.</li>
        <li>Wenn du lieber weniger Überfälle verlierst, wähle Vorsichtig: Es überfällt am seltensten und gewinnt am häufigsten.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Begegnungen</h2>
          <p>Ab und zu trifft dein Held statt eines Kampfes den Helden eines anderen Spielers auf derselben Etage{F.meetings.level === undefined ? '' : `, ab Stufe ${F.meetings.level}`}. Sie holen sich einen Kaffee, tauschen Kriegsgeschichten aus oder teilen sich ein Sandwich, und beide Helden bekommen denselben kleinen Bonus für {F.meetings.boonAdventures} Abenteuer. Beide Abenteuerlogs erzählen die Geschichte mit dem öffentlichen Namen des anderen Spielers, und der Tab Log listet die letzten fünf Begegnungen deines Helden.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{t.text(kind.name)}</strong>: {t.text(kind.effect)}, {boonLine(kind.modifiers)}.</li>)}
            <li>Nichts wechselt den Besitzer. Eine Begegnung ersetzt ein Abenteuer, und der Bonus gleicht das ungefähr aus.</li>
            <li>Sie kommt unabhängig von Haltung und Klasse gleich oft vor, etwa jeden zweiten Tag für einen Helden auf Erkundung. Helden begegnen sich nur beim Erkunden oder Ruhen, und wer gerade eine Begegnung hatte, hat danach etwa zwölf Stunden Ruhe.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Fundsachen</h2>
          <p>Wird dein Held außerhalb des Großraumbüros k. o. geschlagen, lässt er auf dieser Etage ein Ersatzstück seiner Waffe oder Rüstung fallen, mit deinem öffentlichen Namen in Edding darauf. Dein Held behält alles, was er trug. Später kann der Held eines anderen Spielers, der diese Etage erkundet, das Ersatzstück statt eines gewöhnlichen Fundes finden, und dein TRMNL sagt dir, wer es gefunden hat.</p>
          <ul>
            <li>Dein Held kann die Ersatzstücke anderer Spieler genauso finden. Ein Ersatzstück ist gewöhnliche Ausrüstung: anlegen, verkaufen, zerlegen oder an die Werkbank bringen. Es hat die Grundwerte seiner Art und Seltenheit, ohne die Verbesserungen des ersten Besitzers.</li>
            <li>Der Name bleibt drauf. Die Taschen-Seite und die Karte Fundsachen im Tab Log zeigen, wem es gehörte, und deine Heldenseite auch, solange du es hast.</li>
            <li>Ein Ersatzstück ersetzt nur einen Fund, den dein Held ohnehin gemacht hätte, also bekommt niemand zusätzliche Ausrüstung. Karriereziele und Weihnachtsgeschenke sind immer neue Ausrüstung.</li>
            <li>Es liegt immer nur ein Ersatzstück von dir herum. Wird dein Held wieder k. o. geschlagen, bevor jemand es findet, ersetzt das neue das alte.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">To-do-Liste</h2>
          <p>Dein Held führt eine Büro-To-do-Liste mit drei kleinen Aufgaben, etwa „Besiege 4 Papierkobolde“, „Finde 2 Ausrüstungsteile“ oder „Erkunde den Serverraum 16 Abenteuer lang“.{arrives('todo')} Er arbeitet sie beim Erkunden ab, und die Helden-Seite zeigt den Fortschritt jeder Aufgabe. Ist eine Aufgabe erledigt, zeigt dein Bildschirm „Abgehakt“, und dein Held bekommt etwas Gold: {und(F.todo.pay.map(String), 'oder')}, je nach Etage. Aufgaben geben keine XP und beeinflussen also die Ranglisten nicht.</p>
          <ul>
            <li>Jeden Morgen um {F.todo.standup} Ortszeit deines TRMNL verteilt das Stand-up neue Aufgaben für die erledigten. Dein Bildschirm listet sie auf.</li>
            <li>Aufgaben laufen nie ab. Eine festgefahrene Aufgabe wird nach zwei Stand-ups automatisch getauscht.</li>
            <li>Mindestens zwei der drei Aufgaben lassen sich dort erledigen, wo dein Held gerade ist. Höchstens eine verlangt eine Reise in ein anderes Gebiet, falls du ihn hinschicken willst.</li>
            <li>Einmal zwischen zwei Stand-ups kannst du auf der Helden-Seite eine unerledigte Aufgabe gegen eine andere tauschen.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Tränke</h2>
      {F.potions === undefined
        ? <p>Ein Heiltrank stellt 40 % der max. LP deines Helden wieder her, aufgerundet. Dein Held trinkt automatisch einen, wenn seine LP beim Erkunden unter die Trank-Schwelle seiner Haltung fallen, und das Abenteuerlog vermerkt es. Ohne Tränke ruht dein Held unter der Ruhe-Schwelle und zieht wieder los, sobald er sich erholt hat. Du kannst auch selbst auf der Helden-Seite einen trinken, wenn dein Held erkundet oder ruht und nicht volle LP hat. Tränke findet man beim Erkunden, und sie nehmen nie Platz in der Tasche ein.</p>
        : <>
          <p>Tränke gibt es in {F.potions.strengths.length} Stärken: {und(F.potions.strengths.map((s) => `${name(s.name)} (${s.healPct} %)`))}, die jeweils diesen Anteil der max. LP deines Helden wiederherstellen, aufgerundet. Was man findet, hängt vom Ort ab: {F.potions.drops.map((d) => `${t.nameWith(d.floor, 'der')} gibt ${d.rest.length === 0 ? 'nur' : 'vor allem'} ${name(`${d.top.toLowerCase()}s`)}${d.rest.length === 0 ? '' : `, dazu einige ${d.rest.map((r) => name(`${r.toLowerCase()}s`)).join(' und ')}`}`).join('; ')}. Ein neuer Held beginnt mit Heiltränken, und auch der Händler und Büro-Entscheidungen verteilen Heiltränke. Alle Stärken teilen sich einen Beutel und nehmen nie Platz in der Tasche ein.</p>
          <p>Dein Held trinkt automatisch, wenn seine LP beim Erkunden unter die Trank-Schwelle seiner Haltung fallen: den schwächsten Trank, der ihn wieder über die Schwelle bringt, oder den stärksten, den er hat, wenn kein schwächerer reicht. Das Abenteuerlog nennt, was er getrunken hat. Ohne Tränke ruht dein Held unter der Ruhe-Schwelle und zieht wieder los, sobald er sich erholt hat. Du kannst auch selbst auf der Helden-Seite einen trinken, wenn dein Held erkundet, ruht oder reist und nicht volle LP hat; bei mehreren Stärken im Beutel fragt die Helden-Seite, welchen.</p>
          <p><strong>Kombinieren.</strong> Auf der Taschen-Seite werden {F.potions.combine.count} {name(`${F.potions.combine.from.toLowerCase()}s`)} und {F.potions.combine.materials.map((m) => `${m.n} ${name(m.name)}`).join(', ')} zu einem {name(F.potions.combine.to)}. Kombinieren lässt dir nie mehr Tränke als vorher, der Beutel kann also nicht überlaufen. Es passiert nur, wenn du es wählst.</p>
        </>}
      <p>Tränke kommen in einen Beutel. Ein neuer Held trägt {t.nameWith(F.firstPouch.name, 'einen')} für {F.firstPouch.size} Tränke. Größere Beutel kaufst du mit Gold auf der Taschen-Seite, einen nach dem anderen: {rungs(F.shopPouches)}. Ist der Beutel voll, wird ein gefundener Trank stattdessen zu Gold.</p>
      <h2 id="the-wandering-merchant">Der fahrende Händler</h2>
      <p>Ab und zu trifft dein Held beim Erkunden einen fahrenden Händler. Dein Bildschirm zeigt „Händler zu Besuch. Bald in der Begleit-App einkaufen.“, und die Taschen-Seite zeigt bis zu drei Angebote: ein paar Tränke und den nächsten Beutel oder die nächste Tasche{F.merchantOff > 0 ? `, ${F.merchantOff} % günstiger als auf der Taschen-Seite` : ''}. Jedes Angebot gibt es nur einmal. Der Händler zieht nach vier Abenteuern oder nach deinem letzten Kauf weiter.</p>
      <h2 id="decisions">Entscheidungen</h2>
      <p>Manchmal fragt das Büro deinen Helden etwas Kleines, etwa ob er etwas für einen Kuchen gibt oder länger bleibt. Dein Bildschirm zeigt „Eine Entscheidung wartet in der Begleit-App.“, und die Helden-Seite zeigt beide Optionen mit genau dem, was sie ändern. Antwortest du nicht innerhalb etwa eines Tages, wird die als Standard markierte Option für dich gewählt.</p>
      <h2 id="effects">Effekte</h2>
      <p>Manche Momente hinterlassen bei deinem Helden einen kurzen Effekt, der auf der Helden-Seite mit den verbleibenden Abenteuern steht. Ein Sieg über eine Elite macht deinen Helden Angefeuert (+10 % Angriff für acht Abenteuer). Etwas für den Kuchen zu geben macht ihn Gut gesättigt (+10 % XP für acht Abenteuer). Eine Falle hinterlässt ihn Geprellt (−15 % Verteidigung für vier Abenteuer). Dein Held hat höchstens drei Effekte. Jede Pause schüttelt schlechte Effekte ab, und ein K. o. löscht alle.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Eingegrabene Eliten</h2>
          <p>Ab Stufe {F.standoff.minLevel}, {t.nameWith(F.standoff.floor, 'im')} und tiefer, gräbt sich manchmal eine Elite ein, statt in einem Kampf zu fallen. Dein TRMNL zeigt sie mit ihrer LP-Leiste, und dein Held kommt jedes Abenteuer wieder, bis sie fällt.</p>
          <ul>
            <li>Jedes Abenteuer kämpft dein Held bis zu sechs Runden gegen sie, und ihre LP bleiben erhalten. Sie schlägt viel härter zu als eine gewöhnliche Elite, und dein Held kämpft über die Ruhe-Schwelle seiner Haltung hinaus, bevor er zurückweicht, also kann ein Kräftemessen mit einem K. o. enden. Abbrechen kostet kein Gold.</li>
            <li>Wenn sie fällt, bringt sie das {F.standoff.xp}-Fache der XP des Monsters und das {F.standoff.gold}-Fache seines Goldes, dazu einen seltenen oder epischen Fund von dieser Etage.</li>
            <li>Sie geht nach {F.standoff.hours} Stunden, oder früher, wenn dein Held k. o. geht oder reist. Eine Pause hält die Uhr nicht an.</li>
            <li>Die Helden-Seite zeigt ihre LP und wann sie geht. Dort kannst du sie stehen lassen, und vor einer Reise wirst du gefragt, ob du sie zurücklassen willst.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Bürokalender</h2>
          <p>Feiertage und Büroanlässe schmücken die Szene deines Helden für den Tag: Dekoration an der Decke, etwas auf dem Boden, manchmal ein Hut, und im Großraumbüro ein anderer Blick aus dem Fenster. Sie folgen dem Ortsdatum deines TRMNL. Wenn dein Held einen zum ersten Mal sieht, nennt ihn das Abenteuerlog, und die meisten bringen für ihre Dauer einen kleinen Bonus. Die Helden-Seite zeigt den heutigen Anlass und den nächsten.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{t.text(rule.name)}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'jeder Schreibtisch-Überfall geht schief (siehe unten).' : rule.effectLabel ? `${t.text(rule.effectLabel)}.` : 'nur Dekoration.'}</li>)}
          </ul>
          <p><strong>Freitag, der 13.</strong> Schreibtisch-Überfälle starten doppelt so oft, und jeder geht schief: Niemand gewinnt, und beide Helden verlieren 20 % ihrer max. LP und 5 % ihres Goldes, das niemand bekommt. Die Überfall-Liste deines Helden zählt es als Missgeschick.</p>
          <p><strong>Weihnachten.</strong> Dein Held findet jedes Weihnachten ein verpacktes Geschenk: ein Ausrüstungsteil von der Etage, auf der er ist, bei seinem ersten Abenteuer der drei Tage.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Seltene und epische Ausrüstung</h2>
      <p>Ausrüstung ist gewöhnlich, ungewöhnlich, selten oder episch. Episch ist am seltensten, etwa einer von hundert Funden, und am stärksten. Seltene und epische Ausrüstung hat außerdem eine besondere Eigenschaft, die im Namen steht und auf der Taschen-Seite erklärt wird:</p>
      <ul>
        <li><strong>Vampirisch</strong> heilt nach jedem Sieg 5 % der max. LP.</li>
        <li><strong>Glückbringend</strong> bringt 20 % mehr Gold aus Siegen und Funden.</li>
        <li><strong>Robust</strong> nimmt 40 % weniger Schaden durch Fallen.</li>
        <li><strong>Sparsam</strong> verliert 5 Punkte weniger Gold, wenn etwas schiefgeht: Ein Rückzug kostet kein Gold statt 5 %, ein K. o. 5 % statt 10 %.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">Wenn die Tasche voll ist</h2>
      <p>Ein neuer Held beginnt mit einer kleinen Papiertüte für 6 Ausrüstungsteile. Angelegte Ausrüstung und Tränke brauchen keinen Platz. Ist die Tasche voll, macht dein Held weiter, bis er ein weiteres Teil findet. Dieses Teil wird für dich zurückgelegt, und dein Held schläft, bis du Platz schaffst.</p>
      <h2 id="bigger-bags">Größere Taschen</h2>
      <p>Deine Tasche wächst mit Gold. {F.tote ? `In den ersten paar Stunden findet dein Held ${t.nameWith(F.tote.name, 'einen')} (${F.tote.size}). ` : ''}Danach kaufst du größere Taschen auf der Taschen-Seite, eine nach der anderen: {rungs(F.shopBags)}, bis zu {F.topBag} Plätze. Es gibt keine Stufenanforderungen, und Taschen fallen nie als Beute.</p>
      <ol className="[&_li]:list-decimal">
        <li>Öffne Tasche in der Begleit-App. Rüste Verbesserungen aus und verkaufe übrige Ausrüstung, um Platz zu schaffen.</li>
        <li>Liegt ein Fund zurück, wähle Fund abholen. Lass danach mindestens einen Platz frei, damit die Abenteuer weitergehen können.</li>
        <li>Sobald ein Platz frei ist und nichts mehr wartet, gehen die Abenteuer von allein innerhalb von 15 Minuten weiter. Vorher kannst du auf der Taschen-Seite noch ein anderes freigeschaltetes Gebiet wählen.</li>
      </ol>
      <p>Ausrüsten macht keinen Platz frei. Verkaufen, einen Fund abholen oder eine größere Tasche kaufen schon: Die Abenteuer gehen von allein weiter. Der Taschenschlaf hat nichts mit dem Schlafmodus deines TRMNL zu tun; ein schlafendes Display hält das Spiel nie an.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Zerlegen und Werkbank</h2>
        <p>{F.workbench.level !== undefined ? `Ab Stufe ${F.workbench.level} hat übrige Ausrüstung` : 'Übrige Ausrüstung hat'} zwei Wege aus der Tasche: für Gold verkaufen oder auf der Taschen-Seite in Material zerlegen. Zerlegen bringt so viel wie die Stufe, auf der das Teil gefunden wurde, in Einheiten des Materials seiner Seltenheit: {F.workbench.materials.map((m) => `${name(m.name)} aus ${m.rarities.map((r) => rarityDe[r] ?? r).join(' und ')} Ausrüstung`).join(', ')}. Epische Ausrüstung bringt das {F.workbench.epicMultiplier}-Fache. Material braucht keinen Taschenplatz und wird nie verkauft. Ausrüstung wird nur zerlegt, wenn du es willst.{F.workbench.level !== undefined ? ` Vor Stufe ${F.workbench.level} verkaufst du Übriges besser: Die erste Verbesserung braucht ohnehin Stufe ${F.workbench.level}.` : ''}</p>
        <p>Die Werkbank investiert Material und Gold in die Ausrüstung, die dein Held trägt, direkt am Teil: Es behält Namen und Eigenschaft, nur die Werte ändern sich. Jedes Teil hat genau einen nächsten Schritt. {F.workbench.tiers.map((s, i) => `${i === 0 ? 'Ein Teil der Stufe 1 auf Mk II zu bringen' : 'Mk II auf Mk III'} kostet ${price(s)}`).join('; ')}; ein Teil lässt sich nur auf eine Stufe bringen, die dein Held mit seiner Stufe anlegen könnte. Ist ein Teil auf Mk III (oder wurde so gefunden), bringt Verstärken einen Punkt pro Schritt: {F.workbench.reinforce.map((s) => `+${s.to} für ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `Nach +${F.workbench.reinforce.at(-1)!.to} ist das Teil fertig.` : ''} Seltene und epische Ausrüstung kann außerdem für {price(F.workbench.affix)} eine Eigenschaft deiner Wahl bekommen, statt der vorhandenen.</p>
        <p>Verbesserungen klappen immer. Ein verbessertes Teil zu zerlegen gibt nicht zurück, was du hineingesteckt hast, also verbessere nur, was du weiter tragen willst.</p>
      </> : null}
      <h2 id="getting-knocked-out">K. o. gehen</h2>
      <p>Dein Held kommt nach etwa zwei Stunden automatisch wieder zu sich und kehrt ins Großraumbüro zurück. Du behältst XP und Ausrüstung, verlierst aber 10 % deines aktuellen Goldes.</p>
      <h2 id="recaps">Rückblicke</h2>
      <p>Dein Bildschirm zeigt einen kurzen Rückblick auf die letzte abgeschlossene Nacht oder den letzten Tag, in der Ortszeit deines TRMNL. Um 07:00 berichtet der Nacht-Rückblick über 19:00 bis 07:00 und bleibt den ganzen Tag stehen. Um 19:00 berichtet der Tages-Rückblick über 07:00 bis 19:00 und bleibt den Abend und die Nacht über stehen. Das Bürofenster zeigt Tag und Nacht zu denselben Zeiten. Die Geschichten darüber sind immer die neuesten.</p>
      <h2 id="understanding-rankings">Ranglisten verstehen</h2>
      <p>Der Bildschirm zeigt die XP-Top-5 der letzten sieben Tage für deine Stufengruppe, mit deiner Zeile markiert oder unter der Liste angefügt, wenn du weiter unten stehst. Die Begleit-App bietet außerdem eine 24-Stunden-Ansicht und eine Gesamtrangliste. Ranglisten werden stündlich veröffentlicht, also kann ein neues Abenteuer oder ein Stufenaufstieg erscheinen, bevor sich dein Rang aktualisiert.</p>
      <p>Pausierte und schlafende Helden behalten ihren Fortschritt, aber ihre jüngsten XP veralten. Nach sieben Tagen ohne verdiente XP verlassen sie die Wochenrangliste, bis sie wieder XP verdienen. Der Gesamtfortschritt bleibt gespeichert.</p>
      <h2 id="sharing-your-hero">Deinen Helden teilen</h2>
      <p>Dein Held hat eine öffentliche Seite mit Stufe, Rang, aktueller Etage, Gesamtzählern und Erfolgen. Gold und das Abenteuerlog werden nie gezeigt, Ausrüstung nur, wenn es das Ersatzstück eines anderen Spielers ist, das dein Held hat. Dein Name verlinkt auf die Seite, aus den Ranglisten und aus den Überfällen und Begegnungen anderer Spieler, und dort können andere dir folgen. In den Einstellungen gibt es die Knöpfe Teilen und Link kopieren, und ein geteilter Link zeigt eine Bildkarte deines Helden mit Name, Stufe und Rang. Zum Verbergen wähle in den Einstellungen Meine Heldenseite verbergen. Sie verschwindet sofort, und solange sie verborgen ist, kann dir niemand folgen oder dich zum Rivalen erklären.</p>
      <h2 id="following-and-rivals">Folgen und Rivalen</h2>
      <p>Angemeldet kannst du anderen Spielern über ihre öffentliche Heldenseite folgen, bis zu 20 Spielern. Alle, denen du folgst, stehen unter Ranglisten, mit Stufe, Rang und Aufenthaltsort ihres Helden und Links zu ihren Seiten. Markiere einen davon als deinen Rivalen, damit er oben in der Liste bleibt, mit einer Zeile, wer vorne liegt. Dein Rivale wird auch öfter überfallen: Die Hälfte der Überfälle deines Helden gilt seinem Schreibtisch, wenn er überfallen werden kann. Dein Rivale erfährt, wer ihn markiert hat, und kann dich zurück markieren. Anderen zu folgen ändert nichts am Spiel, und niemand erfährt, dass du ihm folgst. Verbirgt ein Spieler seine Seite, siehst du nur seinen Namen, bis er sie wieder zeigt. Ändert er seinen öffentlichen Namen, fällt er aus deiner Liste.</p>
      <h2 id="names">Namen</h2>
      <p>Du hast zwei Namen. Der Name deines Helden steht auf deinem TRMNL, in den Ranglisten und auf deiner Heldenseite; um ihn zu ändern, kaufst du auf der Taschen-Seite ein Namensschild „Hallo, ich heiße“ für 200 Gold. Pro Tag ist eins vorrätig. Dein öffentlicher Name bist du, in jedem TRMNL-Spiel: Er steht neben deinem Helden in den Ranglisten, in Überfällen und Begegnungen anderer Spieler und im Link deiner Seite. Du kannst ihn alle 7 Tage einmal kostenlos unter Konto ändern. Links zu deiner alten Seite funktionieren dann nicht mehr, und niemand sonst kann deinen alten Namen 7 Tage lang nehmen.</p>
      <h2 id="gender">Geschlecht</h2>
      <p>Du wählst das Geschlecht deines Helden, männlich oder weiblich, wenn du ihn erstellst. Es ändert nur sein Aussehen auf deinem TRMNL, deiner Heldenseite und in den Begegnungen anderer Spieler. Beide spielen sich gleich. Um es später zu ändern, buchst du auf der Taschen-Seite jederzeit ein Umstyling für 200 Gold.</p>
      <h2 id="alerts">Benachrichtigungen</h2>
      <p>Dein TRMNL ist der wichtigste Weg, deinen Helden im Blick zu behalten, aber die Einstellungen können in zwei Fällen auch eine Benachrichtigung aufs Handy schicken, jede aus, bis du sie einschaltest:</p>
      <ul>
        <li><strong>Held schläft:</strong> Die Tasche ist voll und die Abenteuer stehen. Sie kommt eine halbe Stunde nach Beginn des Nickerchens, damit nichts ankommt, wenn du die Tasche schon sortierst, und einmal pro Nickerchen.</li>
        <li><strong>Händlerangebot:</strong> Ein Händler verkauft die nächste Tasche oder den nächsten Beutel{F.merchantOff > 0 ? ` mit ${F.merchantOff} % Rabatt` : ''}, und dein Held hat das Gold. Höchstens einmal am Tag. Ein Händler, der nur Tränke hat, schickt nie eine.</li>
      </ul>
      <p>Du bekommst höchstens zwei Benachrichtigungen am Tag. Die Ruhezeiten gehen von 21:00 bis 08:00, außer du änderst sie: Eine Schlaf-Benachrichtigung wartet bis zu ihrem Ende, und ein Händlerangebot in dieser Zeit wird übersprungen. Vor dem Senden prüft das Spiel, ob die Benachrichtigung noch stimmt, damit du nie von einem schon beendeten Nickerchen oder einem verschwundenen Angebot hörst. Entscheidungen, Überfälle, K. o.s, Stufenaufstiege und Andenken lösen nie Benachrichtigungen aus.</p>
      <p>Wähle in den Einstellungen Auf diesem Gerät erlauben und bestätige dann die Abfrage deines Browsers. Auf iPhone und iPad füge TRMNL Games zuerst zum Home-Bildschirm hinzu (Teilen, dann Zum Home-Bildschirm) und öffne es von dort. Jedes erlaubte Gerät steht in den Einstellungen mit einem Knopf Entfernen; das letzte zu entfernen schaltet die Benachrichtigungen aus.</p>
      <h2 id="troubleshooting">Fehlerbehebung</h2>
      <h3 id="not-on-your-screen">Dein Held ist nicht auf dem Bildschirm</h3>
      <ul>
        <li>Mit Speichern kommt Desk Crawler in deine TRMNL-Playlist. Dein Gerät zeigt die Playlist ein Plugin nach dem anderen, in seinem Aktualisierungstakt, also erscheint Desk Crawler, wenn es an der Reihe ist. Bei mehreren Plugins und langsamer Aktualisierung kann das dauern.</li>
        <li>Öffne in TRMNL die Playlists und prüfe, ob Desk Crawler dort ist, auf dem Gerät, das du ansiehst, falls du mehrere hast, und dass kein Zeitplan es zu dieser Tageszeit ausblendet.</li>
        <li>Der Schlafmodus stoppt die Aktualisierung über Nacht. Dein Held macht weiter, und der Bildschirm holt auf, wenn das Gerät aufwacht.</li>
        <li>Ein Bildschirm mit „Das erste Abenteuer beginnt innerhalb von 15 Minuten“ funktioniert. Die erste Geschichte kommt zur nächsten Viertelstunde.</li>
        <li>Die Helden-Seite der Begleit-App zeigt immer, was dein Held gerade tut, egal was der Bildschirm zeigt.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">Der Bildschirm sieht alt aus</h3>
      <ul>
        <li>„Aktualisierungen verzögert“ heißt, dass der Spieldienst hinterherhinkt. Der Fortschritt deines Helden bleibt erhalten, und der Bildschirm holt auf, sobald der Dienst es tut.</li>
        <li>Ist die Begleit-Website aktuell, der Bildschirm aber nicht, prüfe die Aktualisierungseinstellung des Plugins und seinen Platz in der TRMNL-Playlist.</li>
        <li>Abenteuer laufen jede Viertelstunde, zur vollen Stunde und um :15, :30 und :45 in der Zeitzone deines TRMNL. Der Bildschirm zeigt keinen Countdown; die Zeit neben jeder Geschichte ist, wann sie passiert ist, und die Begleit-App zeigt das nächste Abenteuer.</li>
        <li>Hast du getrennt oder deinstalliert, installiere neu aus TRMNL. Dein Held behält allen Fortschritt.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Trennen und entfernen</h2>
      <p>
        Trennen stoppt neue Bildschirme für diese Installation. TRMNL zeigt das letzte Bild eventuell weiter, bis du das Plugin aus deiner Playlist entfernst;
        ein Bild, das schon auf deinem Gerät ist, können wir nicht löschen.
      </p>
      <h2 id="help">Hilfe</h2>
      <p>
        Schreib an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, wenn du Hilfe mit deinem Konto oder der Verbindung brauchst. Wir antworten in der Regel innerhalb von zwei Werktagen.
      </p>
    </>
  ),
}
