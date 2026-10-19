import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'

const w = anglerWords('nl')
const n = (value: number) => w.number(value)
const en_ = (parts: readonly string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} en ${parts.at(-1)}`)

export const nl: HelpPage = {
  seoTitle: 'Hulp bij Idle Angler',
  description: 'Zo vist Idle Angler op je TRMNL: aas, koelbox, hengels, wateren, seizoenen, logboek, weekend-Opens en vliegendoos.',
  title: 'Idle Angler op TRMNL',
  contents: {
    'getting-started': 'Aan de slag',
    goals: 'Doelen en wat wanneer opengaat',
    'how-fishing-works': 'Zo werkt het vissen',
    'time-and-weather': 'Tijd, weer en seizoenen',
    bait: 'Aas en dood aas',
    'the-fishmonger': 'De visboer',
    'the-cooler': 'De koelbox',
    'rods-and-fish-that-get-away': 'Hengels en vissen die ontsnappen',
    waters: 'Wateren',
    'the-logbook': 'Het logboek en de titels',
    rankings: 'Ranglijsten en weekend-Opens',
    'the-trophy-wall': 'De trofeeënwand',
    'the-fly-box': 'De vliegendoos',
    achievements: 'Prestaties',
    alerts: 'Meldingen',
    'pausing-and-removing': 'Pauzeren en verwijderen',
    help: 'Hulp',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Aan de slag</h2>
      <ul>
        <li>Installeer Idle Angler uit de TRMNL-pluginmarketplace en kies Installeren.</li>
        <li>Log in bij TRMNL Games en koppel de installatie. Je visser draagt je openbare naam.</li>
        <li>Klik terug in TRMNL op Opslaan. Binnen vijftien minuten werpt je visser voor het eerst uit en vangt een vis.</li>
        <li>Zet de plugin in een playlist of een mashup. Alle vier de layoutformaten werken in beide oriëntaties.</li>
      </ul>
      <h2 id="goals">Doelen en wat wanneer opengaat</h2>
      <p>De Steiger toont altijd één doel, zoals ‘{w.goal('first_sale')}’ of ‘{w.goal('dawn_dusk')}’. Haal je het, dan worden er een paar munten opzijgezet: tik op Ophalen op de Steiger om ze te krijgen, en het volgende doel verschijnt. Een stip op het tabblad Steiger zegt dat er iets klaarligt. Doelen verlopen nooit, en ongeveer de helft haalt je visser zonder jou.</p>
      <p>Het spel gaat open naarmate je logboek voller raakt: betere hengels en koelboxen bij {F.unlocks.shop_upgrades} soorten, bestellingen van de visboer bij {F.unlocks.orders}, de weekend-Opens bij {F.unlocks.opens}, de trofeeënwand bij {F.unlocks.trophies} en dood aas bij {F.unlocks.deadbait}. De Steiger zegt wat er hierna komt.</p>
      <h2 id="how-fishing-works">Zo werkt het vissen</h2>
      <p>Elk kwartier, dag en nacht, werpt je visser één keer uit. Soms bijt er een vis. Welke, hangt af van het water, het aas, het tijdstip en het weer. Het gewicht bepaalt de prijs, of het een persoonlijk record is en waar de vis in de ranglijsten komt. Je TRMNL toont de scène, de nieuwste verhalen en de weekranglijst van je water. Open de app om je vangst te verkopen, aas te kopen of van water te wisselen.</p>
      <h2 id="time-and-weather">Tijd, weer en seizoenen</h2>
      <p>De dageraad loopt van 05:00 tot 08:00, de dag tot 17:00, de schemering tot 20:00, en dan is het nacht, in de tijdzone die je TRMNL doorgeeft. Bij dageraad en schemering bijten vissen vaker. Het weer is voor alle vissers op een water gelijk en verandert elke zes uur: helder, bewolkt, regen, wind of mist. Bewolking en regen geven meer beten {w.waterName('river_bend').at}, wind minder, en mist maakt dageraad en schemering donker genoeg voor nachtvissen.</p>
      <p>De wateren hebben hun eigen seizoenen, voor iedereen gelijk: lente, zomer, herfst en winter, elk een week, met een wissel elke maandag om 00:00 UTC. Sommige vissen bijten maar in één seizoen, in zoet water gaat het in de winter trager, en de scène toont bloesem, bladeren of sneeuw. Elk seizoen heeft een trek, van maandag tot en met donderdag, als één soort er is: {en_(F.runs.map((id) => w.species(id).toLowerCase()))}.</p>
      <h2 id="bait">Aas en dood aas</h2>
      <p>Elk water heeft zijn eigen aas, en het aas bepaalt welke vissen kunnen bijten; de Winkel zegt welke vissen op welk aas gaan. Kies het aas op de Steiger-pagina. Elke vis die je houdt, of die ontsnapt, kost één aas. Een worp zonder beet kost niets, en een vis die wordt teruggezet omdat de koelbox vol is ook niet. Zonder aas voor het water vist je visser met een kale haak, die minder beten en alleen kleine vissen geeft. Koop aas in bakjes in de Winkel, tot {F.baitCap} van elk; aas bederft nooit.</p>
      <p>Kleine vissen, zoals blankvoorn, serpeling, alver en makreel, kunnen vanuit de koelbox als dood aas terug aan de haak: één vis levert {F.deadbaitPerFish} keer aas op, tot {F.deadbaitCap} op voorraad. Alleen roofvissen pakken dood aas, zoals baars, snoek, snoekbaars, paling en de grote zeevissen, en ze vallen er zwaarder door uit.</p>
      <h2 id="the-fishmonger">De visboer</h2>
      <p>De visboer hangt {F.orderSlots} bestellingen op, zoals ‘{w.text('Two Roach')}’ of ‘{w.text('One fish over 1.5 kg')}’. Als vissen in je koelbox bij een bestelling passen, verschijnt de visboer op de Koelbox-pagina met die vissen en een knop Verkopen: hij betaalt 1,5 keer de marktprijs plus een bonus, en de pagina toont beide prijzen. Bestellingen verlopen nooit, en een lege plek vult zich om 07:00 jouw tijd. Je visser kiest zijn vangst niet, dus de visboer laat zich alleen zien als er iets aan hem te verkopen valt.</p>
      <h2 id="the-cooler">De koelbox</h2>
      <p>Vissen gaan in de koelbox tot je ze verkoopt. Is hij vol, dan blijft je visser vissen en zet hij zijn vangst terug. Teruggezette vissen komen toch in het logboek, tellen voor prestaties en kunnen de ranglijsten aanvoeren, maar leveren geen munten op. Je TRMNL laat zien wanneer de koelbox vol is, en zijn QR-code opent de koelbox. Een grotere koelbox betekent minder teruggezette vissen tussen twee bezoeken. Het spel verkoopt nooit vis voor je.</p>
      <h2 id="rods-and-fish-that-get-away">Hengels en vissen die ontsnappen</h2>
      <p>Elke hengel landt vissen tot een bepaald gewicht. Een zwaardere vis breekt los, en het verhaal zegt dat er iets zwaars wegzwom. Een betere hengel had hem geland. Betere hengels geven ook een paar beten meer.</p>
      <h2 id="waters">Wateren</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong>: hier begint iedereen. Blankvoorns, baarzen en brasems, karpers bij dageraad en schemering, palingen ’s nachts.</li>
        <li><strong>{w.water('river_bend')}</strong>: gaat open als {F.gates.river_bend} soorten {w.waterName('millpond').of} in je logboek staan, met het {w.pass('waders').toLowerCase()}. Forellen, kopvoorns en barbelen, en snoek en snoekbaars op de spinner.</li>
        <li><strong>{w.water('harbour_pier')}</strong>: gaat open als {F.gates.harbour_pier} soorten {w.waterName('river_bend').of} in je logboek staan, met de {w.pass('pier_permit')}. Zeevis, groter en meer waard. De meeste vragen de {w.rod('Carbon Rod')} of beter.</li>
        <li><strong>{w.water('heron_lake')}</strong>: gaat open als {F.gates.heron_lake} soorten {w.waterName('river_bend').of} in je logboek staan, met de {w.pass('rowing_boat').toLowerCase()}. Grote karpers op boilies en meervallen in zomernachten.</li>
        <li><strong>{w.water('deep_sea')}</strong>: gaat open als {F.gates.deep_sea} soorten {w.waterName('harbour_pier').of} in je logboek staan. Een ticket uit de Winkel geeft {F.charter.casts} worpen op zee voor {n(F.charter.price)} munten; de boot brengt je terug naar de pier als ze op zijn, en ongebruikte worpen blijven op het ticket. De grootste vissen vragen de {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong>: gaat open als {F.gates.frozen_tarn} soorten {w.waterName('heron_lake').of} in je logboek staan, met de {w.pass('ice_auger')}, en alleen in de winterweek. Als het ijs smelt, loopt je visser terug {w.waterName('heron_lake').to}.</li>
      </ul>
      <p>Verplaatsen kost één worp, daarna vist je visser op het nieuwe water. Werkt je aas daar niet, dan neemt je visser het passende aas waar je het meest van hebt. Je kunt altijd terug.</p>
      <h2 id="the-logbook">Het logboek en de titels</h2>
      <p>Elke soort die je vangt komt in het logboek met het aantal en je beste gewicht, en het logboek zegt welk aas, tijdstip en weer hij graag heeft. Vissen die je nog niet hebt gevangen, staan als silhouet met hun aas, behalve de epische. Epische vissen vragen het juiste aas, uur en weer tegelijk, en sommige bijten maar in één seizoen.</p>
      <p>Via het logboek kom je verder. Nieuwe soorten openen het volgende water en de functies hierboven, en geven je je titel: {F.titles.map((t) => `${w.title(t.id)} bij ${t.species} soorten`).join(', ')}. Iedereen begint als {w.title(F.firstTitle)}. Idle Angler heeft geen XP en geen niveaus.</p>
      <h2 id="rankings">Ranglijsten en weekend-Opens</h2>
      <p>Elk water heeft zijn eigen ranglijst: de zwaarste vis die elke visser daar heeft gevangen, gehouden of teruggezet. Eén ranglijst loopt een week en begint elke maandag om 00:00 UTC opnieuw; de andere houdt de records van alle tijden bij. Je TRMNL toont de weekranglijst van het water waar je vist, en de app toont ze allemaal.</p>
      <p>Elk weekend, van zaterdag 00:00 tot zondag 23:59 UTC, houdt elk water een Open voor één soort, genoemd op de pagina Ranglijsten. Vang die vis daar om mee te doen; je zwaarste telt. Op maandag krijgen de beste drie van elk water een medaille en {en_(F.prizes.map(n))} munten, en iedereen die meedeed krijgt een rozet.</p>
      <h2 id="the-trophy-wall">De trofeeënwand</h2>
      <p>Een vis van minstens {F.trophies.minPercent}% van het topgewicht van zijn soort kun je vanuit de koelbox laten opzetten in plaats van verkopen. Dat kost de waarde van de vis plus {F.trophies.fee} munten. De wand begint met {F.trophies.firstPegs} haken en kan er tot {F.trophies.maxPegs} hebben; meer haken vind je op de pagina van de wand. Medailles en rozetten staan op de plank, en je openbare pagina toont de wand als die openbaar is.</p>
      <h2 id="the-fly-box">De vliegendoos</h2>
      <p>Elke week toont je TRMNL een vliegcode van zes cijfers naast zijn QR-code en in zijn titelbalk. Scan de QR-code, of typ de code op de Logboek-pagina, om de vlieg van de week aan je doos toe te voegen. Je visser draagt de nieuwste op de hoed. Eén vlieg per week: elke maandag om 00:00 UTC komt er een nieuwe code, en de code van vorige week werkt nog tot de maandag erna, voor als je scherm laat vernieuwde. Na alle {F.flies} vliegen komen de patronen terug. Vliegen veranderen niets aan het vissen.</p>
      <h2 id="achievements">Prestaties</h2>
      <p>Prestaties hebben niveaus, voor vissen, het logboek, je uitrusting en wateren, handel en elke soort. De pagina Prestaties onder Meer toont je niveaus, welk deel van de vissers elk niveau heeft en hoe ver je nog van het volgende bent. Je openbare profiel toont ze als Idle Angler erop staat.</p>
      <h2 id="alerts">Meldingen</h2>
      <p>Zet meldingen aan onder Instellingen op de pagina Meer om op die telefoon een melding te krijgen als je koelbox vol is of je visser geen aas meer heeft. Ze staan uit tot je ze aanzet, en je krijgt er hooguit twee per dag voor al je spellen samen.</p>
      <h2 id="pausing-and-removing">Pauzeren en verwijderen</h2>
      <p>Pauzeer het vissen onder Instellingen op de pagina Meer: geen vangsten tot je verdergaat, en je houdt alles. Als je de plugin uit TRMNL haalt, blijft je visser bestaan. Voortgang in Idle Angler verwijderen onder Instellingen wist je visser, koelbox en logboek, en laat je account en je andere spellen met rust.</p>
      <h2 id="help">Hulp</h2>
      <p>Mail naar <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> wat je scherm toont en wanneer je het voor het laatst zag veranderen.</p>
    </>
  ),
}
