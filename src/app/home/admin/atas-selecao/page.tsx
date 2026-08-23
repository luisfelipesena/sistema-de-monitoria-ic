'use client'

import { useMemo, useState } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { AtasStatsCards, createAtasColumns, type AtaAdminItem } from '@/components/features/admin/atas-selecao'
import { useAtasAdmin } from '@/hooks/features/useAtasAdmin'
import { api } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Eye, FileText, Loader, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { AtaSelecaoTemplate } from '@/server/lib/pdfTemplates/AtaSelecaoTemplate'
import { ResultadoSelecaoTemplate } from '@/server/lib/pdfTemplates/resultado-selecao'
import type { AtaSelecaoData, SelecaoCandidato } from '@/types'

const ClientOnlyPDFViewer = dynamic(
  () => import('@/components/features/projects/PDFViewerWrapper').then((mod) => mod.PDFViewerWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-[700px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
)

export default function AtasSelecaoAdminPage() {
  const {
    atas,
    isLoading,
    stats,
    total,
    columnFilters,
    setColumnFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useAtasAdmin()

  const [selectedAta, setSelectedAta] = useState<AtaAdminItem | null>(null)
  const [selectedAtaType, setSelectedAtaType] = useState<'BOLSISTA' | 'VOLUNTARIO'>('BOLSISTA')
  const [pdfMode, setPdfMode] = useState<'ATA' | 'RESULTADO'>('ATA')

  // Fetch ata data when a project is selected
  const { data: dadosAta, isLoading: loadingAtaData } = api.selecao.generateAtaData.useQuery(
    { projetoId: selectedAta?.projetoId.toString() || '' },
    { enabled: !!selectedAta }
  )

  const prepareAtaData = (tipoAta: 'BOLSISTA' | 'VOLUNTARIO'): AtaSelecaoData | null => {
    if (!dadosAta) return null

    return {
      tipoAta,
      projeto: {
        id: dadosAta.projeto.id,
        titulo: dadosAta.projeto.titulo,
        ano: dadosAta.projeto.ano,
        semestre: dadosAta.projeto.semestre,
        departamento: dadosAta.projeto.departamento || { nome: 'N/A', sigla: null },
        professorResponsavel: dadosAta.projeto.professorResponsavel,
        disciplinas: dadosAta.projeto.disciplinas,
      },
      totalInscritos: dadosAta.totalInscritos,
      totalCompareceram: dadosAta.totalCompareceram,
      inscricoesBolsista: dadosAta.inscricoesBolsista,
      inscricoesVoluntario: dadosAta.inscricoesVoluntario,
      dataGeracao: dadosAta.dataGeracao,
      candidatos: [...dadosAta.inscricoesBolsista, ...dadosAta.inscricoesVoluntario].map((c: SelecaoCandidato) => ({
        id: c.id,
        aluno: c.aluno,
        tipoVagaPretendida: c.tipoVagaPretendida,
        notaDisciplina: c.notaDisciplina ? Number(c.notaDisciplina) : null,
        notaSelecao: c.notaSelecao ? Number(c.notaSelecao) : null,
        coeficienteRendimento: c.coeficienteRendimento ? Number(c.coeficienteRendimento) : null,
        notaFinal: c.notaFinal ? Number(c.notaFinal) : null,
        status: c.status,
        observacoes: c.feedbackProfessor,
      })),
      ataInfo: {
        dataSelecao: new Date().toLocaleDateString('pt-BR'),
        localSelecao: 'Online via Sistema de Monitoria',
        observacoes: 'Documento consultado via portal administrativo.',
      },
    }
  }

  const ataData = useMemo(() => prepareAtaData(selectedAtaType), [dadosAta, selectedAtaType])

  const columns = useMemo(
    () =>
      createAtasColumns({
        onViewPdf: (ata) => {
          setSelectedAta(ata)
          setPdfMode('ATA')
          setSelectedAtaType('BOLSISTA')
        },
      }),
    []
  )

  return (
    <PagesLayout title="Atas e Resultados">
      {isLoading && atas.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando atas...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <AtasStatsCards stats={stats} />
          <TableComponent
            data={atas}
            columns={columns}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            isLoading={isLoading}
            serverPagination={{
              totalCount: total,
              pageIndex: page,
              pageSize,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />

          <Dialog open={!!selectedAta} onOpenChange={(open) => !open && setSelectedAta(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentos de Seleção - {selectedAta?.projetoTitulo}
                </DialogTitle>
                <DialogDescription>
                  Visualização do documento oficial da ata e resultado de seleção do projeto.
                </DialogDescription>
              </DialogHeader>

              {loadingAtaData ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Carregando dados do documento...</span>
                </div>
              ) : dadosAta && ataData ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-center bg-muted/40 p-2 rounded-lg border">
                    <Button
                      size="sm"
                      variant={pdfMode === 'ATA' && selectedAtaType === 'BOLSISTA' ? 'default' : 'outline'}
                      onClick={() => {
                        setPdfMode('ATA')
                        setSelectedAtaType('BOLSISTA')
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Ata (Bolsistas)
                    </Button>
                    <Button
                      size="sm"
                      variant={pdfMode === 'ATA' && selectedAtaType === 'VOLUNTARIO' ? 'default' : 'outline'}
                      onClick={() => {
                        setPdfMode('ATA')
                        setSelectedAtaType('VOLUNTARIO')
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Ata (Voluntários)
                    </Button>
                    <Button
                      size="sm"
                      variant={pdfMode === 'RESULTADO' && selectedAtaType === 'BOLSISTA' ? 'default' : 'outline'}
                      onClick={() => {
                        setPdfMode('RESULTADO')
                        setSelectedAtaType('BOLSISTA')
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Resultado (Bolsistas)
                    </Button>
                    <Button
                      size="sm"
                      variant={pdfMode === 'RESULTADO' && selectedAtaType === 'VOLUNTARIO' ? 'default' : 'outline'}
                      onClick={() => {
                        setPdfMode('RESULTADO')
                        setSelectedAtaType('VOLUNTARIO')
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Resultado (Voluntários)
                    </Button>
                  </div>

                  <div className="h-[700px] w-full rounded-md border overflow-hidden">
                    <ClientOnlyPDFViewer width="100%" height="100%">
                      {pdfMode === 'RESULTADO' ? (
                        <ResultadoSelecaoTemplate data={ataData} tipo={selectedAtaType} />
                      ) : (
                        <AtaSelecaoTemplate data={ataData} />
                      )}
                    </ClientOnlyPDFViewer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Não foi possível carregar os dados para este projeto.
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </PagesLayout>
  )
}
