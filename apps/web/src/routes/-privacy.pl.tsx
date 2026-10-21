import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'
import { PRIVACY_HEAD } from './-legalHeads'

export const privacyPl: LegalPage = {
  title: PRIVACY_HEAD.pl.title,
  description: PRIVACY_HEAD.pl.description,
  translationNote: () => <p className="text-sm text-muted">Tłumaczenie wersji angielskiej, która jest rozstrzygająca w razie rozbieżności.</p>,
  Body: () => (
    <>
      <p>
        TRMNL Games to zbiór gier prowadzony przez Barry’ego Michaela Doyle’a, niezależnego twórcę. Ta strona prostym językiem opisuje, co przechowuje usługa, kto przetwarza te dane i
        jak je usunąć. Pytania kieruj na <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Co jest publiczne</h2>
      <p>
        Twoja nazwa publiczna, imię i poziom bohatera oraz twoje miejsca w rankingach pojawiają się w rankingach i na ekranach TRMNL innych graczy. Wybierz nazwę publiczną, którą
        chcesz się dzielić, i nigdy nie umieszczaj w niej danych kontaktowych.
      </p>
      <p>
        W Desk Crawler bohaterowie robią sobie nawzajem rajdy na biurka i spotykają się przypadkiem. Gdy twój bohater robi rajd, jest jego celem albo spotyka innego bohatera, twoja nazwa publiczna pojawia się w dzienniku przygód drugiego gracza, w aplikacji i na jego TRMNL, tak jak już pojawia się w rankingach. Gdy twój bohater dostanie nokaut, może zgubić zapasowy przedmiot z twoją nazwą publiczną, który bohater innego gracza może znaleźć i zatrzymać; twoja nazwa jest wtedy widoczna na tym przedmiocie w jego aplikacji i na jego stronie bohatera. Jeśli zmienisz nazwę lub usuniesz konto, te historie i przedmioty pokazują „Ukryty gracz” albo tracą nazwę.
      </p>
      <p>
        Twój bohater w Desk Crawler ma stronę publiczną: każdy, kto ma link, widzi twoją nazwę publiczną, imię bohatera, jego poziom, miejsce w rankingu, obecne piętro i datę rozpoczęcia, kilka liczników oraz twoje osiągnięcia. Złoto, dziennik przygód i dane konta pozostają prywatne, podobnie jak twój sprzęt, z wyjątkiem zapasów innych graczy, które trzyma twój bohater i które są widoczne z ich podpisami. Strona jest domyślnie włączona. Opcja „Ukryj moją stronę bohatera” w Ustawieniach od razu ją ukrywa, a pokazać ją ponownie możesz w każdej chwili.
      </p>
      <p>
        Zalogowani gracze mogą obserwować publiczną stronę bohatera. Przechowujemy, kto kogo obserwuje, aby ich aplikacja mogła wymienić obserwowanych graczy. Nikt nie dostaje powiadomienia, że jest obserwowany, a żadna strona nie pokazuje, kto obserwuje gracza. Jeśli zmienisz nazwę publiczną, ukryjesz stronę lub usuniesz postępy, inni gracze przestają widzieć twojego bohatera na swojej liście, a usunięcie kasuje te zapisy.
      </p>

      <h2>Co przechowujemy</h2>
      <ul>
        <li>Twoją tożsamość logowania z Clerk, naszego dostawcy logowania. Twój e-mail jest kopiowany tylko do krótkotrwałych próśb o potwierdzenie usunięcia; nie kopiujemy do bazy gry twojego prawdziwego imienia ani zdjęcia profilowego.</li>
        <li>Twoją nazwę publiczną, bohatera, przedmioty, dziennik przygód i niedawne XP używane w rankingach. Starsze konta mogą mieć też zapisaną strefę czasową z poprzednich wersji.</li>
        <li>Jeśli włączysz alerty Desk Crawler: które alerty chcesz, twoje godziny ciszy i strefę czasową przeglądarki (na przykład Europe/Warsaw), a dla każdego urządzenia, na które zezwolisz, adres push przekazany przez przeglądarkę, jego klucze szyfrowania i etykietę w rodzaju „Chrome on Android”. Prowadzimy też krótki zapis każdego alertu: jakiego rodzaju, kiedy i czy został wysłany.</li>
        <li>
          Dla każdej instalacji TRMNL: identyfikator instancji pluginu, skrót (hash) jego tokenu dostępu i link do ustawień, który daje nam TRMNL. Nie przechowujemy twojej nazwy
          ani e-maila z TRMNL.
        </li>
        <li>Przesunięcie strefy czasowej, które TRMNL wysyła z każdym ekranem (na przykład UTC+2), aby poranny stand-up w Desk Crawler podążał za twoim dniem. Przechowujemy tylko ostatnie.</li>
        <li>Ustawienie języka, które TRMNL wysyła z każdym ekranem (na przykład pl-PL), aby wiedzieć, na które języki warto tłumaczyć gry, i aby ekran mógł używać twojego języka. Przechowujemy tylko ostatnie.</li>
        <li>Jeśli wybierzesz język dla TRMNL Games, ten wybór, aby używały go też twoje ekrany TRMNL i alerty.</li>
        <li>Krótkotrwałe zapisy techniczne, takie jak liczniki limitów i potwierdzenia zduplikowanych żądań.</li>
        <li>Gdy prosisz o usunięcie konta: twój zweryfikowany główny e-mail, skrót linku potwierdzającego i stan doręczenia. Link wygasa po 30 minutach; wygasłe prośby są usuwane podczas codziennego sprzątania.</li>
        <li>Lista premierowa Desk Crawler zawierała adresy e-mail na potrzeby jednego maila, wysłanego, gdy Desk Crawler trafi do sklepu TRMNL. Ten mail wyszedł 13 października 2026, wszystkie adresy zostały usunięte, a lista jest zamknięta.</li>
        <li>Lista premierowa Idle Angler przechowuje, na potrzeby jednego maila w dniu, gdy Idle Angler trafi do marketplace’u TRMNL: dla zalogowanego gracza, który kliknie „Powiadom mnie”, powiązanie z jego kontem i język (adres jest odczytywany z konta przy wysyłce); dla pozostałych osób wpisany adres e-mail i język. Każdy wpis jest usuwany po wysłaniu jego maila, a z listy można się wypisać w każdej chwili na stronie głównej lub z maila.</li>
        <li>Przypomnienie o bohaterze: jeśli twój bohater w Desk Crawler działa od dwóch dni, a aplikacja Desk Crawler nie została ani razu otwarta, wysyłamy jeden mail na twój zweryfikowany główny adres z informacją, co tam czeka, i linkiem do rezygnacji. Adres jest pobierany z Clerk w chwili wysyłki i nie jest przechowywany. Zapisujemy tylko datę wysyłki albo to, że nie chcesz takich maili.</li>
        <li>Jeśli wyślesz opinię: twoją wiadomość, stronę, z której ją wysłano, twoją nazwę publiczną i link do konta. Trafia ona e-mailem do twórcy, z twoim zweryfikowanym głównym e-mailem jako adresem odpowiedzi.</li>
      </ul>

      <h2>Czego nie robimy</h2>
      <p>Żadnych reklam i żadnej sprzedaży ani udostępniania twoich danych w celach marketingowych. W grze nie ma zakupów, więc nie przechowujemy danych płatniczych.</p>

      <h2>Opcjonalna analityka i wsparcie</h2>
      <p>Jeśli zgodzisz się na analitykę, PostHog zapisuje odwiedzane strony, kroki instalacji, nieudane akcje w grze i błędy przeglądarki. Po zalogowaniu te zapisy są łączone z twoim identyfikatorem konta Clerk, adresem e-mail, nazwą publiczną i imieniem bohatera, abyśmy mogli badać zgłoszenia i naprawiać problemy. Błędy przeglądarki trafiają też do Sentry, bez twojego konta, e-maila i adresu IP.</p>
      <p>PostHog nagrywa też zamaskowane sesje, abyśmy widzieli, gdzie coś się zacina. Teksty i pola formularzy są maskowane, dane logowania i konta są blokowane, a nie nagrywamy treści ani nagłówków żądań sieciowych ani wyjścia konsoli. Kody instalacji, tokeny dostępu, tokeny JWT zarządzania i parametry zapytań w adresach URL są wyłączone.</p>
      <p>Możesz odmówić i grać dalej. Zmienisz wybór w Ustawieniach analityki w stopce strony. Wyłączenie analityki zatrzymuje nowe zbieranie w tej przeglądarce; nie kasuje wcześniejszych zapisów. Napisz do nas, aby je usunąć, albo usuń konto TRMNL Games, aby poprosić o usunięcie powiązanego profilu PostHog, zdarzeń i nagrań.</p>

      <h2>Pliki cookie</h2>
      <p>
        Clerk ustawia pliki cookie, które utrzymują cię zalogowanym. Gdy łączysz lub zarządzasz instalacją TRMNL, ustawiamy krótkotrwały zaszyfrowany plik cookie, który wygasa
        w ciągu kilku minut. Link potwierdzający usunięcie używa krótkotrwałego zaszyfrowanego pliku cookie, abyś mógł się zalogować przed potwierdzeniem. Jeśli zgodzisz się na analitykę, PostHog używa pamięci lokalnej przeglądarki, aby rozpoznawać twoje wizyty. Lokalnie zapisujemy też twój wybór dotyczący analityki, a plik cookie pamięta wybrany język. Nie ma reklamowych plików cookie.
      </p>

      <h2>Usługi, które przetwarzają twoje dane</h2>
      <ul>
        <li>
          <strong>Clerk</strong> obsługuje logowanie i przechowuje twój adres e-mail i metodę logowania, a także profil Google lub GitHub, jeśli logujesz się przez któryś z nich.
        </li>
        <li>
          <strong>Convex</strong> hostuje bazę danych gry, aktualizacje gry co 15 minut i codzienne kopie zapasowe.
        </li>
        <li>
          <strong>Cloudflare</strong> hostuje tę stronę i prowadzi standardowe logi żądań.
        </li>
        <li>
          <strong>TRMNL</strong> pobiera od nas ekran twojego bohatera. Twoje konto i urządzenie TRMNL podlegają polityce prywatności TRMNL.
        </li>
        <li><strong>PostHog EU</strong> obsługuje opcjonalną analitykę użycia, raporty błędów i zamaskowane nagrania sesji na potrzeby wsparcia i ulepszania produktu.</li>
        <li><strong>Sentry</strong> (Stany Zjednoczone) dostaje raporty błędów z serwera naszej strony i backendu gry, a także z twojej przeglądarki, jeśli zgodzisz się na analitykę, abyśmy mogli znajdować i naprawiać błędy. Raport zawiera ścieżkę strony lub nazwę funkcji gry, która zawiodła, oraz techniczne szczegóły błędu. Nigdy nie zawiera twojego konta, adresu e-mail, adresu IP, plików cookie, treści formularzy, parametrów zapytań w adresach URL ani kodów i tokenów instalacji.</li>
        <li><strong>Usługa push twojej przeglądarki</strong> (Google dla Chrome i Androida, Apple dla Safari, Mozilla dla Firefoksa) dostarcza alerty Desk Crawler, jeśli je włączysz. Dostaje alert zaszyfrowany, więc nie może go odczytać, razem z adresem push utworzonym przez przeglądarkę.</li>
        <li><strong>Resend</strong> dostarcza mail z potwierdzeniem usunięcia konta na twój zweryfikowany główny adres, mail premierowy (wysłany raz, 13 października 2026) oraz opinie, które wysyłasz twórcy. Dostaje te adresy i treść maili. Dostarcza też jedyne przypomnienie o bohaterze.</li>
      </ul>

      <h2>Jak długo przechowujemy dane</h2>
      <ul>
        <li>Wspólne konto: dopóki go nie usuniesz. Postępy w grze: dopóki nie usuniesz tej gry albo konta.</li>
        <li>Szczegółowy dziennik przygód: trzy dni. Podsumowania przebiegów: 30 dni. Niedawne XP do rankingów: siedem dni.</li>
        <li>Potwierdzenia zduplikowanych żądań: 24 godziny. Próby połączenia z TRMNL: krócej niż dobę.</li>
        <li>Lista premierowa: usunięta po wysłaniu maila premierowego 13 października 2026. Nie przechowujemy żadnej kopii.</li>
        <li>Lista premierowa Idle Angler: każdy wpis jest usuwany po wysłaniu jego maila premierowego, gdy opuścisz listę, albo razem z kontem.</li>
        <li>Przypomnienie o bohaterze: data wysyłki albo twoja rezygnacja, do usunięcia konta.</li>
        <li>Opinie: dopóki nie usuniesz konta albo krócej na prośbę. Kopie wysłane już e-mailem do twórcy usuwamy na prośbę.</li>
        <li>Ustawienia alertów i urządzenia: dopóki nie wyłączysz alertów, nie usuniesz urządzenia albo nie usuniesz Desk Crawler lub konta. Urządzenie, którego adres push przestaje działać, jest usuwane automatycznie. Zapisy pojedynczych alertów: siedem dni.</li>
        <li>Kopie zapasowe: mniej więcej tydzień, po którym usunięte dane znikają i z nich.</li>
        <li>Zamaskowane nagrania: 30 dni. Zdarzenia analityczne i profile wsparcia: do usunięcia konta albo wcześniejszej prośby o usunięcie.</li>
        <li>Raporty błędów w Sentry: do 90 dni. Nie są powiązane z twoim kontem, więc usunięcie konta nie ma tam nic do usunięcia.</li>
      </ul>

      <h2>Usuwanie konta</h2>
      <p>
        Przejdź do zakładki <Link to="/account">Konto</Link> i poproś o link do usunięcia. Wyślemy go na twój zweryfikowany główny adres; link wygasa po 30 minutach. Zaloguj się na to samo konto i wpisz DELETE na stronie potwierdzenia. Dopóki nie potwierdzisz, konto pozostaje aktywne. Po potwierdzeniu konto od razu przestaje działać, twoja nazwa publiczna znika z
        rankingów, a następnie usuwamy twojego bohatera, przedmioty, historię, połączenia z TRMNL i logowanie do TRMNL Games. Migawki rankingów, które skopiowały twoją nazwę,
        są zastępowane w ciągu mniej więcej dwóch godzin. Jeśli nie możesz się zalogować, napisz do nas, a zrobimy to za ciebie.
      </p>
      <p>
        Przechowujemy tylko jednokierunkowy skrót twojej tożsamości logowania i starych tokenów TRMNL, aby usuniętego konta nie dało się po cichu ponownie połączyć. Obrazów już
        wysłanych na urządzenie TRMNL lub zapisanych w pamięci podręcznej TRMNL nie możemy skasować; usuń plugin z playlisty, aby je zastąpić. Liczniki limitów są usuwane podczas usuwania konta, a odniesienia do konta w administracyjnych zapisach audytu są czyszczone.
      </p>
      <p>Usunięcie powiązanych profili, zdarzeń i nagrań w PostHog jest zlecane w ramach usuwania konta i realizowane przez PostHog asynchronicznie. Nieudane żądania są ponawiane i pozostają widoczne dla operatora, dopóki nie zostaną rozwiązane.</p>

      <h2>Usuwanie tylko jednej gry</h2>
      <p>W <Link to="/app/desk-crawler/settings">ustawieniach Desk Crawler</Link> wybierz „Usuń postępy w Desk Crawler”, aby usunąć tego bohatera, historię, połączenia oraz ustawienia i urządzenia alertów. Wspólne konto i logowanie pozostają dostępne. Po zakończeniu usuwania możesz zacząć od nowa, instalując plugin. Inne gry pozostają bez zmian.</p>

      <h2>Twoje wybory</h2>
      <p>
        Możesz poprosić o kopię swoich danych z gry albo o poprawienie lub usunięcie czegoś, pisząc na <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Staramy się odpowiadać w ciągu dwóch dni roboczych.
      </p>

      <h2>Dzieci</h2>
      <p>TRMNL Games nie jest przeznaczone dla dzieci poniżej 13 lat i świadomie nie przechowujemy ich danych. Jeśli uważasz, że dziecko ma konto, napisz do nas, a je usuniemy.</p>

      <h2>Zmiany</h2>
      <p>Gdy ta polityka się zmienia, aktualizujemy tę stronę i datę na górze.</p>
    </>
  ),
  IdleAngler: () => (
    <>
      <h2>Idle Angler</h2>
      <p>Idle Angler przechowuje twojego wędkarza: monety, łowisko i przynętę, lodówkę, rejestr gatunków i najlepszych wag, historię połowów, najcięższą rybę z każdego łowiska i każdych weekendowych zawodów Open, zamówienia rybaka, ścianę trofeów i medale, osiągnięcia i pudełko na muchy. Twoje najcięższe ryby pojawiają się pod twoją nazwą publiczną w rankingach i wynikach zawodów Open w Idle Angler oraz na ekranach TRMNL innych graczy. Jeśli nie ukryjesz Idle Angler w profilu publicznym w ustawieniach Idle Angler, każdy, kto ma link, widzi twój tytuł, datę rozpoczęcia, liczbę osiągnięć, zapisane gatunki, liczbę medali i ryby na twojej ścianie trofeów.</p>
      <p>Jeśli włączysz alerty Idle Angler, korzystają z tych samych urządzeń i godzin ciszy co alerty innych twoich gier. Cotygodniowy kod muchy na twoim TRMNL jest powiązany z instalacją i nigdy nie pojawia się w aplikacji.</p>
      <p>W <Link to="/app/idle-angler/settings">ustawieniach Idle Angler</Link> opcja „Usuń postępy w Idle Angler” usuwa twojego wędkarza, lodówkę, rejestr, wpisy w rankingach i zawodach Open, ścianę trofeów i medale, pudełko na muchy, osiągnięcia, połączenia Idle Angler i ustawienia alertów Idle Angler. Konto i inne gry zostają. Usunięcie konta TRMNL Games usuwa Idle Angler razem z całą resztą.</p>
    </>
  ),
  PaperLives: () => (
    <>
      <h2>Paper Lives</h2>
      <p>Paper Lives przechowuje twoje obecne życie i te zakończone: imię każdej postaci, zaimki, cechy, statystyki, pieniądze, pracę i dom, ludzi w jej życiu, jej historię i twoje wybory, a także zapisy i zdjęcia z albumu oraz twoje osiągnięcia. Twoje najdłuższe życia i największe fortuny pojawiają się pod twoją nazwą publiczną w tabelach Paper Lives i na ekranach TRMNL innych graczy. Jeśli nie ukryjesz Paper Lives w profilu publicznym w ustawieniach Paper Lives, każdy, kto ma link, widzi imię, wiek, pracę i cechy obecnej postaci, liczbę przeżytych żyć, drzewo genealogiczne i zakończone życia, każde z epitafium, najważniejszymi chwilami i zdjęciami. Imiona postaci są publiczne na tych stronach, więc nie umieszczaj w nich danych prawdziwych osób.</p>
      <p>Jeśli włączysz alerty Paper Lives, korzystają z tych samych urządzeń i godzin ciszy co alerty innych twoich gier, a alert pokazuje imię twojej postaci. Cotygodniowy kod zdjęcia na twoim TRMNL jest powiązany z instalacją i nigdy nie pojawia się w aplikacji.</p>
      <p>W <Link to="/app/paper-lives/settings">ustawieniach Paper Lives</Link> opcja „Usuń postępy w Paper Lives” usuwa twoje życia, album i jego zdjęcia, wpisy w tabelach, osiągnięcia, połączenia Paper Lives i ustawienia alertów Paper Lives. Konto i inne gry zostają. Usunięcie konta TRMNL Games usuwa Paper Lives razem z całą resztą.</p>
    </>
  ),
}
