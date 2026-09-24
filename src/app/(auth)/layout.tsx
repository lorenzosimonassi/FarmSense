import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
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
          <p className="text-3xl leading-tight font-bold text-balance">
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

      <main className="flex flex-col px-4 py-8 sm:px-8">
        <Link href="/" className="mb-10 lg:hidden">
          <Image
            src="/logo/farmsense-logo-dark.png"
            alt="FarmSense"
            width={480}
            height={124}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">{children}</div>
      </main>
    </div>
  )
}
