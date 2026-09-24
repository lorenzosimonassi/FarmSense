import type { Metadata } from "next"
import Link from "next/link"
import { CircleAlert } from "lucide-react"

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Redefinir senha — FarmSense",
}

// O link do e-mail passa pelo Better Auth, que redireciona para cá com ?token=... ou ?error=INVALID_TOKEN
export default async function ResetPasswordPage(props: PageProps<"/redefinir-senha">) {
  const { token, error } = await props.searchParams

  if (error || typeof token !== "string") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <CircleAlert className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Os links de redefinição valem por 1 hora e só podem ser usados uma vez. Peça um novo para continuar.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/esqueci-senha">Pedir novo link</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Crie uma nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">Escolha uma senha que você não use em outros sites.</p>
      </div>
      <ResetPasswordForm token={token} />
    </>
  )
}
