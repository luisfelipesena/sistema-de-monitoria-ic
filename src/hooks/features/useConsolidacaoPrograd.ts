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
    .map((departamento) => departamento.emailChefeDepartamento)
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
        description: 'Cadastre o email do chefe do departamento nas configurações antes de enviar.',
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

  const generateCSVSpreadsheet = () => {
    if (!consolidationData || consolidationData.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados para gerar a planilha.',
        variant: 'destructive',
      })
      return
    }

    const csvHeader = [
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

    const csvData = consolidationData.map((item) => [
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

    const csvContent = [csvHeader, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `consolidacao-monitoria-${selectedYear}-${selectedSemester === SEMESTRE_1 ? '1' : '2'}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Sucesso',
      description: 'Planilha CSV gerada e baixada com sucesso!',
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
    generateCSVSpreadsheet,
    refetch,
  }
}
