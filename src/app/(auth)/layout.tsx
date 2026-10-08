import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"

import { AuthAside, AuthAsideFallback } from "@/components/auth/AuthAside"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex min-h-dvh flex-col px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10 sm:py-10 xl:px-16">
        <Link href="/" className="self-start">
          <Image
            src="/logo/farmsense-logo-dark.png"
            alt="FarmSense, voltar para o início"
            width={480}
            height={124}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 sm:py-14">{children}</div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FarmSense</p>
      </main>

      <Suspense fallback={<AuthAsideFallback />}>
        <AuthAside />
      </Suspense>
    </div>
  )
}
