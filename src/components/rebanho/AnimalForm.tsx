"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { OpcoesField, TextareaField } from "@/components/rebanho/campos"
import { EMPTY_ANIMAL, toAnimalValues, type AnimalErrors, type AnimalValues } from "@/components/rebanho/values"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useLotes, useSalvarAnimal } from "@/lib/api/hooks/animais"
import { fieldErrors } from "@/lib/auth/schemas"
import { hojeISO } from "@/shared/datas"
import { animalSchema, SEXO_LABEL, SEXOS, type Animal } from "@/shared/schemas/animal"

const SEXO_OPTIONS = SEXOS.map((value) => ({ value, label: SEXO_LABEL[value] }))

type AnimalFormProps = {
  // Sem animal: cadastro novo; com animal: edição dos dados (situação e saída têm formulário próprio)
  animal?: Animal
  onSaved: (animal: Animal, opcoes: { outro: boolean }) => void
}

export function AnimalForm({ animal, onSaved }: AnimalFormProps) {
  const [values, setValues] = useState<AnimalValues>(animal ? toAnimalValues(animal) : EMPTY_ANIMAL)
  const [errors, setErrors] = useState<AnimalErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [salvo, setSalvo] = useState<string | null>(null)
  const salvar = useSalvarAnimal(animal?.id)
  const { data: lotes = [] } = useLotes()

  function set<K extends keyof AnimalValues>(key: K, value: AnimalValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setSalvo(null)
  }

  async function enviar(outro: boolean) {
    setFormError(null)
    const parsed = animalSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    try {
      const salvoAgora = await salvar.mutateAsync(parsed.data)
      onSaved(salvoAgora, { outro })
      if (outro) {
        // Cadastro em sequência: sexo, raça e lote costumam se repetir no mesmo lote de animais
        setValues({ ...EMPTY_ANIMAL, sexo: values.sexo, raca: values.raca, lote: values.lote })
        setSalvo(salvoAgora.identificacao)
        document.getElementById("identificacao")?.focus()
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
      {salvo && <FormAlert variant="success">Animal {salvo} cadastrado. Pode seguir com o próximo.</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Identificação"
          name="identificacao"
          hint="Brinco, tatuagem ou registro."
          autoComplete="off"
          value={values.identificacao}
          onChange={(event) => set("identificacao", event.target.value)}
          error={errors.identificacao}
        />
        <FormField
          label="Nome (opcional)"
          name="nome"
          autoComplete="off"
          value={values.nome}
          onChange={(event) => set("nome", event.target.value)}
          error={errors.nome}
        />
      </div>

      <OpcoesField
        legend="Sexo"
        name="sexo"
        options={SEXO_OPTIONS}
        value={values.sexo}
        error={errors.sexo}
        onChange={(sexo) => set("sexo", sexo)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Raça (opcional)"
          name="raca"
          placeholder="Nelore"
          value={values.raca}
          onChange={(event) => set("raca", event.target.value)}
          error={errors.raca}
        />
        <FormField
          label="Nascimento (opcional)"
          name="dataNascimento"
          type="date"
          max={hojeISO()}
          value={values.dataNascimento}
          onChange={(event) => set("dataNascimento", event.target.value)}
          error={errors.dataNascimento}
        />
      </div>

      <FormField
        label="Lote ou pasto (opcional)"
        name="lote"
        list="lotes-existentes"
        autoComplete="off"
        placeholder="Lote A"
        hint="Use o mesmo nome para agrupar os animais nos filtros e relatórios."
        value={values.lote}
        onChange={(event) => set("lote", event.target.value)}
        error={errors.lote}
      />
      <datalist id="lotes-existentes">
        {lotes.map((lote) => (
          <option key={lote} value={lote} />
        ))}
      </datalist>

      <TextareaField
        label="Observações (opcional)"
        name="observacoes"
        value={values.observacoes}
        onChange={(event) => set("observacoes", event.target.value)}
        error={errors.observacoes}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {!animal && (
          <Button type="button" variant="secondary" disabled={salvar.isPending} onClick={() => enviar(true)}>
            Salvar e cadastrar outro
          </Button>
        )}
        <Button type="submit" disabled={salvar.isPending} className="sm:ml-auto">
          {salvar.isPending && <Loader2 className="animate-spin" />}
          {animal ? "Salvar alterações" : "Cadastrar animal"}
        </Button>
      </div>
    </form>
  )
}
