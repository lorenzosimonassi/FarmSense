"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { authErrorMessage } from "@/lib/auth/errors"
import { fieldErrors, signInSchema, type FieldErrors } from "@/lib/auth/schemas"

type SignInFields = { email: string; password: string }

export function SignInForm() {
  const router = useRouter()
  const [errors, setErrors] = useState<FieldErrors<SignInFields>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setUnverifiedEmail(null)

    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    setPending(true)
    const { error } = await authClient.signIn.email(parsed.data)

    if (error) {
      setPending(false)
      setFormError(authErrorMessage(error))
      if (error.code === "EMAIL_NOT_VERIFIED") setUnverifiedEmail(parsed.data.email)
      return
    }

    router.push("/painel")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <FormAlert>
          {formError}
          {unverifiedEmail && (
            <>
              {" "}
              <Link
                href={`/verificar-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="font-semibold underline"
              >
                Reenviar confirmação
              </Link>
            </>
          )}
        </FormAlert>
      )}

      <FormField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="voce@fazenda.com.br"
        error={errors.email}
      />
      <FormField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
        labelAction={
          <Link href="/esqueci-senha" className="text-[13px] font-medium text-secondary hover:underline">
            Esqueci minha senha
          </Link>
        }
      />

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" />}
        Entrar
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  )
}
