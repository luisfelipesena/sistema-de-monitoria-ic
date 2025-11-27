"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Algo deu errado</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">Ocorreu um erro inesperado. Por favor, tente novamente.</p>
          {error.digest && <p className="text-xs text-muted-foreground font-mono">Código: {error.digest}</p>}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
            <Button onClick={() => window.history.back()}>
              <Home className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
