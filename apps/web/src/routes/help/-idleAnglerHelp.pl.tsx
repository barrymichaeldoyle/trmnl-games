import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'
import { IDLE_ANGLER_HELP_HEAD } from './-helpHeads'

const w = anglerWords('pl')
const n = (value: number) => w.number(value)
const i = (parts: readonly string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} i ${parts.at(-1)}`)

export const pl: HelpPage = {
  seoTitle: IDLE_ANGLER_HELP_HEAD.pl.seoTitle,
  description: IDLE_ANGLER_HELP_HEAD.pl.description,
  title: 'Idle Angler na TRMNL',
  contents: {
    'getting-started': 'Pierwsze kroki',
    goals: 'Cele i co się kiedy otwiera',
    'how-fishing-works': 'Jak działa łowienie',
    'time-and-weather': 'Pora dnia, pogoda i pory roku',
    bait: 'Przynęta i martwa rybka',
    'the-fishmonger': 'Handlarz ryb',
    'the-cooler': 'Lodówka',
    'rods-and-fish-that-get-away': 'Wędki i ryby, które uciekają',
    waters: 'Łowiska',
    'the-logbook': 'Rejestr i tytuły',
    rankings: 'Rankingi i weekendowe zawody Open',
    'the-trophy-wall': 'Ściana trofeów',
    'the-fly-box': 'Pudełko na muchy',
    achievements: 'Osiągnięcia',
    alerts: 'Alerty',
    'pausing-and-removing': 'Wstrzymanie i usuwanie',
    help: 'Pomoc',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Pierwsze kroki</h2>
      <ul>
        <li>Zainstaluj Idle Angler z marketplace’u pluginów TRMNL i wybierz „Instaluj”.</li>
        <li>Zaloguj się w TRMNL Games i połącz instalację. Twój wędkarz nosi twoją nazwę publiczną.</li>
        <li>Wróć do TRMNL i kliknij „Zapisz”. W ciągu piętnastu minut twój wędkarz po raz pierwszy zarzuci i złowi rybę.</li>
        <li>Dodaj plugin do playlisty albo mashupu. Działają wszystkie cztery rozmiary układu, w obu orientacjach.</li>
      </ul>
      <h2 id="goals">Cele i co się kiedy otwiera</h2>
      <p>Pomost zawsze pokazuje jeden cel, na przykład „{w.goal('first_sale')}” albo „{w.goal('dawn_dusk')}”. Po jego osiągnięciu kilka monet czeka na odbiór: dotknij „Odbierz” na Pomoście, a pojawi się następny cel. Kropka na karcie Pomost mówi, że coś czeka. Cele nigdy nie wygasają, a mniej więcej połowę twój wędkarz osiąga bez ciebie.</p>
      <p>Gra otwiera się, w miarę jak wypełnia się rejestr: lepsze wędki i lodówki przy {F.unlocks.shop_upgrades} gatunkach, zamówienia handlarza ryb przy {F.unlocks.orders}, weekendowe zawody Open przy {F.unlocks.opens}, ściana trofeów przy {F.unlocks.trophies} i martwa rybka przy {F.unlocks.deadbait}. Pomost mówi, co będzie następne.</p>
      <h2 id="how-fishing-works">Jak działa łowienie</h2>
      <p>Co piętnaście minut, w dzień i w nocy, twój wędkarz zarzuca raz. Czasem ryba bierze. Jaka, zależy od łowiska, przynęty, pory dnia i pogody. Waga decyduje o cenie, o tym, czy to rekord osobisty, i o miejscu w rankingach. Twój TRMNL pokazuje scenę, najnowsze wpisy i tygodniowy ranking twojego łowiska. W aplikacji sprzedajesz ryby, kupujesz przynętę albo zmieniasz łowisko.</p>
      <h2 id="time-and-weather">Pora dnia, pogoda i pory roku</h2>
      <p>Świt trwa od 05:00 do 08:00, dzień do 17:00, zmierzch do 20:00, potem jest noc, w strefie czasowej, którą podaje twój TRMNL. O świcie i o zmierzchu ryby biorą częściej. Pogoda jest taka sama dla wszystkich wędkarzy na danym łowisku i zmienia się co sześć godzin: bezchmurnie, pochmurno, deszcz, wiatr albo mgła. Pochmurne niebo i deszcz dają więcej brań {w.waterName('river_bend').at}, wiatr mniej, a mgła sprawia, że świt i zmierzch są dość ciemne dla nocnych ryb.</p>
      <p>Łowiska mają własne pory roku, wspólne dla wszystkich: wiosnę, lato, jesień i zimę, każda po tygodniu, z wymianą w każdy poniedziałek o 00:00 UTC. Niektóre ryby biorą tylko w jednej porze roku, w słodkiej wodzie zimą jest spokojniej, a na scenie widać kwiaty, liście albo śnieg. Każda pora roku ma swoją wędrówkę, od poniedziałku do czwartku, gdy pojawia się jeden gatunek: {i(F.runs.map((id) => w.species(id).toLowerCase()))}.</p>
      <h2 id="bait">Przynęta i martwa rybka</h2>
      <p>Każde łowisko ma swoje przynęty, a przynęta decyduje, które ryby mogą brać; Sklep mówi, które ryby biorą na którą. Przynętę wybierasz na stronie Pomostu. Każda ryba, którą zatrzymasz albo która ucieknie, zużywa jedną przynętę. Rzut bez brania nie zużywa żadnej, tak samo ryba wypuszczona przy pełnej lodówce. Bez przynęty na dane łowisko wędkarz łowi na goły haczyk, który daje mniej brań i tylko małe ryby. Przynętę kupujesz w pudełkach w Sklepie, maksymalnie {F.baitCap} każdej; przynęta się nie psuje.</p>
      <p>Małe ryby, na przykład płoć, jelec, ukleja i makrela, mogą wrócić z lodówki na haczyk jako martwa rybka: jedna ryba daje {F.deadbaitPerFish} przynęty, maksymalnie {F.deadbaitCap} w zapasie. Na martwą rybkę biorą tylko drapieżniki, na przykład okoń, szczupak, sandacz, węgorz i duże ryby morskie, i są wtedy cięższe.</p>
      <h2 id="the-fishmonger">Handlarz ryb</h2>
      <p>Handlarz ryb wywiesza {F.orderSlots} zamówienia, na przykład „{w.text('Two Roach')}” albo „{w.text('One fish over 1.5 kg')}”. Gdy ryby z twojej lodówki pasują do zamówienia, handlarz pojawia się na stronie Lodówki z tymi rybami i przyciskiem „Sprzedaj”: płaci 1,5 raza cenę rynkową plus premię, a strona pokazuje obie ceny. Zamówienia nigdy nie wygasają, a puste miejsce zapełnia się o 07:00 twojego czasu. Twój wędkarz nie wybiera, co złowi, więc handlarz pojawia się tylko wtedy, gdy jest mu co sprzedać.</p>
      <h2 id="the-cooler">Lodówka</h2>
      <p>Ryby trafiają do lodówki, dopóki ich nie sprzedasz. Gdy jest pełna, wędkarz łowi dalej i wypuszcza to, co złowi. Wypuszczone ryby i tak trafiają do rejestru, liczą się do osiągnięć i mogą prowadzić w rankingach, ale nie dają monet. Twój TRMNL pokazuje, kiedy lodówka jest pełna, a jego kod QR otwiera lodówkę. Większa lodówka to mniej wypuszczonych ryb między wizytami. Gra nigdy nie sprzedaje ryb za ciebie.</p>
      <h2 id="rods-and-fish-that-get-away">Wędki i ryby, które uciekają</h2>
      <p>Każda wędka wyciąga ryby do określonej wagi. Cięższa ryba się zrywa, a wpis mówi, że coś ciężkiego odpłynęło. Lepsza wędka by ją wyciągnęła. Lepsze wędki dają też trochę więcej brań.</p>
      <h2 id="waters">Łowiska</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong>: tu wszyscy zaczynają. Płocie, okonie i leszcze, karpie o świcie i o zmierzchu, węgorze nocą.</li>
        <li><strong>{w.water('river_bend')}</strong>: otwiera się, gdy w rejestrze jest {F.gates.river_bend} gatunków {w.waterName('millpond').of}. Potrzebne: {w.pass('waders')}. Pstrągi, klenie i brzany, a na błystkę szczupaki i sandacze.</li>
        <li><strong>{w.water('harbour_pier')}</strong>: otwiera się, gdy w rejestrze jest {F.gates.harbour_pier} gatunków {w.waterName('river_bend').of}. Potrzebne: {w.pass('pier_permit')}. Ryby morskie, większe i cenniejsze. Większość wymaga co najmniej tej wędki: {w.rod('Carbon Rod')}.</li>
        <li><strong>{w.water('heron_lake')}</strong>: otwiera się, gdy w rejestrze jest {F.gates.heron_lake} gatunków {w.waterName('river_bend').of}. Potrzebne: {w.pass('rowing_boat')}. Duże karpie na kulki proteinowe i sumy w letnie noce.</li>
        <li><strong>{w.water('deep_sea')}</strong>: otwiera się, gdy w rejestrze jest {F.gates.deep_sea} gatunków {w.waterName('harbour_pier').of}. Bilet ze Sklepu daje {F.charter.casts} rzutów na morzu za {n(F.charter.price)} monet; łódź odwozi cię na molo, gdy się skończą, a niewykorzystane rzuty zostają na bilecie. Największe ryby wymagają tej wędki: {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong>: otwiera się, gdy w rejestrze jest {F.gates.frozen_tarn} gatunków {w.waterName('heron_lake').of}, i tylko w zimowym tygodniu. Potrzebne: {w.pass('ice_auger')}. Gdy lód topnieje, wędkarz wraca pieszo {w.waterName('heron_lake').to}.</li>
      </ul>
      <p>Przejście kosztuje jeden rzut, potem wędkarz łowi na nowym łowisku. Jeśli twoja przynęta tam się nie nadaje, wędkarz bierze pasującą przynętę, której masz najwięcej. Możesz wrócić, kiedy chcesz.</p>
      <h2 id="the-logbook">Rejestr i tytuły</h2>
      <p>Każdy złowiony gatunek trafia do rejestru z liczbą sztuk i twoją najlepszą wagą, a rejestr mówi, jaką przynętę, porę i pogodę lubi. Ryby, których jeszcze nie ma w rejestrze, widać jako sylwetki z ich przynętą, oprócz epickich. Epickie ryby wymagają naraz właściwej przynęty, godziny i pogody, a niektóre biorą tylko w jednej porze roku.</p>
      <p>Rejestr to twoja droga naprzód. Nowe gatunki otwierają kolejne łowisko i funkcje opisane wyżej oraz dają tytuł: {F.titles.map((t) => `${w.title(t.id)} przy ${t.species} gatunkach`).join(', ')}. Wszyscy zaczynają z tytułem {w.title(F.firstTitle)}. Idle Angler nie ma XP ani poziomów.</p>
      <p>Każde łowisko ma też własną rangę: {F.ranks.map((r) => w.lang.waterRanks[r]).join(', ')}, zależnie od tego, jaką część jego gatunków masz w rejestrze. {w.lang.waterRanks.master} wymaga wszystkich gatunków stamtąd, także sezonowych gości i ryby epickiej. TRMNL pokazuje twoją rangę na łowisku, na którym łowisz, z kreskami za brakujące gatunki.</p>
      <h2 id="rankings">Rankingi i weekendowe zawody Open</h2>
      <p>Każde łowisko ma swój ranking: najcięższa ryba, jaką każdy wędkarz tam złowił, zatrzymana albo wypuszczona. Jeden ranking trwa tydzień i zaczyna się od nowa w każdy poniedziałek o 00:00 UTC; drugi trzyma rekordy wszech czasów. Twój TRMNL pokazuje tygodniowy ranking łowiska, na którym łowisz, a aplikacja wszystkie.</p>
      <p>W każdy weekend, od soboty 00:00 do niedzieli 23:59 UTC, każde łowisko organizuje zawody Open na jeden gatunek, podany na stronie Rankingi. Złów tę rybę na tym łowisku, żeby się zgłosić; liczy się najcięższa. W poniedziałek trzy najlepsze osoby z każdego łowiska dostają medal i {i(F.prizes.map(n))} monet, a każdy uczestnik rozetę.</p>
      <h2 id="the-trophy-wall">Ściana trofeów</h2>
      <p>Rybę o wadze co najmniej {F.trophies.minPercent}% rekordu jej gatunku możesz wypchać z lodówki zamiast ją sprzedać. Kosztuje to wartość ryby plus {F.trophies.fee} monet. Na ścianie jest na początku {F.trophies.firstPegs} haczyków, a zmieści się do {F.trophies.maxPegs}; kolejne haczyki są na stronie ściany. Medale i rozety stoją na półce, a twoja strona publiczna pokazuje ścianę, gdy jest publiczna.</p>
      <h2 id="the-fly-box">Pudełko na muchy</h2>
      <p>Co tydzień twój TRMNL pokazuje sześciocyfrowy kod muchy obok kodu QR i na pasku tytułu. Zeskanuj kod QR albo wpisz kod na stronie Rejestru, żeby dodać muchę tygodnia do pudełka. Twój wędkarz nosi najnowszą na kapeluszu. Jedna mucha na tydzień: nowy kod przychodzi w każdy poniedziałek o 00:00 UTC, a kod z poprzedniego tygodnia działa do kolejnego poniedziałku, na wypadek gdyby ekran odświeżył się późno. Po wszystkich {F.flies} muchach wzory wracają. Muchy niczego nie zmieniają w łowieniu.</p>
      <h2 id="achievements">Osiągnięcia</h2>
      <p>Osiągnięcia mają poziomy, za łowienie, rejestr, sprzęt i łowiska, handel i każdy gatunek. Strona Osiągnięcia w zakładce Więcej pokazuje twoje poziomy, jaka część wędkarzy ma każdy z nich i ile brakuje do następnego. Twój profil publiczny je pokazuje, gdy jest na nim Idle Angler.</p>
      <h2 id="alerts">Alerty</h2>
      <p>Włącz alerty w Ustawieniach na stronie Więcej, a ten telefon dostanie powiadomienie, gdy lodówka się zapełni albo wędkarzowi skończy się przynęta. Są wyłączone, dopóki ich nie włączysz, i dostajesz najwyżej dwa dziennie ze wszystkich swoich gier.</p>
      <h2 id="pausing-and-removing">Wstrzymanie i usuwanie</h2>
      <p>Wstrzymaj łowienie w Ustawieniach na stronie Więcej: do wznowienia nie ma połowów, a wszystko zostaje. Usunięcie pluginu z TRMNL zostawia twojego wędkarza. Usunięcie postępów w Idle Angler w Ustawieniach kasuje wędkarza, lodówkę i rejestr, a twoje konto i inne gry zostają.</p>
      <h2 id="help">Pomoc</h2>
      <p>Napisz na <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, co pokazuje twój ekran i kiedy ostatnio się zmienił.</p>
    </>
  ),
}
