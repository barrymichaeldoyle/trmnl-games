import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'

const w = anglerWords('es')
const n = (value: number) => w.number(value)
const y = (parts: readonly string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`)

export const es: HelpPage = {
  seoTitle: 'Ayuda de Idle Angler',
  description: 'Cómo pesca Idle Angler en tu TRMNL: cebos, nevera, cañas, aguas, estaciones, cuaderno, Opens del fin de semana y caja de moscas.',
  title: 'Idle Angler en TRMNL',
  contents: {
    'getting-started': 'Para empezar',
    goals: 'Objetivos y qué se abre cuándo',
    'how-fishing-works': 'Cómo funciona la pesca',
    'time-and-weather': 'Horas, tiempo y estaciones',
    bait: 'Cebo y pez muerto',
    'the-fishmonger': 'El pescadero',
    'the-cooler': 'La nevera',
    'rods-and-fish-that-get-away': 'Cañas y peces que se escapan',
    waters: 'Aguas',
    'the-logbook': 'El cuaderno y los títulos',
    rankings: 'Clasificaciones y Opens del fin de semana',
    'the-trophy-wall': 'La pared de trofeos',
    'the-fly-box': 'La caja de moscas',
    achievements: 'Logros',
    alerts: 'Alertas',
    'pausing-and-removing': 'Pausar y quitar',
    help: 'Ayuda',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Para empezar</h2>
      <ul>
        <li>Instala Idle Angler desde el marketplace de plugins de TRMNL y elige Instalar.</li>
        <li>Inicia sesión en TRMNL Games y conecta la instalación. Tu pescador lleva tu nombre público.</li>
        <li>De vuelta en TRMNL, pulsa Guardar. En menos de quince minutos tu pescador lanza por primera vez y saca un pez.</li>
        <li>Añade el plugin a una playlist o a un mashup. Funcionan los cuatro tamaños de diseño en ambas orientaciones.</li>
      </ul>
      <h2 id="goals">Objetivos y qué se abre cuándo</h2>
      <p>El Muelle siempre muestra un objetivo, como «{w.goal('first_sale')}» o «{w.goal('dawn_dusk')}». Al cumplirlo se apartan unas monedas: pulsa Cobrar en el Muelle para recogerlas y aparecerá el siguiente objetivo. Un punto en la pestaña Muelle te avisa de que hay una esperando. Los objetivos nunca caducan, y tu pescador cumple más o menos la mitad sin ti.</p>
      <p>El juego se abre a medida que se llena tu cuaderno: mejores cañas y neveras con {F.unlocks.shop_upgrades} especies, pedidos del pescadero con {F.unlocks.orders}, los Opens del fin de semana con {F.unlocks.opens}, la pared de trofeos con {F.unlocks.trophies} y el pez muerto con {F.unlocks.deadbait}. El Muelle dice qué llega después.</p>
      <h2 id="how-fishing-works">Cómo funciona la pesca</h2>
      <p>Cada quince minutos, de día y de noche, tu pescador lanza una vez. A veces pica un pez. Cuál depende del agua, del cebo, de la hora y del tiempo. Su peso decide su precio, si es un récord personal y dónde queda en las clasificaciones. Tu TRMNL muestra la escena, las últimas historias y la clasificación semanal de tu agua. Abre la app para vender tus capturas, comprar cebo o cambiar de agua.</p>
      <h2 id="time-and-weather">Horas, tiempo y estaciones</h2>
      <p>El amanecer va de 05:00 a 08:00, el día hasta las 17:00, el anochecer hasta las 20:00 y luego es de noche, en la zona horaria que indica tu TRMNL. Los peces pican más al amanecer y al anochecer. El tiempo es el mismo para todos los pescadores de un agua y cambia cada seis horas: despejado, nublado, lluvia, viento o niebla. El cielo nublado y la lluvia traen más picadas {w.waterName('river_bend').at}, el viento menos, y la niebla oscurece el amanecer y el anochecer lo bastante para los peces nocturnos.</p>
      <p>Las aguas tienen sus estaciones, iguales para todos: primavera, verano, otoño e invierno, una semana cada una, con cambio cada lunes a las 00:00 UTC. Algunos peces solo pican en una estación, el agua dulce va más lenta en invierno y la escena muestra flores, hojas o nieve. Cada estación tiene un remonte, de lunes a jueves, cuando llega una especie: {y(F.runs.map((id) => w.species(id).toLowerCase()))}.</p>
      <h2 id="bait">Cebo y pez muerto</h2>
      <p>Cada agua tiene sus cebos, y el cebo decide qué peces pueden picar; la Tienda dice qué peces toman cada uno. Elige el cebo en la página del Muelle. Cada pez que te quedas, o que se escapa, gasta un cebo. Un lance sin picada no gasta ninguno, ni tampoco un pez devuelto por tener la nevera llena. Sin cebo para el agua, el pescador pesca con el anzuelo vacío, que da menos picadas y solo peces pequeños. Compra cebo en botes en la Tienda, hasta {F.baitCap} de cada uno; el cebo nunca se estropea.</p>
      <p>Los peces pequeños, como el rutilo, el leucisco, el alburno y la caballa, pueden volver al anzuelo como pez muerto desde la nevera: un pez da {F.deadbaitPerFish} cebos, hasta {F.deadbaitCap} guardados. Solo los depredadores toman pez muerto, como la perca, el lucio, la lucioperca, la anguila y los grandes peces de mar, y con él salen más pesados.</p>
      <h2 id="the-fishmonger">El pescadero</h2>
      <p>El pescadero cuelga {F.orderSlots} pedidos, como «{w.text('Two Roach')}» o «{w.text('One fish over 1.5 kg')}». Cuando los peces de tu nevera encajan con un pedido, el pescadero aparece en la página de la Nevera con esos peces y un botón Vender: paga 1,5 veces su precio de mercado más un extra, y la página muestra los dos precios. Los pedidos nunca caducan, y un hueco vacío se llena a las 07:00 de tu hora. Tu pescador no elige sus capturas, así que el pescadero solo aparece cuando hay algo que venderle.</p>
      <h2 id="the-cooler">La nevera</h2>
      <p>Los peces van a la nevera hasta que los vendes. Cuando está llena, el pescador sigue pescando y devuelve lo que saca. Los peces devueltos van igualmente al cuaderno, cuentan para los logros y pueden encabezar las clasificaciones, pero no dan monedas. Tu TRMNL avisa cuando la nevera está llena, y su código QR abre la nevera. Una nevera más grande significa menos peces devueltos entre visitas. El juego nunca vende peces por ti.</p>
      <h2 id="rods-and-fish-that-get-away">Cañas y peces que se escapan</h2>
      <p>Cada caña saca peces hasta un peso. Un pez más pesado se suelta, y la historia dice que algo pesado se fue. Una caña mejor lo habría sacado. Las cañas mejores también dan alguna picada más.</p>
      <h2 id="waters">Aguas</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong>: donde empieza todo el mundo. Rutilos, percas y bremas, carpas al amanecer y al anochecer, anguilas de noche.</li>
        <li><strong>{w.water('river_bend')}</strong>: se abre cuando tienes {F.gates.river_bend} especies {w.waterName('millpond').of} en el cuaderno, con los {w.pass('waders').toLowerCase()}. Truchas, cachos y barbos, y lucios y luciopercas con cucharilla.</li>
        <li><strong>{w.water('harbour_pier')}</strong>: se abre cuando tienes {F.gates.harbour_pier} especies {w.waterName('river_bend').of} en el cuaderno, con el {w.pass('pier_permit')}. Peces de mar, más grandes y más valiosos. La mayoría piden la {w.rod('Carbon Rod')} o mejor.</li>
        <li><strong>{w.water('heron_lake')}</strong>: se abre cuando tienes {F.gates.heron_lake} especies {w.waterName('river_bend').of} en el cuaderno, con la {w.pass('rowing_boat').toLowerCase()}. Carpas grandes con boilies y siluros en las noches de verano.</li>
        <li><strong>{w.water('deep_sea')}</strong>: se abre cuando tienes {F.gates.deep_sea} especies {w.waterName('harbour_pier').of} en el cuaderno. Un billete de la Tienda da {F.charter.casts} lances en el mar por {n(F.charter.price)} monedas; el barco te devuelve al espigón cuando se acaban, y los lances que no uses se quedan en el billete. Los peces más grandes piden la {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong>: se abre cuando tienes {F.gates.frozen_tarn} especies {w.waterName('heron_lake').of} en el cuaderno, con la {w.pass('ice_auger').toLowerCase()}, y solo en la semana de invierno. Cuando se va el hielo, el pescador vuelve andando {w.waterName('heron_lake').to}.</li>
      </ul>
      <p>Moverse cuesta un lance, y luego el pescador pesca en el agua nueva. Si el cebo que usas no sirve allí, el pescador cambia al cebo que sí sirve y del que tienes más. Puedes volver cuando quieras.</p>
      <h2 id="the-logbook">El cuaderno y los títulos</h2>
      <p>Cada especie que sacas se anota con su número y tu mejor peso, y el cuaderno dice qué cebo, horas y tiempo prefiere. Los peces que aún no has sacado aparecen como siluetas con su cebo, salvo los épicos. Los peces épicos piden el cebo, la hora y el tiempo justos a la vez, y algunos solo pican en una estación.</p>
      <p>El cuaderno es como avanzas. Las especies nuevas abren la siguiente agua y las funciones de arriba, y te dan tu título: {F.titles.map((t) => `${w.title(t.id)} con ${t.species} especies`).join(', ')}. Todo el mundo empieza como {w.title(F.firstTitle)}. Idle Angler no tiene XP ni niveles.</p>
      <h2 id="rankings">Clasificaciones y Opens del fin de semana</h2>
      <p>Cada agua tiene su clasificación: el pez más pesado que cada pescador ha sacado allí, guardado o devuelto. Una clasificación dura la semana y empieza de nuevo cada lunes a las 00:00 UTC; la otra guarda los récords de siempre. Tu TRMNL muestra la clasificación semanal del agua donde pescas, y la app las muestra todas.</p>
      <p>Cada fin de semana, del sábado a las 00:00 al domingo a las 23:59 UTC, cada agua celebra un Open para una especie, indicada en la página de Clasificaciones. Saca ese pez allí para inscribirte; cuenta el más pesado. El lunes, los tres primeros de cada agua reciben una medalla y {y(F.prizes.map(n))} monedas, y todo el que participó recibe una escarapela.</p>
      <h2 id="the-trophy-wall">La pared de trofeos</h2>
      <p>Un pez de al menos el {F.trophies.minPercent} % del peso máximo de su especie se puede disecar desde la nevera en vez de venderlo. Disecarlo cuesta el valor del pez más {F.trophies.fee} monedas. La pared empieza con {F.trophies.firstPegs} ganchos y admite hasta {F.trophies.maxPegs}; hay más ganchos en la página de la pared. Las medallas y escarapelas van en la estantería, y tu página pública muestra la pared cuando es pública.</p>
      <h2 id="the-fly-box">La caja de moscas</h2>
      <p>Cada semana tu TRMNL muestra un código de mosca de seis cifras junto a su código QR y en su barra de título. Escanea el código QR, o escribe el código en la página del Diario, para añadir la mosca de la semana a tu caja. Tu pescador lleva la más nueva en el sombrero. Una mosca por semana: cada lunes a las 00:00 UTC llega un código nuevo, y el de la semana anterior sigue valiendo hasta el lunes siguiente por si tu pantalla se actualizó tarde. Después de las {F.flies} moscas, los modelos vuelven a salir. Las moscas no cambian nada de la pesca.</p>
      <h2 id="achievements">Logros</h2>
      <p>Los logros tienen niveles, para la pesca, el cuaderno, tu equipo y las aguas, el comercio y cada especie. La página de Logros, en Más, muestra tus niveles, la parte de pescadores que tiene cada uno y cuánto te falta para el siguiente. Tu perfil público los muestra cuando Idle Angler está en él.</p>
      <h2 id="alerts">Alertas</h2>
      <p>Activa las alertas en Ajustes, en la página Más, para recibir una notificación en ese teléfono cuando tu nevera se llene o tu pescador se quede sin cebo. Están desactivadas hasta que las actives, y recibes como mucho dos al día entre todos tus juegos.</p>
      <h2 id="pausing-and-removing">Pausar y quitar</h2>
      <p>Pausa la pesca en Ajustes, en la página Más: no hay capturas hasta que reanudes, y lo conservas todo. Quitar el plugin de TRMNL conserva tu pescador. Borrar el progreso de Idle Angler en Ajustes elimina tu pescador, tu nevera y tu cuaderno, y no toca tu cuenta ni tus otros juegos.</p>
      <h2 id="help">Ayuda</h2>
      <p>Escribe a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> contando qué muestra tu pantalla y cuándo la viste cambiar por última vez.</p>
    </>
  ),
}
