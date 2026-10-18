"use client"

import { useState } from "react"
import { Loader2, Wheat } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { toValues } from "@/components/culturas/PlantioForm"
import { OpcoesField } from "@/components/rebanho/campos"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useSalvarPlantio } from "@/lib/api/hooks/plantios"
import { fieldErrors } from "@/lib/auth/schemas"
import { hojeISO } from "@/shared/datas"
import { formatarHa } from "@/shared/geo"
import { parseDecimal } from "@/shared/numeros"
import { culturaConhecida, formatarProdutividade, produtividade, UNIDADE_LABEL, UNIDADES, type Unidade } from "@/shared/plantio"
import { plantioSchema, type Plantio } from "@/shared/schemas/plantio"

const UNIDADE_OPTIONS = UNIDADES.map((value) => ({ value, label: UNIDADE_LABEL[value] }))

// Encerra o ciclo: data, quanto saiu e, com a área do talhão, a produtividade na hora
export function ColheitaForm({ plantio, onSaved }: { plantio: Plantio; onSaved: () => void }) {
  const hoje = hojeISO()
  const [dataColheita, setDataColheita] = useState(
    plantio.previsaoColheita && plantio.previsaoColheita < hoje ? plantio.previsaoColheita : hoje
  )
  const [quantidade, setQuantidade] = useState("")
  const [unidade, setUnidade] = useState<Unidade | "">(culturaConhecida(plantio.cultura)?.unidade ?? "SC")
  const [errors, setErrors] = useState<Partial<Record<"dataColheita" | "quantidadeColhida" | "unidade", string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const salvar = useSalvarPlantio(plantio.id)

  // Mesmo critério do servidor: "1.300" em sacas é milhar
  const numero = parseDecimal(/^\d{1,3}(\.\d{3})+$/.test(quantidade.trim()) ? quantidade.replace(/\./g, "") : quantidade)
  const estimativa =
    numero !== undefined && Number.isFinite(numero) && numero > 0 && unidade
      ? produtividade(numero, plantio.talhao.areaHa)
      : null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = plantioSchema.safeParse({ ...toValues(plantio), dataColheita, quantidadeColhida: quantidade, unidade })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    try {
      await salvar.mutateAsync(parsed.data)
      onSaved()
    } catch (error) {
      if (error instanceof ApiError && error.fields) setErrors(error.fields)
      setFormError(error instanceof ApiError ? error.message : "Não foi possível salvar. Tente novamente.")
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <FormField
        label="Data da colheita"
        name="dataColheita"
        type="date"
        min={plantio.dataPlantio}
        max={hoje}
        value={dataColheita}
        onChange={(event) => setDataColheita(event.target.value)}
        error={errors.dataColheita}
      />
      <FormField
        label="Quantidade colhida (opcional)"
        name="quantidadeColhida"
        inputMode="decimal"
        placeholder="1.300"
        hint="Sem a quantidade, o plantio fica como colhido, mas sem produtividade."
        value={quantidade}
        onChange={(event) => setQuantidade(event.target.value)}
        error={errors.quantidadeColhida}
      />
      <OpcoesField
        legend="Unidade"
        name="unidade"
        options={UNIDADE_OPTIONS}
        value={unidade}
        error={errors.unidade}
        onChange={setUnidade}
      />

      <div className="flex items-center gap-3 rounded-xl bg-accent p-4" aria-live="polite">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
          <Wheat className="size-5" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="text-muted-foreground">Produtividade em {formatarHa(plantio.talhao.areaHa)}</p>
          <p className="text-lg font-semibold tabular-nums">
            {estimativa !== null && unidade ? formatarProdutividade(estimativa, unidade) : "—"}
          </p>
        </div>
      </div>

      <Button type="submit" disabled={salvar.isPending} className="sm:self-end">
        {salvar.isPending && <Loader2 className="animate-spin" />}
        Registrar colheita
      </Button>
    </form>
  )
}
