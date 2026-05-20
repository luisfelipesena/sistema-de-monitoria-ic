import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTRPCMutation } from '@/hooks/useTRPCMutation'
import { api } from '@/utils/api'
import { ProfessorProjetoListItem, Semestre, ProjetoStatus } from '@/types'
import type { ProjectListItemData } from '@/types'

export function useProjectList() {
  const { user } = useAuth()
  const [selectedProjeto, setSelectedProjeto] = useState<ProfessorProjetoListItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [loadingPdfProjetoId, setLoadingPdfProjetoId] = useState<number | null>(null)

  const { data: projetosData } = api.projeto.getProjetos.useQuery()
  const getProjetoPdfMutation = useTRPCMutation(api.file.getProjetoPdfUrl.useMutation, {
    successMessage: 'PDF aberto em nova aba',
    errorMessage: 'Não foi possível abrir o documento para visualização.',
  })

  const projetos: ProfessorProjetoListItem[] =
    projetosData
      ?.filter((projeto) => projeto.professorResponsavelId === user?.id)
      .map((projeto: ProjectListItemData & { editalNumero?: string | null; editalPublicado?: boolean }) => ({
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        departamento: {
          id: projeto.departamentoId,
          nome: projeto.departamentoNome,
        },
        ano: projeto.ano,
        semestre: projeto.semestre as Semestre,
        tipoProposicao: projeto.tipoProposicao as 'NOVO' | 'CONTINUACAO',
        status: projeto.status as ProjetoStatus,
        bolsasSolicitadas: projeto.bolsasSolicitadas,
        voluntariosSolicitados: projeto.voluntariosSolicitados,
        inscricoes: projeto.totalInscritos,
        bolsasAlocadas: projeto.bolsasDisponibilizadas || 0,
        voluntariosAlocados: 0,
        cargaHorariaSemana: projeto.cargaHorariaSemana,
        numeroSemanas: projeto.numeroSemanas,
        publicoAlvo: projeto.publicoAlvo,
        estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas || 0,
        disciplinas: projeto.disciplinas.map((d) => ({ id: d.id, nome: d.nome })),
        assinaturaProfessor: projeto.assinaturaProfessor || undefined,
        editalNumero: projeto.editalNumero,
        editalPublicado: projeto.editalPublicado,
        criadoEm: projeto.createdAt.toISOString(),
        atualizadoEm: projeto.updatedAt?.toISOString() || projeto.createdAt.toISOString(),
      })) || []

  const handleViewProjeto = (projeto: ProfessorProjetoListItem) => {
    setSelectedProjeto(projeto)
    setIsDetailDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDetailDialogOpen(false)
  }

  const handleViewPdf = async (projetoId: number) => {
    setLoadingPdfProjetoId(projetoId)
    try {
      const result = await getProjetoPdfMutation.mutateAsync({
        projetoId: projetoId,
      })
      if (result && typeof result === 'object' && 'url' in result && typeof result.url === 'string') {
        window.open(result.url, '_blank')
      }
    } catch (error) {
      console.error('View PDF error:', error)
    } finally {
      setLoadingPdfProjetoId(null)
    }
  }

  return {
    projetos,
    selectedProjeto,
    isDetailDialogOpen,
    loadingPdfProjetoId,
    handlers: {
      handleViewProjeto,
      handleCloseDialog,
      handleViewPdf,
    },
  }
}
