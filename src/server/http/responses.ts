import * as z from "zod"

import { Prisma } from "@/generated/prisma/client"

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "PROPERTY_REQUIRED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_RULE"
  | "INTERNAL_ERROR"

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>
  ) {
    super(message)
  }
}

export function jsonError(status: number, code: ErrorCode, message: string, fields?: Record<string, string>) {
  return Response.json({ error: { code, message, ...(fields && { fields }) } }, { status })
}

// Primeira mensagem de cada campo, com o caminho em notação de ponto (ex.: "itens.3.pesoKg")
export function zodFields(error: z.ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".")
    fields[key] ??= issue.message
  }
  return fields
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) return jsonError(error.status, error.code, error.message, error.fields)
  if (error instanceof z.ZodError) return jsonError(400, "VALIDATION_ERROR", "Dados inválidos", zodFields(error))
  if (error instanceof SyntaxError) return jsonError(400, "VALIDATION_ERROR", "Corpo da requisição inválido")
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return jsonError(409, "CONFLICT", "Registro já existe")
  }

  console.error("[api] Erro inesperado", error)
  return jsonError(500, "INTERNAL_ERROR", "Erro inesperado. Tente novamente.")
}
