'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/utils/api'
import { ColumnDef } from '@tanstack/react-table'
import { GraduationCap, Users, Award, Plus, Eye } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type ProjetoListItem = {
  id: number
  titulo: string
  departamentoNome: string
  professorResponsavelNome: string
  disciplinas: Array<{ codigo: string; nome: string }>
  bolsasDisponibilizadas: number
  voluntariosSolicitados: number
  totalInscritos: number
  inscricaoAberta: boolean
  jaInscrito: boolean
}

export default function InscricaoMonitoriaPage() {
  const [inscricaoOpen, setInscricaoOpen] = useState(false)
  const [projetoSelecionado, setProjetoSelecionado] = useState<ProjetoListItem | null>(null)
  const [tipoInscricao, setTipoInscricao] = useState<'BOLSISTA' | 'VOLUNTARIO'>('BOLSISTA')
  const [motivacao, setMotivacao] = useState('')

  const { data: projetos, isLoading, refetch } = api.projeto.getAvailableProjects.useQuery()
  const inscricaoMutation = api.inscricao.createInscricao.useMutation({
    onSuccess: () => {
      toast.success('Inscrição realizada com sucesso!')
      setInscricaoOpen(false)
      setMotivacao('')
      refetch()
    },
    onError: (error) => {
      let errorMessage = error.message
      
      // Handle specific error cases for better user experience
      if (error.message.includes('Período de inscrições não está ativo')) {
        errorMessage = 'As inscrições para este projeto não estão abertas no momento.'
      } else if (error.message.includes('já se inscreveu neste projeto')) {
        errorMessage = 'Você já possui uma inscrição ativa para este projeto.'
      } else if (error.message.includes('Perfil de estudante não encontrado')) {
        errorMessage = 'Complete seu perfil de estudante antes de se inscrever em projetos.'
      } else if (error.message.includes('Motivação deve ter pelo menos')) {
        errorMessage = 'A motivação deve ter pelo menos 10 caracteres.'
      } else if (error.message.includes('não encontrado ou não aprovado')) {
        errorMessage = 'Este projeto não está mais disponível para inscrições.'
      }
      
      toast.error(errorMessage)
    },
  })

  const handleInscricao = (projeto: ProjetoListItem) => {
    setProjetoSelecionado(projeto)
    setInscricaoOpen(true)
  }

  const handleSubmitInscricao = () => {
    if (!projetoSelecionado) {
      toast.error('Nenhum projeto selecionado')
      return
    }

    if (!motivacao.trim()) {
      toast.error('Preencha sua motivação para participar do projeto')
      return
    }

    if (motivacao.trim().length < 10) {
      toast.error('A motivação deve ter pelo menos 10 caracteres')
      return
    }

    // Check if inscriptions are still open
    if (!projetoSelecionado.inscricaoAberta) {
      toast.error('As inscrições para este projeto não estão mais abertas')
      return
    }

    // Check if already enrolled
    if (projetoSelecionado.jaInscrito) {
      toast.error('Você já possui uma inscrição ativa para este projeto')
      return
    }

    inscricaoMutation.mutate({
      projetoId: projetoSelecionado.id,
      tipo: tipoInscricao,
      motivacao: motivacao.trim(),
    })
  }

  const getStatusBadge = (projeto: ProjetoListItem) => {
    if (projeto.jaInscrito) {
      return <Badge variant="default" className="bg-green-500">Inscrito</Badge>
    }
    if (!projeto.inscricaoAberta) {
      return <Badge variant="secondary">Inscrições Fechadas</Badge>
    }
    return <Badge variant="outline" className="border-green-500 text-green-700">Inscrições Abertas</Badge>
  }

  const columns: ColumnDef<ProjetoListItem>[] = [
    {
      header: 'Projeto',
      accessorKey: 'titulo',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.disciplinas[0]?.codigo} - {row.original.professorResponsavelNome}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.departamentoNome}
          </div>
        </div>
      ),
    },
    {
      header: 'Vagas',
      id: 'vagas',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Award className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">{row.original.bolsasDisponibilizadas} bolsa(s)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{row.original.voluntariosSolicitados} voluntário(s)</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Inscritos',
      accessorKey: 'totalInscritos',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-lg font-bold">{row.original.totalInscritos}</span>
          <div className="text-xs text-muted-foreground">candidatos</div>
        </div>
      ),
    },
    {
      header: 'Status',
      id: 'status',
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      header: 'Ações',
      id: 'actions',
      cell: ({ row }) => {
        const projeto = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implementar visualização do projeto */}}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>
            {!projeto.jaInscrito && projeto.inscricaoAberta && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleInscricao(projeto)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Inscrever-se
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <PagesLayout 
      title="Inscrição em Monitoria" 
      subtitle="Inscreva-se em projetos de monitoria disponíveis"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Projetos Disponíveis
            {projetos && (
              <Badge variant="outline" className="ml-2">
                {projetos.length} projeto(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2">Carregando projetos disponíveis...</p>
              </div>
            </div>
          ) : projetos && projetos.length > 0 ? (
            <TableComponent
              columns={columns}
              data={projetos}
              searchableColumn="titulo"
              searchPlaceholder="Buscar por projeto ou disciplina..."
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum projeto disponível
              </h3>
              <p>
                Não há projetos de monitoria com inscrições abertas no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Inscrição */}
      <Dialog open={inscricaoOpen} onOpenChange={setInscricaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrição em Monitoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {projetoSelecionado && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{projetoSelecionado.titulo}</h4>
                <p className="text-sm text-muted-foreground">
                  {projetoSelecionado.disciplinas[0]?.codigo} - {projetoSelecionado.professorResponsavelNome}
                </p>
              </div>
            )}

            <div>
              <Label>Tipo de Monitoria</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value="BOLSISTA"
                    checked={tipoInscricao === 'BOLSISTA'}
                    onChange={(e) => setTipoInscricao(e.target.value as 'BOLSISTA')}
                  />
                  <span>Bolsista</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value="VOLUNTARIO"
                    checked={tipoInscricao === 'VOLUNTARIO'}
                    onChange={(e) => setTipoInscricao(e.target.value as 'VOLUNTARIO')}
                  />
                  <span>Voluntário</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="motivacao">Motivação *</Label>
                <span className={`text-xs ${motivacao.length >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                  {motivacao.length}/10 min
                </span>
              </div>
              <Textarea
                id="motivacao"
                value={motivacao}
                onChange={(e) => setMotivacao(e.target.value)}
                placeholder="Descreva sua motivação para participar deste projeto de monitoria..."
                rows={4}
                className={motivacao.length > 0 && motivacao.length < 10 ? 'border-red-300' : ''}
              />
              {motivacao.length > 0 && motivacao.length < 10 && (
                <p className="text-xs text-red-600 mt-1">
                  A motivação deve ter pelo menos 10 caracteres
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSubmitInscricao} 
                disabled={
                  inscricaoMutation.isPending || 
                  !motivacao.trim() || 
                  motivacao.trim().length < 10 ||
                  !projetoSelecionado?.inscricaoAberta ||
                  projetoSelecionado?.jaInscrito
                }
                className="flex-1"
              >
                {inscricaoMutation.isPending ? 'Inscrevendo...' : 'Confirmar Inscrição'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setInscricaoOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}