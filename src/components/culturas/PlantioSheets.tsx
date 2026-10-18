"use client"

import { useState } from "react"

import { ColheitaForm } from "@/components/culturas/ColheitaForm"
import { PlantioForm } from "@/components/culturas/PlantioForm"
import { FormSheet } from "@/components/rebanho/ui"
import { formatarData } from "@/shared/datas"
import type { Plantio } from "@/shared/schemas/plantio"

type Aberto =
  | { modo: "novo"; talhaoId?: string }
  | { modo: "editar"; plantio: Plantio }
  | { modo: "colher"; plantio: Plantio }
  | null

// Os três formulários de plantio em painéis laterais, para qualquer tela que lista plantios
export function usePlantioSheets({ novoAberto = false, onNovoSalvo }: { novoAberto?: boolean; onNovoSalvo?: () => void } = {}) {
  const [aberto, setAberto] = useState<Aberto>(novoAberto ? { modo: "novo" } : null)
  // Mantém o conteúdo durante a animação de saída do Sheet
  const [ultimo, setUltimo] = useState<Exclude<Aberto, null> | null>(aberto)

  function abrir(proximo: Exclude<Aberto, null>) {
    setAberto(proximo)
    setUltimo(proximo)
  }

  const fechar = () => setAberto(null)
  const atual = aberto ?? ultimo

  const sheets = (
    <>
      <FormSheet
        open={aberto?.modo === "novo"}
        onOpenChange={(open) => !open && fechar()}
        title="Novo plantio"
        description="Lance o que foi (ou vai ser) plantado em cada talhão. A colheita você registra depois."
      >
        {atual?.modo === "novo" && (
          <PlantioForm
            key={atual.talhaoId ?? "novo"}
            talhaoInicial={atual.talhaoId}
            onSaved={(_, { outro }) => {
              onNovoSalvo?.()
              if (!outro) fechar()
            }}
          />
        )}
      </FormSheet>

      <FormSheet
        open={aberto?.modo === "editar"}
        onOpenChange={(open) => !open && fechar()}
        title={atual?.modo === "editar" ? `${atual.plantio.cultura} em ${atual.plantio.talhao.nome}` : "Editar plantio"}
        description={atual?.modo === "editar" ? `Plantado em ${formatarData(atual.plantio.dataPlantio)}` : undefined}
      >
        {atual?.modo === "editar" && (
          <PlantioForm key={atual.plantio.id} plantio={atual.plantio} onSaved={fechar} onDeleted={fechar} />
        )}
      </FormSheet>

      <FormSheet
        open={aberto?.modo === "colher"}
        onOpenChange={(open) => !open && fechar()}
        title="Registrar colheita"
        description={atual?.modo === "colher" ? `${atual.plantio.cultura} em ${atual.plantio.talhao.nome}` : undefined}
      >
        {atual?.modo === "colher" && <ColheitaForm key={atual.plantio.id} plantio={atual.plantio} onSaved={fechar} />}
      </FormSheet>
    </>
  )

  return {
    novo: (talhaoId?: string) => abrir({ modo: "novo", talhaoId }),
    editar: (plantio: Plantio) => abrir({ modo: "editar", plantio }),
    colher: (plantio: Plantio) => abrir({ modo: "colher", plantio }),
    sheets,
  }
}
