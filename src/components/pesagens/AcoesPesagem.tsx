"use client"

import { useState } from "react"

import { MenuRegistro } from "@/components/painel/MenuRegistro"
import { PesagemForm } from "@/components/pesagens/PesagemForm"
import { FormSheet } from "@/components/rebanho/ui"
import { useExcluirPesagem } from "@/lib/api/hooks/pesagens"
import { formatarData } from "@/shared/datas"

type PesagemEditavel = { id: string; data: string; pesoKg: number; observacao: string | null }

export function AcoesPesagem({ pesagem, rotulo }: { pesagem: PesagemEditavel; rotulo: string }) {
  const [editando, setEditando] = useState(false)
  const excluir = useExcluirPesagem()

  return (
    <>
      <MenuRegistro
        rotulo={`a pesagem de ${rotulo}`}
        onEditar={() => setEditando(true)}
        onExcluir={() => excluir.mutate(pesagem.id)}
        excluindo={excluir.isPending}
      />
      <FormSheet
        open={editando}
        onOpenChange={setEditando}
        title="Corrigir pesagem"
        description={`${rotulo} · ${formatarData(pesagem.data)}`}
      >
        <PesagemForm pesagem={pesagem} onSaved={() => setEditando(false)} />
      </FormSheet>
    </>
  )
}
