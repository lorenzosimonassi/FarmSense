import { cn } from "@/lib/utils"

export function FormAlert({
  children,
  variant = "error",
}: {
  children: React.ReactNode
  variant?: "error" | "success"
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variant === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-secondary/30 bg-accent text-secondary"
      )}
    >
      {children}
    </div>
  )
}
