"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { TextareaField } from "@/components/rebanho/campos"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useAtualizarPesagem, useRegistrarPesagemDoAnimal } from "@/lib/api/hooks/pesagens"
import { fieldErrors, type FieldErrors } from "@/lib/auth/schemas"
import { hojeISO } from "@/shared/datas"
import { pesagemSchema } from "@/shared/schemas/pesagem"

type Valores = { data: string; pesoKg: string; observacao: string }

type PesagemFormProps =
  // Registro avulso no detalhe do animal
  | { animalId: string; pesagem?: undefined; onSaved: () => void }
  // Correção de uma pesagem já registrada
  | { animalId?: undefined; pesagem: { id: string; data: string; pesoKg: number; observacao: string | null }; onSaved: () => void }

export function PesagemForm(props: PesagemFormProps) {
  const { pesagem, onSaved } = props
  const [values, setValues] = useState<Valores>(
    pesagem
      ? { data: pesagem.data, pesoKg: String(pesagem.pesoKg).replace(".", ","), observacao: pesagem.observacao ?? "" }
      : { data: hojeISO(), pesoKg: "", observacao: "" }
  )
  const [errors, setErrors] = useState<FieldErrors<Valores>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const registrar = useRegistrarPesagemDoAnimal(props.animalId ?? "")
  const atualizar = useAtualizarPesagem(pesagem?.id ?? "")
  const mutation = pesagem ? atualizar : registrar

  function set<K extends keyof Valores>(key: K, value: Valores[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = pesagemSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    try {
      await mutation.mutateAsync(values)
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

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Peso"
          name="pesoKg"
          inputMode="decimal"
          autoComplete="off"
          placeholder="412,5"
          suffix="kg"
          value={values.pesoKg}
          onChange={(event) => set("pesoKg", event.target.value)}
          error={errors.pesoKg}
        />
        <FormField
          label="Data da pesagem"
          name="data"
          type="date"
          max={hojeISO()}
          value={values.data}
          onChange={(event) => set("data", event.target.value)}
          error={errors.data}
        />
      </div>

      <TextareaField
        label="Observação (opcional)"
        name="observacao"
        rows={2}
        value={values.observacao}
        onChange={(event) => set("observacao", event.target.value)}
        error={errors.observacao}
      />

      <Button type="submit" disabled={mutation.isPending} className="sm:self-end">
        {mutation.isPending && <Loader2 className="animate-spin" />}
        {pesagem ? "Salvar alterações" : "Registrar pesagem"}
      </Button>
    </form>
  )
}
