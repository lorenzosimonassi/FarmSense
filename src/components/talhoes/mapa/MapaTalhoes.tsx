"use client"

import "leaflet/dist/leaflet.css"

import { useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import { MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet"
import { Check, Crosshair, Layers, LocateFixed, Maximize, Pencil, RotateCcw, Trash2, Undo2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Lugar } from "@/shared/busca-local"
import { areaHa, autointersecta, formatarHa, limites, type Contorno, type Ponto } from "@/shared/geo"

// Este módulo usa `window` (Leaflet): é importado só no navegador, via next/dynamic em ./index.tsx

/* ---------- Base comum: camadas, controles e enquadramento ---------- */

const BRASIL: L.LatLngTuple = [-14.2, -51.9]

const CAMADAS = {
  satelite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagens © Esri, Maxar, Earthstar Geographics",
  },
  mapa: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© colaboradores do OpenStreetMap",
  },
} as const

// Nomes de cidades e divisas por cima do satélite, para o produtor se localizar
const ROTULOS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"

type Camada = keyof typeof CAMADAS

// GeoJSON guarda [lng, lat]; o Leaflet trabalha com [lat, lng]
const paraLatLng = ([lng, lat]: Ponto): L.LatLngTuple => [lat, lng]
const paraPonto = ({ lat, lng }: L.LatLng): Ponto => [lng, lat]

function paraBounds(contornos: Contorno[]) {
  const [[oeste, sul], [leste, norte]] = limites(contornos)
  return L.latLngBounds([sul, oeste], [norte, leste])
}

export type Enquadramento = { contornos: Contorno[] } | { centro: { lat: number; lng: number } }

function enquadrar(map: L.Map, alvo: Enquadramento | null, animar = false) {
  if (!alvo) return
  if ("contornos" in alvo) {
    map.fitBounds(paraBounds(alvo.contornos), { padding: [32, 32], maxZoom: 17, animate: animar })
  } else {
    map.setView([alvo.centro.lat, alvo.centro.lng], 14, { animate: animar })
  }
}

// O mapa abre em um Sheet que anima a largura: recalcula o tamanho sempre que o contêiner muda
function AjustarTamanho() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

function BotaoMapa({
  rotulo,
  onClick,
  ativo,
  children,
}: {
  rotulo: string
  onClick: () => void
  ativo?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={ativo}
      onClick={onClick}
      className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-card/95 text-foreground shadow-md backdrop-blur transition-colors outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
    >
      {children}
    </button>
  )
}

