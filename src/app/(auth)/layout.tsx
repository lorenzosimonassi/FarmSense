import Image from "next/image"
import Link from "next/link"

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

      {/* Foto em duotone Mata: mesma linguagem visual da landing */}
      <aside className="relative hidden overflow-hidden bg-primary lg:sticky lg:top-0 lg:block lg:h-dvh">
        <Image
          src="/hero/propriedade-rural.jpeg"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover grayscale"
        />
        <div aria-hidden className="absolute inset-0 bg-primary mix-blend-color" />
        <div aria-hidden className="absolute inset-0 bg-primary/35" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
        <p className="absolute right-12 bottom-12 left-12 max-w-md font-display text-[clamp(1.75rem,1rem+1.4vw,2.5rem)] leading-[1.1] font-semibold tracking-tight text-balance text-primary-foreground xl:right-16 xl:bottom-16 xl:left-16">
          Toda a gestão da sua propriedade rural em um só lugar.
        </p>
      </aside>
    </div>
  )
}
