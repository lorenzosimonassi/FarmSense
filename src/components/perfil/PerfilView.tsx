"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BellRing,
  CalendarDays,
  Download,
  FileLock2,
  KeyRound,
  Loader2,
  Mail,
  MailCheck,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserRound,
} from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { authClient } from "@/lib/auth/client"
import { authErrorMessage } from "@/lib/auth/errors"
import { fieldErrors, nomeSchema, trocarEmailSchema, trocarSenhaSchema, type FieldErrors } from "@/lib/auth/schemas"
import { cn } from "@/lib/utils"
import { ANTECEDENCIA_DIAS } from "@/shared/notificacoes"

type Usuario = {
  name: string
  email: string
  emailVerified: boolean
  membroDesde: string
  notificarPorEmail: boolean
  temSenha: boolean
  temGoogle: boolean
}

const membroFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes.at(-1)![0] : "")).toUpperCase()
}

// Só a pessoa: nome, e-mail, senha e avisos. Os dados da fazenda ficam em Configurações
export function PerfilView({ user, emailConfirmado }: { user: Usuario; emailConfirmado: boolean }) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {emailConfirmado && <FormAlert variant="success">Pronto! Seu e-mail foi alterado para {user.email}.</FormAlert>}

      <section className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-8">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold tracking-tight text-primary-foreground shadow-sm"
        >
          {iniciais(user.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold tracking-tight">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {user.emailVerified && (
              <Badge variant="secondary">
                <MailCheck />
                E-mail confirmado
              </Badge>
            )}
            {user.temGoogle && (
              <Badge variant="outline">
                <ShieldCheck />
                Conectado ao Google
              </Badge>
            )}
            <Badge variant="outline">
              <CalendarDays />
              Desde {membroFormatter.format(new Date(user.membroDesde))}
            </Badge>
          </div>
        </div>
      </section>

      <DadosPessoais user={user} />
      <Senha temSenha={user.temSenha} />
      <Avisos ativo={user.notificarPorEmail} />
      <SeusDados />
      <ExcluirConta temSenha={user.temSenha} />
    </div>
  )
}

