import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import type { Locale } from '@trmnl-games/platform'

/**
 * D169: the backend's player-facing messages (appError, server functions) in French and German, keyed by the English
 * text the server sends, like the game content. `{name}` slots match any text; slots named for game things (item,
 * biome, tier, potions, affix) translate through the content dictionary. Unknown messages stay English.
 */
type Row = readonly [english: string, fr: string, de: string]

const ROWS: readonly Row[] = [
  // Platform and account
  ['Sign in to continue.', 'Connectez-vous pour continuer.', 'Melde dich an, um fortzufahren.'],
  ['Request a deletion link from Account, then confirm from that email.', 'Demandez un lien de suppression depuis Compte, puis confirmez depuis cet e-mail.', 'Fordere unter Konto einen Löschlink an und bestätige dann über diese E-Mail.'],
  ['That deletion link is expired or unavailable. Request a new one from Account.', 'Ce lien de suppression a expiré ou n’est plus disponible. Demandez-en un nouveau depuis Compte.', 'Dieser Löschlink ist abgelaufen oder nicht verfügbar. Fordere unter Konto einen neuen an.'],
  ['That deletion link expired. Request a new one from Account.', 'Ce lien de suppression a expiré. Demandez-en un nouveau depuis Compte.', 'Dieser Löschlink ist abgelaufen. Fordere unter Konto einen neuen an.'],
  ['This account was deleted. Contact support to start again.', 'Ce compte a été supprimé. Contactez l’assistance pour recommencer.', 'Dieses Konto wurde gelöscht. Wende dich an den Support, um neu anzufangen.'],
  ['Deletion email is unavailable. Please contact support.', 'L’e-mail de suppression n’est pas disponible. Veuillez contacter l’assistance.', 'Die Lösch-E-Mail ist nicht verfügbar. Bitte wende dich an den Support.'],
  ['Add a verified primary email to your account before requesting deletion.', 'Ajoutez une adresse e-mail principale vérifiée à votre compte avant de demander la suppression.', 'Füge deinem Konto eine bestätigte Haupt-E-Mail-Adresse hinzu, bevor du die Löschung anforderst.'],
  ['This account is not available.', 'Ce compte n’est pas disponible.', 'Dieses Konto ist nicht verfügbar.'],
  ['Type DELETE to confirm.', 'Tapez DELETE pour confirmer.', 'Gib DELETE ein, um zu bestätigen.'],
  ['Sign in with the account that requested this email.', 'Connectez-vous avec le compte qui a demandé cet e-mail.', 'Melde dich mit dem Konto an, das diese E-Mail angefordert hat.'],
  ['We couldn’t confirm deletion. Check your connection and try again.', 'Nous n’avons pas pu confirmer la suppression. Vérifiez votre connexion et réessayez.', 'Wir konnten die Löschung nicht bestätigen. Prüfe deine Verbindung und versuche es erneut.'],
  ['Sign in to send feedback.', 'Connectez-vous pour envoyer un retour.', 'Melde dich an, um Feedback zu senden.'],
  ['Write a message first.', 'Écrivez d’abord un message.', 'Schreib zuerst eine Nachricht.'],
  ['Keep it under {max} characters.', 'Restez sous les {max} caractères.', 'Bleib unter {max} Zeichen.'],
  ['Thanks, that is plenty for now. Try again in an hour.', 'Merci, c’est largement suffisant pour l’instant. Réessayez dans une heure.', 'Danke, das reicht fürs Erste. Versuch es in einer Stunde wieder.'],
  ['That hero page is hidden, or there is no player by that name.', 'Cette page de héros est masquée, ou aucun joueur ne porte ce nom.', 'Diese Heldenseite ist verborgen, oder es gibt keinen Spieler mit diesem Namen.'],
  ['You can follow up to {max} players. Unfollow someone first.', 'Vous pouvez suivre jusqu’à {max} joueurs. Arrêtez d’en suivre un d’abord.', 'Du kannst bis zu {max} Spielern folgen. Entfolge zuerst jemandem.'],
  ['You no longer follow that player.', 'Vous ne suivez plus ce joueur.', 'Du folgst diesem Spieler nicht mehr.'],
  ['Not a What’s new key.', 'Clé de nouveautés inconnue.', 'Kein gültiger Neuigkeiten-Schlüssel.'],
  ['No name change is required.', 'Aucun changement de nom n’est nécessaire.', 'Keine Namensänderung nötig.'],
  ['Choose new names from the name change notice first.', 'Choisissez d’abord de nouveaux noms depuis l’avis de changement de nom.', 'Wähle zuerst über den Hinweis zur Namensänderung neue Namen.'],
  ['You can change your public name once every 7 days.', 'Vous pouvez changer votre nom public une fois tous les 7 jours.', 'Du kannst deinen öffentlichen Namen alle 7 Tage einmal ändern.'],
  ['Public name: {reason}', 'Nom public : {reason}', 'Öffentlicher Name: {reason}'],
  ['Hero name: {reason}', 'Nom du héros : {reason}', 'Heldenname: {reason}'],
  ['First name: {reason}', 'Prénom : {reason}', 'Vorname: {reason}'],
  ['Use {min}-{max} characters.', 'Utilisez {min} à {max} caractères.', 'Verwende {min} bis {max} Zeichen.'],
  ["Use letters, numbers, spaces and . _ ' - only.", "Utilisez uniquement des lettres, des chiffres, des espaces et . _ ' -.", "Verwende nur Buchstaben, Ziffern, Leerzeichen und . _ ' -."],
  ['That public name is taken. Try another.', 'Ce nom public est déjà pris. Essayez-en un autre.', 'Dieser öffentliche Name ist vergeben. Versuch einen anderen.'],
  ['That public name is taken. Start Install again and choose another name.', 'Ce nom public est déjà pris. Relancez l’installation et choisissez un autre nom.', 'Dieser öffentliche Name ist vergeben. Starte die Installation erneut und wähle einen anderen Namen.'],
  // Intents and connection
  ['This hero is paused for a service check.', 'Ce héros est en pause pour une vérification technique.', 'Dieser Held ist für eine Wartungsprüfung pausiert.'],
  ['Invalid operation ID.', 'Identifiant d’opération non valide.', 'Ungültige Vorgangs-ID.'],
  ['This operation ID was already used for a different action.', 'Cet identifiant d’opération a déjà servi pour une autre action.', 'Diese Vorgangs-ID wurde schon für eine andere Aktion verwendet.'],
  ['Too many actions. Try again in a few minutes.', 'Trop d’actions. Réessayez dans quelques minutes.', 'Zu viele Aktionen. Versuch es in ein paar Minuten wieder.'],
  ['Desk Crawler progress is being deleted. Try again shortly.', 'La progression Desk Crawler est en cours de suppression. Réessayez dans un instant.', 'Der Desk-Crawler-Fortschritt wird gerade gelöscht. Versuch es gleich noch mal.'],
  ['Idle Angler progress is being deleted. Try again shortly.', 'La progression Idle Angler est en cours de suppression. Réessayez dans un instant.', 'Der Idle-Angler-Fortschritt wird gerade gelöscht. Versuch es gleich noch mal.'],
  ['Paper Lives progress is being deleted. Try again shortly.', 'La progression Paper Lives est en cours de suppression. Réessayez dans un instant.', 'Der Paper-Lives-Fortschritt wird gerade gelöscht. Versuch es gleich noch mal.'],
  ['{game} progress is being deleted. Try again shortly.', 'La progression {game} est en cours de suppression. Réessayez dans un instant.', 'Der {game}-Fortschritt wird gerade gelöscht. Versuch es gleich noch mal.'],
  ['{game} is not open yet.', '{game} n’est pas encore ouvert.', '{game} ist noch nicht geöffnet.'],
  ['Sign in to connect TRMNL.', 'Connectez-vous pour relier TRMNL.', 'Melde dich an, um TRMNL zu verbinden.'],
  ['Sign in to reconnect TRMNL.', 'Connectez-vous pour reconnecter TRMNL.', 'Melde dich an, um TRMNL erneut zu verbinden.'],
  ['This installation expired. Start again from TRMNL.', 'Cette installation a expiré. Recommencez depuis TRMNL.', 'Diese Installation ist abgelaufen. Fang in TRMNL neu an.'],
  ['Something went wrong. Please try again.', 'Un problème est survenu. Veuillez réessayer.', 'Etwas ist schiefgelaufen. Bitte versuch es erneut.'],
  ['That installation link is not valid. Start again from TRMNL.', 'Ce lien d’installation n’est pas valide. Recommencez depuis TRMNL.', 'Dieser Installationslink ist ungültig. Fang in TRMNL neu an.'],
  ['TRMNL did not accept that installation. Start again from TRMNL.', 'TRMNL n’a pas accepté cette installation. Recommencez depuis TRMNL.', 'TRMNL hat diese Installation nicht angenommen. Fang in TRMNL neu an.'],
  ['This connection needs fresh verification from TRMNL. Start from Install, then Save and open Configure.', 'Cette connexion doit être revérifiée par TRMNL. Commencez par Installer, puis Enregistrer et ouvrez Configurer.', 'Diese Verbindung muss von TRMNL neu bestätigt werden. Starte mit Installieren, dann Speichern und öffne Konfigurieren.'],
  ['This TRMNL installation is linked to another account.', 'Cette installation TRMNL est liée à un autre compte.', 'Diese TRMNL-Installation ist mit einem anderen Konto verknüpft.'],
  ['This TRMNL connection was revoked. Install again from TRMNL.', 'Cette connexion TRMNL a été révoquée. Réinstallez depuis TRMNL.', 'Diese TRMNL-Verbindung wurde widerrufen. Installiere sie in TRMNL neu.'],
  ['TRMNL verification is unavailable. Please contact support.', 'La vérification TRMNL n’est pas disponible. Veuillez contacter l’assistance.', 'Die TRMNL-Bestätigung ist nicht verfügbar. Bitte wende dich an den Support.'],
  ['Open Configure again from your TRMNL plugin settings to verify this installation.', 'Rouvrez Configurer depuis les réglages de votre plugin TRMNL pour vérifier cette installation.', 'Öffne in den Einstellungen deines TRMNL-Plugins erneut Konfigurieren, um diese Installation zu bestätigen.'],
  ['This reconnection expired. Start again from Install in TRMNL.', 'Cette reconnexion a expiré. Recommencez depuis Installer dans TRMNL.', 'Diese erneute Verbindung ist abgelaufen. Fang in TRMNL bei Installieren neu an.'],
  ['Open a fresh Configure link from your TRMNL plugin settings.', 'Ouvrez un nouveau lien Configurer depuis les réglages de votre plugin TRMNL.', 'Öffne in den Einstellungen deines TRMNL-Plugins einen neuen Konfigurieren-Link.'],
  ['This installation is connected to another TRMNL Games account.', 'Cette installation est reliée à un autre compte TRMNL Games.', 'Diese Installation ist mit einem anderen TRMNL-Games-Konto verbunden.'],
  ['Verify this installation through Configure in TRMNL before connecting.', 'Vérifiez cette installation via Configurer dans TRMNL avant de la relier.', 'Bestätige diese Installation über Konfigurieren in TRMNL, bevor du sie verbindest.'],
  ['This verification expired. Open Configure again from TRMNL.', 'Cette vérification a expiré. Rouvrez Configurer depuis TRMNL.', 'Diese Bestätigung ist abgelaufen. Öffne Konfigurieren in TRMNL erneut.'],
  ['That connection is not available.', 'Cette connexion n’est pas disponible.', 'Diese Verbindung ist nicht verfügbar.'],
  // Alerts
  ['No hero yet.', 'Pas encore de héros.', 'Noch kein Held.'],
  ['Quiet hours need a different start and end hour.', 'Les heures calmes doivent commencer et finir à des heures différentes.', 'Die Ruhezeiten brauchen unterschiedliche Start- und Endzeiten.'],
  ['Allow alerts on this device first.', 'Autorisez d’abord les alertes sur cet appareil.', 'Erlaube zuerst Benachrichtigungen auf diesem Gerät.'],
  ['That push subscription is not valid.', 'Cet abonnement aux notifications n’est pas valide.', 'Dieses Push-Abonnement ist ungültig.'],
  // Hero
  ['Unknown destination.', 'Destination inconnue.', 'Unbekanntes Ziel.'],
  ['{biome} unlocks at level {level}.', '{biome} : se débloque au niveau {level}.', '{biome}: wird auf Stufe {level} freigeschaltet.'],
  ['Your hero cannot travel right now.', 'Votre héros ne peut pas voyager pour le moment.', 'Dein Held kann gerade nicht reisen.'],
  ['Leave the dug-in elite behind first.', 'Laissez d’abord tomber l’élite retranchée.', 'Lass zuerst die eingegrabene Elite stehen.'],
  ['There is nothing to decide right now.', 'Il n’y a rien à décider pour le moment.', 'Gerade gibt es nichts zu entscheiden.'],
  ['That is not one of the options.', 'Ce n’est pas l’une des options.', 'Das ist keine der Optionen.'],
  ['Unknown stance.', 'Posture inconnue.', 'Unbekannte Haltung.'],
  ['Stances unlock at level {level}.', 'Les postures se débloquent au niveau {level}.', 'Haltungen werden auf Stufe {level} freigeschaltet.'],
  ['The to-do list is not ready yet.', 'La liste de tâches n’est pas encore prête.', 'Die To-do-Liste ist noch nicht bereit.'],
  ['Unknown task.', 'Tâche inconnue.', 'Unbekannte Aufgabe.'],
  ['That task is already ticked off.', 'Cette tâche est déjà cochée.', 'Diese Aufgabe ist schon abgehakt.'],
  ["Today's swap is used. You get a new one at the next stand-up.", 'L’échange du jour est utilisé. Vous en aurez un nouveau au prochain stand-up.', 'Der Tausch für heute ist verbraucht. Beim nächsten Stand-up gibt es einen neuen.'],
  ['Save Desk Crawler in TRMNL to start adventures.', 'Enregistrez Desk Crawler dans TRMNL pour lancer les aventures.', 'Speichere Desk Crawler in TRMNL, um die Abenteuer zu starten.'],
  ['Your hero cannot pause right now.', 'Votre héros ne peut pas faire de pause pour le moment.', 'Dein Held kann gerade nicht pausieren.'],
  ['No active hero yet.', 'Pas encore de héros actif.', 'Noch kein aktiver Held.'],
  // Inventory
  ['Potions can be used while exploring, resting or travelling.', 'Les potions s’utilisent pendant l’exploration, le repos ou un voyage.', 'Tränke lassen sich beim Erkunden, Ausruhen oder Reisen benutzen.'],
  ['Your hero is already at full health.', 'Votre héros est déjà en pleine santé.', 'Dein Held hat schon volle LP.'],
  ['Combine between 1 and 10 batches.', 'Combinez entre 1 et 10 lots.', 'Kombiniere zwischen 1 und 10 Durchgänge.'],
  ["Potions can't be combined while your hero is recovering or paused.", 'Impossible de combiner des potions pendant que votre héros récupère ou est en pause.', 'Tränke lassen sich nicht kombinieren, solange dein Held sich erholt oder pausiert.'],
  ['Potions cannot be combined yet.', 'Les potions ne peuvent pas encore être combinées.', 'Tränke lassen sich noch nicht kombinieren.'],
  ['Needs {count} more {potions}.', 'Encore {count} {potions} nécessaires.', 'Es fehlen noch {count} {potions}.'],
  ['Needs {materials} more.', 'Il manque {materials}.', 'Es fehlen noch {materials}.'],
  ["Gear can't be changed while your hero is recovering or paused.", 'Impossible de changer d’équipement pendant que votre héros récupère ou est en pause.', 'Ausrüstung lässt sich nicht wechseln, solange dein Held sich erholt oder pausiert.'],
  ['That item is not available.', 'Cet objet n’est pas disponible.', 'Dieser Gegenstand ist nicht verfügbar.'],
  ['Claim the held find first.', 'Récupérez d’abord la trouvaille mise de côté.', 'Hol zuerst den zurückgelegten Fund ab.'],
  ['Requires level {level}.', 'Nécessite le niveau {level}.', 'Erfordert Stufe {level}.'],
  ['Free a bag slot to unequip this.', 'Libérez une place dans le sac pour retirer cet objet.', 'Mach einen Taschenplatz frei, um das abzulegen.'],
  ["Gear can't be sold while your hero is recovering or paused.", 'Impossible de vendre de l’équipement pendant que votre héros récupère ou est en pause.', 'Ausrüstung lässt sich nicht verkaufen, solange dein Held sich erholt oder pausiert.'],
  ['Each item can only be sold once.', 'Chaque objet ne peut être vendu qu’une fois.', 'Jeder Gegenstand kann nur einmal verkauft werden.'],
  ['One of those items is not available.', 'L’un de ces objets n’est pas disponible.', 'Einer dieser Gegenstände ist nicht verfügbar.'],
  ['Unequip an item before selling it.', 'Retirez un objet avant de le vendre.', 'Leg einen Gegenstand ab, bevor du ihn verkaufst.'],
  ['Choose between 1 and {max} items.', 'Choisissez entre 1 et {max} objets.', 'Wähle zwischen 1 und {max} Gegenständen.'],
  ['There is no held find to claim.', 'Il n’y a aucune trouvaille mise de côté à récupérer.', 'Es gibt keinen zurückgelegten Fund zum Abholen.'],
  ['Free a bag slot to claim the find.', 'Libérez une place dans le sac pour récupérer la trouvaille.', 'Mach einen Taschenplatz frei, um den Fund abzuholen.'],
  ['Your hero is not taking a break.', 'Votre héros n’est pas en pause.', 'Dein Held macht gerade keine Pause.'],
  ['Free at least one bag slot first.', 'Libérez d’abord au moins une place dans le sac.', 'Mach zuerst mindestens einen Taschenplatz frei.'],
  ['Your hero is not waiting on a full bag.', 'Votre héros n’attend pas un sac plein.', 'Dein Held wartet nicht auf eine volle Tasche.'],
  ['Nothing left to sell. Free a slot another way.', 'Plus rien à vendre. Libérez une place autrement.', 'Nichts mehr zu verkaufen. Mach anders einen Platz frei.'],
  ['Your bag changed. Look again before selling.', 'Votre sac a changé. Regardez à nouveau avant de vendre.', 'Deine Tasche hat sich geändert. Schau noch einmal hin, bevor du verkaufst.'],
  ["Bags can't be bought while your hero is recovering or paused.", 'Impossible d’acheter un sac pendant que votre héros récupère ou est en pause.', 'Taschen lassen sich nicht kaufen, solange dein Held sich erholt oder pausiert.'],
  ['That bag is not available right now.', 'Ce sac n’est pas disponible pour le moment.', 'Diese Tasche ist gerade nicht verfügbar.'],
  ['The {tier} costs {gold} gold.', '{tier} : {gold} pièces d’or.', '{tier}: kostet {gold} Gold.'],
  ["Today's name tag is sold. Another comes in tomorrow.", 'Le badge du jour est vendu. Un autre arrive demain.', 'Das Namensschild für heute ist verkauft. Morgen kommt ein neues.'],
  ['Your hero is already called {name}.', 'Votre héros s’appelle déjà {name}.', 'Dein Held heißt schon {name}.'],
  ['A name tag costs {gold} gold.', 'Un badge coûte {gold} pièces d’or.', 'Ein Namensschild kostet {gold} Gold.'],
  ['{name} already has that look.', '{name} a déjà ce look.', '{name} hat diesen Look schon.'],
  ['A makeover costs {gold} gold.', 'Un relooking coûte {gold} pièces d’or.', 'Ein Umstyling kostet {gold} Gold.'],
  ["Pouches can't be bought while your hero is recovering or paused.", 'Impossible d’acheter une pochette pendant que votre héros récupère ou est en pause.', 'Beutel lassen sich nicht kaufen, solange dein Held sich erholt oder pausiert.'],
  ['That pouch is not available right now.', 'Cette pochette n’est pas disponible pour le moment.', 'Dieser Beutel ist gerade nicht verfügbar.'],
  ["Shopping isn't open while your hero is recovering or paused.", 'Les achats sont fermés pendant que votre héros récupère ou est en pause.', 'Einkaufen geht nicht, solange dein Held sich erholt oder pausiert.'],
  ['The merchant has moved on.', 'Le marchand est reparti.', 'Der Händler ist weitergezogen.'],
  ['That offer is no longer on the table.', 'Cette offre n’est plus disponible.', 'Dieses Angebot gibt es nicht mehr.'],
  ['That costs {gold} gold.', 'Cela coûte {gold} pièces d’or.', 'Das kostet {gold} Gold.'],
  ['Your pouch holds {cap} potions; {room} more would fit.', 'Votre pochette contient {cap} potions ; il reste de la place pour {room}.', 'Dein Beutel fasst {cap} Tränke; {room} passen noch hinein.'],
  ['That pouch is no longer available.', 'Cette pochette n’est plus disponible.', 'Dieser Beutel ist nicht mehr verfügbar.'],
  ['That bag is no longer available.', 'Ce sac n’est plus disponible.', 'Diese Tasche ist nicht mehr verfügbar.'],
  ['Each item can only be chosen once.', 'Chaque objet ne peut être choisi qu’une fois.', 'Jeder Gegenstand kann nur einmal gewählt werden.'],
  ['Unequip an item before salvaging it.', 'Retirez un objet avant de le démonter.', 'Leg einen Gegenstand ab, bevor du ihn zerlegst.'],
  ["Gear can't be salvaged while your hero is recovering or paused.", 'Impossible de démonter de l’équipement pendant que votre héros récupère ou est en pause.', 'Ausrüstung lässt sich nicht zerlegen, solange dein Held sich erholt oder pausiert.'],
  ['There is no workbench yet.', 'Il n’y a pas encore d’établi.', 'Es gibt noch keine Werkbank.'],
  ['The workbench opens at level {level}.', 'L’établi s’ouvre au niveau {level}.', 'Die Werkbank öffnet auf Stufe {level}.'],
  ['The workbench is closed while your hero is recovering or paused.', 'L’établi est fermé pendant que votre héros récupère ou est en pause.', 'Die Werkbank ist geschlossen, solange dein Held sich erholt oder pausiert.'],
  ['This item is fully reinforced.', 'Cet objet est entièrement renforcé.', 'Dieser Gegenstand ist vollständig verstärkt.'],
  ['{mk} needs level {level}.', '{mk} nécessite le niveau {level}.', '{mk} erfordert Stufe {level}.'],
  ['Only rare and epic gear can take an affix.', 'Seul l’équipement rare ou épique peut recevoir un trait.', 'Nur seltene und epische Ausrüstung kann eine Eigenschaft bekommen.'],
  ['Unknown affix.', 'Trait inconnu.', 'Unbekannte Eigenschaft.'],
  ['The {item} is already {affix}.', '{item} : déjà {affix}.', '{item}: schon {affix}.'],
  // Keepsakes and roster
  ['Save Desk Crawler in TRMNL to collect keepsakes.', 'Enregistrez Desk Crawler dans TRMNL pour récupérer des souvenirs.', 'Speichere Desk Crawler in TRMNL, um Andenken zu sammeln.'],
  ['Too many wrong keepsake codes today. Try again tomorrow.', 'Trop de mauvais codes souvenir aujourd’hui. Réessayez demain.', 'Heute zu viele falsche Andenken-Codes. Versuch es morgen wieder.'],
  ['Your collection needs a service check.', 'Votre collection a besoin d’une vérification technique.', 'Deine Sammlung braucht eine Wartungsprüfung.'],
  ['{name} is knocked out. Switch heroes once they are back on their feet.', '{name} est K.-O. Changez de héros une fois qu’il sera de nouveau sur pied.', '{name} ist k. o. Wechsle den Helden, sobald er wieder auf den Beinen ist.'],
  ['{name} is on the road. Switch heroes once they arrive.', '{name} est en route. Changez de héros une fois arrivé à destination.', '{name} ist unterwegs. Wechsle den Helden, sobald er angekommen ist.'],
  ['That class is not here yet.', 'Cette classe n’est pas encore là.', 'Diese Klasse gibt es noch nicht.'],
  ['A second hero opens when your Warrior reaches level {level}.', 'Un second héros s’ouvre quand votre Guerrier atteint le niveau {level}.', 'Ein zweiter Held wird frei, wenn dein Krieger Stufe {level} erreicht.'],
  ['You already have a {heroClass}.', 'Vous avez déjà un {heroClass}.', 'Du hast schon einen {heroClass}.'],
  ['You switched heroes in the last day. Recruit once the day is up.', 'Vous avez changé de héros dans la journée. Recrutez une fois la journée écoulée.', 'Du hast heute schon den Helden gewechselt. Wirb an, sobald der Tag um ist.'],
  ['That hero is not on your roster.', 'Ce héros ne fait pas partie de votre effectif.', 'Dieser Held ist nicht in deinem Team.'],
  ['That hero is paused for a service check.', 'Ce héros est en pause pour une vérification technique.', 'Dieser Held ist für eine Wartungsprüfung pausiert.'],
  ['One switch a day. Your next switch opens a day after the last one.', 'Un changement par jour. Le prochain est possible un jour après le dernier.', 'Ein Wechsel pro Tag. Der nächste geht einen Tag nach dem letzten.'],
  // Idle Angler
  ['No angler yet.', 'Pas encore de pêcheur.', 'Noch kein Angler.'],
  ['Save Idle Angler in TRMNL to start fishing.', 'Enregistrez Idle Angler dans TRMNL pour commencer à pêcher.', 'Speichere Idle Angler in TRMNL, um mit dem Angeln anzufangen.'],
  ['This angler is paused for a service check.', 'Ce pêcheur est en pause pour une vérification technique.', 'Dieser Angler ist für eine Wartungsprüfung pausiert.'],
  ['Choose between 1 and {max} fish.', 'Choisissez entre 1 et {max} poissons.', 'Wähle zwischen 1 und {max} Fischen.'],
  ['One of those fish is no longer in your cooler.', 'L’un de ces poissons n’est plus dans votre glacière.', 'Einer dieser Fische ist nicht mehr in deiner Kühlbox.'],
  ['Save Idle Angler in TRMNL to collect flies.', 'Enregistrez Idle Angler dans TRMNL pour récupérer des mouches.', 'Speichere Idle Angler in TRMNL, um Fliegen zu sammeln.'],
  ['Too many wrong fly codes today. Try again tomorrow.', 'Trop de mauvais codes mouche aujourd’hui. Réessayez demain.', 'Heute zu viele falsche Fliegen-Codes. Versuch es morgen wieder.'],
  ['Your fly box needs a service check.', 'Votre boîte à mouches a besoin d’une vérification technique.', 'Deine Fliegendose braucht eine Wartungsprüfung.'],
  ['That fish is no longer in your cooler.', 'Ce poisson n’est plus dans votre glacière.', 'Dieser Fisch ist nicht mehr in deiner Kühlbox.'],
  ['No goal reward is waiting.', 'Aucune récompense d’objectif en attente.', 'Keine Zielbelohnung wartet.'],
  ['Choose the fish for this order.', 'Choisissez les poissons pour cette commande.', 'Wähle die Fische für diese Bestellung.'],
  ['The waters are not open yet.', 'Les eaux ne sont pas encore ouvertes.', 'Die Gewässer sind noch nicht geöffnet.'],
  ['That trophy is not on your wall.', 'Ce trophée n’est pas sur votre mur.', 'Diese Trophäe hängt nicht an deiner Wand.'],
  // Paper Lives
  ['No life yet.', 'Pas encore de vie.', 'Noch kein Leben.'],
  ['Save Paper Lives in TRMNL to start the first year.', 'Enregistrez Paper Lives dans TRMNL pour commencer la première année.', 'Speichere Paper Lives in TRMNL, um das erste Jahr zu beginnen.'],
  ['This life is paused for a service check.', 'Cette vie est en pause pour une vérification technique.', 'Dieses Leben ist für eine Wartungsprüfung pausiert.'],
  ['This life has no owner.', 'Cette vie n’a pas de propriétaire.', 'Dieses Leben hat keinen Besitzer.'],
  ['This life is still being lived.', 'Cette vie est toujours en cours.', 'Dieses Leben wird noch gelebt.'],
  ['This life is still being written. Try again shortly.', 'Cette vie est encore en cours d’écriture. Réessayez dans un instant.', 'Dieses Leben wird noch geschrieben. Versuch es gleich noch mal.'],
  ['That child cannot take up the story.', 'Cet enfant ne peut pas reprendre l’histoire.', 'Dieses Kind kann die Geschichte nicht weiterführen.'],
  ['Save Paper Lives in TRMNL to take photos.', 'Enregistrez Paper Lives dans TRMNL pour prendre des photos.', 'Speichere Paper Lives in TRMNL, um Fotos zu machen.'],
  ['A photo needs someone in it. Begin the next life first.', 'Une photo a besoin de quelqu’un dessus. Commencez d’abord la vie suivante.', 'Auf einem Foto muss jemand sein. Beginne zuerst das nächste Leben.'],
  ['Too many wrong photo codes today. Try again tomorrow.', 'Trop de mauvais codes photo aujourd’hui. Réessayez demain.', 'Heute zu viele falsche Foto-Codes. Versuch es morgen wieder.'],
  ['Your album needs a service check.', 'Votre album a besoin d’une vérification technique.', 'Dein Album braucht eine Wartungsprüfung.'],
  // The companion's own fallbacks
  ['Done. Your TRMNL will reflect this on its next refresh.', 'C’est fait. Votre TRMNL l’affichera à sa prochaine actualisation.', 'Erledigt. Dein TRMNL zeigt es bei der nächsten Aktualisierung.'],
  ['You are offline. Reconnect, then try again. No action was queued.', 'Vous êtes hors ligne. Reconnectez-vous, puis réessayez. Aucune action n’a été mise en attente.', 'Du bist offline. Verbinde dich neu und versuch es dann noch mal. Es wurde keine Aktion vorgemerkt.'],
  ['We could not confirm that action. Check your connection, then try the same action again.', 'Nous n’avons pas pu confirmer cette action. Vérifiez votre connexion, puis réessayez la même action.', 'Wir konnten diese Aktion nicht bestätigen. Prüfe deine Verbindung und versuche dieselbe Aktion noch einmal.'],
  ['That action could not be confirmed and is too old to retry safely. Check the current state before choosing an action again.', 'Cette action n’a pas pu être confirmée et elle est trop ancienne pour être relancée sans risque. Vérifiez l’état actuel avant de choisir à nouveau une action.', 'Diese Aktion konnte nicht bestätigt werden und ist zu alt für einen sicheren neuen Versuch. Prüfe den aktuellen Stand, bevor du erneut eine Aktion wählst.'],
]

