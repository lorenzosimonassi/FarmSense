"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { PropriedadeFields } from "@/components/propriedade/PropriedadeFields"
import { EMPTY_PROPRIEDADE, type PropriedadeErrors, type PropriedadeValues } from "@/components/propriedade/values"
import { Button } from "@/components/ui/button"
import { fieldErrors } from "@/lib/auth/schemas"
import { propriedadeSchema } from "@/shared/schemas/propriedade"

type PropriedadeFormProps =
  | { mode: "criar"; initialValues?: undefined }
  | { mode: "editar"; initialValues: PropriedadeValues }

// Primeiro acesso (POST) e Configurações (PATCH)
export function PropriedadeForm({ mode, initialValues }: PropriedadeFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<PropriedadeValues>(initialValues ?? EMPTY_PROPRIEDADE)
  const [errors, setErrors] = useState<PropriedadeErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSaved(false)

    const parsed = propriedadeSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    setPending(true)
    try {
      const response = await fetch("/api/propriedade", {
        method: mode === "criar" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      // 409 no primeiro acesso: a fazenda já existe, segue para o painel
      if (response.ok || (mode === "criar" && response.status === 409)) {
        if (mode === "criar") {
          router.replace("/painel")
          return
        }
        setSaved(true)
        // Atualiza o menu, que depende das atividades
        router.refresh()
      } else if (response.status === 401) {
        router.replace("/login")
        return
      } else {
        const body = await response.json().catch(() => null)
        if (body?.error?.fields) setErrors(body.error.fields)
        setFormError(body?.error?.message ?? "Não foi possível salvar. Tente novamente.")
      }
    } catch {
      setFormError("Não foi possível falar com o servidor agora. Tente novamente em instantes.")
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}
      {saved && <FormAlert variant="success">Alterações salvas.</FormAlert>}

      <PropriedadeFields
        values={values}
        errors={errors}
        onChange={(next) => {
          setValues(next)
          setSaved(false)
        }}
      />

      <Button type="submit" disabled={pending} className={mode === "criar" ? "mt-2 w-full" : "mt-2 self-start"}>
        {pending && <Loader2 className="animate-spin" />}
        {mode === "criar" ? "Concluir" : "Salvar alterações"}
      </Button>
    </form>
  )
}