function BaseMapa({
  alvoInicial,
  enquadrarDeNovo,
  className,
  children,
  overlay,
  onMapa,
  interativo = true,
  rotuloEnquadrar = "Enquadrar talhões",
  onLocalizado,
}: {
  alvoInicial: Enquadramento | null
  // Alvo do botão "enquadrar" (padrão: o inicial)
  enquadrarDeNovo?: Enquadramento | null
  className?: string
  children?: React.ReactNode
  overlay?: React.ReactNode
  onMapa?: (map: L.Map) => void
  interativo?: boolean
  rotuloEnquadrar?: string
  // Além de voar até a posição do GPS (ex.: marcar a fazenda ali)
  onLocalizado?: (ponto: { lat: number; lng: number }) => void
}) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [camada, setCamada] = useState<Camada>("satelite")
  const [localizando, setLocalizando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  // Enquadra uma única vez, quando o primeiro alvo fica disponível (a localização da fazenda chega depois)
  const enquadrado = useRef(false)
  useEffect(() => {
    if (!map || enquadrado.current || !alvoInicial) return
    enquadrar(map, alvoInicial)
    enquadrado.current = true
  }, [map, alvoInicial])

  useEffect(() => {
    if (map) onMapa?.(map)
  }, [map, onMapa])

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(timer)
  }, [aviso])

  function localizar() {
    if (!map) return
    setLocalizando(true)
    map.once("locationfound", (event: L.LocationEvent) => {
      setLocalizando(false)
      map.flyTo(event.latlng, Math.max(map.getZoom(), 16))
      onLocalizado?.({ lat: event.latlng.lat, lng: event.latlng.lng })
    })
    map.once("locationerror", () => {
      setLocalizando(false)
      setAviso("Não foi possível obter sua localização. Verifique a permissão do navegador.")
    })
    map.locate({ enableHighAccuracy: true, timeout: 10_000 })
  }

  return (
    <div className={cn("relative isolate overflow-hidden rounded-xl bg-muted", className)}>
      <MapContainer
        ref={setMap}
        center={BRASIL}
        zoom={4}
        maxZoom={20}
        zoomSnap={0.5}
        scrollWheelZoom={interativo}
        dragging={interativo}
        attributionControl
        className="talhoes-mapa size-full"
      >
        <TileLayer
          key={camada}
          url={CAMADAS[camada].url}
          attribution={CAMADAS[camada].attribution}
          maxNativeZoom={19}
          maxZoom={20}
        />
        {camada === "satelite" && <TileLayer url={ROTULOS_URL} maxNativeZoom={19} maxZoom={20} opacity={0.85} />}
        <AjustarTamanho />
        {children}
      </MapContainer>

      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <BotaoMapa
          rotulo={camada === "satelite" ? "Ver mapa de ruas" : "Ver satélite"}
          onClick={() => setCamada((atual) => (atual === "satelite" ? "mapa" : "satelite"))}
        >
          <Layers />
        </BotaoMapa>
        <BotaoMapa rotulo="Ir para minha localização" onClick={localizar}>
          {localizando ? <Crosshair className="animate-pulse" /> : <LocateFixed />}
        </BotaoMapa>
        {(enquadrarDeNovo ?? alvoInicial) && (
          <BotaoMapa rotulo={rotuloEnquadrar} onClick={() => map && enquadrar(map, enquadrarDeNovo ?? alvoInicial, true)}>
            <Maximize />
          </BotaoMapa>
        )}
      </div>

      {aviso && (
        <p
          role="status"
          className="absolute inset-x-3 bottom-8 z-[1000] rounded-lg bg-card/95 px-3 py-2 text-xs shadow-md sm:right-auto sm:max-w-xs"
        >
          {aviso}
        </p>
      )}
      {overlay}
    </div>
  )
}

/* ---------- Visualização: todos os talhões, com destaque ligado à lista ---------- */

export type TalhaoNoMapa = { id: string; nome: string; contorno: Contorno | null }

// Cores fixas (não tokens): o Leaflet aplica como atributos SVG, e o milho contrasta bem com o verde do satélite
const MILHO = "#e0a526"
const BRANCO = "#ffffff"
const ERRO = "#c1402b"

const ESTILO = {
  normal: { color: MILHO, weight: 2, opacity: 1, fillColor: MILHO, fillOpacity: 0.18 },
  destaque: { color: BRANCO, weight: 3, opacity: 1, fillColor: MILHO, fillOpacity: 0.4 },
  apagado: { color: MILHO, weight: 1.5, opacity: 0.55, fillColor: MILHO, fillOpacity: 0.06 },
  editando: { color: BRANCO, weight: 3, opacity: 1, fillColor: MILHO, fillOpacity: 0.25 },
  erro: { color: ERRO, weight: 3, opacity: 1, fillColor: ERRO, fillOpacity: 0.25 },
  linha: { color: BRANCO, weight: 3, opacity: 1 },
  guia: { color: BRANCO, weight: 2, opacity: 0.8, dashArray: "6 6", interactive: false },
  // Perímetro da fazenda: referência de fundo nos mapas de talhões, destaque na tela de limites
  fazenda: { color: BRANCO, weight: 2, opacity: 0.9, dashArray: "8 6", fill: false, interactive: false },
  fazendaDestaque: { color: BRANCO, weight: 2.5, opacity: 1, fillColor: BRANCO, fillOpacity: 0.12, interactive: false },
} satisfies Record<string, L.PathOptions>

