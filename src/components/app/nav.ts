import {
  BarChart3,
  Beef,
  CalendarDays,
  LayoutDashboard,
  Map as MapIcon,
  Scale,
  Settings,
  Sprout,
  Syringe,
  type LucideIcon,
} from "lucide-react"

import type { Atividade } from "@/shared/schemas/propriedade"

export type NavItem = { label: string; href: string; icon: LucideIcon }
// Grupos com `atividade` só aparecem para fazendas que têm essa atividade
export type NavGroup = { label: string; items: NavItem[]; atividade?: Atividade }

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Geral",
    items: [{ label: "Visão geral", href: "/painel", icon: LayoutDashboard }],
  },
  {
    label: "Pecuária",
    atividade: "PECUARIA",
    items: [
      { label: "Rebanho", href: "/painel/rebanho", icon: Beef },
      { label: "Pesagens", href: "/painel/pesagens", icon: Scale },
      { label: "Sanidade", href: "/painel/sanidade", icon: Syringe },
    ],
  },
  {
    label: "Agricultura",
    atividade: "AGRICULTURA",
    items: [
      { label: "Talhões", href: "/painel/talhoes", icon: MapIcon },
      { label: "Culturas", href: "/painel/culturas", icon: Sprout },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Calendário", href: "/painel/calendario", icon: CalendarDays },
      { label: "Relatórios", href: "/painel/relatorios", icon: BarChart3 },
    ],
  },
]

export function navGroupsFor(atividades: Atividade[]) {
  return NAV_GROUPS.filter((group) => !group.atividade || atividades.includes(group.atividade))
}

export const NAV_FOOTER: NavItem[] = [{ label: "Configurações", href: "/painel/configuracoes", icon: Settings }]

const ALL_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), ...NAV_FOOTER]

export function findNavItem(pathname: string) {
  return ALL_ITEMS.find((item) => item.href === pathname)
}

export function findNavGroup(pathname: string) {
  return NAV_GROUPS.find((group) => group.items.some((item) => item.href === pathname))
}

// Seções ainda em construção — usadas pela rota /painel/[secao]
export function findSection(slug: string) {
  return ALL_ITEMS.find((item) => item.href === `/painel/${slug}`)
}

export const SIDEBAR_COOKIE = "sidebar_collapsed"
