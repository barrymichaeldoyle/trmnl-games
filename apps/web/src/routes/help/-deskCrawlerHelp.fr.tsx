import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'

const t = contentTranslator('fr')
const n = (value: number) => t.number(value)
const or = (value: number) => `${n(value)} pièces d’or`
const et = (parts: readonly string[], last = 'et') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
const name = (english: string) => t.name(english)
const floor = (english: string) => t.nameWith(english, 'le')
const rungs = (list: readonly { name: string; size: number; price: number }[]) => et(list.map((rung) => `${t.nameWith(rung.name, 'un')} (${rung.size}) pour ${or(rung.price)}`))
const price = (c: Cost) => `${et(c.materials.map((m) => `${m.n} ${name(m.name).toLowerCase()}`))} plus ${or(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `${signed(m.attackPct)} % d’attaque` : '', m.defensePct ? `${signed(m.defensePct)} % de défense` : '', m.xpPct ? `${signed(m.xpPct)} % d’XP des victoires` : '', m.goldPct ? `${signed(m.goldPct)} % d’or` : '', m.trapDamagePct ? `pièges ${m.trapDamagePct} % moins douloureux` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = et(F.floors.filter((b) => b.level > 1).map((b) => `${floor(b.name)} au niveau ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` Disponible au niveau ${F.unlocks[feature]}.`)
const rarityFr: Record<string, string> = { common: 'commun', uncommon: 'peu commun', rare: 'rare', epic: 'épique' }

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const NTH = ['premier', 'deuxième', 'troisième', 'quatrième', 'cinquième']
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, pendant ${rule.days} jours` : ''
  switch (date.kind) {
    case 'fixed':
      return `le ${date.day === 1 ? '1er' : date.day} ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const base = `le ${NTH[date.nth - 1]} ${WEEKDAYS[date.weekday]} de ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      return `${offset === 0 ? base : `le ${WEEKDAYS[(date.weekday + offset) % 7]} qui suit ${base}`}${span}`
    }
    case 'friday_13th':
      return 'chaque vendredi 13'
    case 'easter':
      return date.offsetDays === -2 ? 'du Vendredi saint au lundi de Pâques' : `${Math.abs(date.offsetDays)} jours ${date.offsetDays < 0 ? 'avant' : 'après'} le dimanche de Pâques${span}`
    case 'table': {
      const next = nextTableDate(date.dates)
      return next === null ? 'une date qui change chaque année' : `une date qui change chaque année (prochaine : ${next.getUTCDate()} ${MONTHS[next.getUTCMonth()]} ${next.getUTCFullYear()})`
    }
  }
}

export const fr: HelpPage = {
  seoTitle: 'Aide et installation de Desk Crawler',
  description: 'Comment installer Desk Crawler sur TRMNL et comment fonctionne chaque partie du jeu, avec des solutions quand l’écran semble en retard.',
  title: 'Desk Crawler sur TRMNL',
  contents: {
    'getting-started': 'Premiers pas', 'if-the-qr-sends-you-back-to-setup': 'Si le QR vous renvoie à l’installation', 'how-time-works': 'Comment le temps passe', floors: 'Étages', 'desk-keepsakes': 'Souvenirs de bureau', career: 'Carrière', 'heroes-and-classes': 'Héros et classes', stances: 'Postures', 'desk-raids': 'Raids de bureau', meetings: 'Rencontres', 'lost-property': 'Objets trouvés', 'to-do-list': 'Liste de tâches', potions: 'Potions', 'the-wandering-merchant': 'Le marchand ambulant', decisions: 'Décisions', effects: 'Effets', 'office-calendar': 'Calendrier du bureau', 'rare-and-epic-gear': 'Équipement rare et épique', 'when-your-bag-fills-up': 'Quand le sac est plein', 'bigger-bags': 'Sacs plus grands', 'salvage-and-the-workbench': 'Démontage et établi', 'getting-knocked-out': 'Être mis K.-O.', recaps: 'Récaps', 'understanding-rankings': 'Comprendre les classements', 'sharing-your-hero': 'Partager votre héros', 'following': 'Suivis', names: 'Noms', gender: 'Genre', alerts: 'Alertes', troubleshooting: 'Dépannage', 'disconnecting-and-removing': 'Déconnecter et retirer', help: 'Aide',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Premiers pas</h2>
      <ul>
        <li>Ouvrez <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler dans la boutique TRMNL</a> et choisissez Installer.</li>
        <li>Connectez-vous à Desk Crawler, choisissez un nom public et un nom de héros, puis reliez l’installation.</li>
        <li>De retour dans TRMNL, cliquez sur Enregistrer. La première aventure de votre héros commence en moins de 15 minutes.</li>
        <li>Ajoutez le plugin à une playlist, ou à un mashup si vous voulez votre héros à côté d’autres plugins. Les quatre tailles de mise en page sont prises en charge.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">Si le QR vous renvoie à l’installation</h2>
      <p>Le QR ouvre le compagnon du compte avec lequel vous êtes connecté. Il ne lance pas de nouvelle installation. Vérifiez l’adresse e-mail affichée sur la page d’installation et utilisez Changer de compte si vous aviez relié l’installation avec un autre compte.</p>
      <p>Si l’installation indique « Reconnecter Desk Crawler », votre connexion TRMNL existe mais le héros manque. Cela peut arriver après la réinitialisation d’avant lancement. Installez une nouvelle copie de <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler depuis TRMNL</a>, connectez-vous avec le même compte, choisissez un nouveau nom de héros, reliez, puis cliquez sur Enregistrer dans TRMNL. Une fois la nouvelle copie en marche, retirez l’ancienne de votre playlist.</p>
      <p>Si l’installation indique « Enregistrez dans TRMNL pour commencer », votre héros est déjà prêt. Retournez à cette installation dans TRMNL et cliquez sur Enregistrer.</p>
      <h2 id="how-time-works">Comment le temps passe</h2>
      <p>
        Le monde du jeu avance toutes les 15 minutes, que votre écran soit allumé ou non. Votre TRMNL affiche un instantané et s’actualise selon son propre rythme.
        Le mode veille, une actualisation plus lente et les autres éléments de la playlist ne réduisent jamais la progression de votre héros. Les heures des aventures dans le compagnon suivent le fuseau horaire de votre navigateur.
      </p>
      <h2 id="floors">Étages</h2>
      <p>Le bâtiment compte {F.floors.length} étages, et votre héros commence dans {floor(F.floors[0]?.name ?? '')}. Chacun s’ouvre à un niveau, que vous y alliez ou non : {FLOORS_LINE}. Votre TRMNL indique « Nouvelle zone débloquée » quand c’est le cas ; à vous de décider d’y aller, depuis la carte de la page Héros. Les étages plus profonds ont des monstres plus coriaces, plus d’or, de meilleures potions et des tâches mieux payées. {t.nameWith(F.floors[0]?.name ?? '', 'Le')} ne peut pas mettre un héros K.-O. ; tous les autres étages le peuvent.</p>
      <ul>
        {F.floors.map((f) => <li key={f.id}><strong>{name(f.name)}</strong>{f.level > 1 ? ` (niveau ${f.level})` : ' (dès le départ)'} : {f.monsters.map(name).join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>La page Notes de terrain, sous Plus, garde ce que votre héros a noté sur chaque étage et chaque monstre. La note d’un étage s’ouvre la première fois que votre héros y met les pieds, celle d’un monstre à la première victoire contre lui. Les notes n’influent pas sur le jeu.</p> : null}
      <h2 id="desk-keepsakes">Souvenirs de bureau</h2>
      <p>Gardez Desk Crawler dans votre playlist et cherchez « Code souvenir » suivi d’un code à six chiffres, comme 482 917, dans la barre de titre de l’écran (les mashups étroits en portrait l’abrègent en « Souvenir »). Saisissez ce code dans les Réglages du compagnon pour récupérer un souvenir de bureau permanent. Le plein écran et les mashups l’affichent tous les deux ; l’aperçu du compagnon le masque. Tant qu’un souvenir attend, le QR code de l’écran le récupère aussi : scannez-le avec votre téléphone et le compagnon l’ajoute à votre étagère, même si la barre de titre est masquée. Quand il y a la place, le code est imprimé à côté.</p>
      <p>Vous pouvez récupérer un souvenir par semaine, avec un nouveau code chaque lundi à 00:00 UTC. Le code de la semaine précédente marche aussi si votre écran s’actualise lentement. Si vous manquez une semaine, vous obtenez le même modèle la semaine suivante. Une fois la collection complète, vous pouvez récupérer d’autres exemplaires de chaque modèle. Les souvenirs ne changent ni l’XP, ni l’équipement, ni les classements, et plusieurs appareils ou une actualisation plus rapide ne rapportent rien de plus.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Carrière</h2>
          <p>Votre héros a toujours un objectif, affiché en haut de la page Héros : « Gagnez votre premier combat », « Équipez une pièce d’équipement trouvée », « Rendez-vous dans la Salle des serveurs », « Achetez le Sac à dos pour portable ». Certains s’atteignent en aventure ; les autres se font ici, sur la page Sac ou Héros. Atteindre un objectif affiche « Objectif atteint » sur votre TRMNL et met un peu d’or de côté ({n(F.career.gold)} sur toute l’échelle) ; appuyez sur Récupérer sur la page Héros pour l’encaisser. Les objectifs ne donnent pas d’XP et n’expirent jamais, et le suivant commence que vous ayez récupéré l’or ou non.</p>
          <ul>
            <li>La page Carrière, sous Plus, liste les {F.career.goals} objectifs dans l’ordre, avec la date à laquelle vous avez atteint chacun. Un objectif déjà rempli quand l’échelle est arrivée compte comme atteint.</li>
            {F.unlocks !== undefined ? <li>Les fonctions arrivent par niveau, que vous passiez ou non : la liste de tâches au niveau {F.unlocks.todo}, les postures au niveau {F.unlocks.stances}, les décisions du bureau au niveau {F.unlocks.choices}, {F.meetings?.level !== undefined ? `les rencontres entre collègues au niveau ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `le démontage et l’établi au niveau ${F.workbench.level}, ` : ''}le marchand ambulant au niveau {F.unlocks.merchant} et les raids de bureau au niveau {F.unlocks.raids}. Votre TRMNL indique « Débloqué » à chaque fois. Les étages s’ouvrent aussi par niveau : {FLOORS_LINE}.</li> : null}
            <li>Quand les postures s’ouvrent, votre héros n’en a aucune et joue Équilibré. Un objectif vous demande d’en choisir une ; n’importe laquelle des trois compte, et vous pourrez en changer ensuite.</li>
            <li>Quelques premiers objectifs arrivent à coup sûr à temps : le premier combat en quelques aventures, une pièce d’équipement dans la première douzaine, et une première décision, un premier marchand et une première élite dans la journée qui suit leur niveau. Tout le reste dépend du hasard.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Héros et classes</h2>
          <p>Tout le monde commence en Guerrier. Quand votre Guerrier atteint le niveau {F.rosterLevel}, votre TRMNL indique « Débloqué : un second héros », et vous pouvez recruter un Voleur depuis la page Héros, sous Plus. Le Voleur commence au niveau 1 avec son propre nom, son équipement, son or, ses potions et ses objectifs.</p>
          <ul>
            <li>Un seul héros part à l’aventure à la fois : c’est lui que montre votre TRMNL et lui qui figure dans les classements. L’autre reste là où vous l’avez laissé. Il ne part pas à l’aventure et ne rattrape rien plus tard, et un marchand qui lui rend visite repart.</li>
            <li>Vous pouvez changer une fois par jour. Revenir en arrière dans les dix minutes ne compte pas. Un héros K.-O. ou en route doit d’abord récupérer ou arriver.</li>
            <li>Vous pouvez avoir un héros de chaque classe. Les succès vous appartiennent quel que soit le héros qui les obtient ; quelques-uns sont réservés au Voleur.</li>
            <li><strong>Guerrier</strong> : {t.text(F.classes.warriorBlurb)}</li>
            <li><strong>Voleur</strong> : {t.text(F.classes.rogueBlurb)} {F.classes.rogue.hpPct} % de santé, attaque {signed(F.classes.rogue.attackPct)} %, défense {signed(F.classes.rogue.defensePct)} %, {signed(F.classes.rogue.goldPct)} % d’or à chaque combat et trouvaille, et {F.classes.rogue.raidEdgePct} points de son côté dans chaque raid de bureau. Il progresse au même rythme que le Guerrier mais se fait mettre K.-O. un peu plus souvent.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Postures</h2>
      <p>Choisissez le degré de prudence de votre héros sur la page Héros.{arrives('stances')} La posture s’applique dès l’aventure suivante, et vous pouvez la changer à tout moment. Votre TRMNL l’affiche à côté du nombre de places du sac, sous une jauge dont l’aiguille est basse pour Prudent, au milieu pour Équilibré et haute pour Audacieux.</p>
      <ul>
        <li><strong>Prudent</strong> boit une potion sous 65 % de PV, se repose sous 50 % et repart à 90 %. Il gagne 90 % de l’XP habituelle des victoires.</li>
        <li><strong>Équilibré</strong>, le réglage par défaut, boit sous 50 %, se repose sous 35 % et repart à 75 %, avec l’XP habituelle.</li>
        <li><strong>Audacieux</strong> boit sous 35 %, se repose sous 20 % et repart à 60 %. Il gagne 115 % d’XP des victoires mais se fait mettre K.-O. plus souvent.</li>
      </ul>
      <p>L’Open space ne peut pas mettre un héros K.-O., donc Audacieux n’y prend aucun risque. Partout ailleurs, un K.-O. coûte de l’or et renvoie votre héros dans l’Open space, et Audacieux est celui qui tombe le plus souvent.</p>
      <h2 id="desk-raids">Raids de bureau</h2>
      <p>Pendant l’exploration, les héros pillent parfois le bureau des autres. Chaque héros actif{F.unlocks === undefined ? '' : ` à partir du niveau ${F.unlocks.raids}`} pille et se fait piller automatiquement. Vous ne pouvez ni lancer un raid ni choisir sa cible.{F.unlocks === undefined ? '' : ` Sous le niveau ${F.unlocks.raids}, un héros ne pille pas et n’est pas pillé.`} Le raid apparaît dans le journal d’aventure des deux héros avec le nom public de l’autre joueur, et la page Héros garde l’historique des raids de votre héros.</p>
      <ul>
        <li>Le vainqueur se décide à pile ou face, influencé seulement par la posture. Le niveau, l’équipement et les effets ne comptent jamais. Prudent ajoute 10 points de son côté, Équilibré rien, et Audacieux en retire 5, en attaque comme en défense.</li>
        <li>La fréquence des raids dépend aussi de la posture : Prudent environ un jour d’exploration sur deux, Équilibré environ une fois par jour, Audacieux environ deux fois par jour.</li>
        <li>Le perdant donne 5 % de son or au gagnant : l’or ne fait que changer de mains. Les deux perdent des PV : le perdant 30 % de ses PV max, le gagnant 10 %. Un équipement Économe réduit la perte d’or de ses points.</li>
        <li>Un raid peut mettre un héros K.-O., exactement comme un combat ; dans l’Open space, votre héros est secouru à la place. Les raids ne trouvent que les héros qui explorent ou se reposent, et un héros pillé est laissé tranquille pendant environ six heures.</li>
        <li>Si vous préférez perdre moins de raids, choisissez Prudent : c’est la posture qui pille le moins et gagne le plus.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Rencontres</h2>
          <p>De temps en temps, au lieu d’un combat, votre héros croise le héros d’un autre joueur au même étage{F.meetings.level === undefined ? '' : `, à partir du niveau ${F.meetings.level}`}. Ils prennent un café, échangent des histoires de guerre ou partagent un sandwich, et les deux héros reçoivent le même petit bonus pendant {F.meetings.boonAdventures} aventures. Les deux journaux racontent la rencontre avec le nom public de l’autre joueur, et l’onglet Journal liste les cinq dernières rencontres de votre héros.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{t.text(kind.name)}</strong> : {t.text(kind.effect)}, {boonLine(kind.modifiers)}.</li>)}
            <li>Rien ne change de mains. Une rencontre remplace une aventure, et le bonus compense à peu près.</li>
            <li>Elle arrive au même rythme quelles que soient la posture et la classe, environ un jour sur deux pour un héros en exploration. Les héros ne se croisent qu’en exploration ou au repos, et un héros qui vient d’avoir une rencontre est laissé tranquille pendant environ douze heures.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Objets trouvés</h2>
          <p>Quand votre héros est mis K.-O. hors de l’Open space, il laisse tomber un double de son arme ou de son armure à cet étage, avec votre nom public écrit au feutre. Votre héros garde tout ce qu’il portait. Plus tard, le héros d’un autre joueur qui explore cet étage peut trouver ce double au lieu d’une trouvaille ordinaire, et votre TRMNL vous dit qui l’a trouvé.</p>
          <ul>
            <li>Votre héros peut trouver les doubles des autres joueurs de la même façon. Un double est un équipement ordinaire : équipez-le, vendez-le, démontez-le ou apportez-le à l’établi. Il a les caractéristiques de base de son type et de sa rareté, sans les améliorations de son premier propriétaire.</li>
            <li>Le nom reste dessus. La page Sac et la carte Objets trouvés de l’onglet Journal indiquent à qui il appartenait, tout comme votre page de héros tant que vous le gardez.</li>
            <li>Un double ne fait que remplacer une trouvaille que votre héros allait faire de toute façon : personne ne reçoit d’équipement en plus. Les objectifs de carrière et les cadeaux de Noël sont toujours de l’équipement neuf.</li>
            <li>Un seul double à vous traîne à la fois. Si votre héros est de nouveau mis K.-O. avant que quelqu’un le trouve, le nouveau remplace l’ancien.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">Liste de tâches</h2>
          <p>Votre héros tient une liste de trois petites tâches de bureau, comme « Vaincre 4 Diablotins de papier », « Trouver 2 pièces d’équipement » ou « Explorer la Salle des serveurs pendant 16 aventures ».{arrives('todo')} Il s’en occupe en explorant, et la page Héros montre l’avancement de chaque tâche. Quand une tâche est finie, votre écran indique « Coché » et votre héros reçoit un peu d’or : {et(F.todo.pay.map(String), 'ou')} selon l’étage. Les tâches ne donnent pas d’XP et n’influent donc pas sur les classements.</p>
          <ul>
            <li>Chaque matin à {F.todo.standup}, heure locale de votre TRMNL, le stand-up remplace les tâches terminées. Votre écran les liste.</li>
            <li>Les tâches n’expirent jamais. Une tâche bloquée est échangée automatiquement après deux stand-ups.</li>
            <li>Au moins deux des trois tâches peuvent se faire là où se trouve votre héros. Une seule au plus demande un voyage dans une autre zone, si vous voulez l’y envoyer.</li>
            <li>Une fois entre deux stand-ups, vous pouvez échanger une tâche non terminée contre une autre sur la page Héros.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Potions</h2>
      {F.potions === undefined
        ? <p>Une potion de soin rend 40 % des PV max de votre héros, arrondis au supérieur. Votre héros en boit une automatiquement quand ses PV passent sous le seuil de potion de sa posture en exploration, et le journal le note. Sans potion, votre héros se repose sous le seuil de repos et repart une fois rétabli. Vous pouvez aussi en boire une vous-même depuis la page Héros quand votre héros explore ou se repose sans être à pleine santé. Les potions se trouvent en exploration et ne prennent jamais de place dans le sac.</p>
        : <>
          <p>Les potions existent en {F.potions.strengths.length} forces : {et(F.potions.strengths.map((s) => `${name(s.name).toLowerCase()} (${s.healPct} %)`))}, chacune rendant cette part des PV max de votre héros, arrondie au supérieur. Les trouvailles dépendent de l’endroit : {F.potions.drops.map((d) => `${floor(d.floor)} donne ${d.rest.length === 0 ? 'uniquement' : 'surtout'} des ${name(`${d.top.toLowerCase()}s`)}${d.rest.length === 0 ? '' : `, avec quelques ${d.rest.map((r) => name(`${r.toLowerCase()}s`)).join(' et ')}`}`).join(' ; ')}. Un nouveau héros commence avec des potions de soin, et le marchand comme les décisions du bureau en distribuent aussi. Toutes les forces partagent une même pochette et ne prennent jamais de place dans le sac.</p>
          <p>Votre héros boit automatiquement quand ses PV passent sous le seuil de potion de sa posture en exploration : la potion la plus faible qui le remet au-dessus du seuil, ou la plus forte qu’il a si aucune plus faible ne suffit. Le journal indique ce qu’il a bu. Sans potion, votre héros se repose sous le seuil de repos et repart une fois rétabli. Vous pouvez aussi en boire une vous-même depuis la page Héros quand votre héros explore, se repose ou voyage sans être à pleine santé ; avec plusieurs forces dans la pochette, la page Héros demande laquelle.</p>
          <p><strong>Combiner.</strong> Sur la page Sac, {F.potions.combine.count} {name(`${F.potions.combine.from.toLowerCase()}s`)} et {F.potions.combine.materials.map((m) => `${m.n} ${name(m.name).toLowerCase()}`).join(', ')} donnent une {name(F.potions.combine.to.toLowerCase())}. Combiner ne vous laisse jamais plus de potions qu’avant, donc la pochette ne peut pas déborder. Cela n’arrive que si vous le choisissez.</p>
        </>}
      <p>Les potions sont rangées dans une pochette. Un nouveau héros porte {t.nameWith(F.firstPouch.name, 'un')} qui contient {F.firstPouch.size} potions. Les pochettes plus grandes s’achètent avec de l’or sur la page Sac, une à la fois : {rungs(F.shopPouches)}. Quand la pochette est pleine, une potion trouvée devient de l’or.</p>
      <h2 id="the-wandering-merchant">Le marchand ambulant</h2>
      <p>De temps en temps, votre héros croise un marchand ambulant en exploration. Votre écran indique « Marchand de passage. Achats bientôt dans le compagnon. » et la page Sac affiche jusqu’à trois offres : quelques potions, et la prochaine pochette ou le prochain sac{F.merchantOff > 0 ? ` à −${F.merchantOff} % du prix de la page Sac` : ''}. Chaque offre ne se vend qu’une fois. Le marchand repart après quatre aventures ou après votre dernier achat.</p>
      <h2 id="decisions">Décisions</h2>
      <p>Parfois, le bureau demande quelque chose de simple à votre héros, comme participer à un gâteau ou rester tard. Votre écran indique « Une décision vous attend dans le compagnon. » et la page Héros montre les deux options avec exactement ce que chacune change. Si vous ne répondez pas en un jour environ, l’option marquée par défaut est choisie pour vous.</p>
      <h2 id="effects">Effets</h2>
      <p>Certains moments laissent à votre héros un effet de courte durée, affiché sur la page Héros avec les aventures restantes. Battre une élite donne Rage de vaincre (+10 % d’attaque pendant huit aventures). Participer au gâteau donne Ventre plein (+10 % d’XP pendant huit aventures). Un piège laisse une Contusion (−15 % de défense pendant quatre aventures). Votre héros garde au plus trois effets. Tout repos efface les mauvais effets, et un K.-O. les efface tous.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Élites retranchées</h2>
          <p>À partir du niveau {F.standoff.minLevel}, dans {floor(F.standoff.floor)} et plus bas, une élite se retranche parfois au lieu de tomber en un combat. Votre TRMNL l’affiche avec sa barre de santé, et votre héros revient l’affronter à chaque aventure jusqu’à ce qu’elle tombe.</p>
          <ul>
            <li>À chaque aventure, votre héros l’affronte pendant six rounds au plus, et sa santé est conservée. Elle frappe bien plus fort qu’une élite ordinaire, et votre héros continue au-delà du seuil de repos de sa posture avant de reculer : un face-à-face peut donc finir en K.-O. Rompre le combat ne coûte pas d’or.</li>
            <li>Quand elle tombe, elle rapporte {F.standoff.xp} fois l’XP du monstre et {F.standoff.gold} fois son or, plus une trouvaille rare ou épique de cet étage.</li>
            <li>Elle part au bout de {F.standoff.hours} heures, ou plus tôt si votre héros est mis K.-O. ou voyage. Une pause n’arrête pas le compteur.</li>
            <li>La page Héros montre sa santé et l’heure de son départ. Vous pouvez y laisser tomber l’élite, et un voyage demande confirmation avant de l’abandonner.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Calendrier du bureau</h2>
          <p>Les fêtes et occasions du bureau décorent la scène de votre héros pour la journée : des décorations au plafond, quelque chose par terre, parfois un chapeau, et dans l’Open space une autre vue par la fenêtre. Elles suivent la date locale de votre TRMNL. La première fois que votre héros en voit une, le journal la nomme, et la plupart apportent un petit bonus le temps qu’elles durent. La page Héros affiche l’occasion du jour et la suivante.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{t.text(rule.name)}</strong>, {occasionDate(rule)} : {rule.id === 'friday_13th' ? 'chaque raid de bureau tourne mal (voir ci-dessous).' : rule.effectLabel ? `${t.text(rule.effectLabel)}.` : 'décorations seulement.'}</li>)}
          </ul>
          <p><strong>Vendredi 13.</strong> Les raids de bureau partent deux fois plus souvent, et tous tournent mal : personne ne gagne, et les deux héros perdent 20 % de leurs PV max et 5 % de leur or, que personne ne récupère. L’historique des raids de votre héros le compte comme un incident.</p>
          <p><strong>Noël.</strong> Votre héros trouve un cadeau emballé chaque Noël : une pièce d’équipement de l’étage où il se trouve, lors de sa première aventure des trois jours.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Équipement rare et épique</h2>
      <p>L’équipement peut être commun, peu commun, rare ou épique. L’épique est le plus rare, environ une trouvaille sur cent, et le plus puissant. L’équipement rare et épique porte aussi un trait spécial, indiqué dans le nom de l’objet et expliqué sur la page Sac :</p>
      <ul>
        <li><strong>Vampirique</strong> rend 5 % des PV max après chaque victoire.</li>
        <li><strong>Chanceux</strong> ajoute 20 % d’or aux victoires et aux trouvailles.</li>
        <li><strong>Robuste</strong> subit 40 % de dégâts en moins des pièges.</li>
        <li><strong>Économe</strong> perd 5 points d’or en moins quand ça tourne mal : une retraite ne coûte plus d’or au lieu de 5 %, et un K.-O. coûte 5 % au lieu de 10 %.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">Quand le sac est plein</h2>
      <p>Un nouveau héros commence avec un petit sac en papier de 6 places. L’équipement porté et les potions ne prennent pas de place. Quand le sac est plein, votre héros met de côté pour vous la prochaine pièce trouvée et continue l’aventure. Tant qu’elle attend, les trouvailles suivantes restent sur place jusqu’à ce que vous fassiez de la place.</p>
      <h2 id="bigger-bags">Sacs plus grands</h2>
      <p>Votre sac grandit avec l’or. {F.tote ? `Votre héros trouve ${t.nameWith(F.tote.name, 'un')} (${F.tote.size}) dans les deux premières heures environ. ` : ''}Ensuite, les sacs plus grands s’achètent sur la page Sac, un à la fois : {rungs(F.shopBags)}, jusqu’à {F.topBag} places. Il n’y a pas de niveau requis, et les sacs ne tombent jamais en butin.</p>
      <ol className="[&_li]:list-decimal">
        <li>Ouvrez Sac dans le compagnon. Équipez les améliorations et vendez l’équipement en trop pour faire de la place.</li>
        <li>Si une trouvaille est mise de côté, choisissez Récupérer la trouvaille. Laissez au moins une place libre après l’avoir récupérée pour que les aventures reprennent.</li>
        <li>Une fois une place libre et plus rien en attente, les aventures reprennent toutes seules en moins de 15 minutes. Vous pouvez encore choisir une autre zone débloquée sur la page Sac avant cela.</li>
      </ol>
      <p>Équiper un objet ne libère pas de place. Vendre ou recycler de l’équipement, ou acheter un plus grand sac, le fait, et la trouvaille mise de côté passe aussitôt dans le sac. La page Sac peut aussi vendre votre objet le plus faible en trop et garder la trouvaille en une touche. Le mode veille de votre TRMNL n’arrête jamais le jeu non plus.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Démontage et établi</h2>
        <p>{F.workbench.level !== undefined ? `À partir du niveau ${F.workbench.level}, l’` : 'L’'}équipement en trop a deux façons de quitter le sac : le vendre contre de l’or, ou le démonter en matériaux sur la page Sac. Le démontage rapporte selon le palier où la pièce a été trouvée, en unités du matériau de sa rareté : {F.workbench.materials.map((m) => `${name(m.name).toLowerCase()} pour l’équipement ${m.rarities.map((r) => rarityFr[r] ?? r).join(' et ')}`).join(', ')}. L’équipement épique rapporte {F.workbench.epicMultiplier} fois plus. Les matériaux ne prennent pas de place dans le sac et ne se vendent jamais. L’équipement n’est démonté que si vous le choisissez.{F.workbench.level !== undefined ? ` Avant le niveau ${F.workbench.level}, vendez le surplus : la première amélioration demande de toute façon le niveau ${F.workbench.level}.` : ''}</p>
        <p>L’établi dépense des matériaux et de l’or pour l’équipement que porte votre héros, sur place : la pièce garde son nom et son trait, seuls ses chiffres changent. Chaque pièce a une seule étape suivante. {F.workbench.tiers.map((s, i) => `${i === 0 ? 'Passer une pièce de palier 1 en Mk II' : 'Passer de Mk II à Mk III'} coûte ${price(s)}`).join(' ; ')} ; une pièce ne peut monter qu’à un palier que le niveau de votre héros pourrait équiper. Une fois en Mk III (ou trouvée ainsi), le renforcement ajoute un point par étape : {F.workbench.reinforce.map((s) => `+${s.to} pour ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `Après +${F.workbench.reinforce.at(-1)!.to}, la pièce est terminée.` : ''} L’équipement rare et épique peut aussi recevoir le trait de votre choix pour {price(F.workbench.affix)}, à la place de celui qu’il a.</p>
        <p>Les améliorations réussissent toujours. Démonter une pièce améliorée ne rend pas ce que vous avez dépensé pour elle, alors n’améliorez que l’équipement que vous comptez garder.</p>
      </> : null}
      <h2 id="getting-knocked-out">Être mis K.-O.</h2>
      <p>Votre héros se relève automatiquement au bout de deux heures environ et retourne dans l’Open space. Vous gardez votre XP et votre équipement mais perdez 10 % de votre or actuel.</p>
      <h2 id="recaps">Récaps</h2>
      <p>Votre écran affiche un court récap de la dernière nuit ou journée terminée, à l’heure locale de votre TRMNL. À 07:00, le récap de la nuit couvre 19:00 à 07:00 et reste affiché toute la journée. À 19:00, le récap de la journée couvre 07:00 à 19:00 et reste affiché toute la soirée et la nuit. La fenêtre du bureau passe du jour à la nuit aux mêmes heures. Les histoires au-dessus sont toujours les plus récentes.</p>
      <h2 id="understanding-rankings">Comprendre les classements</h2>
      <p>L’écran affiche le Top 5 XP de la semaine de votre groupe de niveau, avec votre ligne marquée, ou ajoutée sous la liste si vous êtes plus bas. Le compagnon propose aussi le classement du jour et un classement à vie. La journée commence à 00:00 UTC et la semaine le lundi à 00:00 UTC, comme pour les souvenirs. Les classements sont publiés toutes les heures : une aventure ou une montée de niveau récente peut donc apparaître avant la mise à jour de votre rang.</p>
      <p>Les héros en pause ou endormis gardent leur progression. Un héros sans XP cette semaine quitte le classement de la semaine jusqu’à en regagner. La progression à vie reste enregistrée.</p>
      <h2 id="sharing-your-hero">Partager votre héros</h2>
      <p>Votre héros a une page publique avec son niveau, son rang, son étage actuel, ses compteurs à vie et ses succès. L’or et le journal d’aventure n’y apparaissent jamais, et l’équipement seulement quand c’est le double d’un autre joueur que votre héros garde. Votre nom renvoie vers cette page depuis les classements et depuis les raids et rencontres des autres joueurs, et c’est là qu’on peut vous suivre. Les Réglages ont des boutons Partager et Copier le lien, et un lien partagé affiche une carte illustrée de votre héros avec son nom, son niveau et son rang. Pour la masquer, choisissez Masquer ma page de héros dans les Réglages. Elle disparaît aussitôt, et tant qu’elle est masquée, personne ne peut vous suivre.</p>
      <h2 id="following">Suivis</h2>
      <p>Une fois connecté, vous pouvez suivre un autre joueur depuis sa page publique de héros, jusqu’à 20 joueurs. Tous ceux que vous suivez sont listés sous Classements, avec le niveau, le rang et la position de leur héros, et des liens vers leurs pages. Suivre quelqu’un ne change rien au jeu, et personne n’est prévenu quand vous le suivez. Les raids de bureau choisissent leurs cibles au hasard parmi tout le monde : suivre un joueur n’envoie jamais votre héros chez lui. Si un joueur masque sa page, vous ne voyez plus que son nom jusqu’à ce qu’il la réaffiche. S’il change de nom public, il disparaît de votre liste.</p>
      <h2 id="names">Noms</h2>
      <p>Vous avez deux noms. Le nom de votre héros figure sur votre TRMNL, dans les classements et sur votre page de héros ; pour le changer, achetez un badge « Bonjour, je m’appelle » dans l’onglet Plus pour 200 pièces d’or. Il y en a un en stock par jour. Votre nom public, c’est vous, dans tous les jeux TRMNL : il apparaît à côté de votre héros dans les classements, dans les raids et rencontres des autres joueurs, et dans le lien de votre page. Vous pouvez le changer gratuitement une fois tous les 7 jours depuis Compte. Les liens vers votre ancienne page cessent de fonctionner, et personne d’autre ne peut prendre votre ancien nom pendant 7 jours.</p>
      <h2 id="gender">Genre</h2>
      <p>Vous choisissez le genre de votre héros, homme ou femme, à sa création. Cela change seulement son apparence sur votre TRMNL, sur votre page de héros et dans les rencontres des autres joueurs. Les deux jouent de la même façon. Pour le changer plus tard, achetez un relooking dans l’onglet Plus pour 200 pièces d’or, à tout moment.</p>
      <h2 id="alerts">Alertes</h2>
      <p>Votre TRMNL est le moyen principal de suivre votre héros, mais les Réglages peuvent aussi envoyer une notification sur votre téléphone dans deux cas, chacun désactivé tant que vous ne l’activez pas :</p>
      <ul>
        <li><strong>Sac plein :</strong> le sac est plein et votre héros vous garde une trouvaille. L’alerte arrive une demi-heure après que le sac s’est rempli, pour ne rien envoyer si vous le triez déjà, et une seule fois chaque fois qu’il se remplit.</li>
        <li><strong>Bonne affaire chez le marchand :</strong> un marchand vend le prochain sac ou la prochaine pochette{F.merchantOff > 0 ? ` à −${F.merchantOff} %` : ''} et votre héros a l’or. Au plus une fois par jour. Un marchand qui ne vend que des potions n’en envoie jamais.</li>
      </ul>
      <p>Vous recevez au plus deux alertes par jour. Les heures calmes vont de 21:00 à 08:00 sauf si vous les changez : une alerte de sac plein attend leur fin, et une bonne affaire qui arrive pendant ces heures est ignorée. Avant l’envoi, le jeu vérifie que l’alerte tient toujours, pour ne jamais vous parler d’un sac déjà trié ou d’une offre disparue. Les décisions, raids, K.-O., montées de niveau et souvenirs n’envoient jamais d’alerte.</p>
      <p>Choisissez Autoriser sur cet appareil dans les Réglages, puis acceptez la demande de votre navigateur. Sur iPhone et iPad, ajoutez d’abord TRMNL Games à votre écran d’accueil (Partager, puis Sur l’écran d’accueil) et ouvrez-le depuis là. Chaque appareil autorisé est listé dans les Réglages avec un bouton Retirer ; retirer le dernier désactive les alertes.</p>
      <h2 id="troubleshooting">Dépannage</h2>
      <h3 id="not-on-your-screen">Votre héros n’apparaît pas à l’écran</h3>
      <ul>
        <li>Cliquer sur Enregistrer ajoute Desk Crawler à votre playlist TRMNL. Votre appareil affiche la playlist un plugin à la fois, à sa fréquence d’actualisation : Desk Crawler apparaît quand vient son tour. Avec plusieurs plugins et une actualisation lente, cela peut prendre un moment.</li>
        <li>Ouvrez Playlists dans TRMNL et vérifiez que Desk Crawler y figure, sur l’appareil que vous regardez si vous en avez plusieurs, et qu’aucun planning ne le masque à cette heure-ci.</li>
        <li>Le mode veille arrête l’actualisation de l’écran la nuit. Votre héros continue l’aventure, et l’écran rattrape son retard au réveil de l’appareil.</li>
        <li>Un écran qui indique « La première aventure commence d’ici 15 minutes » fonctionne. La première histoire arrive au quart d’heure suivant.</li>
        <li>La page Héros du compagnon montre toujours ce que fait votre héros, quoi que l’écran affiche.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">L’écran semble en retard</h3>
      <ul>
        <li>« Mises à jour retardées » signifie que le service du jeu prend du retard. La progression de votre héros est conservée, et l’écran rattrape quand le service repart.</li>
        <li>Si le site compagnon est à jour mais pas l’écran, vérifiez le réglage d’actualisation du plugin et sa place dans la playlist TRMNL.</li>
        <li>Les aventures ont lieu tous les quarts d’heure, à l’heure pile, à :15, :30 et :45 dans le fuseau de votre TRMNL. L’écran n’affiche pas de compte à rebours ; l’heure à côté de chaque histoire est celle où elle s’est passée, et le compagnon indique la prochaine aventure.</li>
        <li>Si vous avez déconnecté ou désinstallé, réinstallez depuis TRMNL. Votre héros garde toute sa progression.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Déconnecter et retirer</h2>
      <p>
        Déconnecter arrête les nouveaux écrans pour cette installation. TRMNL peut continuer d’afficher la dernière image jusqu’à ce que vous retiriez le plugin de votre playlist ;
        nous ne pouvons pas effacer une image déjà sur votre appareil.
      </p>
      <h2 id="help">Aide</h2>
      <p>
        Écrivez à <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> pour toute aide sur votre compte ou la connexion. Nous visons une réponse sous deux jours ouvrés.
      </p>
    </>
  ),
}
