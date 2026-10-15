import type { Metadata } from "next"

import { RebanhoView } from "@/components/rebanho/RebanhoView"

export const metadata: Metadata = {
  title: "Rebanho | FarmSense",
}

export default async function RebanhoPage(props: PageProps<"/painel/rebanho">) {
  // ?novo=1 vem do botão "Cadastrar animais" dos primeiros passos: já abre o formulário
  const { novo } = await props.searchParams
  return <RebanhoView abrirNovo={novo === "1"} />
}
