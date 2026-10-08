import { Suspense } from "react"
import type { Metadata } from "next"

import { AuthDivider, GoogleButton } from "@/components/auth/GoogleButton"
import { SignUpWizard } from "@/components/auth/SignUpWizard"
import { isGoogleEnabled } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Criar conta | FarmSense",
}

export default function SignUpPage() {
  // Quem entra pelo Google preenche a fazenda depois, em /primeiro-acesso
  const googleSlot = isGoogleEnabled ? (
    <>
      <GoogleButton />
      <AuthDivider />
    </>
  ) : null

  return (
    <Suspense>
      <SignUpWizard googleSlot={googleSlot} />
    </Suspense>
  )
}
