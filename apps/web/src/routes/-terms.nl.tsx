import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const termsNl: LegalPage = {
  title: 'Gebruiksvoorwaarden',
  seoTitle: 'Voorwaarden',
  description: 'De regels voor het spelen van Desk Crawler: een gratis spel, geleverd zoals het is, met regels voor eerlijk spel en openbare namen.',
  translationNote: () => <p className="text-sm text-muted">Vertaling van de Engelse versie, die bij verschillen voorgaat.</p>,
  Body: () => (
    <>
      <p>
        Deze voorwaarden gelden voor je gebruik van TRMNL Games en de spellen ervan, beheerd door Barry Michael Doyle. Door een account aan te maken of een TRMNL-installatie te koppelen ga je
        ermee akkoord. Ze gelden naast het <Link to="/privacy">privacybeleid</Link>.
      </p>

      <h2>Het spel</h2>
      <ul>
        <li>Desk Crawler is gratis. Er zijn geen aankopen, abonnementen of advertenties.</li>
        <li>
          Het spel verandert in de loop van de tijd: balans, inhoud en functies kunnen worden aangepast. We proberen de voortgang van je held bij elke update te behouden, maar we
          kunnen dat niet garanderen.
        </li>
        <li>We kunnen de dienst pauzeren of beëindigen. Waar dat kan, kondigen we het eerst aan in de app.</li>
      </ul>

      <h2>Je account</h2>
      <ul>
        <li>Je moet minstens 13 jaar oud zijn om te spelen.</li>
        <li>Houd je login veilig. Je bent verantwoordelijk voor wat er via je account gebeurt.</li>
        <li>
          Je kunt je account altijd verwijderen via <Link to="/account">Account</Link>.
        </li>
      </ul>

      <h2>Eerlijk spel en openbare namen</h2>
      <ul>
        <li>
          Openbare namen en heldennamen moeten de <Link to="/support">naamregels</Link> volgen: geen haatdragende of seksuele inhoud, bedreigingen of intimidatie, contactgegevens
          of nabootsing van anderen.
        </li>
        <li>Automatiseer het spel niet, misbruik geen bugs, verstoor de dienst of andere spelers niet en probeer niet bij gegevens te komen die niet van jou zijn. Meld bugs liever.</li>
        <li>
          We kunnen een naam verbergen, of een account schorsen bij opzettelijk of herhaald misbruik. Een naam verbergen heeft nooit invloed op de voortgang van je held. Bezwaar maken kan via{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Goud en voorwerpen</h2>
      <p>Goud, uitrusting en drankjes horen alleen bij het spel. Ze hebben geen geldwaarde en kunnen buiten het spel niet worden verkocht, geruild of overgedragen.</p>

      <h2>TRMNL</h2>
      <p>
        TRMNL Games en Desk Crawler zijn onafhankelijke projecten. Ze worden niet gemaakt, onderschreven of ondersteund door TRMNL. Voor je TRMNL-account en -apparaat gelden de eigen voorwaarden van TRMNL.
      </p>

      <h2>Eigendom</h2>
      <p>
        De broncode is open onder de MIT-licentie op{' '}
        <a href="https://github.com/barrymichaeldoyle/trmnl-games">GitHub</a>. De illustraties, de namen van monsters, voorwerpen en plaatsen, de geschreven speltekst en
        de naam en het logo van Desk Crawler vallen niet onder die licentie en blijven onder voorbehoud van alle rechten.
      </p>

      <h2>Geen garantie</h2>
      <p>
        TRMNL Games wordt geleverd zoals het is, zonder enige garantie. Voor zover de wet het toestaat, zijn we niet aansprakelijk voor verloren voortgang, onderbrekingen van de dienst,
        wat er op je apparaat verschijnt of indirecte schade. Niets in deze voorwaarden neemt rechten weg die je als consument hebt en die niet kunnen worden uitgesloten.
      </p>

      <h2>Wijzigingen</h2>
      <p>Als deze voorwaarden veranderen, werken we deze pagina en de datum bovenaan bij. Speel je na een wijziging verder, dan gelden de nieuwe voorwaarden.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </>
  ),
}
