'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { type ColumnDef } from '@tanstack/react-table'
import { Building2, Cog, Mail, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

type DepartamentoEmail = {
  id: number
  nome: string
  sigla: string | null
  emailInstituto: string | null
}

export default function ConfiguracoesEmailPage() {
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<DepartamentoEmail | null>(null)
  const [deptEmail, setDeptEmail] = useState('')
  const [deptNome, setDeptNome] = useState('')
  const [deptSigla, setDeptSigla] = useState('')
  const [editError, setEditError] = useState('')
  const [emailIC, setEmailIC] = useState('')
  const [newSetorNome, setNewSetorNome] = useState('')
  const [newSetorSigla, setNewSetorSigla] = useState('')
  const [newSetorEmail, setNewSetorEmail] = useState('')
  const [createError, setCreateError] = useState('')

  const { data: departamentos, isLoading } = api.configuracoes.getDepartamentos.useQuery()
  const { data: emailICData, isLoading: isLoadingEmailIC } = api.configuracoes.getEmailIC.useQuery()
  const apiUtils = api.useUtils()

  useEffect(() => {
    if (emailICData !== undefined) {
      setEmailIC(emailICData || '')
    }
  }, [emailICData])

  const updateDeptEmailMutation = api.configuracoes.updateDepartamentoEmail.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getDepartamentos.invalidate()
    },
  })

  const setEmailICMutation = api.configuracoes.setEmailIC.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getEmailIC.invalidate()
    },
  })

  const createDepartamentoMutation = api.configuracoes.createDepartamento.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getDepartamentos.invalidate()
    },
  })

  const updateDepartamentoMutation = api.configuracoes.updateDepartamento.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getDepartamentos.invalidate()
    },
  })

  const deleteDepartamentoMutation = api.configuracoes.deleteDepartamento.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getDepartamentos.invalidate()
    },
  })

  const handleEdit = (departamento: DepartamentoEmail) => {
    setSelectedDept(departamento)
    setDeptNome(departamento.nome)
    setDeptSigla(departamento.sigla || '')
    setDeptEmail(departamento.emailInstituto || '')
    setEditError('')
    setIsEditDialogOpen(true)
  }

  const handleUpdateDept = async () => {
    if (!selectedDept) return
    setEditError('')

    if (!deptNome.trim()) {
      setEditError('Nome é obrigatório.')
      return
    }

    if (deptEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deptEmail)) {
      setEditError('Email inválido. Use o formato: exemplo@dominio.com')
      return
    }

    try {
      await updateDepartamentoMutation.mutateAsync({
        departamentoId: selectedDept.id,
        nome: deptNome.trim(),
        sigla: deptSigla.trim() || null,
        email: deptEmail.trim() || null,
      })

      toast({
        title: 'Sucesso!',
        description: `Setor "${deptNome.trim()}" atualizado.`,
      })

      setIsEditDialogOpen(false)
      setSelectedDept(null)
    } catch (error: any) {
      console.error('Erro ao atualizar setor:', error)
      const message = error?.data?.zodError?.fieldErrors?.nome?.[0]
        || error?.data?.zodError?.fieldErrors?.email?.[0]
        || error?.message
        || 'Não foi possível atualizar o setor.'
      setEditError(message)
    }
  }

  const handleDeleteDept = async () => {
    if (!selectedDept) return

    try {
      await deleteDepartamentoMutation.mutateAsync({
        departamentoId: selectedDept.id,
      })

      toast({
        title: 'Sucesso!',
        description: `Setor "${selectedDept.nome}" removido.`,
      })

      setIsEditDialogOpen(false)
      setSelectedDept(null)
    } catch (error: any) {
      console.error('Erro ao deletar setor:', error)
      setEditError(error?.message || 'Não foi possível remover o setor. Ele pode estar vinculado a outros registros.')
    }
  }

  const handleSaveEmailIC = async () => {
    try {
      await setEmailICMutation.mutateAsync({ email: emailIC || null })
      toast({
        title: 'Sucesso!',
        description: 'Email do Instituto de Computação atualizado.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível atualizar o email.',
        variant: 'destructive',
      })
    }
  }

  const handleCreateSetor = async () => {
    setCreateError('')

    if (!newSetorNome.trim()) {
      setCreateError('Nome é obrigatório.')
      return
    }

    if (newSetorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSetorEmail)) {
      setCreateError('Email inválido. Use o formato: exemplo@dominio.com')
      return
    }

    try {
      await createDepartamentoMutation.mutateAsync({
        nome: newSetorNome.trim(),
        sigla: newSetorSigla.trim() || null,
        email: newSetorEmail.trim() || null,
      })

      toast({
        title: 'Sucesso!',
        description: `Setor "${newSetorNome.trim()}" criado.`,
      })

      setIsCreateDialogOpen(false)
      setNewSetorNome('')
      setNewSetorSigla('')
      setNewSetorEmail('')
      setCreateError('')
    } catch (error: any) {
      console.error('Erro ao criar setor:', error)
      const message = error?.data?.zodError?.fieldErrors?.nome?.[0]
        || error?.data?.zodError?.fieldErrors?.email?.[0]
        || error?.message
        || 'Não foi possível criar o setor.'
      setCreateError(message)
    }
  }

  const columns: ColumnDef<DepartamentoEmail>[] = [
    {
      accessorKey: 'nome',
      header: 'Setor',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          <div className="text-sm text-muted-foreground">{row.original.sigla}</div>
        </div>
      ),
    },
    {
      accessorKey: 'emailInstituto',
      header: 'Email',
      cell: ({ row }) => (
        <span className={row.original.emailInstituto ? '' : 'text-muted-foreground'}>
          {row.original.emailInstituto || 'Não definido'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Editar">
          <Cog className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <PagesLayout
      title="Configuração de Emails"
      subtitle="Configure os emails para envio da planilha PROGRAD"
    >
      <div className="space-y-6">
        {/* Email IC (global) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Instituto de Computação
            </CardTitle>
            <CardDescription>
              Email institucional do IC para receber a planilha de projetos aprovados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="email-ic">Email do IC</Label>
                <Input
                  id="email-ic"
                  type="email"
                  value={emailIC}
                  onChange={(e) => setEmailIC(e.target.value)}
                  placeholder="ic@ufba.br"
                  disabled={isLoadingEmailIC}
                />
              </div>
              <Button onClick={handleSaveEmailIC} disabled={setEmailICMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {setEmailICMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emails por Departamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Emails
              </CardTitle>
              <CardDescription>
                Email de cada setor para receber a planilha correspondente
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Setor
            </Button>
          </CardHeader>
          <CardContent>
            <TableComponent
              columns={columns}
              data={departamentos || []}
              searchableColumn="nome"
              searchPlaceholder="Buscar por nome do setor..."
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
            <DialogDescription>
              Atualize as informações do setor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editError && (
              <p className="text-sm text-red-500 font-medium">{editError}</p>
            )}
            <div>
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={deptNome}
                onChange={(e) => setDeptNome(e.target.value)}
                placeholder="Ex: Departamento de Ciência da Computação"
              />
            </div>
            <div>
              <Label htmlFor="edit-sigla">Sigla</Label>
              <Input
                id="edit-sigla"
                value={deptSigla}
                onChange={(e) => setDeptSigla(e.target.value)}
                placeholder="Ex: DCC"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={deptEmail}
                onChange={(e) => setDeptEmail(e.target.value)}
                placeholder="Ex: setor@ufba.br"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteDept}
              disabled={deleteDepartamentoMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteDepartamentoMutation.isPending ? 'Removendo...' : 'Remover'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDept} disabled={updateDepartamentoMutation.isPending}>
                {updateDepartamentoMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Setor</DialogTitle>
            <DialogDescription>
              Crie um novo setor para configurar o email de recebimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {createError && (
              <p className="text-sm text-red-500 font-medium">{createError}</p>
            )}
            <div>
              <Label htmlFor="setor-nome">Nome *</Label>
              <Input
                id="setor-nome"
                value={newSetorNome}
                onChange={(e) => setNewSetorNome(e.target.value)}
                placeholder="Ex: Departamento de Ciência da Computação"
              />
            </div>
            <div>
              <Label htmlFor="setor-sigla">Sigla</Label>
              <Input
                id="setor-sigla"
                value={newSetorSigla}
                onChange={(e) => setNewSetorSigla(e.target.value)}
                placeholder="Ex: DCC"
              />
            </div>
            <div>
              <Label htmlFor="setor-email">Email</Label>
              <Input
                id="setor-email"
                value={newSetorEmail}
                onChange={(e) => setNewSetorEmail(e.target.value)}
                placeholder="Ex: setor@ufba.br"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSetor} disabled={createDepartamentoMutation.isPending}>
              {createDepartamentoMutation.isPending ? 'Criando...' : 'Criar Setor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
