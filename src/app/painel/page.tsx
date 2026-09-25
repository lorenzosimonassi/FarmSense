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
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Image
            src="/logo/farmsense-logo-dark.png"
            alt="FarmSense"
            width={480}
            height={124}
            priority
            className="h-7 w-auto sm:h-8"
          />
          <SignOutButton />
        </div>
      </header>
      <main className="container-page py-8 sm:py-12">
        <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,1.875rem)] font-bold tracking-tight break-words">Olá, {session.user.name.split(" ")[0]}!</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">Seu painel está sendo preparado. Em breve, toda a gestão da sua propriedade aparece aqui.</p>
      </main>
    </div>
  )
}
