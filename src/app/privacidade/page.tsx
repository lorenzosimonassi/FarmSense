import type { Metadata } from "next"
import Link from "next/link"

import { LegalPage, TabelaLegal, type SecaoLegal } from "@/components/legal/LegalPage"
import { LEGAL } from "@/shared/legal"

export const metadata: Metadata = {
  title: "Política de Privacidade | FarmSense",
  description: "Quais dados o FarmSense coleta, para quê, com quem compartilha e como exercer seus direitos pela LGPD.",
}

const secoes: SecaoLegal[] = [
  {
    id: "quem-somos",
    titulo: "Quem cuida dos seus dados",
    conteudo: (
      <>
        <p>
          O FarmSense é um projeto acadêmico (Trabalho de Conclusão de Curso) desenvolvido por{" "}
          <strong>{LEGAL.responsavel}</strong>, na {LEGAL.instituicao}. Para a Lei Geral de Proteção de Dados (Lei nº
          13.709/2018, a LGPD), essa pessoa é a <strong>controladora</strong>: decide como os dados são usados e responde
          por eles.
        </p>
        <p>
          Qualquer dúvida ou pedido sobre seus dados: <a href={`mailto:${LEGAL.contato}`}>{LEGAL.contato}</a>. Por ser um
          agente de pequeno porte (Resolução CD/ANPD nº 2/2022), o FarmSense não tem um encarregado (DPO) nomeado; esse
          e-mail cumpre o papel de canal de atendimento.
        </p>
      </>
    ),
  },
  {
    id: "dados",
    titulo: "Quais dados coletamos",
    conteudo: (
      <>
        <p>Só o que é preciso para o sistema funcionar. Não pedimos CPF, endereço, telefone nem dados bancários.</p>
        <ul>
          <li>
            <strong>Conta:</strong> nome, e-mail e senha. A senha é guardada como <em>hash</em> (embaralhada de forma
            irreversível); ninguém, nem a equipe do projeto, consegue lê-la. Se você entra com o Google, recebemos dele
            apenas nome, e-mail e foto do perfil.
          </li>
          <li>
            <strong>Fazenda:</strong> nome, município, UF, área, atividades, tipo de rebanho e, se você importar, o
            contorno e o código do CAR.
          </li>
          <li>
            <strong>O que você registra:</strong> animais, pesagens, vacinas e outras aplicações, talhões (com o contorno
            desenhado no mapa) e plantios, além dos avisos de prazo gerados a partir deles.
          </li>
          <li>
            <strong>Dados técnicos de acesso:</strong> endereço IP e navegador de cada sessão, usados para manter você
            conectado com segurança e bloquear tentativas repetidas de login.
          </li>
        </ul>
        <p>
          Não coletamos dados sensíveis (saúde, religião, biometria etc.) e não usamos ferramentas de análise de
          comportamento nem publicidade.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    titulo: "Para que usamos e com qual base legal",
    conteudo: (
      <>
        <p>A LGPD exige que todo uso de dado pessoal tenha uma finalidade e uma base legal (art. 7º):</p>
        <TabelaLegal
          colunas={["Finalidade", "Dados usados", "Base legal"]}
          linhas={[
            [
              "Criar e manter sua conta",
              "Nome, e-mail, senha",
              "Execução do contrato (art. 7º, V)",
            ],
            [
              "Mostrar o painel, relatórios, mapa e calendário",
              "Dados da fazenda e tudo o que você registra",
              "Execução do contrato (art. 7º, V)",
            ],
            [
              "Avisos de prazos por e-mail",
              "Nome, e-mail, avisos",
              "Execução do contrato (art. 7º, V). Você pode desligar em Meu perfil",
            ],
            [
              "E-mails de confirmação e de troca de senha",
              "Nome, e-mail",
              "Execução do contrato (art. 7º, V)",
            ],
            [
              "Segurança e prevenção de abuso",
              "IP, navegador, tentativas de login",
              "Legítimo interesse (art. 7º, IX)",
            ],
          ]}
        />
        <p>
          <strong>Não vendemos, não alugamos e não compartilhamos seus dados para marketing.</strong> Eles também não são
          usados para treinar modelos de inteligência artificial. Se algum resultado for usado no texto do TCC, será
          apenas de forma agregada e anônima, sem identificar ninguém.
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    titulo: "Com quem compartilhamos",
    conteudo: (
      <>
        <p>
          Para funcionar, o FarmSense usa alguns serviços de terceiros. Eles atuam como <strong>operadores</strong>:
          tratam os dados só para prestar esse serviço ao projeto.
        </p>
        <ul>
          <li>
            <strong>Vercel</strong>: hospedagem do site e do sistema.
          </li>
          <li>
            <strong>Provedores de banco de dados (PostgreSQL) e de cache (Redis)</strong>: onde ficam guardados os dados
            da conta e da fazenda.
          </li>
          <li>
            <strong>Provedor de e-mail</strong>: entrega os e-mails de confirmação, de senha e de avisos.
          </li>
          <li>
            <strong>Google</strong>: só se você escolher entrar com a conta Google.
          </li>
          <li>
            <strong>Open-Meteo</strong>: recebe o nome do município da fazenda para devolver a previsão do tempo. Nenhum
            dado seu (nome, e-mail) é enviado.
          </li>
          <li>
            <strong>OpenStreetMap e Esri</strong>: fornecem as imagens do mapa. Como em qualquer site com mapa, o seu
            navegador pede as imagens direto a eles, que recebem o seu IP e a região visualizada.
          </li>
        </ul>
        <p>
          Alguns desses serviços guardam dados em servidores fora do Brasil, principalmente nos Estados Unidos. Essa
          transferência internacional (art. 33) é feita com empresas que adotam cláusulas contratuais e práticas de
          segurança compatíveis com a LGPD. Também podemos fornecer dados se uma autoridade exigir por lei ou ordem
          judicial.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    titulo: "Cookies e armazenamento no navegador",
    conteudo: (
      <>
        <p>
          O FarmSense usa <strong>apenas cookies essenciais</strong>, sem os quais o sistema não funciona. Por isso não há
          banner de cookies: não existe nada opcional para aceitar ou recusar.
        </p>
        <ul>
          <li>
            <strong>Sessão</strong>: mantém você conectado depois do login e expira sozinho.
          </li>
          <li>
            <strong>Preferência do menu</strong>: lembra se você deixou o menu lateral do painel aberto ou fechado.
          </li>
          <li>
            <strong>Rascunho de pesagens</strong>: guarda no seu próprio navegador (não no servidor) uma pesagem em
            andamento, para não perder o que foi digitado se a página fechar.
          </li>
        </ul>
        <p>Não usamos cookies de análise, de publicidade nem de redes sociais.</p>
      </>
    ),
  },
  {
    id: "retencao",
    titulo: "Por quanto tempo guardamos",
    conteudo: (
      <ul>
        <li>
          <strong>Enquanto a conta existir.</strong> Ao excluir a conta, todos os dados (conta, fazenda, rebanho,
          talhões, plantios, avisos e sessões) são apagados na hora, sem período de espera.
        </li>
        <li>
          <strong>Sessões</strong> expiram depois de 7 dias sem uso. <strong>Links de confirmação</strong> e de troca de
          senha valem por 1 hora.
        </li>
        <li>
          <strong>Cópias de segurança</strong> dos provedores podem manter dados apagados por alguns dias, até serem
          sobrescritas automaticamente.
        </li>
        <li>
          <strong>Fim do projeto.</strong> Por ser um TCC, o FarmSense pode ser encerrado. Nesse caso, avisaremos por
          e-mail com pelo menos 30 dias de antecedência, para você baixar seus dados, e depois apagaremos tudo.
        </li>
      </ul>
    ),
  },
  {
    id: "direitos",
    titulo: "Seus direitos",
    conteudo: (
      <>
        <p>A LGPD (art. 18) garante os direitos abaixo. A maioria você exerce sozinho, na hora, dentro do sistema:</p>
        <TabelaLegal
          colunas={["Direito", "O que significa", "Como fazer"]}
          linhas={[
            [
              "Acesso e portabilidade",
              "Saber quais dados temos e levar uma cópia",
              <>
                <Link href="/painel/perfil#seus-dados">Meu perfil → Baixar meus dados</Link> (arquivo JSON)
              </>,
            ],
            [
              "Correção",
              "Corrigir dados errados ou desatualizados",
              <>
                <Link href="/painel/perfil">Meu perfil</Link> e{" "}
                <Link href="/painel/configuracoes">Configurações</Link>
              </>,
            ],
            [
              "Eliminação",
              "Apagar a conta e tudo o que está nela",
              <>
                <Link href="/painel/perfil">Meu perfil → Excluir conta</Link>
              </>,
            ],
            [
              "Oposição",
              "Parar de receber avisos por e-mail",
              <>
                <Link href="/painel/perfil#notificacoes">Meu perfil → Avisos</Link>
              </>,
            ],
            [
              "Informação",
              "Saber com quem os dados são compartilhados",
              <>
                Nesta página, em <a href="#compartilhamento">Com quem compartilhamos</a>
              </>,
            ],
            [
              "Revisão e demais pedidos",
              "Qualquer outra dúvida ou solicitação",
              <>
                Pelo e-mail <a href={`mailto:${LEGAL.contato}`}>{LEGAL.contato}</a>, com resposta em até 15 dias
              </>,
            ],
          ]}
        />
        <p>
          Se achar que seus direitos não foram respeitados, você pode reclamar à Autoridade Nacional de Proteção de
          Dados (ANPD), em <a href="https://www.gov.br/anpd">gov.br/anpd</a>.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    titulo: "Como protegemos",
    conteudo: (
      <>
        <ul>
          <li>Toda a comunicação é criptografada (HTTPS).</li>
          <li>Senhas guardadas só como hash; tokens e links de acesso expiram.</li>
          <li>Confirmação de e-mail no cadastro e limite de tentativas de login.</li>
          <li>Cada conta só enxerga os dados da própria fazenda, conferido pelo servidor em toda requisição.</li>
          <li>Ao trocar a senha, os outros aparelhos conectados saem da conta.</li>
        </ul>
        <p>
          Nenhum sistema é 100% seguro. Se acontecer um incidente que possa trazer risco a você, avisaremos os afetados e
          a ANPD, como manda a lei (art. 48).
        </p>
      </>
    ),
  },
  {
    id: "menores",
    titulo: "Menores de idade",
    conteudo: (
      <p>
        O FarmSense é feito para produtores rurais e não é destinado a menores de 18 anos. Se soubermos que uma conta
        pertence a um menor sem autorização dos responsáveis, ela será excluída.
      </p>
    ),
  },
  {
    id: "alteracoes",
    titulo: "Mudanças nesta política",
    conteudo: (
      <p>
        Se esta política mudar, a data no topo da página será atualizada. Mudanças importantes, como um novo uso dos
        dados ou um novo serviço que os receba, serão avisadas por e-mail antes de valerem.
      </p>
    ),
  },
]

export default function PrivacidadePage() {
  return (
    <LegalPage
      titulo="Política de Privacidade"
      outra={{ label: "Termos de uso", href: "/termos" }}
      resumo={
        <>
          <p className="font-semibold text-foreground">Resumo em 30 segundos</p>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-foreground/85">
            <li>Coletamos só o necessário: sua conta e os dados da sua fazenda.</li>
            <li>Seus dados não são vendidos, nem usados para propaganda ou para treinar IA.</li>
            <li>Só usamos cookies essenciais, sem rastreamento.</li>
            <li>Você baixa ou apaga tudo quando quiser, direto em Meu perfil.</li>
          </ul>
        </>
      }
      secoes={secoes}
    />
  )
}
