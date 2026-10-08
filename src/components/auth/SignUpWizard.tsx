"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { PropriedadeFields } from "@/components/propriedade/PropriedadeFields"
import { EMPTY_PROPRIEDADE, type PropriedadeErrors, type PropriedadeValues } from "@/components/propriedade/values"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { authErrorMessage } from "@/lib/auth/errors"
import { fieldErrors, signUpSchema, type FieldErrors } from "@/lib/auth/schemas"
import { cn } from "@/lib/utils"
import { propriedadeSchema } from "@/shared/schemas/propriedade"

type PessoaValues = { name: string; email: string; password: string; confirmPassword: string }

const EMPTY_PESSOA: PessoaValues = { name: "", email: "", password: "", confirmPassword: "" }

const STEPS = [
  { title: "Crie sua conta", description: "Comece a organizar a gestão da sua propriedade em poucos minutos." },
  { title: "Agora, sua fazenda", description: "Com isso o painel já mostra só o que faz sentido para a sua propriedade." },
]

// A etapa fica na URL (?etapa=2) para o "voltar" do navegador e o painel lateral acompanharem
function useEtapa() {
  const searchParams = useSearchParams()
  return searchParams.get("etapa") === "2" ? 2 : 1
}

function goToEtapa(etapa: 1 | 2, { replace = false } = {}) {
  const url = etapa === 1 ? window.location.pathname : `${window.location.pathname}?etapa=2`
  if (replace) window.history.replaceState(null, "", url)
  else window.history.pushState(null, "", url)
}

export function SignUpWizard({ googleSlot }: { googleSlot?: React.ReactNode }) {
  const router = useRouter()
  const etapa = useEtapa()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const [pessoa, setPessoa] = useState<PessoaValues>(EMPTY_PESSOA)
  const [propriedade, setPropriedade] = useState<PropriedadeValues>(EMPTY_PROPRIEDADE)
  const [pessoaErrors, setPessoaErrors] = useState<FieldErrors<PessoaValues>>({})
  const [propriedadeErrors, setPropriedadeErrors] = useState<PropriedadeErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Etapa 2 sem a etapa 1 preenchida (ex.: recarregou a página): volta para o começo
  useEffect(() => {
    if (etapa === 2 && !signUpSchema.safeParse(pessoa).success) goToEtapa(1, { replace: true })
  }, [etapa, pessoa])

  // Leva o foco ao título ao trocar de etapa, para leitores de tela anunciarem a mudança
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [etapa])

  function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = signUpSchema.safeParse(pessoa)
    if (!parsed.success) {
      setPessoaErrors(fieldErrors(parsed.error))
      return
    }
    setPessoaErrors({})
    goToEtapa(2)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const pessoaParsed = signUpSchema.safeParse(pessoa)
    if (!pessoaParsed.success) {
      setPessoaErrors(fieldErrors(pessoaParsed.error))
      goToEtapa(1)
      return
    }
    const propriedadeParsed = propriedadeSchema.safeParse(propriedade)
    if (!propriedadeParsed.success) {
      setPropriedadeErrors(fieldErrors(propriedadeParsed.error))
      return
    }
    setPropriedadeErrors({})

    const { name, email, password } = pessoaParsed.data
    setPending(true)
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/email-verificado",
      // Lido pelos hooks do Better Auth (src/lib/auth/index.ts), que criam a fazenda
      propriedade,
    } as Parameters<typeof authClient.signUp.email>[0])
    setPending(false)

    if (error) {
      setFormError(authErrorMessage(error))
      // Erros da conta (e-mail, senha) são corrigidos na etapa 1
      if (error.code !== "PROPRIEDADE_INVALIDA" && error.status && error.status < 500) goToEtapa(1)
      return
    }

    router.push(`/verificar-email?email=${encodeURIComponent(email)}`)
  }

  const step = STEPS[etapa - 1]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <StepIndicator etapa={etapa} />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-[1.875rem] leading-tight font-bold tracking-tight outline-none"
        >
          {step.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
      </div>

      {etapa === 1 ? (
        <div className="flex flex-col gap-5">
          {googleSlot}
          <form onSubmit={handleContinue} noValidate className="flex flex-col gap-5">
            {formError && <FormAlert>{formError}</FormAlert>}

            <FormField
              label="Nome completo"
              name="name"
              autoComplete="name"
              placeholder="João da Silva"
              value={pessoa.name}
              onChange={(event) => setPessoa({ ...pessoa, name: event.target.value })}
              error={pessoaErrors.name}
            />
            <FormField
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@fazenda.com.br"
              value={pessoa.email}
              onChange={(event) => setPessoa({ ...pessoa, email: event.target.value })}
              error={pessoaErrors.email}
            />
            <FormField
              label="Senha"
              name="password"
              type="password"
              autoComplete="new-password"
              hint="Mínimo de 8 caracteres, com letras e números"
              value={pessoa.password}
              onChange={(event) => setPessoa({ ...pessoa, password: event.target.value })}
              error={pessoaErrors.password}
            />
            <FormField
              label="Confirmar senha"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={pessoa.confirmPassword}
              onChange={(event) => setPessoa({ ...pessoa, confirmPassword: event.target.value })}
              error={pessoaErrors.confirmPassword}
            />

            <Button type="submit" className="mt-2 w-full">
              Continuar
              <ArrowRight />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {formError && <FormAlert>{formError}</FormAlert>}

          <PropriedadeFields values={propriedade} errors={propriedadeErrors} onChange={setPropriedade} />

          <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <Button type="button" variant="secondary" onClick={() => window.history.back()} disabled={pending}>
              <ArrowLeft />
              Voltar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Criar conta
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function StepIndicator({ etapa }: { etapa: 1 | 2 }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-medium text-muted-foreground">
        Etapa {etapa} de 2 <span aria-hidden>·</span> {etapa === 1 ? "Você" : "Sua fazenda"}
      </p>
      <div aria-hidden className="grid grid-cols-2 gap-1.5">
        {[1, 2].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1 rounded-full transition-colors duration-300",
              step <= etapa ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  )
}
