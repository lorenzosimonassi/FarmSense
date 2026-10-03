# FarmSense — Arquitetura dos módulos (design)

- **Data:** 2026-10-03
- **Status:** aprovado em conversa; aguardando revisão da spec escrita
- **Escopo:** dados, regras, API e telas de todos os módulos do painel (Rebanho, Pesagens, Sanidade, Talhões, Culturas, Calendário, Relatórios, Visão geral, Configurações)

## 1. Objetivo e restrições

**Objetivo:** entregar o TCC com o sistema funcionando de ponta a ponta na defesa — cadastrar, registrar e ver os indicadores no dashboard — com escopo enxuto.

**Restrições e decisões de escopo**

- 1 usuário = 1 propriedade. Todos os dados de negócio pertencem à propriedade (não ao usuário), o que permite evoluir para várias propriedades no futuro sem reestruturar tabelas.
- Rebanho controlado por **animal individual**; "lote/pasto" é um campo de texto livre usado para filtrar e agrupar (sem tabela de lotes).
- Agricultura modelada como **Talhão → Plantio**. Não há cadastro de culturas (cultura é texto) nem registro de atividades no talhão.
- Sanidade com **próxima dose informada manualmente** em cada aplicação.
- Pesagens e aplicações podem ser registradas **em lote** (vários animais de uma vez).
- A API é **REST completa**, como descrito no README; as telas consomem a API pelo navegador.
- Data da defesa não definida: a ordem de construção separa **essencial** de **se der tempo** (seção 9).

**Fora do escopo:** financeiro, estoque/insumos, atividades no talhão, múltiplos usuários por propriedade, múltiplas propriedades por usuário, protocolos sanitários, app offline, dados climáticos.

## 2. Arquitetura

```
Navegador (telas do painel)
   │  TanStack Query → fetch JSON
   ▼
Apresentação  src/app/api/**/route.ts       HTTP, validação de entrada, status
   ▼
Negócio       src/server/services/*.ts      regras, isolamento por propriedade
              src/server/rules/*.ts         funções puras (GMD, status, datas)
   ▼
Persistência  Prisma (src/lib/db.ts) → PostgreSQL
```

### Unidades e responsabilidades

| Unidade | Local | Responsabilidade | Depende de |
|---|---|---|---|
| Esquemas | `src/shared/schemas/*.ts` | Esquemas `zod` de entrada, usados no formulário e no endpoint | `zod` |
| Regras | `src/server/rules/*.ts` | Funções puras: GMD, situação sanitária, status do plantio, validações de data. Sem acesso a banco | — |
| Serviços | `src/server/services/*.ts` | Casos de uso; recebem `propriedadeId`, aplicam regras, acessam Prisma | regras, `db` |
| Contexto da API | `src/server/http/context.ts` | `getContext(request)`: sessão (Better Auth) + propriedade do usuário | `auth`, `db` |
| Respostas da API | `src/server/http/responses.ts` | Formato de erro padrão e conversão de erros (zod, Prisma) em status | — |
| Route Handlers | `src/app/api/**/route.ts` | Camada fina: contexto → validação → serviço → resposta | contexto, serviços, esquemas |
| Cliente HTTP | `src/lib/api/client.ts` | `apiFetch` tipado; trata 401/409 | — |
| Hooks | `src/lib/api/hooks/*.ts` | `useAnimais()`, `useCriarPesagem()` etc. sobre TanStack Query | cliente HTTP |
| Telas | `src/app/painel/**`, `src/components/<modulo>/**` | Componentes cliente que usam os hooks | hooks, esquemas, `components/ui` |

### Autenticação e isolamento

- `painel/layout.tsx` continua protegendo as rotas no servidor (redirect para `/login`).
- Todo endpoint (exceto `/api/auth/[...all]`) chama `getContext`:
  - sem sessão → **401**;
  - sem propriedade (exceto `GET`/`POST /propriedade`) → **409 `PROPERTY_REQUIRED`**.
