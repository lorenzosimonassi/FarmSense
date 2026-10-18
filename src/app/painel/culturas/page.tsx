import type { Metadata } from "next"

import { CulturasView } from "@/components/culturas/CulturasView"

export const metadata: Metadata = {
  title: "Culturas | FarmSense",
}

export default async function CulturasPage(props: PageProps<"/painel/culturas">) {
  // ?novo=1 vem do botão "Lançar safra" dos primeiros passos: já abre o formulário
  const { novo } = await props.searchParams
  return <CulturasView abrirNovo={novo === "1"} />
}
