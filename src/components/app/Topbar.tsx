"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Info,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  TriangleAlert,
  UserRound,
} from "lucide-react"

import { findNavGroup, findNavItem } from "@/components/app/nav"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { authClient } from "@/lib/auth/client"
import { cn } from "@/lib/utils"
import type { ItemAtencao } from "@/shared/visao-geral"

export type ShellUser = { name: string; email: string }

type TopbarProps = {
  user: ShellUser
  collapsed: boolean
  onToggleCollapsed: () => void
  onOpenMobileNav: () => void
}

export function Topbar({ user, collapsed, onToggleCollapsed, onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname()
  const item = findNavItem(pathname)
  const group = findNavGroup(pathname)

  return (
    <header className="sticky top-0 z-30 print:hidden border-b border-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="flex h-16 items-center gap-1.5 px-[max(0.75rem,env(safe-area-inset-left))] sm:gap-3 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={onOpenMobileNav}>
          <Menu />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 hidden lg:inline-flex"
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          title={`${collapsed ? "Expandir" : "Recolher"} menu (Ctrl+B)`}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>

        <nav aria-label="Você está em" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {group && (
              <li className="hidden shrink-0 items-center gap-1.5 text-muted-foreground sm:flex">
                {group.label}
                <ChevronRight className="size-3.5" />
              </li>
            )}
            <li className="truncate font-semibold text-foreground" aria-current="page">
              {item?.label ?? "Painel"}
            </li>
          </ol>
        </nav>

        <label className="relative hidden w-full max-w-64 md:block xl:max-w-80">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar animal, talhão..."
            className="h-10 w-full rounded-lg border border-input bg-card pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </label>

        <Notifications />
        <UserMenu user={user} />
      </div>
    </header>
  )
}

const TONES = {
  info: { icon: Info, className: "bg-series-3/10 text-series-3" },
  alerta: { icon: TriangleAlert, className: "bg-status-warning/12 text-status-warning" },
  critico: { icon: CircleAlert, className: "bg-status-critical/10 text-status-critical" },
}

// Calculadas na hora a partir dos dados (a mesma lista do "Precisa de atenção"): sem estado de lida.
// Recarrega ao trocar de página e ao abrir, para refletir o que acabou de ser registrado.
function Notifications() {
  const pathname = usePathname()
  const [itens, setItens] = useState<ItemAtencao[] | null>(null)
  const [aberto, setAberto] = useState(false)

  const carregar = useCallback(() => {
    fetch("/api/notificacoes")
      .then((response) => (response.ok ? response.json() : null))
      .then((dados: ItemAtencao[] | null) => dados && setItens(dados))
      .catch(() => {})
  }, [])

  useEffect(carregar, [carregar, pathname])

  const urgentes = (itens ?? []).filter((n) => n.gravidade !== "info").length

  return (
    <Popover
      open={aberto}
      onOpenChange={(open) => {
        setAberto(open)
        if (open) carregar()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={itens?.length ? `Notificações (${itens.length})` : "Notificações"}
        >
          <Bell />
          {urgentes > 0 && (
            <span className="absolute top-1 right-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {urgentes}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          {itens && itens.length > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
              {itens.length === 1 ? "1 aviso" : `${itens.length} avisos`}
            </span>
          )}
        </div>
        {itens === null ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <CircleCheck className="size-6 text-status-good" />
            <p className="text-sm font-medium">Tudo em dia</p>
            <p className="text-xs text-muted-foreground">Nenhum reforço, colheita ou animal pedindo atenção.</p>
          </div>
        ) : (
          <ul className="max-h-[min(24rem,60dvh)] overflow-y-auto p-1.5">
            {itens.map((n) => {
              const tone = TONES[n.gravidade]
              return (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setAberto(false)} className="flex gap-3 rounded-lg p-2.5 outline-none hover:bg-accent/60 focus-visible:bg-accent/60">
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tone.className)}>
                      <tone.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug font-medium">{n.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.detalhe}</p>
                      <p className="mt-1 text-[11px] font-medium text-primary">{n.acao}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}

function UserMenu({ user }: { user: ShellUser }) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full p-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:pr-3"
          aria-label="Abrir menu do usuário"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials(user.name)}
          </span>
          <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{user.name.split(" ")[0]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/painel/configuracoes">
            <UserRound />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/painel/configuracoes">
            <Settings />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
