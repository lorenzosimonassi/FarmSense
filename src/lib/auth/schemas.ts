import * as z from "zod"

const emailSchema = z.email({ error: "Informe um e-mail válido." }).trim().toLowerCase()

const passwordSchema = z
  .string()
  .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "A senha precisa ter pelo menos uma letra." })
  .regex(/[0-9]/, { error: "A senha precisa ter pelo menos um número." })

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword,
  params: { error: "As senhas não coincidem.", path: ["confirmPassword"] },
}

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Informe seu nome completo." }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params)

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe sua senha." }),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params)

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function fieldErrors<T>(error: z.ZodError<T>): FieldErrors<T> {
  const errors: FieldErrors<T> = {}
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof T
    errors[key] ??= issue.message
  }
  return errors
}
