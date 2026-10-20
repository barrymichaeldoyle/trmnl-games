import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const privacyEs: LegalPage = {
  title: 'Privacidad',
  description: 'Qué guarda TRMNL Games, qué es público en las clasificaciones y en las pantallas TRMNL, y cómo borrar tu cuenta.',
  translationNote: () => <p className="text-sm text-muted">Traducción de la versión en inglés, que prevalece en caso de diferencia.</p>,
  Body: () => (
    <>
      <p>
        TRMNL Games es una colección de juegos gestionada por Barry Michael Doyle, un desarrollador independiente. Esta página explica con claridad qué guarda el servicio, quién lo trata y
        cómo eliminarlo. Las preguntas, a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Qué es público</h2>
      <p>
        Tu nombre público, el nombre y el nivel de tu héroe y tus puestos aparecen en las clasificaciones y en las pantallas TRMNL de otros jugadores. Elige un nombre público que no te
        importe compartir y nunca incluyas en él datos de contacto.
      </p>
      <p>
        En Desk Crawler, los héroes asaltan los escritorios de otros y se encuentran por azar. Cuando tu héroe asalta, es asaltado o se encuentra con otro héroe, tu nombre público aparece en el diario de aventuras del otro jugador, en la app y en su TRMNL, igual que ya aparece en las clasificaciones. Cuando tu héroe cae K.O. puede soltar un objeto de repuesto con tu nombre público, que el héroe de otro jugador puede encontrar y quedarse; tu nombre aparece entonces en ese objeto en su app y en su página de héroe. Si cambias de nombre o borras tu cuenta, esas historias y objetos muestran «Jugador oculto» o pierden el nombre.
      </p>
      <p>
        Tu héroe de Desk Crawler tiene una página pública: cualquiera con el enlace puede ver tu nombre público, el nombre de tu héroe, su nivel, puesto, planta actual y fecha de inicio, algunos totales y tus logros. El oro, el diario de aventuras y los datos de tu cuenta siguen siendo privados, y también tu equipo, salvo los repuestos de otros jugadores que guarda tu héroe, que se muestran con sus nombres. La página está activada por defecto. Ocultar mi página de héroe, en Ajustes, la oculta al momento, y puedes volver a mostrarla cuando quieras.
      </p>
      <p>
        Los jugadores con sesión iniciada pueden seguir una página pública de héroe. Guardamos quién sigue a quién para que su app pueda listar a los jugadores que siguen. A nadie se le avisa de que lo siguen, y ninguna página muestra quién sigue a un jugador. Si cambias tu nombre público, ocultas tu página o borras tu progreso, otros jugadores dejan de ver a tu héroe en su lista, y el borrado elimina esos registros.
      </p>

      <h2>Qué guardamos</h2>
      <ul>
        <li>Tu identidad de inicio de sesión de Clerk, nuestro proveedor de inicio de sesión. Tu correo solo se copia en solicitudes de confirmación de borrado de corta duración; no copiamos tu nombre real ni tu foto de perfil en la base de datos del juego.</li>
        <li>Tu nombre público, tu héroe, tus objetos, tu diario de aventuras y la XP reciente usada para las clasificaciones. Las cuentas más antiguas pueden tener además una zona horaria guardada de versiones anteriores.</li>
        <li>Si activas las alertas de Desk Crawler: qué alertas quieres, tus horas de silencio y la zona horaria de tu navegador (por ejemplo Europe/Madrid), y para cada dispositivo que permites, la dirección push que nos da tu navegador, sus claves de cifrado y una etiqueta como «Chrome on Android». También guardamos un registro breve de cada alerta: de qué tipo, cuándo y si se envió.</li>
        <li>
          Para cada instalación de TRMNL: el ID de la instancia del plugin, un hash de su token de acceso y el enlace de ajustes que nos da TRMNL. No guardamos tu nombre
          ni tu correo de TRMNL.
        </li>
        <li>El desfase horario que tu TRMNL envía con cada pantalla (por ejemplo UTC+2), para que el stand-up de la mañana de Desk Crawler siga tu día. Solo guardamos el último.</li>
        <li>El ajuste de idioma que tu TRMNL envía con cada pantalla (por ejemplo es-ES), para ver a qué idiomas merece la pena traducir los juegos y para que tu pantalla pueda usar tu idioma. Solo guardamos el último.</li>
        <li>Si eliges un idioma para TRMNL Games, esa elección, para que tus pantallas TRMNL y tus alertas también lo usen.</li>
        <li>Registros operativos de corta duración, como contadores de límite de uso y recibos de solicitudes duplicadas.</li>
        <li>Cuando pides borrar tu cuenta: tu correo principal verificado, un hash del enlace de confirmación y el estado de entrega. El enlace caduca a los 30 minutos; las solicitudes caducadas se eliminan en la limpieza diaria.</li>
        <li>La lista de lanzamiento de Desk Crawler guardaba direcciones de correo para un único correo cuando Desk Crawler llegara a la tienda de TRMNL. Ese correo se envió el 13 de octubre de 2026, todas las direcciones se borraron y la lista está cerrada.</li>
        <li>La lista de lanzamiento de Idle Angler guarda, para un solo correo cuando Idle Angler llegue al marketplace de TRMNL: de un jugador con sesión iniciada que pulsa Avísame, un enlace a su cuenta y su idioma (la dirección se lee de la cuenta al enviar el correo); de cualquier otra persona, la dirección que escribe y su idioma. Cada entrada se borra cuando se envía su correo, y puedes salir de la lista cuando quieras desde la página de inicio o el correo.</li>
        <li>El recordatorio del héroe: si tu héroe de Desk Crawler lleva dos días en marcha y nunca has abierto la app de Desk Crawler, enviamos un único correo a tu dirección principal verificada contando lo que te espera allí, con un enlace para pararlo. La dirección se lee de Clerk al enviarlo y no se guarda. Solo guardamos cuándo se envió, o que pediste no recibirlo.</li>
        <li>Si envías comentarios: tu mensaje, la página desde la que lo enviaste, tu nombre público y un enlace a tu cuenta. Se envía por correo al desarrollador con tu correo principal verificado como dirección de respuesta.</li>
      </ul>

      <h2>Qué no hacemos</h2>
      <p>No hay anuncios, y no vendemos ni compartimos tus datos con fines de marketing. El juego no tiene compras, así que no guardamos datos de pago.</p>

      <h2>Analítica y soporte opcionales</h2>
      <p>Si permites la analítica, PostHog registra las páginas que visitas, los pasos de instalación, los fallos de acciones del juego y los errores del navegador. Cuando inicias sesión, esos registros se vinculan con tu ID de cuenta de Clerk, tu correo, tu nombre público y el nombre de tu héroe, para poder investigar solicitudes de soporte y arreglar problemas. Los errores del navegador también van a Sentry, sin tu cuenta, tu correo ni tu dirección IP.</p>
      <p>PostHog también graba sesiones enmascaradas para que veamos dónde se atasca un proceso. Los textos y los campos de formulario se enmascaran, los datos de inicio de sesión y de cuenta se bloquean, y no grabamos cuerpos ni cabeceras de red ni la salida de la consola. Se excluyen los códigos de instalación, los tokens de acceso, los JWT de gestión y las cadenas de consulta de las URL.</p>
      <p>Puedes rechazarla y seguir jugando. Usa Preferencias de analítica en el pie del sitio para cambiar tu elección. Desactivar la analítica detiene la recogida nueva en ese navegador; no borra los registros anteriores. Contáctanos para eliminarlos, o borra tu cuenta de TRMNL Games para pedir que se elimine su perfil de PostHog vinculado, sus eventos y sus grabaciones.</p>

      <h2>Cookies</h2>
      <p>
        Clerk pone cookies que mantienen tu sesión iniciada. Mientras conectas o gestionas una instalación de TRMNL, ponemos una cookie cifrada de corta duración que caduca
        en minutos. Un enlace de confirmación de borrado usa una cookie cifrada de corta duración para que puedas iniciar sesión antes de confirmar. Si permites la analítica, PostHog usa el almacenamiento local del navegador para reconocer tus visitas. También guardamos tu preferencia de analítica en local, y una cookie recuerda el idioma que elegiste. No hay cookies publicitarias.
      </p>

      <h2>Servicios que tratan tus datos</h2>
      <ul>
        <li>
          <strong>Clerk</strong> gestiona el inicio de sesión y guarda tu correo y tu método de inicio de sesión, además de tu perfil de Google o GitHub si inicias sesión con uno de ellos.
        </li>
        <li>
          <strong>Convex</strong> aloja la base de datos del juego, las actualizaciones del juego cada 15 minutos y las copias de seguridad diarias.
        </li>
        <li>
          <strong>Cloudflare</strong> aloja esta web y guarda los registros de peticiones habituales.
        </li>
        <li>
          <strong>TRMNL</strong> recoge de nosotros la pantalla de tu héroe. Tu cuenta y tu dispositivo TRMNL se rigen por la política de privacidad de TRMNL.
        </li>
        <li><strong>PostHog EU</strong> gestiona la analítica de uso opcional, los informes de errores y las grabaciones de sesión enmascaradas para soporte y mejoras del producto.</li>
        <li><strong>Sentry</strong> (Estados Unidos) recibe informes de errores del servidor de nuestra web y del backend del juego, y de tu navegador si permites la analítica, para que podamos encontrar y arreglar fallos. Un informe contiene la ruta de la página o el nombre de la función del juego que falló, y los detalles técnicos del error. Nunca incluye tu cuenta, tu correo, tu dirección IP, cookies, contenido de formularios, cadenas de consulta de URL ni códigos y tokens de instalación.</li>
        <li><strong>El servicio push de tu navegador</strong> (Google para Chrome y Android, Apple para Safari, Mozilla para Firefox) entrega las alertas de Desk Crawler si las activas. Recibe la alerta cifrada, así que no puede leerla, junto con la dirección push que creó tu navegador.</li>
        <li><strong>Resend</strong> entrega el correo de confirmación de borrado de cuenta a tu dirección principal verificada, el correo de lanzamiento (enviado una vez, el 13 de octubre de 2026) y los comentarios que envías al desarrollador. Recibe esas direcciones y el contenido de los correos. También entrega el único recordatorio del héroe.</li>
      </ul>

      <h2>Cuánto tiempo lo guardamos</h2>
      <ul>
        <li>Tu cuenta compartida: hasta que la borres. El progreso de un juego: hasta que borres ese juego o tu cuenta.</li>
        <li>Diario de aventuras detallado: tres días. Resúmenes de ejecución: 30 días. XP reciente para las clasificaciones: siete días.</li>
        <li>Recibos de solicitudes duplicadas: 24 horas. Intentos de conexión con TRMNL: menos de un día.</li>
        <li>Lista de lanzamiento: borrada cuando se envió el correo de lanzamiento el 13 de octubre de 2026. No guardamos ninguna copia.</li>
        <li>Lista de lanzamiento de Idle Angler: cada entrada se borra cuando se envía su correo de lanzamiento, cuando sales de la lista o con tu cuenta.</li>
        <li>Recordatorio del héroe: cuándo se envió, o que pediste no recibirlo, hasta que borres tu cuenta.</li>
        <li>Comentarios: hasta que borres tu cuenta, o antes si lo pides. Las copias ya enviadas por correo al desarrollador se borran si lo pides.</li>
        <li>Ajustes de alertas y dispositivos: hasta que desactives las alertas, quites el dispositivo o borres Desk Crawler o tu cuenta. Un dispositivo cuya dirección push deja de funcionar se quita automáticamente. Registros de alertas individuales: siete días.</li>
        <li>Copias de seguridad: más o menos una semana, después de la cual los datos borrados también desaparecen de ellas.</li>
        <li>Grabaciones enmascaradas: 30 días. Eventos de analítica y perfiles de soporte: hasta que borres la cuenta o pidas antes su eliminación.</li>
        <li>Informes de errores en Sentry: hasta 90 días. No están vinculados a tu cuenta, así que el borrado de la cuenta no tiene nada que eliminar allí.</li>
      </ul>

      <h2>Borrar tu cuenta</h2>
      <p>
        Ve a <Link to="/account">Cuenta</Link> y pide un enlace de borrado. Lo enviamos a tu dirección principal verificada; el enlace caduca a los 30 minutos. Inicia sesión con la misma cuenta y escribe DELETE en la página de confirmación. Hasta que confirmes, tu cuenta sigue activa. Tras confirmar, tu cuenta deja de funcionar al momento, tu nombre público se oculta de
        las clasificaciones, y después se eliminan tu héroe, tus objetos, tu historial, tus conexiones con TRMNL y tu inicio de sesión de TRMNL Games. Las instantáneas de las clasificaciones que copiaron tu nombre
        se sustituyen en unas dos horas. Si no puedes iniciar sesión, escríbenos y lo hacemos por ti.
      </p>
      <p>
        Solo guardamos un hash unidireccional de tu identidad de inicio de sesión y de tus tokens antiguos de TRMNL, para que una cuenta borrada no pueda reconectarse sin más. No podemos borrar las imágenes ya
        enviadas a un dispositivo TRMNL o guardadas en caché por TRMNL; quita el plugin de tu lista de reproducción para sustituirlas. Los contadores de límite de uso se eliminan durante el borrado, y las referencias a la cuenta en los registros de auditoría administrativa se limpian.
      </p>
      <p>La eliminación de los perfiles, eventos y grabaciones de PostHog vinculados se solicita como parte del borrado de la cuenta y PostHog la procesa de forma asíncrona. Las solicitudes fallidas se reintentan y quedan visibles para el operador hasta que se resuelven.</p>

      <h2>Borrar solo un juego</h2>
      <p>En los <Link to="/app/desk-crawler/settings">ajustes de Desk Crawler</Link>, elige Borrar el progreso de Desk Crawler para eliminar ese héroe, el historial, las conexiones y los ajustes y dispositivos de alertas. Tu cuenta compartida y tu inicio de sesión siguen disponibles. Puedes volver a empezar instalando el plugin cuando termine el borrado. Los demás juegos no se ven afectados.</p>

      <h2>Tus opciones</h2>
      <p>
        Puedes pedir una copia de tus datos de juego, o que se corrija o borre algo, escribiendo a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Intentamos responder en dos días laborables.
      </p>

      <h2>Menores</h2>
      <p>TRMNL Games no está pensado para menores de 13 años, y no guardamos sus datos a sabiendas. Si crees que un menor tiene una cuenta, escríbenos y la borraremos.</p>

      <h2>Cambios</h2>
      <p>Cuando esta política cambia, actualizamos esta página y la fecha de arriba.</p>
    </>
  ),
  IdleAngler: () => (
    <>
      <h2>Idle Angler</h2>
      <p>Idle Angler guarda tu pescador: las monedas, el agua y el cebo, tu nevera, tu cuaderno de especies y mejores pesos, tu historial de pesca, tu pez más pesado en cada agua y en cada Open de fin de semana, tus pedidos del pescadero, tu pared de trofeos y tus medallas, tus logros y tu caja de moscas. Tus peces más pesados aparecen con tu nombre público en las clasificaciones y los resultados de los Opens de Idle Angler y en las pantallas TRMNL de otros jugadores. Salvo que ocultes Idle Angler de tu perfil público en los ajustes de Idle Angler, cualquiera con el enlace ve tu título, tu fecha de inicio, tu número de logros, las especies anotadas, tu número de medallas y los peces de tu pared de trofeos.</p>
      <p>Si activas las alertas de Idle Angler, usan los mismos dispositivos y horas de silencio que las alertas de tus otros juegos. El código semanal de mosca de tu TRMNL va ligado a tu instalación y nunca se muestra en la app.</p>
      <p>En los <Link to="/app/idle-angler/settings">ajustes de Idle Angler</Link>, Borrar el progreso de Idle Angler elimina tu pescador, tu nevera, tu cuaderno, tus registros de clasificación y de los Opens, tu pared de trofeos y tus medallas, tu caja de moscas, tus logros, tus conexiones de Idle Angler y los ajustes de alertas de Idle Angler. Tu cuenta y los demás juegos se quedan. Borrar tu cuenta de TRMNL Games elimina Idle Angler junto con todo lo demás.</p>
    </>
  ),
  PaperLives: () => (
    <>
      <h2>Paper Lives</h2>
      <p>Paper Lives guarda tu vida actual y las terminadas: el nombre de cada personaje, sus pronombres, rasgos, estadísticas, dinero, trabajo y casa, las personas de su vida, su historia y las decisiones que tomaste, además de los registros y fotos del álbum y tus logros. Tus vidas más largas y tus mayores fortunas aparecen con tu nombre público en las tablas de Paper Lives y en las pantallas TRMNL de otros jugadores. Salvo que ocultes Paper Lives de tu perfil público en los ajustes de Paper Lives, cualquiera con el enlace ve el nombre, la edad, el trabajo y los rasgos de tu personaje actual, cuántas vidas has vivido, tu árbol genealógico y tus vidas terminadas, cada una con su epitafio, sus momentos destacados y sus fotos. Los nombres de los personajes son públicos en esas páginas, así que no pongas en ellos datos de personas reales.</p>
      <p>Si activas las alertas de Paper Lives, usan los mismos dispositivos y horas de silencio que las alertas de tus otros juegos, y la alerta muestra el nombre de tu personaje. El código semanal de foto de tu TRMNL va ligado a tu instalación y nunca se muestra en la app.</p>
      <p>En los <Link to="/app/paper-lives/settings">ajustes de Paper Lives</Link>, Borrar el progreso de Paper Lives elimina tus vidas, el álbum y sus fotos, los registros de las tablas, los logros, las conexiones de Paper Lives y los ajustes de alertas de Paper Lives. Tu cuenta y los demás juegos se quedan. Borrar tu cuenta de TRMNL Games elimina Paper Lives junto con todo lo demás.</p>
    </>
  ),
}
