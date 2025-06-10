"use client"

import { Header } from "@/components/layout/Header"
import { SidebarLayout } from "@/components/layout/SidebarLayout"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50 w-full">
        <SidebarLayout user={{ role: user.role }} />

        <div className="flex flex-1 flex-col">
          <Header
            user={{
              username: user.username,
              email: user.email,
            }}
            onSignOut={logout}
          />

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
