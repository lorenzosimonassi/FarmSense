"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { authErrorMessage } from "@/lib/auth/errors"
import { fieldErrors, resetPasswordSchema, type FieldErrors } from "@/lib/auth/schemas"

type ResetPasswordFields = { password: string; confirmPassword: string }

export function ResetPasswordForm({ token }: { token: string }) {
  const [errors, setErrors] = useState<FieldErrors<ResetPasswordFields>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    setPending(true)
    const { error } = await authClient.resetPassword({ newPassword: parsed.data.password, token })
    setPending(false)

    if (error) {
      setFormError(authErrorMessage(error))
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert variant="success">
          Senha alterada com sucesso. Por segurança, encerramos as sessões abertas em outros dispositivos.
        </FormAlert>
        <Button asChild className="w-full">
          <Link href="/login">Entrar com a nova senha</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <FormAlert>
          {formError}{" "}
          <Link href="/esqueci-senha" className="font-semibold underline">
            Pedir novo link
          </Link>
        </FormAlert>
      )}

      <FormField
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres, com letras e números"
        error={errors.password}
      />
      <FormField
        label="Confirmar nova senha"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" />}
        Salvar nova senha
      </Button>
    </form>
  )
}
