import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { ProjectDetailSection, Field } from './ProjectDetailSection'
import { ProfessorProjetoListItem, Semestre, getSemestreNumero } from '@/types'
import { format } from 'date-fns'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface ProjectDetailDialogProps {
  projeto: ProfessorProjetoListItem | null
  isOpen: boolean
  onClose: () => void
}

const renderTipoProposicaoBadge = (tipo: string) => {
  switch (tipo) {
    case 'NOVO':
      return <Badge className="bg-blue-100 text-blue-800">Novo</Badge>
    case 'CONTINUACAO':
      return <Badge className="bg-purple-100 text-purple-800">Continuação</Badge>
    default:
      return <Badge variant="outline">{tipo}</Badge>
  }
}

export function ProjectDetailDialog({ projeto, isOpen, onClose }: ProjectDetailDialogProps) {
  if (!projeto) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Projeto</DialogTitle>
          <DialogDescription>Informações completas do projeto de monitoria</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto">
          <ProjectDetailSection title="Informações Básicas">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Título" value={projeto.titulo} />
              <Field label="Departamento" value={projeto.departamento.nome} />
              <Field
                label="Período"
                value={`${projeto.ano}.${getSemestreNumero(projeto.semestre as Semestre)}`}
              />
              <Field label="Tipo" value={renderTipoProposicaoBadge(projeto.tipoProposicao)} />
              <Field label="Status" value={<StatusBadge status={projeto.status} showIcon />} />
            </div>
            <div className="mt-4">
              <Field label="Descrição" value={projeto.descricao} />
            </div>
          </ProjectDetailSection>

          <Separator />

          <ProjectDetailSection title="Vagas e Inscrições">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bolsas Solicitadas" value={projeto.bolsasSolicitadas} />
              <Field label="Voluntários Solicitados" value={projeto.voluntariosSolicitados} />
              <Field label="Total de Inscrições" value={projeto.inscricoes} />
              <Field label="Bolsas Alocadas" value={`${projeto.bolsasAlocadas}/${projeto.bolsasSolicitadas}`} />
            </div>
          </ProjectDetailSection>

          <Separator />

          <ProjectDetailSection title="Detalhes do Projeto">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Carga Horária Semanal" value={`${projeto.cargaHorariaSemana} horas`} />
              <Field label="Número de Semanas" value={`${projeto.numeroSemanas} semanas`} />
              <Field label="Público Alvo" value={projeto.publicoAlvo} />
              <Field label="Pessoas Beneficiadas (Estimativa)" value={projeto.estimativaPessoasBenificiadas} />
            </div>
          </ProjectDetailSection>

          <Separator />

          <ProjectDetailSection title="Disciplinas">
            <div className="flex flex-wrap gap-2">
              {projeto.disciplinas.map((disciplina) => (
                <Badge key={disciplina.id} variant="outline">
                  {disciplina.nome}
                </Badge>
              ))}
            </div>
          </ProjectDetailSection>

          <Separator />

          <ProjectDetailSection title="Assinaturas">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Assinatura do Professor"
                value={
                  projeto.assinaturaProfessor ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Assinado
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  )
                }
              />
            </div>
          </ProjectDetailSection>

          <Separator />

          <ProjectDetailSection title="Histórico">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Criado em" value={format(new Date(projeto.criadoEm), "dd/MM/yyyy 'às' HH:mm")} />
              <Field
                label="Última atualização"
                value={format(new Date(projeto.atualizadoEm), "dd/MM/yyyy 'às' HH:mm")}
              />
            </div>
          </ProjectDetailSection>
        </div>
      </DialogContent>
    </Dialog>
  )
}
