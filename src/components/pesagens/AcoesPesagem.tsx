"use client"

import { useState } from "react"
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { PesagemForm } from "@/components/pesagens/PesagemForm"
import { FormSheet } from "@/components/rebanho/ui"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useExcluirPesagem } from "@/lib/api/hooks/pesagens"
import { formatarData } from "@/shared/datas"

type PesagemEditavel = { id: string; data: string; pesoKg: number; observacao: string | null }

// Editar e excluir uma pesagem. A exclusão pede um segundo clique no próprio menu, sem abrir outra janela.
export function AcoesPesagem({ pesagem, rotulo }: { pesagem: PesagemEditavel; rotulo: string }) {
  const [editando, setEditando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const excluir = useExcluirPesagem()

  return (
    <>
      <DropdownMenu onOpenChange={(open) => !open && setConfirmando(false)}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
            <MoreHorizontal />
            <span className="sr-only">Ações da pesagem de {rotulo}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setEditando(true)}>
            <Pencil />
            Corrigir pesagem
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={excluir.isPending}
            onSelect={(event) => {
              if (!confirmando) {
                event.preventDefault()
                setConfirmando(true)
                return
              }
              excluir.mutate(pesagem.id)
            }}
          >
            {excluir.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {confirmando ? "Clique de novo para excluir" : "Excluir"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
