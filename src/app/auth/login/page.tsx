"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    "no-ticket": "Nenhum ticket CAS foi fornecido. Por favor, tente novamente.",
    "server-error": "Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.",
    "authentication-failed": "Falha na autenticação. Verifique suas credenciais.",
    "invalid-service": "O serviço de autenticação está configurado incorretamente. Contate o administrador.",
    "session-error": "Erro ao criar a sessão. Por favor, tente novamente.",
    "database-error": "Erro ao acessar o banco de dados. Por favor, tente novamente mais tarde.",
    "cas-login-failed": "Ocorreu um erro ao iniciar o processo de login. Por favor, tente novamente.",
  }

  // Handle CAS-specific errors that might come from the CAS server
  let errorMessage = null
  if (error) {
    if (error.startsWith("cas-error:")) {
      // Extract the specific CAS error message
      const casErrorMessage = error.substring("cas-error:".length).trim()
      errorMessage = `Erro do CAS: ${casErrorMessage}`
    } else {
      // Use predefined error messages or fallback
      errorMessage = errorMessages[error] || "Erro desconhecido. Por favor, tente novamente."
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="mb-8">
        <Link href="/">
          <Image src="/images/ic-logo-clean.png" alt="Logo Monitoria IC" width={80} height={80} className="mx-auto" />
        </Link>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Acesse o Sistema de Monitoria usando suas credenciais da UFBA</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600">
              Clique no botão abaixo para ser redirecionado ao serviço de autenticação da UFBA.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button asChild className="w-full">
            <a href="/api/auth/cas-login">Entrar com credenciais da UFBA</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
