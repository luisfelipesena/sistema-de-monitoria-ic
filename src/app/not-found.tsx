'use client'

import { useAuth } from '@/hooks/use-auth'
import { SidebarLayout } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NotFound() {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If user is authenticated and path starts with /home, show within the home layout
  if (user && pathname.startsWith('/home')) {
    return (
      <SidebarProvider>
        <SidebarLayout pathname={pathname} />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Página não encontrada</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    A página que você está procurando não existe ou foi movida.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button asChild variant="outline">
                      <Link href="/home">
                        <Home className="w-4 h-4 mr-2" />
                        Ir para o início
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="javascript:history.back()">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // If user is not authenticated or path doesn't start with /home, show a simpler 404
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Página não encontrada</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Página inicial
              </Link>
            </Button>
            <Button asChild>
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}