- Todo serviço recebe `propriedadeId` e filtra por ele. Pesagem e aplicação são verificadas pelo `animal.propriedadeId`; plantio, pelo `talhao.propriedadeId`.
- Recurso de outra propriedade → **404** (não 403), para não revelar existência.

### Formato de erro

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos", "fields": { "pesoKg": "Informe um peso maior que zero" } } }
```

| Situação | Status | `code` |
|---|---|---|
| Entrada inválida (zod) | 400 | `VALIDATION_ERROR` (com `fields`) |
| Sem sessão | 401 | `UNAUTHENTICATED` |
| Usuário sem propriedade | 409 | `PROPERTY_REQUIRED` |
| Recurso inexistente ou de outra propriedade | 404 | `NOT_FOUND` |
| Violação de unicidade (Prisma `P2002`) | 409 | `CONFLICT` (com `fields` no campo afetado) |
| Violação de regra de negócio (ex.: 2 plantios em andamento) | 409 | `BUSINESS_RULE` |
| Erro inesperado | 500 | `INTERNAL_ERROR` (mensagem genérica; detalhe só no log) |

### Dependências novas

- `@tanstack/react-query` (dependência)
- `vitest` (dependência de desenvolvimento)
- Componentes shadcn/ui conforme necessidade (table, dialog, select, checkbox, tabs)

Formulários seguem o padrão existente nas telas de autenticação (`FormField`, `FormAlert`), sem biblioteca de formulários.

## 3. Modelo de dados

Modelos novos com nomes em português (`@@map` para snake_case). Modelos do Better Auth permanecem como estão. Datas sem hora usam `@db.Date`; pesos e áreas usam `Decimal`.

```
User 1──1 Propriedade 1──N Animal 1──N Pesagem
                       │            └─N AplicacaoSanitaria
                       └──N Talhao 1──N Plantio
