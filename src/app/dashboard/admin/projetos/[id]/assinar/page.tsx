"use client"

import { InteractivePDFViewer } from "@/components/features/signature/InteractivePDFViewer"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/utils/api"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function AdminSignProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = Number(params.id)

  const [bolsasDisponibilizadas, setBolsasDisponibilizadas] = useState(0)

  // This should come from the user's session
  const adminUserId = 1
  // This is a placeholder; in a real app, this would come from the project data
  const professorId = 1

  const {
    data: pdfData,
    isLoading: isLoadingPdf,
    error: pdfError,
  } = api.professor.getProjectAsPdf.useQuery({ id: projectId, professorId }, { enabled: !!projectId })

  const approveMutation = api.admin.approveProject.useMutation({
    onSuccess: () => {
      toast.success("Projeto aprovado e assinado com sucesso!")
      router.push(`/dashboard/admin/projetos`)
    },
    onError: (error) => {
      toast.error("Erro ao aprovar o projeto", {
        description: error.message,
      })
    },
  })

  const handleSignatureConfirm = (signature: string) => {
    if (!projectId) return

    approveMutation.mutate({
      id: projectId,
      adminUserId,
      assinatura: signature,
      bolsasDisponibilizadas,
    })
  }

  if (pdfError) {
    return (
      <PagesLayout title="Erro ao Carregar Documento">
        <p>Não foi possível carregar o PDF do projeto. Tente novamente mais tarde.</p>
        <p className="text-sm text-red-500">{pdfError.message}</p>
      </PagesLayout>
    )
  }

  const pdfUrl = pdfData?.pdf ? `data:application/pdf;base64,${pdfData.pdf}` : ""

  return (
    <PagesLayout
      title="Aprovar e Assinar Proposta"
      subtitle="Revise o projeto, defina o número de bolsas e assine para oficializar a aprovação."
    >
      <div className="mx-auto max-w-4xl grid gap-6">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="bolsas">Bolsas Disponibilizadas</Label>
          <Input
            id="bolsas"
            type="number"
            value={bolsasDisponibilizadas}
            onChange={(e) => setBolsasDisponibilizadas(Number(e.target.value))}
            min="0"
          />
        </div>
        <InteractivePDFViewer
          pdfUrl={pdfUrl}
          onSign={() => {}}
          onSignatureConfirm={handleSignatureConfirm}
          isSigning={approveMutation.isPending}
          isLoading={isLoadingPdf}
          documentTitle={`Aprovar Proposta de Projeto #${projectId}`}
        />
      </div>
    </PagesLayout>
  )
}
