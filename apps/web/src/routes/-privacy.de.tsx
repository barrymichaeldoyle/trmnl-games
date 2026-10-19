import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const privacyDe: LegalPage = {
  title: 'Datenschutz',
  description: 'Was TRMNL Games speichert, was in Ranglisten und auf TRMNL-Bildschirmen öffentlich ist und wie du dein Konto löschst.',
  translationNote: () => <p className="text-sm text-muted">Übersetzung der englischen Fassung, die bei Abweichungen maßgeblich ist.</p>,
  Body: () => (
    <>
      <p>
        TRMNL Games ist eine Sammlung von Spielen, betrieben von Barry Michael Doyle, einem unabhängigen Entwickler. Diese Seite erklärt in einfachen Worten, was der Dienst speichert,
        wer es verarbeitet und wie du es entfernen lässt. Fragen an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Was öffentlich ist</h2>
      <p>
        Dein öffentlicher Name, Name und Stufe deines Helden und deine Ränge erscheinen in Ranglisten und auf den TRMNL-Bildschirmen anderer Spieler. Wähle einen öffentlichen Namen,
        den du gern teilst, und schreib nie Kontaktdaten hinein.
      </p>
      <p>
        In Desk Crawler überfallen Helden gegenseitig ihre Schreibtische und begegnen sich zufällig. Wenn dein Held überfällt, überfallen wird oder einem anderen Helden begegnet, erscheint dein öffentlicher Name im Abenteuerlog des anderen Spielers, in seiner Begleit-App und auf seinem TRMNL, so wie schon in den Ranglisten. Wird dein Held k. o. geschlagen, kann er ein Ersatzstück mit deinem öffentlichen Namen fallen lassen, das der Held eines anderen Spielers finden und behalten kann; dein Name steht dann auf diesem Gegenstand in dessen Begleit-App und auf dessen Heldenseite. Änderst du deinen Namen oder löschst dein Konto, zeigen diese Geschichten und Gegenstände stattdessen „Verborgener Spieler“ oder verlieren den Namen.
      </p>
      <p>
        Dein Desk-Crawler-Held hat eine öffentliche Seite: Wer den Link hat, sieht deinen öffentlichen Namen, Namen, Stufe, Rang, aktuelle Etage und Startdatum deines Helden, ein paar Gesamtzähler und deine Erfolge. Gold, das Abenteuerlog und deine Kontodaten bleiben privat, ebenso deine Ausrüstung, außer Ersatzstücken anderer Spieler, die dein Held hat; die erscheinen mit den Namen darauf. Die Seite ist standardmäßig an. Meine Heldenseite verbergen in den Einstellungen verbirgt sie sofort, und du kannst sie jederzeit wieder zeigen.
      </p>
      <p>
        Angemeldete Spieler können einer öffentlichen Heldenseite folgen. Wir speichern, wer wem folgt, damit ihre Begleit-App die Spieler auflisten kann, denen sie folgen. Niemand erfährt, dass ihm gefolgt wird, und keine Seite zeigt, wer einem Spieler folgt, außer dass ein als Rivale markierter Spieler sieht, wer ihn markiert hat. Änderst du deinen öffentlichen Namen, verbirgst deine Seite oder löschst deinen Fortschritt, sehen andere Spieler deinen Helden nicht mehr in ihrer Liste, und beim Löschen werden diese Einträge entfernt.
      </p>

      <h2>Was wir speichern</h2>
      <ul>
        <li>Deine Anmeldeidentität von Clerk, unserem Anmeldedienst. Deine E-Mail-Adresse wird nur in kurzlebige Anfragen zur Löschbestätigung kopiert; deinen echten Namen und dein Profilbild kopieren wir nicht in die Spieldatenbank.</li>
        <li>Deinen öffentlichen Namen, deinen Helden, Gegenstände, das Abenteuerlog und die jüngsten XP für die Ranglisten. Ältere Konten haben eventuell noch eine gespeicherte Zeitzone aus früheren Versionen.</li>
        <li>Wenn du Desk-Crawler-Benachrichtigungen einschaltest: welche Benachrichtigungen du willst, deine Ruhezeiten und die Zeitzone deines Browsers (zum Beispiel Europe/Berlin) und für jedes erlaubte Gerät die Push-Adresse, die dein Browser uns gibt, ihre Schlüssel und eine Bezeichnung wie „Chrome auf Android“. Außerdem führen wir eine kurze Liste jeder Benachrichtigung: welche Art, wann und ob sie gesendet wurde.</li>
        <li>
          Für jede TRMNL-Installation: die Instanz-ID des Plugins, einen Hash seines Zugriffstokens und den Einstellungslink, den TRMNL uns gibt. Deinen TRMNL-Namen
          und deine TRMNL-E-Mail speichern wir nicht.
        </li>
        <li>Die Zeitverschiebung, die dein TRMNL mit jedem Bildschirm schickt (zum Beispiel UTC+2), damit das Morgen-Stand-up von Desk Crawler deinem Tag folgt. Wir behalten nur die letzte.</li>
        <li>Die Spracheinstellung, die dein TRMNL mit jedem Bildschirm schickt (zum Beispiel de-DE), damit wir sehen, in welche Sprachen sich eine Übersetzung lohnt, und damit dein Bildschirm deine Sprache verwenden kann. Wir behalten nur die letzte.</li>
        <li>Wenn du eine Sprache für TRMNL Games wählst, diese Wahl, damit deine TRMNL-Bildschirme und Benachrichtigungen sie auch verwenden.</li>
        <li>Kurzlebige Betriebsdaten wie Zähler zur Ratenbegrenzung und Belege für doppelte Anfragen.</li>
        <li>Wenn du die Kontolöschung anforderst: deine bestätigte Haupt-E-Mail-Adresse, einen Hash des Bestätigungslinks und den Zustellstatus. Der Link läuft nach 30 Minuten ab; abgelaufene Anfragen entfernt eine tägliche Bereinigung.</li>
        <li>Die Desk-Crawler-Startliste enthielt E-Mail-Adressen für eine einzige E-Mail, als Desk Crawler in den TRMNL-Marktplatz kam. Diese E-Mail ging am 13. Oktober 2026 raus, jede Adresse wurde gelöscht, und die Liste ist geschlossen.</li>
        <li>Die Helden-Erinnerung: Wenn dein Desk-Crawler-Held seit zwei Tagen unterwegs ist und du die Desk-Crawler-App nie geöffnet hast, schicken wir eine einzige E-Mail an deine bestätigte Hauptadresse, die sagt, was dort auf dich wartet, mit einem Link zum Abbestellen. Die Adresse wird beim Versand bei Clerk abgefragt und nicht gespeichert. Wir behalten nur, wann sie verschickt wurde oder dass du keine willst.</li>
        <li>Wenn du Feedback sendest: deine Nachricht, die Seite, von der du sie gesendet hast, deinen öffentlichen Namen und einen Link zu deinem Konto. Sie geht per E-Mail an den Entwickler, mit deiner bestätigten Haupt-E-Mail-Adresse als Antwortadresse.</li>
      </ul>

      <h2>Was wir nicht tun</h2>
      <p>Keine Werbung und kein Verkauf oder Weitergeben deiner Daten zu Marketingzwecken. Im Spiel gibt es keine Käufe, also haben wir keine Zahlungsdaten.</p>

      <h2>Optionale Analyse und Support</h2>
      <p>Wenn du Analyse erlaubst, zeichnet PostHog die besuchten Seiten, Einrichtungsschritte, fehlgeschlagene Spielaktionen und Browserfehler auf. Wenn du angemeldet bist, werden diese Daten mit deiner Clerk-Konto-ID, deiner E-Mail-Adresse, deinem öffentlichen Namen und dem Namen deines Helden verknüpft, damit wir Supportanfragen nachgehen und Probleme beheben können. Browserfehler gehen auch an Sentry, ohne dein Konto, deine E-Mail oder deine IP-Adresse.</p>
      <p>PostHog zeichnet außerdem maskierte Sitzungen auf, damit wir sehen, wo ein Ablauf hängt. Text und Formulareingaben sind maskiert, Anmelde- und Kontodaten blockiert, und wir zeichnen weder Netzwerkinhalte noch Header noch Konsolenausgaben auf. Installationscodes, Zugriffstokens, Verwaltungs-JWTs und URL-Parameter sind ausgeschlossen.</p>
      <p>Du kannst ablehnen und weiterspielen. Über Analyse-Einstellungen im Fußbereich der Website änderst du deine Wahl. Das Ausschalten stoppt neue Erfassung in diesem Browser; frühere Daten werden dadurch nicht gelöscht. Schreib uns, um sie entfernen zu lassen, oder lösche dein TRMNL-Games-Konto, um die Entfernung des verknüpften PostHog-Profils samt Ereignissen und Aufzeichnungen zu beantragen.</p>

      <h2>Cookies</h2>
      <p>
        Clerk setzt Cookies, die dich angemeldet halten. Während du eine TRMNL-Installation verbindest oder verwaltest, setzen wir ein kurzlebiges verschlüsseltes Cookie, das
        nach wenigen Minuten abläuft. Ein Löschbestätigungslink nutzt ein kurzlebiges verschlüsseltes Cookie, damit du dich vor der Bestätigung anmelden kannst. Wenn du Analyse erlaubst, nutzt PostHog den lokalen Speicher des Browsers, um deine Besuche wiederzuerkennen. Außerdem speichern wir deine Analyse-Einstellung lokal, und ein Cookie merkt sich die gewählte Sprache. Es gibt keine Werbe-Cookies.
      </p>

      <h2>Dienste, die deine Daten verarbeiten</h2>
      <ul>
        <li><strong>Clerk</strong> betreibt die Anmeldung und hält deine E-Mail-Adresse und Anmeldemethode, dazu dein Google- oder GitHub-Profil, wenn du dich damit anmeldest.</li>
        <li><strong>Convex</strong> hostet die Spieldatenbank, die Spiel-Updates alle 15 Minuten und die täglichen Sicherungen.</li>
        <li><strong>Cloudflare</strong> hostet diese Website und führt übliche Anfrageprotokolle.</li>
        <li><strong>TRMNL</strong> holt den Bildschirm deines Helden bei uns ab. Für dein TRMNL-Konto und dein Gerät gilt die Datenschutzerklärung von TRMNL.</li>
        <li><strong>PostHog EU</strong> verarbeitet optionale Nutzungsanalyse, Fehlerberichte und maskierte Sitzungsaufzeichnungen für Support und Produktverbesserungen.</li>
        <li><strong>Sentry</strong> (USA) erhält Fehlerberichte vom Server unserer Website und vom Spiel-Backend, und von deinem Browser, wenn du Analyse erlaubst, damit wir Fehler finden und beheben können. Ein Bericht enthält den Seitenpfad oder den Namen der fehlgeschlagenen Spielfunktion und die technischen Details des Fehlers. Er enthält nie dein Konto, deine E-Mail-Adresse, IP-Adresse, Cookies, Formularinhalte, URL-Parameter oder Installationscodes und -tokens.</li>
        <li><strong>Der Push-Dienst deines Browsers</strong> (Google für Chrome und Android, Apple für Safari, Mozilla für Firefox) stellt Desk-Crawler-Benachrichtigungen zu, wenn du sie einschaltest. Er erhält die Benachrichtigung verschlüsselt, kann sie also nicht lesen, zusammen mit der Push-Adresse, die dein Browser erstellt hat.</li>
        <li><strong>Resend</strong> stellt die E-Mail zur Kontolöschung an deine bestätigte Hauptadresse zu, die Start-E-Mail (einmal gesendet, am 13. Oktober 2026) und Feedback, das du an den Entwickler schickst. Es erhält diese Adressen und die Inhalte der E-Mails. Er stellt auch die einzige Helden-Erinnerung zu.</li>
      </ul>

      <h2>Wie lange wir es behalten</h2>
      <ul>
        <li>Dein gemeinsames Konto: bis du es löschst. Spielfortschritt: bis du dieses Spiel oder dein Konto löschst.</li>
        <li>Ausführliches Abenteuerlog: drei Tage. Lauf-Zusammenfassungen: 30 Tage. Jüngste XP für Ranglisten: sieben Tage.</li>
        <li>Belege für doppelte Anfragen: 24 Stunden. TRMNL-Verbindungsversuche: unter einem Tag.</li>
        <li>Startliste: gelöscht, als die Start-E-Mail am 13. Oktober 2026 rausging. Wir behalten keine Kopie.</li>
        <li>Helden-Erinnerung: wann sie verschickt wurde oder dass du keine willst, bis du dein Konto löschst.</li>
        <li>Feedback: bis du dein Konto löschst, oder früher auf Anfrage. Bereits an den Entwickler gemailte Kopien werden auf Anfrage gelöscht.</li>
        <li>Benachrichtigungseinstellungen und Geräte: bis du Benachrichtigungen ausschaltest, das Gerät entfernst oder Desk Crawler oder dein Konto löschst. Ein Gerät, dessen Push-Adresse nicht mehr funktioniert, wird automatisch entfernt. Liste der einzelnen Benachrichtigungen: sieben Tage.</li>
        <li>Sicherungen: etwa eine Woche, danach sind gelöschte Daten auch daraus verschwunden.</li>
        <li>Maskierte Aufzeichnungen: 30 Tage. Analyseereignisse und Supportprofile: bis zur Kontolöschung oder einem früheren Löschantrag.</li>
        <li>Fehlerberichte in Sentry: bis zu 90 Tage. Sie sind nicht mit deinem Konto verknüpft, also gibt es dort bei einer Kontolöschung nichts zu entfernen.</li>
      </ul>

      <h2>Dein Konto löschen</h2>
      <p>
        Geh zu <Link to="/account">Konto</Link> und fordere einen Löschlink an. Wir schreiben an deine bestätigte Hauptadresse; der Link läuft nach 30 Minuten ab. Melde dich mit demselben Konto an und gib auf der Bestätigungsseite DELETE ein. Bis du bestätigst, bleibt dein Konto aktiv. Nach der Bestätigung funktioniert dein Konto sofort nicht mehr, dein öffentlicher Name wird in den
        Ranglisten verborgen, und danach werden dein Held, deine Gegenstände, dein Verlauf, deine TRMNL-Verbindungen und deine TRMNL-Games-Anmeldung entfernt. Ranglisten-Momentaufnahmen, die deinen Namen kopiert haben,
        werden innerhalb von etwa zwei Stunden ersetzt. Wenn du dich nicht anmelden kannst, schreib uns, und wir erledigen es für dich.
      </p>
      <p>
        Wir behalten nur einen Einweg-Hash deiner Anmeldeidentität und deiner alten TRMNL-Tokens, damit ein gelöschtes Konto nicht unbemerkt wieder verbunden werden kann. Bilder, die schon
        an ein TRMNL-Gerät geschickt oder von TRMNL zwischengespeichert wurden, können wir nicht löschen; entferne das Plugin aus deiner Playlist, um sie zu ersetzen. Zähler zur Ratenbegrenzung werden beim Löschen entfernt, und Kontobezüge in administrativen Prüfeinträgen werden getilgt.
      </p>
      <p>Die Entfernung verknüpfter PostHog-Profile, -Ereignisse und -Aufzeichnungen wird im Rahmen der Kontolöschung beantragt und von PostHog asynchron bearbeitet. Fehlgeschlagene Anträge werden wiederholt und bleiben für den Betreiber sichtbar, bis sie erledigt sind.</p>

      <h2>Nur ein Spiel löschen</h2>
      <p>Wähle in den <Link to="/app/desk-crawler/settings">Desk-Crawler-Einstellungen</Link> Desk-Crawler-Fortschritt löschen, um diesen Helden, den Verlauf, die Verbindungen und die Benachrichtigungseinstellungen und Geräte zu entfernen. Dein gemeinsames Konto und deine Anmeldung bleiben erhalten. Nach Abschluss der Entfernung kannst du neu anfangen, indem du das Plugin installierst. Andere Spiele sind nicht betroffen.</p>

      <h2>Deine Wahlmöglichkeiten</h2>
      <p>
        Du kannst eine Kopie deiner Spieldaten anfordern oder etwas berichtigen oder löschen lassen, per E-Mail an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Wir antworten in der Regel innerhalb von zwei Werktagen.
      </p>

      <h2>Kinder</h2>
      <p>TRMNL Games richtet sich nicht an Kinder unter 13 Jahren, und wir halten wissentlich keine Daten von ihnen. Wenn du glaubst, dass ein Kind ein Konto hat, schreib uns, und wir löschen es.</p>

      <h2>Änderungen</h2>
      <p>Wenn sich diese Erklärung ändert, aktualisieren wir diese Seite und das Datum oben.</p>
    </>
  ),
  IdleAngler: () => (
    <>
      <h2>Idle Angler</h2>
      <p>Idle Angler speichert deinen Angler: Münzen, Gewässer und Köder, deine Kühlbox, dein Fangbuch mit Arten und Bestgewichten, deinen Angelverlauf, deine schwersten Fische an jedem Gewässer und in jedem Wochenend-Open, deine Aufträge vom Fischhändler, Trophäenwand und Medaillen, Erfolge und Fliegendose. Deine schwersten Fische erscheinen unter deinem öffentlichen Namen in den Ranglisten und Open-Ergebnissen von Idle Angler und auf den TRMNL-Bildschirmen anderer Spieler. Wenn du Idle Angler nicht in den Idle-Angler-Einstellungen aus deinem öffentlichen Profil ausblendest, sieht jeder mit dem Link deinen Titel, dein Startdatum, die Zahl deiner Erfolge, die eingetragenen Arten, die Zahl deiner Medaillen und die Fische an deiner Trophäenwand.</p>
      <p>Wenn du Idle-Angler-Benachrichtigungen einschaltest, nutzen sie dieselben Geräte und Ruhezeiten wie die Benachrichtigungen deiner anderen Spiele. Der wöchentliche Fliegen-Code auf deinem TRMNL ist an deine Installation gebunden und wird nie in der Begleit-App gezeigt.</p>
      <p>In den <Link to="/app/idle-angler/settings">Idle-Angler-Einstellungen</Link> entfernt Idle-Angler-Fortschritt löschen deinen Angler, Kühlbox, Fangbuch, Ranglisten- und Open-Einträge, Trophäenwand und Medaillen, Fliegendose, Erfolge, Idle-Angler-Verbindungen und Idle-Angler-Benachrichtigungseinstellungen. Dein Konto und andere Spiele bleiben. Das Löschen deines TRMNL-Games-Kontos entfernt Idle Angler mit allem anderen.</p>
    </>
  ),
  PaperLives: () => (
    <>
      <h2>Paper Lives</h2>
      <p>Paper Lives speichert dein aktuelles Leben und deine beendeten: Name, Pronomen, Eigenschaften, Werte, Geld, Beruf und Zuhause jeder Figur, die Menschen in ihrem Leben, ihre Geschichte und die Entscheidungen, die du getroffen hast, dazu die Einträge und Fotos des Albums und deine Erfolge. Deine längsten Leben und größten Vermögen erscheinen unter deinem öffentlichen Namen in den Ranglisten von Paper Lives und auf den TRMNL-Bildschirmen anderer Spieler. Wenn du Paper Lives nicht in den Paper-Lives-Einstellungen aus deinem öffentlichen Profil ausblendest, sieht jeder mit dem Link Namen, Alter, Beruf und Eigenschaften deiner aktuellen Figur, wie viele Leben du gelebt hast, deinen Stammbaum und deine beendeten Leben, jeweils mit Grabinschrift, Höhepunkten und Fotos. Die Namen der Figuren sind auf diesen Seiten öffentlich, also lass Angaben über echte Menschen weg.</p>
      <p>Wenn du Paper-Lives-Benachrichtigungen einschaltest, nutzen sie dieselben Geräte und Ruhezeiten wie die Benachrichtigungen deiner anderen Spiele, und die Benachrichtigung zeigt den Vornamen deiner Figur. Der wöchentliche Foto-Code auf deinem TRMNL ist an deine Installation gebunden und wird nie in der Begleit-App gezeigt.</p>
      <p>In den <Link to="/app/paper-lives/settings">Paper-Lives-Einstellungen</Link> entfernt Paper-Lives-Fortschritt löschen deine Leben, das Album und seine Fotos, Ranglisteneinträge, Erfolge, Paper-Lives-Verbindungen und Paper-Lives-Benachrichtigungseinstellungen. Dein Konto und andere Spiele bleiben. Das Löschen deines TRMNL-Games-Kontos entfernt Paper Lives mit allem anderen.</p>
    </>
  ),
}
