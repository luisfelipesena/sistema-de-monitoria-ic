"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import { Loader2 } from "lucide-react"
import { redirect, useRouter } from "next/navigation"
import { useEffect } from "react"

// Dashboard welcome component
function DashboardWelcome() {
  const { data: user, isLoading, error } = api.auth.me.useQuery()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bem-vindo ao Sistema de Monitoria</h1>

      {user ? (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-lg">
            Olá, <span className="font-semibold">{user.username}</span>
          </p>
          <p className="text-gray-500">Você está logado como {user.role}</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p>Carregando informações do usuário...</p>
        </div>
      )}
    </div>
  )
}

// Dashboard page
export default function DashboardPage() {
  const { data: user, isLoading, error } = api.auth.me.useQuery()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (error || !user) {
      router.push("/auth/login")
      return
    }

    switch (user.role) {
      case UserRole.ADMIN:
        redirect("/dashboard/admin")
        break
      case UserRole.PROFESSOR:
        redirect("/dashboard/professor")
        break
      case UserRole.STUDENT:
        redirect("/dashboard/student")
        break
      default:
        router.push("/auth/login")
        break
    }
  }, [isLoading, user, error, router])

  return (
    <PagesLayout title="Carregando...">
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Redirecionando para seu painel...</p>
        </div>
      </div>
    </PagesLayout>
  )
}
