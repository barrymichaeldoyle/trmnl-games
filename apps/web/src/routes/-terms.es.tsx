import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'
import { TERMS_HEAD } from './-legalHeads'

export const termsEs: LegalPage = {
  title: TERMS_HEAD.es.title,
  seoTitle: TERMS_HEAD.es.seoTitle,
  description: TERMS_HEAD.es.description,
  translationNote: () => <p className="text-sm text-muted">Traducción de la versión en inglés, que prevalece en caso de diferencia.</p>,
  Body: () => (
    <>
      <p>
        Estas condiciones cubren tu uso de TRMNL Games y sus juegos, gestionados por Barry Michael Doyle. Al crear una cuenta o conectar una instalación de TRMNL las aceptas.
        Van junto a la <Link to="/privacy">política de privacidad</Link>.
      </p>

      <h2>El juego</h2>
      <ul>
        <li>Desk Crawler es gratis. No hay compras, suscripciones ni anuncios.</li>
        <li>
          El juego cambia con el tiempo: el equilibrio, el contenido y las funciones pueden ajustarse. Intentamos conservar el progreso de tu héroe en cada actualización, pero no
          podemos garantizarlo.
        </li>
        <li>Podemos pausar o cerrar el servicio. Cuando sea posible, avisaremos antes en la app.</li>
      </ul>

      <h2>Tu cuenta</h2>
      <ul>
        <li>Necesitas tener al menos 13 años para jugar.</li>
        <li>Mantén segura tu forma de iniciar sesión. Eres responsable de lo que ocurra a través de tu cuenta.</li>
        <li>
          Puedes borrar tu cuenta en cualquier momento desde <Link to="/account">Cuenta</Link>.
        </li>
      </ul>

      <h2>Juego limpio y nombres públicos</h2>
      <ul>
        <li>
          Los nombres públicos y de héroe deben cumplir las <Link to="/support">normas de nombres</Link>: nada de contenido de odio o sexual, amenazas o acoso, datos de contacto
          ni suplantaciones.
        </li>
        <li>No automatices el juego, no aproveches errores, no interfieras con el servicio ni con otros jugadores, ni intentes acceder a datos que no son tuyos. Informa de los errores.</li>
        <li>
          Podemos ocultar un nombre, o suspender una cuenta por abusos deliberados o repetidos. Ocultar un nombre nunca afecta al progreso de tu héroe. Para recurrir, escribe a{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Oro y objetos</h2>
      <p>El oro, el equipo y las pociones solo forman parte del juego. No tienen valor en dinero y no se pueden vender, intercambiar ni transferir fuera del juego.</p>

      <h2>TRMNL</h2>
      <p>
        TRMNL Games y Desk Crawler son proyectos independientes. No los hace, respalda ni mantiene TRMNL. Tu cuenta y tu dispositivo TRMNL se rigen por las condiciones de TRMNL.
      </p>

      <h2>Propiedad</h2>
      <p>
        El código fuente es abierto bajo la licencia MIT en{' '}
        <a href="https://github.com/barrymichaeldoyle/trmnl-games">GitHub</a>. Las ilustraciones, los nombres de monstruos, objetos y lugares, los textos escritos del juego y
        el nombre y el logotipo de Desk Crawler no están cubiertos por esa licencia y conservan todos los derechos reservados.
      </p>

      <h2>Sin garantía</h2>
      <p>
        TRMNL Games se ofrece tal cual, sin garantías de ningún tipo. En la medida en que lo permita la ley, no respondemos por progreso perdido, interrupciones del servicio,
        lo que aparezca en tu dispositivo ni ninguna pérdida indirecta. Nada en estas condiciones elimina derechos que tengas como consumidor y que no se puedan excluir.
      </p>

      <h2>Cambios</h2>
      <p>Cuando estas condiciones cambian, actualizamos esta página y la fecha de arriba. Si sigues jugando después de un cambio, se aplican las nuevas condiciones.</p>

      <h2>Contacto</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </>
  ),
}