const GAME_SLOTS = new Set(['item', 'biome', 'tier', 'potions', 'affix', 'materials'])

const compiled = ROWS.map(([english, fr, de]) => {
  const names: string[] = []
  const source = english.split(/(\{\w+\})/).map((part) => {
    const slot = part.match(/^\{(\w+)\}$/)
    if (!slot) return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    names.push(slot[1]!)
    return '(.+?)'
  }).join('')
  return { regex: new RegExp(`^${source}$`), names, fr, de, plain: names.length === 0 ? english : null }
})
const exact = new Map(compiled.filter((row) => row.plain !== null).map((row) => [row.plain!, row]))

/** A server message in the reader's language; unknown messages, and English readers, get the server's text. */
export function serverMessage(english: string, locale: Locale): string {
  if (locale === 'en') return english
  const row = exact.get(english) ?? compiled.find((candidate) => candidate.regex.test(english))
  if (!row) return english
  const values = row.regex.exec(english)!.slice(1)
  const content = contentTranslator(locale)
  return row[locale].replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[row.names.indexOf(name)] ?? ''
    if (name === 'reason') return serverMessage(value, locale)
    if (name === 'heroClass') return content.text(value)
    if (name === 'materials') return value.split(/, | and /).map((part) => part.replace(/^(\d+) (.+)$/, (_m, n: string, material: string) => `${n} ${content.name(material)}`)).join(', ')
    return GAME_SLOTS.has(name) ? content.name(value) : value
  })
}
