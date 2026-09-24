import type { Metadata } from "next"
import Link from "next/link"
import { MailCheck } from "lucide-react"

import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton"

export const metadata: Metadata = {
  title: "Confirme seu e-mail — FarmSense",
}

export default async function VerifyEmailPage(props: PageProps<"/verificar-email">) {
  const { email } = await props.searchParams
  const address = typeof email === "string" ? email : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
        <MailCheck className="size-6" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Confirme seu e-mail</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Enviamos um link de confirmação para{" "}
          {address ? <strong className="text-foreground">{address}</strong> : "o seu e-mail"}. Clique nele para
          ativar sua conta. Não esqueça de olhar a caixa de spam.
        </p>
      </div>

      {address && <ResendVerificationButton email={address} />}

      <p className="text-center text-sm text-muted-foreground">
        Já confirmou?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
