import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useConsolidatedMonitoringData, useExportConsolidated, useValidateCompleteData } from '@/hooks/use-relatorios'
import { api } from '@/utils/api'
import { SEMESTRE_1, type Semestre } from '@/types'

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

  const handleSendEmail = async (
    arg?: string | { incluirBolsistas?: boolean; incluirVoluntarios?: boolean; emailDestino?: string }
  ) => {
    const opts = typeof arg === 'string' ? { emailDestino: arg } : arg
    const incBolsas = opts?.incluirBolsistas ?? incluirBolsistas
    const incVol = opts?.incluirVoluntarios ?? incluirVoluntarios

    if (!emailsDepartamento.length && !opts?.emailDestino?.trim()) {
      toast({
        title: 'Configuração pendente',
        description: 'Digite um email de destino ou cadastre o email do departamento nas configurações.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await exportConsolidatedMutation.mutateAsync({
        ano: selectedYear,
        semestre: selectedSemester,
        incluirBolsistas: incBolsas,
        incluirVoluntarios: incVol,
        emailDestino: opts?.emailDestino?.trim() || undefined,
      })
      toast({
        title: 'Email Enviado com Sucesso',
        description: `${result.message} Destinatário(s): ${result.destinatarios.join(', ')}`,
      })
      setShowEmailDialog(false)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro ao tentar enviar os documentos por email.'
      setShowValidation(true)
      toast({
        title: 'Erro no Envio',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleSendEmailBolsistas = (emailDestino?: string) =>
    handleSendEmail({ incluirBolsistas: true, incluirVoluntarios: false, emailDestino })
  const handleSendEmailVoluntarios = (emailDestino?: string) =>
    handleSendEmail({ incluirBolsistas: false, incluirVoluntarios: true, emailDestino })

  const generateXLSXSpreadsheet = async (tipoFilter: 'BOLSISTA' | 'VOLUNTARIO') => {
    if (!consolidationData || consolidationData.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados consolidados para exportar.',
        variant: 'destructive',
      })
      return
    }

    const filteredData = consolidationData.filter((item) => item.monitoria.tipo === tipoFilter)

    if (filteredData.length === 0) {
      toast({
        title: 'Aviso',
        description: `Nenhum monitor ${tipoFilter === 'BOLSISTA' ? 'bolsista' : 'voluntário'} encontrado no período.`,
        variant: 'destructive',
      })
      return
    }

    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const isBolsista = tipoFilter === 'BOLSISTA'
    const sheetName = isBolsista ? 'Monitores Bolsistas' : 'Monitores Voluntários'
    const sheet = workbook.addWorksheet(sheetName)

    const columns = isBolsista
      ? [
          { header: 'Nome Completo', key: 'nomeCompleto', width: 32 },
          { header: 'RG (somente números)', key: 'rg', width: 18 },
          { header: 'CPF (somente números)', key: 'cpf', width: 18 },
          { header: 'Matrícula', key: 'matricula', width: 14 },
          { header: 'Celular (DDD + número)', key: 'celular', width: 18 },
          { header: 'E-mail', key: 'email', width: 30 },
          { header: 'Banco (exceto Mercado Pago)', key: 'banco', width: 28 },
          { header: 'Agência', key: 'agencia', width: 12 },
          { header: 'Dígito', key: 'digitoAgencia', width: 10 },
          { header: 'Conta', key: 'conta', width: 14 },
          { header: 'Dígito', key: 'digitoConta', width: 10 },
          {
            header: 'Endereço completo (rua, nº, complemento, bairro, CEP, cidade e estado)',
            key: 'endereco',
            width: 50,
          },
          { header: 'Componente Curricular do Projeto (código e nome)', key: 'disciplina', width: 35 },
          { header: 'Professor Responsável', key: 'professor', width: 30 },
        ]
      : [
          { header: 'Nome Completo', key: 'nomeCompleto', width: 32 },
          { header: 'RG (somente números)', key: 'rg', width: 18 },
          { header: 'CPF (somente números)', key: 'cpf', width: 18 },
          { header: 'Matrícula', key: 'matricula', width: 14 },
          { header: 'Componente Curricular do Projeto (código e nome)', key: 'disciplina', width: 35 },
          { header: 'Professor Responsável', key: 'professor', width: 30 },
        ]

    sheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width }))

    const greenFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } }
    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    }

    const headerRow = sheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.fill = greenFill
      cell.font = { bold: true, size: 10 }
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
    headerRow.height = 25

    const cleanDigits = (val?: string | null) => (val ? val.replace(/\D/g, '') : '')
    const extractAgenciaParts = (agencia?: string | null) => {
      if (!agencia) return { agencia: '', digito: '' }
      const parts = agencia.split('-')
      if (parts.length > 1) {
        return { agencia: parts[0]?.trim() || '', digito: parts[1]?.trim() || '' }
      }
      return { agencia: agencia.trim(), digito: '' }
    }

    filteredData.forEach((item) => {
      let rowData: Record<string, string> = {}
      if (isBolsista) {
        const { agencia, digito: digitoAgencia } = extractAgenciaParts(item.monitor.agencia)
        rowData = {
          nomeCompleto: item.monitor.nome,
          rg: cleanDigits(item.monitor.rg),
          cpf: cleanDigits(item.monitor.cpf),
          matricula: item.monitor.matricula || '',
          celular: cleanDigits(item.monitor.telefone),
          email: item.monitor.email,
          banco: item.monitor.banco || '',
          agencia,
          digitoAgencia,
          conta: item.monitor.conta || '',
          digitoConta: item.monitor.digitoConta || '',
          endereco: item.monitor.endereco || '',
          disciplina: item.projeto.disciplinas,
          professor: item.professor.nome,
        }
      } else {
        rowData = {
          nomeCompleto: item.monitor.nome,
          rg: cleanDigits(item.monitor.rg),
          cpf: cleanDigits(item.monitor.cpf),
          matricula: item.monitor.matricula || '',
          disciplina: item.projeto.disciplinas,
          professor: item.professor.nome,
        }
      }

      const row = sheet.addRow(rowData)
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { vertical: 'middle', wrapText: true }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const tipoSlug = tipoFilter === 'BOLSISTA' ? 'bolsistas' : 'voluntarios'
    link.download = `consolidacao-${tipoSlug}-${selectedYear}-${selectedSemester === SEMESTRE_1 ? '1' : '2'}.xlsx`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Sucesso',
      description: `Planilha de ${tipoFilter === 'BOLSISTA' ? 'Bolsistas' : 'Voluntários'} gerada com sucesso!`,
    })
  }

  const generateXLSXSpreadsheetBolsistas = () => generateXLSXSpreadsheet('BOLSISTA')
  const generateXLSXSpreadsheetVoluntarios = () => generateXLSXSpreadsheet('VOLUNTARIO')

  // Signature status query
  const {
    data: signatureStatus,
    isLoading: isLoadingSignatureStatus,
    refetch: refetchSignatureStatus,
  } = api.relatorios.getConsolidacaoSignatureStatus.useQuery({
    ano: selectedYear,
    semestre: selectedSemester,
  })

  const [latestSignatureLink, setLatestSignatureLink] = useState<string | null>(null)

  const requestSignatureMutation = api.relatorios.solicitarAssinaturaChefeConsolidacao.useMutation({
    onSuccess: (result) => {
      setLatestSignatureLink(result.link || null)
      toast({
        title: 'Solicitação Enviada',
        description: result.message,
      })
      refetchSignatureStatus()
    },
    onError: (error) => {
      toast({
        title: 'Erro ao solicitar assinatura',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleRequestChefeSignature = (chefeEmail: string, chefeNome: string) => {
    requestSignatureMutation.mutate({
      ano: selectedYear,
      semestre: selectedSemester,
      chefeEmail,
      chefeNome,
    })
  }

  const downloadPDFQuery = api.relatorios.downloadConsolidacaoPDF.useQuery(
    { ano: selectedYear, semestre: selectedSemester },
    { enabled: false }
  )

  const handleDownloadPDF = async () => {
    try {
      const result = await downloadPDFQuery.refetch()
      if (result.data?.pdfBase64) {
        const byteCharacters = atob(result.data.pdfBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `resultados-selecao-bolsistas-${selectedYear}-${selectedSemester === SEMESTRE_1 ? '1' : '2'}.pdf`
        link.click()
        toast({
          title: 'Sucesso',
          description: 'PDF de Resultados das Matérias com Bolsistas baixado com sucesso!',
        })
      }
    } catch (_err) {
      toast({
        title: 'Erro ao baixar PDF',
        description: 'Não foi possível gerar o PDF consolidado.',
        variant: 'destructive',
      })
    }
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
    handleSendEmailBolsistas,
    handleSendEmailVoluntarios,
    generateXLSXSpreadsheet,
    generateXLSXSpreadsheetBolsistas,
    generateXLSXSpreadsheetVoluntarios,
    signatureStatus,
    latestSignatureLink,
    isLoadingSignatureStatus,
    isRequestingSignature: requestSignatureMutation.isPending,
    handleRequestChefeSignature,
    handleDownloadPDF,
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
