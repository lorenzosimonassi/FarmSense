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
import { fieldErrors, signUpSchema, type FieldErrors } from "@/lib/auth/schemas"

type SignUpFields = { name: string; email: string; password: string; confirmPassword: string }

export function SignUpForm() {
  const router = useRouter()
  const [errors, setErrors] = useState<FieldErrors<SignUpFields>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})

    const { name, email, password } = parsed.data
    setPending(true)
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/email-verificado",
    })
    setPending(false)

    if (error) {
      setFormError(authErrorMessage(error))
      return
    }

    router.push(`/verificar-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <FormField label="Nome completo" name="name" autoComplete="name" placeholder="João da Silva" error={errors.name} />
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
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres, com letras e números"
        error={errors.password}
      />
      <FormField
        label="Confirmar senha"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" />}
        Criar conta
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
