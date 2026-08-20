<p align="center">
  <img src="src/assets/imgs/farmsense-logo-dark.png" alt="FarmSense" width="280" />
</p>

<p align="center">
  Gestão rural simples, integrada e orientada por dados.
</p>

<p align="center">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn%2Fui-black?style=flat-square" />
</p>

---

## Sobre

**FarmSense** é um sistema web de gestão rural pensado para pequenas e médias propriedades. A proposta centraliza, em um único lugar, informações de **pecuária** e **agricultura** — hoje frequentemente espalhadas em cadernos, planilhas isoladas e anotações — e as transforma em indicadores visuais por meio de **dashboards interativos**, apoiando o produtor rural na tomada de decisão.

Este repositório é o produto de um **Trabalho de Conclusão de Curso** em Ciência da Computação (Universidade Vila Velha), desenvolvido por **Lorenzo Simonassi Moura** e **Thiago Pedro de Almeida**, sob orientação do **Prof. Me. Saulo Pereira Ribeiro**.

> **Estado atual:** esta etapa do projeto entrega a **landing page** da plataforma. O restante do sistema (autenticação, cadastros, API e banco de dados) é o próximo passo do desenvolvimento.

## Funcionalidades previstas

| Módulo | O que faz |
|---|---|
| 🐄 **Rebanho** | Cadastro de animais e acompanhamento das principais informações |
| ⚖️ **Pesagens** | Histórico e evolução do peso do rebanho |
| 💉 **Sanidade** | Controle de vacinações, reforços e alertas de vencimento |
| 🌱 **Agricultura** | Cadastro de talhões, culturas e áreas produtivas |
| 📅 **Calendário agrícola** | Datas de plantio e previsão de colheita |
| 📊 **Dashboard** | Visão resumida e visual da propriedade, com indicadores e alertas |

## Stack

**Landing page (implementada nesta etapa)**

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Radix UI + `class-variance-authority`)
- [Lucide React](https://lucide.dev/) para ícones
- [Framer Motion](https://www.framer.com/motion/) para animações

**Planejado para o sistema completo**

- API REST em camadas (apresentação, lógica de negócio, persistência)
- Banco de dados relacional (PostgreSQL)
- Autenticação com controle de acesso

## Como rodar

```bash
# instalar dependências
npm install

# ambiente de desenvolvimento
npm run dev

# build de produção
npm run build

# lint
npm run lint
```

O projeto sobe por padrão em `http://localhost:5173`.

## Estrutura

```
src/
├── assets/imgs/        # logo e imagens de marca
├── components/
│   ├── ui/              # primitivos shadcn/ui (Button, Card, Badge, Sheet, Separator)
│   ├── layout/           # Header e Footer
│   ├── sections/         # seções da landing page (Hero, Features, Dashboard...)
│   ├── dashboard/        # mockups do painel (stat cards, gráficos)
│   └── shared/           # utilitários compartilhados (animações de scroll)
├── lib/                  # helpers (cn, etc.)
└── App.tsx
```

## Contexto acadêmico

Trabalho de Conclusão de Curso I apresentado ao curso de Ciência da Computação da Universidade Vila Velha (UVV), como parte dos requisitos para obtenção do grau de Bacharel. A implementação e validação completas do sistema estão previstas para o TCC II.

---

<p align="center">© 2026 FarmSense — Projeto acadêmico.</p>
