"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
    setEditingAllocations((prev) => ({ ...prev, [projectId]: value }))
  }

  const handleAllocateCandidate = (inscricaoId: number, tipo: TipoVaga) => {
    allocateCandidateMutation.mutate({ inscricaoId, tipo })
  }

  return (
    <PagesLayout
      title="Alocação de Bolsas"
      subtitle="Gerencie a distribuição de bolsas para projetos aprovados"
      actions={
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Informações sobre o processo">
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Processo de Distribuição de Bolsas</h4>
              <p className="text-sm text-muted-foreground">
                PROGRAD publica resultado → Diretor do IC conversa com chefe de departamento → Chefe conversa com
                comissão → Admin replica os números no sistema.
              </p>
              <Link href="/home/admin/processo-distribuicao-bolsas" className="text-sm text-primary hover:underline">
                Ver documentação completa →
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      }
    >
      <div className="space-y-6">
        {/* Stats overview first */}
        {summary && <AllocationStats summary={summary} />}

        {/* PROGRAD management */}
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

        {/* Filters */}
        <FilterForm form={form} onSubmit={handleFilterSubmit} />

        {/* Info alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm">
            <strong>Fluxo institucional:</strong> 1) PROGRAD divulga total de bolsas → 2) IC repassa aos departamentos →
            3) Chefe e comissão definem distribuição → 4) Admin registra aqui.
          </AlertDescription>
        </Alert>

        {/* Main table */}
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

        {/* Dialogs */}
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
