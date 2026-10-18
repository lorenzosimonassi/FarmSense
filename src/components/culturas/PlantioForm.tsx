"use client"

import { useState } from "react"
import { Loader2, Sparkles, Trash2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { CulturaPonto } from "@/components/culturas/ui"
import { campoClasse, OpcoesField, TextareaField } from "@/components/rebanho/campos"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ApiError } from "@/lib/api/client"
import { useCulturasUsadas, useExcluirPlantio, useSalvarPlantio } from "@/lib/api/hooks/plantios"
import { useTalhoes } from "@/lib/api/hooks/talhoes"
import { fieldErrors, type FieldErrors } from "@/lib/auth/schemas"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO, isDataISO } from "@/shared/datas"
import { formatarHa } from "@/shared/geo"
import { CULTURAS, culturaConhecida, somarDias, STATUS_LABEL, UNIDADE_LABEL, UNIDADES, type Unidade } from "@/shared/plantio"
import { plantioSchema, type Plantio } from "@/shared/schemas/plantio"

type Values = {
  talhaoId: string
  cultura: string
  variedade: string
  dataPlantio: string
  previsaoColheita: string
  dataColheita: string
  quantidadeColhida: string
  unidade: Unidade | ""
  observacoes: string
}

const UNIDADE_OPTIONS = UNIDADES.map((value) => ({ value, label: UNIDADE_LABEL[value] }))
const ATALHOS = ["Soja", "Milho", "Milho safrinha", "Feijão", "Café", "Trigo"]

function quantidadeTexto(valor: number | null) {
  return valor === null ? "" : valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
}

export function toValues(plantio: Plantio): Values {
  return {
    talhaoId: plantio.talhao.id,
    cultura: plantio.cultura,
    variedade: plantio.variedade ?? "",
    dataPlantio: plantio.dataPlantio,
    previsaoColheita: plantio.previsaoColheita ?? "",
    dataColheita: plantio.dataColheita ?? "",
    quantidadeColhida: quantidadeTexto(plantio.quantidadeColhida),
    unidade: plantio.unidade ?? "",
    observacoes: plantio.observacoes ?? "",
  }
}