```

| Modelo | Campos | Restrições |
|---|---|---|
| **Propriedade** | `id`, `userId`, `nome`, `municipio`, `uf`, `areaTotalHa?` (Decimal 10,2), `createdAt`, `updatedAt` | `userId` único |
| **Animal** | `id`, `propriedadeId`, `identificacao`, `nome?`, `sexo` (`MACHO`/`FEMEA`), `raca?`, `dataNascimento?`, `lote?`, `situacao` (`ATIVO`/`VENDIDO`/`MORTO`, padrão `ATIVO`), `dataSaida?`, `observacoes?`, `createdAt`, `updatedAt` | único (`propriedadeId`, `identificacao`); índice (`propriedadeId`, `situacao`) |
| **Pesagem** | `id`, `animalId`, `data`, `pesoKg` (Decimal 7,2), `observacao?`, `createdAt` | único (`animalId`, `data`) |
| **AplicacaoSanitaria** | `id`, `animalId`, `tipo` (`VACINA`/`VERMIFUGO`/`MEDICAMENTO`/`OUTRO`), `produto`, `dose?`, `dataAplicacao`, `proximaDose?`, `observacao?`, `createdAt` | índice (`animalId`, `produto`); índice (`proximaDose`) |
| **Talhao** | `id`, `propriedadeId`, `nome`, `areaHa` (Decimal 10,2), `observacoes?`, `createdAt`, `updatedAt` | único (`propriedadeId`, `nome`) |
| **Plantio** | `id`, `talhaoId`, `cultura`, `variedade?`, `dataPlantio`, `previsaoColheita?`, `dataColheita?`, `quantidadeColhida?` (Decimal 12,2), `unidade?` (`SC`/`T`/`KG`), `observacoes?`, `createdAt`, `updatedAt` | índice (`talhaoId`, `dataPlantio`) |

**Exclusão:** `Propriedade → Animal/Talhao`, `Animal → Pesagem/AplicacaoSanitaria` e `Talhao → Plantio` usam `onDelete: Cascade`. Excluir animal ou talhão é para corrigir cadastro errado e exige confirmação na tela; saída do rebanho usa `situacao` + `dataSaida`, preservando histórico.

**Não armazenados (calculados):** status do plantio, idade, peso atual, GMD, situação sanitária, alertas, notificações.

## 4. Regras de negócio

"Hoje" é calculado no fuso `America/Sao_Paulo`. Regras puras ficam em `src/server/rules/`.

### 4.1 Animais

- `dataSaida` é obrigatória quando `situacao ≠ ATIVO` e proibida quando `situacao = ATIVO`.
- `dataSaida` não pode ser futura nem anterior a `dataNascimento`.
- `dataNascimento` não pode ser futura.

### 4.2 Pesagens e desempenho

- **Peso atual:** pesagem mais recente do animal.
- **GMD (kg/dia):** `(pesoFinal − pesoInicial) / dias` entre duas pesagens.
  - No animal: entre as duas pesagens mais recentes.
  - Em relatório: entre a primeira e a última pesagem dentro do período.
  - Indefinido com menos de 2 pesagens.
- **Abaixo do esperado:** GMD < `GMD_MINIMO` (constante `0.3` kg/dia em `src/server/rules/desempenho.ts`).
- **Validações:** `pesoKg > 0`; data não futura; data não anterior a `dataNascimento`; se o animal não está ativo, data ≤ `dataSaida`.

### 4.3 Sanidade

- Considera-se a **última aplicação de cada (animal, produto)**; aplicações anteriores do mesmo produto não geram alerta.
- Situação de um produto para um animal ativo, a partir da `proximaDose` da última aplicação:
  - **Atrasada:** `proximaDose < hoje`;
  - **Vence em 30 dias:** `hoje ≤ proximaDose ≤ hoje + 30`;
  - **Sem pendências:** sem `proximaDose` ou `proximaDose > hoje + 30`.
- Situação do animal = a pior entre seus produtos. Animal sem aplicações = **Sem pendências**.
- Animais vendidos ou mortos não entram nos alertas.
- **Validações:** `proximaDose > dataAplicacao`; `dataAplicacao` não futura; mesmas regras de `dataSaida` da pesagem.

### 4.4 Agricultura

- **Status do plantio:**
  - `COLHIDO` se `dataColheita` preenchida;
  - senão `PLANEJADO` se `dataPlantio > hoje`;
  - senão `EM_ANDAMENTO`.
- Um talhão tem no máximo **1 plantio em andamento**; violar retorna 409 `BUSINESS_RULE`.
- `previsaoColheita ≥ dataPlantio`; `dataColheita ≥ dataPlantio`; `dataColheita` não futura.
- `unidade` é obrigatória quando `quantidadeColhida` é informada; `quantidadeColhida` exige `dataColheita`.
- **Produtividade:** `quantidadeColhida / talhao.areaHa` (ex.: sc/ha).

### 4.5 Visão geral e notificações

| Widget | Fonte |
|---|---|
| Animais no rebanho | Ativos hoje; delta = ativos hoje − ativos há 30 dias. "Ativo em uma data D" = `createdAt ≤ D` e (`dataSaida` nula ou `> D`) — não há data de entrada no rebanho, então o cadastro faz esse papel |
| Peso médio | Média do peso atual dos ativos com pesagem; delta % vs. o mesmo cálculo em D = hoje − 30 (animais ativos em D, última pesagem com `data ≤ D`) |
| Área cultivada | Soma de `areaHa` dos talhões com plantio `EM_ANDAMENTO`; legenda = nº desses talhões |
| Vacinações pendentes | Nº de animais ativos com situação Atrasada ou Vence em 30 dias |
| Situação sanitária (gráfico) | Contagem de animais por situação (4.3) |
| Peso por lote (gráfico) | Média mensal do peso por valor de `lote` (últimos 6 meses; animais sem lote em "Sem lote") |
| Culturas | Plantios agrupados por cultura e status |
| Pesagens recentes | Últimas pesagens registradas |
| Próximas atividades | Nos próximos 30 dias: próximas doses (agrupadas por produto + data), plantios planejados, previsões de colheita |
| Notificações (sino) | Calculadas na hora: vacinas atrasadas, vacinas vencendo em 30 dias, animais abaixo do GMD, colheitas previstas em até 15 dias. Sem estado de lida |

Os widgets de **clima** e **chuva** são removidos (sem fonte de dados real). O módulo `src/lib/mock/painel.ts` é removido ao fim da etapa 6.

## 5. API REST

Prefixo `/api`. Todos os endpoints exigem sessão. Listas são paginadas com `?page` (padrão 1) e `?pageSize` (padrão 20, máximo 100), devolvendo `{ items, total }`. Datas trafegam como `YYYY-MM-DD`; decimais como número.

| Recurso | Método e rota | Observações |
|---|---|---|
| Propriedade | `GET /propriedade` | 404 se ainda não cadastrada |
| | `POST /propriedade` | 409 `CONFLICT` se já existir |
| | `PATCH /propriedade` | |
| Animais | `GET /animais` | Filtros: `busca` (identificação/nome), `situacao`, `lote`, `sexo` |
| | `POST /animais` | |
| | `GET /animais/[id]` | Inclui peso atual, GMD e situação sanitária |
| | `PATCH /animais/[id]` | Inclui registrar saída |
| | `DELETE /animais/[id]` | Cascade |
| | `GET /animais/lotes` | Valores distintos de `lote` |
| Pesagens | `GET /pesagens` | Filtros: `inicio`, `fim`, `lote`, `animalId` |
| | `POST /pesagens` | Em lote: `{ data, itens: [{ animalId, pesoKg, observacao? }] }` |
| | `PATCH /pesagens/[id]` · `DELETE /pesagens/[id]` | |
| Sanidade | `GET /aplicacoes` | Filtros: `inicio`, `fim`, `animalId`, `tipo`, `produto` |
| | `POST /aplicacoes` | Em lote: `{ animalIds[], tipo, produto, dose?, dataAplicacao, proximaDose?, observacao? }` |
| | `PATCH /aplicacoes/[id]` · `DELETE /aplicacoes/[id]` | |
| | `GET /sanidade/alertas` | Animais com situação Atrasada ou Vence em 30 dias, por produto |
| Talhões | `GET /talhoes` · `POST /talhoes` | Lista inclui o plantio atual |
| | `GET /talhoes/[id]` · `PATCH` · `DELETE` | Detalhe inclui histórico de plantios |
| Plantios | `GET /plantios` | Filtros: `cultura`, `status`, `talhaoId` |
| | `POST /plantios` · `PATCH /plantios/[id]` · `DELETE /plantios/[id]` | |
| Agregados | `GET /dashboard` | Todos os widgets da Visão geral |
| | `GET /notificacoes` | |
| | `GET /calendario?inicio&fim` | Eventos: aplicações, próximas doses, plantios, previsões e colheitas |
| Relatórios | `GET /relatorios/{rebanho,desempenho,sanidade,producao}?inicio&fim&formato=json\|csv` | CSV com `Content-Disposition: attachment` |

**Registro em lote:** executado em uma transação Prisma (tudo ou nada). Se algum item for inválido, responde 400 com `fields` indexados pelo item (ex.: `itens.3.pesoKg`). Um mesmo animal não pode aparecer duas vezes no lote.

## 6. Telas

Substituem a rota genérica `/painel/[secao]`, que é removida quando todas as seções existirem.

| Tela | Rota | Conteúdo |
|---|---|---|
| Primeiro acesso | `/painel/primeiro-acesso` | Formulário da propriedade; destino do redirect em 409 `PROPERTY_REQUIRED` |
| Visão geral | `/painel` | Widgets da seção 4.5 com dados reais |
| Rebanho | `/painel/rebanho` | Tabela com busca e filtros; "Novo animal" em `Sheet` |
| Detalhe do animal | `/painel/rebanho/[id]` | Dados, gráfico de peso, histórico de pesagens e aplicações, "Registrar saída", editar, excluir |
| Pesagens | `/painel/pesagens` | Lista recente; "Registrar pesagem" em grade: data + filtro por lote + peso por animal |
| Sanidade | `/painel/sanidade` | Abas Alertas / Histórico; "Registrar aplicação" com seleção múltipla e "selecionar lote" |
| Talhões | `/painel/talhoes` | Cards com área e plantio atual; detalhe com histórico |
| Culturas | `/painel/culturas` | Lista de plantios com filtros; "Novo plantio", "Registrar colheita" |
| Calendário | `/painel/calendario` | Grade mensal com eventos coloridos por tipo; lista no celular |
| Relatórios | `/painel/relatorios` | 4 relatórios: período, tabela, "Exportar CSV", "Imprimir" |
| Configurações | `/painel/configuracoes` | Editar propriedade |

**Estados em todas as telas:** carregando (skeleton), vazio (explicação + ação para criar o primeiro item), erro (mensagem + "Tentar novamente").

**Comportamento do cliente:** 401 → `/login`; 409 `PROPERTY_REQUIRED` → `/painel/primeiro-acesso`; erros de validação mapeados para `FormField`; erros gerais em `FormAlert`. Mutações invalidam as consultas afetadas (ex.: criar pesagem invalida `animais`, `pesagens` e `dashboard`).

## 7. Dados de demonstração

Script de seed (`prisma/seed.ts`, comando `npm run db:seed`) que cria um usuário de demonstração e a "Fazenda Demonstração" com:

- ~40 animais em 3 lotes, incluindo alguns vendidos/mortos;
- 6 meses de pesagens mensais, com alguns animais abaixo do `GMD_MINIMO`;
- aplicações sanitárias com casos Atrasada, Vence em 30 dias e Sem pendências;
- 5 talhões com 2 safras (uma colhida, uma em andamento) e um plantio planejado.

O seed cresce a cada etapa e é idempotente (recria os dados da conta de demonstração).

## 8. Testes

- **Vitest**, com scripts `npm test` (unitários) e `npm run test:integration`.
- **Unitários** (`src/server/rules/**/*.test.ts`): GMD, situação sanitária (incluindo "última aplicação por produto"), status do plantio, validações de data e limites (hoje, hoje + 30).
- **Integração** (`tests/integration/**`): Route Handlers chamados diretamente contra o banco `farmsense_test` (mesmo Postgres do `docker-compose.yml`, migrado antes da suíte). Cobrem, no mínimo:
  - isolamento entre propriedades (leitura, alteração e exclusão retornam 404);
  - 401 sem sessão e 409 `PROPERTY_REQUIRED` sem propriedade;
  - registro em lote tudo ou nada;
  - 409 `CONFLICT` em brinco duplicado;
  - 409 `BUSINESS_RULE` em segundo plantio em andamento.
- **Sem testes E2E no navegador.** Um roteiro manual de demonstração sobre o seed cobre a defesa.

## 9. Ordem de construção

Cada etapa recebe seu próprio plano de implementação, termina com testes passando e commit antes da próxima.

**Essencial**

1. **Fundação:** `getContext`, formato de erro, `apiFetch`, provider do TanStack Query, Vitest + banco de teste, Propriedade (API, primeiro acesso, configurações).
2. **Rebanho:** API e telas de animais, detalhe do animal (sem gráficos de peso ainda).
3. **Pesagens:** API e registro em lote, GMD, gráfico de peso no detalhe do animal.
4. **Sanidade:** API e registro em lote, alertas, aba Alertas/Histórico.
5. **Talhões + Culturas:** API e telas de talhões e plantios.
6. **Visão geral real:** `/dashboard`, `/notificacoes`, seed completo, remoção de `lib/mock` e dos widgets de clima/chuva.

**Se der tempo**

7. **Calendário.**
8. **Relatórios + CSV.**
9. **Acabamento:** CSS de impressão, remoção de `/painel/[secao]`, documentação da API em markdown para a monografia, atualização do README.
