"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, LogOut, Pencil, RotateCcw, Trash2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { PesagensDoAnimal } from "@/components/pesagens/PesagensDoAnimal"
import { SanidadeDoAnimal } from "@/components/sanidade/SanidadeDoAnimal"
import { AnimalForm } from "@/components/rebanho/AnimalForm"
import { SaidaForm } from "@/components/rebanho/SaidaForm"
import { FormSheet, SituacaoBadge } from "@/components/rebanho/ui"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ApiError } from "@/lib/api/client"
import { useAnimal, useExcluirAnimal, useSalvarAnimal } from "@/lib/api/hooks/animais"
import { formatarData, idade } from "@/shared/datas"
import { SEXO_LABEL, SITUACAO_LABEL, type Animal } from "@/shared/schemas/animal"

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" })

export function AnimalDetalhe({ inicial }: { inicial: Animal }) {
  const { data: animal = inicial } = useAnimal(inicial.id, inicial)
  const [editando, setEditando] = useState(false)
  const [registrandoSaida, setRegistrandoSaida] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const reativar = useSalvarAnimal(animal.id)

  const ativo = animal.situacao === "ATIVO"
  const idadeTexto = animal.dataNascimento && idade(animal.dataNascimento, animal.dataSaida ?? undefined)

  async function desfazerSaida() {
    setErro(null)
    try {
      await reativar.mutateAsync({ ...animal, situacao: "ATIVO", dataSaida: null })
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível reativar o animal.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/painel/rebanho"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Rebanho
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight font-bold tracking-tight">
                {animal.identificacao}
              </h1>
              <SituacaoBadge situacao={animal.situacao} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {[animal.nome, SEXO_LABEL[animal.sexo], animal.raca, animal.lote].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditando(true)}>
              <Pencil />
              Editar
            </Button>
            {ativo ? (
              <Button variant="secondary" size="sm" onClick={() => setRegistrandoSaida(true)}>
                <LogOut />
                Registrar saída
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled={reativar.isPending} onClick={desfazerSaida}>
                {reativar.isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                Desfazer saída
              </Button>
            )}
            <ExcluirAnimal animal={animal} />
          </div>
        </div>
      </div>

      {erro && <FormAlert>{erro}</FormAlert>}

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-5">
          <h2 className="text-base font-semibold tracking-tight">Dados do animal</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <Dado label="Identificação" valor={animal.identificacao} />
            <Dado label="Nome" valor={animal.nome} />
            <Dado label="Sexo" valor={SEXO_LABEL[animal.sexo]} />
            <Dado label="Raça" valor={animal.raca} />
            <Dado
              label="Nascimento"
              valor={animal.dataNascimento && formatarData(animal.dataNascimento)}
              detalhe={idadeTexto && (ativo ? idadeTexto : `${idadeTexto} na saída`)}
            />
            <Dado label="Lote ou pasto" valor={animal.lote} />
            <Dado
              label="Situação"
              valor={SITUACAO_LABEL[animal.situacao]}
              detalhe={animal.dataSaida && `desde ${formatarData(animal.dataSaida)}`}
            />
            <Dado label="Cadastrado em" valor={dataHora.format(new Date(animal.createdAt))} />
            {animal.observacoes && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Observações</dt>
                <dd className="mt-1 whitespace-pre-line">{animal.observacoes}</dd>
              </div>
            )}
          </dl>
        </section>

        <div className="flex flex-col gap-4 lg:col-span-7">
          <PesagensDoAnimal animalId={animal.id} identificacao={animal.identificacao} />
          <SanidadeDoAnimal animalId={animal.id} identificacao={animal.identificacao} ativo={ativo} />
        </div>
      </div>

      <FormSheet open={editando} onOpenChange={setEditando} title={`Editar ${animal.identificacao}`}>
        <AnimalForm animal={animal} onSaved={() => setEditando(false)} />
      </FormSheet>

      <FormSheet
        open={registrandoSaida}
        onOpenChange={setRegistrandoSaida}
        title="Registrar saída"
        description={`${animal.identificacao} deixa de contar no rebanho ativo.`}
      >
        <SaidaForm animal={animal} onSaved={() => setRegistrandoSaida(false)} />
      </FormSheet>
    </div>
  )
}

function Dado({ label, valor, detalhe }: { label: string; valor: string | null; detalhe?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium break-words">
        {valor ?? <span className="font-normal text-muted-foreground">Não informado</span>}
        {detalhe && <span className="block text-xs font-normal text-muted-foreground">{detalhe}</span>}
      </dd>
    </div>
  )
}

// Excluir é para cadastro errado; a saída normal do rebanho é "Registrar saída", que preserva o histórico
function ExcluirAnimal({ animal }: { animal: Animal }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const excluir = useExcluirAnimal(animal.id)

  async function confirmar() {
    setErro(null)
    try {
      await excluir.mutateAsync()
      router.replace("/painel/rebanho")
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível excluir. Tente novamente.")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 />
          Excluir
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-72 flex-col gap-3">
        <p className="text-sm font-semibold">Excluir {animal.identificacao}?</p>
        <p className="text-sm text-muted-foreground">
          O cadastro e todo o histórico do animal são apagados. Para vendas e mortes, use “Registrar saída”.
        </p>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={excluir.isPending}
            onClick={confirmar}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {excluir.isPending && <Loader2 className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