export function PlantioForm({
  plantio,
  talhaoInicial,
  onSaved,
  onDeleted,
}: {
  // Sem plantio: cadastro novo (opcionalmente já no talhão escolhido); com plantio: edição
  plantio?: Plantio
  talhaoInicial?: string
  onSaved: (plantio: Plantio, opcoes: { outro: boolean }) => void
  onDeleted?: () => void
}) {
  const [values, setValues] = useState<Values>(
    plantio
      ? toValues(plantio)
      : {
          talhaoId: talhaoInicial ?? "",
          cultura: "",
          variedade: "",
          dataPlantio: hojeISO(),
          previsaoColheita: "",
          dataColheita: "",
          quantidadeColhida: "",
          unidade: "",
          observacoes: "",
        }
  )
  const [errors, setErrors] = useState<FieldErrors<Values>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [salvo, setSalvo] = useState<string | null>(null)

  const salvar = useSalvarPlantio(plantio?.id)
  const { data: lista } = useTalhoes()
  const { data: usadas = [] } = useCulturasUsadas()
  const talhoes = lista?.items ?? []
  const talhaoEscolhido = talhoes.find((talhao) => talhao.id === values.talhaoId)
  const ocupacao = talhaoEscolhido?.plantioAtual?.id !== plantio?.id ? talhaoEscolhido?.plantioAtual : null

  // Atalhos: primeiro o que a fazenda já planta, completando com as culturas mais comuns
  const atalhos = [...new Set([...usadas, ...ATALHOS])].slice(0, 6)
  const sugestoes = [...new Set([...usadas, ...CULTURAS.map((cultura) => cultura.nome)])]
  const conhecida = culturaConhecida(values.cultura)
  const previsaoSugerida =
    conhecida && isDataISO(values.dataPlantio) ? somarDias(values.dataPlantio, conhecida.cicloDias) : null
  const colhido = Boolean(plantio?.dataColheita)

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSalvo(null)
  }

  async function enviar(outro: boolean) {
    setFormError(null)
    const parsed = plantioSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    try {
      const salvoAgora = await salvar.mutateAsync(parsed.data)
      onSaved(salvoAgora, { outro })
      if (outro) {
        // Lançamento da safra talhão a talhão: cultura e datas costumam se repetir, só troca o talhão
        setValues((current) => ({ ...current, talhaoId: "" }))
        setSalvo(`${salvoAgora.cultura} em ${salvoAgora.talhao.nome}`)
        document.getElementById("talhaoId")?.focus()
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields) setErrors(error.fields)
        setFormError(error.code === "BUSINESS_RULE" ? null : error.message)
      } else {
        setFormError("Não foi possível salvar. Tente novamente.")
      }
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        enviar(false)
      }}
      className="flex flex-col gap-5"
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      {salvo && <FormAlert variant="success">{salvo} lançado. Escolha o próximo talhão.</FormAlert>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="talhaoId">Talhão</Label>
        <select
          id="talhaoId"
          value={values.talhaoId}
          onChange={(event) => set("talhaoId", event.target.value)}
          aria-invalid={Boolean(errors.talhaoId)}
          aria-describedby={errors.talhaoId ? "talhaoId-error" : ocupacao ? "talhaoId-hint" : undefined}
          className={cn(campoClasse, "h-11 pr-8 sm:h-10")}
        >
          <option value="">Escolha o talhão</option>
          {talhoes.map((talhao) => (
            <option key={talhao.id} value={talhao.id}>
              {talhao.nome} · {formatarHa(talhao.areaHa)}
              {talhao.plantioAtual && talhao.plantioAtual.id !== plantio?.id
                ? ` · ${talhao.plantioAtual.cultura} (${STATUS_LABEL[talhao.plantioAtual.status].toLowerCase()})`
                : ""}
            </option>
          ))}
        </select>
        {errors.talhaoId ? (
          <p id="talhaoId-error" className="text-[13px] text-destructive">
            {errors.talhaoId}
          </p>
        ) : (
          ocupacao && (
            <p id="talhaoId-hint" className="text-[13px] text-muted-foreground">
              Hoje com {ocupacao.cultura}
              {ocupacao.previsaoColheita ? `, colheita prevista para ${formatarData(ocupacao.previsaoColheita)}` : ", sem previsão de colheita"}.
              Planeje o novo ciclo para depois disso.
            </p>
          )
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Cultura"
            name="cultura"
            list="culturas-sugeridas"
            autoComplete="off"
            placeholder="Soja"
            value={values.cultura}
            onChange={(event) => set("cultura", event.target.value)}
            error={errors.cultura}
          />
          <FormField
            label="Variedade ou cultivar (opcional)"
            name="variedade"
            autoComplete="off"
            placeholder="BRS 1010 IPRO"
            value={values.variedade}
            onChange={(event) => set("variedade", event.target.value)}
            error={errors.variedade}
          />
        </div>
        <datalist id="culturas-sugeridas">
          {sugestoes.map((nome) => (
            <option key={nome} value={nome} />
          ))}
        </datalist>
        <div className="flex flex-wrap gap-1.5" aria-label="Culturas comuns">
          {atalhos.map((nome) => (
            <button
              key={nome}
              type="button"
              aria-pressed={values.cultura === nome}
              onClick={() => set("cultura", nome)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-9",
                values.cultura === nome
                  ? "border-primary bg-accent text-primary"
                  : "border-input text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              <CulturaPonto cultura={nome} />
              {nome}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Data de plantio"
          name="dataPlantio"
          type="date"
          hint="Pode ser futura: o plantio fica como planejado."
          value={values.dataPlantio}
          onChange={(event) => set("dataPlantio", event.target.value)}
          error={errors.dataPlantio}
        />
        <div className="flex flex-col gap-2">
          <FormField
            label="Previsão de colheita (opcional)"
            name="previsaoColheita"
            type="date"
            min={values.dataPlantio || undefined}
            value={values.previsaoColheita}
            onChange={(event) => set("previsaoColheita", event.target.value)}
            error={errors.previsaoColheita}
          />
          {previsaoSugerida && previsaoSugerida !== values.previsaoColheita && (
            <button
              type="button"
              onClick={() => set("previsaoColheita", previsaoSugerida)}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start text-left text-[13px] font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              <Sparkles className="size-3.5 shrink-0" />
              Usar {formatarData(previsaoSugerida)} (ciclo médio de {conhecida!.cicloDias} dias)
            </button>
          )}
        </div>
      </div>

      {colhido && (
        <fieldset className="flex flex-col gap-5 rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Colheita</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Data da colheita"
              name="dataColheita"
              type="date"
              min={values.dataPlantio || undefined}
              max={hojeISO()}
              value={values.dataColheita}
              onChange={(event) => set("dataColheita", event.target.value)}
              error={errors.dataColheita}
            />
            <FormField
              label="Quantidade colhida (opcional)"
              name="quantidadeColhida"
              inputMode="decimal"
              value={values.quantidadeColhida}
              onChange={(event) => set("quantidadeColhida", event.target.value)}
              error={errors.quantidadeColhida}
            />
          </div>
          <OpcoesField
            legend="Unidade"
            name="unidade"
            options={UNIDADE_OPTIONS}
            value={values.unidade}
            error={errors.unidade}
            onChange={(unidade) => set("unidade", unidade)}
          />
        </fieldset>
      )}

      <TextareaField
        label="Observações (opcional)"
        name="observacoes"
        placeholder="Adubação de base, espaçamento, população…"
        value={values.observacoes}
        onChange={(event) => set("observacoes", event.target.value)}
        error={errors.observacoes}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {plantio && onDeleted && <ExcluirPlantio plantio={plantio} onDeleted={onDeleted} />}
        {!plantio && (
          <Button type="button" variant="secondary" disabled={salvar.isPending} onClick={() => enviar(true)}>
            Salvar e lançar outro talhão
          </Button>
        )}
        <Button type="submit" disabled={salvar.isPending} className="sm:ml-auto">
          {salvar.isPending && <Loader2 className="animate-spin" />}
          {plantio ? "Salvar alterações" : "Lançar plantio"}
        </Button>
      </div>
    </form>
  )
}

function ExcluirPlantio({ plantio, onDeleted }: { plantio: Plantio; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const excluir = useExcluirPlantio(plantio.id)

  async function confirmar() {
    setErro(null)
    try {
      await excluir.mutateAsync()
      setOpen(false)
      onDeleted()
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível excluir. Tente novamente.")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 />
          Excluir
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-72 flex-col gap-3">
        <p className="text-sm font-semibold">
          Excluir {plantio.cultura} em {plantio.talhao.nome}?
        </p>
        <p className="text-sm text-muted-foreground">O plantio e a colheita registrada são apagados do histórico.</p>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={excluir.isPending}
            onClick={confirmar}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {excluir.isPending && <Loader2 className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
