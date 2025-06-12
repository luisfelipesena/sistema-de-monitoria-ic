'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { 
  Eye, 
  Mail, 
  Plus, 
  UserCheck, 
  UserX,
  Edit,
  Trash2,
  Users
} from 'lucide-react'
import { useState } from 'react'

interface Professor {
  id: number
  nomeCompleto: string
  emailInstitucional: string
  matriculaSiape?: string
  telefone?: string
  regime?: '20H' | '40H' | 'DE'
  departamento: {
    id: number
    nome: string
  }
  status: 'ATIVO' | 'INATIVO' | 'PENDENTE'
  projetos?: number
  criadoEm: string
}

export default function ProfessoresPage() {
  const { toast } = useToast()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    nomeCompleto: '',
    departamentoId: '',
    regime: '' as '20H' | '40H' | 'DE' | '',
    mensagem: '',
  })

  // Fetch professors data
  const { data: usersData, isLoading } = api.user.getUsers.useQuery({
    role: 'professor',
    limit: 100,
  })
  
  const { data: departamentosData } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const inviteProfessorMutation = api.inviteProfessor.sendInvitation.useMutation()
  
  const departamentos = departamentosData || []
  
  const professores: Professor[] = usersData?.users
    .filter(user => user.professorProfile)
    .map(user => ({
      id: user.id,
      nomeCompleto: user.professorProfile!.nomeCompleto,
      emailInstitucional: user.professorProfile!.emailInstitucional,
      matriculaSiape: user.professorProfile!.matriculaSiape || undefined,
      telefone: user.professorProfile!.telefone || undefined,
      regime: user.professorProfile!.regime,
      departamento: {
        id: user.professorProfile!.departamentoId,
        nome: departamentos.find(d => d.id === user.professorProfile!.departamentoId)?.nome || 'N/A'
      },
      status: (user.professorProfile!.projetos && user.professorProfile!.projetos > 0) ? 'ATIVO' : 'INATIVO' as const,
      projetos: user.professorProfile!.projetos || 0,
      criadoEm: user.createdAt?.toISOString() || new Date().toISOString(),
    })) || []

  const handleInviteProfessor = async () => {
    try {
      if (!inviteForm.email || !inviteForm.nomeCompleto || !inviteForm.departamentoId || !inviteForm.regime) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha todos os campos obrigatórios',
          variant: 'destructive',
        })
        return
      }

      await inviteProfessorMutation.mutateAsync({
        email: inviteForm.email,
      })

      toast({
        title: 'Convite enviado',
        description: `Convite enviado para ${inviteForm.email}`,
      })

      setIsInviteDialogOpen(false)
      setInviteForm({
        email: '',
        nomeCompleto: '',
        departamentoId: '',
        regime: '',
        mensagem: '',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar convite',
        description: error.message || 'Não foi possível enviar o convite',
        variant: 'destructive',
      })
    }
  }

  const handleViewProfessor = (professor: Professor) => {
    setSelectedProfessor(professor)
    setIsDetailDialogOpen(true)
  }

  const handleToggleStatus = async (professorId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO'
      
      // This would use actual tRPC mutation when implemented
      // await updateProfessorStatusMutation.mutateAsync({ id: professorId, status: newStatus })

      toast({
        title: 'Status atualizado',
        description: `Professor ${newStatus === 'ATIVO' ? 'ativado' : 'desativado'} com sucesso`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Não foi possível atualizar o status',
        variant: 'destructive',
      })
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'INATIVO':
        return <Badge variant="destructive">Inativo</Badge>
      case 'PENDENTE':
        return <Badge variant="secondary">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: ColumnDef<Professor>[] = [
    {
      accessorKey: 'nomeCompleto',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.nomeCompleto}
        </div>
      ),
    },
    {
      accessorKey: 'emailInstitucional',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.emailInstitucional}
        </div>
      ),
    },
    {
      accessorKey: 'departamento.nome',
      header: 'Departamento',
    },
    {
      accessorKey: 'regime',
      header: 'Regime',
      cell: ({ row }) => (
        <div>
          {row.original.regime ? (
            <Badge variant="outline">{row.original.regime}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'projetos',
      header: 'Projetos',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.projetos || 0}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      accessorKey: 'criadoEm',
      header: 'Cadastrado em',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.criadoEm), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const professor = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewProfessor(professor)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              variant={professor.status === 'ATIVO' ? 'destructive' : 'default'}
              size="sm"
              onClick={() => handleToggleStatus(professor.id, professor.status)}
            >
              {professor.status === 'ATIVO' ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <PagesLayout 
      title="Gerenciamento de Professores" 
      subtitle="Gerencie professores e envie convites"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Professores
                  </p>
                  <div className="text-2xl font-bold">{professores.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <UserCheck className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ativos
                  </p>
                  <div className="text-2xl font-bold text-green-600">
                    {professores.filter(p => p.status === 'ATIVO').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </p>
                  <div className="text-2xl font-bold text-yellow-600">
                    {professores.filter(p => p.status === 'PENDENTE').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <UserX className="h-4 w-4 text-red-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Inativos
                  </p>
                  <div className="text-2xl font-bold text-red-600">
                    {professores.filter(p => p.status === 'INATIVO').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Professores</h2>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Convidar Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Convidar Novo Professor</DialogTitle>
                <DialogDescription>
                  Envie um convite para um professor se juntar à plataforma
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Institucional *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="professor@ufba.br"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                    <Input
                      id="nomeCompleto"
                      value={inviteForm.nomeCompleto}
                      onChange={(e) => setInviteForm({ ...inviteForm, nomeCompleto: e.target.value })}
                      placeholder="Nome do professor"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departamento">Departamento *</Label>
                    <Select
                      value={inviteForm.departamentoId}
                      onValueChange={(value) => setInviteForm({ ...inviteForm, departamentoId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map((dep) => (
                          <SelectItem key={dep.id} value={dep.id.toString()}>
                            {dep.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="regime">Regime de Trabalho *</Label>
                    <Select
                      value={inviteForm.regime}
                      onValueChange={(value: '20H' | '40H' | 'DE') => setInviteForm({ ...inviteForm, regime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20H">20 horas</SelectItem>
                        <SelectItem value="40H">40 horas</SelectItem>
                        <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="mensagem">Mensagem Personalizada (Opcional)</Label>
                  <Textarea
                    id="mensagem"
                    value={inviteForm.mensagem}
                    onChange={(e) => setInviteForm({ ...inviteForm, mensagem: e.target.value })}
                    placeholder="Adicione uma mensagem personalizada ao convite..."
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleInviteProfessor}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Professors Table */}
        <Card>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={professores}
              searchableColumn="nomeCompleto"
              searchPlaceholder="Buscar por nome do professor..."
            />
          </CardContent>
        </Card>

        {/* Professor Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Professor</DialogTitle>
            </DialogHeader>
            
            {selectedProfessor && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Nome Completo
                    </Label>
                    <p className="text-sm">{selectedProfessor.nomeCompleto}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Email Institucional
                    </Label>
                    <p className="text-sm">{selectedProfessor.emailInstitucional}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Matrícula SIAPE
                    </Label>
                    <p className="text-sm">{selectedProfessor.matriculaSiape || '-'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Telefone
                    </Label>
                    <p className="text-sm">{selectedProfessor.telefone || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Departamento
                    </Label>
                    <p className="text-sm">{selectedProfessor.departamento.nome}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Regime de Trabalho
                    </Label>
                    <p className="text-sm">{selectedProfessor.regime || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <div>{renderStatusBadge(selectedProfessor.status)}</div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Projetos Ativos
                    </Label>
                    <p className="text-sm">{selectedProfessor.projetos || 0}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Cadastrado em
                  </Label>
                  <p className="text-sm">
                    {format(new Date(selectedProfessor.criadoEm), 'dd/MM/yyyy \'às\' HH:mm')}
                  </p>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}