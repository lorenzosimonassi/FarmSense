import type { Metadata } from "next"

import { RegistrarPesagensCliente } from "@/components/pesagens/RegistrarPesagensCliente"

export const metadata: Metadata = {
  title: "Registrar pesagem | FarmSense",
}

export default function RegistrarPesagemPage() {
  return <RegistrarPesagensCliente />
}
