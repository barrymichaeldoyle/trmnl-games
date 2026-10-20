import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const privacyNl: LegalPage = {
  title: 'Privacy',
  description: 'Wat TRMNL Games bewaart, wat openbaar is in ranglijsten en op TRMNL-schermen, en hoe je je account verwijdert.',
  translationNote: () => <p className="text-sm text-muted">Vertaling van de Engelse versie, die bij verschillen voorgaat.</p>,
  Body: () => (
    <>
      <p>
        TRMNL Games is een verzameling spellen van Barry Michael Doyle, een zelfstandige ontwikkelaar. Deze pagina beschrijft in gewone taal wat de dienst bewaart, wie ermee werkt en
        hoe je het laat verwijderen. Vragen kun je sturen naar <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Wat openbaar is</h2>
      <p>
        Je openbare naam, de naam en het niveau van je held en je plekken staan in de ranglijsten en op de TRMNL-schermen van andere spelers. Kies een openbare naam die je
        graag deelt en zet er nooit contactgegevens in.
      </p>
      <p>
        In Desk Crawler overvallen helden elkaars bureaus en ontmoeten ze elkaar bij toeval. Doet je held een raid, wordt hij overvallen of ontmoet hij een andere held, dan staat je openbare naam in het avonturenlogboek van de andere speler, in de app en op zijn TRMNL, net zoals al in de ranglijsten. Gaat je held knock-out, dan kan hij een reservevoorwerp met je openbare naam laten vallen, dat de held van een andere speler kan vinden en houden; je naam staat dan op dat voorwerp in zijn app en op zijn heldenpagina. Wijzig je je naam of verwijder je je account, dan tonen die verhalen en voorwerpen ‘Verborgen speler’ of verliezen ze de naam.
      </p>
      <p>
        Je Desk Crawler-held heeft een openbare pagina: iedereen met de link ziet je openbare naam, de naam van je held, zijn niveau, plek, huidige verdieping en startdatum, een paar totalen en je prestaties. Goud, het avonturenlogboek en je accountgegevens blijven privé, net als je uitrusting, behalve reserves van andere spelers die je held vasthoudt, die met hun namen worden getoond. De pagina staat standaard aan. Mijn heldenpagina verbergen in Instellingen verbergt hem meteen, en je kunt hem altijd weer tonen.
      </p>
      <p>
        Ingelogde spelers kunnen een openbare heldenpagina volgen. We bewaren wie wie volgt, zodat hun app de spelers kan tonen die ze volgen. Niemand krijgt te horen dat hij gevolgd wordt, en geen enkele pagina toont wie een speler volgt. Wijzig je je openbare naam, verberg je je pagina of verwijder je je voortgang, dan zien andere spelers je held niet meer in hun lijst, en verwijderen wist die gegevens.
      </p>

      <h2>Wat we bewaren</h2>
      <ul>
        <li>Je inlogidentiteit van Clerk, onze inlogdienst. Je e-mailadres wordt alleen gekopieerd naar kortlevende verzoeken om verwijdering te bevestigen; we kopiëren je echte naam of profielfoto niet naar de spel-database.</li>
        <li>Je openbare naam, held, voorwerpen, avonturenlogboek en de recente XP voor de ranglijsten. Oudere accounts kunnen ook nog een opgeslagen tijdzone uit eerdere versies hebben.</li>
        <li>Als je meldingen van Desk Crawler aanzet: welke meldingen je wilt, je stille uren en de tijdzone van je browser (bijvoorbeeld Europe/Amsterdam), en per apparaat dat je toestaat het pushadres dat je browser ons geeft, de bijbehorende versleutelingssleutels en een label zoals ‘Chrome on Android’. We houden ook een kort overzicht bij van elke melding: welke soort, wanneer en of hij is verstuurd.</li>
        <li>
          Per TRMNL-installatie: de ID van de plugininstantie, een hash van het toegangstoken en de instellingenlink die TRMNL ons geeft. We bewaren je TRMNL-naam
          of -e-mailadres niet.
        </li>
        <li>De tijdzoneafwijking die je TRMNL met elk scherm meestuurt (bijvoorbeeld UTC+2), zodat de ochtendstand-up van Desk Crawler jouw dag volgt. We bewaren alleen de laatste.</li>
        <li>De taalinstelling die je TRMNL met elk scherm meestuurt (bijvoorbeeld nl-NL), zodat we zien naar welke talen het de moeite waard is de spellen te vertalen, en zodat je scherm jouw taal kan gebruiken. We bewaren alleen de laatste.</li>
        <li>Als je een taal kiest voor TRMNL Games, die keuze, zodat je TRMNL-schermen en meldingen die ook gebruiken.</li>
        <li>Kortlevende operationele gegevens, zoals tellers voor gebruikslimieten en bewijzen van dubbele verzoeken.</li>
        <li>Als je om verwijdering van je account vraagt: je geverifieerde primaire e-mailadres, een hash van de bevestigingslink en de afleverstatus. De link verloopt na 30 minuten; verlopen verzoeken worden bij de dagelijkse opschoning verwijderd.</li>
        <li>De lanceringslijst van Desk Crawler bevatte e-mailadressen voor één e-mail toen Desk Crawler in de TRMNL-marketplace kwam. Die e-mail is op 13 oktober 2026 verstuurd, elk adres is verwijderd en de lijst is gesloten.</li>
        <li>De lanceringslijst van Idle Angler bewaart, voor één e-mail zodra Idle Angler in de TRMNL-marketplace staat: van een ingelogde speler die op Laat het me weten tikt, een koppeling met diens account en taal (het adres wordt bij het versturen uit het account gelezen); van ieder ander het ingevulde e-mailadres en de taal. Elke vermelding wordt verwijderd zodra de e-mail verstuurd is, en je kunt de lijst altijd verlaten via de startpagina of de e-mail.</li>
        <li>De heldherinnering: als je Desk Crawler-held al twee dagen bezig is en je de Desk Crawler-app nooit hebt geopend, sturen we één e-mail naar je geverifieerde primaire adres met wat daar op je wacht, en een link om het te stoppen. Het adres wordt bij het versturen bij Clerk opgehaald en niet bewaard. We bewaren alleen wanneer hij is verstuurd, of dat je hem niet wilt.</li>
        <li>Als je feedback stuurt: je bericht, de pagina waarvandaan je het stuurde, je openbare naam en een link naar je account. Het gaat per e-mail naar de ontwikkelaar, met je geverifieerde primaire e-mailadres als antwoordadres.</li>
      </ul>

      <h2>Wat we niet doen</h2>
      <p>Geen advertenties, en we verkopen of delen je gegevens niet voor marketing. Het spel heeft geen aankopen, dus we bewaren geen betaalgegevens.</p>

      <h2>Optionele analytics en support</h2>
      <p>Sta je analytics toe, dan legt PostHog vast welke pagina’s je bezoekt, de installatiestappen, mislukte spelacties en browserfouten. Als je inlogt, worden die gegevens gekoppeld aan je Clerk-account-ID, e-mailadres, openbare naam en heldennaam, zodat we supportvragen kunnen uitzoeken en problemen kunnen oplossen. Browserfouten gaan ook naar Sentry, zonder je account, e-mailadres of IP-adres.</p>
      <p>PostHog neemt ook gemaskeerde sessies op, zodat we zien waar een stap vastloopt. Tekst en formuliervelden worden gemaskeerd, inlog- en accountgegevens worden geblokkeerd, en we nemen geen netwerkinhoud, headers of console-uitvoer op. Installatiecodes, toegangstokens, beheer-JWT’s en querystrings van URL’s worden uitgesloten.</p>
      <p>Je kunt weigeren en gewoon doorspelen. Gebruik Analytics-voorkeuren onderaan de site om je keuze te wijzigen. Analytics uitzetten stopt het nieuwe verzamelen in die browser; eerdere gegevens worden niet gewist. Neem contact op om die te laten verwijderen, of verwijder je TRMNL Games-account om verwijdering van het gekoppelde PostHog-profiel, de gebeurtenissen en opnames aan te vragen.</p>

      <h2>Cookies</h2>
      <p>
        Clerk plaatst cookies die je ingelogd houden. Terwijl je een TRMNL-installatie koppelt of beheert, plaatsen we een kortlevende versleutelde cookie die binnen
        enkele minuten verloopt. Een link om verwijdering te bevestigen gebruikt een kortlevende versleutelde cookie, zodat je kunt inloggen voordat je bevestigt. Sta je analytics toe, dan gebruikt PostHog de lokale opslag van de browser om je bezoeken te herkennen. We bewaren je analytics-keuze ook lokaal, en een cookie onthoudt de taal die je koos. Er zijn geen advertentiecookies.
      </p>

      <h2>Diensten die met je gegevens werken</h2>
      <ul>
        <li>
          <strong>Clerk</strong> verzorgt het inloggen en bewaart je e-mailadres en inlogmethode, plus je Google- of GitHub-profiel als je daarmee inlogt.
        </li>
        <li>
          <strong>Convex</strong> host de spel-database, de spelupdates van elk kwartier en de dagelijkse back-ups.
        </li>
        <li>
          <strong>Cloudflare</strong> host deze website en bewaart standaard verzoeklogs.
        </li>
        <li>
          <strong>TRMNL</strong> haalt het scherm van je held bij ons op. Voor je TRMNL-account en -apparaat geldt het eigen privacybeleid van TRMNL.
        </li>
        <li><strong>PostHog EU</strong> verzorgt optionele gebruiksanalytics, foutrapporten en gemaskeerde sessieopnames voor support en productverbeteringen.</li>
        <li><strong>Sentry</strong> (Verenigde Staten) ontvangt foutrapporten van de server van onze website en de backend van het spel, en van je browser als je analytics toestaat, zodat we bugs kunnen vinden en oplossen. Een rapport bevat het paginapad of de naam van de spelfunctie die misging, en de technische details van de fout. Het bevat nooit je account, e-mailadres, IP-adres, cookies, formulierinhoud, querystrings van URL’s of installatiecodes en -tokens.</li>
        <li><strong>De pushdienst van je browser</strong> (Google voor Chrome en Android, Apple voor Safari, Mozilla voor Firefox) bezorgt Desk Crawler-meldingen als je die aanzet. Hij ontvangt de melding versleuteld, dus hij kan hem niet lezen, samen met het pushadres dat je browser maakte.</li>
        <li><strong>Resend</strong> bezorgt de e-mail om verwijdering van je account te bevestigen op je geverifieerde primaire adres, de lanceringsmail (één keer verstuurd, op 13 oktober 2026) en feedback die je naar de ontwikkelaar stuurt. Resend ontvangt die adressen en de inhoud van de e-mails. Het bezorgt ook de ene heldherinnering.</li>
      </ul>

      <h2>Hoe lang we het bewaren</h2>
      <ul>
        <li>Je gedeelde account: tot je het verwijdert. Spelvoortgang: tot je dat spel of je account verwijdert.</li>
        <li>Gedetailleerd avonturenlogboek: drie dagen. Samenvattingen van runs: 30 dagen. Recente XP voor ranglijsten: zeven dagen.</li>
        <li>Bewijzen van dubbele verzoeken: 24 uur. Pogingen om TRMNL te koppelen: minder dan een dag.</li>
        <li>Lanceringslijst: verwijderd toen de lanceringsmail op 13 oktober 2026 uitging. We bewaren geen kopie.</li>
        <li>Lanceringslijst van Idle Angler: elke vermelding wordt verwijderd als de lanceringsmail is verstuurd, als je de lijst verlaat, of samen met je account.</li>
        <li>Heldherinnering: wanneer hij is verstuurd, of dat je hem niet wilt, tot je je account verwijdert.</li>
        <li>Feedback: tot je je account verwijdert, of eerder op verzoek. Kopieën die al naar de ontwikkelaar zijn gemaild, worden op verzoek verwijderd.</li>
        <li>Meldingsinstellingen en apparaten: tot je meldingen uitzet, het apparaat verwijdert, of Desk Crawler of je account verwijdert. Een apparaat waarvan het pushadres niet meer werkt, wordt automatisch verwijderd. Gegevens van afzonderlijke meldingen: zeven dagen.</li>
        <li>Back-ups: ongeveer een week, daarna zijn verwijderde gegevens er ook uit.</li>
        <li>Gemaskeerde opnames: 30 dagen. Analytics-gebeurtenissen en supportprofielen: tot verwijdering van je account of een eerder verzoek om verwijdering.</li>
        <li>Foutrapporten in Sentry: tot 90 dagen. Ze zijn niet aan je account gekoppeld, dus bij het verwijderen van je account valt daar niets te wissen.</li>
      </ul>

      <h2>Je account verwijderen</h2>
      <p>
        Ga naar <Link to="/account">Account</Link> en vraag een verwijderlink aan. We mailen je geverifieerde primaire adres; de link verloopt na 30 minuten. Log in met hetzelfde account en typ DELETE op de bevestigingspagina. Tot je bevestigt, blijft je account actief. Na de bevestiging werkt je account meteen niet meer, verdwijnt je openbare naam uit de
        ranglijsten, en worden daarna je held, voorwerpen, geschiedenis, TRMNL-koppelingen en je TRMNL Games-login verwijderd. Momentopnamen van ranglijsten waarin je naam stond,
        worden binnen ongeveer twee uur vervangen. Kun je niet inloggen, mail ons dan en we doen het voor je.
      </p>
      <p>
        We bewaren alleen een eenrichtingshash van je inlogidentiteit en van je oude TRMNL-tokens, zodat een verwijderd account niet stilletjes opnieuw kan worden gekoppeld. Afbeeldingen die al
        naar een TRMNL-apparaat zijn gestuurd of door TRMNL zijn gecachet, kunnen we niet wissen; haal de plugin uit je afspeellijst om ze te vervangen. Tellers voor gebruikslimieten worden bij het verwijderen gewist, en verwijzingen naar het account in administratieve auditregels worden opgeschoond.
      </p>
      <p>Verwijdering van gekoppelde PostHog-profielen, -gebeurtenissen en -opnames wordt bij het verwijderen van het account aangevraagd en door PostHog asynchroon verwerkt. Mislukte verzoeken worden opnieuw geprobeerd en blijven zichtbaar voor de beheerder tot ze zijn opgelost.</p>

      <h2>Alleen een spel verwijderen</h2>
      <p>Kies in de <Link to="/app/desk-crawler/settings">instellingen van Desk Crawler</Link> Voortgang in Desk Crawler verwijderen om die held, de geschiedenis, de koppelingen en de meldingsinstellingen en -apparaten te verwijderen. Je gedeelde account en login blijven beschikbaar. Als het verwijderen klaar is, kun je opnieuw beginnen door de plugin te installeren. Andere spellen blijven zoals ze zijn.</p>

      <h2>Je keuzes</h2>
      <p>
        Je kunt een kopie van je spelgegevens vragen, of vragen om iets te corrigeren of te verwijderen, door te mailen naar <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        We proberen binnen twee werkdagen te antwoorden.
      </p>

      <h2>Kinderen</h2>
      <p>TRMNL Games is niet bedoeld voor kinderen onder de 13, en we bewaren niet bewust hun gegevens. Denk je dat een kind een account heeft, mail ons dan en we verwijderen het.</p>

      <h2>Wijzigingen</h2>
      <p>Als dit beleid verandert, werken we deze pagina en de datum bovenaan bij.</p>
    </>
  ),
  IdleAngler: () => (
    <>
      <h2>Idle Angler</h2>
      <p>Idle Angler bewaart je visser: munten, het water en het aas, je koelbox, je logboek van soorten en beste gewichten, je visgeschiedenis, je zwaarste vis per water en per weekend-Open, je bestellingen van de visboer, trofeeënwand en medailles, prestaties en vliegendoos. Je zwaarste vissen staan onder je openbare naam in de ranglijsten en Open-uitslagen van Idle Angler en op de TRMNL-schermen van andere spelers. Tenzij je Idle Angler in de instellingen van Idle Angler verbergt op je openbare profiel, ziet iedereen met de link je titel, startdatum, aantal prestaties, gelogde soorten, aantal medailles en de vissen op je trofeeënwand.</p>
      <p>Zet je meldingen van Idle Angler aan, dan gebruiken die dezelfde apparaten en stille uren als de meldingen van je andere spellen. De wekelijkse vliegcode op je TRMNL hoort bij je installatie en wordt nooit in de app getoond.</p>
      <p>In de <Link to="/app/idle-angler/settings">instellingen van Idle Angler</Link> verwijdert Voortgang in Idle Angler verwijderen je visser, koelbox, logboek, ranglijst- en Open-records, trofeeënwand en medailles, vliegendoos, prestaties, Idle Angler-koppelingen en meldingsinstellingen van Idle Angler. Je account en andere spellen blijven. Je TRMNL Games-account verwijderen wist Idle Angler samen met al het andere.</p>
    </>
  ),
  PaperLives: () => (
    <>
      <h2>Paper Lives</h2>
      <p>Paper Lives bewaart je huidige leven en je afgeronde levens: van elk personage de naam, voornaamwoorden, eigenschappen, statistieken, geld, baan en woning, de mensen in zijn leven, zijn verhaal en de keuzes die je maakte, plus de records en foto’s in het album en je prestaties. Je langste levens en grootste vermogens staan onder je openbare naam in de lijsten van Paper Lives en op de TRMNL-schermen van andere spelers. Tenzij je Paper Lives in de instellingen van Paper Lives verbergt op je openbare profiel, ziet iedereen met de link de naam, leeftijd, baan en eigenschappen van je huidige personage, hoeveel levens je hebt geleefd, je stamboom en je afgeronde levens, elk met grafschrift, hoogtepunten en foto’s. Personagenamen zijn op die pagina’s openbaar, dus houd gegevens van echte mensen erbuiten.</p>
      <p>Zet je meldingen van Paper Lives aan, dan gebruiken die dezelfde apparaten en stille uren als de meldingen van je andere spellen, en de melding toont de voornaam van je personage. De wekelijkse fotocode op je TRMNL hoort bij je installatie en wordt nooit in de app getoond.</p>
      <p>In de <Link to="/app/paper-lives/settings">instellingen van Paper Lives</Link> verwijdert Voortgang in Paper Lives verwijderen je levens, het album en de foto’s, lijstrecords, prestaties, Paper Lives-koppelingen en meldingsinstellingen van Paper Lives. Je account en andere spellen blijven. Je TRMNL Games-account verwijderen wist Paper Lives samen met al het andere.</p>
    </>
  ),
}
