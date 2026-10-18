"use client"

import { CircleCheck, Clock, TriangleAlert } from "lucide-react"

import { DataTable, Panel } from "@/components/painel/Panel"
import { COR_SLOT, Indicador, Indicadores, MedidorPartes, rotuloMes, TabelaRelatorio } from "@/components/relatorios/blocos"
import { GraficoBarras, GraficoColunasEmpilhadas } from "@/components/relatorios/graficos"
import type { RelatorioSanidade as Dados } from "@/shared/relatorios"
import { TIPO_APLICACAO_LABEL, TIPOS_APLICACAO } from "@/shared/schemas/aplicacao"

// Tipo de aplicação → slot fixo da paleta (a ordem dos tipos nunca muda, então a cor também não)
const SERIES = TIPOS_APLICACAO.map((tipo, i) => ({
  chave: tipo,
  nome: TIPO_APLICACAO_LABEL[tipo],
  cor: COR_SLOT[(i + 1) as 1 | 2 | 3 | 4],
}))

export function RelatorioSanidade({ dados }: { dados: Dados }) {
  const { resumo } = dados
  // Só mostra os tipos que aparecem no período (cada um mantém sua cor)
  const series = SERIES.filter((serie) => dados.porMes.some((mes) => mes[serie.chave] > 0))
  const porMes = dados.porMes.map((mes) => ({ ...mes, rotulo: rotuloMes(mes.mes) }))

  return (
    <div className="flex flex-col gap-6">
      <Indicadores>
        <Indicador rotulo="Aplicações" valor={resumo.aplicacoes}>
          {resumo.produtos === 1 ? "1 produto" : `${resumo.produtos} produtos`}
        </Indicador>
        <Indicador rotulo="Animais tratados" valor={resumo.animaisTratados}>
          Receberam ao menos uma aplicação
        </Indicador>
        <Indicador rotulo="Reforços atrasados hoje" valor={resumo.atrasados}>
          {resumo.atrasados > 0 ? "Animais com dose vencida" : "Nenhum animal atrasado"}
        </Indicador>
        <Indicador rotulo="Vencem em 30 dias" valor={resumo.vencendo}>
          Animais com reforço próximo
        </Indicador>
      </Indicadores>

      <Panel title="Situação dos reforços hoje" description="Animais ativos, pela pior situação entre os produtos aplicados">
        <MedidorPartes
          rotulo="Situação sanitária"
          partes={[
            {
              nome: "Atrasados",
              valor: resumo.atrasados,
              cor: "var(--color-status-critical)",
              icone: <TriangleAlert className="size-4 text-status-critical" aria-hidden />,
            },
            {
              nome: "Vencem em 30 dias",
              valor: resumo.vencendo,
              cor: "var(--color-status-warning)",
              icone: <Clock className="size-4 text-status-warning" aria-hidden />,
            },
            {
              nome: "Em dia",
              valor: resumo.emDia,
              cor: "var(--color-status-good)",
              icone: <CircleCheck className="size-4 text-status-good" aria-hidden />,
            },
          ]}
        />
      </Panel>

      {resumo.aplicacoes > 0 && (
        <div className="grid gap-4 xl:grid-cols-12">
          <Panel
            title="Aplicações por mês"
            description="Por tipo de aplicação"
            className="xl:col-span-7"
            table={
              <DataTable
                columns={["Mês", ...SERIES.map((s) => s.nome)]}
                rows={porMes.map((mes) => [mes.rotulo, ...SERIES.map((s) => mes[s.chave])])}
              />
            }
          >
            <GraficoColunasEmpilhadas dados={porMes} series={series} unidade="aplicações" />
          </Panel>

          <Panel
            title="Produtos mais aplicados"
            description="Número de aplicações no período"
            className="xl:col-span-5"
            table={<DataTable columns={["Produto", "Aplicações"]} rows={dados.porProduto.map((p) => [p.produto, p.aplicacoes])} />}
          >
            <GraficoBarras
              dados={dados.porProduto.map((produto) => ({ nome: produto.produto, valor: produto.aplicacoes }))}
              nome="Aplicações"
              unidade="aplicações"
            />
          </Panel>
        </div>
      )}

      <TabelaRelatorio tabela={dados.tabela} titulo="Aplicações no período" />
    </div>
  )
}