export function MapaVisao({
  talhoes,
  destaque = null,
  onDestaque,
  onSelecionar,
  rotulos = true,
  limite = null,
  className,
}: {
  talhoes: TalhaoNoMapa[]
  destaque?: string | null
  onDestaque?: (id: string | null) => void
  onSelecionar?: (id: string) => void
  rotulos?: boolean
  // Perímetro da fazenda: desenhado por baixo e usado para enquadrar enquanto não há talhões no mapa
  limite?: Contorno[] | null
  className?: string
}) {
  const mapeados = talhoes.filter((talhao): talhao is TalhaoNoMapa & { contorno: Contorno } => talhao.contorno !== null)
  const contornos = mapeados.map((talhao) => talhao.contorno)
  // Recria o alvo só quando os contornos mudam, não a cada destaque
  const chave = JSON.stringify(contornos)
  const alvo = useMemo<Enquadramento | null>(
    () => (contornos.length ? { contornos } : limite?.length ? { contornos: limite } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chave, limite]
  )

  return (
    <BaseMapa alvoInicial={alvo} className={className}>
      <RefazerEnquadramento alvo={alvo} />
      <PerimetroFazenda limite={limite} />
      {mapeados.map((talhao) => (
        <Polygon
          key={talhao.id}
          positions={talhao.contorno.map(paraLatLng)}
          pathOptions={destaque === null ? ESTILO.normal : destaque === talhao.id ? ESTILO.destaque : ESTILO.apagado}
          eventHandlers={{
            mouseover: () => onDestaque?.(talhao.id),
            mouseout: () => onDestaque?.(null),
            click: () => onSelecionar?.(talhao.id),
          }}
        >
          {rotulos && (
            <Tooltip permanent direction="center" className="talhao-rotulo">
              {talhao.nome}
            </Tooltip>
          )}
        </Polygon>
      ))}
    </BaseMapa>
  )
}

// Na lista, um talhão novo ou excluído muda o conjunto: reenquadra para mostrar todos
function RefazerEnquadramento({ alvo }: { alvo: Enquadramento | null }) {
  const map = useMap()
  const primeira = useRef(true)
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    enquadrar(map, alvo, true)
  }, [map, alvo])
  return null
}

function PerimetroFazenda({ limite }: { limite: Contorno[] | null }) {
  if (!limite?.length) return null
  return <Polygon positions={limite.map((contorno) => contorno.map(paraLatLng))} pathOptions={ESTILO.fazenda} />
}

/* ---------- Localização da fazenda: um pino no mapa ---------- */

