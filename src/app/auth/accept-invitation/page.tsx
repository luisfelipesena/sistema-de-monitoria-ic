"use client"

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import { Loader2, ServerCrash } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const { data, isLoading, isError, error } = api.auth.verifyInvitation.useQuery(
    { token: token || "" },
    { enabled: !!token }
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-muted-foreground">Verificando convite...</p>
      </div>
    )
  }

  if (isError || !data || !data.success || !data.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <ServerCrash className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-bold">Convite Inválido ou Expirado</h1>
        <p className="text-muted-foreground max-w-md">
          O link de convite que você usou não é válido ou já expirou. Por favor, solicite um novo convite ao
          administrador do sistema.
        </p>
        <p className="text-sm text-red-500">{error?.message || data?.error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo(a) ao Sistema de Monitoria</h1>
          <p className="text-gray-600">
            Seu convite foi verificado com sucesso. Complete seu perfil de professor para começar.
          </p>
        </div>
        <OnboardingWizard userRole={UserRole.PROFESSOR} invitationData={{ email: data.email, token: token! }} />
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
