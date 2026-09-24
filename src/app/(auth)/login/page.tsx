import type { Metadata } from "next"

import { FormAlert } from "@/components/auth/FormAlert"
import { AuthDivider, GoogleButton } from "@/components/auth/GoogleButton"
import { SignInForm } from "@/components/auth/SignInForm"
import { isGoogleEnabled } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Entrar — FarmSense",
}

export default async function SignInPage(props: PageProps<"/login">) {
  // O Better Auth volta para cá com ?error=... quando o login com Google falha
  const { error } = await props.searchParams

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entre com seu e-mail e senha para acessar o painel.</p>
      </div>
      <div className="flex flex-col gap-5">
        {error && <FormAlert>Não foi possível entrar com o Google. Tente novamente.</FormAlert>}
        {isGoogleEnabled && (
          <>
            <GoogleButton />
            <AuthDivider />
          </>
        )}
        <SignInForm />
      </div>
    </>
  )
}
