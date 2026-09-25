import Image from "next/image"

import { Separator } from "@/components/ui/separator"

const farmsenseLogoWhite = "/logo/farmsense-logo-white.png"

const FOOTER_LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Contato", href: "#contato" },
  { label: "Privacidade", href: "#privacidade" },
]

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-page flex flex-col gap-10 pt-14 pb-[max(3.5rem,env(safe-area-inset-bottom))] sm:pt-16 sm:pb-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="flex max-w-xs flex-col gap-3">
            <Image
              src={farmsenseLogoWhite}
              alt="FarmSense"
              width={480}
              height={124}
              className="h-8 w-auto self-start"
            />
            <p className="text-sm leading-relaxed text-primary-foreground/65">
              Gestão rural simples, integrada e orientada por dados.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-1 sm:grid-cols-3 sm:gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground sm:py-0"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <Separator className="bg-primary-foreground/10" />

        <p className="text-xs text-primary-foreground/50">
          © 2026 FarmSense. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
