"use client"

import { InscricaoWizard } from "@/components/features/inscricao/wizard/InscricaoWizard"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"

export default function WizardPage() {
  const params = useParams<{ projetoId: string }>()
  const router = useRouter()
  const projetoId = Number(params.projetoId)

  if (!Number.isFinite(projetoId)) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Projeto inválido.</p>
        <Button className="mt-4" onClick={() => router.push("/home/student/inscricao-monitoria")}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Inscrição em Monitoria</h1>
        <p className="text-muted-foreground">
          Complete os passos para se inscrever. Geramos os Anexos oficiais automaticamente ao final.
        </p>
      </div>
      <InscricaoWizard projetoId={projetoId} />
    </div>
  )
}
