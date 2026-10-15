import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const termsFr: LegalPage = {
  title: 'Conditions d’utilisation',
  seoTitle: 'Conditions',
  description: 'Les règles pour jouer à Desk Crawler : un jeu gratuit, fourni en l’état, avec des règles de fair-play et de noms publics.',
  translationNote: () => <p className="text-sm text-muted">Traduction de la version anglaise, qui fait foi en cas de différence.</p>,
  Body: () => (
    <>
      <p>
        Ces conditions couvrent votre utilisation de TRMNL Games et de ses jeux, gérés par Barry Michael Doyle. En créant un compte ou en reliant une installation TRMNL, vous les
        acceptez. Elles complètent la <Link to="/privacy">politique de confidentialité</Link>.
      </p>

      <h2>Le jeu</h2>
      <ul>
        <li>Desk Crawler est gratuit. Il n’y a ni achat, ni abonnement, ni publicité.</li>
        <li>Le jeu évolue avec le temps : l’équilibrage, le contenu et les fonctions peuvent être ajustés. Nous faisons en sorte de conserver la progression de votre héros d’une mise à jour à l’autre, sans pouvoir le garantir.</li>
        <li>Nous pouvons suspendre ou arrêter le service. Quand c’est possible, nous prévenons d’abord dans le compagnon.</li>
      </ul>

      <h2>Votre compte</h2>
      <ul>
        <li>Vous devez avoir au moins 13 ans pour jouer.</li>
        <li>Protégez votre connexion. Vous êtes responsable de ce qui se passe avec votre compte.</li>
        <li>Vous pouvez supprimer votre compte à tout moment depuis <Link to="/account">Compte</Link>.</li>
      </ul>

      <h2>Fair-play et noms publics</h2>
      <ul>
        <li>Les noms publics et les noms de héros doivent respecter les <Link to="/support">règles de nommage</Link> : ni propos haineux ou sexuels, ni menaces ou harcèlement, ni coordonnées, ni usurpation d’identité.</li>
        <li>N’automatisez pas le jeu, n’exploitez pas les bugs, ne perturbez ni le service ni les autres joueurs, et n’essayez pas d’accéder à des données qui ne sont pas les vôtres. Signalez plutôt les bugs.</li>
        <li>Nous pouvons masquer un nom, ou suspendre un compte en cas d’abus délibéré ou répété. Masquer un nom ne touche jamais la progression de votre héros. Pour contester, écrivez à <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</li>
      </ul>

      <h2>Or et objets</h2>
      <p>L’or, l’équipement et les potions n’existent que dans le jeu. Ils n’ont aucune valeur monétaire et ne peuvent être ni vendus, ni échangés, ni transférés hors du jeu.</p>

      <h2>TRMNL</h2>
      <p>TRMNL Games et Desk Crawler sont des projets indépendants. Ils ne sont ni créés, ni approuvés, ni soutenus par TRMNL. Votre compte et votre appareil TRMNL relèvent des conditions de TRMNL.</p>

      <h2>Propriété</h2>
      <p>
        Le code source est ouvert sous licence MIT sur <a href="https://github.com/barrymichaeldoyle/trmnl-games">GitHub</a>. Les illustrations, les noms de monstres, d’objets et de lieux, les textes du jeu et
        le nom et le logo Desk Crawler ne sont pas couverts par cette licence et restent soumis à tous droits réservés.
      </p>

      <h2>Absence de garantie</h2>
      <p>
        TRMNL Games est fourni en l’état, sans garantie d’aucune sorte. Dans la mesure permise par la loi, nous ne sommes pas responsables de la perte de progression, des interruptions de service,
        de ce qui s’affiche sur votre appareil ni d’aucune perte indirecte. Rien dans ces conditions ne supprime les droits que vous accorde le droit de la consommation et qui ne peuvent pas être exclus.
      </p>

      <h2>Modifications</h2>
      <p>Quand ces conditions changent, nous mettons à jour cette page et la date en haut. Si vous continuez à jouer après une modification, les nouvelles conditions s’appliquent.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </>
  ),
}
