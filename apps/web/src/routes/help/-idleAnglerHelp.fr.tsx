import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'
import { IDLE_ANGLER_HELP_HEAD } from './-helpHeads'

const w = anglerWords('fr')
const n = (value: number) => w.number(value)
const et = (parts: readonly string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}`)

export const fr: HelpPage = {
  seoTitle: IDLE_ANGLER_HELP_HEAD.fr.seoTitle,
  description: IDLE_ANGLER_HELP_HEAD.fr.description,
  title: 'Idle Angler sur TRMNL',
  contents: {
    'getting-started': 'Pour commencer',
    goals: 'Objectifs et ce qui se débloque',
    'how-fishing-works': 'Comment se passe la pêche',
    'time-and-weather': 'Heures, météo et saisons',
    bait: 'Appâts et poisson mort',
    'the-fishmonger': 'Le poissonnier',
    'the-cooler': 'La glacière',
    'rods-and-fish-that-get-away': 'Cannes et poissons qui s’échappent',
    waters: 'Plans d’eau',
    'the-logbook': 'Le carnet et les titres',
    rankings: 'Classements et Opens du week-end',
    'the-trophy-wall': 'Le mur des trophées',
    'the-fly-box': 'La boîte à mouches',
    achievements: 'Succès',
    alerts: 'Alertes',
    'pausing-and-removing': 'Pause et suppression',
    help: 'Aide',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Pour commencer</h2>
      <ul>
        <li>Installez Idle Angler depuis la marketplace des plugins TRMNL et choisissez Installer.</li>
        <li>Connectez-vous à TRMNL Games et reliez l’installation. Votre pêcheur porte votre nom public.</li>
        <li>De retour dans TRMNL, cliquez sur Enregistrer. Dans les quinze minutes, votre pêcheur lance sa ligne pour la première fois et prend un poisson.</li>
        <li>Ajoutez le plugin à une playlist ou à un mashup. Les quatre tailles de mise en page sont prises en charge, dans les deux orientations.</li>
      </ul>
      <h2 id="goals">Objectifs et ce qui se débloque</h2>
      <p>Le Ponton affiche toujours un objectif, comme « {w.goal('first_sale')} » ou « {w.goal('dawn_dusk')} ». L’atteindre met quelques pièces de côté : appuyez sur Encaisser sur le Ponton pour les récupérer, et l’objectif suivant apparaît. Un point sur l’onglet Ponton signale qu’une récompense attend. Les objectifs n’expirent jamais, et votre pêcheur en atteint environ la moitié sans vous.</p>
      <p>Le jeu s’ouvre à mesure que votre carnet se remplit : cannes et glacières plus grandes à {F.unlocks.shop_upgrades} espèces, commandes du poissonnier à {F.unlocks.orders}, Opens du week-end à {F.unlocks.opens}, mur des trophées à {F.unlocks.trophies} et poisson mort à {F.unlocks.deadbait}. Le Ponton indique ce qui arrive ensuite.</p>
      <h2 id="how-fishing-works">Comment se passe la pêche</h2>
      <p>Toutes les quinze minutes, de jour comme de nuit, votre pêcheur lance une fois. Parfois, ça mord. Le poisson dépend du plan d’eau, de l’appât, de l’heure et de la météo. Son poids fixe son prix, dit s’il s’agit d’un record personnel et le place dans les classements. Votre TRMNL montre la scène, les dernières histoires et le classement de la semaine pour votre plan d’eau. Ouvrez le compagnon pour vendre vos prises, acheter de l’appât ou changer de plan d’eau.</p>
      <h2 id="time-and-weather">Heures, météo et saisons</h2>
      <p>L’aube va de 05:00 à 08:00, le jour jusqu’à 17:00, le crépuscule jusqu’à 20:00, puis c’est la nuit, dans le fuseau horaire indiqué par votre TRMNL. Les poissons mordent davantage à l’aube et au crépuscule. La météo est la même pour tous les pêcheurs d’un plan d’eau et change toutes les six heures : clair, couvert, pluie, vent ou brouillard. Le temps couvert et la pluie apportent plus de touches au {w.water('river_bend')}, le vent en apporte moins, et le brouillard rend l’aube et le crépuscule assez sombres pour les poissons de nuit.</p>
      <p>Les plans d’eau ont leurs saisons, les mêmes pour tous : printemps, été, automne et hiver, une semaine chacune, avec un changement chaque lundi à 00:00 UTC. Certains poissons ne mordent qu’en une saison, l’eau douce ralentit en hiver, et la scène montre des fleurs, des feuilles ou de la neige. Chaque saison a sa montaison, du lundi au jeudi, quand une espèce arrive : {et(F.runs.map((id) => w.species(id).toLowerCase()))}.</p>
      <h2 id="bait">Appâts et poisson mort</h2>
      <p>Chaque plan d’eau a ses appâts, et l’appât décide quels poissons peuvent mordre ; le Magasin dit quels poissons prennent chacun. Choisissez l’appât sur la page Ponton. Chaque poisson gardé, ou qui s’échappe, consomme un appât. Un lancer sans touche n’en consomme pas, pas plus qu’un poisson relâché faute de place dans la glacière. Sans appât pour le plan d’eau, le pêcheur pêche à l’hameçon nu, qui donne moins de touches et seulement de petits poissons. Achetez l’appât en pots au Magasin, jusqu’à {F.baitCap} de chaque ; l’appât ne se gâte jamais.</p>
      <p>Les petits poissons, comme le gardon, la vandoise, l’ablette et le maquereau, peuvent repartir à l’hameçon comme poisson mort depuis la glacière : un poisson donne {F.deadbaitPerFish} appâts, jusqu’à {F.deadbaitCap} en réserve. Seuls les carnassiers prennent le poisson mort, comme la perche, le brochet, le sandre, l’anguille et les gros poissons de mer, et ils sont plus lourds avec.</p>
      <h2 id="the-fishmonger">Le poissonnier</h2>
      <p>Le poissonnier affiche {F.orderSlots} commandes, comme « {w.text('Two Roach')} » ou « {w.text('One fish over 1.5 kg')} ». Quand des poissons de votre glacière correspondent à une commande, le poissonnier apparaît sur la page Glacière avec ces poissons et un bouton Vendre : il paie 1,5 fois leur prix du marché plus un bonus, et la page montre les deux prix. Les commandes n’expirent jamais, et une place vide se remplit à 07:00, heure locale. Votre pêcheur ne choisit pas ses prises, donc le poissonnier ne se montre que quand il y a quelque chose à lui vendre.</p>
      <h2 id="the-cooler">La glacière</h2>
      <p>Les poissons vont dans la glacière jusqu’à ce que vous les vendiez. Quand elle est pleine, le pêcheur continue de pêcher et relâche ses prises. Les poissons relâchés vont quand même au carnet, comptent pour les succès et peuvent mener les classements, mais ne rapportent pas de pièces. Votre TRMNL signale une glacière pleine, et son QR code ouvre la glacière. Une glacière plus grande, c’est moins de poissons relâchés entre deux visites. Le jeu ne vend jamais vos poissons à votre place.</p>
      <h2 id="rods-and-fish-that-get-away">Cannes et poissons qui s’échappent</h2>
      <p>Chaque canne ramène des poissons jusqu’à un certain poids. Un poisson plus lourd se libère, et l’histoire dit que quelque chose de lourd a filé. Une meilleure canne l’aurait ramené. Les meilleures cannes donnent aussi un peu plus de touches.</p>
      <h2 id="waters">Plans d’eau</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong> : là où tout le monde commence. Gardons, perches et brèmes, carpes à l’aube et au crépuscule, anguilles la nuit.</li>
        <li><strong>{w.water('river_bend')}</strong> : s’ouvre quand {F.gates.river_bend} espèces de l’{w.water('millpond')} sont au carnet, avec les {w.pass('waders').toLowerCase()}. Truites, chevesnes et barbeaux, et brochets et sandres à la cuillère.</li>
        <li><strong>{w.water('harbour_pier')}</strong> : s’ouvre quand {F.gates.harbour_pier} espèces du {w.water('river_bend')} sont au carnet, avec le {w.pass('pier_permit')}. Des poissons de mer, plus gros et plus chers. La plupart demandent la {w.rod('Carbon Rod')} ou mieux.</li>
        <li><strong>{w.water('heron_lake')}</strong> : s’ouvre quand {F.gates.heron_lake} espèces du {w.water('river_bend')} sont au carnet, avec la {w.pass('rowing_boat').toLowerCase()}. De grosses carpes aux bouillettes, et des silures les nuits d’été.</li>
        <li><strong>{w.water('deep_sea')}</strong> : s’ouvre quand {F.gates.deep_sea} espèces de la {w.water('harbour_pier')} sont au carnet. Un billet du Magasin donne {F.charter.casts} lancers en mer pour {n(F.charter.price)} pièces ; le bateau vous ramène à la jetée quand ils sont épuisés, et les lancers non utilisés restent sur le billet. Les plus gros poissons demandent la {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong> : s’ouvre quand {F.gates.frozen_tarn} espèces du {w.water('heron_lake')} sont au carnet, avec la {w.pass('ice_auger').toLowerCase()}, et seulement pendant la semaine d’hiver. Quand la glace fond, le pêcheur rentre à pied au {w.water('heron_lake')}.</li>
      </ul>
      <p>Se déplacer coûte un lancer, puis le pêcheur pêche le nouveau plan d’eau. Si l’appât utilisé ne sert pas là-bas, le pêcheur passe à l’appât qui convient dont vous avez le plus. Vous pouvez revenir quand vous voulez.</p>
      <h2 id="the-logbook">Le carnet et les titres</h2>
      <p>Chaque espèce prise est notée avec son nombre et votre meilleur poids, et le carnet dit quels appâts, heures et météo elle préfère. Les poissons pas encore pris apparaissent en silhouette avec leur appât, sauf les épiques. Les poissons épiques demandent le bon appât, la bonne heure et la bonne météo à la fois, et certains ne mordent qu’en une saison.</p>
      <p>C’est le carnet qui vous fait progresser. Les nouvelles espèces ouvrent le plan d’eau suivant et les fonctions ci-dessus, et vous donnent votre titre : {F.titles.map((t) => `${w.title(t.id)} à ${t.species} espèces`).join(', ')}. Tout le monde commence avec le titre {w.title(F.firstTitle)}. Idle Angler n’a ni XP ni niveaux.</p>
      <p>Chaque plan d’eau a aussi son propre rang : {F.ranks.map((r) => w.lang.waterRanks[r]).join(', ')}, selon la part de ses espèces inscrites au carnet. {w.lang.waterRanks.master} demande toutes les espèces du lieu, visiteurs de saison et poisson épique compris. Votre TRMNL affiche votre rang là où vous pêchez, avec des repères pour les espèces qui manquent.</p>
      <h2 id="rankings">Classements et Opens du week-end</h2>
      <p>Chaque plan d’eau a son classement : le plus gros poisson que chaque pêcheur y a pris, gardé ou relâché. Un classement court sur la semaine et repart chaque lundi à 00:00 UTC ; l’autre garde les records de tous les temps. Votre TRMNL montre le classement de la semaine pour votre plan d’eau, et le compagnon les montre tous.</p>
      <p>Chaque week-end, du samedi 00:00 au dimanche 23:59 UTC, chaque plan d’eau organise un Open pour une espèce, indiquée sur la page Classements. Prenez ce poisson à cet endroit pour vous inscrire ; votre plus gros compte. Le lundi, les trois premiers de chaque plan d’eau reçoivent une médaille et {et(F.prizes.map(n))} pièces, et chaque participant reçoit une rosette.</p>
      <h2 id="the-trophy-wall">Le mur des trophées</h2>
      <p>Un poisson d’au moins {F.trophies.minPercent} % du poids maximum de son espèce peut être monté depuis la glacière au lieu d’être vendu. Le montage coûte la valeur du poisson plus {F.trophies.fee} pièces. Le mur commence avec {F.trophies.firstPegs} crochets et peut en accueillir jusqu’à {F.trophies.maxPegs} ; d’autres crochets s’achètent sur la page du mur. Médailles et rosettes vont sur l’étagère, et votre page publique montre le mur quand elle est publique.</p>
      <h2 id="the-fly-box">La boîte à mouches</h2>
      <p>Chaque semaine, votre TRMNL affiche un code mouche à six chiffres à côté de son QR code et dans sa barre de titre. Scannez le QR code, ou tapez le code sur la page Carnet, pour ajouter la mouche de la semaine à votre boîte. Votre pêcheur porte la plus récente sur son chapeau. Une mouche par semaine : un nouveau code arrive chaque lundi à 00:00 UTC, et celui de la semaine précédente reste valable jusqu’au lundi suivant au cas où votre écran se serait actualisé tard. Après les {F.flies} mouches, les modèles reviennent. Les mouches ne changent rien à la pêche.</p>
      <h2 id="achievements">Succès</h2>
      <p>Les succès ont des paliers, pour la pêche, le carnet, votre matériel et les plans d’eau, le commerce et chaque espèce. La page Succès, sous Plus, montre vos paliers, la part de pêcheurs qui ont chacun et ce qu’il reste jusqu’au suivant. Votre profil public les montre quand Idle Angler y figure.</p>
      <h2 id="alerts">Alertes</h2>
      <p>Activez les alertes dans les Réglages de la page Plus pour recevoir une notification sur ce téléphone quand votre glacière est pleine ou que votre pêcheur n’a plus d’appât. Elles sont désactivées jusqu’à ce que vous les activiez, et vous en recevez au plus deux par jour pour tous vos jeux.</p>
      <h2 id="pausing-and-removing">Pause et suppression</h2>
      <p>Mettez la pêche en pause dans les Réglages de la page Plus : aucune prise jusqu’à la reprise, et vous gardez tout. Retirer le plugin de TRMNL garde votre pêcheur. Supprimer la progression Idle Angler dans les Réglages efface votre pêcheur, votre glacière et votre carnet, sans toucher à votre compte ni à vos autres jeux.</p>
      <h2 id="help">Aide</h2>
      <p>Écrivez à <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> en indiquant ce qu’affiche votre écran et quand vous l’avez vu changer pour la dernière fois.</p>
    </>
  ),
}
