import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { PropriedadeForm } from "@/components/propriedade/PropriedadeForm"
import { auth } from "@/lib/auth"
import { buscarPorUsuario } from "@/server/services/propriedade"

export const metadata: Metadata = {
  title: "Sua fazenda | FarmSense",
}

// Para quem ainda não tem fazenda (entrou pelo Google ou o cadastro não conseguiu criá-la)
export default async function PrimeiroAcessoPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")
  if (await buscarPorUsuario(session.user.id)) redirect("/painel")

  const firstName = session.user.name.split(" ")[0]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[1.875rem] leading-tight font-bold tracking-tight">Conte sobre sua fazenda</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Falta pouco, {firstName}. Com isso o painel já mostra só o que faz sentido para a sua propriedade.
        </p>
      </div>
      <PropriedadeForm mode="criar" />
    </div>
  )
}
