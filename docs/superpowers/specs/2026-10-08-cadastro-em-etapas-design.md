# FarmSense — Cadastro em etapas com a fazenda (design)

- **Data:** 2026-10-08
- **Status:** aprovado em conversa; aguardando revisão da spec escrita
- **Escopo:** cadastro em 2 etapas (você → sua fazenda), modelo `Propriedade`, primeiro acesso, edição da fazenda em Configurações, menu filtrado pelas atividades e uso das imagens de `public/images`
- **Relação com outras specs:** implementa a parte "Propriedade" da etapa 1 de [`2026-10-03-arquitetura-modulos-design.md`](2026-10-03-arquitetura-modulos-design.md) e altera alguns pontos dela (seção 9)

## 1. Objetivo

Ao criar a conta, a pessoa já cadastra a fazenda: primeiro os dados pessoais, depois os dados da propriedade. Ao terminar o cadastro e confirmar o e-mail, entra no painel com a fazenda pronta e vê só os módulos que fazem sentido para ela.

**Critérios de sucesso**

- Cadastro por e-mail cria usuário **e** fazenda numa única ação ("Criar conta").
- Dados de fazenda inválidos nunca geram um usuário (validação antes de criar).
- Ninguém usa o painel sem fazenda: quem entra pelo Google, ou ficou sem fazenda por falha, preenche a fazenda em `/primeiro-acesso`.
- O menu esconde Pecuária ou Agricultura quando a fazenda não tem essa atividade.
- O perfil da fazenda pode ser editado depois em Configurações.

**Fora do escopo:** várias fazendas por usuário, lista de municípios por UF (município é texto livre), cadastro de lotes/talhões durante o cadastro, TanStack Query (entra na etapa do Rebanho).

## 2. Modelo de dados

Novo modelo `Propriedade` (tabela `propriedade`), relação 1–1 com `User`, `onDelete: Cascade`.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `userId` | `String @unique` | FK para `user.id` |
| `nome` | `String` | obrigatório, 2–80 caracteres (após `trim`) |
| `municipio` | `String` | obrigatório, 2–80 caracteres (após `trim`) |
| `uf` | `String @db.Char(2)` | uma das 27 siglas |
| `areaTotalHa` | `Decimal? @db.Decimal(10,2)` | opcional; `> 0` e `≤ 99.999.999,99` |
| `atividades` | `Atividade[]` | enum `PECUARIA` \| `AGRICULTURA`; ao menos 1, sem repetição |
| `tipoRebanho` | `TipoRebanho?` | enum `CORTE` \| `LEITE` \| `MISTO`; **obrigatório** se `atividades` contém `PECUARIA`, **nulo** caso contrário |
| `createdAt`, `updatedAt` | `DateTime` | |

Migration nova: `prisma migrate dev --name propriedade`.

## 3. Esquema compartilhado

`src/shared/schemas/propriedade.ts` exporta:

- `UFS` — as 27 siglas, com o nome do estado para a lista do formulário;
- `propriedadeSchema` (zod) — regras da seção 2, com mensagens em português. A regra de `tipoRebanho` fica num `superRefine` com erro no campo `tipoRebanho`;
- `type PropriedadeInput = z.infer<typeof propriedadeSchema>`.

`areaTotalHa` chega do formulário como texto (aceita vírgula decimal: `"12,5"`) e é convertida para número no esquema; campo vazio vira `undefined`.

O mesmo esquema é usado no formulário (navegador), no hook do Better Auth e nas rotas da API.

## 4. Fluxo de cadastro por e-mail

```
/cadastro?etapa=1  ──Continuar (valida no navegador)──►  /cadastro?etapa=2  ──Criar conta──►  POST /api/auth/sign-up/email
   nome, e-mail, senha,                                    atividades, tipoRebanho,             { name, email, password,
   confirmar senha                                         nome, UF, município, área              callbackURL, propriedade }
                                                                                                        │
                                       ◄──────────── /verificar-email?email=… ◄──── 200 ─────────────────┘
```

**Navegação entre etapas**

- A etapa vive na URL (`?etapa=1|2`), trocada com `router.push`, para o "voltar" do navegador funcionar e o painel lateral saber qual foto mostrar.
- Os valores das duas etapas ficam em estado de um único componente cliente (`SignUpWizard`); voltar para a etapa 1 mantém o que foi digitado na etapa 2 e vice-versa.
- Abrir `?etapa=2` sem a etapa 1 válida em memória (ex.: recarregar a página) faz `router.replace("?etapa=1")`.
- Os campos de senha são limpos ao recarregar (não persistimos nada em `localStorage`).

**No servidor** (`src/lib/auth/index.ts`, `databaseHooks.user.create`):

