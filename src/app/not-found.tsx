"use client"

import { Header } from "@/components/layout/Header"
import { SidebarLayout } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

function NotFoundContent() {
  const router = useRouter()

  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <h2 className="text-xl font-semibold text-gray-700">Página não encontrada</h2>
          <p className="text-gray-500">A página que você está procurando não existe ou foi movida.</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NotFound() {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()

  // If still loading, show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spinner />
      </div>
    )
  }

  // If user is logged in, show with sidebar layout
  if (user) {
    return (
      <SidebarProvider>
        <SidebarLayout pathname={pathname} />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <NotFoundContent />
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // If not logged in, show simple layout
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <NotFoundContent />
    </div>
  )
}
