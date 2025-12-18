"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { ConsolidacaoFilters } from "@/components/features/admin/consolidacao-prograd/ConsolidacaoFilters"
import { ConsolidacaoStatsCards } from "@/components/features/admin/consolidacao-prograd/ConsolidacaoStatsCards"
import { ConsolidacaoTable } from "@/components/features/admin/consolidacao-prograd/ConsolidacaoTable"
import { ValidationDialog } from "@/components/features/admin/consolidacao-prograd/ValidationDialog"
import { ExportSection } from "@/components/features/admin/consolidacao-prograd/ExportSection"
import { ReportNotificationsSection } from "@/components/features/admin/consolidacao-prograd/ReportNotificationsSection"
import { useConsolidacaoPrograd } from "@/hooks/features/useConsolidacaoPrograd"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    generateXLSXSpreadsheet,
    refetch,
    // Report notifications
    validationStatus,
    isLoadingValidation,
    isNotifyingProfessors,
    isNotifyingStudents,
    isSendingCertificates,
    handleNotifyProfessors,
    handleNotifyStudents,
    handleSendCertificates,
    refetchValidation,
  } = useConsolidacaoPrograd()

  return (
    <PagesLayout
      title="Consolidação PROGRAD"
      subtitle="Gerenciamento de relatórios finais, notificações e exportação para PROGRAD"
    >
      <Tabs defaultValue="consolidacao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="consolidacao">Consolidação</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações & Certificados</TabsTrigger>
        </TabsList>

        <TabsContent value="consolidacao" className="space-y-6">
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
            onGenerateXLSX={generateXLSXSpreadsheet}
          />

          {/* Main table */}
          <ConsolidacaoTable
            data={consolidationData}
            selectedYear={selectedYear}
            selectedSemester={selectedSemester}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <ReportNotificationsSection
            selectedYear={selectedYear}
            selectedSemester={selectedSemester}
            validationStatus={validationStatus}
            isLoadingValidation={isLoadingValidation}
            isNotifyingProfessors={isNotifyingProfessors}
            isNotifyingStudents={isNotifyingStudents}
            isSendingCertificates={isSendingCertificates}
            onNotifyProfessors={handleNotifyProfessors}
            onNotifyStudents={handleNotifyStudents}
            onSendCertificates={handleSendCertificates}
            onRefreshValidation={refetchValidation}
          />
        </TabsContent>
      </Tabs>
    </PagesLayout>
  )
}
