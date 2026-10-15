"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { MenuRegistro } from "@/components/painel/MenuRegistro"
import { OpcoesField, TextareaField } from "@/components/rebanho/campos"
import { FormSheet } from "@/components/rebanho/ui"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useAtualizarAplicacao, useExcluirAplicacao } from "@/lib/api/hooks/sanidade"
import { fieldErrors, type FieldErrors } from "@/lib/auth/schemas"
import { hojeISO } from "@/shared/datas"
import {
  aplicacaoSchema,
  TIPO_APLICACAO_LABEL,
  TIPOS_APLICACAO,
  type Aplicacao,
  type TipoAplicacao,
} from "@/shared/schemas/aplicacao"

type AplicacaoEditavel = Omit<Aplicacao, "animal">

export function AcoesAplicacao({ aplicacao, rotulo }: { aplicacao: AplicacaoEditavel; rotulo: string }) {
  const [editando, setEditando] = useState(false)
  const excluir = useExcluirAplicacao()

  return (
    <>
      <MenuRegistro
        rotulo={`${aplicacao.produto} de ${rotulo}`}
        onEditar={() => setEditando(true)}
        onExcluir={() => excluir.mutate(aplicacao.id)}
        excluindo={excluir.isPending}
      />
      <FormSheet open={editando} onOpenChange={setEditando} title="Corrigir aplicação" description={rotulo}>
        <AplicacaoForm aplicacao={aplicacao} onSaved={() => setEditando(false)} />
      </FormSheet>
    </>
  )
}

type Valores = {
  tipo: TipoAplicacao
  produto: string
  dose: string
  dataAplicacao: string
  proximaDose: string
  observacao: string
}

const TIPO_OPTIONS = TIPOS_APLICACAO.map((value) => ({ value, label: TIPO_APLICACAO_LABEL[value] }))

function AplicacaoForm({ aplicacao, onSaved }: { aplicacao: AplicacaoEditavel; onSaved: () => void }) {
  const [values, setValues] = useState<Valores>({
    tipo: aplicacao.tipo,
    produto: aplicacao.produto,
    dose: aplicacao.dose ?? "",
    dataAplicacao: aplicacao.dataAplicacao,
    proximaDose: aplicacao.proximaDose ?? "",
    observacao: aplicacao.observacao ?? "",
  })
  const [errors, setErrors] = useState<FieldErrors<Valores>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const atualizar = useAtualizarAplicacao(aplicacao.id)

  function set<K extends keyof Valores>(key: K, value: Valores[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = aplicacaoSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    try {
      await atualizar.mutateAsync(parsed.data)
      onSaved()
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
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <FormField
        label="Produto"
        name="produto"
        autoComplete="off"
        value={values.produto}
        onChange={(event) => set("produto", event.target.value)}
        error={errors.produto}
      />
      <OpcoesField legend="Tipo" name="tipo" options={TIPO_OPTIONS} value={values.tipo} error={errors.tipo} onChange={(tipo) => set("tipo", tipo)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Data da aplicação"
          name="dataAplicacao"
          type="date"
          max={hojeISO()}
          value={values.dataAplicacao}
          onChange={(event) => set("dataAplicacao", event.target.value)}
          error={errors.dataAplicacao}
        />
        <FormField
          label="Próxima dose (opcional)"
          name="proximaDose"
          type="date"
          value={values.proximaDose}
          onChange={(event) => set("proximaDose", event.target.value)}
          error={errors.proximaDose}
        />
      </div>
      <FormField
        label="Dose (opcional)"
        name="dose"
        autoComplete="off"
        value={values.dose}
        onChange={(event) => set("dose", event.target.value)}
        error={errors.dose}
      />
      <TextareaField
        label="Observação (opcional)"
        name="observacao"
        rows={2}
        value={values.observacao}
        onChange={(event) => set("observacao", event.target.value)}
        error={errors.observacao}
      />

      <Button type="submit" disabled={atualizar.isPending} className="sm:self-end">
        {atualizar.isPending && <Loader2 className="animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  )
}
