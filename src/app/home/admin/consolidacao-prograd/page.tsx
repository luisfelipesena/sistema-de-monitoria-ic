"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { ConsolidacaoFilters } from "@/components/features/admin/consolidacao-prograd/ConsolidacaoFilters"
import { ConsolidacaoStatsCards } from "@/components/features/admin/consolidacao-prograd/ConsolidacaoStatsCards"
import { ConsolidacaoTable } from "@/components/features/admin/consolidacao-prograd/ConsolidacaoTable"
import { ValidationDialog } from "@/components/features/admin/consolidacao-prograd/ValidationDialog"
import { ExportSection } from "@/components/features/admin/consolidacao-prograd/ExportSection"
import { useConsolidacaoPrograd } from "@/hooks/features/useConsolidacaoPrograd"

export default function ConsolidacaoPROGRADPage() {
  const {
    selectedYear,
    selectedSemester,
    incluirBolsistas,
    incluirVoluntarios,
    showValidation,
    showEmailDialog,
    consolidationData,
    isLoading,
    validationData,
    loadingValidation,
    emailsDepartamento,
    isPendingExport,
    setIncluirBolsistas,
    setIncluirVoluntarios,
    setShowEmailDialog,
    handleYearChange,
    handleSemesterChange,
    handleValidateData,
    handleSendEmail,
    generateCSVSpreadsheet,
    refetch,
  } = useConsolidacaoPrograd()

  return (
    <PagesLayout
      title="Consolidação PROGRAD"
      subtitle="Relatório consolidado enviado primeiro ao departamento (DCC) para posterior encaminhamento à PROGRAD"
    >
      <div className="space-y-6">
        {/* Stats overview first */}
        {consolidationData && consolidationData.length > 0 && <ConsolidacaoStatsCards data={consolidationData} />}

        {/* Filters */}
        <ConsolidacaoFilters
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
          incluirBolsistas={incluirBolsistas}
          incluirVoluntarios={incluirVoluntarios}
          isLoading={isLoading}
          loadingValidation={loadingValidation}
          onYearChange={handleYearChange}
          onSemesterChange={handleSemesterChange}
          onIncluirBolsistasChange={setIncluirBolsistas}
          onIncluirVoluntariosChange={setIncluirVoluntarios}
          onRefetch={refetch}
          onValidate={handleValidateData}
        />

        {/* Validation results */}
        <ValidationDialog validationData={validationData} showValidation={showValidation} />

        {/* Export actions */}
        <ExportSection
          data={consolidationData}
          isLoading={isLoading}
          emailsDepartamento={emailsDepartamento}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
          incluirBolsistas={incluirBolsistas}
          incluirVoluntarios={incluirVoluntarios}
          showEmailDialog={showEmailDialog}
          setShowEmailDialog={setShowEmailDialog}
          isPendingExport={isPendingExport}
          onSendEmail={handleSendEmail}
          onGenerateCSV={generateCSVSpreadsheet}
        />

        {/* Main table */}
        <ConsolidacaoTable
          data={consolidationData}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
          isLoading={isLoading}
        />
      </div>
    </PagesLayout>
  )
}
