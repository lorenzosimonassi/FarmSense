import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist } from "next/font/google"

import { MotionProvider } from "@/components/shared/MotionProvider"

import "./globals.css"

// Geist: texto, interface e números · Bricolage Grotesque: títulos
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FarmSense | Gestão da sua propriedade rural",
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
    <html lang="pt-BR" className={`${geist.variable} ${bricolage.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
