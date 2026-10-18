"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import { CulturaPonto } from "@/components/culturas/ui"
import { DataTable, Panel } from "@/components/painel/Panel"
import { Indicador, Indicadores, NumeroAnimado, TabelaRelatorio } from "@/components/relatorios/blocos"
import { GraficoBarras } from "@/components/relatorios/graficos"
import { cn } from "@/lib/utils"
import { formatarHa } from "@/shared/geo"
import { formatarProdutividade, formatarQuantidade, UNIDADE_CURTA } from "@/shared/plantio"
import type { RelatorioProducao as Dados } from "@/shared/relatorios"

export function RelatorioProducao({ dados }: { dados: Dados }) {
  const { resumo } = dados
  const comProducao = dados.porCultura.filter((cultura) => cultura.produtividade !== null)
  const [escolhida, setEscolhida] = useState(0)
  const atual = comProducao[Math.min(escolhida, comProducao.length - 1)]
  const principal = comProducao[0]

  return (
    <div className="flex flex-col gap-6">
      <Indicadores>
        <Indicador rotulo="Colheitas" valor={resumo.colheitas}>
          {resumo.semQuantidade > 0 ? `${resumo.semQuantidade} sem quantidade registrada` : "Todas com quantidade"}
        </Indicador>
        <Indicador rotulo="Área colhida" valor={resumo.areaColhidaHa} casas={1} unidade="ha">
          {dados.porCultura.length === 1 ? "1 cultura" : `${dados.porCultura.length} culturas`}
        </Indicador>
        <Indicador
          rotulo={principal ? `Produção de ${principal.cultura.toLowerCase()}` : "Produção"}
          valor={principal?.quantidade ?? null}
          unidade={principal?.unidade ? UNIDADE_CURTA[principal.unidade] : undefined}
        >
          {principal ? `Em ${formatarHa(principal.areaHa)}` : "Registre a quantidade colhida"}
        </Indicador>
        <Indicador
          rotulo={principal ? `Produtividade de ${principal.cultura.toLowerCase()}` : "Produtividade"}
          valor={principal?.produtividade ?? null}
          casas={1}
          unidade={principal?.unidade ? `${UNIDADE_CURTA[principal.unidade]}/ha` : undefined}
        >
          Total colhido ÷ área colhida
        </Indicador>
      </Indicadores>

      {/* Cada cultura com sua unidade: sacas e toneladas não dividem um eixo, então são números lado a lado */}
      <section aria-label="Por cultura" className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight">Por cultura</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dados.porCultura.map((cultura, i) => {
            const indice = comProducao.indexOf(cultura)
            const selecionavel = indice >= 0
            const ativa = selecionavel && cultura === atual
            return (
              <motion.li
                key={`${cultura.cultura}-${cultura.unidade}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
              >
                <button
                  type="button"
                  disabled={!selecionavel}
                  aria-pressed={ativa}
                  onClick={() => setEscolhida(indice)}
                  className={cn(
                    "flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/25 enabled:cursor-pointer",
                    ativa ? "border-primary shadow-md" : "border-border enabled:hover:border-primary/30"
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <CulturaPonto cultura={cultura.cultura} />
                    {cultura.cultura}
                  </span>
                  <span className="text-2xl leading-none font-semibold tracking-tight">
                    {cultura.produtividade !== null && cultura.unidade ? (
                      <>
                        <NumeroAnimado valor={cultura.produtividade} casas={1} />
                        <span className="ml-1 text-sm font-medium text-muted-foreground">{UNIDADE_CURTA[cultura.unidade]}/ha</span>
                      </>
                    ) : (
                      <span className="text-base font-medium text-muted-foreground">Sem quantidade</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[
                      cultura.quantidade !== null && cultura.unidade && formatarQuantidade(cultura.quantidade, cultura.unidade),
                      formatarHa(cultura.areaHa),
                      cultura.colheitas === 1 ? "1 colheita" : `${cultura.colheitas} colheitas`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </section>

      {atual && atual.unidade && (
        <Panel
          title={`Produtividade de ${atual.cultura.toLowerCase()} por talhão`}
          description={
            comProducao.length > 1
              ? `Escolha outra cultura nos cards acima · média ${formatarProdutividade(atual.produtividade!, atual.unidade)}`
              : `Média ponderada pela área: ${formatarProdutividade(atual.produtividade!, atual.unidade)}`
          }
          table={
            <DataTable
              columns={["Talhão", "Área", `Produtividade (${UNIDADE_CURTA[atual.unidade]}/ha)`]}
              rows={atual.porTalhao.map((t) => [t.talhao, formatarHa(t.areaHa), t.produtividade.toLocaleString("pt-BR", { maximumFractionDigits: 1 })])}
            />
          }
        >
          <GraficoBarras
            key={atual.cultura}
            dados={atual.porTalhao.map((talhao) => ({ nome: talhao.talhao, valor: talhao.produtividade }))}
            nome={atual.cultura}
            unidade={`${UNIDADE_CURTA[atual.unidade]}/ha`}
            casas={1}
            referencia={{
              valor: atual.produtividade!,
              rotulo: `Média ${atual.produtividade!.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}`,
            }}
          />
        </Panel>
      )}

      <TabelaRelatorio tabela={dados.tabela} titulo="Colheitas no período" />
    </div>
  )
}
