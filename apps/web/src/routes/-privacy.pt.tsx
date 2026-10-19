import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'

export const privacyPt: LegalPage = {
  title: 'Privacidade',
  description: 'O que o TRMNL Games guarda, o que é público nos rankings e nas telas TRMNL, e como excluir sua conta.',
  translationNote: () => <p className="text-sm text-muted">Tradução da versão em inglês, que prevalece em caso de diferença.</p>,
  Body: () => (
    <>
      <p>
        O TRMNL Games é uma coleção de jogos mantida por Barry Michael Doyle, um desenvolvedor independente. Esta página explica, em linguagem simples, o que o serviço guarda, quem trata esses dados e
        como removê-los. Dúvidas: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>O que é público</h2>
      <p>
        Seu nome público, o nome e o nível do seu herói e suas posições aparecem nos rankings e nas telas TRMNL de outros jogadores. Escolha um nome público que você
        não se importe de compartilhar e nunca coloque dados de contato nele.
      </p>
      <p>
        No Desk Crawler, os heróis invadem as mesas uns dos outros e se encontram por acaso. Quando seu herói invade, é invadido ou encontra outro herói, seu nome público aparece no diário de aventuras do outro jogador, no app e no TRMNL dele, como já aparece nos rankings. Quando seu herói é nocauteado, ele pode deixar cair um item reserva com seu nome público, que o herói de outro jogador pode achar e guardar; seu nome então aparece nesse item no app e na página de herói dele. Se você trocar de nome ou excluir sua conta, essas histórias e itens mostram “Jogador oculto” ou perdem o nome.
      </p>
      <p>
        Seu herói do Desk Crawler tem uma página pública: qualquer pessoa com o link vê seu nome público, o nome do seu herói, nível, posição, andar atual e data de início, alguns totais e suas conquistas. Ouro, diário de aventuras e dados da conta continuam privados, assim como seu equipamento, exceto os reservas de outros jogadores que seu herói guarda, que aparecem com os nomes deles. A página vem ativada. Ocultar minha página de herói, nas Configurações, a oculta na hora, e você pode mostrá-la de novo quando quiser.
      </p>
      <p>
        Jogadores conectados podem seguir uma página pública de herói. Guardamos quem segue quem para o app deles poder listar os jogadores que seguem. Ninguém é avisado de que foi seguido, e nenhuma página mostra quem segue um jogador, exceto que um jogador escolhido como rival de alguém vê quem o escolheu. Se você trocar seu nome público, ocultar sua página ou excluir seu progresso, outros jogadores deixam de ver seu herói na lista deles, e a exclusão remove esses registros.
      </p>

      <h2>O que guardamos</h2>
      <ul>
        <li>Sua identidade de login do Clerk, nosso provedor de login. Seu e-mail só é copiado para pedidos de confirmação de exclusão de curta duração; não copiamos seu nome real nem sua foto de perfil para o banco de dados do jogo.</li>
        <li>Seu nome público, seu herói, seus itens, seu diário de aventuras e o XP recente usado nos rankings. Contas mais antigas também podem ter um fuso horário salvo de versões anteriores.</li>
        <li>Se você ligar os alertas do Desk Crawler: quais alertas você quer, seu horário de silêncio e o fuso horário do seu navegador (por exemplo America/Sao_Paulo), e para cada dispositivo que você permitir, o endereço push que o navegador nos dá, as chaves de criptografia e um rótulo como “Chrome on Android”. Também guardamos um registro curto de cada alerta: de que tipo, quando e se foi enviado.</li>
        <li>
          Para cada instalação do TRMNL: o ID da instância do plugin, um hash do token de acesso e o link de configurações que o TRMNL nos dá. Não guardamos seu nome
          nem seu e-mail do TRMNL.
        </li>
        <li>A diferença de fuso horário que seu TRMNL envia com cada tela (por exemplo UTC−3), para o stand-up da manhã do Desk Crawler seguir o seu dia. Guardamos só a última.</li>
        <li>A configuração de idioma que seu TRMNL envia com cada tela (por exemplo pt-BR), para sabermos para quais idiomas vale traduzir os jogos e para sua tela poder usar seu idioma. Guardamos só a última.</li>
        <li>Se você escolher um idioma para o TRMNL Games, essa escolha, para que suas telas TRMNL e seus alertas também o usem.</li>
        <li>Registros operacionais de curta duração, como contadores de limite de uso e recibos de pedidos duplicados.</li>
        <li>Quando você pede a exclusão da conta: seu e-mail principal verificado, um hash do link de confirmação e o status de entrega. O link expira depois de 30 minutos; pedidos expirados são removidos na limpeza diária.</li>
        <li>A lista de lançamento do Desk Crawler guardava endereços de e-mail para um único e-mail quando o Desk Crawler chegasse à loja do TRMNL. Esse e-mail foi enviado em 13 de outubro de 2026, todos os endereços foram excluídos e a lista está fechada.</li>
        <li>O lembrete do herói: se o seu herói do Desk Crawler está em jogo há dois dias e você nunca abriu o app do Desk Crawler, enviamos um único e-mail para seu endereço principal verificado dizendo o que espera por você lá, com um link para parar. O endereço é lido do Clerk no envio e não é guardado. Guardamos só quando foi enviado, ou que você pediu para não receber.</li>
        <li>Se você enviar feedback: sua mensagem, a página de onde enviou, seu nome público e um link para sua conta. Ele vai por e-mail para o desenvolvedor, com seu e-mail principal verificado como endereço de resposta.</li>
      </ul>

      <h2>O que não fazemos</h2>
      <p>Nada de anúncios, e nada de vender ou compartilhar seus dados para marketing. O jogo não tem compras, então não guardamos dados de pagamento.</p>

      <h2>Análise e suporte opcionais</h2>
      <p>Se você permitir a análise, o PostHog registra as páginas que você visita, as etapas de instalação, as falhas em ações do jogo e os erros do navegador. Quando você entra, esses registros ficam ligados ao seu ID de conta do Clerk, ao seu e-mail, ao seu nome público e ao nome do seu herói, para podermos investigar pedidos de suporte e corrigir problemas. Os erros do navegador também vão para o Sentry, sem sua conta, seu e-mail ou seu endereço IP.</p>
      <p>O PostHog também grava sessões mascaradas para vermos onde um fluxo trava. Textos e campos de formulário são mascarados, dados de login e da conta são bloqueados, e não gravamos corpos nem cabeçalhos de rede nem a saída do console. Códigos de instalação, tokens de acesso, JWTs de gerenciamento e query strings de URL ficam de fora.</p>
      <p>Você pode recusar e continuar jogando. Use Preferências de análise no rodapé do site para mudar sua escolha. Desligar a análise interrompe a coleta nova naquele navegador; não apaga os registros anteriores. Fale conosco para removê-los, ou exclua sua conta TRMNL Games para pedir a remoção do perfil do PostHog ligado a ela, dos eventos e das gravações.</p>

      <h2>Cookies</h2>
      <p>
        O Clerk define cookies que mantêm você conectado. Enquanto você conecta ou gerencia uma instalação do TRMNL, definimos um cookie criptografado de curta duração que expira
        em minutos. Um link de confirmação de exclusão usa um cookie criptografado de curta duração para você poder entrar antes de confirmar. Se você permitir a análise, o PostHog usa o armazenamento local do navegador para reconhecer suas visitas. Também guardamos sua preferência de análise localmente, e um cookie lembra o idioma que você escolheu. Não há cookies de publicidade.
      </p>

      <h2>Serviços que tratam seus dados</h2>
      <ul>
        <li>
          <strong>Clerk</strong> cuida do login e guarda seu e-mail e seu método de login, além do seu perfil do Google ou GitHub se você entrar com um deles.
        </li>
        <li>
          <strong>Convex</strong> hospeda o banco de dados do jogo, as atualizações do jogo a cada 15 minutos e os backups diários.
        </li>
        <li>
          <strong>Cloudflare</strong> hospeda este site e mantém os registros de requisições comuns.
        </li>
        <li>
          <strong>TRMNL</strong> busca conosco a tela do seu herói. Sua conta e seu dispositivo TRMNL seguem a política de privacidade do próprio TRMNL.
        </li>
        <li><strong>PostHog EU</strong> cuida da análise de uso opcional, dos relatórios de erro e das gravações de sessão mascaradas para suporte e melhorias do produto.</li>
        <li><strong>Sentry</strong> (Estados Unidos) recebe relatórios de erro do servidor do nosso site e do backend do jogo, e do seu navegador se você permitir a análise, para encontrarmos e corrigirmos bugs. Um relatório traz o caminho da página ou o nome da função do jogo que falhou, e os detalhes técnicos do erro. Ele nunca inclui sua conta, seu e-mail, seu endereço IP, cookies, conteúdo de formulários, query strings de URL nem códigos e tokens de instalação.</li>
        <li><strong>O serviço push do seu navegador</strong> (Google para Chrome e Android, Apple para Safari, Mozilla para Firefox) entrega os alertas do Desk Crawler se você ligá-los. Ele recebe o alerta criptografado, então não consegue lê-lo, junto com o endereço push que seu navegador criou.</li>
        <li><strong>Resend</strong> entrega o e-mail de confirmação de exclusão da conta para seu endereço principal verificado, o e-mail de lançamento (enviado uma vez, em 13 de outubro de 2026) e o feedback que você envia ao desenvolvedor. Ele recebe esses endereços e o conteúdo dos e-mails. Ele também entrega o único lembrete do herói.</li>
      </ul>

      <h2>Por quanto tempo guardamos</h2>
      <ul>
        <li>Sua conta compartilhada: até você excluí-la. O progresso de um jogo: até você excluir esse jogo ou sua conta.</li>
        <li>Diário de aventuras detalhado: três dias. Resumos de execução: 30 dias. XP recente para rankings: sete dias.</li>
        <li>Recibos de pedidos duplicados: 24 horas. Tentativas de conexão com o TRMNL: menos de um dia.</li>
        <li>Lista de lançamento: excluída quando o e-mail de lançamento saiu, em 13 de outubro de 2026. Não guardamos nenhuma cópia.</li>
        <li>Lembrete do herói: quando foi enviado, ou que você pediu para não receber, até você excluir sua conta.</li>
        <li>Feedback: até você excluir sua conta, ou antes, se pedir. Cópias já enviadas por e-mail ao desenvolvedor são excluídas a pedido.</li>
        <li>Configurações de alertas e dispositivos: até você desligar os alertas, remover o dispositivo ou excluir o Desk Crawler ou sua conta. Um dispositivo cujo endereço push para de funcionar é removido automaticamente. Registros de alertas individuais: sete dias.</li>
        <li>Backups: cerca de uma semana; depois disso, os dados excluídos somem deles também.</li>
        <li>Gravações mascaradas: 30 dias. Eventos de análise e perfis de suporte: até a exclusão da conta ou um pedido de remoção anterior.</li>
        <li>Relatórios de erro no Sentry: até 90 dias. Eles não estão ligados à sua conta, então a exclusão da conta não tem nada a remover lá.</li>
      </ul>

      <h2>Excluir sua conta</h2>
      <p>
        Vá em <Link to="/account">Conta</Link> e peça um link de exclusão. Enviamos para seu endereço principal verificado; o link expira depois de 30 minutos. Entre com a mesma conta e digite DELETE na página de confirmação. Até você confirmar, sua conta continua ativa. Depois da confirmação, sua conta para de funcionar na hora, seu nome público é ocultado dos
        rankings, e então seu herói, seus itens, seu histórico, suas conexões com o TRMNL e seu login do TRMNL Games são removidos. Os instantâneos de ranking que copiaram seu nome
        são substituídos em cerca de duas horas. Se você não conseguir entrar, escreva para nós e fazemos isso por você.
      </p>
      <p>
        Guardamos só um hash de mão única da sua identidade de login e dos seus tokens antigos do TRMNL, para que uma conta excluída não possa ser reconectada às escondidas. Imagens já
        enviadas a um dispositivo TRMNL ou guardadas em cache pelo TRMNL não podem ser apagadas por nós; tire o plugin da sua playlist para substituí-las. Os contadores de limite de uso são removidos durante a exclusão, e as referências à conta nos registros de auditoria administrativa são limpas.
      </p>
      <p>A remoção dos perfis, eventos e gravações do PostHog ligados à conta é pedida como parte da exclusão da conta e processada pelo PostHog de forma assíncrona. Pedidos que falham são repetidos e ficam visíveis para o operador até serem resolvidos.</p>

      <h2>Excluir só um jogo</h2>
      <p>Nas <Link to="/app/desk-crawler/settings">configurações do Desk Crawler</Link>, escolha Excluir o progresso do Desk Crawler para remover esse herói, o histórico, as conexões e as configurações e dispositivos de alertas. Sua conta compartilhada e seu login continuam disponíveis. Você pode começar de novo instalando o plugin quando a exclusão terminar. Os outros jogos não são afetados.</p>

      <h2>Suas escolhas</h2>
      <p>
        Você pode pedir uma cópia dos seus dados de jogo, ou que algo seja corrigido ou excluído, escrevendo para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Tentamos responder em até dois dias úteis.
      </p>

      <h2>Crianças</h2>
      <p>O TRMNL Games não é destinado a menores de 13 anos, e não guardamos dados deles de propósito. Se você acha que uma criança tem uma conta, escreva para nós e vamos excluí-la.</p>

      <h2>Mudanças</h2>
      <p>Quando esta política muda, atualizamos esta página e a data no topo.</p>
    </>
  ),
  IdleAngler: () => (
    <>
      <h2>Idle Angler</h2>
      <p>O Idle Angler guarda seu pescador: o ouro, as águas e a isca, seu cooler, seu caderno de espécies e melhores pesos, seu histórico de pesca, seu peixe mais pesado em cada água, conquistas e caixa de moscas. Seus peixes mais pesados aparecem com seu nome público nos rankings do Idle Angler e nas telas TRMNL de outros jogadores. A menos que você oculte o Idle Angler do seu perfil público nas configurações do Idle Angler, qualquer pessoa com o link vê seu título, sua data de início, seu número de conquistas e as espécies registradas.</p>
      <p>Se você ligar os alertas do Idle Angler, eles usam os mesmos dispositivos e horário de silêncio dos alertas dos seus outros jogos. O código semanal de mosca no seu TRMNL é ligado à sua instalação e nunca aparece no app.</p>
      <p>Nas <Link to="/app/idle-angler/settings">configurações do Idle Angler</Link>, Excluir o progresso do Idle Angler remove seu pescador, o cooler, o caderno, os registros de ranking, a caixa de moscas, as conquistas, as conexões do Idle Angler e as configurações de alertas do Idle Angler. Sua conta e os outros jogos continuam. Excluir sua conta TRMNL Games remove o Idle Angler junto com todo o resto.</p>
    </>
  ),
  PaperLives: () => (
    <>
      <h2>Paper Lives</h2>
      <p>O Paper Lives guarda sua vida atual e as que terminaram: o nome de cada personagem, pronomes, traços, atributos, dinheiro, trabalho e casa, as pessoas da vida dele, sua história e as escolhas que você fez, além dos registros e fotos do álbum e suas conquistas. Suas vidas mais longas e maiores fortunas aparecem com seu nome público nos placares do Paper Lives e nas telas TRMNL de outros jogadores. A menos que você oculte o Paper Lives do seu perfil público nas configurações do Paper Lives, qualquer pessoa com o link vê o nome, a idade, o trabalho e os traços do seu personagem atual, quantas vidas você viveu, sua árvore genealógica e suas vidas terminadas, cada uma com epitáfio, destaques e fotos. Os nomes dos personagens são públicos nessas páginas, então não coloque dados de pessoas reais neles.</p>
      <p>Se você ligar os alertas do Paper Lives, eles usam os mesmos dispositivos e horário de silêncio dos alertas dos seus outros jogos, e o alerta mostra o primeiro nome do seu personagem. O código semanal de foto no seu TRMNL é ligado à sua instalação e nunca aparece no app.</p>
      <p>Nas <Link to="/app/paper-lives/settings">configurações do Paper Lives</Link>, Excluir o progresso do Paper Lives remove suas vidas, o álbum e as fotos dele, os registros dos placares, as conquistas, as conexões do Paper Lives e as configurações de alertas do Paper Lives. Sua conta e os outros jogos continuam. Excluir sua conta TRMNL Games remove o Paper Lives junto com todo o resto.</p>
    </>
  ),
}
