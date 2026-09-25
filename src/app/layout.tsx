import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"

import { MotionProvider } from "@/components/shared/MotionProvider"

import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FarmSense — Gestão inteligente da sua propriedade rural",
  description:
    "FarmSense centraliza a gestão da sua propriedade rural em um único lugar, integrando pecuária, agricultura e indicadores para facilitar sua rotina e apoiar suas decisões.",
}

export const viewport: Viewport = {
  themeColor: "#173226",
  // Permite ocupar a área do notch (usamos env(safe-area-inset-*) no CSS)
  viewportFit: "cover",
  // O teclado virtual redimensiona o layout, mantendo os campos dos formulários visíveis
  interactiveWidget: "resizes-content",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={plusJakartaSans.variable}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
