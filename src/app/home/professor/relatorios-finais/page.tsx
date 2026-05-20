'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/utils/api'
import {
  SEMESTRE_LABELS,
  type RelatorioFinalDisciplinaContent,
  type RelatorioFinalMonitorContent,
  type RelatorioStatus,
  type Semestre,
} from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ProjetoCard,
  ProjetoDetailsDialog,
  RelatorioDisciplinaDialog,
  RelatorioMonitorDialog,
} from './components'

// Constants
const YEARS_TO_SHOW = 5
const currentYear = new Date().getFullYear()
const years = Array.from({ length: YEARS_TO_SHOW }, (_, i) => currentYear - i)

// Initial form states
const EMPTY_DISCIPLINA_FORM: RelatorioFinalDisciplinaContent = {
  resumoAtividades: '',
  avaliacaoGeral: '',
  dificuldadesEncontradas: '',
  sugestoesMelhorias: '',
  observacoes: '',
}

const EMPTY_MONITOR_FORM: RelatorioFinalMonitorContent = {
  desempenhoGeral: '',
  atividadesRealizadas: '',
  frequencia: '',
  notaFinal: 0,
  avaliacaoQualitativa: '',
  observacoes: '',
}

export default function RelatoriosFinaisPage() {
  // Filter state
  const [ano, setAno] = useState<number | undefined>(currentYear)
  const [semestre, setSemestre] = useState<Semestre | undefined>(undefined)

  // Dialog states
  const [selectedProjeto, setSelectedProjeto] = useState<number | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMonitorDialog, setShowMonitorDialog] = useState(false)
  const [selectedMonitor, setSelectedMonitor] = useState<{
    inscricaoId: number
    nomeCompleto: string
    relatorioDisciplinaId: number
  } | null>(null)

  // Form states
  const [disciplinaForm, setDisciplinaForm] = useState<RelatorioFinalDisciplinaContent>(EMPTY_DISCIPLINA_FORM)
  const [monitorForm, setMonitorForm] = useState<RelatorioFinalMonitorContent>(EMPTY_MONITOR_FORM)

  const utils = api.useUtils()

  // Queries
  const { data: relatorios, isLoading } = api.relatoriosFinais.listRelatoriosDisciplina.useQuery(
    { ano, semestre },
    { enabled: true }
  )

  const { data: projetoDetails, isLoading: loadingDetails } =
    api.relatoriosFinais.getRelatorioDisciplina.useQuery(
      { projetoId: selectedProjeto! },
      { enabled: !!selectedProjeto }
    )

  // Mutations
  const createRelatorioDisciplina = api.relatoriosFinais.createRelatorioDisciplina.useMutation({
    onSuccess: () => {
      toast.success('Relatório criado com sucesso!')
      setShowCreateDialog(false)
      utils.relatoriosFinais.listRelatoriosDisciplina.invalidate()
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const updateRelatorioDisciplina = api.relatoriosFinais.updateRelatorioDisciplina.useMutation({
    onSuccess: () => {
      toast.success('Relatório atualizado!')
      setShowCreateDialog(false)
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const signRelatorioDisciplina = api.relatoriosFinais.signRelatorioDisciplina.useMutation({
    onSuccess: () => {
      toast.success('Relatório assinado com sucesso!')
      utils.relatoriosFinais.listRelatoriosDisciplina.invalidate()
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const createRelatorioMonitor = api.relatoriosFinais.createRelatorioMonitor.useMutation({
    onSuccess: () => {
      toast.success('Relatório do monitor criado!')
      setShowMonitorDialog(false)
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const signRelatorioMonitorAsProfessor = api.relatoriosFinais.signRelatorioMonitorAsProfessor.useMutation({
    onSuccess: () => {
      toast.success('Relatório do monitor assinado!')
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  // Handlers
  const handleCreateDisciplinaRelatorio = () => {
    if (!selectedProjeto) return
    createRelatorioDisciplina.mutate({ projetoId: selectedProjeto, conteudo: disciplinaForm })
  }

  const handleSaveDisciplinaRelatorio = () => {
    if (!projetoDetails?.id) return
    updateRelatorioDisciplina.mutate({ id: projetoDetails.id, conteudo: disciplinaForm })
  }

  const handleSignDisciplinaRelatorio = () => {
    if (!projetoDetails?.id) return
    signRelatorioDisciplina.mutate({ relatorioId: projetoDetails.id })
  }

  const handleCreateMonitorRelatorio = () => {
    if (!selectedMonitor) return
    createRelatorioMonitor.mutate({
      inscricaoId: selectedMonitor.inscricaoId,
      relatorioDisciplinaId: selectedMonitor.relatorioDisciplinaId,
      conteudo: monitorForm,
    })
  }

  const handleSignMonitorRelatorio = (relatorioId: number) => {
    signRelatorioMonitorAsProfessor.mutate({ relatorioId })
  }

  const openProjetoDetails = (projetoId: number) => {
    setSelectedProjeto(projetoId)
  }

  const openCreateMonitorDialog = (inscricaoId: number, nomeCompleto: string, relatorioDisciplinaId: number) => {
    setSelectedMonitor({ inscricaoId, nomeCompleto, relatorioDisciplinaId })
    setMonitorForm(EMPTY_MONITOR_FORM)
    setShowMonitorDialog(true)
  }

  const handleOpenCreateDialog = () => {
    setDisciplinaForm(EMPTY_DISCIPLINA_FORM)
    setShowCreateDialog(true)
  }

  const handleOpenEditDialog = () => {
    if (projetoDetails?.conteudo) {
      setDisciplinaForm(projetoDetails.conteudo)
    }
    setShowCreateDialog(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Finais</h1>
          <p className="text-muted-foreground">Gere relatórios finais das disciplinas e monitores</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-40">
            <Label>Ano</Label>
            <Select
              value={ano?.toString() ?? 'all'}
              onValueChange={(v) => setAno(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Label>Semestre</Label>
            <Select
              value={semestre || 'all'}
              onValueChange={(v) => setSemestre(v === 'all' ? undefined : (v as Semestre))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SEMESTRE_1">{SEMESTRE_LABELS.SEMESTRE_1}</SelectItem>
                <SelectItem value="SEMESTRE_2">{SEMESTRE_LABELS.SEMESTRE_2}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : relatorios?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum projeto encontrado para o período selecionado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {relatorios?.map((r) => (
            <ProjetoCard
              key={r.projetoId}
              projeto={r.projeto}
              status={r.status as RelatorioStatus | null}
              totalMonitores={r.totalMonitores}
              monitoresAssinados={r.monitoresAssinados}
              professorAssinouEm={r.professorAssinouEm}
              hasRelatorio={r.id > 0}
              onClick={() => openProjetoDetails(r.projetoId)}
            />
          ))}
        </div>
      )}

      {/* Project Details Dialog */}
      <ProjetoDetailsDialog
        open={!!selectedProjeto}
        onOpenChange={(open) => !open && setSelectedProjeto(null)}
        loading={loadingDetails}
        details={projetoDetails ?? null}
        onCreateRelatorio={handleOpenCreateDialog}
        onEditRelatorio={handleOpenEditDialog}
        onSignRelatorio={handleSignDisciplinaRelatorio}
        onCreateMonitorRelatorio={openCreateMonitorDialog}
        onSignMonitorRelatorio={handleSignMonitorRelatorio}
        isSigningDisciplina={signRelatorioDisciplina.isPending}
        isSigningMonitor={signRelatorioMonitorAsProfessor.isPending}
      />

      {/* Create/Edit Disciplina Dialog */}
      <RelatorioDisciplinaDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        isEditing={!!projetoDetails?.id}
        form={disciplinaForm}
        onFormChange={setDisciplinaForm}
        onSubmit={projetoDetails?.id ? handleSaveDisciplinaRelatorio : handleCreateDisciplinaRelatorio}
        isPending={createRelatorioDisciplina.isPending || updateRelatorioDisciplina.isPending}
      />

      {/* Create Monitor Report Dialog */}
      <RelatorioMonitorDialog
        open={showMonitorDialog}
        onOpenChange={setShowMonitorDialog}
        monitorName={selectedMonitor?.nomeCompleto ?? null}
        form={monitorForm}
        onFormChange={setMonitorForm}
        onSubmit={handleCreateMonitorRelatorio}
        isPending={createRelatorioMonitor.isPending}
      />
    </div>
  )
}
