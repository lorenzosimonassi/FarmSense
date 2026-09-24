import type { Metadata } from "next"
import Image from "next/image"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Painel — FarmSense",
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Image
            src="/logo/farmsense-logo-dark.png"
            alt="FarmSense"
            width={480}
            height={124}
            priority
            className="h-8 w-auto"
          />
          <SignOutButton />
        </div>
      </header>
      <main className="container-page py-12">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {session.user.name.split(" ")[0]}!</h1>
        <p className="mt-2 text-muted-foreground">Seu painel está sendo preparado. Em breve, toda a gestão da sua propriedade aparece aqui.</p>
      </main>
    </div>
  )
}
