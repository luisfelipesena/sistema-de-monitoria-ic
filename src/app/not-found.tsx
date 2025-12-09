"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <Button onClick={handleGoBack} variant="default">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  )
}
