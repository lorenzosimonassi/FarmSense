import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Mesmo visual do Input, para select e textarea nativos
export const campoClasse =
  "w-full rounded-lg border border-input bg-card px-3.5 text-base text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 aria-invalid:border-destructive aria-invalid:ring-destructive/20 sm:text-sm"

function Erro({ name, error }: { name: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${name}-error`} className="text-[13px] text-destructive">
      {error}
    </p>
  )
}

export function TextareaField({
  label,
  name,
  error,
  className,
  ...props
}: React.ComponentProps<"textarea"> & { label: string; name: string; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(campoClasse, "min-h-24 resize-y py-2.5", className)}
        {...props}
      />
      <Erro name={name} error={error} />
    </div>
  )
}

// Grupo de opções em "pílulas" (radio), como o tipo de rebanho no cadastro da fazenda
export function OpcoesField<T extends string>({
  legend,
  name,
  options,
  value,
  error,
  onChange,
}: {
  legend: string
  name: string
  options: { value: T; label: string }[]
  value: T | ""
  error?: string
  onChange: (value: T) => void
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} className="flex flex-col gap-2">
      <legend className="mb-2 text-sm leading-none font-medium">{legend}</legend>
      <div
        className={cn(
          "grid gap-1 rounded-lg border bg-muted p-1",
          error ? "border-destructive" : "border-input"
        )}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="flex h-9 cursor-pointer items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors has-checked:bg-card has-checked:text-primary has-checked:shadow-xs has-focus-visible:ring-2 has-focus-visible:ring-ring/40 hover:text-foreground pointer-coarse:h-10"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      <Erro name={name} error={error} />
    </fieldset>
  )
}
