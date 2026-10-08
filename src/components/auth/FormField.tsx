import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormFieldProps = React.ComponentProps<"input"> & {
  label: string
  name: string
  error?: string
  // Ajuda abaixo do campo (nunca como placeholder, que some ao digitar)
  hint?: string
  labelAction?: React.ReactNode
  // Unidade exibida dentro do campo, à direita (ex.: "ha")
  suffix?: string
}

export function FormField({ label, name, error, hint, labelAction, suffix, ...props }: FormFieldProps) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label htmlFor={name}>{label}</Label>
        {labelAction}
      </div>
      <div className="relative">
        <Input
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={suffix ? "pr-11" : undefined}
          {...props}
        />
        {suffix && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted-foreground"
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
