import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'

const w = anglerWords('pt')
const n = (value: number) => w.number(value)
const e = (parts: readonly string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)}`)

export const pt: HelpPage = {
  seoTitle: 'Ajuda do Idle Angler',
  description: 'Como o Idle Angler pesca no seu TRMNL: iscas, cooler, varas, águas, estações, caderno, Opens de fim de semana e caixa de moscas.',
  title: 'Idle Angler no TRMNL',
  contents: {
    'getting-started': 'Primeiros passos',
    goals: 'Metas e o que abre quando',
    'how-fishing-works': 'Como a pesca funciona',
    'time-and-weather': 'Horário, tempo e estações',
    bait: 'Isca e peixe morto',
    'the-fishmonger': 'O peixeiro',
    'the-cooler': 'O cooler',
    'rods-and-fish-that-get-away': 'Varas e peixes que escapam',
    waters: 'Águas',
    'the-logbook': 'O caderno e os títulos',
    rankings: 'Rankings e Opens de fim de semana',
    'the-trophy-wall': 'A parede de troféus',
    'the-fly-box': 'A caixa de moscas',
    achievements: 'Conquistas',
    alerts: 'Alertas',
    'pausing-and-removing': 'Pausar e remover',
    help: 'Ajuda',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Primeiros passos</h2>
      <ul>
        <li>Instale o Idle Angler pelo marketplace de plugins do TRMNL e escolha Instalar.</li>
        <li>Entre no TRMNL Games e conecte a instalação. Seu pescador usa o seu nome público.</li>
        <li>De volta ao TRMNL, clique em Salvar. Em até quinze minutos seu pescador lança pela primeira vez e pega um peixe.</li>
        <li>Adicione o plugin a uma playlist ou a um mashup. Os quatro tamanhos de layout funcionam nas duas orientações.</li>
      </ul>
      <h2 id="goals">Metas e o que abre quando</h2>
      <p>O Píer sempre mostra uma meta, como “{w.goal('first_sale')}” ou “{w.goal('dawn_dusk')}”. Cumprir a meta separa algumas moedas: toque em Resgatar no Píer para pegá-las, e a próxima meta aparece. Um ponto na aba Píer avisa que tem uma esperando. As metas nunca expiram, e seu pescador cumpre mais ou menos metade delas sem você.</p>
      <p>O jogo vai abrindo conforme o caderno enche: varas e caixas térmicas melhores com {F.unlocks.shop_upgrades} espécies, pedidos do peixeiro com {F.unlocks.orders}, os Opens de fim de semana com {F.unlocks.opens}, a parede de troféus com {F.unlocks.trophies} e o peixe morto com {F.unlocks.deadbait}. O Píer diz o que vem a seguir.</p>
      <h2 id="how-fishing-works">Como a pesca funciona</h2>
      <p>A cada quinze minutos, dia e noite, seu pescador lança uma vez. Às vezes um peixe morde. Qual peixe depende da água, da isca, do horário e do tempo. O peso decide o preço, se é um recorde pessoal e onde ele entra nos rankings. Seu TRMNL mostra a cena, as últimas histórias e o ranking da semana da sua água. Abra o app para vender sua captura, comprar isca ou mudar de água.</p>
      <h2 id="time-and-weather">Horário, tempo e estações</h2>
      <p>O amanhecer vai das 05:00 às 08:00, o dia até as 17:00, o entardecer até as 20:00, e depois é noite, no fuso horário que o seu TRMNL informa. Os peixes mordem mais ao amanhecer e ao entardecer. O tempo é o mesmo para todos os pescadores de uma água e muda a cada seis horas: céu limpo, nublado, chuva, vento ou neblina. Tempo nublado e chuva trazem mais mordidas {w.waterName('river_bend').at}, vento traz menos, e a neblina deixa o amanhecer e o entardecer escuros o bastante para os peixes noturnos.</p>
      <p>As águas têm suas estações, iguais para todos: primavera, verão, outono e inverno, uma semana cada, mudando toda segunda-feira às 00:00 UTC. Alguns peixes só mordem numa estação, a água doce fica mais lenta no inverno, e a cena mostra flores, folhas ou neve. Cada estação tem uma piracema, de segunda a quinta, quando uma espécie chega: {e(F.runs.map((id) => w.species(id).toLowerCase()))}.</p>
      <h2 id="bait">Isca e peixe morto</h2>
      <p>Cada água tem suas iscas, e a isca decide quais peixes podem morder; a Loja diz quais peixes pegam cada uma. Escolha a isca na página do Píer. Cada peixe que você guarda, ou que escapa, gasta uma isca. Um lançamento sem mordida não gasta nenhuma, nem um peixe solto porque o cooler está cheio. Sem isca para a água, o pescador pesca com o anzol vazio, que dá menos mordidas e só peixes pequenos. Compre isca em potes na Loja, até {F.baitCap} de cada; isca nunca estraga.</p>
      <p>Peixes pequenos, como rutilo, leucisco, alburno e cavala, podem voltar ao anzol como peixe morto a partir do cooler: um peixe rende {F.deadbaitPerFish} iscas, até {F.deadbaitCap} guardadas. Só predadores pegam peixe morto, como perca, lúcio, lucioperca, enguia e os grandes peixes do mar, e com ele vêm mais pesados.</p>
      <h2 id="the-fishmonger">O peixeiro</h2>
      <p>O peixeiro anota {F.orderSlots} pedidos, como “{w.text('Two Roach')}” ou “{w.text('One fish over 1.5 kg')}”. Quando os peixes do seu cooler servem para um pedido, o peixeiro aparece na página do Cooler com esses peixes e um botão Vender: ele paga 1,5 vez o preço de mercado mais um bônus, e a página mostra os dois preços. Os pedidos nunca expiram, e um espaço vazio é preenchido às 07:00 do seu horário. Seu pescador não escolhe o que pega, então o peixeiro só aparece quando há algo para vender para ele.</p>
      <h2 id="the-cooler">O cooler</h2>
      <p>Os peixes ficam no cooler até você vendê-los. Quando ele enche, o pescador continua pescando e solta o que pega. Os peixes soltos ainda entram no caderno, contam para conquistas e podem liderar os rankings, mas não rendem moedas. Seu TRMNL avisa quando o cooler está cheio, e o QR code dele abre o cooler. Um cooler maior significa menos peixes soltos entre uma visita e outra. O jogo nunca vende peixes por você.</p>
      <h2 id="rods-and-fish-that-get-away">Varas e peixes que escapam</h2>
      <p>Cada vara tira peixes até um certo peso. Um peixe mais pesado se solta, e a história diz que algo pesado foi embora. Uma vara melhor teria tirado o peixe. Varas melhores também dão algumas mordidas a mais.</p>
      <h2 id="waters">Águas</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong>: onde todo mundo começa. Rutilos, percas e bremas, carpas ao amanhecer e ao entardecer, enguias à noite.</li>
        <li><strong>{w.water('river_bend')}</strong>: abre quando {F.gates.river_bend} espécies {w.waterName('millpond').of} estão no caderno, com o {w.pass('waders').toLowerCase()}. Trutas, escalos e barbos, e lúcios e luciopercas na colherinha.</li>
        <li><strong>{w.water('harbour_pier')}</strong>: abre quando {F.gates.harbour_pier} espécies {w.waterName('river_bend').of} estão no caderno, com a {w.pass('pier_permit')}. Peixes de mar, maiores e mais valiosos. A maioria pede a {w.rod('Carbon Rod')} ou melhor.</li>
        <li><strong>{w.water('heron_lake')}</strong>: abre quando {F.gates.heron_lake} espécies {w.waterName('river_bend').of} estão no caderno, com o {w.pass('rowing_boat').toLowerCase()}. Carpas grandes nas boilies e siluros nas noites de verão.</li>
        <li><strong>{w.water('deep_sea')}</strong>: abre quando {F.gates.deep_sea} espécies {w.waterName('harbour_pier').of} estão no caderno. Um bilhete da Loja compra {F.charter.casts} lançamentos no mar por {n(F.charter.price)} moedas; o barco traz você de volta ao píer quando acabam, e os lançamentos não usados ficam no bilhete. Os maiores peixes pedem a {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong>: abre quando {F.gates.frozen_tarn} espécies {w.waterName('heron_lake').of} estão no caderno, com o {w.pass('ice_auger').toLowerCase()}, e só na semana de inverno. Quando o gelo derrete, o pescador volta a pé {w.waterName('heron_lake').to}.</li>
      </ul>
      <p>Mudar de água custa um lançamento, e depois o pescador pesca na água nova. Se a isca que você usa não serve lá, o pescador troca para a isca que serve e da qual você tem mais. Você pode voltar quando quiser.</p>
      <h2 id="the-logbook">O caderno e os títulos</h2>
      <p>Cada espécie que você pega entra no caderno com a quantidade e o seu melhor peso, e o caderno diz qual isca, horário e tempo ela prefere. Peixes ainda não pegos aparecem como silhuetas com a isca deles, menos os épicos. Peixes épicos pedem a isca, a hora e o tempo certos juntos, e alguns só mordem numa estação.</p>
      <p>O caderno é como você avança. Espécies novas abrem a próxima água e as funções acima, e dão o seu título: {F.titles.map((t) => `${w.title(t.id)} com ${t.species} espécies`).join(', ')}. Todo mundo começa como {w.title(F.firstTitle)}. O Idle Angler não tem XP nem níveis.</p>
      <h2 id="rankings">Rankings e Opens de fim de semana</h2>
      <p>Cada água tem seu ranking: o peixe mais pesado que cada pescador pegou ali, guardado ou solto. Um ranking vale pela semana e recomeça toda segunda-feira às 00:00 UTC; o outro guarda os recordes de todos os tempos. Seu TRMNL mostra o ranking da semana da água onde você pesca, e o app mostra todos.</p>
      <p>Todo fim de semana, do sábado às 00:00 ao domingo às 23:59 UTC, cada água faz um Open para uma espécie, indicada na página de Rankings. Pegue esse peixe ali para se inscrever; o mais pesado conta. Na segunda-feira, os três primeiros de cada água ganham uma medalha e {e(F.prizes.map(n))} moedas, e todo mundo que participou ganha uma roseta.</p>
      <h2 id="the-trophy-wall">A parede de troféus</h2>
      <p>Um peixe com pelo menos {F.trophies.minPercent}% do peso máximo da espécie pode ser empalhado a partir do cooler em vez de vendido. Empalhar custa o valor do peixe mais {F.trophies.fee} moedas. A parede começa com {F.trophies.firstPegs} ganchos e comporta até {F.trophies.maxPegs}; mais ganchos ficam na página da parede. Medalhas e rosetas ficam na prateleira, e sua página pública mostra a parede quando é pública.</p>
      <h2 id="the-fly-box">A caixa de moscas</h2>
      <p>Toda semana seu TRMNL mostra um código de mosca de seis dígitos ao lado do QR code e na barra de título. Escaneie o QR code, ou digite o código na página do Diário, para pôr a mosca da semana na sua caixa. Seu pescador usa a mais nova no chapéu. Uma mosca por semana: um código novo chega toda segunda-feira às 00:00 UTC, e o da semana anterior continua valendo até a segunda seguinte, caso sua tela tenha atualizado tarde. Depois das {F.flies} moscas, os modelos voltam. As moscas não mudam nada na pesca.</p>
      <h2 id="achievements">Conquistas</h2>
      <p>As conquistas têm níveis, para pesca, caderno, equipamento e águas, comércio e cada espécie. A página de Conquistas, em Mais, mostra seus níveis, a parcela de pescadores que tem cada um e quanto falta para o próximo. Seu perfil público mostra as conquistas quando o Idle Angler está nele.</p>
      <h2 id="alerts">Alertas</h2>
      <p>Ative os alertas em Configurações, na página Mais, para receber uma notificação nesse celular quando o cooler encher ou o pescador ficar sem isca. Eles ficam desligados até você ativar, e você recebe no máximo dois por dia somando todos os seus jogos.</p>
      <h2 id="pausing-and-removing">Pausar e remover</h2>
      <p>Pause a pesca em Configurações, na página Mais: nada é pego até você retomar, e você mantém tudo. Remover o plugin do TRMNL mantém seu pescador. Excluir o progresso do Idle Angler em Configurações remove seu pescador, cooler e caderno, sem mexer na sua conta nem nos outros jogos.</p>
      <h2 id="help">Ajuda</h2>
      <p>Escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> contando o que sua tela mostra e quando você a viu mudar pela última vez.</p>
    </>
  ),
}
