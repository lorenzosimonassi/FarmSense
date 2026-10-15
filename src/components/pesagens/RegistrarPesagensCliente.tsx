"use client"

import dynamic from "next/dynamic"

import { PanelSkeleton } from "@/components/painel/states"

// A planilha lê o rascunho do localStorage já no primeiro render, então não é pré-renderizada no servidor
export const RegistrarPesagensCliente = dynamic(
  () => import("@/components/pesagens/RegistrarPesagens").then((mod) => mod.RegistrarPesagens),
  { ssr: false, loading: () => <PanelSkeleton rows={8} /> }
)
