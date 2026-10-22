// Cliente das telas do painel: JSON entra e sai, erros da API viram ApiError com os campos inválidos

export type ApiErrorBody = { code: string; message: string; fields?: Record<string, string> }

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>
  ) {
    super(message)
  }
}

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; params?: Record<string, unknown> }

export async function apiFetch<T>(path: string, { method = "GET", body, params }: Options = {}): Promise<T> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value))
  }
  const url = `/api${path}${query.size ? `?${query}` : ""}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Não foi possível falar com o servidor agora. Tente novamente em instantes.")
  }

  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T
  }

  const error: ApiErrorBody | undefined = (await response.json().catch(() => null))?.error
  // Sessão expirada ou fazenda ainda não cadastrada: leva para onde o usuário consegue resolver.
  // Recarga completa de propósito: descarta o cache de consultas da sessão anterior.
  const destino = response.status === 401 ? "/login" : error?.code === "PROPERTY_REQUIRED" ? "/primeiro-acesso" : null
  if (destino) window.location.assign(destino)

  throw new ApiError(
    response.status,
    error?.code ?? "INTERNAL_ERROR",
    error?.message ?? "Erro inesperado. Tente novamente.",
    error?.fields
  )
}
