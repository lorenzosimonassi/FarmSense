"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Loader2, MapPin, Trash2, Undo2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { BuscaLugar } from "@/components/talhoes/BuscaLugar"
import { MapaLocalizacao } from "@/components/talhoes/mapa"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useLimiteFazenda, useRemoverLocalizacao, useSalvarLocalizacao } from "@/lib/api/hooks/propriedade"
import { useLocalizacaoFazenda } from "@/lib/api/hooks/talhoes"
import type { Lugar } from "@/shared/busca-local"
import type { Localizacao } from "@/shared/schemas/propriedade"

const coordenada = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 5, maximumFractionDigits: 5 })

const mesmoPonto = (a: Localizacao | null, b: Localizacao | null) =>
  a === b || (a !== null && b !== null && a.lat === b.lat && a.lng === b.lng)

// Ponto da sede no mapa (opcional): o mapa dos talhões abre ali e a previsão do tempo passa a ser da fazenda
export function LocalizacaoFazenda({ inicial, municipio }: { inicial: Localizacao | null; municipio: string }) {
  const router = useRouter()
  const [salvo, setSalvo] = useState(inicial)
  const [ponto, setPonto] = useState(inicial)
  const [destino, setDestino] = useState<Lugar | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const { data: centro } = useLocalizacaoFazenda()
  const { data: limite } = useLimiteFazenda()
  const salvar = useSalvarLocalizacao()
  const remover = useRemoverLocalizacao()

  const alterado = !mesmoPonto(ponto, salvo)
  const ocupado = salvar.isPending || remover.isPending

  function marcar(novo: Localizacao) {
    setPonto({ lat: novo.lat, lng: novo.lng })
    setErro(null)
    setSucesso(null)
  }

  function falhou(error: unknown) {
    setErro(error instanceof ApiError ? error.message : "Não foi possível salvar. Tente novamente.")
  }

  function confirmar() {
    if (!ponto) return
    salvar.mutate(ponto, {
      onSuccess: (novo) => {
        setSalvo(novo)
        setSucesso("Localização salva. O mapa dos talhões e a previsão do tempo já usam esse ponto.")
        // Primeiros passos e clima vêm do servidor
        router.refresh()
      },
      onError: falhou,
    })
  }

  function desmarcar() {
    remover.mutate(undefined, {
      onSuccess: () => {
        setSalvo(null)
        setPonto(null)
        setSucesso(`Ponto removido. Voltamos a usar o centro de ${municipio}.`)
        router.refresh()
      },
      onError: falhou,
    })
  }

  return (
    <section
      id="localizacao"
      aria-labelledby="localizacao-titulo"
      className="max-w-2xl scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="localizacao-titulo" className="text-lg font-semibold tracking-tight">
          Localização da fazenda <span className="text-sm font-normal text-muted-foreground">(opcional)</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Marque onde fica a sede. O mapa dos talhões abre ali e a previsão do tempo passa a ser da sua fazenda, não do
          centro de {municipio}.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {erro && <FormAlert>{erro}</FormAlert>}
        {sucesso && !alterado && <FormAlert variant="success">{sucesso}</FormAlert>}

        <BuscaLugar
          onEscolher={(lugar) => {
            setDestino(lugar)
            marcar(lugar)
          }}
        />
        <MapaLocalizacao
          ponto={ponto}
          onChange={marcar}
          centro={centro}
          limite={limite?.contornos}
          destino={destino}
          className="border border-border"
        />
        <p className="text-[13px] text-muted-foreground">
          Busque o endereço, cole as coordenadas, use o botão de localização (no celular, estando na fazenda) ou clique no
          mapa. Depois arraste o pino para acertar.
        </p>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0 text-primary" />
            {ponto ? (
              <>
                <span className="tabular-nums">
                  {coordenada.format(ponto.lat)}, {coordenada.format(ponto.lng)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${ponto.lat},${ponto.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Conferir no Google Maps (abre em outra aba)"
                  className="inline-flex shrink-0 items-center rounded p-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </>
            ) : (
              <span className="text-muted-foreground">Nenhum ponto marcado</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {alterado && salvo && (
              <Button variant="ghost" size="sm" disabled={ocupado} onClick={() => setPonto(salvo)}>
                <Undo2 />
                Desfazer
              </Button>
            )}
            {salvo && !alterado && (
              <Button variant="ghost" size="sm" disabled={ocupado} onClick={desmarcar}>
                {remover.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Remover ponto
              </Button>
            )}
            <Button size="sm" disabled={!ponto || !alterado || ocupado} onClick={confirmar}>
              {salvar.isPending && <Loader2 className="animate-spin" />}
              Salvar localização
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
