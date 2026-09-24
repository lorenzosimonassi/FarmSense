import type { Metadata } from "next"
import Link from "next/link"
import { CircleAlert, CircleCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Verificação de e-mail — FarmSense",
}

// O Better Auth redireciona para cá após clicar no link; em caso de falha, envia ?error=...
export default async function EmailVerifiedPage(props: PageProps<"/email-verificado">) {
  const { error } = await props.searchParams

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <CircleAlert className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Não foi possível confirmar seu e-mail. Tente entrar novamente para receber um novo link.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Voltar para o login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
        <CircleCheck className="size-6" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">E-mail confirmado!</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sua conta está ativa. Agora é só acessar o painel e começar a cadastrar sua propriedade.
        </p>
      </div>
      <Button asChild className="w-full">
        <Link href="/painel">Ir para o painel</Link>
      </Button>
    </div>
  )
}
