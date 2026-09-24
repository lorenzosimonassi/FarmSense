import type { Metadata } from "next"

import { AuthDivider, GoogleButton } from "@/components/auth/GoogleButton"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { isGoogleEnabled } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Criar conta — FarmSense",
}

export default function SignUpPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Crie sua conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece a organizar a gestão da sua propriedade em poucos minutos.
        </p>
      </div>
      <div className="flex flex-col gap-5">
        {isGoogleEnabled && (
          <>
            <GoogleButton />
            <AuthDivider />
          </>
        )}
        <SignUpForm />
      </div>
    </>
  )
}
