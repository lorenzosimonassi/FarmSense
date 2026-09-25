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

export type NavItem = { label: string; href: string; icon: LucideIcon }
export type NavGroup = { label: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Geral",
    items: [{ label: "Visão geral", href: "/painel", icon: LayoutDashboard }],
  },
  {
    label: "Pecuária",
    items: [
      { label: "Rebanho", href: "/painel/rebanho", icon: Beef },
      { label: "Pesagens", href: "/painel/pesagens", icon: Scale },
      { label: "Sanidade", href: "/painel/sanidade", icon: Syringe },
    ],
  },
  {
    label: "Agricultura",
    items: [
      { label: "Talhões", href: "/painel/talhoes", icon: MapIcon },
      { label: "Culturas", href: "/painel/culturas", icon: Sprout },
      { label: "Calendário", href: "/painel/calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Gestão",
    items: [{ label: "Relatórios", href: "/painel/relatorios", icon: BarChart3 }],
  },
]

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
