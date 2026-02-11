"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { FileSpreadsheet, Upload } from "lucide-react"
import { useMemo, useState } from "react"

import {
  ImportStatsCards,
  createImportHistoryColumns,
  ImportDialog,
  ImportDetailsDialog,
  ImportInstructions,
} from "@/components/features/admin/import-projects"

export default function ImportProjectsPage() {
  const { toast } = useToast()
  const [selectedImportId, setSelectedImportId] = useState<number | null>(null)
  const apiUtils = api.useUtils()

  const { data: importHistory, isLoading, refetch } = api.importProjects.getImportHistory.useQuery()
  const { data: importDetails } = api.importProjects.getImportDetails.useQuery(
    { id: selectedImportId! },
    { enabled: !!selectedImportId }
  )

  const handleNotified = () => {
    if (selectedImportId) {
      apiUtils.importProjects.getImportDetails.invalidate({ id: selectedImportId })
    }
    refetch()
  }

  const deleteImportMutation = api.importProjects.deleteImport.useMutation({
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Importação excluída com sucesso!" })
      refetch()
    },
    onError: (error) => {
      toast({ title: "Erro", description: `Erro ao excluir: ${error.message}`, variant: "destructive" })
    },
  })

  const stats = useMemo(() => {
    if (!importHistory) return { total: 0, concluidos: 0, comErros: 0, processando: 0 }
    return {
      total: importHistory.length,
      concluidos: importHistory.filter((i) => i.status === "CONCLUIDO").length,
      comErros: importHistory.filter((i) => i.status === "CONCLUIDO_COM_ERROS" || i.status === "ERRO").length,
      processando: importHistory.filter((i) => i.status === "PROCESSANDO").length,
    }
  }, [importHistory])

  const columns = useMemo(
    () =>
      createImportHistoryColumns({
        onViewDetails: setSelectedImportId,
        onDelete: (id) => deleteImportMutation.mutate({ id }),
        isDeleting: deleteImportMutation.isPending,
      }),
    [deleteImportMutation]
  )

  return (
    <PagesLayout
      title="Importar Planejamento"
      subtitle="Importe projetos de monitoria a partir de planilhas Excel"
      actions={<ImportDialog onSuccess={refetch} />}
    >
      <div className="space-y-6">
        <ImportStatsCards stats={stats} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Nova Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImportInstructions />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Histórico de Importações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  <p className="mt-2">Carregando histórico...</p>
                </div>
              </div>
            ) : importHistory && importHistory.length > 0 ? (
              <TableComponent
                columns={columns}
                data={importHistory}
                searchableColumn="nomeArquivo"
                searchPlaceholder="Buscar por nome do arquivo..."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma importação encontrada</h3>
                <p>Ainda não foram realizadas importações de projetos.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <ImportDetailsDialog
          details={importDetails}
          open={!!selectedImportId}
          onOpenChange={(open) => !open && setSelectedImportId(null)}
          onNotified={handleNotified}
        />
      </div>
    </PagesLayout>
  )
}
