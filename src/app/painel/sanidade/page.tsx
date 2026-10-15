import type { Metadata } from "next"

import { SanidadeView } from "@/components/sanidade/SanidadeView"

export const metadata: Metadata = {
  title: "Sanidade | FarmSense",
}

export default async function SanidadePage(props: PageProps<"/painel/sanidade">) {
  // ?aba=historico abre o histórico; ?registradas=N&produto=X vem do registro (e &primeira=1 na primeira vez)
  const { aba, registradas, produto, primeira } = await props.searchParams
  const quantidade = Number(registradas)
  const retorno =
    Number.isInteger(quantidade) && quantidade > 0 && typeof produto === "string"
      ? { registradas: quantidade, produto, primeira: primeira === "1" }
      : null

  return <SanidadeView abaInicial={aba === "historico" ? "historico" : "alertas"} retorno={retorno} />
}
