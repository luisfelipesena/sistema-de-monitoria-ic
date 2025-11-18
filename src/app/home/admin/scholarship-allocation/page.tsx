"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import Link from "next/link"
import { type TipoVaga } from "@/types"
import { api } from "@/utils/api"
import { useDialogState } from "@/hooks/useDialogState"
import { useScholarshipAllocation } from "@/hooks/features/useScholarshipAllocation"
import { FilterForm } from "@/components/features/admin/scholarship/FilterForm"
import { ProgradManagementCard } from "@/components/features/admin/scholarship/ProgradManagementCard"
import { AllocationStats } from "@/components/features/admin/scholarship/AllocationStats"
import { AllocationTable } from "@/components/features/admin/scholarship/AllocationTable"
import { ProgradDialog } from "@/components/features/admin/scholarship/ProgradDialog"
import { CandidateSelectionDialog } from "@/components/features/admin/scholarship/CandidateSelectionDialog"

export default function ScholarshipAllocationPage() {
  const {
    filters,
    form,
    editingAllocations,
    setEditingAllocations,
    projects,
    isLoading,
    summary,
    totalPrograd,
    totalAlocadas,
    bolsasRestantes,
    excedeuLimite,
    limiteConfigurado,
    handleFilterSubmit,
    handleEditAllocation,
    handleSaveAllocation,
    handleBulkSave,
    handleNotifyProfessors,
    updateAllocationMutation,
    bulkUpdateMutation,
    allocateCandidateMutation,
    setProgradTotalMutation,
    notifyProfessorsMutation,
  } = useScholarshipAllocation()

  const progradDialog = useDialogState()
  const candidateDialog = useDialogState<number>()

  const { data: candidates } = api.scholarshipAllocation.getCandidatesForProject.useQuery(
    { projetoId: candidateDialog.data! },
    { enabled: !!candidateDialog.data }
  )

  const handleAllocationChange = (projectId: number, value: number) => {
    setEditingAllocations((prev) => ({
      ...prev,
      [projectId]: value,
    }))
  }

  const handleAllocateCandidate = (inscricaoId: number, tipo: TipoVaga) => {
    allocateCandidateMutation.mutate({
      inscricaoId,
      tipo,
    })
  }

  return (
    <PagesLayout
      title="Alocação de Bolsas"
      subtitle="Gerencie a distribuição de bolsas para projetos aprovados"
      actions={
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Informações sobre o processo de distribuição de bolsas">
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Processo de Distribuição de Bolsas</h4>
              <p className="text-sm text-muted-foreground">
                O processo de distribuição segue o fluxo institucional: PROGRAD publica resultado → Diretor do Instituto conversa com chefe de departamento → Chefe conversa com comissão → Admin replica os números no sistema.
              </p>
              <p className="text-sm text-muted-foreground">
                O sistema valida que a alocação não exceda o total oficial de bolsas PROGRAD.
              </p>
              <Link
                href="/docs/processo-distribuicao-bolsas.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver documentação completa →
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      }
    >
      <div className="space-y-6">
        <FilterForm form={form} onSubmit={handleFilterSubmit} />

        <ProgradManagementCard
          totalPrograd={totalPrograd}
          totalAlocadas={totalAlocadas}
          bolsasRestantes={bolsasRestantes}
          excedeuLimite={excedeuLimite}
          limiteConfigurado={limiteConfigurado}
          onOpenProgradDialog={() => progradDialog.open()}
          onNotifyProfessors={handleNotifyProfessors}
          isNotifying={notifyProfessorsMutation.isPending}
        />

        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle>Fluxo institucional</AlertTitle>
          <AlertDescription>
            1) A PROGRAD divulga o total de bolsas para o Instituto; 2) o Instituto (IC) repassa a planilha aos
            departamentos; 3) o chefe e a comissão definem a distribuição e o admin replica os números aqui. Esse
            cartão mantém o limite para garantir que não ultrapassamos o total oficial.
          </AlertDescription>
        </Alert>

        {summary && <AllocationStats summary={summary} />}

        <AllocationTable
          projects={projects}
          isLoading={isLoading}
          editingAllocations={editingAllocations}
          onEditAllocation={handleEditAllocation}
          onSaveAllocation={handleSaveAllocation}
          onBulkSave={handleBulkSave}
          onViewCandidates={(id) => candidateDialog.open(id)}
          onAllocationChange={handleAllocationChange}
          isUpdating={updateAllocationMutation.isPending}
          isBulkUpdating={bulkUpdateMutation.isPending}
        />

        <ProgradDialog
          isOpen={progradDialog.isOpen}
          onClose={progradDialog.close}
          filters={filters}
          onSave={(data) => setProgradTotalMutation.mutate(data)}
          isSaving={setProgradTotalMutation.isPending}
        />

        <CandidateSelectionDialog
          isOpen={candidateDialog.isOpen}
          onClose={candidateDialog.close}
          candidates={candidates}
          onAllocate={handleAllocateCandidate}
          isAllocating={allocateCandidateMutation.isPending}
        />
      </div>
    </PagesLayout>
  )
}
