'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Check, 
  X,
  ArrowLeft,
  Users,
  FileText,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DisciplineAssociation {
  id: number
  codigo: string
  nome: string
  departamentoId: number
  isAssociated: boolean
  ano?: number
  semestre?: 'SEMESTRE_1' | 'SEMESTRE_2'
}

export default function ManageDisciplinasPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newDisciplina, setNewDisciplina] = useState({
    nome: '',
    codigo: '',
    cargaHoraria: 60,
    periodo: 1,
  })

  const currentYear = new Date().getFullYear()
  const currentSemester = new Date().getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2' as 'SEMESTRE_1' | 'SEMESTRE_2'

  const { data: professorDisciplinas, isLoading: loadingProfessorDisciplinas, refetch: refetchProfessorDisciplinas } = 
    api.discipline.getProfessorDisciplines.useQuery(undefined)

  const { data: departmentDisciplinas, isLoading: loadingDepartmentDisciplinas, refetch: refetchDepartmentDisciplinas } = 
    api.discipline.getDepartmentDisciplines.useQuery(undefined)

  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({})
  const { data: userProfile } = api.user.getProfile.useQuery()

  const createDisciplinaMutation = api.discipline.create.useMutation()
  const associateMutation = api.discipline.associateDiscipline.useMutation()
  const disassociateMutation = api.discipline.disassociateDiscipline.useMutation()

  const professorDepartamento = userProfile?.professorProfile?.departamentoId
  const departamentoInfo = departamentos?.find(d => d.id === professorDepartamento)

  const handleCreateDisciplina = async () => {
    if (!newDisciplina.nome || !newDisciplina.codigo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e código da disciplina',
        variant: 'destructive',
      })
      return
    }

    if (!professorDepartamento) {
      toast({
        title: 'Erro',
        description: 'Departamento do professor não encontrado',
        variant: 'destructive',
      })
      return
    }

    try {
      const disciplina = await createDisciplinaMutation.mutateAsync({
        nome: newDisciplina.nome,
        codigo: newDisciplina.codigo,
        departamentoId: professorDepartamento,
      })

      await associateMutation.mutateAsync({
        id: disciplina.id,
        ano: currentYear,
        semestre: currentSemester,
      })

      setNewDisciplina({ nome: '', codigo: '', cargaHoraria: 60, periodo: 1 })
      setShowCreateForm(false)
      
      toast({
        title: 'Sucesso',
        description: 'Disciplina criada e associada com sucesso!',
      })

      await Promise.all([
        refetchProfessorDisciplinas(),
        refetchDepartmentDisciplinas(),
      ])
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar disciplina',
        variant: 'destructive',
      })
    }
  }

  const handleToggleAssociation = async (disciplina: DisciplineAssociation) => {
    try {
      if (disciplina.isAssociated) {
        await disassociateMutation.mutateAsync({
          id: disciplina.id,
          ano: currentYear,
          semestre: currentSemester,
        })
        
        toast({
          title: 'Sucesso',
          description: `Desassociado da disciplina ${disciplina.codigo}`,
        })
      } else {
        await associateMutation.mutateAsync({
          id: disciplina.id,
          ano: currentYear,
          semestre: currentSemester,
        })
        
        toast({
          title: 'Sucesso',
          description: `Associado à disciplina ${disciplina.codigo}`,
        })
      }

      await Promise.all([
        refetchProfessorDisciplinas(),
        refetchDepartmentDisciplinas(),
      ])
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar associação',
        variant: 'destructive',
      })
    }
  }

  const handleBackToDashboard = () => {
    router.push('/home/professor/dashboard')
  }

  if (loadingProfessorDisciplinas || loadingDepartmentDisciplinas) {
    return (
      <PagesLayout title="Gerenciar Disciplinas" subtitle="Carregando...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title="Gerenciar Disciplinas"
      subtitle={`Gerencie suas disciplinas para ${currentYear}.${currentSemester === 'SEMESTRE_1' ? '1' : '2'}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Período: {currentYear}.{currentSemester === 'SEMESTRE_1' ? '1' : '2'}
            </div>
            {departamentoInfo && (
              <Badge variant="outline">
                {departamentoInfo.sigla || departamentoInfo.nome}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Minhas Disciplinas Atuais
                {professorDisciplinas && (
                  <Badge variant="outline" className="ml-2">
                    {professorDisciplinas.length} disciplina(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!professorDisciplinas?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    Nenhuma disciplina associada
                  </h3>
                  <p className="text-sm">
                    Associe-se a disciplinas existentes ou crie novas disciplinas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {professorDisciplinas.map((disciplina) => (
                    <div
                      key={disciplina.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
                    >
                      <div>
                        <div className="font-medium">{disciplina.codigo}</div>
                        <div className="text-sm text-muted-foreground">
                          {disciplina.nome}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {disciplina.projetosAtivos} projeto(s)
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {disciplina.monitoresAtivos} bolsista(s)
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {disciplina.voluntariosAtivos} voluntário(s)
                          </div>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Associado
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Nova Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showCreateForm ? (
                <div className="text-center py-8">
                  <Button onClick={() => setShowCreateForm(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Disciplina
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Crie uma nova disciplina e associe-se automaticamente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="codigo">Código da Disciplina</Label>
                    <Input
                      id="codigo"
                      placeholder="Ex: MAT001"
                      value={newDisciplina.codigo}
                      onChange={(e) =>
                        setNewDisciplina({ ...newDisciplina, codigo: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="nome">Nome da Disciplina</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Cálculo Diferencial e Integral I"
                      value={newDisciplina.nome}
                      onChange={(e) =>
                        setNewDisciplina({ ...newDisciplina, nome: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewDisciplina({ nome: '', codigo: '', cargaHoraria: 60, periodo: 1 })
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateDisciplina}
                      disabled={createDisciplinaMutation.isPending}
                      className="flex-1"
                    >
                      {createDisciplinaMutation.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Disciplinas do Departamento
              {departmentDisciplinas && (
                <Badge variant="outline" className="ml-2">
                  {departmentDisciplinas.length} disponível(is)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!departmentDisciplinas?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhuma disciplina encontrada
                </h3>
                <p className="text-sm">
                  Não há disciplinas cadastradas no seu departamento
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentDisciplinas.map((disciplina) => (
                  <div
                    key={disciplina.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      disciplina.isAssociated
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{disciplina.codigo}</div>
                      <div className="text-sm text-muted-foreground">
                        {disciplina.nome}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {disciplina.isAssociated ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Associado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          Não associado
                        </Badge>
                      )}
                      
                      <Checkbox
                        checked={disciplina.isAssociated}
                        onCheckedChange={() => handleToggleAssociation(disciplina)}
                        disabled={
                          associateMutation.isPending ||
                          disassociateMutation.isPending
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">
                  Como funciona o gerenciamento de disciplinas
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Disciplinas Atuais:</strong> Disciplinas às quais você está associado neste semestre</li>
                  <li>• <strong>Criar Nova:</strong> Crie disciplinas do seu departamento e associe-se automaticamente</li>
                  <li>• <strong>Associar/Desassociar:</strong> Use os checkboxes para gerenciar suas associações</li>
                  <li>• <strong>Período:</strong> As associações são específicas para o ano/semestre atual</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
} 