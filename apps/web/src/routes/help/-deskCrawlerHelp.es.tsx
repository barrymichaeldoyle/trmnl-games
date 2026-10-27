import { contentTranslator } from '@trmnl-games/desk-crawler/i18n/lazy'
import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'
import { DESK_CRAWLER_HELP_HEAD } from './-helpHeads'

const t = contentTranslator('es')
const n = (value: number) => t.number(value)
const oro = (value: number) => `${n(value)} de oro`
const y = (parts: readonly string[], last = 'y') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
const name = (english: string) => t.name(english)
const floor = (english: string) => t.nameWith(english, 'el')
const rungs = (list: readonly { name: string; size: number; price: number }[]) => y(list.map((rung) => `${t.nameWith(rung.name, 'un')} (${rung.size}) por ${oro(rung.price)}`))
const price = (c: Cost) => `${y(c.materials.map((m) => `${m.n} de ${name(m.name).toLowerCase()}`))} más ${oro(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `${signed(m.attackPct)} % de ataque` : '', m.defensePct ? `${signed(m.defensePct)} % de defensa` : '', m.xpPct ? `${signed(m.xpPct)} % de XP por victoria` : '', m.goldPct ? `${signed(m.goldPct)} % de oro` : '', m.trapDamagePct ? `las trampas hacen un ${m.trapDamagePct} % menos de daño` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = y(F.floors.filter((b) => b.level > 1).map((b) => `${floor(b.name)} en el nivel ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` Llega en el nivel ${F.unlocks[feature]}.`)
const rarityEs: Record<string, string> = { common: 'común', uncommon: 'poco común', rare: 'raro', epic: 'épico' }

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const NTH = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto']
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, durante ${rule.days} días` : ''
  switch (date.kind) {
    case 'fixed':
      return `el ${date.day} de ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const base = `el ${NTH[date.nth - 1]} ${WEEKDAYS[date.weekday]} de ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      return `${offset === 0 ? base : `el ${WEEKDAYS[(date.weekday + offset) % 7]} siguiente al ${base.slice(3)}`}${span}`
    }
    case 'friday_13th':
      return 'cada viernes 13'
    case 'easter':
      return date.offsetDays === -2 ? 'del Viernes Santo al Lunes de Pascua' : `${Math.abs(date.offsetDays)} días ${date.offsetDays < 0 ? 'antes' : 'después'} del Domingo de Pascua${span}`
    case 'table': {
      const next = nextTableDate(date.dates)
      return next === null ? 'una fecha que cambia cada año' : `una fecha que cambia cada año (la próxima: ${next.getUTCDate()} de ${MONTHS[next.getUTCMonth()]} de ${next.getUTCFullYear()})`
    }
  }
}

export const es: HelpPage = {
  seoTitle: DESK_CRAWLER_HELP_HEAD.es.seoTitle,
  description: DESK_CRAWLER_HELP_HEAD.es.description,
  title: 'Desk Crawler en TRMNL',
  contents: {
    'getting-started': 'Primeros pasos', 'if-the-qr-sends-you-back-to-setup': 'Si el QR te devuelve a la instalación', 'how-time-works': 'Cómo pasa el tiempo', floors: 'Plantas', 'desk-keepsakes': 'Recuerdos de oficina', career: 'Carrera', 'heroes-and-classes': 'Héroes y clases', stances: 'Posturas', 'desk-raids': 'Incursiones de escritorio', meetings: 'Reuniones', 'lost-property': 'Objetos perdidos', 'to-do-list': 'Lista de tareas', potions: 'Pociones', 'the-wandering-merchant': 'El mercader ambulante', decisions: 'Decisiones', effects: 'Efectos', 'office-calendar': 'Calendario de la oficina', 'rare-and-epic-gear': 'Equipo raro y épico', 'when-your-bag-fills-up': 'Cuando la bolsa se llena', 'bigger-bags': 'Bolsas más grandes', 'salvage-and-the-workbench': 'Desmontar y el banco de trabajo', 'getting-knocked-out': 'Caer K.O.', recaps: 'Resúmenes', 'understanding-rankings': 'Cómo funcionan las clasificaciones', 'sharing-your-hero': 'Compartir tu héroe', 'following': 'Seguir', names: 'Nombres', gender: 'Género', alerts: 'Alertas', troubleshooting: 'Solución de problemas', 'disconnecting-and-removing': 'Desconectar y quitar', help: 'Ayuda',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Primeros pasos</h2>
      <ul>
        <li>Abre <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler en la tienda de TRMNL</a> y elige Instalar.</li>
        <li>Inicia sesión en Desk Crawler, elige un nombre público y un nombre de héroe, y conecta la instalación.</li>
        <li>De vuelta en TRMNL, pulsa Guardar. La primera aventura de tu héroe empieza en menos de 15 minutos.</li>
        <li>Añade el plugin a una lista de reproducción, o a un mashup si quieres a tu héroe junto a otros plugins. Se admiten los cuatro tamaños de diseño.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">Si el QR te devuelve a la instalación</h2>
      <p>El QR abre la app de la cuenta con la que has iniciado sesión. No empieza una instalación nueva. Comprueba el correo de la sesión que aparece en la página de instalación y usa Cambiar de cuenta si conectaste en su día con otra cuenta.</p>
      <p>Si la instalación dice «Reconectar Desk Crawler», tu conexión con TRMNL existe pero falta el héroe. Puede pasar tras el reinicio del juego previo al lanzamiento. Instala una copia nueva de <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler desde TRMNL</a>, inicia sesión con la misma cuenta, elige un nombre de héroe nuevo, conecta y pulsa Guardar en TRMNL. Cuando la copia nueva funcione, quita la antigua de tu lista de reproducción.</p>
      <p>Si la instalación dice «Guarda en TRMNL para empezar», tu héroe ya está preparado. Vuelve a esa instalación en TRMNL y pulsa Guardar.</p>
      <h2 id="how-time-works">Cómo pasa el tiempo</h2>
      <p>
        El mundo del juego avanza cada 15 minutos, esté o no encendida tu pantalla. Tu TRMNL muestra una instantánea y se actualiza a su propio ritmo.
        El modo reposo, una actualización más lenta y los demás elementos de la lista nunca reducen el progreso de tu héroe. Las horas de aventura en la app usan la zona horaria de tu navegador.
      </p>
      <h2 id="floors">Plantas</h2>
      <p>El edificio tiene {F.floors.length} plantas, y tu héroe empieza en {floor(F.floors[0]?.name ?? '')}. Cada una se abre en un nivel, entres o no: {FLOORS_LINE}. Tu TRMNL dice «Nueva zona desbloqueada» cuando pasa; viajar allí es cosa tuya, desde el mapa del mundo de la página Héroe. Las plantas más profundas tienen monstruos más duros, más oro, mejores pociones y tareas mejor pagadas. {t.nameWith(F.floors[0]?.name ?? '', 'El')} no puede dejar K.O. a un héroe; todas las demás plantas sí.</p>
      <ul>
        {F.floors.map((f) => <li key={f.id}><strong>{name(f.name)}</strong>{f.level > 1 ? ` (nivel ${f.level})` : ' (desde el principio)'}: {f.monsters.map(name).join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>La página Notas de campo, en Más, guarda lo que tu héroe ha apuntado sobre cada planta y cada monstruo. La nota de una planta se abre la primera vez que tu héroe la pisa, la de un monstruo con la primera victoria contra él. Las notas no afectan al juego.</p> : null}
      <h2 id="desk-keepsakes">Recuerdos de oficina</h2>
      <p>Mantén Desk Crawler en tu lista de reproducción y busca «Recuerdo» seguido de un código de seis cifras, como 482 917, en la barra de título de la pantalla. Introduce ese código en los Ajustes de la app para conseguir un recuerdo de oficina permanente. Lo muestran tanto la pantalla completa como los mashups; la vista previa de la app lo oculta. Mientras espera un recuerdo, el QR de la pantalla también lo consigue: escanéalo con el móvil y la app lo añade a tu estante, incluso con la barra de título desactivada. Donde hay sitio, el código aparece al lado.</p>
      <p>Puedes conseguir un recuerdo por semana, con un código nuevo cada lunes a las 00:00 UTC. El código de la semana anterior también vale si tu pantalla se actualiza despacio. Si te saltas una semana, recibes el mismo diseño la siguiente. Con la colección completa, puedes conseguir más de cada uno. Los recuerdos no cambian la XP, el equipo ni las clasificaciones, y más dispositivos o una actualización más rápida no dan extras.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Carrera</h2>
          <p>Tu héroe siempre tiene un objetivo, que aparece arriba en la página Héroe: «Gana tu primer combate», «Equipa una pieza de equipo que hayas encontrado», «Llega a la Sala de servidores», «Compra la Mochila para portátil». Algunos se cumplen yendo de aventura; el resto los haces aquí, en la página Bolsa o Héroe. Cumplir un objetivo muestra «Objetivo cumplido» en tu TRMNL y aparta un poco de oro ({n(F.career.gold)} en toda la escalera); pulsa Cobrar en la página Héroe para recogerlo. Los objetivos no dan XP ni caducan, y el siguiente empieza tanto si has cobrado como si no.</p>
          <ul>
            <li>La página Carrera, en Más, lista los {F.career.goals} objetivos en orden, con la fecha en que cumpliste cada uno. Un objetivo que ya habías hecho cuando llegó la escalera cuenta como cumplido.</li>
            {F.unlocks !== undefined ? <li>Las funciones llegan por nivel, entres o no: la lista de tareas en el nivel {F.unlocks.todo}, las posturas en el nivel {F.unlocks.stances}, las decisiones de oficina en el nivel {F.unlocks.choices}, {F.meetings?.level !== undefined ? `las reuniones con compañeros en el nivel ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `desmontar y el banco de trabajo en el nivel ${F.workbench.level}, ` : ''}el mercader ambulante en el nivel {F.unlocks.merchant} y las incursiones de escritorio en el nivel {F.unlocks.raids}. Tu TRMNL dice «Desbloqueado» cuando pasa. Las plantas también se abren por nivel: {FLOORS_LINE}.</li> : null}
            <li>Cuando se abren las posturas, tu héroe no tiene ninguna elegida y juega Equilibrado. Un objetivo te pide elegir una; cualquiera de las tres cuenta, y puedes cambiarla después.</li>
            <li>Algunos objetivos tempranos están garantizados a tiempo: el primer combate en un puñado de aventuras, una pieza de equipo en la primera docena, y una primera decisión, mercader y élite en más o menos un día desde su nivel. Todo lo demás depende del azar.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Héroes y clases</h2>
          <p>Todo el mundo empieza como Guerrero. Cuando tu Guerrero llega al nivel {F.rosterLevel}, tu TRMNL dice «Desbloqueado: un segundo héroe», y puedes reclutar un Pícaro desde la página Héroes, en Más. El Pícaro empieza en el nivel 1 con su propio nombre, equipo, oro, pociones y objetivos.</p>
          <ul>
            <li>Sale de aventura un héroe cada vez, y es el que muestra tu TRMNL y el que aparece en las clasificaciones. El otro se queda donde lo dejaste. No va de aventura ni recupera después, y un mercader que lo visite se marcha.</li>
            <li>Puedes cambiar una vez al día. Volver atrás en diez minutos no cuenta. Un héroe K.O. o de viaje tiene que recuperarse o llegar primero.</li>
            <li>Puedes tener un héroe de cada clase. Los logros son tuyos, los consiga el héroe que sea; unos pocos son solo del Pícaro.</li>
            <li><strong>Guerrero</strong>: {t.text(F.classes.warriorBlurb)}</li>
            <li><strong>Pícaro</strong>: {t.text(F.classes.rogueBlurb)} {F.classes.rogue.hpPct} % de salud, ataque {signed(F.classes.rogue.attackPct)} %, defensa {signed(F.classes.rogue.defensePct)} %, {signed(F.classes.rogue.goldPct)} % de oro en cada combate y hallazgo, y {F.classes.rogue.raidEdgePct} puntos a su favor en cada incursión de escritorio. Sube de nivel al ritmo del Guerrero, pero cae K.O. un poco más a menudo.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Posturas</h2>
      <p>Elige lo prudente que es tu héroe en la página Héroe.{arrives('stances')} La postura se aplica desde la próxima aventura, y puedes cambiarla cuando quieras. Tu TRMNL la muestra junto al contador de la bolsa, bajo un indicador cuya aguja está baja con Prudente, en medio con Equilibrado y alta con Audaz.</p>
      <ul>
        <li><strong>Prudente</strong> bebe una poción por debajo del 65 % de PS, descansa por debajo del 50 % y vuelve a salir al 90 %. Gana el 90 % de la XP habitual por victoria.</li>
        <li><strong>Equilibrado</strong>, la opción por defecto, bebe por debajo del 50 %, descansa por debajo del 35 % y vuelve a salir al 75 %, con la XP habitual.</li>
        <li><strong>Audaz</strong> bebe por debajo del 35 %, descansa por debajo del 20 % y vuelve a salir al 60 %. Gana el 115 % de XP por victoria, pero cae K.O. más a menudo.</li>
      </ul>
      <p>En {floor(F.floors[0]?.name ?? '')} un héroe no puede caer K.O., así que Audaz no corre ese riesgo allí. En cualquier otra planta un K.O. cuesta oro y devuelve a tu héroe {t.nameWith(F.floors[0]?.name ?? '', 'al')}, y Audaz es la postura que más cae.</p>
      <h2 id="desk-raids">Incursiones de escritorio</h2>
      <p>Mientras exploran, los héroes a veces asaltan los escritorios de otros. Todo héroe activo{F.unlocks === undefined ? '' : ` desde el nivel ${F.unlocks.raids}`} asalta y es asaltado de forma automática. No puedes iniciar una incursión ni elegir el objetivo.{F.unlocks === undefined ? '' : ` Por debajo del nivel ${F.unlocks.raids} un héroe ni asalta ni es asaltado.`} La incursión aparece en el diario de aventuras de los dos héroes con el nombre público del otro jugador, y la página Héroe guarda un registro de las incursiones de tu héroe.</p>
      <ul>
        <li>Quién gana es lanzar una moneda, que solo mueve la postura. El nivel, el equipo y los efectos nunca cuentan. Prudente suma 10 puntos a su lado, Equilibrado no suma nada y Audaz resta 5, tanto al asaltar como al defender.</li>
        <li>La frecuencia de las incursiones también depende de la postura: Prudente más o menos cada dos días de exploración, Equilibrado una vez al día y Audaz dos veces al día.</li>
        <li>Quien pierde entrega el 5 % de su oro a quien gana, así que el oro solo cambia de manos. Los dos pierden salud: quien pierde el 30 % de sus PS máximos, quien gana el 10 %. El equipo Ahorrador descuenta sus puntos de la pérdida de oro.</li>
        <li>Una incursión puede dejar K.O. a un héroe, igual que un combate; en {floor(F.floors[0]?.name ?? '')} tu héroe es rescatado. Las incursiones solo encuentran héroes que exploran o descansan, y a un héroe asaltado se le deja en paz unas seis horas.</li>
        <li>Si prefieres perder menos incursiones, elige Prudente, que asalta menos y gana más.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Reuniones</h2>
          <p>De vez en cuando, en lugar de un combate, tu héroe se cruza con el héroe de otro jugador en la misma planta{F.meetings.level === undefined ? '' : `, desde el nivel ${F.meetings.level}`}. Se toman un café, se cuentan batallitas o comparten un bocadillo, y los dos héroes reciben la misma pequeña ventaja durante {F.meetings.boonAdventures} aventuras. Los dos diarios cuentan la historia con el nombre público del otro jugador, y la pestaña Diario lista las cinco últimas reuniones de tu héroe.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{t.text(kind.name)}</strong>: {t.text(kind.effect)}, {boonLine(kind.modifiers)}.</li>)}
            <li>Nada cambia de manos. Una reunión ocupa el lugar de una aventura, y la ventaja lo compensa más o menos.</li>
            <li>Pasa con la misma frecuencia sea cual sea tu postura o clase, más o menos cada dos días para un héroe que está explorando. Los héroes solo se encuentran mientras exploran o descansan, y a un héroe que acaba de tener una reunión se le deja en paz unas doce horas.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Objetos perdidos</h2>
          <p>Cuando tu héroe cae K.O. fuera de la Oficina, suelta en esa planta un repuesto de su arma o armadura con tu nombre público escrito a rotulador. Tu héroe conserva todo lo que llevaba puesto. Más adelante, el héroe de otro jugador que explore esa planta puede encontrar el repuesto en lugar de un hallazgo normal, y tu TRMNL te dice quién lo encontró.</p>
          <ul>
            <li>Tu héroe puede encontrar repuestos de otros jugadores de la misma forma. Un repuesto es equipo normal: equípalo, véndelo, desmóntalo o llévalo al banco de trabajo. Llega con las estadísticas básicas de su tipo y rareza, sin las mejoras del primer dueño.</li>
            <li>El nombre se queda. La página Bolsa y la tarjeta Objetos perdidos de la pestaña Diario muestran de quién era, y también tu página de héroe mientras lo tengas.</li>
            <li>Un repuesto solo sustituye un hallazgo que tu héroe iba a hacer de todos modos, así que nadie recibe equipo extra. Los objetivos de carrera y los regalos de Navidad son siempre equipo nuevo.</li>
            <li>Solo hay un repuesto tuyo por ahí cada vez. Si tu héroe vuelve a caer K.O. antes de que alguien lo encuentre, el nuevo sustituye al anterior.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">Lista de tareas</h2>
          <p>Tu héroe lleva una lista de tareas de oficina con tres tareas pequeñas, como «Vence a 4 Diablillos de papel», «Encuentra 2 piezas de equipo» o «Explora la Sala de servidores durante 16 aventuras».{arrives('todo')} Las va haciendo mientras explora, y la página Héroe muestra el progreso de cada una. Cuando una tarea está hecha, tu pantalla dice «Tachada» y tu héroe recibe un poco de oro: {y(F.todo.pay.map(String), 'o')} según la planta. Las tareas no dan XP, así que no afectan a las clasificaciones.</p>
          <ul>
            <li>Cada mañana a las {F.todo.standup}, hora local de tu TRMNL, el stand-up da tareas nuevas a cambio de las hechas. Tu pantalla las lista.</li>
            <li>Las tareas nunca caducan. Una tarea atascada se cambia sola tras dos stand-ups.</li>
            <li>Al menos dos de las tres tareas se pueden hacer donde está tu héroe. Como mucho una pide viajar a otra zona, si quieres mandar allí a tu héroe.</li>
            <li>Una vez entre stand-ups puedes cambiar una tarea sin terminar por otra distinta en la página Héroe.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Pociones</h2>
      {F.potions === undefined
        ? <p>Una poción curativa devuelve el 40 % de los PS máximos de tu héroe, redondeado hacia arriba. Tu héroe bebe una automáticamente cuando sus PS bajan del umbral de poción de su postura mientras explora, y el diario lo anota. Sin pociones, tu héroe descansa por debajo del umbral de descanso y vuelve a salir cuando se recupera. También puedes beber una tú desde la página Héroe cuando tu héroe explora o descansa sin tener la salud al máximo. Las pociones se encuentran explorando y nunca ocupan sitio en la bolsa.</p>
        : <>
          <p>Las pociones vienen en {F.potions.strengths.length} potencias: {y(F.potions.strengths.map((s) => `${name(s.name).toLowerCase()} (${s.healPct} %)`))}, y cada una devuelve esa parte de los PS máximos de tu héroe, redondeada hacia arriba. Lo que encuentras depende de dónde está tu héroe: {F.potions.drops.map((d) => `${floor(d.floor)} da ${d.rest.length === 0 ? 'solo' : 'sobre todo'} ${name(`${d.top.toLowerCase()}s`)}${d.rest.length === 0 ? '' : `, con algunas ${d.rest.map((r) => name(`${r.toLowerCase()}s`)).join(' y ')}`}`).join('; ')}. Un héroe nuevo empieza con pociones curativas, y el mercader y las decisiones de oficina también reparten pociones curativas. Todas las potencias comparten una bolsita y nunca ocupan sitio en la bolsa.</p>
          <p>Tu héroe bebe automáticamente cuando sus PS bajan del umbral de poción de su postura mientras explora: la poción más débil que lo devuelve por encima de ese umbral, o la más fuerte que tenga si ninguna más débil basta. El diario dice qué bebió. Sin pociones, tu héroe descansa por debajo del umbral de descanso y vuelve a salir cuando se recupera. También puedes beber una tú desde la página Héroe cuando tu héroe explora, descansa o viaja sin tener la salud al máximo; con más de una potencia en la bolsita, la página Héroe te pregunta cuál.</p>
          <p><strong>Combinar.</strong> En la página Bolsa, {F.potions.combine.count} {name(`${F.potions.combine.from.toLowerCase()}s`)} y {F.potions.combine.materials.map((m) => `${m.n} de ${name(m.name).toLowerCase()}`).join(', ')} se convierten en una {name(F.potions.combine.to.toLowerCase())}. Combinar nunca te deja con más pociones que antes, así que la bolsita no puede desbordarse. Solo pasa cuando tú lo eliges.</p>
        </>}
      <p>Las pociones van en una bolsita. Un héroe nuevo lleva {t.nameWith(F.firstPouch.name, 'un')} donde caben {F.firstPouch.size}. Las bolsitas más grandes se compran con oro en la página Bolsa, de una en una: {rungs(F.shopPouches)}. Cuando la bolsita está llena, una poción encontrada se convierte en oro.</p>
      <h2 id="the-wandering-merchant">El mercader ambulante</h2>
      <p>De vez en cuando tu héroe se encuentra con un mercader ambulante mientras explora. Tu pantalla dice «Hay un mercader de paso. Compra pronto en la app.» y la página Bolsa muestra hasta tres ofertas: unas pociones y la siguiente bolsita o bolsa{F.merchantOff > 0 ? ` con un ${F.merchantOff} % de descuento sobre el precio de la página Bolsa` : ''}. Cada oferta se vende una vez. El mercader se va tras cuatro aventuras o después de tu última compra.</p>
      <h2 id="decisions">Decisiones</h2>
      <p>A veces la oficina le pregunta algo pequeño a tu héroe, como poner dinero para una tarta o quedarse hasta tarde. Tu pantalla dice «Te espera una decisión en la app.» y la página Héroe muestra las dos opciones con lo que cambia exactamente cada una. Si no respondes en más o menos un día, se elige por ti la opción marcada por defecto.</p>
      <h2 id="effects">Efectos</h2>
      <p>Algunos momentos le dejan a tu héroe un efecto corto, listado en la página Héroe con las aventuras que le quedan. Vencer a un élite le da {t.text('Fired up')} (+10 % de ataque durante ocho aventuras). Poner dinero para la tarta le da {t.text('Well fed')} (+10 % de XP durante ocho aventuras). Una trampa le deja {t.text('Bruised')} (−15 % de defensa durante cuatro aventuras). Tu héroe tiene como mucho tres efectos. Cualquier descanso quita los malos, y un K.O. los borra todos.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Élites atrincherados</h2>
          <p>Desde el nivel {F.standoff.minLevel}, en {floor(F.standoff.floor)} y las plantas más profundas, un élite a veces se atrinchera en lugar de caer en un combate. Tu TRMNL lo muestra con su barra de salud, y tu héroe vuelve a por él en cada aventura hasta que cae.</p>
          <ul>
            <li>En cada aventura tu héroe lo combate hasta seis asaltos, y su salud se mantiene. Pega mucho más fuerte que un élite normal, y tu héroe sigue luchando por debajo de la línea de descanso de su postura antes de retirarse, así que puede acabar en K.O. Retirarse no cuesta oro.</li>
            <li>Cuando cae, da {F.standoff.xp} veces la XP del monstruo y {F.standoff.gold} veces su oro, más un hallazgo raro o épico de esa planta.</li>
            <li>Se va tras {F.standoff.hours} horas, o antes si tu héroe cae K.O. o viaja. La pausa no para el reloj.</li>
            <li>La página Héroe muestra su salud y cuándo se va. Desde ahí puedes dejarlo, y al viajar se te pregunta antes de dejarlo atrás.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Calendario de la oficina</h2>
          <p>Las fiestas y las fechas de oficina decoran la escena de tu héroe ese día: adornos en el techo, algo en el suelo, a veces un sombrero, y en {floor(F.floors[0]?.name ?? '')} otra vista por la ventana. Siguen la fecha local de tu TRMNL. La primera vez que tu héroe ve una, el diario la nombra, y la mayoría trae una pequeña bonificación mientras dura. La página Héroe muestra la fecha de hoy y la siguiente.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{t.text(rule.name)}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'todas las incursiones de escritorio salen mal (ver abajo).' : rule.effectLabel ? `${t.text(rule.effectLabel)}.` : 'solo decoración.'}</li>)}
          </ul>
          <p><strong>Viernes 13.</strong> Las incursiones de escritorio empiezan el doble de a menudo, y todas salen mal: nadie gana, y los dos héroes pierden el 20 % de sus PS máximos y el 5 % de su oro, que no se queda nadie. El registro de incursiones de tu héroe lo cuenta como percance.</p>
          <p><strong>Navidad.</strong> Tu héroe encuentra un regalo envuelto cada Navidad: una pieza de equipo de la planta en la que está, en su primera aventura de esos tres días.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Equipo raro y épico</h2>
      <p>El equipo puede ser común, poco común, raro o épico. El épico es el más raro, más o menos un hallazgo de cada cien, y el más fuerte. El equipo raro y épico lleva además un rasgo especial, que aparece en el nombre del objeto y se explica en la página Bolsa:</p>
      <ul>
        <li><strong>{t.text('Vampiric')}</strong> cura el 5 % de los PS máximos tras cada victoria.</li>
        <li><strong>{t.text('Lucky')}</strong> suma un 20 % de oro en victorias y hallazgos.</li>
        <li><strong>{t.text('Sturdy')}</strong> recibe un 40 % menos de daño de las trampas.</li>
        <li><strong>{t.text('Thrifty')}</strong> pierde 5 puntos menos de oro cuando algo sale mal: una retirada no pierde oro en lugar del 5 %, y un K.O. pierde el 5 % en lugar del 10 %.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">Cuando la bolsa se llena</h2>
      <p>Un héroe nuevo empieza con una pequeña bolsa de papel donde caben 6 piezas de equipo. El equipo puesto y las pociones no ocupan sitio. Cuando la bolsa está llena, tu héroe te guarda la siguiente pieza que encuentra y sigue de aventura. Mientras esa pieza espera, los hallazgos siguientes se quedan atrás hasta que hagas sitio.</p>
      <h2 id="bigger-bags">Bolsas más grandes</h2>
      <p>Tu bolsa crece con oro. {F.tote ? `Tu héroe encuentra ${t.nameWith(F.tote.name, 'un')} (${F.tote.size}) en las primeras dos horas más o menos. ` : ''}Después, las bolsas más grandes se compran en la página Bolsa, de una en una: {rungs(F.shopBags)}, hasta {F.topBag} huecos. No hay requisitos de nivel, y las bolsas nunca salen como botín.</p>
      <ol className="[&_li]:list-decimal">
        <li>Abre Bolsa en la app. Equipa las mejoras y vende el equipo que sobra para liberar sitio.</li>
        <li>Si hay un hallazgo guardado, elige Recoger el hallazgo. Deja al menos un hueco libre después de recogerlo para que las aventuras puedan seguir.</li>
        <li>Cuando hay un hueco libre y nada esperando, las aventuras se reanudan solas en menos de 15 minutos. Antes de eso aún puedes elegir otra zona desbloqueada desde la página de la bolsa.</li>
      </ol>
      <p>Equiparse algo no libera un hueco. Vender o desmontar equipo, o comprar una bolsa más grande, sí, y el hallazgo guardado entra en la bolsa al momento. La página Bolsa también puede vender tu repuesto más flojo y quedarse el hallazgo con un toque. El modo reposo de tu TRMNL tampoco detiene nunca el juego.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Desmontar y el banco de trabajo</h2>
        <p>{F.workbench.level !== undefined ? `Desde el nivel ${F.workbench.level}, el` : 'El'} equipo que sobra tiene dos salidas de la bolsa: venderlo por oro, o desmontarlo en materiales en la página Bolsa. Desmontar paga según el nivel en que se encontró la pieza, en unidades del material de su rareza: {F.workbench.materials.map((m) => `${name(m.name).toLowerCase()} del equipo ${m.rarities.map((r) => rarityEs[r] ?? r).join(' y ')}`).join(', ')}. El equipo épico da {F.workbench.epicMultiplier} veces más. Los materiales no ocupan sitio en la bolsa y nunca se venden. El equipo solo se desmonta cuando tú lo eliges.{F.workbench.level !== undefined ? ` Antes del nivel ${F.workbench.level}, vende lo que te sobre: la primera mejora pide el nivel ${F.workbench.level} de todos modos.` : ''}</p>
        <p>El banco de trabajo gasta materiales y oro en el equipo que lleva tu héroe, sin quitárselo: la pieza conserva su nombre y su rasgo, y solo cambian sus números. Cada pieza tiene un único paso siguiente. {F.workbench.tiers.map((s, i) => `${i === 0 ? 'Subir una pieza de nivel 1 a Mk II' : 'Pasar de Mk II a Mk III'} cuesta ${price(s)}`).join('; ')}; una pieza solo puede subir a un nivel que tu héroe podría equiparse. Cuando una pieza es Mk III (o se encontró así), el refuerzo suma un punto por paso: {F.workbench.reinforce.map((s) => `+${s.to} por ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `Tras +${F.workbench.reinforce.at(-1)!.to} la pieza está terminada.` : ''} Al equipo raro y épico también se le puede colocar el rasgo que elijas por {price(F.workbench.affix)}, en lugar del que tiene.</p>
        <p>Las mejoras siempre salen bien. Desmontar una pieza mejorada no devuelve lo que gastaste en ella, así que mejora solo el equipo que piensas seguir llevando.</p>
      </> : null}
      <h2 id="getting-knocked-out">Caer K.O.</h2>
      <p>Tu héroe se recupera solo tras unas dos horas y vuelve {t.nameWith(F.floors[0]?.name ?? '', 'al')}. Conservas tu XP y tu equipo, pero pierdes el 10 % del oro que llevas.</p>
      <h2 id="recaps">Resúmenes</h2>
      <p>Tu pantalla lleva un resumen corto de la última noche o el último día terminados, en la hora local de tu TRMNL. A las 07:00 el resumen de la noche cuenta de 19:00 a 07:00 y se queda todo el día. A las 19:00 el resumen del día cuenta de 07:00 a 19:00 y se queda toda la tarde y la noche. La ventana de la oficina muestra el día y la noche con el mismo horario. Las historias de encima son siempre las más recientes.</p>
      <h2 id="understanding-rankings">Cómo funcionan las clasificaciones</h2>
      <p>La pantalla muestra el Top 5 de XP de esta semana de tu grupo de nivel, con tu fila marcada, o añadida bajo la lista si vas más abajo. La app ofrece además la tabla de hoy y una tabla total. El día empieza a las 00:00 UTC y la semana el lunes a las 00:00 UTC, como los recuerdos. Las clasificaciones se publican cada hora, así que una aventura o una subida de nivel recientes pueden aparecer antes de que se actualice tu puesto.</p>
      <p>Los héroes en pausa o parados conservan su progreso. Uno sin XP esta semana sale de la tabla semanal hasta que vuelva a ganarla. El progreso total queda registrado.</p>
      <h2 id="sharing-your-hero">Compartir tu héroe</h2>
      <p>Tu héroe tiene una página pública con su nivel, puesto, planta actual, totales y logros. El oro y el diario de aventuras nunca se muestran, y el equipo solo cuando es un repuesto de otro jugador que tu héroe guarda. Tu nombre enlaza a la página desde las clasificaciones y desde las incursiones y reuniones de otros jugadores, y ahí es donde otros jugadores te siguen. Ajustes tiene los botones Compartir y Copiar enlace, y un enlace compartido muestra una tarjeta con la imagen de tu héroe, su nombre, nivel y puesto. Para ocultarla, elige Ocultar mi página de héroe en Ajustes. Se oculta al momento, y mientras está oculta nadie puede seguirte.</p>
      <h2 id="following">Seguir</h2>
      <p>Con la sesión iniciada, puedes seguir a otro jugador desde su página pública de héroe, hasta 20 jugadores. Todos los que sigues aparecen en Clasificaciones, con el nivel de su héroe, su puesto y dónde está, y enlaces a sus páginas. Seguir no cambia nada en el juego, y a nadie se le avisa de que lo sigues. Las incursiones eligen sus objetivos al azar entre todos, así que seguir a alguien nunca manda a tu héroe a por él. Si un jugador oculta su página, solo ves su nombre hasta que vuelva a mostrarla. Si cambia su nombre público, sale de tu lista.</p>
      <h2 id="names">Nombres</h2>
      <p>Tienes dos nombres. El nombre de tu héroe aparece en tu TRMNL, las clasificaciones y tu página de héroe; para cambiarlo, compra una etiqueta «Hola, me llamo» en la pestaña Más por 200 de oro. Hay una a la venta cada día. Tu nombre público eres tú, en todos los juegos de TRMNL: aparece junto a tu héroe en las clasificaciones, en las incursiones y reuniones de otros jugadores, y en el enlace de tu página. Puedes cambiarlo gratis una vez cada 7 días desde Cuenta. Los enlaces a tu página antigua dejan de funcionar, y nadie más puede quedarse tu nombre antiguo durante 7 días.</p>
      <h2 id="gender">Género</h2>
      <p>Eliges el género de tu héroe, hombre o mujer, al crearlo. Solo cambia su aspecto en tu TRMNL, en tu página de héroe y en las reuniones de otros jugadores. Los dos juegan igual. Para cambiarlo más tarde, compra un cambio de imagen en la pestaña Más por 200 de oro, cuando quieras.</p>
      <h2 id="alerts">Alertas</h2>
      <p>Tu TRMNL es la forma principal de seguir a tu héroe, pero Ajustes también puede enviarte una notificación al móvil en dos casos, cada uno desactivado hasta que lo actives:</p>
      <ul>
        <li><strong>Bolsa llena:</strong> la bolsa está llena y tu héroe te guarda un hallazgo. Llega media hora después de que se llene la bolsa, así que no llega nada si ya la estás ordenando, y una vez cada vez que se llena.</li>
        <li><strong>Oferta del mercader:</strong> un mercader vende la siguiente bolsa o bolsita{F.merchantOff > 0 ? ` con un ${F.merchantOff} % de descuento` : ''} y tu héroe tiene el oro. Como mucho una vez al día. Un mercader que solo trae pociones nunca envía una.</li>
      </ul>
      <p>Recibes como mucho dos alertas al día. Las horas de silencio van de 21:00 a 08:00 salvo que las cambies: una alerta de bolsa llena espera a que terminen, y una oferta del mercader que aparezca entonces se omite. Antes de enviar, el juego comprueba que la alerta sigue siendo cierta, así que nunca te avisa de una bolsa que ya ordenaste ni de una oferta que ya se fue. Las decisiones, incursiones, K.O., subidas de nivel y recuerdos nunca envían alertas.</p>
      <p>Elige Permitir en este dispositivo en Ajustes y acepta el aviso del navegador. En iPhone y iPad, primero añade TRMNL Games a tu pantalla de inicio (Compartir y luego Añadir a pantalla de inicio) y ábrelo desde ahí. Cada dispositivo que permites aparece en Ajustes con un botón Quitar; quitar el último desactiva las alertas.</p>
      <h2 id="troubleshooting">Solución de problemas</h2>
      <h3 id="not-on-your-screen">Tu héroe no aparece en la pantalla</h3>
      <ul>
        <li>Pulsar Guardar añade Desk Crawler a tu lista de reproducción de TRMNL. Tu dispositivo muestra la lista plugin a plugin, a su frecuencia de actualización, así que Desk Crawler aparece cuando le toca. Con varios plugins y una actualización lenta puede tardar un rato.</li>
        <li>Abre la lista de reproducción en TRMNL y comprueba que Desk Crawler está ahí, en el dispositivo que miras si tienes más de uno, y que ningún horario lo oculta a esta hora del día.</li>
        <li>El modo reposo detiene la actualización de la pantalla por la noche. Tu héroe sigue de aventura, y la pantalla se pone al día cuando el dispositivo despierta.</li>
        <li>Una pantalla que dice «La primera aventura empieza en menos de 15 minutos» funciona. La primera historia llega en el siguiente cuarto de hora.</li>
        <li>La página Héroe de la app siempre muestra lo que hace tu héroe, muestre lo que muestre la pantalla.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">La pantalla parece antigua</h3>
      <ul>
        <li>«Las actualizaciones van con retraso» significa que el servicio del juego va tarde. El progreso de tu héroe se conserva, y la pantalla se pone al día cuando el servicio lo hace.</li>
        <li>Si la web de la app está al día pero la pantalla no, revisa en TRMNL la frecuencia de actualización del plugin y su posición en la lista de reproducción.</li>
        <li>Las aventuras se ejecutan cada cuarto de hora, en punto y a las y 15, y 30 y menos 15 en la zona horaria de tu TRMNL. La pantalla no muestra cuenta atrás; la hora junto a cada historia es cuándo pasó, y la app muestra la próxima aventura.</li>
        <li>Si desconectaste o desinstalaste, vuelve a instalar desde TRMNL. Tu héroe conserva todo su progreso.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Desconectar y quitar</h2>
      <p>
        Desconectar detiene las pantallas nuevas de esa instalación. TRMNL puede seguir mostrando la última imagen hasta que quites el plugin de tu lista de reproducción; no
        podemos borrar una imagen que ya está en tu dispositivo.
      </p>
      <h2 id="help">Ayuda</h2>
      <p>
        Escribe a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> si necesitas ayuda con la cuenta o la conexión. Intentamos responder en dos días laborables.
      </p>
    </>
  ),
}
