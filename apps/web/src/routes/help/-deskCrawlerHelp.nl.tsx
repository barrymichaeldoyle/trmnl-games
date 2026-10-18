import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'

const t = contentTranslator('nl')
const n = (value: number) => t.number(value)
const goud = (value: number) => `${n(value)} goud`
const en = (parts: readonly string[], last = 'en') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
const name = (english: string) => t.name(english)
const floor = (english: string) => t.nameWith(english, 'de')
const rungs = (list: readonly { name: string; size: number; price: number }[]) => en(list.map((rung) => `${t.nameWith(rung.name, 'een')} (${rung.size}) voor ${goud(rung.price)}`))
const price = (c: Cost) => `${en(c.materials.map((m) => `${m.n} ${name(m.name).toLowerCase()}`))} plus ${goud(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `${signed(m.attackPct)}% aanval` : '', m.defensePct ? `${signed(m.defensePct)}% verdediging` : '', m.xpPct ? `${signed(m.xpPct)}% XP uit overwinningen` : '', m.goldPct ? `${signed(m.goldPct)}% goud` : '', m.trapDamagePct ? `vallen doen ${m.trapDamagePct}% minder pijn` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = en(F.floors.filter((b) => b.level > 1).map((b) => `${floor(b.name)} op niveau ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` Dit komt op niveau ${F.unlocks[feature]}.`)
const rarityNl: Record<string, string> = { common: 'gewone', uncommon: 'ongewone', rare: 'zeldzame', epic: 'epische' }

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
const WEEKDAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const NTH = ['eerste', 'tweede', 'derde', 'vierde', 'vijfde']
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, ${rule.days} dagen lang` : ''
  switch (date.kind) {
    case 'fixed':
      return `${date.day} ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const base = `de ${NTH[date.nth - 1]} ${WEEKDAYS[date.weekday]} van ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      return `${offset === 0 ? base : `de ${WEEKDAYS[(date.weekday + offset) % 7]} na ${base}`}${span}`
    }
    case 'friday_13th':
      return 'elke vrijdag de 13e'
    case 'easter':
      return date.offsetDays === -2 ? 'Goede Vrijdag tot en met tweede paasdag' : `${Math.abs(date.offsetDays)} dagen ${date.offsetDays < 0 ? 'voor' : 'na'} Eerste Paasdag${span}`
    case 'table': {
      const next = nextTableDate(date.dates)
      return next === null ? 'een datum die elk jaar verschuift' : `een datum die elk jaar verschuift (de volgende: ${next.getUTCDate()} ${MONTHS[next.getUTCMonth()]} ${next.getUTCFullYear()})`
    }
  }
}

export const nl: HelpPage = {
  seoTitle: 'Desk Crawler: hulp en installatie',
  description: 'Hoe je Desk Crawler op TRMNL installeert en hoe elk onderdeel van het spel werkt, met oplossingen als het scherm achterloopt.',
  title: 'Desk Crawler op TRMNL',
  contents: {
    'getting-started': 'Aan de slag', 'if-the-qr-sends-you-back-to-setup': 'Als de QR je terugstuurt naar de installatie', 'how-time-works': 'Hoe de tijd verloopt', floors: 'Verdiepingen', 'desk-keepsakes': 'Bureau-aandenkens', career: 'Carrière', 'heroes-and-classes': 'Helden en klassen', stances: 'Houdingen', 'desk-raids': 'Bureauraids', meetings: 'Vergaderingen', 'lost-property': 'Gevonden voorwerpen', 'to-do-list': 'Takenlijst', potions: 'Drankjes', 'the-wandering-merchant': 'De rondtrekkende koopman', decisions: 'Beslissingen', effects: 'Effecten', 'office-calendar': 'Kantoorkalender', 'rare-and-epic-gear': 'Zeldzame en epische uitrusting', 'when-your-bag-fills-up': 'Als je tas vol raakt', 'bigger-bags': 'Grotere tassen', 'salvage-and-the-workbench': 'Demonteren en de werkbank', 'getting-knocked-out': 'Knock-out gaan', recaps: 'Samenvattingen', 'understanding-rankings': 'Hoe de ranglijsten werken', 'sharing-your-hero': 'Je held delen', 'following-and-rivals': 'Volgen en rivalen', names: 'Namen', gender: 'Geslacht', alerts: 'Meldingen', troubleshooting: 'Problemen oplossen', 'disconnecting-and-removing': 'Ontkoppelen en verwijderen', help: 'Hulp',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Aan de slag</h2>
      <ul>
        <li>Open <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler in de TRMNL-marketplace</a> en kies Installeren.</li>
        <li>Log in bij Desk Crawler, kies een openbare naam en een heldennaam, en koppel de installatie.</li>
        <li>Klik terug in TRMNL op Opslaan. Het eerste avontuur van je held begint binnen 15 minuten.</li>
        <li>Zet de plugin in een afspeellijst, of in een mashup als je je held naast andere plugins wilt. Alle vier de indelingsformaten worden ondersteund.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">Als de QR je terugstuurt naar de installatie</h2>
      <p>De QR opent de app van het account waarmee je bent ingelogd. Hij start geen nieuwe installatie. Controleer het e-mailadres van de login op de installatiepagina en gebruik Ander account als je oorspronkelijk met een ander account hebt gekoppeld.</p>
      <p>Staat er bij de installatie ‘Desk Crawler opnieuw koppelen’, dan bestaat je TRMNL-koppeling wel, maar ontbreekt de held. Dat kan gebeuren na de reset van het spel vóór de lancering. Installeer een nieuwe kopie van <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler vanuit TRMNL</a>, log in met hetzelfde account, kies een nieuwe heldennaam, koppel en klik dan in TRMNL op Opslaan. Werkt de nieuwe kopie, haal dan de oude uit je afspeellijst.</p>
      <p>Staat er ‘Sla op in TRMNL om te beginnen’, dan staat je held al klaar. Ga terug naar die installatie in TRMNL en klik op Opslaan.</p>
      <h2 id="how-time-works">Hoe de tijd verloopt</h2>
      <p>
        De spelwereld gaat elk kwartier verder, of je scherm nu aanstaat of niet. Je TRMNL toont een momentopname en ververst in zijn eigen tempo.
        Slaapstand, trager verversen en andere afspeellijstitems kosten je held nooit voortgang. Avonturentijden in de app gebruiken de tijdzone van je browser.
      </p>
      <h2 id="floors">Verdiepingen</h2>
      <p>Het gebouw heeft {F.floors.length} verdiepingen, en je held begint in {floor(F.floors[0]?.name ?? '')}. Elke verdieping gaat open op een niveau, of je er nu komt of niet: {FLOORS_LINE}. Je TRMNL zegt ‘Nieuw gebied ontgrendeld’ als het zover is; of je erheen reist, bepaal je zelf, via de wereldkaart op de pagina Held. Diepere verdiepingen hebben taaiere monsters, meer goud, betere drankjes en beter betaalde taken. In {floor(F.floors[0]?.name ?? '')} kan een held niet knock-out gaan; op elke andere verdieping wel.</p>
      <ul>
        {F.floors.map((f) => <li key={f.id}><strong>{name(f.name)}</strong>{f.level > 1 ? ` (niveau ${f.level})` : ' (vanaf het begin)'}: {f.monsters.map(name).join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>De pagina Veldnotities onder Meer bewaart wat je held over elke verdieping en elk monster heeft opgeschreven. De notitie van een verdieping gaat open zodra je held er voor het eerst staat, die van een monster bij de eerste overwinning erop. Notities hebben geen invloed op het spel.</p> : null}
      <h2 id="desk-keepsakes">Bureau-aandenkens</h2>
      <p>Houd Desk Crawler in je afspeellijst en zoek in de titelbalk van het scherm naar ‘Aandenken-code’ met een zescijferige code, zoals 482 917 (smalle staande mashups korten dat in tot ‘Aandenken’). Vul die code in bij Instellingen in de app om een blijvend kantoorsouvenir te verzamelen. Zowel volledig scherm als mashups tonen hem; het voorbeeld in de app verbergt hem. Terwijl er een aandenken wacht, verzamelt de QR-code op het scherm het ook: scan hem met je telefoon en de app zet het op je plank, ook met de titelbalk uit. Waar ruimte is, staat de code ernaast.</p>
      <p>Je kunt één aandenken per week verzamelen, met elke maandag om 00:00 UTC een nieuwe code. De code van vorige week werkt ook als je scherm traag ververst. Mis je een week, dan krijg je de week erna hetzelfde ontwerp. Heb je de hele set, dan kun je van elk meer verzamelen. Aandenkens veranderen niets aan XP, uitrusting of ranglijsten, en extra apparaten of sneller verversen leveren niets extra’s op.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Carrière</h2>
          <p>Je held heeft altijd één doel, bovenaan de pagina Held: ‘Win je eerste gevecht’, ‘Rust een gevonden uitrustingsstuk uit’, ‘Bereik de Serverruimte’, ‘Koop de Laptoprugzak’. Sommige haal je al avonturend; de rest doe je hier, op de pagina Tas of Held. Een doel halen toont ‘Doel bereikt’ op je TRMNL en zet wat goud opzij ({n(F.career.gold)} over de hele ladder); druk op Ophalen op de pagina Held om het binnen te halen. Doelen geven geen XP en verlopen nooit, en het volgende doel begint of je nu hebt opgehaald of niet.</p>
          <ul>
            <li>De Carrièrepagina onder Meer toont de {F.career.goals} doelen op volgorde, met de datum waarop je elk doel haalde. Een doel dat je al had gedaan toen de ladder kwam, telt als bereikt.</li>
            {F.unlocks !== undefined ? <li>Functies komen per niveau, of je nu langskomt of niet: de takenlijst op niveau {F.unlocks.todo}, houdingen op niveau {F.unlocks.stances}, kantoorbeslissingen op niveau {F.unlocks.choices}, {F.meetings?.level !== undefined ? `vergaderingen met collega’s op niveau ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `demonteren en de werkbank op niveau ${F.workbench.level}, ` : ''}de rondtrekkende koopman op niveau {F.unlocks.merchant} en bureauraids op niveau {F.unlocks.raids}. Je TRMNL zegt ‘Ontgrendeld’ als het zover is. Ook de verdiepingen gaan per niveau open: {FLOORS_LINE}.</li> : null}
            <li>Een paar vroege doelen komen gegarandeerd op tijd: het eerste gevecht binnen een handvol avonturen, een stuk uitrusting binnen het eerste dozijn, en een eerste beslissing, koopman en elite binnen ongeveer een dag na hun niveau. De rest hangt van het toeval af.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Helden en klassen</h2>
          <p>Iedereen begint als Krijger. Bereikt je Krijger niveau {F.rosterLevel}, dan zegt je TRMNL ‘Ontgrendeld: een tweede held’, en kun je een Schurk aanwerven via de pagina Helden onder Meer. De Schurk begint op niveau 1 met een eigen naam, uitrusting, goud, drankjes en doelen.</p>
          <ul>
            <li>Er gaat één held tegelijk op avontuur, en dat is de held die je TRMNL toont en die in de ranglijsten staat. De ander blijft waar je hem liet. Hij gaat niet op avontuur en haalt later niets in, en een koopman die hem bezoekt, vertrekt.</li>
            <li>Je kunt eens per dag wisselen. Binnen tien minuten terugwisselen telt niet. Een held die knock-out of onderweg is, moet eerst herstellen of aankomen.</li>
            <li>Je kunt één held per klasse hebben. Prestaties zijn van jou, welke held ze ook haalt; een paar horen alleen bij de Schurk.</li>
            <li><strong>Krijger</strong>: {t.text(F.classes.warriorBlurb)}</li>
            <li><strong>Schurk</strong>: {t.text(F.classes.rogueBlurb)} {F.classes.rogue.hpPct}% gezondheid, aanval {signed(F.classes.rogue.attackPct)}%, verdediging {signed(F.classes.rogue.defensePct)}%, {signed(F.classes.rogue.goldPct)}% goud uit elk gevecht en elke vondst, en {F.classes.rogue.raidEdgePct} punten aan zijn kant bij elke bureauraid. Hij stijgt in hetzelfde tempo als de Krijger, maar gaat iets vaker knock-out.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Houdingen</h2>
      <p>Kies op de pagina Held hoe voorzichtig je held is.{arrives('stances')} De houding geldt vanaf het volgende avontuur, en je kunt hem altijd wijzigen. Je TRMNL toont hem naast de tasteller, onder een meter met de naald laag voor Voorzichtig, in het midden voor Gebalanceerd en hoog voor Roekeloos.</p>
      <ul>
        <li><strong>Voorzichtig</strong> drinkt een drankje onder 65% HP, rust onder 50% en gaat weer op pad bij 90%. Krijgt 90% van de gewone XP uit overwinningen.</li>
        <li><strong>Gebalanceerd</strong>, de standaard, drinkt onder 50%, rust onder 35% en gaat weer op pad bij 75%, met de gewone XP.</li>
        <li><strong>Roekeloos</strong> drinkt onder 35%, rust onder 20% en gaat weer op pad bij 60%. Krijgt 115% XP uit overwinningen, maar gaat vaker knock-out.</li>
      </ul>
      <p>In {floor(F.floors[0]?.name ?? '')} kan een held niet knock-out gaan, dus daar loopt Roekeloos geen risico. Op elke andere verdieping kost een knock-out goud en gaat je held terug naar {floor(F.floors[0]?.name ?? '')}, en Roekeloos gaat het vaakst knock-out.</p>
      <h2 id="desk-raids">Bureauraids</h2>
      <p>Tijdens het verkennen overvallen helden soms elkaars bureaus. Elke actieve held{F.unlocks === undefined ? '' : ` vanaf niveau ${F.unlocks.raids}`} doet automatisch raids en wordt automatisch overvallen. Je kunt geen raid starten en geen doelwit kiezen.{F.unlocks === undefined ? '' : ` Onder niveau ${F.unlocks.raids} doet een held geen raids en wordt hij niet overvallen.`} De raid staat in het avonturenlogboek van beide helden met de openbare naam van de andere speler, en de pagina Held houdt de raids van je held bij.</p>
      <ul>
        <li>Wie wint is een muntworp, die alleen de houding verschuift. Niveau, uitrusting en effecten tellen nooit. Voorzichtig telt 10 punten bij aan zijn kant, Gebalanceerd niets en Roekeloos haalt er 5 af, bij aanvallen en verdedigen.</li>
        <li>Hoe vaak je held een raid doet, hangt ook van de houding af: Voorzichtig ongeveer om de dag verkennen, Gebalanceerd ongeveer één keer per dag, Roekeloos ongeveer twee keer per dag.</li>
        <li>De verliezer geeft 5% van zijn goud aan de winnaar, dus goud wisselt alleen van eigenaar. Beide verliezen gezondheid: de verliezer 30% van zijn maximale HP, de winnaar 10%. Uitrusting met {t.text('Thrifty')} haalt zijn punten van het goudverlies af.</li>
        <li>Een raid kan een held knock-out slaan, net als een gevecht; in {floor(F.floors[0]?.name ?? '')} wordt je held dan gered. Raids vinden alleen helden die verkennen of rusten, en een overvallen held wordt zo’n zes uur met rust gelaten.</li>
        <li>Wil je minder raids verliezen, kies dan Voorzichtig, dat de minste raids doet en het vaakst wint.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Vergaderingen</h2>
          <p>Af en toe loopt je held in plaats van een gevecht de held van een andere speler tegen het lijf op dezelfde verdieping{F.meetings.level === undefined ? '' : `, vanaf niveau ${F.meetings.level}`}. Ze drinken koffie, delen oorlogsverhalen of een broodje, en beide helden krijgen hetzelfde kleine voordeel voor {F.meetings.boonAdventures} avonturen. Beide logboeken vertellen het verhaal met de openbare naam van de andere speler, en het tabblad Logboek toont de laatste vijf vergaderingen van je held.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{t.text(kind.name)}</strong>: {t.text(kind.effect)}, {boonLine(kind.modifiers)}.</li>)}
            <li>Niets wisselt van eigenaar. Een vergadering neemt de plaats van één avontuur in, en het voordeel maakt dat ongeveer goed.</li>
            <li>Het gebeurt even vaak, welke houding of klasse je ook hebt, ongeveer om de dag voor een held die aan het verkennen is. Helden ontmoeten elkaar alleen tijdens verkennen of rusten, en een held die net een vergadering had, wordt zo’n twaalf uur met rust gelaten.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Gevonden voorwerpen</h2>
          <p>Gaat je held buiten het Kantoor knock-out, dan laat hij op die verdieping een reserve van zijn wapen of harnas vallen, met je openbare naam erop in stift. Je held houdt alles wat hij droeg. Later kan de held van een andere speler die die verdieping verkent, de reserve vinden in plaats van een gewone vondst, en je TRMNL vertelt je wie hem vond.</p>
          <ul>
            <li>Je held kan op dezelfde manier reserves van andere spelers vinden. Een reserve is gewone uitrusting: draag hem, verkoop hem, demonteer hem of breng hem naar de werkbank. Hij komt met de basiswaarden van zijn soort en zeldzaamheid, zonder de verbeteringen van de eerste eigenaar.</li>
            <li>De naam blijft erop staan. De pagina Tas en de kaart Gevonden voorwerpen in het Logboek tonen van wie hij was, net als je heldenpagina zolang je hem hebt.</li>
            <li>Een reserve vervangt alleen een vondst die je held toch al zou doen, dus niemand krijgt extra uitrusting. Carrièredoelen en kerstcadeaus zijn altijd nieuwe uitrusting.</li>
            <li>Er ligt steeds maar één reserve van jou rond. Gaat je held opnieuw knock-out voordat iemand hem vindt, dan vervangt de nieuwe reserve de oude.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">Takenlijst</h2>
          <p>Je held houdt een kantoortakenlijst bij met drie kleine taken, zoals ‘Versla 4 Papierduiveltjes’, ‘Vind 2 stuks uitrusting’ of ‘Verken de Serverruimte 16 avonturen lang’.{arrives('todo')} Hij werkt ze af tijdens het verkennen, en de pagina Held toont de voortgang van elke taak. Is een taak klaar, dan zegt je scherm ‘Afgevinkt’ en krijgt je held wat goud: {en(F.todo.pay.map(String), 'of')}, afhankelijk van de verdieping. Taken geven geen XP, dus ze hebben geen invloed op de ranglijsten.</p>
          <ul>
            <li>Elke ochtend om {F.todo.standup}, lokale tijd van je TRMNL, geeft de stand-up nieuwe taken voor de afgeronde. Je scherm somt ze op.</li>
            <li>Taken verlopen nooit. Een vastgelopen taak wordt na twee stand-ups vanzelf geruild.</li>
            <li>Minstens twee van de drie taken kunnen worden gedaan waar je held is. Hooguit één vraagt een reis naar een ander gebied, als je je held daarheen wilt sturen.</li>
            <li>Eén keer tussen twee stand-ups kun je op de pagina Held een onafgemaakte taak ruilen voor een andere.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Drankjes</h2>
      {F.potions === undefined
        ? <p>Een genezingsdrankje geeft 40% van de maximale HP van je held terug, naar boven afgerond. Je held drinkt er automatisch een als zijn HP tijdens het verkennen onder de drankjesgrens van zijn houding zakt, en het logboek noteert het. Zonder drankjes rust je held onder de rustgrens en gaat hij weer op pad als hij hersteld is. Je kunt er ook zelf een drinken via de pagina Held als je held verkent of rust en niet volledig gezond is. Drankjes vind je tijdens het verkennen en ze nemen nooit ruimte in de tas in.</p>
        : <>
          <p>Drankjes zijn er in {F.potions.strengths.length} sterktes: {en(F.potions.strengths.map((s) => `${name(s.name).toLowerCase()} (${s.healPct}%)`))}, en elk geeft dat deel van de maximale HP van je held terug, naar boven afgerond. Wat je vindt hangt af van waar je held is: {F.potions.drops.map((d) => `${floor(d.floor)} geeft ${d.rest.length === 0 ? 'alleen' : 'vooral'} ${name(`${d.top.toLowerCase()}s`)}${d.rest.length === 0 ? '' : `, met wat ${d.rest.map((r) => name(`${r.toLowerCase()}s`)).join(' en ')}`}`).join('; ')}. Een nieuwe held begint met genezingsdrankjes, en de koopman en kantoorbeslissingen delen ook genezingsdrankjes uit. Alle sterktes delen één buidel en nemen nooit ruimte in de tas in.</p>
          <p>Je held drinkt automatisch als zijn HP tijdens het verkennen onder de drankjesgrens van zijn houding zakt: het zwakste drankje dat hem weer boven die grens brengt, of het sterkste dat hij heeft als geen zwakker drankje volstaat. Het logboek noemt wat hij dronk. Zonder drankjes rust je held onder de rustgrens en gaat hij weer op pad als hij hersteld is. Je kunt er ook zelf een drinken via de pagina Held als je held verkent, rust of reist en niet volledig gezond is; met meer dan één sterkte in de buidel vraagt de pagina Held welke.</p>
          <p><strong>Combineren.</strong> Op de pagina Tas worden {F.potions.combine.count} {name(`${F.potions.combine.from.toLowerCase()}s`)} en {F.potions.combine.materials.map((m) => `${m.n} ${name(m.name).toLowerCase()}`).join(', ')} één {name(F.potions.combine.to.toLowerCase())}. Combineren laat je nooit met meer drankjes achter dan ervoor, dus de buidel kan niet overlopen. Het gebeurt alleen als jij ervoor kiest.</p>
        </>}
      <p>Drankjes zitten in een buidel. Een nieuwe held heeft {t.nameWith(F.firstPouch.name, 'een')} waar er {F.firstPouch.size} in passen. Grotere buidels koop je met goud op de pagina Tas, één tegelijk: {rungs(F.shopPouches)}. Is de buidel vol, dan wordt een gevonden drankje goud.</p>
      <h2 id="the-wandering-merchant">De rondtrekkende koopman</h2>
      <p>Af en toe komt je held tijdens het verkennen een rondtrekkende koopman tegen. Je scherm zegt ‘Er is een koopman op bezoek. Winkel snel in de app.’ en de pagina Tas toont tot drie aanbiedingen: een paar drankjes en de volgende buidel of tas{F.merchantOff > 0 ? ` met ${F.merchantOff}% korting op de prijs van de pagina Tas` : ''}. Elke aanbieding verkoopt één keer. De koopman trekt verder na vier avonturen of na je laatste aankoop.</p>
      <h2 id="decisions">Beslissingen</h2>
      <p>Soms vraagt het kantoor je held iets kleins, zoals meebetalen aan een taart of overwerken. Je scherm zegt ‘Er wacht een beslissing in de app.’ en de pagina Held toont beide opties met precies wat elke optie verandert. Antwoord je niet binnen ongeveer een dag, dan wordt de optie die als standaard gemarkeerd is voor je gekozen.</p>
      <h2 id="effects">Effecten</h2>
      <p>Sommige momenten geven je held een kort effect, dat op de pagina Held staat met de avonturen die nog resten. Een elite verslaan maakt je held {t.text('Fired up')} (+10% aanval voor acht avonturen). Meebetalen aan de taart geeft {t.text('Well fed')} (+10% XP voor acht avonturen). Een val laat je held {t.text('Bruised')} achter (−15% verdediging voor vier avonturen). Je held heeft hooguit drie effecten. Elke rust haalt slechte effecten weg, en een knock-out wist ze allemaal.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Ingegraven elites</h2>
          <p>Vanaf niveau {F.standoff.minLevel}, in {floor(F.standoff.floor)} en diepere verdiepingen, graaft een elite zich soms in in plaats van in één gevecht te vallen. Je TRMNL toont hem met zijn gezondheidsbalk, en je held gaat elk avontuur terug tot hij valt.</p>
          <ul>
            <li>Elk avontuur vecht je held tot zes rondes tegen hem, en zijn gezondheid blijft staan. Hij slaat veel harder dan een gewone elite, en je held vecht door voorbij de rustgrens van zijn houding voordat hij terugtrekt, dus een confrontatie kan in een knock-out eindigen. Afbreken kost geen goud.</li>
            <li>Valt hij, dan levert hij {F.standoff.xp} keer de XP van het monster en {F.standoff.gold} keer zijn goud op, plus een zeldzame of epische vondst van die verdieping.</li>
            <li>Hij vertrekt na {F.standoff.hours} uur, of eerder als je held knock-out gaat of reist. Een pauze houdt de klok niet tegen.</li>
            <li>De pagina Held toont zijn gezondheid en wanneer hij vertrekt. Daar kun je weglopen, en reizen vraagt het eerst voordat je hem achterlaat.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Kantoorkalender</h2>
          <p>Feestdagen en kantoorgelegenheden versieren die dag de scène van je held: slingers aan het plafond, iets op de vloer, soms een hoed, en in {floor(F.floors[0]?.name ?? '')} een ander uitzicht door het raam. Ze volgen de lokale datum van je TRMNL. De eerste keer dat je held er een ziet, noemt het logboek hem, en de meeste geven zolang ze duren een kleine bonus. De pagina Held toont de gelegenheid van vandaag en de volgende.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{t.text(rule.name)}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'elke bureauraid loopt mis (zie hieronder).' : rule.effectLabel ? `${t.text(rule.effectLabel)}.` : 'alleen versiering.'}</li>)}
          </ul>
          <p><strong>Vrijdag de 13e.</strong> Bureauraids beginnen twee keer zo vaak, en ze lopen allemaal mis: niemand wint, en beide helden verliezen 20% van hun maximale HP en 5% van hun goud, dat niemand krijgt. Het raidoverzicht van je held telt het als ongelukje.</p>
          <p><strong>Kerst.</strong> Je held vindt elke kerst één ingepakt cadeau: een stuk uitrusting van de verdieping waar hij is, bij zijn eerste avontuur van de drie dagen.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Zeldzame en epische uitrusting</h2>
      <p>Uitrusting is gewoon, ongewoon, zeldzaam of episch. Episch is het zeldzaamst, ongeveer één vondst op honderd, en het sterkst. Zeldzame en epische uitrusting heeft ook een speciale eigenschap, die in de naam staat en op de pagina Tas wordt uitgelegd:</p>
      <ul>
        <li><strong>{t.text('Vampiric')}</strong> geneest na elke overwinning 5% van de maximale HP.</li>
        <li><strong>{t.text('Lucky')}</strong> geeft 20% meer goud uit overwinningen en vondsten.</li>
        <li><strong>{t.text('Sturdy')}</strong> krijgt 40% minder schade van vallen.</li>
        <li><strong>{t.text('Thrifty')}</strong> verliest 5 punten minder goud als het misgaat: een terugtocht kost geen goud in plaats van 5%, en een knock-out kost 5% in plaats van 10%.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">Als je tas vol raakt</h2>
      <p>Een nieuwe held begint met een kleine papieren zak waar 6 stuks uitrusting in passen. Gedragen uitrusting en drankjes nemen geen ruimte in. Is de tas vol, dan houdt je held het volgende stuk dat hij vindt voor je vast en gaat hij door met avonturen. Zolang dat stuk wacht, blijven verdere vondsten liggen tot je ruimte maakt.</p>
      <h2 id="bigger-bags">Grotere tassen</h2>
      <p>Je tas groeit met goud. {F.tote ? `Je held vindt binnen de eerste paar uur ${t.nameWith(F.tote.name, 'een')} (${F.tote.size}). ` : ''}Daarna koop je grotere tassen op de pagina Tas, één tegelijk: {rungs(F.shopBags)}, tot {F.topBag} plekken. Er zijn geen niveau-eisen, en tassen vallen nooit als buit.</p>
      <ol className="[&_li]:list-decimal">
        <li>Open Tas in de app. Draag eventuele verbeteringen en verkoop overbodige uitrusting om ruimte te maken.</li>
        <li>Wordt er een vondst bewaard, kies dan Vondst ophalen. Laat daarna minstens één plek vrij, zodat de avonturen verder kunnen.</li>
        <li>Is er een plek vrij en wacht er niets, dan gaan de avonturen binnen 15 minuten vanzelf verder. Tot die tijd kun je op de pagina Tas nog een ander ontgrendeld gebied kiezen.</li>
      </ol>
      <p>Uitrusting dragen maakt geen plek vrij. Uitrusting verkopen of demonteren, of een grotere tas kopen, wel, en de bewaarde vondst gaat meteen de tas in. De pagina Tas kan ook met één tik je zwakste reserve verkopen en de vondst houden. Ook de slaapstand van je TRMNL houdt het spel nooit tegen.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Demonteren en de werkbank</h2>
        <p>{F.workbench.level !== undefined ? `Vanaf niveau ${F.workbench.level} heeft o` : 'O'}verbodige uitrusting {F.workbench.level !== undefined ? '' : 'heeft '}twee uitwegen uit de tas: verkopen voor goud, of demonteren tot materialen op de pagina Tas. Demonteren levert op naar de trede waarop het stuk is gevonden, in eenheden van het materiaal van zijn zeldzaamheid: {F.workbench.materials.map((m) => `${name(m.name).toLowerCase()} uit ${m.rarities.map((r) => rarityNl[r] ?? r).join(' en ')} uitrusting`).join(', ')}. Epische uitrusting levert {F.workbench.epicMultiplier} keer zoveel op. Materialen nemen geen ruimte in de tas in en worden nooit verkocht. Uitrusting wordt alleen gedemonteerd als jij dat kiest.{F.workbench.level !== undefined ? ` Verkoop vóór niveau ${F.workbench.level} je reserves: de eerste opwaardering vraagt toch niveau ${F.workbench.level}.` : ''}</p>
        <p>De werkbank besteedt materialen en goud aan de uitrusting die je held draagt, terwijl hij die aanhoudt: het stuk houdt zijn naam en eigenschap, alleen de getallen veranderen. Elk stuk heeft één volgende stap. {F.workbench.tiers.map((s, k) => `${k === 0 ? 'Een stuk van trede 1 naar Mk II brengen' : 'Van Mk II naar Mk III'} kost ${price(s)}`).join('; ')}; een stuk kan alleen naar een trede die je held op zijn niveau zou kunnen dragen. Is een stuk Mk III (of zo gevonden), dan voegt versterken per stap één punt toe: {F.workbench.reinforce.map((s) => `+${s.to} voor ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `Na +${F.workbench.reinforce.at(-1)!.to} is het stuk af.` : ''} Zeldzame en epische uitrusting kan ook een eigenschap naar keuze krijgen voor {price(F.workbench.affix)}, in plaats van de huidige.</p>
        <p>Opwaarderen lukt altijd. Een opgewaardeerd stuk demonteren geeft niet terug wat je eraan uitgaf, dus waardeer alleen uitrusting op die je wilt blijven dragen.</p>
      </> : null}
      <h2 id="getting-knocked-out">Knock-out gaan</h2>
      <p>Je held komt na ongeveer twee uur vanzelf weer bij en keert terug naar {floor(F.floors[0]?.name ?? '')}. Je houdt je XP en uitrusting, maar verliest 10% van je huidige goud.</p>
      <h2 id="recaps">Samenvattingen</h2>
      <p>Je scherm toont een korte samenvatting van de laatste afgeronde nacht of dag, in de lokale tijd van je TRMNL. Om 07:00 beslaat de nachtsamenvatting 19:00 tot 07:00 en blijft die de hele dag staan. Om 19:00 beslaat de dagsamenvatting 07:00 tot 19:00 en blijft die de hele avond en nacht staan. Het kantoorraam toont dag en nacht op dezelfde tijden. De verhalen erboven zijn altijd de nieuwste.</p>
      <h2 id="understanding-rankings">Hoe de ranglijsten werken</h2>
      <p>Het scherm toont de Top 5 XP van zeven dagen voor je niveaugroep, met je eigen regel gemarkeerd, of onder de lijst toegevoegd als je lager staat. De app biedt ook een weergave van 24 uur en een lijst aller tijden. De ranglijsten verschijnen elk uur, dus een recent avontuur of een nieuw niveau kan al te zien zijn voordat je plek wordt bijgewerkt.</p>
      <p>Gepauzeerde en gestopte helden houden hun voortgang, maar hun recente XP verloopt. Na zeven dagen zonder verdiende XP verdwijnen ze van de weeklijst tot ze weer XP verdienen. De voortgang van aller tijden blijft bewaard.</p>
      <h2 id="sharing-your-hero">Je held delen</h2>
      <p>Je held heeft een openbare pagina met zijn niveau, plek, huidige verdieping, totalen en prestaties. Goud en het avonturenlogboek worden nooit getoond, en uitrusting alleen als het een reserve van een andere speler is die je held vasthoudt. Je naam linkt naar de pagina vanuit de ranglijsten en vanuit raids en vergaderingen van andere spelers, en daar volgen andere spelers je. In Instellingen staan de knoppen Delen en Link kopiëren, en een gedeelde link toont een kaart met een afbeelding van je held, zijn naam, niveau en plek. Wil je hem verbergen, kies dan Mijn heldenpagina verbergen in Instellingen. Hij is meteen weg, en zolang hij verborgen is, kan niemand je volgen of je als rivaal kiezen.</p>
      <h2 id="following-and-rivals">Volgen en rivalen</h2>
      <p>Als je bent ingelogd, kun je een andere speler volgen via zijn openbare heldenpagina, tot 20 spelers. Iedereen die je volgt staat onder Ranglijsten, met het niveau van hun held, hun plek en waar ze zijn, en links naar hun pagina’s. Markeer er één als je rivaal om die bovenaan de lijst te houden met een regel die zegt wie voorligt. Je rivaal wordt ook vaker overvallen: de helft van de raids van je held gaat naar zijn bureau als dat kan. Je rivaal hoort wie hem heeft gekozen en kan jou terug kiezen. Iemand anders volgen verandert niets aan het spel, en niemand krijgt te horen dat je hem volgt. Verbergt een speler zijn pagina, dan zie je alleen zijn naam tot hij hem weer toont. Wijzigt hij zijn openbare naam, dan valt hij van je lijst.</p>
      <h2 id="names">Namen</h2>
      <p>Je hebt twee namen. De naam van je held staat op je TRMNL, in de ranglijsten en op je heldenpagina; wil je die wijzigen, koop dan voor 200 goud een ‘Hallo, ik heet’-naamplaatje op het tabblad Meer. Er is er één per dag op voorraad. Je openbare naam ben jij, in elk TRMNL-spel: hij staat naast je held in de ranglijsten, in raids en vergaderingen van andere spelers en in de link naar je pagina. Je kunt hem eens per 7 dagen gratis wijzigen via Account. Links naar je oude pagina werken dan niet meer, en niemand anders kan je oude naam 7 dagen lang nemen.</p>
      <h2 id="gender">Geslacht</h2>
      <p>Je kiest het geslacht van je held, man of vrouw, als je hem aanmaakt. Het verandert alleen hoe je held eruitziet op je TRMNL, je heldenpagina en in vergaderingen van andere spelers. Beide spelen hetzelfde. Wil je het later wijzigen, koop dan wanneer je wilt een make-over op het tabblad Meer voor 200 goud.</p>
      <h2 id="alerts">Meldingen</h2>
      <p>Je TRMNL is de belangrijkste manier om je held te volgen, maar Instellingen kan je in twee gevallen ook een melding op je telefoon sturen, elk uit tot je het aanzet:</p>
      <ul>
        <li><strong>Tas vol:</strong> de tas is vol en je held houdt een vondst voor je vast. Komt een halfuur nadat de tas volraakte, dus er komt niets als je hem al aan het opruimen bent, en één keer per keer dat hij volraakt.</li>
        <li><strong>Koopje van de koopman:</strong> een koopman verkoopt de volgende tas of buidel{F.merchantOff > 0 ? ` met ${F.merchantOff}% korting` : ''} en je held heeft het goud. Hooguit één keer per dag. Een koopman met alleen drankjes stuurt er nooit een.</li>
      </ul>
      <p>Je krijgt hooguit twee meldingen per dag. Stille uren lopen van 21:00 tot 08:00, tenzij je ze wijzigt: een melding over een volle tas wacht tot ze voorbij zijn, en een koopje van de koopman dat dan opduikt, wordt overgeslagen. Voor het versturen controleert het spel of de melding nog klopt, dus je hoort nooit over een tas die je al hebt opgeruimd of een aanbieding die al weg is. Beslissingen, raids, knock-outs, nieuwe niveaus en aandenkens sturen nooit meldingen.</p>
      <p>Kies Toestaan op dit apparaat in Instellingen en accepteer daarna de vraag van je browser. Zet op iPhone en iPad eerst TRMNL Games op je beginscherm (Deel, dan Zet op beginscherm) en open het vanaf daar. Elk apparaat dat je toestaat, staat in Instellingen met een knop Verwijderen; het laatste verwijderen zet de meldingen uit.</p>
      <h2 id="troubleshooting">Problemen oplossen</h2>
      <h3 id="not-on-your-screen">Je held staat niet op je scherm</h3>
      <ul>
        <li>Op Opslaan klikken zet Desk Crawler in je TRMNL-afspeellijst. Je apparaat toont de afspeellijst één plugin tegelijk, in zijn verversingstempo, dus Desk Crawler verschijnt als hij aan de beurt is. Met meerdere plugins en traag verversen kan dat even duren.</li>
        <li>Open de afspeellijst in TRMNL en controleer of Desk Crawler erin staat, op het apparaat waar je naar kijkt als je er meer hebt, en of geen planning hem op dit tijdstip verbergt.</li>
        <li>Slaapstand stopt het verversen van het scherm ’s nachts. Je held gaat door met avonturen, en het scherm haalt bij als het apparaat wakker wordt.</li>
        <li>Een scherm met ‘Het eerste avontuur begint binnen 15 minuten’ werkt. Het eerste verhaal komt bij het volgende kwartier.</li>
        <li>De pagina Held in de app toont altijd wat je held doet, wat het scherm ook laat zien.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">Het scherm lijkt oud</h3>
      <ul>
        <li>‘Updates lopen vertraging op’ betekent dat de spelservice achterloopt. De voortgang van je held blijft bewaard, en het scherm haalt bij zodra de service dat doet.</li>
        <li>Is de website van de app actueel maar het scherm niet, controleer dan in TRMNL de verversingsinstelling van de plugin en zijn plek in de afspeellijst.</li>
        <li>Avonturen draaien elk kwartier, op het hele uur en om :15, :30 en :45 in de tijdzone van je TRMNL. Het scherm toont geen aftelling; de tijd naast elk verhaal is wanneer het gebeurde, en de app toont het volgende avontuur.</li>
        <li>Heb je ontkoppeld of verwijderd, installeer dan opnieuw vanuit TRMNL. Je held houdt al zijn voortgang.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Ontkoppelen en verwijderen</h2>
      <p>
        Ontkoppelen stopt nieuwe schermen voor die installatie. TRMNL kan de laatste afbeelding blijven tonen tot je de plugin uit je afspeellijst haalt; we
        kunnen geen afbeelding wissen die al op je apparaat staat.
      </p>
      <h2 id="help">Hulp</h2>
      <p>
        Mail <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> voor hulp met je account of koppeling. We proberen binnen twee werkdagen te antwoorden.
      </p>
    </>
  ),
}