// O Leaflet posiciona o ícone com transform: a gota girada fica num elemento interno
const ICONE_FAZENDA = L.divIcon({
  className: "fazenda-pino",
  html: '<span class="fazenda-pino-gota"></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

function CliqueMarca({ onPonto }: { onPonto: (ponto: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (event) => onPonto({ lat: event.latlng.lat, lng: event.latlng.lng }) })
  return null
}

export function MapaLocalizacao({
  ponto,
  onChange,
  centro,
  limite = null,
  destino = null,
  className,
}: {
  ponto: { lat: number; lng: number } | null
  onChange: (ponto: { lat: number; lng: number }) => void
  // Onde abrir sem ponto marcado (centro do município)
  centro?: { lat: number; lng: number } | null
  limite?: Contorno[] | null
  destino?: Lugar | null
  className?: string
}) {
  const alvo = useMemo<Enquadramento | null>(() => {
    if (ponto) return { centro: ponto }
    if (limite?.length) return { contornos: limite }
    if (centro) return { centro }
    return null
    // Só o enquadramento de abertura; depois quem move o mapa é o produtor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro, limite])

  return (
    <BaseMapa
      alvoInicial={alvo}
      enquadrarDeNovo={ponto ? { centro: ponto } : alvo}
      rotuloEnquadrar={ponto ? "Ir para o ponto marcado" : "Enquadrar a fazenda"}
      onLocalizado={onChange}
      className={cn("h-80 sm:h-96", className)}
      overlay={
        !ponto && (
          <p className="pointer-events-none absolute inset-x-3 bottom-7 z-[1000] mx-auto w-fit rounded-lg bg-card/95 px-3 py-2 text-center text-[13px] font-medium shadow-md">
            Clique no mapa onde fica a sede da fazenda
          </p>
        )
      }
    >
      <PerimetroFazenda limite={limite} />
      {/* O próprio pino da fazenda vai para o lugar buscado: sem pino extra */}
      <VoarPara destino={destino} pino={false} />
      <CliqueMarca onPonto={onChange} />
      {ponto && (
        <Marker
          position={[ponto.lat, ponto.lng]}
          icon={ICONE_FAZENDA}
          draggable
          autoPan
          title="Arraste para ajustar"
          eventHandlers={{ dragend: (event) => onChange((event.target as L.Marker).getLatLng()) }}
        />
      )}
    </BaseMapa>
  )
}

/* ---------- Limites da fazenda: o perímetro importado do CAR ---------- */

export function MapaFazenda({ contornos, className }: { contornos: Contorno[]; className?: string }) {
  const chave = JSON.stringify(contornos)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const alvo = useMemo<Enquadramento>(() => ({ contornos }), [chave])

  return (
    <BaseMapa alvoInicial={alvo} rotuloEnquadrar="Enquadrar fazenda" className={className}>
      {/* Outro arquivo importado no lugar: enquadra o contorno novo */}
      <RefazerEnquadramento alvo={alvo} />
      <Polygon positions={contornos.map((contorno) => contorno.map(paraLatLng))} pathOptions={ESTILO.fazendaDestaque} />
    </BaseMapa>
  )
}

/* ---------- Editor: desenhar e ajustar o contorno de um talhão ---------- */

const ICONE_VERTICE = L.divIcon({ className: "talhao-vertice", iconSize: [14, 14] })
const ICONE_INICIAL = L.divIcon({ className: "talhao-vertice talhao-vertice-inicial", iconSize: [18, 18] })
const ICONE_MEIO = L.divIcon({ className: "talhao-meio", iconSize: [10, 10] })
const ICONE_DESTINO = L.divIcon({ className: "talhao-destino", iconSize: [18, 18] })

// Lugar escolhido na busca: voa até ele e deixa um pino de referência (não atrapalha os cliques do desenho)
function VoarPara({ destino, pino = true }: { destino: Lugar | null; pino?: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (!destino) return
    const [oeste, sul, leste, norte] = destino.caixa ?? [destino.lng, destino.lat, destino.lng, destino.lat]
    // Estrada, bairro ou cidade: enquadra a área toda; endereço ou coordenada: chega perto para desenhar
    if (leste - oeste > 0.002 || norte - sul > 0.002) {
      map.flyToBounds(L.latLngBounds([sul, oeste], [norte, leste]), { padding: [32, 32], maxZoom: 17, duration: 1.2 })
    } else {
      map.flyTo([destino.lat, destino.lng], 17, { duration: 1.2 })
    }
  }, [map, destino])

  if (!destino || !pino) return null
  return (
    <Marker position={[destino.lat, destino.lng]} icon={ICONE_DESTINO} interactive={false} keyboard={false}>
      <Tooltip direction="top" offset={[0, -10]} className="talhao-rotulo">
        {destino.titulo}
      </Tooltip>
    </Marker>
  )
}

type Modo = "vazio" | "desenhando" | "pronto"

export type MudancaContorno = { contorno: Contorno | null; desenhando: boolean }

function CliquesDoMapa({
  ativo,
  onPonto,
  onCursor,
}: {
  ativo: boolean
  onPonto: (ponto: Ponto) => void
  onCursor: (ponto: Ponto | null) => void
}) {
  const map = useMapEvents({
    click: (event) => ativo && onPonto(paraPonto(event.latlng)),
    mousemove: (event) => ativo && onCursor(paraPonto(event.latlng)),
    mouseout: () => onCursor(null),
  })

  // Enquanto desenha, clique duplo marca pontos em vez de dar zoom, e o cursor vira mira
  useEffect(() => {
    if (ativo) map.doubleClickZoom.disable()
    else map.doubleClickZoom.enable()
    map.getContainer().classList.toggle("talhoes-mapa-desenhando", ativo)
  }, [map, ativo])

  return null
}

export function MapaEditor({
  valor,
  onChange,
  outros = [],
  centroFazenda,
  limite = null,
  destino = null,
  className,
}: {
  valor: Contorno | null
  onChange: (mudanca: MudancaContorno) => void
  // Lugar escolhido na busca de endereço, acima do mapa
  destino?: Lugar | null
  // Demais talhões da fazenda, como referência para desenhar ao lado deles
  outros?: TalhaoNoMapa[]
  centroFazenda?: { lat: number; lng: number } | null
  limite?: Contorno[] | null
  className?: string
}) {
  const [pontos, setPontos] = useState<Ponto[]>(valor ?? [])
  const [modo, setModo] = useState<Modo>(valor ? "pronto" : "vazio")
  const [cursor, setCursor] = useState<Ponto | null>(null)
  // Contorno salvo antes de "Redesenhar", para o "Cancelar" voltar a ele
  const anterior = useRef<Ponto[] | null>(null)

  const contornosOutros = outros.flatMap((talhao) => (talhao.contorno ? [talhao.contorno] : []))
  const alvo = useMemo<Enquadramento | null>(() => {
    if (valor) return { contornos: [valor] }
    if (contornosOutros.length) return { contornos: contornosOutros }
    if (limite?.length) return { contornos: limite }
    if (centroFazenda) return { centro: centroFazenda }
    return null
    // O enquadramento inicial só depende do que já existia ao abrir o editor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centroFazenda, limite, outros.length])

  function emitir(proximos: Ponto[], proximoModo: Modo) {
    setPontos(proximos)
    setModo(proximoModo)
    onChange({
      contorno: proximoModo === "pronto" ? proximos : null,
      desenhando: proximoModo === "desenhando",
    })
  }

  function comecar() {
    anterior.current = modo === "pronto" ? pontos : null
    emitir([], "desenhando")
  }

  function cancelar() {
    const voltar = anterior.current
    anterior.current = null
    emitir(voltar ?? [], voltar ? "pronto" : "vazio")
  }

  function concluir() {
    if (pontos.length >= 3) {
      anterior.current = null
      emitir(pontos, "pronto")
    }
  }

  function mover(indice: number, ponto: Ponto) {
    const proximos = pontos.map((atual, i) => (i === indice ? ponto : atual))
    emitir(proximos, modo)
  }

  function remover(indice: number) {
    // Contorno pronto precisa de 3 pontos; durante o desenho pode esvaziar
    if (modo === "pronto" && pontos.length <= 3) return
    emitir(
      pontos.filter((_, i) => i !== indice),
      modo
    )
  }

  function inserir(depoisDe: number, ponto: Ponto) {
    emitir([...pontos.slice(0, depoisDe + 1), ponto, ...pontos.slice(depoisDe + 1)], modo)
  }

  const area = pontos.length >= 3 ? areaHa(pontos) : 0
  const cruza = pontos.length >= 4 && autointersecta(pontos)
  const desenhando = modo === "desenhando"

  const instrucao = desenhando
    ? pontos.length === 0
      ? "Clique no mapa para marcar o primeiro canto do talhão."
      : pontos.length < 3
        ? "Continue marcando os cantos, seguindo a borda."
        : "Clique no primeiro ponto (maior) ou em Concluir para fechar."
    : modo === "pronto"
      ? "Arraste os pontos para ajustar. Clique em um ponto pequeno para criar um canto; clique com o botão direito para remover."
      : null

  return (
    <div className="flex flex-col gap-2">
      <BaseMapa
        alvoInicial={alvo}
        enquadrarDeNovo={pontos.length >= 3 ? { contornos: [pontos] } : alvo}
        className={cn("h-80", className)}
        overlay={
          <>
            {area > 0 && (
              <div
                className={cn(
                  "pointer-events-none absolute top-3 left-14 z-[1000] rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums shadow-md",
                  cruza ? "bg-destructive text-white" : "bg-card/95 text-foreground"
                )}
              >
                {cruza ? "Bordas se cruzando" : formatarHa(area)}
              </div>
            )}
            <div className="absolute inset-x-3 bottom-7 z-[1000] flex flex-wrap justify-center gap-2">
              {modo === "vazio" && (
                <AcaoMapa principal onClick={comecar}>
                  <Pencil />
                  Desenhar contorno
                </AcaoMapa>
              )}
              {desenhando && (
                <>
                  <AcaoMapa onClick={() => emitir(pontos.slice(0, -1), modo)} disabled={pontos.length === 0}>
                    <Undo2 />
                    Desfazer ponto
                  </AcaoMapa>
                  <AcaoMapa onClick={cancelar}>
                    <X />
                    Cancelar
                  </AcaoMapa>
                  <AcaoMapa principal onClick={concluir} disabled={pontos.length < 3}>
                    <Check />
                    Concluir
                  </AcaoMapa>
                </>
              )}
              {modo === "pronto" && (
                <>
                  <AcaoMapa onClick={comecar}>
                    <RotateCcw />
                    Redesenhar
                  </AcaoMapa>
                  <AcaoMapa
                    onClick={() => {
                      anterior.current = null
                      emitir([], "vazio")
                    }}
                  >
                    <Trash2 />
                    Remover contorno
                  </AcaoMapa>
                </>
              )}
            </div>
          </>
        }
      >
        <PerimetroFazenda limite={limite} />
        <VoarPara destino={destino} />
        <CliquesDoMapa ativo={desenhando} onPonto={(ponto) => emitir([...pontos, ponto], modo)} onCursor={setCursor} />

        {outros.map(
          (talhao) =>
            talhao.contorno && (
              <Polygon
                key={talhao.id}
                positions={talhao.contorno.map(paraLatLng)}
                pathOptions={{ ...ESTILO.apagado, interactive: false }}
              >
                <Tooltip permanent direction="center" className="talhao-rotulo talhao-rotulo-apagado">
                  {talhao.nome}
                </Tooltip>
              </Polygon>
            )
        )}

        {modo === "pronto" ? (
          <Polygon
            positions={pontos.map(paraLatLng)}
            pathOptions={cruza ? ESTILO.erro : ESTILO.editando}
          />
        ) : (
          pontos.length > 0 && (
            <>
              <Polyline positions={pontos.map(paraLatLng)} pathOptions={ESTILO.linha} />
              {cursor && (
                <Polyline
                  positions={[paraLatLng(pontos.at(-1)!), paraLatLng(cursor), ...(pontos.length >= 2 ? [paraLatLng(pontos[0])] : [])]}
                  pathOptions={ESTILO.guia}
                />
              )}
            </>
          )
        )}

        {modo === "pronto" &&
          pontos.map((ponto, i) => {
            const proximo = pontos[(i + 1) % pontos.length]
            const meio: Ponto = [(ponto[0] + proximo[0]) / 2, (ponto[1] + proximo[1]) / 2]
            return (
              <Marker
                key={`meio-${i}-${meio.join()}`}
                position={paraLatLng(meio)}
                icon={ICONE_MEIO}
                title="Criar um canto aqui"
                eventHandlers={{ click: () => inserir(i, meio) }}
              />
            )
          })}

        {pontos.map((ponto, i) => (
          <Marker
            key={i}
            position={paraLatLng(ponto)}
            icon={desenhando && i === 0 && pontos.length >= 3 ? ICONE_INICIAL : ICONE_VERTICE}
            draggable
            autoPan
            eventHandlers={{
              drag: (event) => mover(i, paraPonto((event.target as L.Marker).getLatLng())),
              click: () => {
                if (desenhando && i === 0) concluir()
              },
              contextmenu: () => remover(i),
            }}
          />
        ))}
      </BaseMapa>

      {instrucao && (
        <p className="text-[13px] text-muted-foreground">{instrucao}</p>
      )}
    </div>
  )
}

function AcaoMapa({
  principal,
  disabled,
  onClick,
  children,
}: {
  principal?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium shadow-md backdrop-blur transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4",
        principal ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card/95 text-foreground hover:bg-card"
      )}
    >
      {children}
    </button>
  )
}
