import { Link } from '@tanstack/react-router'
import { SUPPORT_EMAIL } from '../lib/prose'
import type { LegalPage } from './-legal'
import { TERMS_HEAD } from './-legalHeads'

export const termsPt: LegalPage = {
  title: TERMS_HEAD.pt.title,
  seoTitle: TERMS_HEAD.pt.seoTitle,
  description: TERMS_HEAD.pt.description,
  translationNote: () => <p className="text-sm text-muted">Tradução da versão em inglês, que prevalece em caso de diferença.</p>,
  Body: () => (
    <>
      <p>
        Estes termos cobrem o seu uso do TRMNL Games e dos jogos dele, mantidos por Barry Michael Doyle. Ao criar uma conta ou conectar uma instalação do TRMNL, você concorda
        com eles. Eles valem junto com a <Link to="/privacy">política de privacidade</Link>.
      </p>

      <h2>O jogo</h2>
      <ul>
        <li>O Desk Crawler é grátis. Não há compras, assinaturas nem anúncios.</li>
        <li>
          O jogo muda com o tempo: balanceamento, conteúdo e recursos podem ser ajustados. Tentamos manter o progresso do seu herói a cada atualização, mas não
          podemos garantir.
        </li>
        <li>Podemos pausar ou encerrar o serviço. Quando possível, avisaremos antes no app.</li>
      </ul>

      <h2>Sua conta</h2>
      <ul>
        <li>Você precisa ter pelo menos 13 anos para jogar.</li>
        <li>Mantenha seu login seguro. Você é responsável pelo que acontece pela sua conta.</li>
        <li>
          Você pode excluir sua conta a qualquer momento em <Link to="/account">Conta</Link>.
        </li>
      </ul>

      <h2>Jogo limpo e nomes públicos</h2>
      <ul>
        <li>
          Nomes públicos e de herói precisam seguir as <Link to="/support">regras de nomes</Link>: nada de conteúdo de ódio ou sexual, ameaças ou assédio, dados de contato
          ou falsidade ideológica.
        </li>
        <li>Não automatize o jogo, não explore bugs, não interfira no serviço nem em outros jogadores, e não tente acessar dados que não são seus. Em vez disso, relate os bugs.</li>
        <li>
          Podemos ocultar um nome, ou suspender uma conta por abuso deliberado ou repetido. Ocultar um nome nunca afeta o progresso do seu herói. Para recorrer, escreva para{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Ouro e itens</h2>
      <p>Ouro, equipamento e poções fazem parte só do jogo. Eles não têm valor em dinheiro e não podem ser vendidos, trocados nem transferidos fora do jogo.</p>

      <h2>TRMNL</h2>
      <p>
        O TRMNL Games e o Desk Crawler são projetos independentes. Eles não são feitos, endossados nem apoiados pelo TRMNL. Sua conta e seu dispositivo TRMNL seguem os termos do próprio TRMNL.
      </p>

      <h2>Propriedade</h2>
      <p>
        O código-fonte é aberto sob a Licença MIT no{' '}
        <a href="https://github.com/barrymichaeldoyle/trmnl-games">GitHub</a>. As ilustrações, os nomes de monstros, itens e lugares, os textos escritos do jogo e
        o nome e o logotipo do Desk Crawler não estão cobertos por essa licença e continuam com todos os direitos reservados.
      </p>

      <h2>Sem garantia</h2>
      <p>
        O TRMNL Games é oferecido como está, sem garantias de nenhum tipo. Na medida permitida pela lei, não nos responsabilizamos por progresso perdido, interrupções do serviço,
        pelo que aparece no seu dispositivo nem por qualquer perda indireta. Nada nestes termos tira direitos que você tem pela lei do consumidor e que não podem ser excluídos.
      </p>

      <h2>Mudanças</h2>
      <p>Quando estes termos mudam, atualizamos esta página e a data no topo. Se você continuar jogando depois de uma mudança, os novos termos valem.</p>

      <h2>Contato</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </>
  ),
}
