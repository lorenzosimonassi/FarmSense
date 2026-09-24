"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { authErrorMessage } from "@/lib/auth/errors"

const COOLDOWN_SECONDS = 60

export function ResendVerificationButton({ email }: { email: string }) {
  const [pending, setPending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleResend() {
    setPending(true)
    setFeedback(null)
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/email-verificado",
    })
    setPending(false)

    if (error) {
      setFeedback({ type: "error", message: authErrorMessage(error) ?? "" })
      return
    }

    setFeedback({ type: "success", message: "Enviamos um novo link para o seu e-mail." })
    setCooldown(COOLDOWN_SECONDS)
  }

  return (
    <div className="flex flex-col gap-4">
      {feedback && <FormAlert variant={feedback.type}>{feedback.message}</FormAlert>}
      <Button variant="secondary" onClick={handleResend} disabled={pending || cooldown > 0} className="w-full">
        {pending && <Loader2 className="animate-spin" />}
        {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail"}
      </Button>
    </div>
  )
}
