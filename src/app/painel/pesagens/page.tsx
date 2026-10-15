import type { Metadata } from "next"

import { PesagensView } from "@/components/pesagens/PesagensView"

export const metadata: Metadata = {
  title: "Pesagens | FarmSense",
}

export default async function PesagensPage(props: PageProps<"/painel/pesagens">) {
  // Volta da planilha com ?registradas=N (e &primeira=1 na primeira pesagem da fazenda)
  const { registradas, primeira } = await props.searchParams
  const quantidade = Number(registradas)
  return <PesagensView registradas={Number.isInteger(quantidade) && quantidade > 0 ? quantidade : null} primeira={primeira === "1"} />
}
