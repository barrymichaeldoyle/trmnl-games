import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'

const w = anglerWords('de')
const n = (value: number) => w.number(value)
const und = (parts: readonly string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} und ${parts.at(-1)}`)

export const de: HelpPage = {
  seoTitle: 'Hilfe zu Idle Angler',
  description: 'So angelt Idle Angler auf deinem TRMNL: Köder, Kühlbox, Ruten, Gewässer, Jahreszeiten, Fangbuch, Wochenend-Opens und Fliegendose.',
  title: 'Idle Angler auf TRMNL',
  contents: {
    'getting-started': 'Erste Schritte',
    goals: 'Ziele und was sich wann öffnet',
    'how-fishing-works': 'So funktioniert das Angeln',
    'time-and-weather': 'Tageszeit, Wetter und Jahreszeiten',
    bait: 'Köder und Köderfisch',
    'the-fishmonger': 'Der Fischhändler',
    'the-cooler': 'Die Kühlbox',
    'rods-and-fish-that-get-away': 'Ruten und Fische, die entkommen',
    waters: 'Gewässer',
    'the-logbook': 'Das Fangbuch und die Titel',
    rankings: 'Ranglisten und Wochenend-Opens',
    'the-trophy-wall': 'Die Trophäenwand',
    'the-fly-box': 'Die Fliegendose',
    achievements: 'Erfolge',
    alerts: 'Benachrichtigungen',
    'pausing-and-removing': 'Pausieren und entfernen',
    help: 'Hilfe',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Erste Schritte</h2>
      <ul>
        <li>Installiere Idle Angler aus dem TRMNL-Plugin-Marktplatz und wähle Installieren.</li>
        <li>Melde dich bei TRMNL Games an und verbinde die Installation. Dein Angler trägt deinen öffentlichen Namen.</li>
        <li>Klicke zurück in TRMNL auf Speichern. Innerhalb von fünfzehn Minuten wirft dein Angler zum ersten Mal aus und fängt einen Fisch.</li>
        <li>Füge das Plugin einer Playlist oder einem Mashup hinzu. Alle vier Layoutgrößen funktionieren in beiden Ausrichtungen.</li>
      </ul>
      <h2 id="goals">Ziele und was sich wann öffnet</h2>
      <p>Der Steg zeigt immer ein Ziel, etwa „{w.goal('first_sale')}“ oder „{w.goal('dawn_dusk')}“. Erreichst du es, werden ein paar Münzen zurückgelegt: Tippe auf dem Steg auf Abholen, dann erscheint das nächste Ziel. Ein Punkt am Steg-Tab zeigt, dass etwas wartet. Ziele verfallen nie, und etwa die Hälfte erreicht dein Angler ohne dich.</p>
      <p>Das Spiel öffnet sich, während sich dein Fangbuch füllt: bessere Ruten und Kühlboxen bei {F.unlocks.shop_upgrades} Arten, Aufträge vom Fischhändler bei {F.unlocks.orders}, die Wochenend-Opens bei {F.unlocks.opens}, die Trophäenwand bei {F.unlocks.trophies} und Köderfisch bei {F.unlocks.deadbait}. Der Steg sagt, was als Nächstes kommt.</p>
      <h2 id="how-fishing-works">So funktioniert das Angeln</h2>
      <p>Alle fünfzehn Minuten, Tag und Nacht, wirft dein Angler einmal aus. Manchmal beißt ein Fisch. Welcher, hängt vom Gewässer, vom Köder, von der Tageszeit und vom Wetter ab. Sein Gewicht bestimmt den Preis, ob er ein persönlicher Rekord ist und wo er in den Ranglisten landet. Dein TRMNL zeigt die Szene, die neuesten Geschichten und die Wochenrangliste deines Gewässers. In der Begleit-App verkaufst du deinen Fang, kaufst Köder oder wechselst das Gewässer.</p>
      <h2 id="time-and-weather">Tageszeit, Wetter und Jahreszeiten</h2>
      <p>Das Morgengrauen geht von 05:00 bis 08:00, der Tag bis 17:00, die Dämmerung bis 20:00, dann ist Nacht, in der Zeitzone, die dein TRMNL meldet. Im Morgengrauen und in der Dämmerung beißen Fische öfter. Das Wetter ist für alle Angler an einem Gewässer gleich und wechselt alle sechs Stunden: klar, bedeckt, Regen, Wind oder Nebel. Bedeckter Himmel und Regen bringen {w.waterName('river_bend').at} mehr Bisse, Wind weniger, und Nebel macht Morgengrauen und Dämmerung dunkel genug für Nachtfische.</p>
      <p>Die Gewässer haben eigene Jahreszeiten, für alle gleich: Frühling, Sommer, Herbst und Winter, je eine Woche, mit Wechsel jeden Montag um 00:00 UTC. Manche Fische beißen nur in einer Jahreszeit, im Süßwasser wird es im Winter ruhiger, und die Szene zeigt Blüten, Laub oder Schnee. Jede Jahreszeit hat einen Zug, von Montag bis Donnerstag, wenn eine Art da ist: {und(F.runs.map((id) => w.species(id)))}.</p>
      <h2 id="bait">Köder und Köderfisch</h2>
      <p>Jedes Gewässer hat seine eigenen Köder, und der Köder entscheidet, welche Fische beißen können; der Laden zeigt, welche Fische welchen Köder nehmen. Den Köder wählst du auf der Steg-Seite. Jeder Fisch, den du behältst oder der entkommt, verbraucht einen Köder. Ein Wurf ohne Biss verbraucht keinen, ein Fisch, der bei voller Kühlbox freigelassen wird, auch nicht. Ohne Köder für das Gewässer angelt dein Angler mit blankem Haken, der weniger Bisse und nur kleine Fische bringt. Köder kaufst du in Dosen im Laden, bis zu {F.baitCap} von jedem; Köder verderben nie.</p>
      <p>Kleine Fische wie Rotauge, Hasel, Ukelei und Makrele können aus der Kühlbox als Köderfisch wieder an den Haken: Ein Fisch ergibt {F.deadbaitPerFish} Köder, bis zu {F.deadbaitCap} auf Vorrat. Nur Räuber nehmen Köderfisch, etwa Barsch, Hecht, Zander, Aal und die großen Meeresfische, und sie fallen damit schwerer aus.</p>
      <h2 id="the-fishmonger">Der Fischhändler</h2>
      <p>Der Fischhändler hängt {F.orderSlots} Aufträge aus, etwa „{w.text('Two Roach')}“ oder „{w.text('One fish over 1.5 kg')}“. Wenn Fische in deiner Kühlbox zu einem Auftrag passen, erscheint der Fischhändler auf der Kühlbox-Seite mit diesen Fischen und einem Verkaufen-Knopf: Er zahlt das 1,5-Fache des Marktpreises plus einen Bonus, und die Seite zeigt beide Preise. Aufträge verfallen nie, und ein leerer Platz füllt sich um 07:00 deiner Zeit. Dein Angler kann seinen Fang nicht wählen, deshalb zeigt sich der Fischhändler nur, wenn es ihm etwas zu verkaufen gibt.</p>
      <h2 id="the-cooler">Die Kühlbox</h2>
      <p>Fische kommen in die Kühlbox, bis du sie verkaufst. Ist sie voll, angelt dein Angler weiter und lässt seinen Fang frei. Freigelassene Fische kommen trotzdem ins Fangbuch, zählen für Erfolge und können Ranglisten anführen, bringen aber keine Münzen. Dein TRMNL zeigt, wenn die Kühlbox voll ist, und sein QR-Code öffnet die Kühlbox. Eine größere Kühlbox heißt weniger freigelassene Fische zwischen zwei Besuchen. Das Spiel verkauft nie Fische für dich.</p>
      <h2 id="rods-and-fish-that-get-away">Ruten und Fische, die entkommen</h2>
      <p>Jede Rute holt Fische bis zu einem bestimmten Gewicht heraus. Ein schwererer Fisch reißt sich los, und die Geschichte sagt, dass etwas Schweres davongezogen ist. Eine bessere Rute hätte ihn gelandet. Bessere Ruten bringen außerdem ein paar Bisse mehr.</p>
      <h2 id="waters">Gewässer</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong>: Hier fangen alle an. Rotaugen, Barsche und Brachsen, Karpfen im Morgengrauen und in der Dämmerung, Aale in der Nacht.</li>
        <li><strong>{w.water('river_bend')}</strong>: öffnet sich, sobald {F.gates.river_bend} Arten {w.waterName('millpond').of} im Fangbuch stehen, mit der {w.pass('waders')}. Forellen, Döbel und Barben, dazu Hecht und Zander auf Spinner.</li>
        <li><strong>{w.water('harbour_pier')}</strong>: öffnet sich, sobald {F.gates.harbour_pier} Arten {w.waterName('river_bend').of} im Fangbuch stehen, mit der {w.pass('pier_permit')}. Meeresfische, größer und mehr wert. Die meisten brauchen die {w.rod('Carbon Rod')} oder eine bessere.</li>
        <li><strong>{w.water('heron_lake')}</strong>: öffnet sich, sobald {F.gates.heron_lake} Arten {w.waterName('river_bend').of} im Fangbuch stehen, mit dem {w.pass('rowing_boat')}. Große Karpfen auf Boilies und Welse in Sommernächten.</li>
        <li><strong>{w.water('deep_sea')}</strong>: öffnet sich, sobald {F.gates.deep_sea} Arten {w.waterName('harbour_pier').of} im Fangbuch stehen. Ein Ticket aus dem Laden kauft {F.charter.casts} Würfe auf See für {n(F.charter.price)} Münzen; das Boot bringt dich zur Mole zurück, wenn sie aufgebraucht sind, und ungenutzte Würfe bleiben auf dem Ticket. Die größten Fische brauchen die {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong>: öffnet sich, sobald {F.gates.frozen_tarn} Arten {w.waterName('heron_lake').of} im Fangbuch stehen, mit dem {w.pass('ice_auger')}, und nur in der Winterwoche. Wenn das Eis taut, geht dein Angler zu Fuß zurück {w.waterName('heron_lake').to}.</li>
      </ul>
      <p>Ein Wechsel kostet einen Wurf, dann angelt dein Angler am neuen Gewässer. Passt der Köder dort nicht, nimmt er den passenden Köder, von dem du am meisten hast. Du kannst jederzeit zurückwechseln.</p>
      <h2 id="the-logbook">Das Fangbuch und die Titel</h2>
      <p>Jede gefangene Art wird mit Anzahl und deinem Bestgewicht eingetragen, und das Fangbuch zeigt, welchen Köder, welche Tageszeit und welches Wetter sie mag. Noch nicht gefangene Fische erscheinen als Umriss mit ihrem Köder, außer den epischen. Epische Fische brauchen den richtigen Köder, die richtige Stunde und das richtige Wetter zugleich, und manche beißen nur in einer Jahreszeit.</p>
      <p>Über das Fangbuch kommst du voran. Neue Arten öffnen das nächste Gewässer und die Funktionen oben und bringen dir deinen Titel: {F.titles.map((t) => `${w.title(t.id)} bei ${t.species} Arten`).join(', ')}. Alle beginnen als {w.title(F.firstTitle)}. Idle Angler hat keine XP und keine Stufen.</p>
      <p>Jedes Gewässer hat außerdem seinen eigenen Rang: {F.ranks.map((r) => w.lang.waterRanks[r]).join(', ')}, je nach Anteil seiner Arten in deinem Fangbuch. {w.lang.waterRanks.master} verlangt jede Art dort, die Saisongäste und den epischen Fisch eingeschlossen. Dein TRMNL zeigt deinen Rang an dem Gewässer, an dem du angelst, mit Strichen für die Arten, die noch fehlen.</p>
      <h2 id="rankings">Ranglisten und Wochenend-Opens</h2>
      <p>Jedes Gewässer hat seine eigene Rangliste: der schwerste Fisch, den jeder Angler dort gefangen hat, behalten oder freigelassen. Eine Rangliste läuft über die Woche und beginnt jeden Montag um 00:00 UTC neu; die andere hält die Allzeitrekorde. Dein TRMNL zeigt die Wochenrangliste deines Gewässers, die Begleit-App zeigt alle.</p>
      <p>Jedes Wochenende, von Samstag 00:00 bis Sonntag 23:59 UTC, veranstaltet jedes Gewässer ein Open für eine Art, die auf der Ranglisten-Seite steht. Fang diesen Fisch dort, um teilzunehmen; dein schwerster zählt. Am Montag bekommen die drei Besten jedes Gewässers eine Medaille und {und(F.prizes.map(n))} Münzen, und alle, die teilgenommen haben, eine Rosette.</p>
      <h2 id="the-trophy-wall">Die Trophäenwand</h2>
      <p>Ein Fisch mit mindestens {F.trophies.minPercent} % des Höchstgewichts seiner Art kann aus der Kühlbox präpariert werden, statt ihn zu verkaufen. Das kostet den Wert des Fisches plus {F.trophies.fee} Münzen. Die Wand hat anfangs {F.trophies.firstPegs} Haken und fasst bis zu {F.trophies.maxPegs}; weitere Haken gibt es auf der Seite der Wand. Medaillen und Rosetten stehen im Regal, und deine öffentliche Seite zeigt die Wand, wenn sie öffentlich ist.</p>
      <h2 id="the-fly-box">Die Fliegendose</h2>
      <p>Jede Woche zeigt dein TRMNL einen sechsstelligen Fliegencode neben seinem QR-Code und in der Titelleiste. Scanne den QR-Code oder tippe den Code auf der Buch-Seite ein, um die Fliege der Woche in deine Dose zu legen. Dein Angler trägt die neueste Fliege am Hut. Eine Fliege pro Woche: Jeden Montag um 00:00 UTC kommt ein neuer Code, und der Code der Vorwoche gilt bis zum nächsten Montag, falls dein Bildschirm spät aktualisiert hat. Nach allen {F.flies} Fliegen kommen die Muster wieder. Fliegen ändern nichts am Angeln.</p>
      <h2 id="achievements">Erfolge</h2>
      <p>Erfolge gibt es in Stufen, für das Angeln, das Fangbuch, deine Ausrüstung und Gewässer, den Handel und jede Art. Die Erfolge-Seite unter Mehr zeigt deine Stufen, den Anteil der Angler mit jeder Stufe und wie weit es bis zur nächsten ist. Dein öffentliches Profil zeigt sie, wenn Idle Angler darauf steht.</p>
      <h2 id="alerts">Benachrichtigungen</h2>
      <p>Schalte Benachrichtigungen unter Einstellungen auf der Mehr-Seite ein, dann bekommt dieses Handy eine Nachricht, wenn deine Kühlbox voll ist oder deinem Angler der Köder ausgeht. Sie sind aus, bis du sie einschaltest, und du bekommst höchstens zwei am Tag für alle deine Spiele.</p>
      <h2 id="pausing-and-removing">Pausieren und entfernen</h2>
      <p>Pausiere das Angeln unter Einstellungen auf der Mehr-Seite: Bis du fortsetzt, gibt es keine Fänge, und du behältst alles. Wenn du das Plugin aus TRMNL entfernst, bleibt dein Angler. Idle-Angler-Fortschritt löschen unter Einstellungen entfernt Angler, Kühlbox und Fangbuch und lässt dein Konto und deine anderen Spiele in Ruhe.</p>
      <h2 id="help">Hilfe</h2>
      <p>Schreib an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, was dein Bildschirm zeigt und wann du ihn zuletzt hast wechseln sehen.</p>
    </>
  ),
}
