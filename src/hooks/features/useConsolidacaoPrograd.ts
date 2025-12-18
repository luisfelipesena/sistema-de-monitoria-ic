import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useConsolidatedMonitoringData, useExportConsolidated, useValidateCompleteData } from '@/hooks/use-relatorios'
import { api } from '@/utils/api'
import { SEMESTRE_1, TIPO_VAGA_BOLSISTA, type Semestre } from '@/types'

export function useConsolidacaoPrograd() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState<Semestre>(SEMESTRE_1)
  const [incluirBolsistas, setIncluirBolsistas] = useState(true)
  const [incluirVoluntarios, setIncluirVoluntarios] = useState(true)
  const [showValidation, setShowValidation] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)

  const { data: consolidationData, isLoading, refetch } = useConsolidatedMonitoringData(selectedYear, selectedSemester)

  // Validation status for reports
  const {
    data: validationStatus,
    isLoading: isLoadingValidation,
    refetch: refetchValidation,
  } = api.relatoriosValidation.getValidationStatus.useQuery(
    { ano: selectedYear, semestre: selectedSemester },
    { enabled: !!selectedYear && !!selectedSemester }
  )

  // Notification mutations
  const notifyProfessorsMutation = api.relatoriosValidation.notifyProfessorsToGenerateReports.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Notificações Enviadas',
        description: `${result.emailsEnviados} professor(es) notificado(s).${result.errors.length > 0 ? ` ${result.errors.length} erro(s).` : ''}`,
      })
      refetchValidation()
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Notificar',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const notifyStudentsMutation = api.relatoriosValidation.notifyStudentsWithPendingReports.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Notificações Enviadas',
        description: `${result.emailsEnviados} aluno(s) notificado(s).${result.errors.length > 0 ? ` ${result.errors.length} erro(s).` : ''}`,
      })
      refetchValidation()
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Notificar',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const sendCertificatesMutation = api.relatoriosValidation.enviarCertificadosParaNUMOP.useMutation({
    onSuccess: (result) => {
      toast({
        title: result.success ? 'Certificados Enviados' : 'Erro no Envio',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Enviar',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleNotifyProfessors = (prazoFinal?: Date) => {
    notifyProfessorsMutation.mutate({
      ano: selectedYear,
      semestre: selectedSemester,
      prazoFinal,
    })
  }

  const handleNotifyStudents = () => {
    notifyStudentsMutation.mutate({
      ano: selectedYear,
      semestre: selectedSemester,
    })
  }

  const handleSendCertificates = (emailDestino: string) => {
    sendCertificatesMutation.mutate({
      ano: selectedYear,
      semestre: selectedSemester,
      emailDestino,
    })
  }

  const tipoExportacao =
    incluirBolsistas && incluirVoluntarios ? 'ambos' : incluirBolsistas ? 'bolsistas' : 'voluntarios'

  const { data: validationData, isLoading: loadingValidation } = useValidateCompleteData(
    selectedYear,
    selectedSemester,
    tipoExportacao,
    showValidation
  )

  const exportConsolidatedMutation = useExportConsolidated()
  const { data: departamentos } = api.configuracoes.getDepartamentos.useQuery()

  const emailsDepartamento = (departamentos || [])
    .map((departamento) => departamento.emailInstituto)
    .filter((email): email is string => Boolean(email))

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year))
  }

  const handleSemesterChange = (semester: Semestre) => {
    setSelectedSemester(semester)
  }

  const handleValidateData = () => {
    setShowValidation(true)
  }

  const handleSendEmail = async () => {
    if (!emailsDepartamento.length) {
      toast({
        title: 'Configuração pendente',
        description: 'Cadastre o email do departamento nas configurações antes de enviar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await exportConsolidatedMutation.mutateAsync({
        ano: selectedYear,
        semestre: selectedSemester,
        incluirBolsistas,
        incluirVoluntarios,
      })
      toast({
        title: 'Email Enviado com Sucesso',
        description: result.message,
      })
      setShowEmailDialog(false)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro ao tentar enviar a planilha por email.'
      toast({
        title: 'Erro no Envio',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const generateXLSXSpreadsheet = async () => {
    if (!consolidationData || consolidationData.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados para gerar a planilha.',
        variant: 'destructive',
      })
      return
    }

    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Consolidação Monitoria')

    const headers = [
      'Matrícula Monitor',
      'Nome Monitor',
      'Email Monitor',
      'CR',
      'Tipo Monitoria',
      'Valor Bolsa',
      'Projeto',
      'Disciplinas',
      'Professor Responsável',
      'SIAPE Professor',
      'Departamento',
      'Carga Horária Semanal',
      'Total Horas',
      'Data Início',
      'Data Fim',
      'Status',
      'Período',
      'Banco',
      'Agência',
      'Conta',
      'Dígito',
    ]

    const greenFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } }
    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    }

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.fill = greenFill
      cell.font = { bold: true, size: 10 }
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
    headerRow.height = 25

    consolidationData.forEach((item) => {
      const row = sheet.addRow([
        item.monitor.matricula || 'N/A',
        item.monitor.nome,
        item.monitor.email,
        item.monitor.cr?.toFixed(2) || 'N/A',
        item.monitoria.tipo === TIPO_VAGA_BOLSISTA ? 'Bolsista' : 'Voluntário',
        item.monitoria.valorBolsa ? `R$ ${item.monitoria.valorBolsa.toFixed(2)}` : 'N/A',
        item.projeto.titulo,
        item.projeto.disciplinas,
        item.professor.nome,
        item.professor.matriculaSiape || 'N/A',
        item.professor.departamento,
        item.projeto.cargaHorariaSemana,
        item.projeto.cargaHorariaSemana * item.projeto.numeroSemanas,
        item.monitoria.dataInicio,
        item.monitoria.dataFim,
        item.monitoria.status,
        `${item.projeto.ano}.${item.projeto.semestre === SEMESTRE_1 ? '1' : '2'}`,
        item.monitor.banco || 'N/A',
        item.monitor.agencia || 'N/A',
        item.monitor.conta || 'N/A',
        item.monitor.digitoConta || 'N/A',
      ])
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { vertical: 'middle', wrapText: true }
      })
    })

    const colWidths = [15, 30, 30, 8, 15, 12, 40, 50, 30, 15, 25, 15, 12, 12, 12, 10, 10, 15, 10, 15, 8]
    headers.forEach((_, idx) => {
      sheet.getColumn(idx + 1).width = colWidths[idx] || 15
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `consolidacao-monitoria-${selectedYear}-${selectedSemester === SEMESTRE_1 ? '1' : '2'}.xlsx`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Sucesso',
      description: 'Planilha Excel gerada e baixada com sucesso!',
    })
  }

  return {
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
    isPendingExport: exportConsolidatedMutation.isPending,
    setIncluirBolsistas,
    setIncluirVoluntarios,
    setShowEmailDialog,
    handleYearChange,
    handleSemesterChange,
    handleValidateData,
    handleSendEmail,
    generateXLSXSpreadsheet,
    refetch,
    // Report notification features
    validationStatus,
    isLoadingValidation,
    isNotifyingProfessors: notifyProfessorsMutation.isPending,
    isNotifyingStudents: notifyStudentsMutation.isPending,
    isSendingCertificates: sendCertificatesMutation.isPending,
    handleNotifyProfessors,
    handleNotifyStudents,
    handleSendCertificates,
    refetchValidation,
  }
}
