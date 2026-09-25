"use client"

import { useCallback, useEffect, useState } from "react"

import { SIDEBAR_COOKIE } from "@/components/app/nav"
import { Sidebar } from "@/components/app/Sidebar"
import { Topbar, type ShellUser } from "@/components/app/Topbar"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type AppShellProps = {
  user: ShellUser
  // Lido do cookie no servidor: a sidebar já renderiza no estado certo, sem "piscar"
  defaultCollapsed: boolean
  children: React.ReactNode
}

export function AppShell({ user, defaultCollapsed, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value
      document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      return next
    })
  }, [])

  // Ctrl/Cmd + B recolhe a sidebar (mesmo atalho de editores e do shadcn)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "b" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggleCollapsed])

  return (
    <TooltipProvider>
      <div className={cn("min-h-dvh bg-background", collapsed ? "[--sidebar-w:4.5rem]" : "[--sidebar-w:16rem]")}>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-w) transition-[width] duration-300 ease-out motion-reduce:transition-none lg:block">
          <Sidebar collapsed={collapsed} />
        </aside>

        {/* Abaixo de lg a sidebar vira gaveta */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-72 max-w-[85vw] border-0 bg-sidebar [&>button]:text-sidebar-foreground [&>button]:hover:bg-sidebar-accent"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-dvh flex-col transition-[padding] duration-300 ease-out motion-reduce:transition-none lg:pl-(--sidebar-w)">
          <Topbar
            user={user}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            onOpenMobileNav={() => setMobileOpen(true)}
          />
          <main className="mx-auto w-full max-w-[1600px] flex-1 px-[max(1rem,env(safe-area-inset-left))] pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
