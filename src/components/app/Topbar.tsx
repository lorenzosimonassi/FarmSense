"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  ChevronRight,
  CircleAlert,
  CircleCheck,
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
import { NOTIFICATIONS } from "@/lib/mock/painel"
import { cn } from "@/lib/utils"

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
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
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
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </label>

        <Notifications />
        <UserMenu user={user} />
      </div>
    </header>
  )
}

const TONES = {
  good: { icon: CircleCheck, className: "bg-status-good/12 text-status-good" },
  warning: { icon: TriangleAlert, className: "bg-status-warning/12 text-status-warning" },
  critical: { icon: CircleAlert, className: "bg-status-critical/10 text-status-critical" },
}

function Notifications() {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0" aria-label={`Notificações (${unread} não lidas)`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">{unread} novas</span>
        </div>
        <ul className="max-h-[min(24rem,60dvh)] overflow-y-auto p-1.5">
          {NOTIFICATIONS.map((n) => {
            const tone = TONES[n.tone]
            return (
              <li key={n.id} className="flex gap-3 rounded-xl p-2.5 hover:bg-accent/60">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tone.className)}>
                  <tone.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-start justify-between gap-2 text-sm leading-snug font-medium">
                    {n.title}
                    {n.unread && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                        <span className="sr-only">Não lida</span>
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">{n.time}</p>
                </div>
              </li>
            )
          })}
        </ul>
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
