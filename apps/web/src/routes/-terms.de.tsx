import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const termsDe: LegalPage = {
  title: 'Nutzungsbedingungen',
  description: 'Die Regeln für Desk Crawler: ein kostenloses Spiel, bereitgestellt wie es ist, mit Regeln für Fairplay und öffentliche Namen.',
  translationNote: () => <p className="text-sm text-muted">Übersetzung der englischen Fassung, die bei Abweichungen maßgeblich ist.</p>,
  Body: () => (
    <>
      <p>
        Diese Bedingungen gelten für deine Nutzung von TRMNL Games und seinen Spielen, betrieben von Barry Michael Doyle. Mit dem Anlegen eines Kontos oder dem Verbinden einer TRMNL-Installation
        stimmst du ihnen zu. Sie gelten neben der <Link to="/privacy">Datenschutzerklärung</Link>.
      </p>

      <h2>Das Spiel</h2>
      <ul>
        <li>Desk Crawler ist kostenlos. Es gibt keine Käufe, Abos oder Werbung.</li>
        <li>Das Spiel verändert sich mit der Zeit: Balance, Inhalte und Funktionen können angepasst werden. Wir bemühen uns, den Fortschritt deines Helden über Updates hinweg zu erhalten, können es aber nicht garantieren.</li>
        <li>Wir können den Dienst pausieren oder einstellen. Wo möglich, kündigen wir das vorher in der Begleit-App an.</li>
      </ul>

      <h2>Dein Konto</h2>
      <ul>
        <li>Du musst mindestens 13 Jahre alt sein, um zu spielen.</li>
        <li>Halte deine Anmeldung sicher. Du bist verantwortlich für das, was über dein Konto passiert.</li>
        <li>Du kannst dein Konto jederzeit unter <Link to="/account">Konto</Link> löschen.</li>
      </ul>

      <h2>Fairplay und öffentliche Namen</h2>
      <ul>
        <li>Öffentliche Namen und Heldennamen müssen den <Link to="/support">Namensregeln</Link> folgen: keine hasserfüllten oder sexuellen Inhalte, keine Drohungen oder Belästigung, keine Kontaktdaten und kein Nachahmen anderer.</li>
        <li>Automatisiere das Spiel nicht, nutze keine Fehler aus, störe weder den Dienst noch andere Spieler und versuche nicht, auf fremde Daten zuzugreifen. Melde Fehler stattdessen.</li>
        <li>Wir können einen Namen verbergen oder ein Konto bei absichtlichem oder wiederholtem Missbrauch sperren. Das Verbergen eines Namens berührt nie den Fortschritt deines Helden. Für einen Widerspruch schreib an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</li>
      </ul>

      <h2>Gold und Gegenstände</h2>
      <p>Gold, Ausrüstung und Tränke gibt es nur im Spiel. Sie haben keinen Geldwert und können außerhalb des Spiels nicht verkauft, getauscht oder übertragen werden.</p>

      <h2>TRMNL</h2>
      <p>TRMNL Games und Desk Crawler sind unabhängige Projekte. Sie werden nicht von TRMNL erstellt, unterstützt oder befürwortet. Für dein TRMNL-Konto und dein Gerät gelten die Bedingungen von TRMNL.</p>

      <h2>Eigentum</h2>
      <p>
        Der Quellcode steht unter der MIT-Lizenz auf <a href="https://github.com/barrymichaeldoyle/trmnl-games">GitHub</a>. Die Grafiken, die Namen von Monstern, Gegenständen und Orten, die Spieltexte und
        der Name und das Logo von Desk Crawler fallen nicht unter diese Lizenz; alle Rechte daran bleiben vorbehalten.
      </p>

      <h2>Keine Gewährleistung</h2>
      <p>
        TRMNL Games wird ohne jegliche Gewährleistung bereitgestellt, so wie es ist. Soweit gesetzlich zulässig, haften wir nicht für verlorenen Fortschritt, Dienstunterbrechungen,
        das, was auf deinem Gerät erscheint, oder mittelbare Schäden. Nichts in diesen Bedingungen schränkt Rechte ein, die dir nach Verbraucherrecht zwingend zustehen.
      </p>

      <h2>Änderungen</h2>
      <p>Wenn sich diese Bedingungen ändern, aktualisieren wir diese Seite und das Datum oben. Spielst du nach einer Änderung weiter, gelten die neuen Bedingungen.</p>

      <h2>Kontakt</h2>
      <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </>
  ),
}
