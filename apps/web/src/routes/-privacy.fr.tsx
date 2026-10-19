import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const privacyFr: LegalPage = {
  title: 'Confidentialité',
  description: 'Ce que TRMNL Games conserve, ce qui est public dans les classements et sur les écrans TRMNL, et comment supprimer votre compte.',
  translationNote: () => <p className="text-sm text-muted">Traduction de la version anglaise, qui fait foi en cas de différence.</p>,
  Body: () => (
    <>
      <p>
        TRMNL Games est un ensemble de jeux géré par Barry Michael Doyle, développeur indépendant. Cette page explique simplement ce que le service conserve,
        qui le traite et comment le supprimer. Pour toute question : <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Ce qui est public</h2>
      <p>
        Votre nom public, le nom et le niveau de votre héros, et vos rangs apparaissent dans les classements et sur les écrans TRMNL des autres joueurs. Choisissez
        un nom public que vous acceptez de partager, sans jamais y mettre vos coordonnées.
      </p>
      <p>
        Dans Desk Crawler, les héros pillent le bureau des autres et se rencontrent au hasard. Quand votre héros pille, est pillé ou croise un autre héros, votre nom public apparaît dans le journal d’aventure de l’autre joueur, dans son compagnon et sur son TRMNL, comme il apparaît déjà dans les classements. Quand votre héros est mis K.-O., il peut laisser tomber un objet en double portant votre nom public, que le héros d’un autre joueur peut trouver et garder ; votre nom s’affiche alors sur cet objet dans son compagnon et sur sa page de héros. Si vous changez de nom ou supprimez votre compte, ces récits et objets affichent « Joueur masqué » à la place, ou perdent le nom.
      </p>
      <p>
        Votre héros Desk Crawler a une page publique : toute personne disposant du lien voit votre nom public, le nom de votre héros, son niveau, son rang, son étage actuel et sa date de départ, quelques compteurs à vie et vos succès. L’or, le journal d’aventure et les informations de votre compte restent privés, de même que votre équipement, sauf les doubles d’autres joueurs que garde votre héros, affichés avec les noms qu’ils portent. La page est activée par défaut. Masquer ma page de héros, dans les Réglages, la masque immédiatement, et vous pouvez la réafficher à tout moment.
      </p>
      <p>
        Les joueurs connectés peuvent suivre une page publique de héros. Nous conservons qui suit qui pour que leur compagnon puisse lister les joueurs qu’ils suivent. Personne n’est prévenu d’être suivi, et aucune page ne montre qui suit un joueur, sauf qu’un joueur désigné comme rival voit qui l’a désigné. Si vous changez de nom public, masquez votre page ou supprimez votre progression, les autres joueurs ne voient plus votre héros dans leur liste, et la suppression efface ces données.
      </p>

      <h2>Ce que nous conservons</h2>
      <ul>
        <li>Votre identité de connexion fournie par Clerk, notre prestataire de connexion. Votre adresse e-mail n’est copiée que dans les demandes de confirmation de suppression, de courte durée ; nous ne copions ni votre vrai nom ni votre photo de profil dans la base du jeu.</li>
        <li>Votre nom public, votre héros, vos objets, votre journal d’aventure et l’XP récente utilisée pour les classements. Les comptes plus anciens peuvent aussi avoir un fuseau horaire enregistré par des versions précédentes.</li>
        <li>Si vous activez les alertes Desk Crawler : les alertes souhaitées, vos heures calmes et le fuseau horaire de votre navigateur (par exemple Europe/Paris), et pour chaque appareil autorisé, l’adresse de notification que votre navigateur nous donne, ses clés de chiffrement et un libellé comme « Chrome sur Android ». Nous gardons aussi un bref historique de chaque alerte : son type, sa date et si elle a été envoyée.</li>
        <li>
          Pour chaque installation TRMNL : l’identifiant de l’instance du plugin, une empreinte de son jeton d’accès et le lien de réglages que TRMNL nous donne.
          Nous ne conservons ni votre nom ni votre e-mail TRMNL.
        </li>
        <li>Le décalage horaire que votre TRMNL envoie avec chaque écran (par exemple UTC+2), pour que le stand-up du matin de Desk Crawler suive votre journée. Nous ne gardons que le dernier.</li>
        <li>La langue que votre TRMNL envoie avec chaque écran (par exemple fr-FR), pour savoir dans quelles langues traduire les jeux et pour que votre écran puisse utiliser votre langue. Nous ne gardons que la dernière.</li>
        <li>Si vous choisissez une langue pour TRMNL Games, ce choix, pour que vos écrans TRMNL et vos alertes l’utilisent aussi.</li>
        <li>Des données techniques de courte durée, comme des compteurs de limitation de débit et des reçus de requêtes en double.</li>
        <li>Quand vous demandez la suppression de votre compte : votre adresse e-mail principale vérifiée, une empreinte du lien de confirmation et l’état de l’envoi. Le lien expire au bout de 30 minutes ; les demandes expirées sont effacées par un nettoyage quotidien.</li>
        <li>La liste de lancement de Desk Crawler contenait des adresses e-mail pour un seul e-mail, envoyé à l’arrivée de Desk Crawler sur la boutique TRMNL. Cet e-mail est parti le 13 octobre 2026, toutes les adresses ont été supprimées et la liste est close.</li>
        <li>Le rappel du héros : si votre héros Desk Crawler joue depuis deux jours et que vous n’avez jamais ouvert l’application Desk Crawler, nous envoyons un seul e-mail à votre adresse principale vérifiée pour dire ce qui vous y attend, avec un lien pour l’arrêter. L’adresse est lue chez Clerk au moment de l’envoi et n’est pas conservée. Nous gardons seulement la date d’envoi, ou le fait que vous ne voulez pas le recevoir.</li>
        <li>Si vous envoyez un retour : votre message, la page d’où vous l’avez envoyé, votre nom public et un lien vers votre compte. Il est envoyé par e-mail au développeur avec votre adresse e-mail principale vérifiée comme adresse de réponse.</li>
      </ul>

      <h2>Ce que nous ne faisons pas</h2>
      <p>Pas de publicité, et aucune vente ni aucun partage de vos données à des fins marketing. Le jeu ne propose aucun achat, nous ne détenons donc aucune donnée de paiement.</p>

      <h2>Mesure d’audience et assistance facultatives</h2>
      <p>Si vous acceptez la mesure d’audience, PostHog enregistre les pages visitées, les étapes d’installation, les échecs d’actions dans le jeu et les erreurs du navigateur. Une fois connecté, ces données sont liées à votre identifiant Clerk, votre adresse e-mail, votre nom public et le nom de votre héros, pour que nous puissions traiter les demandes d’assistance et corriger les problèmes. Les erreurs du navigateur vont aussi à Sentry, sans votre compte, votre e-mail ni votre adresse IP.</p>
      <p>PostHog enregistre aussi des sessions masquées pour voir où un parcours bloque. Le texte et les champs de formulaire sont masqués, les informations de connexion et de compte sont bloquées, et nous n’enregistrons ni le contenu des requêtes réseau, ni les en-têtes, ni la console. Les codes d’installation, jetons d’accès, JWT de gestion et paramètres d’URL sont exclus.</p>
      <p>Vous pouvez refuser et continuer à jouer. Utilisez Préférences de mesure d’audience en bas du site pour changer d’avis. Désactiver la mesure arrête la collecte dans ce navigateur ; cela n’efface pas les données déjà enregistrées. Contactez-nous pour les supprimer, ou supprimez votre compte TRMNL Games pour demander la suppression du profil, des événements et des enregistrements PostHog qui y sont liés.</p>

      <h2>Cookies</h2>
      <p>
        Clerk dépose des cookies qui vous gardent connecté. Pendant que vous reliez ou gérez une installation TRMNL, nous déposons un cookie chiffré qui expire
        en quelques minutes. Un lien de confirmation de suppression utilise un cookie chiffré de courte durée pour que vous puissiez vous connecter avant de confirmer. Si vous acceptez la mesure d’audience, PostHog utilise le stockage local du navigateur pour reconnaître vos visites. Nous enregistrons aussi votre préférence de mesure d’audience localement, et un cookie retient la langue que vous avez choisie. Il n’y a aucun cookie publicitaire.
      </p>

      <h2>Services qui traitent vos données</h2>
      <ul>
        <li><strong>Clerk</strong> gère la connexion et détient votre adresse e-mail et votre moyen de connexion, ainsi que votre profil Google ou GitHub si vous vous connectez avec l’un d’eux.</li>
        <li><strong>Convex</strong> héberge la base du jeu, les mises à jour du jeu toutes les 15 minutes et les sauvegardes quotidiennes.</li>
        <li><strong>Cloudflare</strong> héberge ce site et conserve des journaux de requêtes standard.</li>
        <li><strong>TRMNL</strong> récupère l’écran de votre héros chez nous. Votre compte et votre appareil TRMNL relèvent de la politique de confidentialité de TRMNL.</li>
        <li><strong>PostHog UE</strong> traite la mesure d’audience facultative, les rapports d’erreur et les enregistrements de session masqués, pour l’assistance et l’amélioration du produit.</li>
        <li><strong>Sentry</strong> (États-Unis) reçoit les rapports d’erreur du serveur de notre site et du backend du jeu, et de votre navigateur si vous acceptez la mesure d’audience, pour que nous puissions trouver et corriger les bugs. Un rapport contient le chemin de la page ou le nom de la fonction du jeu qui a échoué, et les détails techniques de l’erreur. Il ne contient jamais votre compte, votre adresse e-mail, votre adresse IP, vos cookies, le contenu des formulaires, les paramètres d’URL, ni les codes et jetons d’installation.</li>
        <li><strong>Le service de notifications de votre navigateur</strong> (Google pour Chrome et Android, Apple pour Safari, Mozilla pour Firefox) délivre les alertes Desk Crawler si vous les activez. Il reçoit l’alerte chiffrée, sans pouvoir la lire, avec l’adresse de notification créée par votre navigateur.</li>
        <li><strong>Resend</strong> délivre l’e-mail de confirmation de suppression du compte à votre adresse principale vérifiée, l’e-mail de lancement (envoyé une fois, le 13 octobre 2026) et les retours que vous envoyez au développeur. Il reçoit ces adresses et le contenu des e-mails. Il délivre aussi l’unique rappel du héros.</li>
      </ul>

      <h2>Durée de conservation</h2>
      <ul>
        <li>Votre compte commun : jusqu’à sa suppression. La progression dans un jeu : jusqu’à la suppression de ce jeu ou de votre compte.</li>
        <li>Journal d’aventure détaillé : trois jours. Résumés des tours : 30 jours. XP récente pour les classements : sept jours.</li>
        <li>Reçus de requêtes en double : 24 heures. Tentatives de connexion TRMNL : moins d’un jour.</li>
        <li>Liste de lancement : supprimée lors de l’envoi de l’e-mail de lancement, le 13 octobre 2026. Nous n’en gardons aucune copie.</li>
        <li>Rappel du héros : la date d’envoi, ou votre refus, jusqu’à la suppression de votre compte.</li>
        <li>Retours : jusqu’à la suppression de votre compte, ou plus tôt sur demande. Les copies déjà envoyées par e-mail au développeur sont supprimées sur demande.</li>
        <li>Réglages et appareils d’alerte : jusqu’à ce que vous désactiviez les alertes, retiriez l’appareil, ou supprimiez Desk Crawler ou votre compte. Un appareil dont l’adresse de notification ne fonctionne plus est retiré automatiquement. Historique des alertes : sept jours.</li>
        <li>Sauvegardes : environ une semaine, après quoi les données supprimées en disparaissent aussi.</li>
        <li>Enregistrements masqués : 30 jours. Événements d’audience et profils d’assistance : jusqu’à la suppression du compte ou une demande de suppression antérieure.</li>
        <li>Rapports d’erreur dans Sentry : jusqu’à 90 jours. Ils ne sont pas liés à votre compte, la suppression du compte n’a donc rien à y effacer.</li>
      </ul>

      <h2>Supprimer votre compte</h2>
      <p>
        Allez dans <Link to="/account">Compte</Link> et demandez un lien de suppression. Nous écrivons à votre adresse principale vérifiée ; le lien expire au bout de 30 minutes. Connectez-vous avec le même compte et tapez DELETE sur la page de confirmation. Tant que vous ne confirmez pas, votre compte reste actif. Après confirmation, votre compte cesse aussitôt de fonctionner, votre nom public est masqué
        dans les classements, puis votre héros, vos objets, votre historique, vos connexions TRMNL et votre identifiant TRMNL Games sont supprimés. Les instantanés de classement qui ont copié votre nom
        sont remplacés en deux heures environ. Si vous ne pouvez pas vous connecter, écrivez-nous et nous le ferons pour vous.
      </p>
      <p>
        Nous ne gardons qu’une empreinte à sens unique de votre identité de connexion et de vos anciens jetons TRMNL, pour qu’un compte supprimé ne puisse pas être reconnecté en douce. Les images déjà
        envoyées à un appareil TRMNL ou mises en cache par TRMNL ne peuvent pas être effacées par nous ; retirez le plugin de votre playlist pour les remplacer. Les compteurs de limitation de débit sont supprimés pendant la suppression, et les références au compte dans les journaux d’administration sont effacées.
      </p>
      <p>La suppression des profils, événements et enregistrements PostHog liés est demandée dans le cadre de la suppression du compte et traitée de façon asynchrone par PostHog. Les demandes en échec sont relancées et restent visibles par l’exploitant jusqu’à leur résolution.</p>

      <h2>Supprimer seulement un jeu</h2>
      <p>Dans les <Link to="/app/desk-crawler/settings">réglages de Desk Crawler</Link>, choisissez Supprimer la progression Desk Crawler pour effacer ce héros, son historique, ses connexions et les réglages et appareils d’alerte. Votre compte commun et votre identifiant restent disponibles. Vous pouvez recommencer en réinstallant le plugin une fois la suppression terminée. Les autres jeux ne sont pas touchés.</p>

      <h2>Vos choix</h2>
      <p>
        Vous pouvez demander une copie de vos données de jeu, ou la correction ou la suppression de quelque chose, en écrivant à <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Nous visons une réponse sous deux jours ouvrés.
      </p>

      <h2>Enfants</h2>
      <p>TRMNL Games ne s’adresse pas aux enfants de moins de 13 ans, et nous ne détenons pas sciemment leurs données. Si vous pensez qu’un enfant a un compte, écrivez-nous et nous le supprimerons.</p>

      <h2>Modifications</h2>
      <p>Quand cette politique change, nous mettons à jour cette page et la date en haut.</p>
    </>
  ),
  IdleAngler: () => (
    <>
      <h2>Idle Angler</h2>
      <p>Idle Angler conserve votre pêcheur : l’or, le plan d’eau et l’appât, votre glacière, votre carnet des espèces et des meilleurs poids, votre historique de pêche, vos plus gros poissons à chaque plan d’eau, vos succès et votre boîte à mouches. Vos plus gros poissons apparaissent sous votre nom public dans les classements d’Idle Angler et sur les écrans TRMNL des autres joueurs. Sauf si vous masquez Idle Angler de votre profil public dans les réglages d’Idle Angler, toute personne disposant du lien voit votre titre, votre date de départ, votre nombre de succès et les espèces notées.</p>
      <p>Si vous activez les alertes Idle Angler, elles utilisent les mêmes appareils et heures calmes que les alertes de vos autres jeux. Le code mouche hebdomadaire de votre TRMNL est lié à votre installation et n’est jamais affiché dans le compagnon.</p>
      <p>Dans les <Link to="/app/idle-angler/settings">réglages d’Idle Angler</Link>, Supprimer la progression Idle Angler efface votre pêcheur, votre glacière, votre carnet, vos records de classement, votre boîte à mouches, vos succès, vos connexions Idle Angler et vos réglages d’alerte Idle Angler. Votre compte et vos autres jeux restent. Supprimer votre compte TRMNL Games supprime Idle Angler avec tout le reste.</p>
    </>
  ),
  PaperLives: () => (
    <>
      <h2>Paper Lives</h2>
      <p>Paper Lives conserve votre vie en cours et vos vies terminées : le nom, les pronoms, les traits, les caractéristiques, l’argent, le métier et le logement de chaque personnage, les personnes de sa vie, son histoire et les choix que vous avez faits, ainsi que les archives et les photos de l’album et vos succès. Vos vies les plus longues et vos plus grandes fortunes apparaissent sous votre nom public dans les classements de Paper Lives et sur les écrans TRMNL des autres joueurs. Sauf si vous masquez Paper Lives de votre profil public dans les réglages de Paper Lives, toute personne disposant du lien voit le nom, l’âge, le métier et les traits de votre personnage actuel, le nombre de vies que vous avez vécues, votre arbre généalogique et vos vies terminées, chacune avec son épitaphe, ses moments forts et ses photos. Les noms des personnages sont publics sur ces pages : n’y mettez pas d’informations sur de vraies personnes.</p>
      <p>Si vous activez les alertes Paper Lives, elles utilisent les mêmes appareils et heures calmes que les alertes de vos autres jeux, et l’alerte affiche le prénom de votre personnage. Le code photo hebdomadaire de votre TRMNL est lié à votre installation et n’est jamais affiché dans le compagnon.</p>
      <p>Dans les <Link to="/app/paper-lives/settings">réglages de Paper Lives</Link>, Supprimer la progression Paper Lives efface vos vies, l’album et ses photos, vos records de classement, vos succès, vos connexions Paper Lives et vos réglages d’alerte Paper Lives. Votre compte et vos autres jeux restent. Supprimer votre compte TRMNL Games supprime Paper Lives avec tout le reste.</p>
    </>
  ),
}
