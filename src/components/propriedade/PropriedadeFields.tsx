"use client"

import Image from "next/image"
import { Check } from "lucide-react"

import { FormField } from "@/components/auth/FormField"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { UFS, type Atividade, type TipoRebanho } from "@/shared/schemas/propriedade"

import type { PropriedadeErrors, PropriedadeValues } from "@/components/propriedade/values"

const ATIVIDADE_OPTIONS: { value: Atividade; title: string; description: string; image: string; alt: string }[] = [
  {
    value: "PECUARIA",
    title: "Pecuária",
    description: "Gado de corte ou de leite",
    image: "/images/bois.jpg",
    alt: "Rebanho de gado nelore no pasto",
  },
  {
    value: "AGRICULTURA",
    title: "Agricultura",
    description: "Lavouras e talhões",
    image: "/images/trator.avif",
    alt: "Trator trabalhando em uma lavoura vista de cima",
  },
]

const TIPO_REBANHO_OPTIONS: { value: TipoRebanho; label: string }[] = [
  { value: "CORTE", label: "Corte" },
  { value: "LEITE", label: "Leite" },
  { value: "MISTO", label: "Misto" },
]

type PropriedadeFieldsProps = {
  values: PropriedadeValues
  errors: PropriedadeErrors
  onChange: (values: PropriedadeValues) => void
}

// Campos da fazenda, controlados: usados no cadastro, no primeiro acesso e em Configurações
export function PropriedadeFields({ values, errors, onChange }: PropriedadeFieldsProps) {
  function set<K extends keyof PropriedadeValues>(key: K, value: PropriedadeValues[K]) {
    onChange({ ...values, [key]: value })
  }

  function toggleAtividade(atividade: Atividade, checked: boolean) {
    const atividades = checked
      ? ATIVIDADE_OPTIONS.map((option) => option.value).filter(
          (value) => value === atividade || values.atividades.includes(value)
        )
      : values.atividades.filter((value) => value !== atividade)
    // Sem pecuária não existe tipo de rebanho
    const tipoRebanho = atividades.includes("PECUARIA") ? values.tipoRebanho : null
    onChange({ ...values, atividades, tipoRebanho })
  }

  const temPecuaria = values.atividades.includes("PECUARIA")

  return (
    <div className="flex flex-col gap-5">
      <fieldset aria-describedby={errors.atividades ? "atividades-error" : undefined} className="flex flex-col gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">O que sua fazenda faz?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ATIVIDADE_OPTIONS.map((option) => (
            <AtividadeCard
              key={option.value}
              {...option}
              checked={values.atividades.includes(option.value)}
              invalid={Boolean(errors.atividades)}
              onCheckedChange={(checked) => toggleAtividade(option.value, checked)}
            />
          ))}
        </div>
        <p className="text-[13px] text-muted-foreground">Pode marcar as duas.</p>
        {errors.atividades && (
          <p id="atividades-error" className="text-[13px] text-destructive">
            {errors.atividades}
          </p>
        )}
      </fieldset>

      {temPecuaria && (
        <fieldset
          aria-describedby={errors.tipoRebanho ? "tipoRebanho-error" : undefined}
          className="flex animate-in flex-col gap-2 duration-300 fade-in slide-in-from-top-1 motion-reduce:animate-none"
        >
          <legend className="mb-2 text-sm leading-none font-medium">Tipo de rebanho</legend>
          <div
            className={cn(
              "grid grid-cols-3 gap-1 rounded-lg border bg-muted p-1",
              errors.tipoRebanho ? "border-destructive" : "border-input"
            )}
          >
            {TIPO_REBANHO_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex h-9 cursor-pointer items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors has-checked:bg-card has-checked:text-primary has-checked:shadow-xs has-focus-visible:ring-2 has-focus-visible:ring-ring/40 hover:text-foreground pointer-coarse:h-10"
              >
                <input
                  type="radio"
                  name="tipoRebanho"
                  value={option.value}
                  checked={values.tipoRebanho === option.value}
                  onChange={() => set("tipoRebanho", option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {errors.tipoRebanho && (
            <p id="tipoRebanho-error" className="text-[13px] text-destructive">
              {errors.tipoRebanho}
            </p>
          )}
        </fieldset>
      )}

      <FormField
        label="Nome da fazenda"
        name="nome"
        autoComplete="organization"
        placeholder="Fazenda Boa Vista"
        value={values.nome}
        onChange={(event) => set("nome", event.target.value)}
        error={errors.nome}
      />

      <div className="grid gap-5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
        <UfSelect value={values.uf} error={errors.uf} onChange={(uf) => set("uf", uf)} />
        <FormField
          label="Município"
          name="municipio"
          autoComplete="address-level2"
          value={values.municipio}
          onChange={(event) => set("municipio", event.target.value)}
          error={errors.municipio}
        />
      </div>

      <FormField
        label="Área total (opcional)"
        name="areaTotalHa"
        inputMode="decimal"
        placeholder="120,5"
        suffix="ha"
        hint="Em hectares. Pode deixar em branco se não souber agora."
        value={values.areaTotalHa}
        onChange={(event) => set("areaTotalHa", event.target.value)}
        error={errors.areaTotalHa}
      />
    </div>
  )
}

function AtividadeCard({
  value,
  title,
  description,
  image,
  alt,
  checked,
  invalid,
  onCheckedChange,
}: (typeof ATIVIDADE_OPTIONS)[number] & {
  checked: boolean
  invalid: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-2.5 pr-4 shadow-xs transition-[border-color,box-shadow] has-focus-visible:ring-3 has-focus-visible:ring-ring/25 sm:flex-col sm:items-stretch sm:gap-0 sm:p-0 sm:pr-0",
        checked
          ? "border-primary ring-1 ring-primary"
          : invalid
            ? "border-destructive"
            : "border-input hover:border-primary/40"
      )}
    >
      <input
        type="checkbox"
        name="atividades"
        value={value}
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="sr-only"
      />
      <span className="relative size-16 shrink-0 overflow-hidden rounded-lg sm:aspect-[16/10] sm:size-auto sm:rounded-none sm:rounded-t-[11px]">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(min-width: 640px) 12rem, 4rem"
          className={cn("object-cover transition-[filter] duration-300", !checked && "saturate-[.35]")}
        />
      </span>
      <span className="flex flex-col sm:px-3.5 sm:py-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-[13px] text-muted-foreground">{description}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "ml-auto flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors sm:absolute sm:top-2.5 sm:right-2.5",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card/90"
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
    </label>
  )
}

function UfSelect({ value, error, onChange }: { value: string; error?: string; onChange: (uf: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="uf">Estado</Label>
      <select
        id="uf"
        name="uf"
        autoComplete="address-level1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "uf-error" : undefined}
        className={cn(
          "h-11 w-full rounded-lg border border-input bg-card px-3 text-base shadow-xs transition-colors outline-none hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 aria-invalid:border-destructive aria-invalid:ring-destructive/20 sm:text-sm",
          !value && "text-muted-foreground"
        )}
      >
        <option value="" disabled>
          UF
        </option>
        {UFS.map((uf) => (
          <option key={uf.sigla} value={uf.sigla} className="text-foreground">
            {uf.sigla} · {uf.nome}
          </option>
        ))}
      </select>
      {error && (
        <p id="uf-error" className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
