import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'

const t = contentTranslator('pt')
const n = (value: number) => t.number(value)
const ouro = (value: number) => `${n(value)} de ouro`
const e = (parts: readonly string[], last = 'e') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
const name = (english: string) => t.name(english)
const floor = (english: string) => t.nameWith(english, 'o')
const rungs = (list: readonly { name: string; size: number; price: number }[]) => e(list.map((rung) => `${t.nameWith(rung.name, 'um')} (${rung.size}) por ${ouro(rung.price)}`))
const price = (c: Cost) => `${e(c.materials.map((m) => `${m.n} de ${name(m.name).toLowerCase()}`))} mais ${ouro(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `${signed(m.attackPct)}% de ataque` : '', m.defensePct ? `${signed(m.defensePct)}% de defesa` : '', m.xpPct ? `${signed(m.xpPct)}% de XP por vitória` : '', m.goldPct ? `${signed(m.goldPct)}% de ouro` : '', m.trapDamagePct ? `armadilhas causam ${m.trapDamagePct}% menos dano` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = e(F.floors.filter((b) => b.level > 1).map((b) => `${floor(b.name)} no nível ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` Chega no nível ${F.unlocks[feature]}.`)
const rarityPt: Record<string, string> = { common: 'comum', uncommon: 'incomum', rare: 'raro', epic: 'épico' }

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
// Weekdays other than domingo and sábado are feminine: "a primeira segunda-feira", "o primeiro domingo".
const NTH_M = ['primeiro', 'segundo', 'terceiro', 'quarto', 'quinto']
const NTH_F = ['primeira', 'segunda', 'terceira', 'quarta', 'quinta']
const masculine = (weekday: number) => weekday === 0 || weekday === 6
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, por ${rule.days} dias` : ''
  switch (date.kind) {
    case 'fixed':
      return `${date.day === 1 ? '1º' : date.day} de ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const m = masculine(date.weekday)
      const base = `${m ? 'o' : 'a'} ${(m ? NTH_M : NTH_F)[date.nth - 1]} ${WEEKDAYS[date.weekday]} de ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      const after = (date.weekday + offset) % 7
      return `${offset === 0 ? base : `${masculine(after) ? 'o' : 'a'} ${WEEKDAYS[after]} depois d${base}`}${span}`
    }
    case 'friday_13th':
      return 'toda sexta-feira 13'
    case 'easter':
      return date.offsetDays === -2 ? 'da Sexta-feira Santa à segunda-feira de Páscoa' : `${Math.abs(date.offsetDays)} dias ${date.offsetDays < 0 ? 'antes' : 'depois'} do Domingo de Páscoa${span}`
    case 'table': {
      const next = nextTableDate(date.dates)
      return next === null ? 'uma data que muda a cada ano' : `uma data que muda a cada ano (a próxima: ${next.getUTCDate()} de ${MONTHS[next.getUTCMonth()]} de ${next.getUTCFullYear()})`
    }
  }
}

export const pt: HelpPage = {
  seoTitle: 'Ajuda e instalação do Desk Crawler',
  description: 'Como instalar o Desk Crawler no TRMNL e como funciona cada parte do jogo, com soluções para quando a tela parece desatualizada.',
  title: 'Desk Crawler no TRMNL',
  contents: {
    'getting-started': 'Primeiros passos', 'if-the-qr-sends-you-back-to-setup': 'Se o QR leva de volta à instalação', 'how-time-works': 'Como o tempo passa', floors: 'Andares', 'desk-keepsakes': 'Lembrancinhas de mesa', career: 'Carreira', 'heroes-and-classes': 'Heróis e classes', stances: 'Posturas', 'desk-raids': 'Incursões de mesa', meetings: 'Reuniões', 'lost-property': 'Achados e perdidos', 'to-do-list': 'Lista de tarefas', potions: 'Poções', 'the-wandering-merchant': 'O mercador ambulante', decisions: 'Decisões', effects: 'Efeitos', 'office-calendar': 'Calendário do escritório', 'rare-and-epic-gear': 'Equipamento raro e épico', 'when-your-bag-fills-up': 'Quando a bolsa enche', 'bigger-bags': 'Bolsas maiores', 'salvage-and-the-workbench': 'Desmontar e a bancada', 'getting-knocked-out': 'Ser nocauteado', recaps: 'Resumos', 'understanding-rankings': 'Como funcionam os rankings', 'sharing-your-hero': 'Compartilhar seu herói', 'following-and-rivals': 'Seguir e rivais', names: 'Nomes', gender: 'Gênero', alerts: 'Alertas', troubleshooting: 'Solução de problemas', 'disconnecting-and-removing': 'Desconectar e remover', help: 'Ajuda',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Primeiros passos</h2>
      <ul>
        <li>Abra o <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler na loja do TRMNL</a> e escolha Instalar.</li>
        <li>Entre no Desk Crawler, escolha um nome público e um nome de herói, e conecte a instalação.</li>
        <li>De volta ao TRMNL, clique em Salvar. A primeira aventura do seu herói começa em até 15 minutos.</li>
        <li>Adicione o plugin a uma playlist, ou a um mashup se quiser seu herói ao lado de outros plugins. Os quatro tamanhos de layout são aceitos.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">Se o QR leva de volta à instalação</h2>
      <p>O QR abre o app da conta em que você entrou. Ele não começa uma instalação nova. Confira o e-mail da conta mostrado na página de instalação e use Trocar de conta se você conectou originalmente com outra conta.</p>
      <p>Se a instalação diz “Reconectar o Desk Crawler”, sua conexão com o TRMNL existe, mas o herói está faltando. Isso pode acontecer depois da reinicialização do jogo antes do lançamento. Instale uma cópia nova do <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler pelo TRMNL</a>, entre com a mesma conta, escolha um nome de herói novo, conecte e clique em Salvar no TRMNL. Quando a cópia nova funcionar, tire a antiga da sua playlist.</p>
      <p>Se a instalação diz “Salve no TRMNL para começar”, seu herói já está pronto. Volte a essa instalação no TRMNL e clique em Salvar.</p>
      <h2 id="how-time-works">Como o tempo passa</h2>
      <p>
        O mundo do jogo avança a cada 15 minutos, com a tela ligada ou não. Seu TRMNL mostra um retrato do momento e se atualiza no próprio ritmo.
        Modo de suspensão, atualização mais lenta e outros itens da playlist nunca reduzem o progresso do seu herói. Os horários das aventuras no app usam o fuso horário do seu navegador.
      </p>
      <h2 id="floors">Andares</h2>
      <p>O prédio tem {F.floors.length} andares, e seu herói começa {t.nameWith(F.floors[0]?.name ?? '', 'no')}. Cada um abre num nível, quer você visite ou não: {FLOORS_LINE}. Seu TRMNL diz “Nova área desbloqueada” quando isso acontece; ir para lá é decisão sua, pelo mapa do mundo na página Herói. Andares mais fundos têm monstros mais duros, mais ouro, poções melhores e tarefas mais bem pagas. {t.nameWith(F.floors[0]?.name ?? '', 'O')} não consegue nocautear um herói; todos os outros andares conseguem.</p>
      <ul>
        {F.floors.map((f) => <li key={f.id}><strong>{name(f.name)}</strong>{f.level > 1 ? ` (nível ${f.level})` : ' (desde o início)'}: {f.monsters.map(name).join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>A página Notas de campo, em Mais, guarda o que seu herói anotou sobre cada andar e cada monstro. A nota de um andar abre na primeira vez que seu herói pisa nele, a de um monstro na primeira vitória contra ele. As notas não afetam o jogo.</p> : null}
      <h2 id="desk-keepsakes">Lembrancinhas de mesa</h2>
      <p>Mantenha o Desk Crawler na sua playlist e procure “Código de lembrancinha” seguido de um código de seis dígitos, como 482 917, na barra de título da tela (mashups estreitos em retrato encurtam para “Código”). Digite esse código nas Configurações do app para coletar uma lembrancinha de escritório permanente. A tela inteira e os mashups mostram o código; a prévia do app o esconde. Enquanto uma lembrancinha espera, o QR da tela também a coleta: escaneie com o celular e o app a coloca na sua prateleira, mesmo com a barra de título desligada. Quando há espaço, o código aparece ao lado.</p>
      <p>Você pode coletar uma lembrancinha por semana, com um código novo toda segunda-feira às 00:00 UTC. O código da semana anterior também funciona se sua tela atualiza devagar. Se perder uma semana, você ganha o mesmo desenho na semana seguinte. Depois de completar a coleção, você pode coletar mais de cada uma. Lembrancinhas não mudam XP, equipamento nem rankings, e mais dispositivos ou atualização mais rápida não rendem extras.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Carreira</h2>
          <p>Seu herói sempre tem um objetivo, mostrado no topo da página Herói: “Vença seu primeiro combate”, “Equipe uma peça de equipamento que você achou”, “Chegue à Sala dos servidores”, “Compre a Mochila de notebook”. Alguns se alcançam em aventura; o resto você faz aqui, na página Bolsa ou Herói. Alcançar um objetivo mostra “Objetivo alcançado” no seu TRMNL e separa um pouco de ouro ({n(F.career.gold)} na escada inteira); aperte Resgatar na página Herói para pegar. Os objetivos não dão XP nem expiram, e o próximo começa quer você tenha resgatado ou não.</p>
          <ul>
            <li>A página Carreira, em Mais, lista os {F.career.goals} objetivos em ordem, com a data em que você alcançou cada um. Um objetivo que você já tinha feito quando a escada chegou conta como alcançado.</li>
            {F.unlocks !== undefined ? <li>Os recursos chegam por nível, quer você visite ou não: a lista de tarefas no nível {F.unlocks.todo}, as posturas no nível {F.unlocks.stances}, as decisões do escritório no nível {F.unlocks.choices}, {F.meetings?.level !== undefined ? `as reuniões com colegas no nível ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `desmontar e a bancada no nível ${F.workbench.level}, ` : ''}o mercador ambulante no nível {F.unlocks.merchant} e as incursões de mesa no nível {F.unlocks.raids}. Seu TRMNL diz “Desbloqueado” quando isso acontece. Os andares também abrem por nível: {FLOORS_LINE}.</li> : null}
            <li>Alguns objetivos do começo têm hora garantida: o primeiro combate em poucas aventuras, um equipamento na primeira dúzia, e uma primeira decisão, mercador e elite em mais ou menos um dia depois do nível deles. Todo o resto depende da sorte.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Heróis e classes</h2>
          <p>Todo mundo começa como Guerreiro. Quando seu Guerreiro chega ao nível {F.rosterLevel}, seu TRMNL diz “Desbloqueado: um segundo herói”, e você pode recrutar um Ladino na página Heróis, em Mais. O Ladino começa no nível 1 com nome, equipamento, ouro, poções e objetivos próprios.</p>
          <ul>
            <li>Um herói se aventura por vez, e é ele que seu TRMNL mostra e que aparece nos rankings. O outro fica onde você o deixou. Ele não se aventura nem recupera depois, e um mercador que o visitar vai embora.</li>
            <li>Você pode trocar uma vez por dia. Voltar atrás em até dez minutos não conta. Um herói nocauteado ou na estrada precisa se recuperar ou chegar primeiro.</li>
            <li>Você pode ter um herói de cada classe. As conquistas são suas, seja qual for o herói que as ganhe; algumas são só do Ladino.</li>
            <li><strong>Guerreiro</strong>: {t.text(F.classes.warriorBlurb)}</li>
            <li><strong>Ladino</strong>: {t.text(F.classes.rogueBlurb)} {F.classes.rogue.hpPct}% de saúde, ataque {signed(F.classes.rogue.attackPct)}%, defesa {signed(F.classes.rogue.defensePct)}%, {signed(F.classes.rogue.goldPct)}% de ouro em todo combate e achado, e {F.classes.rogue.raidEdgePct} pontos a seu favor em toda incursão de mesa. Ele sobe de nível no ritmo do Guerreiro, mas é nocauteado um pouco mais.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Posturas</h2>
      <p>Escolha o quanto seu herói é cauteloso na página Herói.{arrives('stances')} A postura vale a partir da próxima aventura, e você pode mudá-la quando quiser. Seu TRMNL a mostra ao lado da contagem da bolsa, sob um medidor com o ponteiro baixo para Cauteloso, no meio para Equilibrado e alto para Ousado.</p>
      <ul>
        <li><strong>Cauteloso</strong> bebe uma poção abaixo de 65% dos PV, descansa abaixo de 50% e sai de novo com 90%. Ganha 90% do XP normal por vitória.</li>
        <li><strong>Equilibrado</strong>, o padrão, bebe abaixo de 50%, descansa abaixo de 35% e sai de novo com 75%, com o XP normal.</li>
        <li><strong>Ousado</strong> bebe abaixo de 35%, descansa abaixo de 20% e sai de novo com 60%. Ganha 115% de XP por vitória, mas é nocauteado com mais frequência.</li>
      </ul>
      <p>{t.nameWith(F.floors[0]?.name ?? '', 'O')} não consegue nocautear um herói, então lá o Ousado não corre risco de nocaute. Em qualquer outro andar um nocaute custa ouro e manda seu herói de volta {t.nameWith(F.floors[0]?.name ?? '', 'ao')}, e o Ousado é o mais nocauteado.</p>
      <h2 id="desk-raids">Incursões de mesa</h2>
      <p>Enquanto exploram, os heróis às vezes invadem as mesas uns dos outros. Todo herói ativo{F.unlocks === undefined ? '' : ` a partir do nível ${F.unlocks.raids}`} faz incursões e é invadido automaticamente. Você não pode começar uma incursão nem escolher o alvo.{F.unlocks === undefined ? '' : ` Abaixo do nível ${F.unlocks.raids} um herói não invade nem é invadido.`} A incursão aparece no diário de aventuras dos dois heróis com o nome público do outro jogador, e a página Herói guarda o histórico das incursões do seu herói.</p>
      <ul>
        <li>Quem vence é um cara ou coroa, mexido só pela postura. Nível, equipamento e efeitos nunca contam. Cauteloso soma 10 pontos ao seu lado, Equilibrado não soma nada e Ousado tira 5, tanto atacando quanto defendendo.</li>
        <li>A frequência das incursões também depende da postura: Cauteloso mais ou menos a cada dois dias de exploração, Equilibrado cerca de uma vez por dia, Ousado cerca de duas vezes por dia.</li>
        <li>Quem perde entrega 5% do ouro a quem vence, então o ouro só muda de mãos. Os dois perdem saúde: quem perde 30% dos PV máximos, quem vence 10%. Equipamento {t.text('Thrifty')} tira seus pontos da perda de ouro.</li>
        <li>Uma incursão pode nocautear um herói, igual a um combate; {t.nameWith(F.floors[0]?.name ?? '', 'no')} seu herói é resgatado. As incursões só encontram heróis que estão explorando ou descansando, e um herói invadido fica em paz por cerca de seis horas.</li>
        <li>Se você prefere perder menos incursões, escolha Cauteloso, que invade menos e vence mais.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Reuniões</h2>
          <p>De vez em quando, em vez de um combate, seu herói esbarra no herói de outro jogador no mesmo andar{F.meetings.level === undefined ? '' : `, a partir do nível ${F.meetings.level}`}. Eles tomam um café, trocam histórias de guerra ou dividem um sanduíche, e os dois heróis ganham o mesmo pequeno bônus por {F.meetings.boonAdventures} aventuras. Os dois diários contam a história com o nome público do outro jogador, e a aba Diário lista as cinco últimas reuniões do seu herói.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{t.text(kind.name)}</strong>: {t.text(kind.effect)}, {boonLine(kind.modifiers)}.</li>)}
            <li>Nada muda de mãos. Uma reunião ocupa o lugar de uma aventura, e o bônus mais ou menos compensa.</li>
            <li>Acontece na mesma frequência, seja qual for sua postura ou classe, cerca de a cada dois dias para um herói que está explorando. Os heróis só se encontram explorando ou descansando, e um herói que acabou de ter uma reunião fica em paz por cerca de doze horas.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Achados e perdidos</h2>
          <p>Quando seu herói é nocauteado fora do Escritório, ele deixa cair naquele andar um reserva da arma ou armadura, com seu nome público escrito a canetinha. Seu herói fica com tudo o que estava usando. Depois, o herói de outro jogador explorando aquele andar pode achar o reserva no lugar de um achado comum, e seu TRMNL diz quem achou.</p>
          <ul>
            <li>Seu herói pode achar reservas de outros jogadores do mesmo jeito. Um reserva é equipamento comum: equipe, venda, desmonte ou leve à bancada. Ele vem com os atributos básicos do tipo e da raridade, sem as melhorias do primeiro dono.</li>
            <li>O nome continua nele. A página Bolsa e o cartão Achados e perdidos na aba Diário mostram de quem era, e sua página de herói também, enquanto você o tiver.</li>
            <li>Um reserva só substitui um achado que seu herói ia fazer de qualquer jeito, então ninguém ganha equipamento extra. Objetivos de carreira e presentes de Natal são sempre equipamento novo.</li>
            <li>Só um reserva seu fica largado por vez. Se seu herói for nocauteado de novo antes de alguém achá-lo, o novo substitui o antigo.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">Lista de tarefas</h2>
          <p>Seu herói mantém uma lista de tarefas do escritório com três tarefinhas, como “Derrote 4 Diabretes de papel”, “Ache 2 peças de equipamento” ou “Explore a Sala dos servidores por 16 aventuras”.{arrives('todo')} Ele cumpre as tarefas enquanto explora, e a página Herói mostra o progresso de cada uma. Quando uma tarefa termina, sua tela diz “Riscado” e seu herói ganha um pouco de ouro: {e(F.todo.pay.map(String), 'ou')} conforme o andar. Tarefas não dão XP, então não afetam os rankings.</p>
          <ul>
            <li>Toda manhã às {F.todo.standup}, horário local do seu TRMNL, o stand-up troca as tarefas concluídas por novas. Sua tela as lista.</li>
            <li>As tarefas nunca expiram. Uma tarefa travada é trocada sozinha depois de dois stand-ups.</li>
            <li>Pelo menos duas das três tarefas podem ser feitas onde seu herói está. No máximo uma pede uma viagem para outra área, se você quiser mandar seu herói para lá.</li>
            <li>Uma vez entre stand-ups você pode trocar uma tarefa não concluída por outra na página Herói.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Poções</h2>
      {F.potions === undefined
        ? <p>Uma poção de cura devolve 40% dos PV máximos do seu herói, arredondado para cima. Seu herói bebe uma automaticamente quando os PV caem abaixo do limite de poção da postura enquanto explora, e o diário registra isso. Sem poções, seu herói descansa abaixo do limite de descanso e sai de novo quando se recupera. Você também pode beber uma pela página Herói quando seu herói está explorando ou descansando sem estar com a saúde cheia. As poções são achadas explorando e nunca ocupam espaço na bolsa.</p>
        : <>
          <p>As poções vêm em {F.potions.strengths.length} forças: {e(F.potions.strengths.map((s) => `${name(s.name).toLowerCase()} (${s.healPct}%)`))}, e cada uma devolve essa parte dos PV máximos do seu herói, arredondada para cima. Os achados dependem de onde seu herói está: {F.potions.drops.map((d) => `${floor(d.floor)} dá ${d.rest.length === 0 ? 'só' : 'principalmente'} ${name(`${d.top.toLowerCase()}s`)}${d.rest.length === 0 ? '' : `, com algumas ${d.rest.map((r) => name(`${r.toLowerCase()}s`)).join(' e ')}`}`).join('; ')}. Um herói novo começa com poções de cura, e o mercador e as decisões do escritório também distribuem poções de cura. Todas as forças dividem uma bolsinha e nunca ocupam espaço na bolsa.</p>
          <p>Seu herói bebe automaticamente quando os PV caem abaixo do limite de poção da postura enquanto explora: a poção mais fraca que o põe de volta acima desse limite, ou a mais forte que tiver quando nenhuma mais fraca resolve. O diário diz o que ele bebeu. Sem poções, seu herói descansa abaixo do limite de descanso e sai de novo quando se recupera. Você também pode beber uma pela página Herói quando seu herói está explorando, descansando ou viajando sem estar com a saúde cheia; com mais de uma força na bolsinha, a página Herói pergunta qual.</p>
          <p><strong>Combinar.</strong> Na página Bolsa, {F.potions.combine.count} {name(`${F.potions.combine.from.toLowerCase()}s`)} e {F.potions.combine.materials.map((m) => `${m.n} de ${name(m.name).toLowerCase()}`).join(', ')} viram uma {name(F.potions.combine.to.toLowerCase())}. Combinar nunca deixa você com mais poções do que antes, então a bolsinha não transborda. Só acontece quando você escolhe.</p>
        </>}
      <p>As poções ficam numa bolsinha. Um herói novo carrega {t.nameWith(F.firstPouch.name, 'um')} que guarda {F.firstPouch.size}. Bolsinhas maiores são compradas com ouro na página Bolsa, uma de cada vez: {rungs(F.shopPouches)}. Quando a bolsinha está cheia, uma poção achada vira ouro.</p>
      <h2 id="the-wandering-merchant">O mercador ambulante</h2>
      <p>De vez em quando seu herói encontra um mercador ambulante enquanto explora. Sua tela diz “Mercador de passagem. Compre logo no app.” e a página Bolsa mostra até três ofertas: algumas poções e a próxima bolsinha ou bolsa{F.merchantOff > 0 ? ` com ${F.merchantOff}% de desconto sobre o preço da página Bolsa` : ''}. Cada oferta é vendida uma vez. O mercador segue viagem depois de quatro aventuras ou da sua última compra.</p>
      <h2 id="decisions">Decisões</h2>
      <p>Às vezes o escritório pergunta algo pequeno ao seu herói, como fazer vaquinha para um bolo ou ficar até mais tarde. Sua tela diz “Uma decisão espera por você no app.” e a página Herói mostra as duas opções com exatamente o que cada uma muda. Se você não responder em cerca de um dia, a opção marcada como padrão é escolhida por você.</p>
      <h2 id="effects">Efeitos</h2>
      <p>Alguns momentos deixam seu herói com um efeito curto, listado na página Herói com as aventuras que faltam. Vencer um elite deixa seu herói {t.text('Fired up')} (+10% de ataque por oito aventuras). Fazer vaquinha para o bolo deixa seu herói {t.text('Well fed')} (+10% de XP por oito aventuras). Uma armadilha deixa seu herói {t.text('Bruised')} (−15% de defesa por quatro aventuras). Seu herói tem no máximo três efeitos. Qualquer descanso tira os efeitos ruins, e um nocaute limpa todos.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Elites entrincheirados</h2>
          <p>A partir do nível {F.standoff.minLevel}, {t.nameWith(F.standoff.floor, 'no')} e nos andares mais fundos, um elite às vezes se entrincheira em vez de cair num combate só. Seu TRMNL o mostra com a barra de saúde, e seu herói volta a enfrentá-lo a cada aventura até ele cair.</p>
          <ul>
            <li>A cada aventura seu herói luta com ele por até seis rodadas, e a saúde dele se mantém. Ele bate muito mais forte que um elite comum, e seu herói continua lutando abaixo da linha de descanso da postura antes de recuar, então um confronto pode terminar em nocaute. Recuar não custa ouro.</li>
            <li>Quando cai, rende {F.standoff.xp} vezes o XP do monstro e {F.standoff.gold} vezes o ouro dele, mais um achado raro ou épico daquele andar.</li>
            <li>Ele vai embora depois de {F.standoff.hours} horas, ou antes se seu herói for nocauteado ou viajar. A pausa não para o relógio.</li>
            <li>A página Herói mostra a saúde dele e quando vai embora. Dá para deixá-lo para trás por lá, e a viagem pergunta antes de deixá-lo.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Calendário do escritório</h2>
          <p>Feriados e datas de escritório enfeitam a cena do seu herói no dia: decorações no teto, algo no chão, às vezes um chapéu, e {t.nameWith(F.floors[0]?.name ?? '', 'no')} uma vista diferente pela janela. Elas seguem a data local do seu TRMNL. Na primeira vez que seu herói vê uma, o diário dá o nome dela, e a maioria traz um pequeno bônus enquanto dura. A página Herói mostra a data de hoje e a próxima.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{t.text(rule.name)}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'toda incursão de mesa dá errado (veja abaixo).' : rule.effectLabel ? `${t.text(rule.effectLabel)}.` : 'só decoração.'}</li>)}
          </ul>
          <p><strong>Sexta-feira 13.</strong> As incursões de mesa começam duas vezes mais, e todas dão errado: ninguém vence, e os dois heróis perdem 20% dos PV máximos e 5% do ouro, que não fica com ninguém. O histórico de incursões do seu herói conta isso como contratempo.</p>
          <p><strong>Natal.</strong> Seu herói acha um presente embrulhado a cada Natal: um equipamento do andar em que está, na primeira aventura dos três dias.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Equipamento raro e épico</h2>
      <p>O equipamento pode ser comum, incomum, raro ou épico. O épico é o mais raro, cerca de um achado em cem, e o mais forte. Equipamentos raros e épicos também têm um traço especial, mostrado no nome do item e explicado na página Bolsa:</p>
      <ul>
        <li><strong>{t.text('Vampiric')}</strong> cura 5% dos PV máximos depois de cada vitória.</li>
        <li><strong>{t.text('Lucky')}</strong> soma 20% de ouro em vitórias e achados.</li>
        <li><strong>{t.text('Sturdy')}</strong> recebe 40% menos dano de armadilhas.</li>
        <li><strong>{t.text('Thrifty')}</strong> perde 5 pontos a menos de ouro quando algo dá errado: um recuo não perde ouro em vez de 5%, e um nocaute perde 5% em vez de 10%.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">Quando a bolsa enche</h2>
      <p>Um herói novo começa com um saquinho de papel que guarda 6 peças de equipamento. Equipamento em uso e poções não ocupam espaço. Quando a bolsa está cheia, seu herói guarda para você a próxima peça que acha e continua a aventura. Enquanto essa peça espera, os achados seguintes ficam para trás até você liberar espaço.</p>
      <h2 id="bigger-bags">Bolsas maiores</h2>
      <p>Sua bolsa cresce com ouro. {F.tote ? `Seu herói acha ${t.nameWith(F.tote.name, 'um')} (${F.tote.size}) nas primeiras duas horas, mais ou menos. ` : ''}Depois disso, bolsas maiores são compradas na página Bolsa, uma de cada vez: {rungs(F.shopBags)}, até {F.topBag} espaços. Não há exigência de nível, e bolsas nunca caem como saque.</p>
      <ol className="[&_li]:list-decimal">
        <li>Abra Bolsa no app. Equipe as melhorias e venda o equipamento sobrando para liberar espaço.</li>
        <li>Se há um achado guardado, escolha Resgatar o achado. Deixe pelo menos um espaço livre depois de resgatá-lo para as aventuras poderem voltar.</li>
        <li>Quando há um espaço livre e nada esperando, as aventuras voltam sozinhas em até 15 minutos. Antes disso você ainda pode escolher outra área desbloqueada na página da bolsa.</li>
      </ol>
      <p>Equipar não libera espaço. Vender ou desmontar equipamento, ou comprar uma bolsa maior, libera, e o achado guardado entra na bolsa na hora. A página Bolsa também pode vender seu reserva mais fraco e ficar com o achado num toque. O modo de suspensão do seu TRMNL também nunca para o jogo.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Desmontar e a bancada</h2>
        <p>{F.workbench.level !== undefined ? `A partir do nível ${F.workbench.level}, o` : 'O'} equipamento sobrando tem duas saídas da bolsa: vender por ouro ou desmontar em materiais na página Bolsa. Desmontar rende conforme o nível em que a peça foi achada, em unidades do material da raridade dela: {F.workbench.materials.map((m) => `${name(m.name).toLowerCase()} do equipamento ${m.rarities.map((r) => rarityPt[r] ?? r).join(' e ')}`).join(', ')}. Equipamento épico rende {F.workbench.epicMultiplier} vezes mais. Materiais não ocupam espaço na bolsa e nunca são vendidos. O equipamento só é desmontado quando você escolhe.{F.workbench.level !== undefined ? ` Antes do nível ${F.workbench.level}, venda os reservas: a primeira melhoria pede o nível ${F.workbench.level} de qualquer jeito.` : ''}</p>
        <p>A bancada gasta materiais e ouro no equipamento que seu herói usa, sem tirá-lo: a peça mantém nome e traço, e só os números mudam. Cada peça tem um único próximo passo. {F.workbench.tiers.map((s, i) => `${i === 0 ? 'Subir uma peça de nível 1 para Mk II' : 'Passar de Mk II para Mk III'} custa ${price(s)}`).join('; ')}; uma peça só sobe para um nível que o nível do seu herói poderia equipar. Quando uma peça é Mk III (ou foi achada assim), o reforço soma um ponto por passo: {F.workbench.reinforce.map((s) => `+${s.to} por ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `Depois de +${F.workbench.reinforce.at(-1)!.to} a peça está pronta.` : ''} Equipamento raro e épico também pode receber o traço que você escolher por {price(F.workbench.affix)}, no lugar do que ele tem.</p>
        <p>As melhorias sempre dão certo. Desmontar uma peça melhorada não devolve o que você gastou nela, então só melhore o equipamento que pretende continuar usando.</p>
      </> : null}
      <h2 id="getting-knocked-out">Ser nocauteado</h2>
      <p>Seu herói se recupera sozinho depois de cerca de duas horas e volta {t.nameWith(F.floors[0]?.name ?? '', 'ao')}. Você mantém o XP e o equipamento, mas perde 10% do ouro que tem.</p>
      <h2 id="recaps">Resumos</h2>
      <p>Sua tela traz um resumo curto da última noite ou do último dia completos, no horário local do seu TRMNL. Às 07:00 o resumo da noite cobre das 19:00 às 07:00 e fica o dia todo. Às 19:00 o resumo do dia cobre das 07:00 às 19:00 e fica a noite toda. A janela do escritório mostra dia e noite nos mesmos horários. As histórias acima dele são sempre as mais recentes.</p>
      <h2 id="understanding-rankings">Como funcionam os rankings</h2>
      <p>A tela mostra o Top 5 de XP dos sete dias do seu grupo de nível, com a sua linha marcada, ou acrescentada abaixo da lista quando você está mais embaixo. O app também oferece uma vista de 24 horas e um placar geral. Os rankings saem de hora em hora, então uma aventura ou um nível recente pode aparecer antes de sua posição atualizar.</p>
      <p>Heróis pausados ou parados mantêm o progresso, mas o XP recente deles expira. Depois de sete dias sem ganhar XP, eles saem do placar semanal até ganharem XP de novo. O progresso total continua registrado.</p>
      <h2 id="sharing-your-hero">Compartilhar seu herói</h2>
      <p>Seu herói tem uma página pública com nível, posição, andar atual, totais e conquistas. Ouro e diário de aventuras nunca aparecem, e equipamento só quando é o reserva de outro jogador que seu herói está guardando. Seu nome leva à página pelos rankings e pelas incursões e reuniões de outros jogadores, e é lá que os outros seguem você. As Configurações têm os botões Compartilhar e Copiar link, e um link compartilhado mostra um cartão com a imagem do seu herói, nome, nível e posição. Para ocultá-la, escolha Ocultar minha página de herói nas Configurações. Ela some na hora, e enquanto está oculta ninguém pode seguir você nem escolher você como rival.</p>
      <h2 id="following-and-rivals">Seguir e rivais</h2>
      <p>Depois de entrar, você pode seguir outro jogador pela página pública de herói dele, até 20 jogadores. Todos que você segue aparecem em Rankings, com nível, posição e local do herói, e links para as páginas. Marque um deles como rival para mantê-lo no topo da lista com uma linha dizendo quem está na frente. Seu rival também sofre mais incursões: metade das incursões do seu herói vai atrás da mesa dele quando é possível. Seu rival fica sabendo quem o escolheu e pode escolher você de volta. Seguir qualquer outra pessoa não muda nada no jogo, e ninguém é avisado quando você segue. Se um jogador oculta a página, você vê só o nome dele até ele mostrá-la de novo. Se ele troca o nome público, sai da sua lista.</p>
      <h2 id="names">Nomes</h2>
      <p>Você tem dois nomes. O nome do seu herói aparece no seu TRMNL, nos rankings e na página do herói; para trocá-lo, compre um crachá “Olá, meu nome é” na aba Mais por 200 de ouro. Há um à venda por dia. Seu nome público é você, em todos os jogos TRMNL: aparece ao lado do seu herói nos rankings, nas incursões e reuniões de outros jogadores e no link da sua página. Você pode trocá-lo de graça uma vez a cada 7 dias em Conta. Os links para sua página antiga param de funcionar, e ninguém mais pode usar seu nome antigo por 7 dias.</p>
      <h2 id="gender">Gênero</h2>
      <p>Você escolhe o gênero do seu herói, masculino ou feminino, ao criá-lo. Só muda a aparência dele no seu TRMNL, na página do herói e nas reuniões de outros jogadores. Os dois jogam igual. Para mudar depois, compre uma repaginada na aba Mais por 200 de ouro, quando quiser.</p>
      <h2 id="alerts">Alertas</h2>
      <p>Seu TRMNL é o jeito principal de acompanhar seu herói, mas as Configurações também podem mandar uma notificação para o celular em dois casos, cada um desligado até você ligar:</p>
      <ul>
        <li><strong>Bolsa cheia:</strong> a bolsa está cheia e seu herói está guardando um achado para você. Chega meia hora depois de a bolsa encher, então não chega nada se você já está arrumando, e uma vez cada vez que ela enche.</li>
        <li><strong>Oferta do mercador:</strong> um mercador está vendendo a próxima bolsa ou bolsinha{F.merchantOff > 0 ? ` com ${F.merchantOff}% de desconto` : ''} e seu herói tem o ouro. No máximo uma vez por dia. Um mercador só com poções nunca manda alerta.</li>
      </ul>
      <p>Você recebe no máximo dois alertas por dia. O horário de silêncio vai das 21:00 às 08:00, a menos que você mude: um alerta de bolsa cheia espera ele acabar, e uma oferta do mercador que aparecer nesse horário é pulada. Antes de enviar, o jogo confere se o alerta ainda vale, então você nunca fica sabendo de uma bolsa que já arrumou ou de uma oferta que já foi. Decisões, incursões, nocautes, subidas de nível e lembrancinhas nunca mandam alertas.</p>
      <p>Escolha Permitir neste dispositivo nas Configurações e aceite o aviso do navegador. No iPhone e no iPad, primeiro adicione o TRMNL Games à Tela de Início (Compartilhar, depois Adicionar à Tela de Início) e abra por lá. Cada dispositivo que você permite aparece nas Configurações com um botão Remover; remover o último desliga os alertas.</p>
      <h2 id="troubleshooting">Solução de problemas</h2>
      <h3 id="not-on-your-screen">Seu herói não aparece na tela</h3>
      <ul>
        <li>Clicar em Salvar coloca o Desk Crawler na playlist do seu TRMNL. Seu dispositivo mostra a playlist um plugin por vez, na taxa de atualização dele, então o Desk Crawler aparece quando chega a vez dele. Com vários plugins e atualização lenta, isso pode demorar.</li>
        <li>Abra a playlist no TRMNL e confira se o Desk Crawler está lá, no dispositivo que você está olhando se tiver mais de um, e se nenhuma programação o esconde nesse horário.</li>
        <li>O modo de suspensão para a atualização da tela durante a noite. Seu herói continua se aventurando, e a tela se atualiza quando o dispositivo acorda.</li>
        <li>Uma tela que diz “A primeira aventura começa em até 15 minutos” está funcionando. A primeira história chega no próximo quarto de hora.</li>
        <li>A página Herói do app sempre mostra o que seu herói está fazendo, seja o que for que a tela mostre.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">A tela parece antiga</h3>
      <ul>
        <li>“As atualizações estão atrasadas” quer dizer que o serviço do jogo está atrasado. O progresso do seu herói fica guardado, e a tela se atualiza quando o serviço alcançar.</li>
        <li>Se o site do app está em dia, mas a tela não, confira no TRMNL a taxa de atualização do plugin e a posição dele na playlist.</li>
        <li>As aventuras rodam a cada quarto de hora, na hora cheia e aos :15, :30 e :45 no fuso do seu TRMNL. A tela não mostra contagem regressiva; a hora ao lado de cada história é quando ela aconteceu, e o app mostra a próxima aventura.</li>
        <li>Se você desconectou ou desinstalou, instale de novo pelo TRMNL. Seu herói mantém todo o progresso.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Desconectar e remover</h2>
      <p>
        Desconectar para as telas novas daquela instalação. O TRMNL pode continuar mostrando a última imagem até você tirar o plugin da playlist; não
        conseguimos apagar uma imagem que já está no seu dispositivo.
      </p>
      <h2 id="help">Ajuda</h2>
      <p>
        Escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> para ajuda com a conta ou a conexão. Tentamos responder em até dois dias úteis.
      </p>
    </>
  ),
}