function Secao({
  id,
  icone: Icone,
  titulo,
  descricao,
  children,
}: {
  id?: string
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  descricao: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id ?? titulo}-titulo`}
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-8"
    >
      <div className="mb-5 flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Icone className="size-4.5" />
        </span>
        <div>
          <h2 id={`${id ?? titulo}-titulo`} className="text-lg font-semibold tracking-tight">
            {titulo}
          </h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/* ---------- Nome e e-mail ---------- */

function DadosPessoais({ user }: { user: Usuario }) {
  const router = useRouter()
  const [nome, setNome] = useState(user.name)
  const [erroNome, setErroNome] = useState<string>()
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [nomeSalvo, setNomeSalvo] = useState(false)

  const [trocandoEmail, setTrocandoEmail] = useState(false)
  const [novoEmail, setNovoEmail] = useState("")
  const [erroEmail, setErroEmail] = useState<string>()
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function salvarNome(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    setNomeSalvo(false)
    const parsed = nomeSchema.safeParse({ name: nome })
    if (!parsed.success) {
      setErroNome(fieldErrors(parsed.error).name)
      return
    }
    setErroNome(undefined)
    setSalvandoNome(true)
    const { error } = await authClient.updateUser({ name: parsed.data.name })
    setSalvandoNome(false)
    if (error) {
      setErro(authErrorMessage(error))
      return
    }
    setNome(parsed.data.name)
    setNomeSalvo(true)
    // O nome aparece no topo e no menu do usuário
    router.refresh()
  }

  async function pedirTrocaEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    const parsed = trocarEmailSchema.safeParse({ email: novoEmail })
    if (!parsed.success) {
      setErroEmail(fieldErrors(parsed.error).email)
      return
    }
    if (parsed.data.email === user.email) {
      setErroEmail("Esse já é o seu e-mail.")
      return
    }
    setErroEmail(undefined)
    setEnviandoEmail(true)
    const { error } = await authClient.changeEmail({
      newEmail: parsed.data.email,
      callbackURL: "/painel/perfil?email=confirmado",
    })
    setEnviandoEmail(false)
    if (error) {
      setErro(authErrorMessage(error))
      return
    }
    setEmailEnviado(parsed.data.email)
    setTrocandoEmail(false)
    setNovoEmail("")
  }

  const nomeMudou = nome.trim() !== user.name

  return (
    <Secao icone={UserRound} titulo="Dados pessoais" descricao="Como você aparece no FarmSense e onde recebe os avisos">
      <div className="flex flex-col gap-5">
        {erro && <FormAlert>{erro}</FormAlert>}

        <form onSubmit={salvarNome} noValidate className="flex flex-col gap-3">
          <FormField
            label="Nome completo"
            name="name"
            autoComplete="name"
            value={nome}
            onChange={(event) => {
              setNome(event.target.value)
              setNomeSalvo(false)
              setErroNome(undefined)
            }}
            error={erroNome}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={!nomeMudou || salvandoNome}>
              {salvandoNome && <Loader2 className="animate-spin" />}
              Salvar nome
            </Button>
            {nomeSalvo && (
              <p role="status" className="text-[13px] text-status-good">
                Nome atualizado.
              </p>
            )}
          </div>
        </form>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">E-mail</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
            {!trocandoEmail && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTrocandoEmail(true)
                  setEmailEnviado(null)
                }}
              >
                Alterar e-mail
              </Button>
            )}
          </div>

          {emailEnviado && (
            <FormAlert variant="success">
              Enviamos um link para <strong className="font-semibold">{emailEnviado}</strong>. O e-mail da conta muda
              quando você abrir o link.
            </FormAlert>
          )}

          {trocandoEmail && (
            <form onSubmit={pedirTrocaEmail} noValidate className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
              <FormField
                label="Novo e-mail"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={novoEmail}
                onChange={(event) => {
                  setNovoEmail(event.target.value)
                  setErroEmail(undefined)
                }}
                error={erroEmail}
                hint="Vamos mandar um link de confirmação para o endereço novo."
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={enviandoEmail}>
                  {enviandoEmail && <Loader2 className="animate-spin" />}
                  Enviar link de confirmação
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTrocandoEmail(false)
                    setErroEmail(undefined)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Secao>
  )
}

/* ---------- Senha ---------- */

type CamposSenha = { currentPassword: string; password: string; confirmPassword: string }

function Senha({ temSenha }: { temSenha: boolean }) {
  const [errors, setErrors] = useState<FieldErrors<CamposSenha>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [salva, setSalva] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function trocar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    setSalva(false)
    const form = event.currentTarget
    const parsed = trocarSenhaSchema.safeParse(Object.fromEntries(new FormData(form)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    setSalvando(true)
    const { error } = await authClient.changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.password,
      // Quem troca a senha por suspeita de acesso indevido quer derrubar os outros aparelhos
      revokeOtherSessions: true,
    })
    setSalvando(false)
    if (error) {
      if (error.code === "INVALID_PASSWORD") setErrors({ currentPassword: authErrorMessage(error) ?? undefined })
      else setErro(authErrorMessage(error))
      return
    }
    form.reset()
    setSalva(true)
  }

  if (!temSenha) {
    return (
      <Secao icone={KeyRound} titulo="Senha" descricao="Como você entra no FarmSense">
        <p className="text-sm text-muted-foreground">
          Você entra com a sua conta Google, então não há senha do FarmSense para trocar.
        </p>
      </Secao>
    )
  }

  return (
    <Secao icone={KeyRound} titulo="Senha" descricao="Ao trocar, os outros aparelhos conectados saem da conta">
      <form onSubmit={trocar} noValidate className="flex flex-col gap-4">
        {erro && <FormAlert>{erro}</FormAlert>}
        {salva && <FormAlert variant="success">Senha alterada. Os outros aparelhos precisarão entrar de novo.</FormAlert>}
        <FormField
          label="Senha atual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nova senha"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres, com letras e números."
            error={errors.password}
          />
          <FormField
            label="Confirme a nova senha"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        </div>
        <Button type="submit" size="sm" disabled={salvando} className="self-start">
          {salvando && <Loader2 className="animate-spin" />}
          Trocar senha
        </Button>
      </form>
    </Secao>
  )
}

/* ---------- Avisos ---------- */

function Avisos({ ativo: inicial }: { ativo: boolean }) {
  const [ativo, setAtivo] = useState(inicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function alternar() {
    const proximo = !ativo
    setAtivo(proximo)
    setErro(null)
    setSalvando(true)
    try {
      const response = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificarPorEmail: proximo }),
      })
      if (!response.ok) throw new Error()
    } catch {
      setAtivo(!proximo)
      setErro("Não foi possível salvar a preferência. Tente novamente.")
    }
    setSalvando(false)
  }

  const regras = [
    `${ANTECEDENCIA_DIAS.reforco} dias antes de cada reforço de vacina ou vermífugo`,
    `${ANTECEDENCIA_DIAS.colheita} dias antes da colheita prevista e ${ANTECEDENCIA_DIAS.plantio} antes de um plantio planejado`,
    "No dia de cada uma dessas tarefas",
    "Quando um reforço ou uma colheita passa do prazo",
  ]

  return (
    <Secao
      id="notificacoes"
      icone={BellRing}
      titulo="Avisos"
      descricao="Os avisos sempre aparecem no sino, no topo da tela. Você também pode recebê-los por e-mail."
    >
      <div className="flex flex-col gap-5">
        {erro && <FormAlert>{erro}</FormAlert>}

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <div className="flex min-w-0 gap-3">
            <Mail className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
            <div>
              <p id="aviso-email" className="text-sm font-medium">
                Avisos por e-mail
              </p>
              <p className="text-[13px] text-muted-foreground">
                Um resumo com o que chegou, enviado entre 7h e 20h (horário de Brasília).
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ativo}
            aria-labelledby="aviso-email"
            disabled={salvando}
            onClick={alternar}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-wait",
              ativo ? "bg-primary" : "bg-input"
            )}
          >
            <span
              className={cn(
                "inline-block size-5 rounded-full bg-card shadow-sm transition-transform motion-reduce:transition-none",
                ativo ? "translate-x-5.5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium">Quando avisamos</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
            {regras.map((regra) => (
              <li key={regra} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                {regra}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Secao>
  )
}

/* ---------- Seus dados (LGPD) ---------- */

function SeusDados() {
  return (
    <Secao
      id="seus-dados"
      icone={FileLock2}
      titulo="Seus dados"
      descricao="Tudo o que você registra no FarmSense é seu. Leve uma cópia quando quiser."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm text-muted-foreground">
          Um arquivo JSON com sua conta, a fazenda, o rebanho, as pesagens, a sanidade, os talhões, os plantios e os
          avisos. Senhas e chaves de acesso ficam de fora.
        </p>
        {/* Link comum: o navegador baixa o arquivo direto, com o cookie da sessão */}
        <Button variant="secondary" size="sm" asChild className="self-start sm:self-auto">
          <a href="/api/perfil/dados" download>
            <Download />
            Baixar meus dados
          </a>
        </Button>
      </div>
      <p className="mt-4 text-[13px] text-muted-foreground">
        Saiba como usamos e protegemos seus dados na{" "}
        <Link href="/privacidade" className="font-medium text-primary underline-offset-4 hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </Secao>
  )
}

/* ---------- Excluir conta ---------- */

const PALAVRA_CONFIRMACAO = "EXCLUIR"

// Duas etapas no mesmo diálogo: primeiro "tem certeza?", depois a senha (ou digitar EXCLUIR, para quem só usa Google)
function ExcluirConta({ temSenha }: { temSenha: boolean }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [etapa, setEtapa] = useState<"confirmar" | "senha">("confirmar")
  const [valor, setValor] = useState("")
  const [erroCampo, setErroCampo] = useState<string>()
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  function alternar(proximo: boolean) {
    if (excluindo) return
    setAberto(proximo)
    if (!proximo) {
      setEtapa("confirmar")
      setValor("")
      setErroCampo(undefined)
      setErro(null)
    }
  }

  async function excluir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    if (temSenha && !valor) {
      setErroCampo("Informe sua senha.")
      return
    }
    if (!temSenha && valor.trim().toUpperCase() !== PALAVRA_CONFIRMACAO) {
      setErroCampo(`Digite ${PALAVRA_CONFIRMACAO} para confirmar.`)
      return
    }
    setErroCampo(undefined)
    setExcluindo(true)
    const { error } = await authClient.deleteUser(temSenha ? { password: valor } : {})
    if (error) {
      setExcluindo(false)
      if (error.code === "INVALID_PASSWORD") setErroCampo("Senha incorreta.")
      else setErro(authErrorMessage(error))
      return
    }
    // A sessão acabou: volta para a landing e descarta o que estava em cache do painel
    router.replace("/")
    router.refresh()
  }

  return (
    <section
      aria-labelledby="excluir-conta-titulo"
      className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Trash2 className="size-4.5" />
        </span>
        <div>
          <h2 id="excluir-conta-titulo" className="text-lg font-semibold tracking-tight">
            Excluir conta
          </h2>
          <p className="text-sm text-muted-foreground">
            Apaga sua conta e todos os dados da fazenda. Não dá para desfazer.
          </p>
        </div>
      </div>

      <Dialog open={aberto} onOpenChange={alternar}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" className="self-start sm:self-auto">
            Excluir conta
          </Button>
        </DialogTrigger>

        {/* Ao abrir, o Radix foca o primeiro botão: "Cancelar", a opção segura */}
        <DialogContent>
          <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" />
          </span>

          {etapa === "confirmar" ? (
            <>
              <div className="flex flex-col gap-2">
                <DialogTitle>Tem certeza que quer excluir sua conta?</DialogTitle>
                <DialogDescription>
                  Tudo será apagado para sempre: a fazenda, o rebanho, as pesagens, a sanidade, os talhões e os
                  plantios. Não conseguimos recuperar depois.
                </DialogDescription>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose asChild>
                  <Button variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => setEtapa("senha")}>
                  Sim, quero excluir
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={excluir} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <DialogTitle>{temSenha ? "Confirme sua senha" : "Confirme a exclusão"}</DialogTitle>
                <DialogDescription>
                  {temSenha
                    ? "Para sua segurança, digite a senha da sua conta para concluir a exclusão."
                    : `Você entra com o Google, então não há senha. Digite ${PALAVRA_CONFIRMACAO} para concluir.`}
                </DialogDescription>
              </div>

              {erro && <FormAlert>{erro}</FormAlert>}

              {temSenha ? (
                <FormField
                  label="Senha"
                  name="excluir-senha"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={valor}
                  onChange={(event) => {
                    setValor(event.target.value)
                    setErroCampo(undefined)
                  }}
                  error={erroCampo}
                />
              ) : (
                <FormField
                  label={`Digite ${PALAVRA_CONFIRMACAO}`}
                  name="excluir-confirmacao"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus
                  value={valor}
                  onChange={(event) => {
                    setValor(event.target.value)
                    setErroCampo(undefined)
                  }}
                  error={erroCampo}
                />
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" disabled={excluindo} onClick={() => alternar(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={excluindo}>
                  {excluindo && <Loader2 className="animate-spin" />}
                  Excluir minha conta
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
