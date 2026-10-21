import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'
import { TERMS_HEAD } from './-legalHeads'

export const termsIt: LegalPage = {
  title: TERMS_HEAD.it.title,
  seoTitle: TERMS_HEAD.it.seoTitle,
  description: TERMS_HEAD.it.description,
  translationNote: () => <p className="text-sm text-muted">Traduzione della versione inglese, che prevale in caso di differenze.</p>,
  Body: () => (
    <>
      <p>
        Questi termini riguardano il tuo uso di TRMNL Games e dei suoi giochi, gestiti da Barry Michael Doyle. Creando un account o collegando un’installazione TRMNL li accetti.
        Valgono insieme all’<Link to="/privacy">informativa sulla privacy</Link>.
      </p>

      <h2>Il gioco</h2>
      <ul>
        <li>Desk Crawler è gratis. Non ci sono acquisti, abbonamenti né pubblicità.</li>
        <li>
          Il gioco cambia nel tempo: bilanciamento, contenuti e funzioni possono essere modificati. Cerchiamo di conservare i progressi del tuo eroe a ogni aggiornamento, ma non
          possiamo garantirlo.
        </li>
        <li>Possiamo sospendere o chiudere il servizio. Quando possibile, lo annunceremo prima nell’app.</li>
      </ul>

      <h2>Il tuo account</h2>
      <ul>
        <li>Per giocare devi avere almeno 13 anni.</li>
        <li>Tieni al sicuro il tuo accesso. Sei responsabile di ciò che succede tramite il tuo account.</li>
        <li>
          Puoi eliminare il tuo account in qualsiasi momento da <Link to="/account">Account</Link>.
        </li>
      </ul>

      <h2>Fair play e nomi pubblici</h2>
      <ul>
        <li>
          I nomi pubblici e degli eroi devono rispettare le <Link to="/support">regole sui nomi</Link>: niente contenuti d’odio o sessuali, minacce o molestie, dati di contatto
          o imitazioni di altre persone.
        </li>
        <li>Non automatizzare il gioco, non sfruttare bug, non interferire con il servizio o con gli altri giocatori e non cercare di accedere a dati che non sono tuoi. Segnala i bug invece.</li>
        <li>
          Possiamo nascondere un nome, o sospendere un account per abusi deliberati o ripetuti. Nascondere un nome non tocca mai i progressi del tuo eroe. Per fare ricorso, scrivi a{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Oro e oggetti</h2>
      <p>Oro, equipaggiamento e pozioni fanno parte solo del gioco. Non hanno valore in denaro e non si possono vendere, scambiare o trasferire fuori dal gioco.</p>

      <h2>TRMNL</h2>
      <p>
        TRMNL Games e Desk Crawler sono progetti indipendenti. Non sono realizzati, approvati né supportati da TRMNL. Il tuo account e il tuo dispositivo TRMNL sono regolati dai termini di TRMNL.
      </p>

      <h2>Proprietà</h2>
      <p>
        Il codice sorgente è aperto con licenza MIT su{' '}
        <a href="https://github.com/barrymichaeldoyle/trmnl-games">GitHub</a>. Le illustrazioni, i nomi di mostri, oggetti e luoghi, i testi scritti del gioco e
        il nome e il logo di Desk Crawler non rientrano in quella licenza e restano con tutti i diritti riservati.
      </p>

      <h2>Nessuna garanzia</h2>
      <p>
        TRMNL Games è fornito così com’è, senza garanzie di alcun tipo. Nei limiti consentiti dalla legge, non rispondiamo di progressi persi, interruzioni del servizio,
        di ciò che compare sul tuo dispositivo o di qualsiasi danno indiretto. Nulla in questi termini toglie i diritti che hai come consumatore e che non possono essere esclusi.
      </p>

      <h2>Modifiche</h2>
      <p>Quando questi termini cambiano, aggiorniamo questa pagina e la data in alto. Se continui a giocare dopo una modifica, valgono i nuovi termini.</p>

      <h2>Contatti</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </>
  ),
}
