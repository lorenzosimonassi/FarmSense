"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { OpcoesField } from "@/components/rebanho/campos"
import { toAnimalValues } from "@/components/rebanho/values"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useSalvarAnimal } from "@/lib/api/hooks/animais"
import { fieldErrors } from "@/lib/auth/schemas"
import { hojeISO } from "@/shared/datas"
import { animalSchema, SITUACAO_LABEL, type Animal } from "@/shared/schemas/animal"

type Saida = "VENDIDO" | "MORTO"
const SAIDA_OPTIONS: { value: Saida; label: string }[] = [
  { value: "VENDIDO", label: SITUACAO_LABEL.VENDIDO },
  { value: "MORTO", label: SITUACAO_LABEL.MORTO },
]

// Saída do rebanho: o animal continua cadastrado, com o histórico, mas deixa de contar como ativo
export function SaidaForm({ animal, onSaved }: { animal: Animal; onSaved: () => void }) {
  const [situacao, setSituacao] = useState<Saida | "">("")
  const [dataSaida, setDataSaida] = useState(hojeISO())
  const [errors, setErrors] = useState<{ situacao?: string; dataSaida?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const salvar = useSalvarAnimal(animal.id)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (!situacao) {
      setErrors({ situacao: "Escolha o motivo da saída." })
      return
    }

    const parsed = animalSchema.safeParse({ ...toAnimalValues(animal), situacao, dataSaida })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    try {
      await salvar.mutateAsync(parsed.data)
      onSaved()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível salvar. Tente novamente.")
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <OpcoesField
        legend="Motivo"
        name="situacao"
        options={SAIDA_OPTIONS}
        value={situacao}
        error={errors.situacao}
        onChange={setSituacao}
      />
      <FormField
        label="Data da saída"
        name="dataSaida"
        type="date"
        min={animal.dataNascimento ?? undefined}
        max={hojeISO()}
        value={dataSaida}
        onChange={(event) => setDataSaida(event.target.value)}
        error={errors.dataSaida}
      />
      <p className="text-sm text-muted-foreground">
        O animal sai da contagem do rebanho, mas o cadastro e o histórico continuam disponíveis.
      </p>

      <Button type="submit" disabled={salvar.isPending} className="sm:self-end">
        {salvar.isPending && <Loader2 className="animate-spin" />}
        Registrar saída
      </Button>
    </form>
  )
}
