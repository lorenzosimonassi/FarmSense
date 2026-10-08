import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app/AppShell"
import { SIDEBAR_COOKIE } from "@/components/app/nav"
import { auth } from "@/lib/auth"
import { buscarPorUsuario } from "@/server/services/propriedade"

export default async function PainelLayout({ children }: LayoutProps<"/painel">) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  // Quem ainda não tem fazenda (ex.: entrou pelo Google) preenche antes de usar o painel
  const propriedade = await buscarPorUsuario(session.user.id)
  if (!propriedade) redirect("/primeiro-acesso")

  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "true"

  return (
    <AppShell
      user={{ name: session.user.name, email: session.user.email }}
      atividades={propriedade.atividades}
      defaultCollapsed={collapsed}
    >
      {children}
    </AppShell>
  )
}
