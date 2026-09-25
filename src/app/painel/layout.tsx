import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app/AppShell"
import { SIDEBAR_COOKIE } from "@/components/app/nav"
import { auth } from "@/lib/auth"

export default async function PainelLayout({ children }: LayoutProps<"/painel">) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "true"

  return (
    <AppShell user={{ name: session.user.name, email: session.user.email }} defaultCollapsed={collapsed}>
      {children}
    </AppShell>
  )
}
