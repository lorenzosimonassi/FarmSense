"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

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

export function FormField({ label, name, error, hint, labelAction, suffix, type, ...props }: FormFieldProps) {
  // Campo de senha ganha o "olho" para conferir o que foi digitado
  const senha = type === "password"
  const [visivel, setVisivel] = useState(false)
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
          className={suffix || senha ? "pr-11" : undefined}
          type={senha && visivel ? "text" : type}
          {...props}
        />
        {senha && (
          <button
            type="button"
            onClick={() => setVisivel((atual) => !atual)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            aria-controls={name}
            aria-pressed={visivel}
            title={visivel ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-1 my-auto flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
            disabled={props.disabled}
          >
            {visivel ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        )}
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
