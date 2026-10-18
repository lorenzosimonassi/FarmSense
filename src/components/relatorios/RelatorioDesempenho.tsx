"use client"

import { DataTable, Panel } from "@/components/painel/Panel"
import { COR_SLOT, Indicador, Indicadores, rotuloMes, TabelaRelatorio } from "@/components/relatorios/blocos"
import { GraficoBarras, GraficoLinhas } from "@/components/relatorios/graficos"
import { formatarGmd } from "@/shared/numeros"
import type { RelatorioDesempenho as Dados } from "@/shared/relatorios"

const gmdTexto = (valor: number) => valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })

export function RelatorioDesempenho({ dados }: { dados: Dados }) {
  const { resumo, gmdMinimo } = dados
  const rotulos = dados.pesoMensal.meses.map(rotuloMes)
  const minimo = gmdMinimo.toLocaleString("pt-BR")

  return (
    <div className="flex flex-col gap-6">
      <Indicadores>
        <Indicador rotulo="GMD médio" valor={resumo.gmdMedio} casas={2} unidade="kg/dia">
          {resumo.gmdMedio === null
            ? "Precisa de 2 pesagens do mesmo animal no período"
            : resumo.gmdMedio < gmdMinimo
              ? `Abaixo do mínimo de ${minimo} kg/dia`
              : `Acima do mínimo de ${minimo} kg/dia`}
        </Indicador>
        <Indicador rotulo="Animais avaliados" valor={resumo.avaliados}>
          {resumo.comPesagem - resumo.avaliados > 0
            ? `+${resumo.comPesagem - resumo.avaliados} com só 1 pesagem`
            : "Com 2 ou mais pesagens no período"}
        </Indicador>
        <Indicador rotulo="Abaixo do esperado" valor={resumo.abaixo}>
          {resumo.avaliados > 0 ? `${Math.round((resumo.abaixo / resumo.avaliados) * 100)}% dos avaliados` : "—"}
        </Indicador>
        <Indicador rotulo="Ganho médio" valor={resumo.ganhoMedioKg} casas={1} unidade="kg">
          Por animal, da primeira à última pesagem
        </Indicador>
      </Indicadores>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel
          title="Peso médio por lote"
          description="Média da última pesagem de cada animal no mês"
          className="xl:col-span-7"
          table={
            <DataTable
              columns={["Mês", ...dados.pesoMensal.series.map((s) => `${s.nome} (kg)`)]}
              rows={rotulos.map((rotulo, i) => [rotulo, ...dados.pesoMensal.series.map((s) => s.valores[i] ?? "—")])}
            />
          }
        >
          <GraficoLinhas
            rotulos={rotulos}
            series={dados.pesoMensal.series.map((serie) => ({ nome: serie.nome, cor: COR_SLOT[serie.slot], valores: serie.valores }))}
            unidade="kg"
            casas={1}
          />
        </Panel>

        {dados.porLote.length > 0 && (
          <Panel
            title="GMD por lote"
            description={`Lotes abaixo de ${minimo} kg/dia em destaque`}
            className="xl:col-span-5"
            table={
              <DataTable
                columns={["Lote", "GMD médio", "Avaliados"]}
                rows={dados.porLote.map((l) => [l.lote, formatarGmd(l.gmdMedio), l.avaliados])}
              />
            }
          >
            <GraficoBarras
              dados={dados.porLote.map((lote) => ({
                nome: lote.lote,
                valor: lote.gmdMedio,
                // Cor de status (reservada): aqui significa "abaixo do esperado", e a linha de referência diz isso em texto
                cor: lote.gmdMedio < gmdMinimo ? "var(--color-status-warning)" : undefined,
              }))}
              nome="GMD médio"
              unidade="kg/dia"
              casas={2}
              referencia={{ valor: gmdMinimo, rotulo: `Mínimo ${minimo}`, cor: "var(--color-status-warning)" }}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {dados.porLote.some((lote) => lote.gmdMedio < gmdMinimo)
                ? `Abaixo do mínimo: ${dados.porLote
                    .filter((lote) => lote.gmdMedio < gmdMinimo)
                    .map((lote) => `${lote.lote} (${gmdTexto(lote.gmdMedio)} kg/dia)`)
                    .join(", ")}`
                : "Todos os lotes no esperado ou acima."}
            </p>
          </Panel>
        )}
      </div>

      <TabelaRelatorio tabela={dados.tabela} titulo="Desempenho por animal" />
    </div>
  )
}
