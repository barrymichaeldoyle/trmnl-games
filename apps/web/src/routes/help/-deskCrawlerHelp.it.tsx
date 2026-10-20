import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'

const t = contentTranslator('it')
const n = (value: number) => t.number(value)
const oro = (value: number) => `${n(value)} d’oro`
const e = (parts: readonly string[], last = 'e') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
const name = (english: string) => t.name(english)
const floor = (english: string) => t.nameWith(english, 'il')
const rungs = (list: readonly { name: string; size: number; price: number }[]) => e(list.map((rung) => `${t.nameWith(rung.name, 'un')} (${rung.size}) per ${oro(rung.price)}`))
const price = (c: Cost) => `${e(c.materials.map((m) => `${m.n} ${name(m.name).toLowerCase()}`))} più ${oro(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `${signed(m.attackPct)}% di attacco` : '', m.defensePct ? `${signed(m.defensePct)}% di difesa` : '', m.xpPct ? `${signed(m.xpPct)}% di XP dalle vittorie` : '', m.goldPct ? `${signed(m.goldPct)}% di oro` : '', m.trapDamagePct ? `trappole il ${m.trapDamagePct}% meno dolorose` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = e(F.floors.filter((b) => b.level > 1).map((b) => `${floor(b.name)} al livello ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` Arriva al livello ${F.unlocks[feature]}.`)
const rarityIt: Record<string, string> = { common: 'comune', uncommon: 'non comune', rare: 'raro', epic: 'epico' }

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const WEEKDAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
const NTH = ['primo', 'secondo', 'terzo', 'quarto', 'quinto']
// Domenica is feminine: "la prima domenica".
const nth = (index: number, weekday: number) => (weekday === 0 ? NTH[index]!.replace(/o$/, 'a') : NTH[index]!)
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, per ${rule.days} giorni` : ''
  switch (date.kind) {
    case 'fixed':
      return `il ${date.day === 1 ? '1º' : date.day} ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const base = `${date.weekday === 0 ? 'la' : 'il'} ${nth(date.nth - 1, date.weekday)} ${WEEKDAYS[date.weekday]} di ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      const after = (date.weekday + offset) % 7
      return `${offset === 0 ? base : `${after === 0 ? 'la' : 'il'} ${WEEKDAYS[after]} dopo ${base}`}${span}`
    }
    case 'friday_13th':
      return 'ogni venerdì 13'
    case 'easter':
      return date.offsetDays === -2 ? 'dal Venerdì Santo al Lunedì dell’Angelo' : `${Math.abs(date.offsetDays)} giorni ${date.offsetDays < 0 ? 'prima' : 'dopo'} la domenica di Pasqua${span}`
    case 'table': {
      const next = nextTableDate(date.dates)
      return next === null ? 'una data che cambia ogni anno' : `una data che cambia ogni anno (la prossima: ${next.getUTCDate()} ${MONTHS[next.getUTCMonth()]} ${next.getUTCFullYear()})`
    }
  }
}

export const it: HelpPage = {
  seoTitle: 'Aiuto e installazione di Desk Crawler',
  description: 'Come installare Desk Crawler su TRMNL e come funziona ogni parte del gioco, con le soluzioni quando lo schermo sembra indietro.',
  title: 'Desk Crawler su TRMNL',
  contents: {
    'getting-started': 'Per iniziare', 'if-the-qr-sends-you-back-to-setup': 'Se il QR ti riporta all’installazione', 'how-time-works': 'Come passa il tempo', floors: 'Piani', 'desk-keepsakes': 'Ricordini da scrivania', career: 'Carriera', 'heroes-and-classes': 'Eroi e classi', stances: 'Tattiche', 'desk-raids': 'Incursioni sulle scrivanie', meetings: 'Riunioni', 'lost-property': 'Oggetti smarriti', 'to-do-list': 'Cose da fare', potions: 'Pozioni', 'the-wandering-merchant': 'Il mercante ambulante', decisions: 'Decisioni', effects: 'Effetti', 'office-calendar': 'Calendario dell’ufficio', 'rare-and-epic-gear': 'Equipaggiamento raro ed epico', 'when-your-bag-fills-up': 'Quando la borsa si riempie', 'bigger-bags': 'Borse più grandi', 'salvage-and-the-workbench': 'Smontaggio e banco da lavoro', 'getting-knocked-out': 'Finire KO', recaps: 'Riepiloghi', 'understanding-rankings': 'Come funzionano le classifiche', 'sharing-your-hero': 'Condividere il tuo eroe', 'following': 'Seguiti', names: 'Nomi', gender: 'Genere', alerts: 'Avvisi', troubleshooting: 'Risoluzione dei problemi', 'disconnecting-and-removing': 'Scollegare e rimuovere', help: 'Aiuto',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Per iniziare</h2>
      <ul>
        <li>Apri <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler nel marketplace TRMNL</a> e scegli Installa.</li>
        <li>Accedi a Desk Crawler, scegli un nome pubblico e un nome per l’eroe, e collega l’installazione.</li>
        <li>Torna in TRMNL e premi Salva. La prima avventura del tuo eroe parte entro 15 minuti.</li>
        <li>Aggiungi il plugin a una playlist, o a un mashup se vuoi il tuo eroe accanto ad altri plugin. Sono supportate tutte e quattro le dimensioni di layout.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">Se il QR ti riporta all’installazione</h2>
      <p>Il QR apre l’app dell’account con cui hai effettuato l’accesso. Non avvia una nuova installazione. Controlla l’e-mail dell’accesso mostrata nella pagina di installazione e usa Cambia account se all’inizio ti eri collegato con un altro account.</p>
      <p>Se l’installazione dice «Ricollega Desk Crawler», il collegamento a TRMNL esiste ma manca l’eroe. Può succedere dopo l’azzeramento del gioco prima del lancio. Installa una nuova copia di <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler da TRMNL</a>, accedi con lo stesso account, scegli un nuovo nome per l’eroe, collega e poi premi Salva in TRMNL. Quando la nuova copia funziona, togli quella vecchia dalla playlist.</p>
      <p>Se l’installazione dice «Salva in TRMNL per iniziare», il tuo eroe è già pronto. Torna a quell’installazione in TRMNL e premi Salva.</p>
      <h2 id="how-time-works">Come passa il tempo</h2>
      <p>
        Il mondo del gioco avanza ogni 15 minuti, che lo schermo sia acceso o no. Il tuo TRMNL mostra un’istantanea e si aggiorna con i suoi tempi.
        La modalità sospensione, un aggiornamento più lento e gli altri elementi della playlist non riducono mai i progressi del tuo eroe. Gli orari delle avventure nell’app usano il fuso orario del browser.
      </p>
      <h2 id="floors">Piani</h2>
      <p>L’edificio ha {F.floors.length} piani, e il tuo eroe parte da {floor(F.floors[0]?.name ?? '')}. Ognuno si apre a un livello, che tu ci vada o no: {FLOORS_LINE}. Il tuo TRMNL scrive «Nuova zona sbloccata» quando succede; andarci sta a te, dalla mappa del mondo nella pagina Eroe. I piani più profondi hanno mostri più duri, più oro, pozioni migliori e cose da fare pagate meglio. {t.nameWith(F.floors[0]?.name ?? '', 'Il')} non può mandare KO un eroe; tutti gli altri piani sì.</p>
      <ul>
        {F.floors.map((f) => <li key={f.id}><strong>{name(f.name)}</strong>{f.level > 1 ? ` (livello ${f.level})` : ' (fin dall’inizio)'}: {f.monsters.map(name).join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>La pagina Appunti di campo, sotto Altro, conserva ciò che il tuo eroe ha annotato su ogni piano e ogni mostro. L’appunto di un piano si apre la prima volta che il tuo eroe ci mette piede, quello di un mostro alla prima vittoria. Gli appunti non cambiano il gioco.</p> : null}
      <h2 id="desk-keepsakes">Ricordini da scrivania</h2>
      <p>Tieni Desk Crawler nella playlist e cerca «Ricordino» seguito da un codice di sei cifre, come 482 917, nella barra del titolo dello schermo. Inserisci quel codice nelle Impostazioni dell’app per ottenere un ricordino d’ufficio permanente. Lo mostrano sia lo schermo intero sia i mashup; l’anteprima dell’app lo nasconde. Mentre un ricordino aspetta, anche il QR dello schermo lo ritira: scansionalo col telefono e l’app lo aggiunge al tuo scaffale, anche con la barra del titolo spenta. Dove c’è posto, il codice è stampato accanto.</p>
      <p>Puoi ottenere un ricordino a settimana, con un nuovo codice ogni lunedì alle 00:00 UTC. Vale anche il codice della settimana prima se lo schermo si aggiorna lentamente. Se salti una settimana, ricevi lo stesso disegno la settimana dopo. Completata la collezione, puoi ottenerne altri di ciascuno. I ricordini non cambiano XP, equipaggiamento o classifiche, e più dispositivi o un aggiornamento più rapido non danno extra.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Carriera</h2>
          <p>Il tuo eroe ha sempre un obiettivo, in cima alla pagina Eroe: «Vinci il tuo primo combattimento», «Equipaggia un pezzo di equipaggiamento che hai trovato», «Raggiungi la Sala server», «Compra lo Zaino porta PC». Alcuni si raggiungono andando all’avventura; gli altri li fai qui, nella pagina Borsa o Eroe. Raggiungere un obiettivo mostra «Obiettivo raggiunto» sul tuo TRMNL e mette da parte un po’ d’oro ({n(F.career.gold)} su tutta la scala); premi Ritira nella pagina Eroe per prenderlo. Gli obiettivi non danno XP e non scadono, e il successivo parte che tu abbia ritirato o no.</p>
          <ul>
            <li>La pagina Carriera, sotto Altro, elenca i {F.career.goals} obiettivi in ordine, con la data in cui hai raggiunto ciascuno. Un obiettivo già fatto quando è arrivata la scala conta come raggiunto.</li>
            {F.unlocks !== undefined ? <li>Le funzioni arrivano per livello, che tu passi o no: le cose da fare al livello {F.unlocks.todo}, le tattiche al livello {F.unlocks.stances}, le decisioni d’ufficio al livello {F.unlocks.choices}, {F.meetings?.level !== undefined ? `le riunioni con i colleghi al livello ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `lo smontaggio e il banco da lavoro al livello ${F.workbench.level}, ` : ''}il mercante ambulante al livello {F.unlocks.merchant} e le incursioni sulle scrivanie al livello {F.unlocks.raids}. Il tuo TRMNL scrive «Sbloccato» quando succede. Anche i piani si aprono per livello: {FLOORS_LINE}.</li> : null}
            <li>Quando si aprono le tattiche, il tuo eroe non ne ha scelta nessuna e gioca Equilibrato. Un obiettivo ti chiede di sceglierne una; vale una qualsiasi delle tre, e puoi cambiarla dopo.</li>
            <li>Alcuni obiettivi iniziali sono garantiti in tempo: il primo combattimento entro poche avventure, un pezzo di equipaggiamento entro la prima dozzina, e una prima decisione, un mercante e un’élite entro un giorno circa dal loro livello. Tutto il resto è affidato al caso.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Eroi e classi</h2>
          <p>Tutti partono come Guerriero. Quando il tuo Guerriero raggiunge il livello {F.rosterLevel}, il tuo TRMNL scrive «Sbloccato: un secondo eroe», e puoi reclutare un Ladro dalla pagina Eroi sotto Altro. Il Ladro parte dal livello 1 con nome, equipaggiamento, oro, pozioni e obiettivi tutti suoi.</p>
          <ul>
            <li>Va all’avventura un eroe alla volta, ed è quello che mostra il tuo TRMNL e quello in classifica. L’altro resta dove l’hai lasciato. Non va all’avventura e non recupera dopo, e un mercante in visita da lui se ne va.</li>
            <li>Puoi cambiare una volta al giorno. Tornare indietro entro dieci minuti non conta. Un eroe KO o in viaggio deve prima riprendersi o arrivare.</li>
            <li>Puoi avere un eroe per classe. Gli obiettivi sbloccati sono tuoi, qualunque eroe li ottenga; alcuni sono solo del Ladro.</li>
            <li><strong>Guerriero</strong>: {t.text(F.classes.warriorBlurb)}</li>
            <li><strong>Ladro</strong>: {t.text(F.classes.rogueBlurb)} {F.classes.rogue.hpPct}% di salute, attacco {signed(F.classes.rogue.attackPct)}%, difesa {signed(F.classes.rogue.defensePct)}%, {signed(F.classes.rogue.goldPct)}% di oro da ogni combattimento e ritrovamento, e {F.classes.rogue.raidEdgePct} punti dalla sua parte in ogni incursione. Sale di livello al ritmo del Guerriero ma va KO un po’ più spesso.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Tattiche</h2>
      <p>Scegli quanto è prudente il tuo eroe nella pagina Eroe.{arrives('stances')} La tattica vale dalla prossima avventura, e puoi cambiarla quando vuoi. Il tuo TRMNL la mostra accanto al conteggio della borsa, sotto un indicatore con la lancetta bassa per Prudente, al centro per Equilibrato e alta per Audace.</p>
      <ul>
        <li><strong>Prudente</strong> beve una pozione sotto il 65% dei PS, riposa sotto il 50% e riparte al 90%. Prende il 90% dell’XP normale dalle vittorie.</li>
        <li><strong>Equilibrato</strong>, quella predefinita, beve sotto il 50%, riposa sotto il 35% e riparte al 75%, con l’XP normale.</li>
        <li><strong>Audace</strong> beve sotto il 35%, riposa sotto il 20% e riparte al 60%. Prende il 115% di XP dalle vittorie ma va KO più spesso.</li>
      </ul>
      <p>{t.nameWith(F.floors[0]?.name ?? '', 'Il')} non può mandare KO un eroe, quindi lì Audace non rischia il KO. In ogni altro piano un KO costa oro e rimanda il tuo eroe {t.nameWith(F.floors[0]?.name ?? '', 'nel')}, e Audace è la tattica che va KO più spesso.</p>
      <h2 id="desk-raids">Incursioni sulle scrivanie</h2>
      <p>Mentre esplorano, gli eroi a volte fanno incursioni sulle scrivanie altrui. Ogni eroe attivo{F.unlocks === undefined ? '' : ` dal livello ${F.unlocks.raids}`} fa incursioni e le subisce in automatico. Non puoi avviarne una né scegliere il bersaglio.{F.unlocks === undefined ? '' : ` Sotto il livello ${F.unlocks.raids} un eroe non fa incursioni e non le subisce.`} L’incursione compare nel diario di entrambi gli eroi con il nome pubblico dell’altro giocatore, e la pagina Eroe tiene il registro delle incursioni del tuo eroe.</p>
      <ul>
        <li>Chi vince lo decide un lancio di moneta, spostato solo dalla tattica. Livello, equipaggiamento ed effetti non contano mai. Prudente aggiunge 10 punti dalla sua parte, Equilibrato niente e Audace ne toglie 5, sia in attacco sia in difesa.</li>
        <li>Anche la frequenza dipende dalla tattica: Prudente circa un giorno di esplorazione sì e uno no, Equilibrato circa una volta al giorno, Audace circa due volte al giorno.</li>
        <li>Chi perde consegna il 5% del suo oro a chi vince, quindi l’oro cambia solo di mano. Entrambi perdono salute: chi perde il 30% dei PS massimi, chi vince il 10%. L’equipaggiamento {t.text('Thrifty')} toglie i suoi punti dalla perdita d’oro.</li>
        <li>Un’incursione può mandare KO un eroe, proprio come un combattimento; {t.nameWith(F.floors[0]?.name ?? '', 'nel')} il tuo eroe viene invece soccorso. Le incursioni trovano solo eroi che esplorano o riposano, e un eroe che ne ha subita una viene lasciato in pace per circa sei ore.</li>
        <li>Se preferisci perderne meno, scegli Prudente, che fa meno incursioni e ne vince di più.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Riunioni</h2>
          <p>Ogni tanto, invece di un combattimento, il tuo eroe incrocia l’eroe di un altro giocatore sullo stesso piano{F.meetings.level === undefined ? '' : `, dal livello ${F.meetings.level}`}. Prendono un caffè, si raccontano storie di guerra o si dividono un panino, e tutti e due ricevono lo stesso piccolo vantaggio per {F.meetings.boonAdventures} avventure. Entrambi i diari raccontano la storia con il nome pubblico dell’altro giocatore, e la scheda Diario elenca le ultime cinque riunioni del tuo eroe.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{t.text(kind.name)}</strong>: {t.text(kind.effect)}, {boonLine(kind.modifiers)}.</li>)}
            <li>Niente cambia di mano. Una riunione prende il posto di un’avventura, e il vantaggio più o meno la compensa.</li>
            <li>Succede con la stessa frequenza qualunque sia la tua tattica o classe, circa un giorno sì e uno no per un eroe che esplora. Gli eroi si incontrano solo mentre esplorano o riposano, e un eroe che ha appena avuto una riunione viene lasciato in pace per circa dodici ore.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Oggetti smarriti</h2>
          <p>Quando il tuo eroe va KO fuori dall’Ufficio, lascia cadere su quel piano un doppione della sua arma o armatura con il tuo nome pubblico scritto a pennarello. Il tuo eroe tiene tutto ciò che indossava. Più avanti, l’eroe di un altro giocatore che esplora quel piano può trovare il doppione al posto di un ritrovamento normale, e il tuo TRMNL ti dice chi l’ha trovato.</p>
          <ul>
            <li>Il tuo eroe può trovare i doppioni degli altri giocatori nello stesso modo. Un doppione è equipaggiamento normale: equipaggialo, vendilo, smontalo o portalo al banco da lavoro. Arriva con le statistiche base del suo tipo e della sua rarità, senza i miglioramenti del primo proprietario.</li>
            <li>Il nome resta. La pagina Borsa e la scheda Oggetti smarriti nel Diario mostrano di chi era, e così la tua pagina eroe finché lo tieni.</li>
            <li>Un doppione sostituisce solo un ritrovamento che il tuo eroe avrebbe fatto comunque, quindi nessuno riceve equipaggiamento in più. Gli obiettivi di carriera e i regali di Natale sono sempre equipaggiamento nuovo.</li>
            <li>In giro c’è un solo doppione tuo alla volta. Se il tuo eroe va di nuovo KO prima che qualcuno lo trovi, il nuovo prende il posto del vecchio.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">Cose da fare</h2>
          <p>Il tuo eroe tiene una lista di tre piccole cose da fare in ufficio, come «Sconfiggi 4 Folletti di carta», «Trova 2 pezzi di equipaggiamento» o «Esplora la Sala server per 16 avventure».{arrives('todo')} Le sbriga mentre esplora, e la pagina Eroe mostra l’avanzamento di ciascuna. Quando una è fatta, lo schermo scrive «Spuntato» e il tuo eroe riceve un po’ d’oro: {e(F.todo.pay.map(String), 'o')} a seconda del piano. Le cose da fare non danno XP, quindi non toccano le classifiche.</p>
          <ul>
            <li>Ogni mattina alle {F.todo.standup}, ora locale del tuo TRMNL, lo stand-up sostituisce quelle fatte con cose nuove. Lo schermo le elenca.</li>
            <li>Le cose da fare non scadono mai. Una bloccata viene cambiata da sola dopo due stand-up.</li>
            <li>Almeno due delle tre si possono fare dove si trova il tuo eroe. Al massimo una chiede un viaggio in un’altra zona, se vuoi mandarci il tuo eroe.</li>
            <li>Una volta tra uno stand-up e l’altro puoi cambiare una cosa non finita con un’altra dalla pagina Eroe.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Pozioni</h2>
      {F.potions === undefined
        ? <p>Una pozione curativa ridà il 40% dei PS massimi del tuo eroe, arrotondato per eccesso. Il tuo eroe ne beve una in automatico quando i PS scendono sotto la soglia di pozione della sua tattica mentre esplora, e il diario lo annota. Senza pozioni, il tuo eroe riposa sotto la soglia di riposo e riparte quando si è ripreso. Puoi anche berne una tu dalla pagina Eroe quando il tuo eroe esplora o riposa e non ha la salute al massimo. Le pozioni si trovano esplorando e non occupano mai spazio nella borsa.</p>
        : <>
          <p>Le pozioni hanno {F.potions.strengths.length} potenze: {e(F.potions.strengths.map((s) => `${name(s.name).toLowerCase()} (${s.healPct}%)`))}, e ognuna ridà quella quota dei PS massimi del tuo eroe, arrotondata per eccesso. I ritrovamenti dipendono da dove si trova il tuo eroe: {F.potions.drops.map((d) => `${floor(d.floor)} dà ${d.rest.length === 0 ? 'solo' : 'soprattutto'} ${name(`${d.top.toLowerCase()}s`)}${d.rest.length === 0 ? '' : `, con qualche ${d.rest.map((r) => name(`${r.toLowerCase()}s`)).join(' e ')}`}`).join('; ')}. Un eroe nuovo parte con pozioni curative, e anche il mercante e le decisioni d’ufficio ne distribuiscono. Tutte le potenze stanno in un solo borsello e non occupano mai spazio nella borsa.</p>
          <p>Il tuo eroe beve in automatico quando i PS scendono sotto la soglia di pozione della sua tattica mentre esplora: la pozione più debole che lo riporta sopra quella soglia, o la più forte che ha se nessuna più debole basta. Il diario dice cosa ha bevuto. Senza pozioni, il tuo eroe riposa sotto la soglia di riposo e riparte quando si è ripreso. Puoi anche berne una tu dalla pagina Eroe quando il tuo eroe esplora, riposa o viaggia e non ha la salute al massimo; con più potenze nel borsello, la pagina Eroe ti chiede quale.</p>
          <p><strong>Combinare.</strong> Nella pagina Borsa, {F.potions.combine.count} {name(`${F.potions.combine.from.toLowerCase()}s`)} e {F.potions.combine.materials.map((m) => `${m.n} ${name(m.name).toLowerCase()}`).join(', ')} diventano una {name(F.potions.combine.to.toLowerCase())}. Combinare non ti lascia mai con più pozioni di prima, quindi il borsello non può traboccare. Succede solo quando lo scegli tu.</p>
        </>}
      <p>Le pozioni stanno in un borsello. Un eroe nuovo ha {t.nameWith(F.firstPouch.name, 'un')} che ne contiene {F.firstPouch.size}. I borselli più grandi si comprano con l’oro nella pagina Borsa, uno alla volta: {rungs(F.shopPouches)}. Quando il borsello è pieno, una pozione trovata diventa oro.</p>
      <h2 id="the-wandering-merchant">Il mercante ambulante</h2>
      <p>Ogni tanto il tuo eroe incontra un mercante ambulante mentre esplora. Lo schermo scrive «C’è un mercante di passaggio. Fai acquisti nell’app.» e la pagina Borsa mostra fino a tre offerte: qualche pozione e il prossimo borsello o la prossima borsa{F.merchantOff > 0 ? ` con il ${F.merchantOff}% di sconto sul prezzo della pagina Borsa` : ''}. Ogni offerta si vende una volta. Il mercante riparte dopo quattro avventure o dopo il tuo ultimo acquisto.</p>
      <h2 id="decisions">Decisioni</h2>
      <p>A volte l’ufficio chiede al tuo eroe qualcosa di piccolo, come contribuire per una torta o restare fino a tardi. Lo schermo scrive «Una decisione ti aspetta nell’app.» e la pagina Eroe mostra entrambe le opzioni con esattamente cosa cambia ciascuna. Se non rispondi entro circa un giorno, si sceglie per te l’opzione segnata come predefinita.</p>
      <h2 id="effects">Effetti</h2>
      <p>Alcuni momenti lasciano al tuo eroe un effetto breve, elencato nella pagina Eroe con le avventure che restano. Battere un’élite gli dà {t.text('Fired up')} (+10% di attacco per otto avventure). Contribuire per la torta gli dà {t.text('Well fed')} (+10% di XP per otto avventure). Una trappola gli lascia un {t.text('Bruised')} (−15% di difesa per quattro avventure). Il tuo eroe tiene al massimo tre effetti. Qualsiasi riposo toglie quelli negativi, e un KO li cancella tutti.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Élite trincerate</h2>
          <p>Dal livello {F.standoff.minLevel}, {t.nameWith(F.standoff.floor, 'nel')} e nei piani più profondi, un nemico d’élite a volte si trincera invece di cadere in un solo combattimento. Il tuo TRMNL lo mostra con la sua barra della salute, e il tuo eroe torna ad affrontarlo a ogni avventura finché non cade.</p>
          <ul>
            <li>A ogni avventura il tuo eroe lo combatte per un massimo di sei round, e la sua salute resta com’è. Colpisce molto più forte di un’élite normale, e il tuo eroe continua a combattere oltre la soglia di riposo della sua tattica prima di ritirarsi, quindi uno scontro può finire in KO. Ritirarsi non costa oro.</li>
            <li>Quando cade, dà {F.standoff.xp} volte l’XP del mostro e {F.standoff.gold} volte il suo oro, più un ritrovamento raro o epico di quel piano.</li>
            <li>Se ne va dopo {F.standoff.hours} ore, o prima se il tuo eroe va KO o viaggia. La pausa non ferma l’orologio.</li>
            <li>La pagina Eroe mostra la sua salute e quando se ne va. Da lì puoi lasciar perdere, e il viaggio ti chiede conferma prima di lasciarlo indietro.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Calendario dell’ufficio</h2>
          <p>Feste e ricorrenze d’ufficio addobbano la scena del tuo eroe per la giornata: decorazioni lungo il soffitto, qualcosa sul pavimento, a volte un cappello, e {t.nameWith(F.floors[0]?.name ?? '', 'nel')} una vista diversa dalla finestra. Seguono la data locale del tuo TRMNL. La prima volta che il tuo eroe ne vede una, il diario la nomina, e quasi tutte portano un piccolo bonus finché durano. La pagina Eroe mostra la ricorrenza di oggi e la prossima.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{t.text(rule.name)}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'ogni incursione va storta (vedi sotto).' : rule.effectLabel ? `${t.text(rule.effectLabel)}.` : 'solo decorazioni.'}</li>)}
          </ul>
          <p><strong>Venerdì 13.</strong> Le incursioni partono il doppio delle volte, e vanno tutte storte: nessuno vince, ed entrambi gli eroi perdono il 20% dei PS massimi e il 5% del loro oro, che non va a nessuno. Il registro delle incursioni del tuo eroe lo conta come contrattempo.</p>
          <p><strong>Natale.</strong> Il tuo eroe trova un regalo incartato ogni Natale: un pezzo di equipaggiamento del piano in cui si trova, alla sua prima avventura dei tre giorni.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Equipaggiamento raro ed epico</h2>
      <p>L’equipaggiamento può essere comune, non comune, raro o epico. L’epico è il più raro, circa un ritrovamento su cento, e il più forte. L’equipaggiamento raro ed epico ha anche un tratto speciale, indicato nel nome dell’oggetto e spiegato nella pagina Borsa:</p>
      <ul>
        <li><strong>{t.text('Vampiric')}</strong> cura il 5% dei PS massimi dopo ogni vittoria.</li>
        <li><strong>{t.text('Lucky')}</strong> aggiunge il 20% di oro da vittorie e ritrovamenti.</li>
        <li><strong>{t.text('Sturdy')}</strong> subisce il 40% di danni in meno dalle trappole.</li>
        <li><strong>{t.text('Thrifty')}</strong> perde 5 punti di oro in meno quando qualcosa va storto: una ritirata non fa perdere oro invece del 5%, e un KO fa perdere il 5% invece del 10%.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">Quando la borsa si riempie</h2>
      <p>Un eroe nuovo parte con un piccolo sacchetto di carta che contiene 6 pezzi di equipaggiamento. L’equipaggiamento indossato e le pozioni non occupano spazio. Quando la borsa è piena, il tuo eroe ti tiene da parte il prossimo pezzo che trova e continua l’avventura. Mentre quel pezzo aspetta, i ritrovamenti successivi restano lì finché non fai posto.</p>
      <h2 id="bigger-bags">Borse più grandi</h2>
      <p>La tua borsa cresce con l’oro. {F.tote ? `Il tuo eroe trova ${t.nameWith(F.tote.name, 'un')} (${F.tote.size}) entro le prime due ore circa. ` : ''}Dopo, le borse più grandi si comprano nella pagina Borsa, una alla volta: {rungs(F.shopBags)}, fino a {F.topBag} posti. Non ci sono requisiti di livello, e le borse non escono mai come bottino.</p>
      <ol className="[&_li]:list-decimal">
        <li>Apri Borsa nell’app. Equipaggia i miglioramenti e vendi l’equipaggiamento in più per liberare spazio.</li>
        <li>Se c’è un ritrovamento messo da parte, scegli Ritira il ritrovamento. Lascia almeno un posto libero dopo averlo ritirato, così le avventure possono riprendere.</li>
        <li>Quando c’è un posto libero e niente in attesa, le avventure riprendono da sole entro 15 minuti. Prima di allora puoi ancora scegliere un’altra zona sbloccata dalla pagina della borsa.</li>
      </ol>
      <p>Equipaggiare non libera un posto. Vendere o smontare equipaggiamento, o comprare una borsa più grande, sì, e il ritrovamento messo da parte entra subito nella borsa. La pagina Borsa può anche vendere il tuo doppione più debole e tenere il ritrovamento con un tocco. Anche la modalità sospensione del tuo TRMNL non ferma mai il gioco.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Smontaggio e banco da lavoro</h2>
        <p>{F.workbench.level !== undefined ? `Dal livello ${F.workbench.level}, l’` : 'L’'}equipaggiamento in più ha due modi per uscire dalla borsa: venderlo per oro, o smontarlo in materiali nella pagina Borsa. Lo smontaggio rende in base al grado in cui il pezzo è stato trovato, in unità del materiale della sua rarità: {F.workbench.materials.map((m) => `${name(m.name).toLowerCase()} dall’equipaggiamento ${m.rarities.map((r) => rarityIt[r] ?? r).join(' e ')}`).join(', ')}. L’equipaggiamento epico rende {F.workbench.epicMultiplier} volte tanto. I materiali non occupano spazio nella borsa e non si vendono mai. L’equipaggiamento viene smontato solo quando lo scegli tu.{F.workbench.level !== undefined ? ` Prima del livello ${F.workbench.level}, vendi i doppioni: il primo miglioramento richiede comunque il livello ${F.workbench.level}.` : ''}</p>
        <p>Il banco da lavoro spende materiali e oro sull’equipaggiamento che il tuo eroe indossa, senza toglierlo: il pezzo mantiene nome e tratto, e cambiano solo i numeri. Ogni pezzo ha un solo passo successivo. {F.workbench.tiers.map((s, i) => `${i === 0 ? 'Portare un pezzo di grado 1 a Mk II' : 'Passare da Mk II a Mk III'} costa ${price(s)}`).join('; ')}; un pezzo può salire solo a un grado che il livello del tuo eroe potrebbe equipaggiare. Quando un pezzo è Mk III (o è stato trovato così), il rinforzo aggiunge un punto a passo: {F.workbench.reinforce.map((s) => `+${s.to} per ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `Dopo +${F.workbench.reinforce.at(-1)!.to} il pezzo è finito.` : ''} All’equipaggiamento raro ed epico si può anche montare il tratto che preferisci per {price(F.workbench.affix)}, al posto di quello che ha.</p>
        <p>I miglioramenti riescono sempre. Smontare un pezzo migliorato non restituisce quanto hai speso per migliorarlo, quindi migliora solo l’equipaggiamento che pensi di continuare a indossare.</p>
      </> : null}
      <h2 id="getting-knocked-out">Finire KO</h2>
      <p>Il tuo eroe si rimette in piedi da solo dopo circa due ore e torna {t.nameWith(F.floors[0]?.name ?? '', 'nel')}. Tieni XP ed equipaggiamento ma perdi il 10% dell’oro che hai.</p>
      <h2 id="recaps">Riepiloghi</h2>
      <p>Lo schermo porta un breve riepilogo dell’ultima notte o dell’ultimo giorno conclusi, nell’ora locale del tuo TRMNL. Alle 07:00 il riepilogo della notte copre dalle 19:00 alle 07:00 e resta tutto il giorno. Alle 19:00 il riepilogo del giorno copre dalle 07:00 alle 19:00 e resta per la sera e la notte. La finestra dell’ufficio mostra giorno e notte con gli stessi orari. Le storie sopra sono sempre le più recenti.</p>
      <h2 id="understanding-rankings">Come funzionano le classifiche</h2>
      <p>Lo schermo mostra la Top 5 di XP di questa settimana per la tua fascia di livello, con la tua riga segnata, o aggiunta sotto l’elenco se sei più in basso. L’app offre anche la classifica di oggi e una classifica di sempre. Il giorno inizia alle 00:00 UTC e la settimana il lunedì alle 00:00 UTC, come per i ricordi. Le classifiche escono ogni ora, quindi un’avventura o un passaggio di livello recenti possono comparire prima che la tua posizione si aggiorni.</p>
      <p>Gli eroi in pausa o fermi mantengono i progressi. Uno senza XP questa settimana esce dalla classifica settimanale finché non ne guadagna di nuovo. I progressi totali restano registrati.</p>
      <h2 id="sharing-your-hero">Condividere il tuo eroe</h2>
      <p>Il tuo eroe ha una pagina pubblica con livello, posizione, piano attuale, totali e obiettivi. Oro e diario delle avventure non si vedono mai, e l’equipaggiamento solo quando è il doppione di un altro giocatore che il tuo eroe tiene. Il tuo nome porta alla pagina dalle classifiche e dalle incursioni e riunioni degli altri giocatori, ed è lì che gli altri ti seguono. Le Impostazioni hanno i pulsanti Condividi e Copia link, e un link condiviso mostra una scheda con l’immagine del tuo eroe, nome, livello e posizione. Per nasconderla, scegli Nascondi la mia pagina eroe nelle Impostazioni. Sparisce subito, e mentre è nascosta nessuno può seguirti.</p>
      <h2 id="following">Seguiti</h2>
      <p>Con l’accesso effettuato, puoi seguire un altro giocatore dalla sua pagina eroe pubblica, fino a 20 giocatori. Tutti quelli che segui compaiono in Classifiche, con livello, posizione e luogo del loro eroe, e i link alle loro pagine. Seguire non cambia nulla nel gioco, e nessuno viene avvisato quando lo segui. Le incursioni scelgono i bersagli a caso fra tutti, quindi seguire qualcuno non manda mai il tuo eroe da lui. Se un giocatore nasconde la sua pagina, vedi solo il suo nome finché non la mostra di nuovo. Se cambia il nome pubblico, esce dalla tua lista.</p>
      <h2 id="names">Nomi</h2>
      <p>Hai due nomi. Il nome del tuo eroe compare sul tuo TRMNL, nelle classifiche e sulla tua pagina eroe; per cambiarlo, compra un cartellino «Ciao, mi chiamo» nella scheda Altro per 200 d’oro. Ce n’è uno disponibile al giorno. Il tuo nome pubblico sei tu, in ogni gioco TRMNL: compare accanto al tuo eroe in classifica, nelle incursioni e nelle riunioni degli altri giocatori, e nel link della tua pagina. Puoi cambiarlo gratis una volta ogni 7 giorni da Account. I link alla tua vecchia pagina smettono di funzionare, e nessun altro può prendere il tuo vecchio nome per 7 giorni.</p>
      <h2 id="gender">Genere</h2>
      <p>Scegli il genere del tuo eroe, uomo o donna, quando lo crei. Cambia solo il suo aspetto sul tuo TRMNL, sulla tua pagina eroe e nelle riunioni degli altri giocatori. Giocano allo stesso modo. Per cambiarlo in seguito, compra un cambio di look nella scheda Altro per 200 d’oro, quando vuoi.</p>
      <h2 id="alerts">Avvisi</h2>
      <p>Il tuo TRMNL è il modo principale per seguire il tuo eroe, ma le Impostazioni possono anche mandarti una notifica sul telefono in due casi, ciascuno spento finché non lo attivi:</p>
      <ul>
        <li><strong>Borsa piena:</strong> la borsa è piena e il tuo eroe ti tiene da parte un ritrovamento. Arriva mezz’ora dopo che la borsa si è riempita, quindi non arriva niente se la stai già sistemando, e una volta ogni volta che si riempie.</li>
        <li><strong>Affare del mercante:</strong> un mercante vende la prossima borsa o il prossimo borsello{F.merchantOff > 0 ? ` con il ${F.merchantOff}% di sconto` : ''} e il tuo eroe ha l’oro. Al massimo una volta al giorno. Un mercante con sole pozioni non ne manda mai.</li>
      </ul>
      <p>Ricevi al massimo due avvisi al giorno. Le ore di silenzio vanno dalle 21:00 alle 08:00 se non le cambi: un avviso di borsa piena aspetta che finiscano, e un affare del mercante che arriva in quelle ore viene saltato. Prima di inviare, il gioco controlla che l’avviso valga ancora, quindi non ti avvisa mai di una borsa che hai già sistemato o di un’offerta che non c’è più. Decisioni, incursioni, KO, passaggi di livello e ricordini non mandano mai avvisi.</p>
      <p>Scegli Consenti su questo dispositivo nelle Impostazioni, poi accetta la richiesta del browser. Su iPhone e iPad, prima aggiungi TRMNL Games alla schermata Home (Condividi, poi Aggiungi alla schermata Home) e aprilo da lì. Ogni dispositivo che consenti compare nelle Impostazioni con un pulsante Rimuovi; rimuovere l’ultimo spegne gli avvisi.</p>
      <h2 id="troubleshooting">Risoluzione dei problemi</h2>
      <h3 id="not-on-your-screen">Il tuo eroe non è sullo schermo</h3>
      <ul>
        <li>Premere Salva aggiunge Desk Crawler alla playlist del tuo TRMNL. Il dispositivo mostra la playlist un plugin alla volta, alla sua frequenza di aggiornamento, quindi Desk Crawler compare quando arriva il suo turno. Con diversi plugin e un aggiornamento lento può volerci un po’.</li>
        <li>Apri la playlist in TRMNL e controlla che Desk Crawler ci sia, sul dispositivo che stai guardando se ne hai più di uno, e che nessuna programmazione lo nasconda a quest’ora del giorno.</li>
        <li>La modalità sospensione ferma l’aggiornamento dello schermo di notte. Il tuo eroe continua l’avventura, e lo schermo si rimette in pari quando il dispositivo si risveglia.</li>
        <li>Uno schermo che dice «La prima avventura inizia entro 15 minuti» funziona. La prima storia arriva al quarto d’ora successivo.</li>
        <li>La pagina Eroe dell’app mostra sempre cosa sta facendo il tuo eroe, qualunque cosa mostri lo schermo.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">Lo schermo sembra vecchio</h3>
      <ul>
        <li>«Gli aggiornamenti sono in ritardo» vuol dire che il servizio di gioco è indietro. I progressi del tuo eroe restano, e lo schermo si rimette in pari quando il servizio recupera.</li>
        <li>Se il sito dell’app è aggiornato ma lo schermo no, controlla in TRMNL la frequenza di aggiornamento del plugin e la sua posizione nella playlist.</li>
        <li>Le avventure girano ogni quarto d’ora, allo scoccare dell’ora e ai minuti :15, :30 e :45 nel fuso del tuo TRMNL. Lo schermo non mostra un conto alla rovescia; l’ora accanto a ogni storia è quando è successa, e l’app mostra la prossima avventura.</li>
        <li>Se hai scollegato o disinstallato, installa di nuovo da TRMNL. Il tuo eroe mantiene tutti i progressi.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Scollegare e rimuovere</h2>
      <p>
        Scollegare ferma le schermate nuove per quell’installazione. TRMNL può continuare a mostrare l’ultima immagine finché non togli il plugin dalla playlist; non
        possiamo cancellare un’immagine già presente sul tuo dispositivo.
      </p>
      <h2 id="help">Aiuto</h2>
      <p>
        Scrivi a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> per aiuto con l’account o il collegamento. Cerchiamo di rispondere entro due giorni lavorativi.
      </p>
    </>
  ),
}
