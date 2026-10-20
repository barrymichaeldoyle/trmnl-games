import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const privacyIt: LegalPage = {
  title: 'Privacy',
  description: 'Cosa conserva TRMNL Games, cosa è pubblico nelle classifiche e sugli schermi TRMNL, e come eliminare il tuo account.',
  translationNote: () => <p className="text-sm text-muted">Traduzione della versione inglese, che prevale in caso di differenze.</p>,
  Body: () => (
    <>
      <p>
        TRMNL Games è una raccolta di giochi gestita da Barry Michael Doyle, uno sviluppatore indipendente. Questa pagina spiega in parole semplici cosa conserva il servizio, chi lo tratta e
        come rimuoverlo. Per domande scrivi a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Cosa è pubblico</h2>
      <p>
        Il tuo nome pubblico, il nome e il livello del tuo eroe e le tue posizioni compaiono nelle classifiche e sugli schermi TRMNL degli altri giocatori. Scegli un nome pubblico che sei
        contento di condividere e non metterci mai i tuoi contatti.
      </p>
      <p>
        In Desk Crawler, gli eroi fanno incursioni sulle scrivanie altrui e si incontrano per caso. Quando il tuo eroe fa un’incursione, la subisce o incontra un altro eroe, il tuo nome pubblico compare nel diario delle avventure dell’altro giocatore, nell’app e sul suo TRMNL, come già succede nelle classifiche. Quando il tuo eroe va KO può lasciare cadere un oggetto di riserva con il tuo nome pubblico, che l’eroe di un altro giocatore può trovare e tenere; il tuo nome compare allora su quell’oggetto nella sua app e sulla sua pagina eroe. Se cambi nome o elimini l’account, quelle storie e quegli oggetti mostrano «Giocatore nascosto» o perdono il nome.
      </p>
      <p>
        Il tuo eroe di Desk Crawler ha una pagina pubblica: chiunque abbia il link può vedere il tuo nome pubblico, il nome del tuo eroe, livello, posizione, piano attuale e data di inizio, alcuni totali e i tuoi obiettivi. Oro, diario delle avventure e dati dell’account restano privati, e così il tuo equipaggiamento, tranne i doppioni di altri giocatori che il tuo eroe tiene, che compaiono con i loro nomi. La pagina è attiva di default. Nascondi la mia pagina eroe, nelle Impostazioni, la nasconde subito, e puoi mostrarla di nuovo quando vuoi.
      </p>
      <p>
        I giocatori che hanno effettuato l’accesso possono seguire una pagina eroe pubblica. Conserviamo chi segue chi, così la loro app può elencare i giocatori che seguono. Nessuno viene avvisato di essere seguito, e nessuna pagina mostra chi segue un giocatore. Se cambi il nome pubblico, nascondi la pagina o elimini i tuoi progressi, gli altri giocatori non vedono più il tuo eroe nella loro lista, e l’eliminazione cancella quei dati.
      </p>

      <h2>Cosa conserviamo</h2>
      <ul>
        <li>La tua identità di accesso fornita da Clerk, il nostro fornitore di accesso. La tua e-mail viene copiata solo nelle richieste di conferma di eliminazione, di breve durata; non copiamo il tuo nome reale né la foto profilo nel database del gioco.</li>
        <li>Il tuo nome pubblico, il tuo eroe, i tuoi oggetti, il diario delle avventure e l’XP recente usata per le classifiche. Gli account più vecchi possono avere anche un fuso orario salvato dalle versioni precedenti.</li>
        <li>Se attivi gli avvisi di Desk Crawler: quali avvisi vuoi, le tue ore di silenzio e il fuso orario del browser (per esempio Europe/Rome), e per ogni dispositivo che consenti, l’indirizzo push che ci dà il browser, le sue chiavi di cifratura e un’etichetta come «Chrome on Android». Teniamo anche un breve registro di ogni avviso: che tipo, quando e se è stato inviato.</li>
        <li>
          Per ogni installazione TRMNL: l’ID dell’istanza del plugin, un hash del suo token di accesso e il link alle impostazioni che ci fornisce TRMNL. Non conserviamo il tuo nome
          né la tua e-mail TRMNL.
        </li>
        <li>Lo scostamento di fuso orario che il tuo TRMNL invia con ogni schermata (per esempio UTC+2), così lo stand-up del mattino di Desk Crawler segue la tua giornata. Conserviamo solo l’ultimo.</li>
        <li>L’impostazione della lingua che il tuo TRMNL invia con ogni schermata (per esempio it-IT), per capire in quali lingue vale la pena tradurre i giochi e perché lo schermo possa usare la tua lingua. Conserviamo solo l’ultima.</li>
        <li>Se scegli una lingua per TRMNL Games, quella scelta, così anche gli schermi TRMNL e gli avvisi la usano.</li>
        <li>Dati operativi di breve durata, come contatori dei limiti di frequenza e ricevute delle richieste duplicate.</li>
        <li>Quando chiedi di eliminare l’account: la tua e-mail principale verificata, un hash del link di conferma e lo stato di consegna. Il link scade dopo 30 minuti; le richieste scadute vengono rimosse dalla pulizia quotidiana.</li>
        <li>La lista di lancio di Desk Crawler conteneva indirizzi e-mail per un’unica e-mail all’arrivo di Desk Crawler nel marketplace TRMNL. Quell’e-mail è partita il 13 ottobre 2026, ogni indirizzo è stato eliminato e la lista è chiusa.</li>
        <li>La lista di lancio di Idle Angler conserva, per un’unica e-mail quando Idle Angler arriverà sul marketplace di TRMNL: per un giocatore che ha effettuato l’accesso e preme Avvisami, un collegamento al suo account e la sua lingua (l’indirizzo viene letto dall’account al momento dell’invio); per chiunque altro, l’indirizzo e-mail inserito e la sua lingua. Ogni iscrizione viene eliminata appena parte la sua e-mail, e puoi lasciare la lista in qualsiasi momento dalla pagina iniziale o dall’e-mail.</li>
        <li>Il promemoria dell’eroe: se il tuo eroe di Desk Crawler è in gioco da due giorni e non hai mai aperto l’app di Desk Crawler, inviamo un’unica e-mail al tuo indirizzo principale verificato per dirti cosa ti aspetta lì, con un link per fermarla. L’indirizzo viene letto da Clerk al momento dell’invio e non viene conservato. Teniamo solo quando è stata inviata, o che hai chiesto di non riceverla.</li>
        <li>Se mandi un feedback: il tuo messaggio, la pagina da cui l’hai inviato, il tuo nome pubblico e un link al tuo account. Viene inviato per e-mail allo sviluppatore con la tua e-mail principale verificata come indirizzo di risposta.</li>
      </ul>

      <h2>Cosa non facciamo</h2>
      <p>Niente pubblicità, e nessuna vendita o condivisione dei tuoi dati per il marketing. Il gioco non ha acquisti, quindi non conserviamo dati di pagamento.</p>

      <h2>Analisi e assistenza facoltative</h2>
      <p>Se consenti l’analisi, PostHog registra le pagine che visiti, i passaggi di installazione, gli errori delle azioni di gioco e quelli del browser. Quando accedi, questi dati vengono collegati al tuo ID account Clerk, alla tua e-mail, al tuo nome pubblico e al nome del tuo eroe, così possiamo esaminare le richieste di assistenza e risolvere i problemi. Gli errori del browser vanno anche a Sentry, senza il tuo account, la tua e-mail o il tuo indirizzo IP.</p>
      <p>PostHog registra anche sessioni mascherate, così vediamo dove un percorso si blocca. Testi e campi dei moduli sono mascherati, i dati di accesso e dell’account sono bloccati, e non registriamo corpi o intestazioni di rete né l’output della console. Sono esclusi codici di installazione, token di accesso, JWT di gestione e stringhe di query degli URL.</p>
      <p>Puoi rifiutare e continuare a giocare. Usa Preferenze di analisi nel piè di pagina per cambiare scelta. Spegnere l’analisi ferma la raccolta di nuovi dati in quel browser; non cancella quelli precedenti. Contattaci per rimuoverli, oppure elimina il tuo account TRMNL Games per chiedere la rimozione del profilo PostHog collegato, degli eventi e delle registrazioni.</p>

      <h2>Cookie</h2>
      <p>
        Clerk imposta cookie che ti mantengono connesso. Mentre colleghi o gestisci un’installazione TRMNL, impostiamo un cookie cifrato di breve durata che scade
        in pochi minuti. Un link di conferma dell’eliminazione usa un cookie cifrato di breve durata per farti accedere prima di confermare. Se consenti l’analisi, PostHog usa la memoria locale del browser per riconoscere le tue visite. Salviamo anche localmente la tua preferenza sull’analisi, e un cookie ricorda la lingua che hai scelto. Non ci sono cookie pubblicitari.
      </p>

      <h2>Servizi che trattano i tuoi dati</h2>
      <ul>
        <li>
          <strong>Clerk</strong> gestisce l’accesso e conserva la tua e-mail e il metodo di accesso, più il tuo profilo Google o GitHub se accedi con uno di questi.
        </li>
        <li>
          <strong>Convex</strong> ospita il database del gioco, gli aggiornamenti del gioco ogni 15 minuti e i backup giornalieri.
        </li>
        <li>
          <strong>Cloudflare</strong> ospita questo sito e conserva i normali log delle richieste.
        </li>
        <li>
          <strong>TRMNL</strong> preleva da noi la schermata del tuo eroe. Il tuo account e il tuo dispositivo TRMNL sono regolati dall’informativa sulla privacy di TRMNL.
        </li>
        <li><strong>PostHog EU</strong> gestisce l’analisi d’uso facoltativa, le segnalazioni di errore e le registrazioni di sessione mascherate per l’assistenza e il miglioramento del prodotto.</li>
        <li><strong>Sentry</strong> (Stati Uniti) riceve segnalazioni di errore dal server del sito e dal backend del gioco, e dal tuo browser se consenti l’analisi, per trovare e correggere i bug. Una segnalazione contiene il percorso della pagina o il nome della funzione di gioco che ha fallito, e i dettagli tecnici dell’errore. Non include mai il tuo account, l’e-mail, l’indirizzo IP, i cookie, il contenuto dei moduli, le stringhe di query degli URL né codici e token di installazione.</li>
        <li><strong>Il servizio push del tuo browser</strong> (Google per Chrome e Android, Apple per Safari, Mozilla per Firefox) consegna gli avvisi di Desk Crawler se li attivi. Riceve l’avviso cifrato, quindi non può leggerlo, insieme all’indirizzo push creato dal browser.</li>
        <li><strong>Resend</strong> consegna l’e-mail di conferma dell’eliminazione dell’account al tuo indirizzo principale verificato, l’e-mail di lancio (inviata una sola volta, il 13 ottobre 2026) e i feedback che mandi allo sviluppatore. Riceve quegli indirizzi e il contenuto delle e-mail. Consegna anche l’unico promemoria dell’eroe.</li>
      </ul>

      <h2>Per quanto tempo li conserviamo</h2>
      <ul>
        <li>Il tuo account condiviso: finché non lo elimini. I progressi di un gioco: finché non elimini quel gioco o l’account.</li>
        <li>Diario delle avventure dettagliato: tre giorni. Riepiloghi delle esecuzioni: 30 giorni. XP recente per le classifiche: sette giorni.</li>
        <li>Ricevute delle richieste duplicate: 24 ore. Tentativi di collegamento a TRMNL: meno di un giorno.</li>
        <li>Lista di lancio: eliminata quando è partita l’e-mail di lancio il 13 ottobre 2026. Non ne conserviamo copie.</li>
        <li>Lista di lancio di Idle Angler: ogni iscrizione viene eliminata quando parte la sua e-mail di lancio, quando lasci la lista o insieme al tuo account.</li>
        <li>Promemoria dell’eroe: quando è stato inviato, o che hai chiesto di non riceverlo, finché non elimini l’account.</li>
        <li>Feedback: finché non elimini l’account, o prima su richiesta. Le copie già inviate per e-mail allo sviluppatore vengono eliminate su richiesta.</li>
        <li>Impostazioni degli avvisi e dispositivi: finché non spegni gli avvisi, rimuovi il dispositivo o elimini Desk Crawler o l’account. Un dispositivo il cui indirizzo push smette di funzionare viene rimosso in automatico. Registri dei singoli avvisi: sette giorni.</li>
        <li>Backup: circa una settimana, dopo la quale i dati eliminati spariscono anche da lì.</li>
        <li>Registrazioni mascherate: 30 giorni. Eventi di analisi e profili di assistenza: fino all’eliminazione dell’account o a una richiesta di rimozione precedente.</li>
        <li>Segnalazioni di errore in Sentry: fino a 90 giorni. Non sono collegate al tuo account, quindi l’eliminazione dell’account non ha nulla da rimuovere lì.</li>
      </ul>

      <h2>Eliminare il tuo account</h2>
      <p>
        Vai su <Link to="/account">Account</Link> e chiedi un link di eliminazione. Lo inviamo al tuo indirizzo principale verificato; il link scade dopo 30 minuti. Accedi con lo stesso account e scrivi DELETE nella pagina di conferma. Finché non confermi, l’account resta attivo. Dopo la conferma, l’account smette subito di funzionare, il tuo nome pubblico viene nascosto dalle
        classifiche, e poi vengono rimossi il tuo eroe, gli oggetti, la cronologia, i collegamenti TRMNL e l’accesso a TRMNL Games. Le istantanee delle classifiche che avevano copiato il tuo nome
        vengono sostituite entro circa due ore. Se non riesci ad accedere, scrivici e lo facciamo noi.
      </p>
      <p>
        Conserviamo solo un hash unidirezionale della tua identità di accesso e dei vecchi token TRMNL, così un account eliminato non può essere ricollegato di nascosto. Le immagini già
        inviate a un dispositivo TRMNL o memorizzate da TRMNL non possiamo cancellarle; togli il plugin dalla playlist per sostituirle. I contatori dei limiti di frequenza vengono rimossi durante l’eliminazione, e i riferimenti all’account nei registri di controllo amministrativi vengono ripuliti.
      </p>
      <p>La rimozione dei profili, degli eventi e delle registrazioni PostHog collegati viene richiesta durante l’eliminazione dell’account ed elaborata da PostHog in modo asincrono. Le richieste non riuscite vengono ritentate e restano visibili al gestore finché non sono risolte.</p>

      <h2>Eliminare solo un gioco</h2>
      <p>Nelle <Link to="/app/desk-crawler/settings">impostazioni di Desk Crawler</Link>, scegli Elimina i progressi di Desk Crawler per rimuovere quell’eroe, la cronologia, i collegamenti e le impostazioni e i dispositivi degli avvisi. Il tuo account condiviso e l’accesso restano disponibili. Puoi ricominciare installando il plugin quando l’eliminazione è finita. Gli altri giochi non cambiano.</p>

      <h2>Le tue scelte</h2>
      <p>
        Puoi chiedere una copia dei tuoi dati di gioco, o che qualcosa venga corretto o eliminato, scrivendo a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Cerchiamo di rispondere entro due giorni lavorativi.
      </p>

      <h2>Minori</h2>
      <p>TRMNL Games non è pensato per i minori di 13 anni, e non conserviamo consapevolmente i loro dati. Se pensi che un minore abbia un account, scrivici e lo elimineremo.</p>

      <h2>Modifiche</h2>
      <p>Quando questa informativa cambia, aggiorniamo questa pagina e la data in alto.</p>
    </>
  ),
  IdleAngler: () => (
    <>
      <h2>Idle Angler</h2>
      <p>Idle Angler conserva il tuo pescatore: le monete, l’acqua e l’esca, il frigo portatile, il registro delle specie e dei pesi migliori, la cronologia di pesca, il pesce più pesante in ogni acqua e in ogni Open del fine settimana, gli ordini del pescivendolo, la parete dei trofei e le medaglie, gli obiettivi e la scatola delle mosche. I tuoi pesci più pesanti compaiono con il tuo nome pubblico nelle classifiche e nei risultati degli Open di Idle Angler e sugli schermi TRMNL degli altri giocatori. A meno che tu non nasconda Idle Angler dal tuo profilo pubblico nelle impostazioni di Idle Angler, chiunque abbia il link vede il tuo titolo, la data di inizio, il numero di obiettivi, le specie registrate, il numero di medaglie e i pesci sulla tua parete dei trofei.</p>
      <p>Se attivi gli avvisi di Idle Angler, usano gli stessi dispositivi e le stesse ore di silenzio degli avvisi degli altri giochi. Il codice mosca settimanale sul tuo TRMNL è legato alla tua installazione e non compare mai nell’app.</p>
      <p>Nelle <Link to="/app/idle-angler/settings">impostazioni di Idle Angler</Link>, Elimina i progressi di Idle Angler rimuove il tuo pescatore, il frigo portatile, il registro, i record in classifica e negli Open, la parete dei trofei e le medaglie, la scatola delle mosche, gli obiettivi, i collegamenti di Idle Angler e le impostazioni degli avvisi di Idle Angler. Il tuo account e gli altri giochi restano. Eliminare l’account TRMNL Games rimuove Idle Angler insieme a tutto il resto.</p>
    </>
  ),
  PaperLives: () => (
    <>
      <h2>Paper Lives</h2>
      <p>Paper Lives conserva la tua vita attuale e quelle concluse: nome, pronomi, tratti, statistiche, denaro, lavoro e casa di ogni personaggio, le persone della sua vita, la sua storia e le scelte che hai fatto, più i record e le foto dell’album e i tuoi obiettivi. Le tue vite più lunghe e le fortune più grandi compaiono con il tuo nome pubblico nelle classifiche di Paper Lives e sugli schermi TRMNL degli altri giocatori. A meno che tu non nasconda Paper Lives dal tuo profilo pubblico nelle impostazioni di Paper Lives, chiunque abbia il link vede nome, età, lavoro e tratti del tuo personaggio attuale, quante vite hai vissuto, il tuo albero genealogico e le vite concluse, ognuna con epitaffio, momenti salienti e foto. I nomi dei personaggi sono pubblici su quelle pagine, quindi non metterci dati di persone reali.</p>
      <p>Se attivi gli avvisi di Paper Lives, usano gli stessi dispositivi e le stesse ore di silenzio degli avvisi degli altri giochi, e l’avviso mostra il nome del tuo personaggio. Il codice foto settimanale sul tuo TRMNL è legato alla tua installazione e non compare mai nell’app.</p>
      <p>Nelle <Link to="/app/paper-lives/settings">impostazioni di Paper Lives</Link>, Elimina i progressi di Paper Lives rimuove le tue vite, l’album e le sue foto, i record in classifica, gli obiettivi, i collegamenti di Paper Lives e le impostazioni degli avvisi di Paper Lives. Il tuo account e gli altri giochi restano. Eliminare l’account TRMNL Games rimuove Paper Lives insieme a tutto il resto.</p>
    </>
  ),
}