- `before(user, ctx)`: se `ctx?.path === "/sign-up/email"`, valida `ctx.body.propriedade` com `propriedadeSchema`. Inválido → `throw new APIError("BAD_REQUEST", { code: "PROPRIEDADE_INVALIDA", message: "Confira os dados da fazenda." })`; o usuário não é criado. Outros caminhos (Google) passam direto.
- `after(user, ctx)`: no mesmo caminho, cria a `Propriedade` com os dados já validados (o resultado do `parse` é revalidado aqui, pois os hooks não compartilham estado). Falha → `console.error` e segue; a conta fica sem fazenda e o primeiro login leva a `/primeiro-acesso`.
- O Better Auth ignora campos do corpo que não são colunas do usuário, então `propriedade` chega aos hooks sem virar coluna.
- E-mail já cadastrado: o Better Auth devolve uma resposta de sucesso falsa (com `requireEmailVerification`) sem chamar os hooks. Nada é criado; a pessoa vai para `/verificar-email` como num cadastro novo.

## 5. Primeiro acesso

- **Rota:** `/primeiro-acesso`, no grupo `(auth)` (fora de `/painel`, para não haver redirect em laço).
- **Guarda no servidor:** sem sessão → `/login`; já tem fazenda → `/painel`.
- **Tela:** título "Conte sobre sua fazenda", o mesmo `PropriedadeFields` da etapa 2, botão "Concluir". Envia `POST /api/propriedade`; sucesso ou 409 → `router.replace("/painel")`.
- **Painel:** `painel/layout.tsx` busca a fazenda do usuário; sem fazenda → `redirect("/primeiro-acesso")`.

## 6. API

Camadas conforme a spec de módulos (seção 2), criando só o necessário agora:

| Unidade | Arquivo | Conteúdo |
|---|---|---|
| Respostas | `src/server/http/responses.ts` | `jsonError(status, code, message, fields?)`; `handleError(error)` converte `ZodError` → 400 `VALIDATION_ERROR` com `fields`, Prisma `P2002` → 409 `CONFLICT`, `HttpError` → seu status, resto → 500 `INTERNAL_ERROR` |
| Contexto | `src/server/http/context.ts` | `getContext(request, { requirePropriedade })`: sessão do Better Auth → `{ userId, propriedade }`; sem sessão → `HttpError(401, "UNAUTHENTICATED")`; sem fazenda e `requirePropriedade` → `HttpError(409, "PROPERTY_REQUIRED")` |
| Serviço | `src/server/services/propriedade.ts` | `buscarPorUsuario(userId)`, `criar(userId, input)`, `atualizar(userId, input)` |
| Rotas | `src/app/api/propriedade/route.ts` | `GET` (404 `NOT_FOUND` sem fazenda), `POST` (409 `CONFLICT` se já existe), `PATCH` (substitui todos os campos; valida com o esquema completo) |

O hook do Better Auth (seção 4) usa o mesmo `criar` do serviço.

`areaTotalHa` sai da API como número (`Decimal` → `Number`) ou `null`.

## 7. Telas e componentes

| Componente | Arquivo | Responsabilidade |
|---|---|---|
| `SignUpWizard` | `src/components/auth/SignUpWizard.tsx` (substitui `SignUpForm.tsx`) | Estado das 2 etapas, indicador "Etapa X de 2", envio final |
| `PropriedadeFields` | `src/components/propriedade/PropriedadeFields.tsx` | Campos da fazenda, controlados (`value` + `onChange` + `errors`); sem `<form>` próprio |
| `AtividadeCard` | dentro de `PropriedadeFields.tsx` | Cartão clicável (checkbox acessível) com miniatura, título e descrição curta |
| `PropriedadeForm` | `src/components/propriedade/PropriedadeForm.tsx` | `<form>` com `PropriedadeFields` + envio para a API; modos `criar` (primeiro acesso) e `editar` (Configurações) |
| `AuthAside` | `src/components/auth/AuthAside.tsx` | Painel lateral (cliente): escolhe a foto pela rota e por `?etapa` |

**Etapa 2 — ordem dos campos**

1. "O que sua fazenda faz?" — cartões *Pecuária* (`/images/bois.jpg`, "Gado de corte ou de leite") e *Agricultura* (`/images/trator.avif`, "Lavouras e talhões"); dá para marcar os dois. Em telas pequenas ficam empilhados.
2. "Tipo de rebanho" — aparece só com Pecuária marcada: três opções em botões segmentados (Corte, Leite, Misto). Desmarcar Pecuária limpa o valor.
3. Nome da fazenda.
4. UF (`<select>` nativo com nome do estado) + Município (texto), lado a lado a partir de `sm`.
5. Área total — opcional, sufixo "ha", `inputMode="decimal"`.
6. Botões "Voltar" (secundário) e "Criar conta" (primário, com carregando).

**Configurações** (`/painel/configuracoes`): página real substituindo o placeholder de `[secao]`, com `PropriedadeForm` em modo `editar` (carrega via servidor, salva com `PATCH`, mostra "Alterações salvas"). Após salvar, `router.refresh()` para o menu refletir as atividades.

