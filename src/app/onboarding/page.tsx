"use client"

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { api } from "@/utils/api"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function OnboardingPage() {
  const router = useRouter()
  const { data: user, isLoading } = api.auth.me.useQuery()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao Sistema de Monitoria
          </h1>
          <p className="text-gray-600">
            Complete seu perfil para começar a usar o sistema
          </p>
        </div>
        
        <OnboardingWizard userId={user.id} userRole={user.role} />
      </div>
    </div>
  )
}