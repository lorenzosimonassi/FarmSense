"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NAV_FOOTER, NAV_GROUPS, type NavItem } from "@/components/app/nav"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SidebarProps = {
  collapsed?: boolean
  onNavigate?: () => void
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-3" : "px-5")}>
        <Link href="/painel" onClick={onNavigate} className="flex items-center" aria-label="FarmSense — Visão geral">
          {collapsed ? (
            <Image src="/logo/farmsense-icon-white.png" alt="" width={102} height={120} className="h-8 w-auto" />
          ) : (
            <Image
              src="/logo/farmsense-logo-white.png"
              alt="FarmSense"
              width={480}
              height={124}
              priority
              className="h-8 w-auto"
            />
          )}
        </Link>
      </div>

      <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {collapsed ? (
              <span aria-hidden className="mx-auto mb-1 h-px w-6 bg-sidebar-border first:hidden" />
            ) : (
              <span className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">
                {group.label}
              </span>
            )}
            {group.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={pathname === item.href}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-sidebar-border px-3 py-3">
        {NAV_FOOTER.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-xl text-sm font-medium transition-colors outline-none pointer-coarse:h-11 focus-visible:ring-2 focus-visible:ring-sidebar-foreground/40",
        collapsed ? "justify-center" : "px-3",
        active
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <span aria-hidden className="absolute top-2 bottom-2 left-0 w-0.75 rounded-r-full bg-earth" />
      )}
      <item.icon className="size-4.5 shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}
