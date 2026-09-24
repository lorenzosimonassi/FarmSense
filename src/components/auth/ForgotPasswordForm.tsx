"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { authErrorMessage } from "@/lib/auth/errors"
import { forgotPasswordSchema } from "@/lib/auth/schemas"

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message)
      return
    }
    setEmailError(undefined)

    setPending(true)
    const { error } = await authClient.requestPasswordReset({
      email: parsed.data.email,
      redirectTo: "/redefinir-senha",
    })
    setPending(false)

    if (error) {
      setFormError(authErrorMessage(error))
      return
    }

    setSentTo(parsed.data.email)
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-5">
        {/* Mensagem neutra: não revela se o e-mail está cadastrado */}
        <FormAlert variant="success">
          Se existir uma conta com <strong>{sentTo}</strong>, você vai receber um link para redefinir a senha em
          alguns instantes. Confira também a caixa de spam.
        </FormAlert>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/login">Voltar para o login</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <FormField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="voce@fazenda.com.br"
        error={emailError}
      />

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" />}
        Enviar link de redefinição
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
