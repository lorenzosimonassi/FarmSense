"use client"

import { DataTable, Panel } from "@/components/painel/Panel"
import { COR_SLOT, Indicador, Indicadores, MedidorPartes, rotuloMes, TabelaRelatorio } from "@/components/relatorios/blocos"
import { GraficoArea, GraficoBarras } from "@/components/relatorios/graficos"
import { formatarKg } from "@/shared/numeros"
import type { RelatorioRebanho as Dados } from "@/shared/relatorios"

export function RelatorioRebanho({ dados }: { dados: Dados }) {
  const { resumo } = dados
  const saldo = resumo.ativosNoFim - resumo.ativosNoInicio
  const evolucao = dados.evolucao.map((ponto) => ({ rotulo: rotuloMes(ponto.mes), valor: ponto.ativos }))

  return (
    <div className="flex flex-col gap-6">
      <Indicadores>
        <Indicador rotulo="Animais no fim do período" valor={resumo.ativosNoFim}>
          {saldo === 0 ? "Mesmo número do início" : `${saldo > 0 ? "+" : "−"}${Math.abs(saldo)} desde o início (${resumo.ativosNoInicio})`}
        </Indicador>
        <Indicador rotulo="Entradas" valor={resumo.entradas}>
          Animais cadastrados no período
        </Indicador>
        <Indicador rotulo="Saídas" valor={resumo.vendidos + resumo.mortos}>
          {resumo.vendidos} {resumo.vendidos === 1 ? "venda" : "vendas"} · {resumo.mortos} {resumo.mortos === 1 ? "morte" : "mortes"}
        </Indicador>
        <Indicador rotulo="Lotes com animais" valor={dados.porLote.length}>
          {dados.porLote[0] ? `Maior: ${dados.porLote[0].lote} (${dados.porLote[0].ativos})` : "Nenhum animal ativo"}
        </Indicador>
      </Indicadores>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel
          title="Animais no rebanho"
          description="Ativos no fim de cada mês"
          className="xl:col-span-7"
          table={<DataTable columns={["Mês", "Animais"]} rows={dados.evolucao.map((p) => [rotuloMes(p.mes), p.ativos])} />}
        >
          <GraficoArea dados={evolucao} nome="Animais" unidade="animais" />
        </Panel>

        <div className="flex flex-col gap-4 xl:col-span-5">
          <Panel title="Machos e fêmeas" description="Rebanho ativo no fim do período">
            <MedidorPartes
              rotulo="Composição por sexo"
              partes={[
                { nome: "Machos", valor: resumo.machos, cor: COR_SLOT[1] },
                { nome: "Fêmeas", valor: resumo.femeas, cor: COR_SLOT[3] },
              ]}
            />
          </Panel>

          {dados.porLote.length > 0 && (
            <Panel
              title="Animais por lote"
              description="Ativos no fim do período"
              table={
                <DataTable
                  columns={["Lote", "Animais", "Peso médio"]}
                  rows={dados.porLote.map((l) => [l.lote, l.ativos, l.pesoMedio === null ? "—" : formatarKg(l.pesoMedio)])}
                />
              }
            >
              <GraficoBarras dados={dados.porLote.map((l) => ({ nome: l.lote, valor: l.ativos }))} nome="Animais" unidade="animais" />
            </Panel>
          )}
        </div>
      </div>

      <TabelaRelatorio tabela={dados.tabela} titulo="Animais no período" />
    </div>
  )
}
