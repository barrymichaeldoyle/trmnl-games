import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'

const t = contentTranslator('pl')
const n = (value: number) => t.number(value)
const zloto = (value: number) => `${n(value)} złota`
const i = (parts: readonly string[], last = 'i') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
// Polish names stay in the nominative, so a sentence names a floor or item after a colon or in brackets.
const name = (english: string) => t.name(english)
const rungs = (list: readonly { name: string; size: number; price: number }[]) => i(list.map((rung) => `${name(rung.name)} (${rung.size}) za ${zloto(rung.price)}`))
const price = (c: Cost) => `${i(c.materials.map((m) => `${name(m.name).toLowerCase()} ×${m.n}`))} oraz ${zloto(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `atak ${signed(m.attackPct)}%` : '', m.defensePct ? `obrona ${signed(m.defensePct)}%` : '', m.xpPct ? `XP z wygranych ${signed(m.xpPct)}%` : '', m.goldPct ? `złoto ${signed(m.goldPct)}%` : '', m.trapDamagePct ? `pułapki ranią o ${m.trapDamagePct}% słabiej` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = i(F.floors.filter((b) => b.level > 1).map((b) => `${name(b.name)} na poziomie ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` Pojawia się na poziomie ${F.unlocks[feature]}.`)
/** Rarities in the genitive, after "ze sprzętu". */
const rarityPl: Record<string, string> = { common: 'pospolitego', uncommon: 'niepospolitego', rare: 'rzadkiego', epic: 'epickiego' }

