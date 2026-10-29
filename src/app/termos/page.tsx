import type { Metadata } from "next"
import Link from "next/link"

import { LegalPage, type SecaoLegal } from "@/components/legal/LegalPage"
import { LEGAL } from "@/shared/legal"

export const metadata: Metadata = {
  title: "Termos de uso | FarmSense",
  description: "As regras para usar o FarmSense, um projeto acadêmico de gestão rural.",
}

const secoes: SecaoLegal[] = [
  {
    id: "servico",
    titulo: "O que é o FarmSense",
    conteudo: (
      <>
        <p>
          O FarmSense é um sistema de gestão rural para pecuária e agricultura, desenvolvido como Trabalho de Conclusão
          de Curso por <strong>{LEGAL.responsavel}</strong>, na {LEGAL.instituicao}. O uso é <strong>gratuito</strong>.
        </p>
        <p>
          Ao criar uma conta, você concorda com estes termos e com a{" "}
          <Link href="/privacidade">Política de Privacidade</Link>. Se não concordar, não use o sistema.
        </p>
      </>
    ),
  },
  {
    id: "conta",
    titulo: "Sua conta",
    conteudo: (
      <ul>
        <li>Você precisa ter 18 anos ou mais e informar dados verdadeiros no cadastro.</li>
        <li>
          A senha é pessoal. Não a compartilhe e, se suspeitar de acesso indevido, troque-a em Meu perfil: os outros
          aparelhos saem da conta na hora.
        </li>
        <li>Cada conta corresponde a uma pessoa e a uma fazenda.</li>
      </ul>
    ),
  },
  {
    id: "uso",
    titulo: "Uso permitido",
    conteudo: (
      <>
        <p>Use o FarmSense para organizar a sua propriedade. Não é permitido:</p>
        <ul>
          <li>tentar acessar dados de outras contas ou burlar a segurança do sistema;</li>
          <li>sobrecarregar o serviço com acessos automatizados (robôs, scripts em massa);</li>
          <li>cadastrar conteúdo ilegal ou dados de terceiros sem autorização.</li>
        </ul>
        <p>Contas que descumprirem essas regras podem ser suspensas ou excluídas.</p>
      </>
    ),
  },
  {
    id: "seus-dados",
    titulo: "Seus dados são seus",
    conteudo: (
      <p>
        Tudo o que você registra continua sendo seu. O projeto usa esses dados só para fazer o sistema funcionar, como
        descrito na <Link href="/privacidade">Política de Privacidade</Link>. Você pode baixar uma cópia completa ou
        apagar tudo a qualquer momento em <Link href="/painel/perfil">Meu perfil</Link>.
      </p>
    ),
  },
  {
    id: "apoio",
    titulo: "Apoio à decisão, não substituto de profissional",
    conteudo: (
      <p>
        Indicadores, relatórios, previsão do tempo e avisos de prazo servem para <strong>ajudar</strong> você a decidir.
        Eles dependem dos dados que você informa e de serviços externos, e podem ter falhas. Não substituem a orientação
        de médico-veterinário, engenheiro-agrônomo ou outro profissional habilitado, principalmente em decisões
        sanitárias e no uso de medicamentos e defensivos.
      </p>
    ),
  },
  {
    id: "disponibilidade",
    titulo: "Disponibilidade e garantias",
    conteudo: (
      <>
        <p>
          Por ser um projeto acadêmico, o FarmSense é oferecido{" "}
          <strong>&ldquo;no estado em que se encontra&rdquo;</strong>, sem garantia de funcionamento contínuo. Ele pode ficar fora do ar, mudar funcionalidades ou ser encerrado.
        </p>
        <p>
          Se o projeto for encerrado, você será avisado por e-mail com pelo menos 30 dias de antecedência para baixar seus
          dados. Recomendamos guardar, de tempos em tempos, uma cópia pelo botão Baixar meus dados.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidade",
    titulo: "Limitação de responsabilidade",
    conteudo: (
      <p>
        Dentro do que a lei permite, o projeto não responde por prejuízos decorrentes de decisões tomadas com base nas
        informações do sistema, de dados informados de forma incorreta ou de indisponibilidade do serviço. Nada nestes
        termos afasta os direitos que o Código de Defesa do Consumidor e a LGPD garantem a você.
      </p>
    ),
  },
  {
    id: "encerramento",
    titulo: "Encerrar a conta",
    conteudo: (
      <p>
        Você pode excluir sua conta quando quiser, em <Link href="/painel/perfil">Meu perfil → Excluir conta</Link>. A
        exclusão é imediata e apaga todos os dados, sem como recuperar.
      </p>
    ),
  },
  {
    id: "mudancas",
    titulo: "Mudanças e lei aplicável",
    conteudo: (
      <>
        <p>
          Estes termos podem mudar; a data no topo mostra a versão atual, e mudanças importantes serão avisadas por e-mail.
          Valem as leis do Brasil.
        </p>
        <p>
          Dúvidas: <a href={`mailto:${LEGAL.contato}`}>{LEGAL.contato}</a>.
        </p>
      </>
    ),
  },
]

export default function TermosPage() {
  return (
    <LegalPage
      titulo="Termos de uso"
      outra={{ label: "Política de Privacidade", href: "/privacidade" }}
      resumo={
        <>
          <p className="font-semibold text-foreground">Resumo em 30 segundos</p>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-foreground/85">
            <li>O FarmSense é gratuito e faz parte de um TCC.</li>
            <li>Os dados que você registra são seus: baixe ou apague quando quiser.</li>
            <li>Os indicadores ajudam a decidir, mas não substituem veterinário ou agrônomo.</li>
            <li>Por ser acadêmico, pode sair do ar; avisamos antes de qualquer encerramento.</li>
          </ul>
        </>
      }
      secoes={secoes}
    />
  )
}
