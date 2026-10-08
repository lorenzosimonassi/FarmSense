const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este e-mail.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "A senha é longa demais.",
  INVALID_EMAIL: "Informe um e-mail válido.",
  INVALID_TOKEN: "Este link é inválido ou já expirou. Peça um novo.",
  PROPRIEDADE_INVALIDA: "Confira os dados da fazenda.",
}

export function authErrorMessage(error: { code?: string; status?: number } | null) {
  if (!error) return null
  if (error.status === 429) return "Muitas tentativas. Aguarde alguns segundos e tente novamente."
  // 5xx ou falha de rede: em dev quase sempre é o Postgres/Redis fora do ar
  if (!error.status || error.status >= 500) {
    return "Não foi possível falar com o servidor agora. Tente novamente em instantes."
  }
  return (error.code && MESSAGES[error.code]) ?? "Algo deu errado. Tente novamente."
}