**Menu** (`src/components/app/nav.ts`): `NavGroup` ganha `atividade?: "PECUARIA" | "AGRICULTURA"`. Grupo "Pecuária" (Rebanho, Pesagens, Sanidade) exige `PECUARIA`; "Agricultura" (Talhões, Culturas) exige `AGRICULTURA`. "Calendário" passa para o grupo "Gestão", junto de Relatórios. `painel/layout.tsx` passa `atividades` ao `AppShell`, que filtra os grupos.

## 8. Imagens

**Painel lateral das telas de autenticação** — mantém o duotone verde atual (grayscale + `mix-blend-color` da cor primária):

| Tela | Imagem |
|---|---|
| `/login` | `/images/fazenda 3.avif` |
| `/cadastro?etapa=1` | `/images/plantio.webp` |
| `/cadastro?etapa=2`, `/primeiro-acesso` | `/images/fazenda4.jpg` |
| `/esqueci-senha`, `/redefinir-senha`, `/verificar-email`, `/email-verificado` | `/hero/propriedade-rural.jpeg` (atual) |

A troca de foto entre etapas é um cross-fade curto (`opacity`, ~300 ms), respeitando `prefers-reduced-motion`.

**Landing**

- Hero: `/images/plantio.webp` no lugar de `/hero/fazenda.png`, sem o `scale` forçado.
- Cartão Rebanho: `/images/bois.jpg`.
- Cartão Talhões e culturas: `/images/trator.avif`, sem o `scale` forçado.

`fazenda2.avif` (349 px de largura) e `morangos.webp` não são usadas agora. O arquivo `fazenda 3.avif` tem espaço no nome; a URL usa `%20` via `next/image`, sem renomear.

## 9. Alterações na spec de módulos

Em `2026-10-03-arquitetura-modulos-design.md`:

- Seção 3: `Propriedade` ganha `atividades` e `tipoRebanho`.
- Seção 6: "Primeiro acesso" passa a ser `/primeiro-acesso` (grupo `(auth)`), e o painel redireciona para lá quando não há fazenda.
- Seção 6: menu filtrado por atividade; Calendário no grupo Gestão.
- Seção 9, etapa 1: a parte de Propriedade é entregue por esta spec; TanStack Query e `apiFetch` passam para a etapa 2 (Rebanho).

## 10. Erros

| Situação | Comportamento |
|---|---|
| Etapa 1 ou 2 inválida no navegador | Mensagens nos campos (`FormField`), sem requisição |
| Servidor recusa a fazenda (`PROPRIEDADE_INVALIDA`) | Volta/fica na etapa 2 com `FormAlert` "Confira os dados da fazenda." |
| Erros conhecidos do cadastro (senha curta etc.) | Volta para a etapa 1 com a mensagem de `authErrorMessage` |
| Servidor fora do ar / 5xx | Mensagem geral já existente em `authErrorMessage` |
| Falha ao criar a fazenda após criar o usuário | Log no servidor; `/primeiro-acesso` cobre no primeiro login |
| `POST /api/propriedade` com fazenda existente | 409; a tela segue para `/painel` |

## 11. Testes

**Ferramentas:** Vitest (`npm test` para unitários, `npm run test:integration` para integração), banco `farmsense_test` no mesmo Postgres do `docker-compose.yml`, migrado antes da suíte.

**Unitários** (`src/shared/schemas/propriedade.test.ts`)

- sem atividade → erro em `atividades`;
- `PECUARIA` sem `tipoRebanho` → erro; `AGRICULTURA` com `tipoRebanho` → erro;
- UF fora da lista → erro;
- `areaTotalHa`: `"12,5"` → `12.5`; `""` → `undefined`; `"0"` e `"-1"` → erro.

**Integração** (`tests/integration/`)

- `auth.api.signUpEmail` com fazenda válida → usuário e fazenda criados;
- fazenda inválida → erro 400 `PROPRIEDADE_INVALIDA` e nenhum usuário com aquele e-mail;
- `POST /api/propriedade`: 401 sem sessão; 201 na primeira vez; 409 na segunda;
- `PATCH /api/propriedade` altera só a fazenda do usuário da sessão;
- `GET /api/propriedade` → 404 sem fazenda.

O envio de e-mail é desligado nos testes (`sendEmail` substituído por um mock).

**Manual:** cadastro completo no navegador com e-mail real, confirmação pelo link, entrada no painel com o menu filtrado; conta sem fazenda caindo em `/primeiro-acesso`; edição em Configurações refletindo no menu.

## 12. Ordem de construção

1. Modelo + migration + esquema compartilhado (com testes unitários; inclui setup do Vitest).
2. Camada HTTP (`responses`, `context`), serviço e rotas `/api/propriedade` (com testes de integração).
3. Hooks do Better Auth (com testes de integração).
4. `PropriedadeFields`, `SignUpWizard`, `AuthAside` e imagens das telas de autenticação.
5. `/primeiro-acesso`, guarda no `painel/layout.tsx`, menu filtrado.
6. Configurações.
7. Imagens da landing.
8. Atualização da spec de módulos e teste manual completo.
