"use client"

import { InteractivePDFViewer } from "@/components/features/signature/InteractivePDFViewer"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { api } from "@/utils/api"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SignProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = Number(params.id)

  // A hardcoded professor ID for now. This should come from the user's session.
  const professorId = 1

  const {
    data,
    isLoading: isLoadingPdf,
    error,
  } = api.professor.getProjectAsPdf.useQuery({ id: projectId, professorId }, { enabled: !!projectId })

  const submitMutation = api.professor.submitProject.useMutation({
    onSuccess: () => {
      toast.success("Projeto submetido com sucesso!")
      router.push(`/dashboard/professor/projetos`)
      // Consider invalidating queries here to refetch project list
    },
    onError: (error) => {
      toast.error("Erro ao submeter o projeto", {
        description: error.message,
      })
    },
  })

  const handleSign = () => {
    // This function is currently not used in the viewer, but can be used for logic before opening the modal
    console.log("Initiating signature...")
  }

  const handleSignatureConfirm = (signature: string) => {
    if (!projectId) return

    submitMutation.mutate({
      id: projectId,
      professorId,
      assinatura: signature,
    })
  }

  if (error) {
    return (
      <PagesLayout title="Erro ao Carregar Documento">
        <p>Não foi possível carregar o PDF do projeto. Tente novamente mais tarde.</p>
        <p className="text-sm text-red-500">{error.message}</p>
      </PagesLayout>
    )
  }

  const pdfUrl = data?.pdf ? `data:application/pdf;base64,${data.pdf}` : ""

  return (
    <PagesLayout
      title="Assinar Proposta de Projeto"
      subtitle="Revise o documento abaixo e adicione sua assinatura digital para submeter o projeto."
    >
      <div className="mx-auto max-w-4xl">
        <InteractivePDFViewer
          pdfUrl={pdfUrl}
          onSign={handleSign}
          onSignatureConfirm={handleSignatureConfirm}
          isSigning={submitMutation.isPending}
          isLoading={isLoadingPdf}
          documentTitle={`Proposta de Projeto #${projectId}`}
        />
      </div>
    </PagesLayout>
  )
}