// Dates in the genitive ("12 października"), weekdays in the nominative after a colon-free "pierwszy poniedziałek".
const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
const FEMININE_DAYS = new Set([0, 3, 6])
const NTH_M = ['pierwszy', 'drugi', 'trzeci', 'czwarty', 'piąty']
const NTH_F = ['pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta']
const nth = (index: number, weekday: number) => (FEMININE_DAYS.has(weekday) ? NTH_F : NTH_M)[index]!
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, przez ${rule.days} dni` : ''
  switch (date.kind) {
    case 'fixed':
      return `${date.day} ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const base = `${nth(date.nth - 1, date.weekday)} ${WEEKDAYS[date.weekday]} ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      return `${offset === 0 ? base : `${WEEKDAYS[(date.weekday + offset) % 7]} po dniu: ${base}`}${span}`
    }
    case 'friday_13th':
      return 'każdy piątek 13.'
    case 'easter':
      return date.offsetDays === -2 ? 'od Wielkiego Piątku do Poniedziałku Wielkanocnego' : `${Math.abs(date.offsetDays)} dni ${date.offsetDays < 0 ? 'przed' : 'po'} Niedzieli Wielkanocnej${span}`
    case 'table': {
      const next = nextTableDate(date.dates)
      return next === null ? 'data zmienia się co roku' : `data zmienia się co roku (najbliższa: ${next.getUTCDate()} ${MONTHS[next.getUTCMonth()]} ${next.getUTCFullYear()})`
    }
  }
}

export const pl: HelpPage = {
  seoTitle: 'Desk Crawler: pomoc i instalacja',
  description: 'Jak zainstalować Desk Crawler na TRMNL i jak działa każda część gry, z rozwiązaniami na wypadek, gdy ekran wydaje się nieaktualny.',
  title: 'Desk Crawler na TRMNL',
  contents: {
    'getting-started': 'Pierwsze kroki', 'if-the-qr-sends-you-back-to-setup': 'Gdy kod QR odsyła do instalacji', 'how-time-works': 'Jak płynie czas', floors: 'Piętra', 'desk-keepsakes': 'Pamiątki z biurka', career: 'Kariera', 'heroes-and-classes': 'Bohaterowie i klasy', stances: 'Postawy', 'desk-raids': 'Rajdy na biurka', meetings: 'Spotkania', 'lost-property': 'Rzeczy znalezione', 'to-do-list': 'Lista zadań', potions: 'Mikstury', 'the-wandering-merchant': 'Wędrowny kupiec', decisions: 'Decyzje', effects: 'Efekty', 'office-calendar': 'Kalendarz biura', 'rare-and-epic-gear': 'Rzadki i epicki sprzęt', 'when-your-bag-fills-up': 'Gdy torba się zapełni', 'bigger-bags': 'Większe torby', 'salvage-and-the-workbench': 'Rozbiórka i warsztat', 'getting-knocked-out': 'Nokaut', recaps: 'Podsumowania', 'understanding-rankings': 'Jak działają rankingi', 'sharing-your-hero': 'Udostępnianie bohatera', 'following-and-rivals': 'Obserwowani i rywale', names: 'Nazwy', gender: 'Płeć', alerts: 'Alerty', troubleshooting: 'Rozwiązywanie problemów', 'disconnecting-and-removing': 'Odłączanie i usuwanie', help: 'Pomoc',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Pierwsze kroki</h2>
      <ul>
        <li>Otwórz <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler w sklepie TRMNL</a> i wybierz „Instaluj”.</li>
        <li>Zaloguj się do Desk Crawler, wybierz nazwę publiczną i imię bohatera, a potem połącz instalację.</li>
        <li>Wróć do TRMNL i kliknij „Zapisz”. Pierwsza przygoda bohatera zacznie się w ciągu 15 minut.</li>
        <li>Dodaj plugin do playlisty albo do mashupu, jeśli chcesz mieć bohatera obok innych pluginów. Obsługiwane są wszystkie cztery rozmiary układu.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">Gdy kod QR odsyła do instalacji</h2>
      <p>Kod QR otwiera aplikację dla konta, na które jesteś zalogowany. Nie zaczyna nowej instalacji. Sprawdź adres e-mail zalogowanego konta na stronie instalacji i użyj opcji „Przełącz konto”, jeśli pierwotnie łączyłeś się z innego konta.</p>
      <p>Jeśli instalacja mówi „Połącz ponownie Desk Crawler”, połączenie z TRMNL istnieje, ale brakuje bohatera. Może się tak zdarzyć po resecie gry przed premierą. Zainstaluj nową kopię <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler z TRMNL</a>, zaloguj się na to samo konto, wybierz nowe imię bohatera, połącz i kliknij „Zapisz” w TRMNL. Gdy nowa kopia zadziała, usuń starą z playlisty.</p>
      <p>Jeśli instalacja mówi „Zapisz w TRMNL, aby zacząć”, bohater jest już gotowy. Wróć do tej instalacji w TRMNL i kliknij „Zapisz”.</p>
      <h2 id="how-time-works">Jak płynie czas</h2>
      <p>
        Świat gry posuwa się naprzód co 15 minut, niezależnie od tego, czy ekran jest włączony. TRMNL pokazuje migawkę i odświeża się we własnym rytmie.
        Tryb uśpienia, wolniejsze odświeżanie i inne elementy playlisty nigdy nie zmniejszają postępów bohatera. Godziny przygód w aplikacji są w strefie czasowej twojej przeglądarki.
      </p>
      <h2 id="floors">Piętra</h2>
      <p>Budynek ma {F.floors.length} pięter, a bohater zaczyna tutaj: {name(F.floors[0]?.name ?? '')}. Każde otwiera się na jakimś poziomie, niezależnie od tego, czy tam zaglądasz: {FLOORS_LINE}. TRMNL pokazuje wtedy „Nowy obszar odblokowany”; czy tam pójść, decydujesz ty, z mapy świata na stronie Bohater. Głębsze piętra mają twardsze potwory, więcej złota, lepsze mikstury i lepiej płatne zadania. Na pierwszym piętrze ({name(F.floors[0]?.name ?? '')}) bohater nie może dostać nokautu; na każdym innym może.</p>
      <ul>
        {F.floors.map((f) => <li key={f.id}><strong>{name(f.name)}</strong>{f.level > 1 ? ` (poziom ${f.level})` : ' (od początku)'}: {f.monsters.map(name).join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>Strona Notatki terenowe w zakładce Więcej przechowuje to, co bohater zapisał o każdym piętrze i potworze. Notatka piętra otwiera się, gdy bohater pierwszy raz na nie wejdzie, notatka potwora przy pierwszej wygranej z nim. Notatki nie wpływają na grę.</p> : null}
      <h2 id="desk-keepsakes">Pamiątki z biurka</h2>
      <p>Zostaw Desk Crawler na playliście i szukaj na pasku tytułu ekranu napisu „Kod pamiątki” z sześciocyfrowym kodem, na przykład 482 917 (wąskie pionowe mashupy skracają go do „Kod”). Wpisz ten kod w Ustawieniach aplikacji, aby zebrać stałą biurową pamiątkę. Pokazuje go zarówno pełny ekran, jak i mashupy; podgląd w aplikacji go ukrywa. Gdy pamiątka czeka, kod QR na ekranie też ją zbiera: zeskanuj go telefonem, a aplikacja doda ją na półkę, nawet z wyłączonym paskiem tytułu. Gdzie jest miejsce, kod jest wydrukowany obok.</p>
      <p>Możesz zebrać jedną pamiątkę na tydzień, z nowym kodem w każdy poniedziałek o 00:00 UTC. Kod z poprzedniego tygodnia też działa, jeśli ekran odświeża się powoli. Jeśli przegapisz tydzień, w następnym dostaniesz ten sam wzór. Po zebraniu całego kompletu możesz zbierać kolejne egzemplarze. Pamiątki nie zmieniają XP, sprzętu ani rankingów, a dodatkowe urządzenia czy szybsze odświeżanie nie dają nic ekstra.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Kariera</h2>
          <p>Bohater zawsze ma jeden cel, pokazany u góry strony Bohater: „Wygraj pierwszą walkę”, „Załóż znaleziony element sprzętu”, „Dotrzyj do Serwerowni”, „Kup Plecak na laptopa”. Część osiąga się podczas przygód; resztę robisz tutaj, na stronie Torba lub Bohater. Osiągnięcie celu pokazuje na TRMNL „Cel osiągnięty” i odkłada trochę złota ({n(F.career.gold)} na całej drabinie); naciśnij „Odbierz” na stronie Bohater, aby je zgarnąć. Cele nie dają XP i nie wygasają, a następny zaczyna się niezależnie od tego, czy odebrałeś nagrodę.</p>
          <ul>
            <li>Strona Kariera w zakładce Więcej wymienia {F.career.goals} celów po kolei, z datą osiągnięcia każdego. Cel zrobiony już przed pojawieniem się drabiny liczy się jako osiągnięty.</li>
            {F.unlocks !== undefined ? <li>Funkcje przychodzą z poziomem, niezależnie od tego, czy tu zaglądasz: lista zadań na poziomie {F.unlocks.todo}, postawy na poziomie {F.unlocks.stances}, decyzje biurowe na poziomie {F.unlocks.choices}, {F.meetings?.level !== undefined ? `spotkania ze współpracownikami na poziomie ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `rozbiórka i warsztat na poziomie ${F.workbench.level}, ` : ''}wędrowny kupiec na poziomie {F.unlocks.merchant} i rajdy na biurka na poziomie {F.unlocks.raids}. TRMNL pokazuje wtedy „Odblokowano”. Piętra też otwierają się z poziomem: {FLOORS_LINE}.</li> : null}
            <li>Gdy otwierają się postawy, bohater nie ma wybranej żadnej i gra Zrównoważoną. Jeden cel prosi o wybór postawy; liczy się każda z trzech, a później możesz ją zmienić.</li>
            <li>Kilka wczesnych celów ma gwarantowany czas: pierwsza walka w ciągu kilku przygód, element sprzętu w pierwszym tuzinie, a pierwsza decyzja, kupiec i elita w mniej więcej dobę od swojego poziomu. Cała reszta zależy od szczęścia.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Bohaterowie i klasy</h2>
          <p>Każdy zaczyna jako Wojownik. Gdy Wojownik osiągnie poziom {F.rosterLevel}, TRMNL pokazuje „Odblokowano: drugi bohater” i możesz zwerbować Łotrzyka na stronie Bohaterowie w zakładce Więcej. Łotrzyk zaczyna na poziomie 1 z własnym imieniem, sprzętem, złotem, miksturami i celami.</p>
          <ul>
            <li>Na przygody wyrusza jeden bohater naraz i to jego pokazuje TRMNL i rankingi. Drugi zostaje tam, gdzie go zostawiłeś. Nie przeżywa przygód i niczego potem nie nadrabia, a kupiec, który go odwiedza, odjeżdża.</li>
            <li>Zmieniać możesz raz dziennie. Powrót w ciągu dziesięciu minut się nie liczy. Bohater po nokaucie albo w drodze musi najpierw dojść do siebie lub dotrzeć na miejsce.</li>
            <li>Możesz mieć po jednym bohaterze z każdej klasy. Osiągnięcia należą do ciebie, niezależnie od tego, który bohater je zdobył; kilka należy tylko do Łotrzyka.</li>
            <li><strong>Wojownik</strong>: {t.text(F.classes.warriorBlurb)}</li>
            <li><strong>Łotrzyk</strong>: {t.text(F.classes.rogueBlurb)} Zdrowie {F.classes.rogue.hpPct}%, atak {signed(F.classes.rogue.attackPct)}%, obrona {signed(F.classes.rogue.defensePct)}%, złoto z każdej walki i znaleziska {signed(F.classes.rogue.goldPct)}%, a w każdym rajdzie na biurko {F.classes.rogue.raidEdgePct} punktów po jego stronie. Awansuje w tempie Wojownika, ale trochę częściej dostaje nokaut.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Postawy</h2>
      <p>Na stronie Bohater wybierz, jak ostrożny jest bohater.{arrives('stances')} Postawa działa od następnej przygody i możesz ją zmienić w każdej chwili. TRMNL pokazuje ją obok licznika torby, pod wskaźnikiem, którego igła stoi nisko przy Ostrożnej, pośrodku przy Zrównoważonej i wysoko przy Śmiałej.</p>
      <ul>
        <li><strong>Ostrożna</strong> pije miksturę poniżej 65% PŻ, odpoczywa poniżej 50% i rusza znowu przy 90%. Daje 90% zwykłego XP za wygrane.</li>
        <li><strong>Zrównoważona</strong>, domyślna, pije poniżej 50%, odpoczywa poniżej 35% i rusza znowu przy 75%, ze zwykłym XP.</li>
        <li><strong>Śmiała</strong> pije poniżej 35%, odpoczywa poniżej 20% i rusza znowu przy 60%. Daje 115% XP za wygrane, ale częściej kończy się nokautem.</li>
      </ul>
      <p>Na pierwszym piętrze ({name(F.floors[0]?.name ?? '')}) bohater nie może dostać nokautu, więc Śmiała nic tam nie ryzykuje. Na każdym innym piętrze nokaut kosztuje złoto i odsyła bohatera z powrotem na pierwsze piętro, a Śmiała dostaje nokaut najczęściej.</p>
      <h2 id="desk-raids">Rajdy na biurka</h2>
      <p>Podczas eksploracji bohaterowie czasem robią sobie nawzajem rajdy na biurka. Każdy aktywny bohater{F.unlocks === undefined ? '' : ` od poziomu ${F.unlocks.raids}`} robi rajdy i jest ich celem automatycznie. Nie możesz zacząć rajdu ani wybrać celu.{F.unlocks === undefined ? '' : ` Poniżej poziomu ${F.unlocks.raids} bohater ani nie robi rajdów, ani nie jest ich celem.`} Rajd pojawia się w dziennikach przygód obu bohaterów z nazwą publiczną drugiego gracza, a strona Bohater prowadzi rejestr rajdów twojego bohatera.</p>
      <ul>
        <li>Kto wygra, rozstrzyga rzut monetą, który przesuwa tylko postawa. Poziom, sprzęt i efekty nigdy się nie liczą. Ostrożna dodaje 10 punktów po swojej stronie, Zrównoważona nic, a Śmiała odejmuje 5, zarówno w ataku, jak i w obronie.</li>
        <li>Częstotliwość rajdów też zależy od postawy: Ostrożna mniej więcej co drugi dzień eksploracji, Zrównoważona mniej więcej raz dziennie, Śmiała mniej więcej dwa razy dziennie.</li>
        <li>Przegrany oddaje zwycięzcy 5% swojego złota, więc złoto tylko zmienia właściciela. Obaj tracą zdrowie: przegrany 30% maksymalnych PŻ, zwycięzca 10%. Sprzęt z cechą {t.text('Thrifty')} odejmuje swoje punkty od straty złota.</li>
        <li>Rajd może skończyć się nokautem, tak jak walka; na pierwszym piętrze bohater zostaje wtedy uratowany. Rajdy trafiają tylko na bohaterów, którzy eksplorują lub odpoczywają, a bohater po rajdzie ma spokój przez mniej więcej sześć godzin.</li>
        <li>Jeśli wolisz przegrywać mniej rajdów, wybierz Ostrożną, która rzadziej rusza i częściej wygrywa.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Spotkania</h2>
          <p>Od czasu do czasu, zamiast walki, bohater wpada na bohatera innego gracza na tym samym piętrze{F.meetings.level === undefined ? '' : `, od poziomu ${F.meetings.level}`}. Idą na kawę, wspominają dawne boje albo dzielą się kanapką, a obaj dostają ten sam mały bonus na {F.meetings.boonAdventures} przygód. Oba dzienniki opisują to z nazwą publiczną drugiego gracza, a zakładka Dziennik pokazuje pięć ostatnich spotkań bohatera.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{t.text(kind.name)}</strong>: {t.text(kind.effect)}, {boonLine(kind.modifiers)}.</li>)}
            <li>Nic nie zmienia właściciela. Spotkanie zajmuje miejsce jednej przygody, a bonus mniej więcej to wyrównuje.</li>
            <li>Zdarza się tak samo często bez względu na postawę czy klasę, mniej więcej co drugi dzień u bohatera, który eksploruje. Bohaterowie spotykają się tylko podczas eksploracji lub odpoczynku, a bohater po spotkaniu ma spokój przez mniej więcej dwanaście godzin.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Rzeczy znalezione</h2>
          <p>Gdy bohater dostanie nokaut poza Biurem, gubi na tym piętrze zapasową broń albo zbroję, podpisaną flamastrem twoją nazwą publiczną. Bohater zachowuje wszystko, co miał na sobie. Później bohater innego gracza, eksplorując to piętro, może znaleźć zapas zamiast zwykłego znaleziska, a twój TRMNL powie ci, kto go znalazł.</p>
          <ul>
            <li>Twój bohater może w ten sam sposób znaleźć zapasy innych graczy. Zapas to zwykły sprzęt: załóż go, sprzedaj, rozbierz albo zanieś do warsztatu. Ma podstawowe statystyki swojego rodzaju i rzadkości, bez ulepszeń pierwszego właściciela.</li>
            <li>Podpis zostaje. Strona Torba i karta Rzeczy znalezione w zakładce Dziennik pokazują, czyj to był sprzęt, podobnie jak twoja strona bohatera, dopóki go masz.</li>
            <li>Zapas zastępuje tylko znalezisko, które bohater i tak by zrobił, więc nikt nie dostaje dodatkowego sprzętu. Cele kariery i prezenty świąteczne to zawsze nowy sprzęt.</li>
            <li>Naraz leży gdzieś tylko jeden twój zapas. Jeśli bohater znów dostanie nokaut, zanim ktoś go znajdzie, nowy zapas zastąpi stary.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">Lista zadań</h2>
          <p>Bohater prowadzi biurową listę trzech drobnych zadań, takich jak „Pokonaj 4 Papierowe chochliki”, „Znajdź 2 elementy sprzętu” czy „Eksploruj Serwerownię przez 16 przygód”.{arrives('todo')} Wykonuje je podczas eksploracji, a strona Bohater pokazuje postęp każdego. Gdy zadanie jest zrobione, ekran pokazuje „Odhaczone”, a bohater dostaje trochę złota: {i(F.todo.pay.map(String), 'lub')}, zależnie od piętra. Zadania nie dają XP, więc nie wpływają na rankingi.</p>
          <ul>
            <li>Każdego ranka o {F.todo.standup} czasu lokalnego twojego TRMNL stand-up daje nowe zadania w miejsce zrobionych. Ekran je wymienia.</li>
            <li>Zadania nigdy nie wygasają. Zablokowane zadanie zostaje wymienione samo po dwóch stand-upach.</li>
            <li>Co najmniej dwa z trzech zadań da się wykonać tam, gdzie jest bohater. Najwyżej jedno wymaga podróży w inny rejon, jeśli chcesz go tam wysłać.</li>
            <li>Raz między stand-upami możesz na stronie Bohater wymienić jedno niezrobione zadanie na inne.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Mikstury</h2>
      {F.potions === undefined
        ? <p>Mikstura lecząca przywraca 40% maksymalnych PŻ bohatera, w zaokrągleniu w górę. Bohater pije ją automatycznie, gdy PŻ spadną poniżej progu mikstury jego postawy podczas eksploracji, a dziennik to odnotowuje. Bez mikstur bohater odpoczywa poniżej progu odpoczynku i rusza znowu, gdy dojdzie do siebie. Możesz też wypić miksturę sam na stronie Bohater, gdy bohater eksploruje lub odpoczywa i nie ma pełnego zdrowia. Mikstury znajduje się podczas eksploracji i nigdy nie zajmują miejsca w torbie.</p>
        : <>
          <p>Mikstury mają {F.potions.strengths.length} rodzaje mocy: {i(F.potions.strengths.map((s) => `${name(s.name).toLowerCase()} (${s.healPct}%)`))}; każda przywraca taki odsetek maksymalnych PŻ bohatera, w zaokrągleniu w górę. Znaleziska zależą od miejsca: {F.potions.drops.map((d) => `${name(d.floor)}: ${d.rest.length === 0 ? 'tylko' : 'głównie'} ${name(`${d.top.toLowerCase()}s`)}${d.rest.length === 0 ? '' : `, czasem ${d.rest.map((r) => name(`${r.toLowerCase()}s`)).join(' i ')}`}`).join('; ')}. Nowy bohater zaczyna z miksturami leczącymi, a kupiec i decyzje biurowe też je rozdają. Wszystkie rodzaje mieszczą się w jednej sakiewce i nigdy nie zajmują miejsca w torbie.</p>
          <p>Bohater pije automatycznie, gdy PŻ spadną poniżej progu mikstury jego postawy podczas eksploracji: najsłabszą miksturę, która wyniesie go z powrotem nad ten próg, albo najmocniejszą, jaką ma, jeśli słabsza nie wystarczy. Dziennik podaje, co wypił. Bez mikstur bohater odpoczywa poniżej progu odpoczynku i rusza znowu, gdy dojdzie do siebie. Możesz też wypić miksturę sam na stronie Bohater, gdy bohater eksploruje, odpoczywa albo podróżuje i nie ma pełnego zdrowia; gdy w sakiewce jest kilka rodzajów, strona Bohater pyta, który.</p>
          <p><strong>Łączenie.</strong> Na stronie Torba {name(`${F.potions.combine.from.toLowerCase()}s`)} ×{F.potions.combine.count} oraz {F.potions.combine.materials.map((m) => `${name(m.name).toLowerCase()} ×${m.n}`).join(', ')} dają jedną miksturę: {name(F.potions.combine.to.toLowerCase())}. Łączenie nigdy nie zostawia cię z większą liczbą mikstur niż przedtem, więc sakiewka nie może się przepełnić. Dzieje się tylko wtedy, gdy to wybierzesz.</p>
        </>}
      <p>Mikstury trzyma się w sakiewce. Nowy bohater ma {name(F.firstPouch.name)} na {F.firstPouch.size} mikstur. Większe sakiewki kupuje się za złoto na stronie Torba, po jednej: {rungs(F.shopPouches)}. Gdy sakiewka jest pełna, znaleziona mikstura zamienia się w złoto.</p>
      <h2 id="the-wandering-merchant">Wędrowny kupiec</h2>
      <p>Od czasu do czasu bohater spotyka podczas eksploracji wędrownego kupca. Ekran pokazuje „Kupiec przejazdem. Zrób zakupy w aplikacji.”, a strona Torba pokazuje do trzech ofert: kilka mikstur oraz następną sakiewkę lub torbę{F.merchantOff > 0 ? ` o ${F.merchantOff}% taniej niż na stronie Torba` : ''}. Każda oferta sprzedaje się raz. Kupiec rusza dalej po czterech przygodach albo po twoim ostatnim zakupie.</p>
      <h2 id="decisions">Decyzje</h2>
      <p>Czasem biuro pyta bohatera o drobiazg, na przykład o zrzutkę na tort albo zostanie po godzinach. Ekran pokazuje „W aplikacji czeka decyzja.”, a strona Bohater pokazuje obie opcje i dokładnie to, co każda zmienia. Jeśli nie odpowiesz w ciągu mniej więcej doby, zostanie wybrana opcja oznaczona jako domyślna.</p>
      <h2 id="effects">Efekty</h2>
      <p>Niektóre chwile zostawiają bohaterowi krótki efekt, widoczny na stronie Bohater z liczbą pozostałych przygód. Pokonanie elity daje {t.text('Fired up')} (+10% ataku na osiem przygód). Zrzutka na tort daje {t.text('Well fed')} (+10% XP na osiem przygód). Pułapka zostawia {t.text('Bruised')} (−15% obrony na cztery przygody). Bohater ma naraz najwyżej trzy efekty. Każdy odpoczynek zdejmuje złe efekty, a nokaut czyści wszystkie.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Okopane elity</h2>
          <p>Od poziomu {F.standoff.minLevel}, na piętrze {name(F.standoff.floor)} i głębszych, elita czasem się okopuje, zamiast paść w jednej walce. TRMNL pokazuje ją z paskiem zdrowia, a bohater wraca do niej w każdej przygodzie, aż padnie.</p>
          <ul>
            <li>W każdej przygodzie bohater walczy z nią do sześciu rund, a jej zdrowie się nie odnawia. Bije znacznie mocniej niż zwykła elita, a bohater walczy poniżej progu odpoczynku swojej postawy, zanim się wycofa, więc starcie może skończyć się nokautem. Wycofanie się nie kosztuje złota.</li>
            <li>Pokonana daje {F.standoff.xp} razy więcej XP i {F.standoff.gold} razy więcej złota niż zwykle za tego potwora, a do tego rzadkie lub epickie znalezisko z tego piętra.</li>
            <li>Odchodzi po {F.standoff.hours} godzinach albo wcześniej, jeśli bohater dostanie nokaut lub wyruszy w podróż. Pauza nie zatrzymuje zegara.</li>
            <li>Strona Bohater pokazuje jej zdrowie i czas odejścia. Możesz ją tam odpuścić, a podróż pyta, zanim ją zostawisz.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Kalendarz biura</h2>
          <p>Święta i biurowe okazje dekorują scenę bohatera na cały dzień: ozdoby pod sufitem, coś na podłodze, czasem kapelusz, a na pierwszym piętrze inny widok z okna. Kierują się lokalną datą twojego TRMNL. Gdy bohater zobaczy okazję pierwszy raz, dziennik ją nazywa, a większość daje mały bonus, dopóki trwa. Strona Bohater pokazuje dzisiejszą okazję i następną.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{t.text(rule.name)}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'każdy rajd na biurko kończy się wpadką (niżej).' : rule.effectLabel ? `${t.text(rule.effectLabel)}.` : 'tylko dekoracje.'}</li>)}
          </ul>
          <p><strong>Piątek 13.</strong> Rajdy na biurka zaczynają się dwa razy częściej i każdy kończy się wpadką: nikt nie wygrywa, a obaj bohaterowie tracą 20% maksymalnych PŻ i 5% złota, którego nikt nie dostaje. Rejestr rajdów bohatera liczy to jako wpadkę.</p>
          <p><strong>Boże Narodzenie.</strong> W każde święta bohater znajduje jeden zapakowany prezent: element sprzętu z piętra, na którym jest, w pierwszej przygodzie z tych trzech dni.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Rzadki i epicki sprzęt</h2>
      <p>Sprzęt bywa pospolity, niepospolity, rzadki lub epicki. Epicki jest najrzadszy, mniej więcej jedno znalezisko na sto, i najmocniejszy. Rzadki i epicki sprzęt ma też jedną specjalną cechę, widoczną w nazwie przedmiotu i opisaną na stronie Torba:</p>
      <ul>
        <li><strong>{t.text('Vampiric')}</strong> leczy 5% maksymalnych PŻ po każdej wygranej.</li>
        <li><strong>{t.text('Lucky')}</strong> dodaje 20% złota z wygranych i znalezisk.</li>
        <li><strong>{t.text('Sturdy')}</strong> przyjmuje o 40% mniej obrażeń od pułapek.</li>
        <li><strong>{t.text('Thrifty')}</strong> traci o 5 punktów mniej złota, gdy coś pójdzie źle: odwrót nie kosztuje złota zamiast 5%, a nokaut kosztuje 5% zamiast 10%.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">Gdy torba się zapełni</h2>
      <p>Nowy bohater zaczyna z małą papierową torbą na 6 elementów sprzętu. Założony sprzęt i mikstury nie zajmują miejsca. Gdy torba jest pełna, bohater odkłada dla ciebie następny znaleziony element i dalej przeżywa przygody. Dopóki ten element czeka, kolejne znaleziska zostają na miejscu, aż zrobisz miejsce.</p>
      <h2 id="bigger-bags">Większe torby</h2>
      <p>Torba rośnie za złoto. {F.tote ? `W ciągu mniej więcej pierwszych dwóch godzin bohater znajduje ${name(F.tote.name)} (${F.tote.size}). ` : ''}Potem większe torby kupuje się na stronie Torba, po jednej: {rungs(F.shopBags)}, aż do {F.topBag} miejsc. Nie ma wymagań poziomu, a torby nigdy nie wypadają jako łup.</p>
      <ol className="[&_li]:list-decimal">
        <li>Otwórz Torbę w aplikacji. Załóż ulepszenia i sprzedaj zbędny sprzęt, aby zrobić miejsce.</li>
        <li>Jeśli czeka odłożone znalezisko, wybierz „Odbierz znalezisko”. Po odebraniu zostaw co najmniej jedno wolne miejsce, aby przygody mogły ruszyć.</li>
        <li>Gdy jest wolne miejsce i nic nie czeka, przygody wznawiają się same w ciągu 15 minut. Do tego czasu możesz jeszcze wybrać inny odblokowany rejon na stronie torby.</li>
      </ol>
      <p>Założenie sprzętu nie zwalnia miejsca. Sprzedaż lub rozbiórka sprzętu albo zakup większej torby zwalnia, a odłożone znalezisko od razu trafia do torby. Strona Torba potrafi też jednym stuknięciem sprzedać najsłabszy zapas i zatrzymać znalezisko. Tryb uśpienia TRMNL też nigdy nie zatrzymuje gry.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Rozbiórka i warsztat</h2>
        <p>{F.workbench.level !== undefined ? `Od poziomu ${F.workbench.level} z` : 'Z'}będny sprzęt ma dwa wyjścia z torby: sprzedaż za złoto albo rozbiórkę na materiały na stronie Torba. Rozbiórka daje tyle, ile wart jest stopień, na którym element znaleziono, w jednostkach materiału jego rzadkości: {F.workbench.materials.map((m) => `${name(m.name).toLowerCase()} ze sprzętu ${m.rarities.map((r) => rarityPl[r] ?? r).join(' i ')}`).join(', ')}. Epicki sprzęt daje {F.workbench.epicMultiplier} razy więcej. Materiały nie zajmują miejsca w torbie i nigdy nie są sprzedawane. Sprzęt jest rozbierany tylko wtedy, gdy to wybierzesz.{F.workbench.level !== undefined ? ` Przed poziomem ${F.workbench.level} sprzedawaj zapasy: pierwsze ulepszenie i tak wymaga poziomu ${F.workbench.level}.` : ''}</p>
        <p>Warsztat wydaje materiały i złoto na sprzęt, który nosi bohater, bez zdejmowania go: element zachowuje nazwę i cechę, zmieniają się tylko liczby. Każdy element ma jeden następny krok. {F.workbench.tiers.map((s, k) => `${k === 0 ? 'Podniesienie elementu stopnia 1 do Mk II' : 'Przejście z Mk II do Mk III'} kosztuje: ${price(s)}`).join('; ')}; element można podnieść tylko do stopnia, który bohater mógłby założyć na swoim poziomie. Gdy element ma Mk III (albo taki został znaleziony), wzmocnienie dodaje punkt na krok: {F.workbench.reinforce.map((s) => `+${s.to} za ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `Po +${F.workbench.reinforce.at(-1)!.to} element jest ukończony.` : ''} Rzadkiemu i epickiemu sprzętowi można też dodać wybraną cechę za {price(F.workbench.affix)}, w miejsce obecnej.</p>
        <p>Ulepszenia zawsze się udają. Rozbiórka ulepszonego elementu nie zwraca tego, co na niego wydałeś, więc ulepszaj tylko sprzęt, który zamierzasz dalej nosić.</p>
      </> : null}
      <h2 id="getting-knocked-out">Nokaut</h2>
      <p>Bohater sam dochodzi do siebie po mniej więcej dwóch godzinach i wraca na pierwsze piętro ({name(F.floors[0]?.name ?? '')}). Zachowujesz XP i sprzęt, ale tracisz 10% obecnego złota.</p>
      <h2 id="recaps">Podsumowania</h2>
      <p>Ekran pokazuje krótkie podsumowanie ostatniej zakończonej nocy lub dnia, w czasie lokalnym twojego TRMNL. O 07:00 podsumowanie nocy obejmuje 19:00–07:00 i zostaje przez cały dzień. O 19:00 podsumowanie dnia obejmuje 07:00–19:00 i zostaje przez wieczór i noc. Okno biura pokazuje dzień i noc w tych samych godzinach. Historie nad nim są zawsze najnowsze.</p>
      <h2 id="understanding-rankings">Jak działają rankingi</h2>
      <p>Ekran pokazuje siedmiodniowe Top 5 XP twojej grupy poziomów, z zaznaczonym twoim wierszem albo z wierszem dopisanym pod listą, gdy jesteś niżej. Aplikacja ma też widok 24-godzinny i tabelę od początku. Rankingi publikują się co godzinę, więc niedawna przygoda lub awans mogą pojawić się, zanim zaktualizuje się twoje miejsce.</p>
      <p>Bohaterowie wstrzymani lub stojący zachowują postępy, ale ich niedawne XP wygasa. Po siedmiu dniach bez zdobytego XP wypadają z tygodniowej tabeli, dopóki znów czegoś nie zdobędą. Postępy od początku zostają zapisane.</p>
      <h2 id="sharing-your-hero">Udostępnianie bohatera</h2>
      <p>Bohater ma stronę publiczną z poziomem, miejscem w rankingu, obecnym piętrem, licznikami i osiągnięciami. Złoto i dziennik przygód nigdy nie są pokazywane, a sprzęt tylko wtedy, gdy to zapas innego gracza, który trzyma twój bohater. Twoja nazwa prowadzi do tej strony z rankingów oraz z rajdów i spotkań innych graczy, i to tam inni zaczynają cię obserwować. W Ustawieniach są przyciski „Udostępnij” i „Kopiuj link”, a udostępniony link pokazuje kartę z obrazkiem bohatera, imieniem, poziomem i miejscem. Aby ją ukryć, wybierz w Ustawieniach „Ukryj moją stronę bohatera”. Znika od razu, a dopóki jest ukryta, nikt nie może cię obserwować ani wybrać na rywala.</p>
      <h2 id="following-and-rivals">Obserwowani i rywale</h2>
      <p>Po zalogowaniu możesz obserwować innego gracza z jego publicznej strony bohatera, do 20 graczy. Wszyscy obserwowani są w Rankingach, z poziomem bohatera, miejscem i lokalizacją oraz linkami do ich stron. Oznacz jednego jako rywala, aby trzymać go na górze listy z linijką o tym, kto prowadzi. Rywal częściej staje się celem rajdów: połowa rajdów twojego bohatera idzie na jego biurko, gdy się da. Rywal dowiaduje się, kto go wybrał, i może odpowiedzieć tym samym. Obserwowanie kogokolwiek innego nic nie zmienia w grze i nikt nie dostaje o tym powiadomienia. Jeśli gracz ukryje stronę, widzisz tylko jego nazwę, dopóki znów jej nie pokaże. Jeśli zmieni nazwę publiczną, znika z twojej listy.</p>
      <h2 id="names">Nazwy</h2>
      <p>Masz dwie nazwy. Imię bohatera widać na TRMNL, w rankingach i na stronie bohatera; aby je zmienić, kup w zakładce Więcej plakietkę „Cześć, mam na imię” za 200 złota. Codziennie jest jedna w sprzedaży. Nazwa publiczna to ty, w każdej grze TRMNL: widać ją obok bohatera w rankingach, w rajdach i spotkaniach innych graczy i w linku do twojej strony. Możesz ją zmienić za darmo raz na 7 dni w zakładce Konto. Linki do starej strony przestają działać, a nikt inny nie może zająć twojej starej nazwy przez 7 dni.</p>
      <h2 id="gender">Płeć</h2>
      <p>Płeć bohatera, męską lub żeńską, wybierasz przy jego tworzeniu. Zmienia tylko jego wygląd na TRMNL, na stronie bohatera i w spotkaniach innych graczy. Obie grają tak samo. Aby ją później zmienić, kup w zakładce Więcej metamorfozę za 200 złota, w dowolnej chwili.</p>
      <h2 id="alerts">Alerty</h2>
      <p>TRMNL to główny sposób na śledzenie bohatera, ale Ustawienia mogą też wysłać powiadomienie na telefon w dwóch przypadkach; każdy jest wyłączony, dopóki go nie włączysz:</p>
      <ul>
        <li><strong>Pełna torba:</strong> torba jest pełna, a bohater trzyma dla ciebie znalezisko. Przychodzi pół godziny po zapełnieniu torby, więc nie dostaniesz go, jeśli już ją porządkujesz, i tylko raz za każdym zapełnieniem.</li>
        <li><strong>Okazja u kupca:</strong> kupiec sprzedaje następną torbę lub sakiewkę{F.merchantOff > 0 ? ` o ${F.merchantOff}% taniej` : ''}, a bohater ma na nią złoto. Najwyżej raz dziennie. Kupiec z samymi miksturami nigdy go nie wysyła.</li>
      </ul>
      <p>Dostajesz najwyżej dwa alerty dziennie. Godziny ciszy trwają od 21:00 do 08:00, chyba że je zmienisz: alert o pełnej torbie czeka, aż się skończą, a okazja u kupca, która trafi się w tym czasie, zostaje pominięta. Przed wysłaniem gra sprawdza, czy alert jest wciąż aktualny, więc nigdy nie usłyszysz o torbie, którą już uporządkowałeś, ani o ofercie, której już nie ma. Decyzje, rajdy, nokauty, awanse i pamiątki nigdy nie wysyłają alertów.</p>
      <p>Wybierz w Ustawieniach „Zezwól na tym urządzeniu”, a potem zaakceptuj pytanie przeglądarki. Na iPhonie i iPadzie najpierw dodaj TRMNL Games do ekranu początkowego (Udostępnij, a potem Do ekranu początk.) i otwieraj stamtąd. Każde urządzenie, na które zezwolisz, jest w Ustawieniach z przyciskiem „Usuń”; usunięcie ostatniego wyłącza alerty.</p>
      <h2 id="troubleshooting">Rozwiązywanie problemów</h2>
      <h3 id="not-on-your-screen">Bohatera nie ma na ekranie</h3>
      <ul>
        <li>Kliknięcie „Zapisz” dodaje Desk Crawler do playlisty TRMNL. Urządzenie pokazuje playlistę po jednym pluginie, w swoim rytmie odświeżania, więc Desk Crawler pojawia się, gdy przyjdzie jego kolej. Przy kilku pluginach i wolnym odświeżaniu może to trochę potrwać.</li>
        <li>Otwórz w TRMNL playlistę i sprawdź, czy Desk Crawler na niej jest, na urządzeniu, na które patrzysz, jeśli masz kilka, i czy żaden harmonogram nie ukrywa go o tej porze dnia.</li>
        <li>Tryb uśpienia zatrzymuje odświeżanie ekranu w nocy. Bohater dalej przeżywa przygody, a ekran nadrabia, gdy urządzenie się obudzi.</li>
        <li>Ekran z napisem „Pierwsza przygoda zacznie się w ciągu 15 minut” działa. Pierwsza historia pojawi się z najbliższym kwadransem.</li>
        <li>Strona Bohater w aplikacji zawsze pokazuje, co robi bohater, cokolwiek pokazuje ekran.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">Ekran wygląda na stary</h3>
      <ul>
        <li>„Aktualizacje się opóźniają” oznacza, że usługa gry ma opóźnienie. Postępy bohatera są zachowane, a ekran nadrobi, gdy usługa nadrobi.</li>
        <li>Jeśli strona aplikacji jest aktualna, a ekran nie, sprawdź w TRMNL ustawienie odświeżania pluginu i jego miejsce na playliście.</li>
        <li>Przygody dzieją się co kwadrans, o pełnej godzinie oraz o :15, :30 i :45 w strefie czasowej TRMNL. Ekran nie pokazuje odliczania; godzina przy każdej historii to czas, kiedy się wydarzyła, a aplikacja pokazuje następną przygodę.</li>
        <li>Jeśli odłączyłeś lub odinstalowałeś plugin, zainstaluj go ponownie z TRMNL. Bohater zachowuje wszystkie postępy.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Odłączanie i usuwanie</h2>
      <p>
        Odłączenie zatrzymuje nowe ekrany dla tej instalacji. TRMNL może dalej pokazywać ostatni obraz, dopóki nie usuniesz pluginu z playlisty; nie
        możemy skasować obrazu, który już jest na twoim urządzeniu.
      </p>
      <h2 id="help">Pomoc</h2>
      <p>
        W sprawie konta lub połączenia napisz na <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Staramy się odpowiadać w ciągu dwóch dni roboczych.
      </p>
    </>
  ),
}
