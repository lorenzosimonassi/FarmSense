"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { TextareaField } from "@/components/rebanho/campos"
import { BuscaLugar } from "@/components/talhoes/BuscaLugar"
import { MapaEditor, type MudancaContorno } from "@/components/talhoes/mapa"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useLimiteFazenda } from "@/lib/api/hooks/propriedade"
import { useLocalizacaoFazenda, useSalvarTalhao, useTalhoes } from "@/lib/api/hooks/talhoes"
import type { FieldErrors } from "@/lib/auth/schemas"
import { fieldErrors } from "@/lib/auth/schemas"
import type { Lugar } from "@/shared/busca-local"
import { areaHa, formatarHa, type Contorno } from "@/shared/geo"
import { parseDecimal } from "@/shared/numeros"
import { talhaoSchema, type Talhao } from "@/shared/schemas/talhao"

type Values = { nome: string; areaHa: string; contorno: Contorno | null; observacoes: string }

const VAZIO: Values = { nome: "", areaHa: "", contorno: null, observacoes: "" }

// Valor do campo no formato que o produtor digita: "12,35"
function textoArea(valor: number) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2, useGrouping: false })
}

// Diferença maior que 1% entre a área digitada e a do desenho: vale oferecer a do mapa
function difere(digitada: string, doMapa: number) {
  const valor = parseDecimal(digitada)
  return valor === undefined || Number.isNaN(valor) || Math.abs(valor - doMapa) > doMapa * 0.01
}

export function TalhaoForm({
  talhao,
  onSaved,
}: {
  // Sem talhão: cadastro novo; com talhão: edição
  talhao?: Talhao
  onSaved: (talhao: Talhao, opcoes: { outro: boolean }) => void
}) {
  const [values, setValues] = useState<Values>(
    talhao
      ? { nome: talhao.nome, areaHa: textoArea(talhao.areaHa), contorno: talhao.contorno, observacoes: talhao.observacoes ?? "" }
      : VAZIO
  )
  // A área segue o desenho até o produtor digitar outra (ex.: área do documento do imóvel, que desconta carreadores)
  const [areaManual, setAreaManual] = useState(() => Boolean(talhao?.contorno && difere(textoArea(talhao.areaHa), areaHa(talhao.contorno))))
  const [desenhando, setDesenhando] = useState(false)
  // Só posiciona o mapa; não é salvo com o talhão
  const [destino, setDestino] = useState<Lugar | null>(null)
  // Muda a cada "salvar e cadastrar outro" para o editor voltar vazio
  const [rodada, setRodada] = useState(0)
  const [errors, setErrors] = useState<FieldErrors<Values>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [salvo, setSalvo] = useState<string | null>(null)

  const salvar = useSalvarTalhao(talhao?.id)
  const { data: lista } = useTalhoes()
  const { data: centroFazenda } = useLocalizacaoFazenda()
  const { data: limite } = useLimiteFazenda()
  const outros = (lista?.items ?? []).filter((item) => item.id !== talhao?.id)

  const areaDoMapa = values.contorno ? areaHa(values.contorno) : null

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSalvo(null)
  }

  function mudarContorno({ contorno, desenhando }: MudancaContorno) {
    setDesenhando(desenhando)
    setValues((current) => ({
      ...current,
      contorno,
      areaHa: contorno && !areaManual ? textoArea(areaHa(contorno)) : current.areaHa,
    }))
    setErrors((current) => ({ ...current, contorno: undefined, ...(contorno && !areaManual && { areaHa: undefined }) }))
    setSalvo(null)
  }

  async function enviar(outro: boolean) {
    setFormError(null)
    if (desenhando) {
      setErrors({ contorno: "Conclua o contorno no mapa (clique no primeiro ponto) ou cancele o desenho." })
      return
    }

    const parsed = talhaoSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    try {
      const salvoAgora = await salvar.mutateAsync(parsed.data)
      onSaved(salvoAgora, { outro })
      if (outro) {
        setValues(VAZIO)
        setAreaManual(false)
        setRodada((atual) => atual + 1)
        setSalvo(salvoAgora.nome)
        document.getElementById("nome")?.focus()
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields) setErrors(error.fields)
        setFormError(error.message)
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
      {salvo && <FormAlert variant="success">{salvo} cadastrado. Pode desenhar o próximo.</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <FormField
          label="Nome"
          name="nome"
          autoComplete="off"
          placeholder="Talhão 1"
          value={values.nome}
          onChange={(event) => set("nome", event.target.value)}
          error={errors.nome}
        />
        <FormField
          label="Área"
          name="areaHa"
          inputMode="decimal"
          placeholder="12,5"
          suffix="ha"
          value={values.areaHa}
          onChange={(event) => {
            setAreaManual(true)
            set("areaHa", event.target.value)
          }}
          error={errors.areaHa}
        />
      </div>

      <fieldset className="flex flex-col gap-2" aria-describedby={errors.contorno ? "contorno-error" : undefined}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <legend className="text-sm leading-none font-medium">Contorno no mapa (opcional)</legend>
          {areaDoMapa !== null && areaManual && difere(values.areaHa, areaDoMapa) && (
            <button
              type="button"
              onClick={() => {
                setAreaManual(false)
                set("areaHa", textoArea(areaDoMapa))
              }}
              className="cursor-pointer text-[13px] font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              Usar a área do desenho ({formatarHa(areaDoMapa)})
            </button>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground">
          Se quiser, busque o endereço para o mapa ir direto ao lugar. Depois marque os cantos do talhão na imagem de
          satélite; a área é calculada sozinha.
        </p>
        <BuscaLugar onEscolher={setDestino} />
        <MapaEditor
          key={rodada}
          destino={destino}
          valor={values.contorno}
          onChange={mudarContorno}
          outros={outros}
          centroFazenda={centroFazenda}
          limite={limite?.contornos}
        />
        {errors.contorno && (
          <p id="contorno-error" className="text-[13px] text-destructive">
            {errors.contorno}
          </p>
        )}
      </fieldset>

      <TextareaField
        label="Observações (opcional)"
        name="observacoes"
        placeholder="Tipo de solo, irrigação, histórico da área…"
        value={values.observacoes}
        onChange={(event) => set("observacoes", event.target.value)}
        error={errors.observacoes}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {!talhao && (
          <Button type="button" variant="secondary" disabled={salvar.isPending} onClick={() => enviar(true)}>
            Salvar e cadastrar outro
          </Button>
        )}
        <Button type="submit" disabled={salvar.isPending} className="sm:ml-auto">
          {salvar.isPending && <Loader2 className="animate-spin" />}
          {talhao ? "Salvar alterações" : "Cadastrar talhão"}
        </Button>
      </div>
    </form>
  )
}
