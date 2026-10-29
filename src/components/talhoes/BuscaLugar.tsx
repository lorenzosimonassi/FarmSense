"use client"

import { useId, useState } from "react"
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { useBuscaLugares } from "@/lib/api/hooks/talhoes"
import { useDebounced } from "@/lib/use-debounced"
import { cn } from "@/lib/utils"
import { BUSCA_MINIMO, lerCoordenadas, type Lugar } from "@/shared/busca-local"

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 5 })

// Combobox (padrão ARIA 1.2): digita endereço ou cola coordenadas, escolhe com mouse ou setas + Enter
export function BuscaLugar({ onEscolher }: { onEscolher: (lugar: Lugar) => void }) {
  const id = useId()
  const [texto, setTexto] = useState("")
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)

  const coordenadas = lerCoordenadas(texto)
  const termo = useDebounced(texto.trim())
  // Coordenadas não precisam do servidor
  const busca = useBuscaLugares(coordenadas ? "" : termo)

  const opcoes: Lugar[] = coordenadas
    ? [
        {
          id: "coordenadas",
          titulo: "Ir para as coordenadas",
          detalhe: `${numero.format(coordenadas.lat)}, ${numero.format(coordenadas.lng)}`,
          ...coordenadas,
        },
      ]
    : termo.length >= BUSCA_MINIMO
      ? (busca.data?.items ?? [])
      : []

  const carregando = !coordenadas && termo.length >= BUSCA_MINIMO && busca.isFetching
  const semResultado = !coordenadas && termo.length >= BUSCA_MINIMO && busca.isSuccess && !busca.isPlaceholderData && opcoes.length === 0
  const mostrarLista = aberto && (opcoes.length > 0 || semResultado || busca.isError)

  function escolher(lugar: Lugar) {
    setTexto(lugar.id === "coordenadas" ? lugar.detalhe : lugar.titulo)
    setAberto(false)
    onEscolher(lugar)
  }

  function teclar(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setAberto(true)
      if (!opcoes.length) return
      const passo = event.key === "ArrowDown" ? 1 : -1
      setAtivo((atual) => (atual + passo + opcoes.length) % opcoes.length)
    } else if (event.key === "Enter") {
      // Nunca envia o formulário do talhão: Enter aqui é "ir para o lugar"
      event.preventDefault()
      const opcao = opcoes[ativo] ?? opcoes[0]
      if (opcao) escolher(opcao)
    } else if (event.key === "Escape" && aberto) {
      event.preventDefault()
      setAberto(false)
    }
  }

  const listaId = `${id}-lista`

  return (
    <div className="relative">
      <label htmlFor={`${id}-campo`} className="sr-only">
        Buscar endereço ou coordenadas
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={`${id}-campo`}
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={mostrarLista && opcoes[ativo] ? `${id}-opcao-${ativo}` : undefined}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        placeholder="Endereço, estrada, cidade ou coordenadas (-20.33, -40.29)"
        value={texto}
        onChange={(event) => {
          setTexto(event.target.value)
          setAtivo(0)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={teclar}
        className="pr-10 pl-10"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
        {carregando ? (
          <Loader2 aria-hidden className="mr-1.5 size-4 animate-spin text-muted-foreground" />
        ) : (
          texto && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => {
                setTexto("")
                document.getElementById(`${id}-campo`)?.focus()
              }}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </div>

      <ul
        id={listaId}
        role="listbox"
        aria-label="Lugares encontrados"
        hidden={!mostrarLista}
        // Clique na lista não pode tirar o foco do campo antes de escolher
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-x-0 top-full z-[1100] mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg"
      >
        {opcoes.map((lugar, indice) => {
          const Icone = lugar.id === "coordenadas" ? Crosshair : MapPin
          return (
            <li
              key={lugar.id}
              id={`${id}-opcao-${indice}`}
              role="option"
              aria-selected={indice === ativo}
              onClick={() => escolher(lugar)}
              onMouseEnter={() => setAtivo(indice)}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                indice === ativo && "bg-accent"
              )}
            >
              <Icone className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{lugar.titulo}</span>
                {lugar.detalhe && <span className="block truncate text-[13px] text-muted-foreground">{lugar.detalhe}</span>}
              </span>
            </li>
          )
        })}
        {semResultado && (
          <li role="presentation" className="px-2.5 py-2 text-sm text-muted-foreground">
            Nada encontrado. Tente o nome da estrada, do distrito ou cole as coordenadas do GPS.
          </li>
        )}
        {busca.isError && !coordenadas && (
          <li role="presentation" className="px-2.5 py-2 text-sm text-destructive">
            {busca.error.message}
          </li>
        )}
      </ul>
    </div>
  )
}
