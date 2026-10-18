import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const termsPl: LegalPage = {
  title: 'Warunki korzystania',
  seoTitle: 'Warunki',
  description: 'Zasady gry w Desk Crawler: darmowa gra udostępniana w obecnej postaci, z zasadami uczciwej gry i nazw publicznych.',
  translationNote: () => <p className="text-sm text-muted">Tłumaczenie wersji angielskiej, która jest rozstrzygająca w razie rozbieżności.</p>,
  Body: () => (
    <>
      <p>
        Te warunki dotyczą korzystania z TRMNL Games i jego gier, prowadzonych przez Barry’ego Michaela Doyle’a. Zakładając konto lub łącząc instalację TRMNL, akceptujesz je.
        Obowiązują razem z <Link to="/privacy">polityką prywatności</Link>.
      </p>

      <h2>Gra</h2>
      <ul>
        <li>Desk Crawler jest darmowy. Nie ma w nim zakupów, subskrypcji ani reklam.</li>
        <li>
          Gra zmienia się z czasem: balans, treści i funkcje mogą być zmieniane. Staramy się zachować postępy bohatera przy każdej aktualizacji, ale nie
          możemy tego zagwarantować.
        </li>
        <li>Możemy wstrzymać lub zakończyć usługę. Jeśli to możliwe, najpierw uprzedzimy o tym w aplikacji.</li>
      </ul>

      <h2>Twoje konto</h2>
      <ul>
        <li>Aby grać, musisz mieć co najmniej 13 lat.</li>
        <li>Dbaj o bezpieczeństwo swojego logowania. Odpowiadasz za to, co dzieje się przez twoje konto.</li>
        <li>
          Konto możesz usunąć w każdej chwili w zakładce <Link to="/account">Konto</Link>.
        </li>
      </ul>

      <h2>Uczciwa gra i nazwy publiczne</h2>
      <ul>
        <li>
          Nazwy publiczne i imiona bohaterów muszą być zgodne z <Link to="/support">zasadami nazw</Link>: żadnych treści nienawistnych ani seksualnych, gróźb, nękania, danych kontaktowych
          ani podszywania się.
        </li>
        <li>Nie automatyzuj gry, nie wykorzystuj błędów, nie zakłócaj działania usługi ani innym graczom i nie próbuj sięgać po cudze dane. Zamiast tego zgłaszaj błędy.</li>
        <li>
          Możemy ukryć nazwę albo zawiesić konto za celowe lub powtarzające się nadużycia. Ukrycie nazwy nigdy nie wpływa na postępy bohatera. Aby się odwołać, napisz na{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Złoto i przedmioty</h2>
      <p>Złoto, sprzęt i mikstury istnieją tylko w grze. Nie mają wartości pieniężnej i nie można ich sprzedawać, wymieniać ani przekazywać poza grą.</p>

      <h2>TRMNL</h2>
      <p>
        TRMNL Games i Desk Crawler to niezależne projekty. Nie są tworzone, popierane ani wspierane przez TRMNL. Twoje konto i urządzenie TRMNL podlegają własnym warunkom TRMNL.
      </p>

      <h2>Własność</h2>
      <p>
        Kod źródłowy jest otwarty na licencji MIT na{' '}
        <a href="https://github.com/barrymichaeldoyle/trmnl-games">GitHubie</a>. Grafiki, nazwy potworów, przedmiotów i miejsc, teksty gry oraz
        nazwa i logo Desk Crawler nie są objęte tą licencją i pozostają chronione wszystkimi prawami.
      </p>

      <h2>Brak gwarancji</h2>
      <p>
        TRMNL Games jest udostępniany w obecnej postaci, bez jakichkolwiek gwarancji. W granicach dozwolonych przez prawo nie odpowiadamy za utracone postępy, przerwy w działaniu usługi,
        to, co pojawia się na twoim urządzeniu, ani za żadne szkody pośrednie. Nic w tych warunkach nie odbiera ci praw konsumenta, których nie można wyłączyć.
      </p>

      <h2>Zmiany</h2>
      <p>Gdy te warunki się zmieniają, aktualizujemy tę stronę i datę na górze. Jeśli grasz dalej po zmianie, obowiązują nowe warunki.</p>

      <h2>Kontakt</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </>
  ),
}
