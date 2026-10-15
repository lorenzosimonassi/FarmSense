"use client"

import { useState } from "react"
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Menu "⋯" de um registro (pesagem, aplicação): corrigir e excluir.
// A exclusão pede um segundo clique no próprio menu, sem abrir outra janela.
export function MenuRegistro({
  rotulo,
  onEditar,
  onExcluir,
  excluindo,
}: {
  rotulo: string
  onEditar: () => void
  onExcluir: () => void
  excluindo: boolean
}) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <DropdownMenu onOpenChange={(open) => !open && setConfirmando(false)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
          <MoreHorizontal />
          <span className="sr-only">Ações de {rotulo}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={onEditar}>
          <Pencil />
          Corrigir
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={excluindo}
          onSelect={(event) => {
            if (!confirmando) {
              event.preventDefault()
              setConfirmando(true)
              return
            }
            onExcluir()
          }}
        >
          {excluindo ? <Loader2 className="animate-spin" /> : <Trash2 />}
          {confirmando ? "Clique de novo para excluir" : "Excluir"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
