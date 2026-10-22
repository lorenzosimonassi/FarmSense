import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/painel/states"
import { PerfilView } from "@/components/perfil/PerfilView"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const metadata: Metadata = {
  title: "Meu perfil | FarmSense",
}

export default async function PerfilPage(props: PageProps<"/painel/perfil">) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  // Direto do banco: o cookie de sessão guarda o usuário em cache por alguns minutos
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      notificarPorEmail: true,
      accounts: { select: { providerId: true } },
    },
  })
  const { email } = await props.searchParams

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Meu perfil" description="Seus dados de acesso e como o FarmSense fala com você" />
      <PerfilView
        user={{
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          membroDesde: user.createdAt.toISOString(),
          notificarPorEmail: user.notificarPorEmail,
          temSenha: user.accounts.some((account) => account.providerId === "credential"),
          temGoogle: user.accounts.some((account) => account.providerId === "google"),
        }}
        emailConfirmado={email === "confirmado"}
      />
    </div>
  )
}
