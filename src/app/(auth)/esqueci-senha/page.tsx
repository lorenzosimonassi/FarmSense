import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Esqueci minha senha — FarmSense",
}

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Esqueceu a senha?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  )
}
