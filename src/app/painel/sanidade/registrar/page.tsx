import type { Metadata } from "next"

import { RegistrarAplicacao } from "@/components/sanidade/RegistrarAplicacao"

export const metadata: Metadata = {
  title: "Registrar aplicação | FarmSense",
}

// Pode chegar pré-preenchido: ?produto=Raiva&pendentes=1 (de um alerta) ou ?animais=id1,id2 (do detalhe do animal)
export default async function RegistrarAplicacaoPage(props: PageProps<"/painel/sanidade/registrar">) {
  const { produto, animais, pendentes } = await props.searchParams

  return (
    <RegistrarAplicacao
      produtoInicial={typeof produto === "string" ? produto.slice(0, 60) : ""}
      animalIdsIniciais={typeof animais === "string" ? animais.split(",").filter(Boolean) : []}
      pendentesIniciais={pendentes === "1"}
    />
  )
}
