import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:sticky lg:top-0 lg:flex lg:h-dvh xl:p-14">
        <Link href="/" className="relative z-10">
          <Image
            src="/logo/farmsense-logo-white.png"
            alt="FarmSense"
            width={480}
            height={124}
            priority
            className="h-9 w-auto"
          />
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="text-[clamp(1.75rem,1rem+1.4vw,2.25rem)] leading-tight font-bold text-balance">
            Toda a gestão da sua propriedade rural em um só lugar.
          </p>
          <p className="mt-4 text-primary-foreground/70">
            Pecuária, agricultura e indicadores integrados para decisões mais seguras no dia a dia.
          </p>
        </div>
        <p className="relative z-10 text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} FarmSense
        </p>
        <div
          aria-hidden
          className="absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-secondary/40 blur-3xl"
        />
      </aside>

      <main className="flex min-h-dvh flex-col px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10 sm:py-10">
        <Link href="/" className="mb-8 self-start sm:mb-12 lg:hidden">
          <Image
            src="/logo/farmsense-logo-dark.png"
            alt="FarmSense"
            width={480}
            height={124}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center sm:my-auto sm:max-w-md sm:flex-none sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:p-10 sm:shadow-sm lg:max-w-sm lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {children}
        </div>
      </main>
    </div>
  )
}
