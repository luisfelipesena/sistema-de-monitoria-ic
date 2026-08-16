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

type EmailNotificacao = {
  id: number
  nome: string
  email: string
  descricao: string | null
}

export default function ConfiguracoesEmailPage() {
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailNotificacao | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editError, setEditError] = useState('')
  const [emailIC, setEmailIC] = useState('')
  const [newNome, setNewNome] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [createError, setCreateError] = useState('')

  const { data: emailsNotificacao, isLoading } = api.configuracoes.getEmailsNotificacao.useQuery()
  const { data: emailICData, isLoading: isLoadingEmailIC } = api.configuracoes.getEmailIC.useQuery()
  const apiUtils = api.useUtils()

  useEffect(() => {
    if (emailICData !== undefined) {
      setEmailIC(emailICData || '')
    }
  }, [emailICData])

  const setEmailICMutation = api.configuracoes.setEmailIC.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getEmailIC.invalidate()
    },
  })

  const createEmailMutation = api.configuracoes.createEmailNotificacao.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getEmailsNotificacao.invalidate()
    },
  })

  const updateEmailMutation = api.configuracoes.updateEmailNotificacao.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getEmailsNotificacao.invalidate()
    },
  })

  const deleteEmailMutation = api.configuracoes.deleteEmailNotificacao.useMutation({
    onSuccess: () => {
      apiUtils.configuracoes.getEmailsNotificacao.invalidate()
    },
  })

  const handleEdit = (item: EmailNotificacao) => {
    setSelectedEmail(item)
    setEditNome(item.nome)
    setEditEmail(item.email)
    setEditError('')
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedEmail) return
    setEditError('')

    if (!editNome.trim()) {
      setEditError('Nome é obrigatório.')
      return
    }

    if (!editEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      setEditError('Email inválido. Use o formato: exemplo@dominio.com')
      return
    }

    try {
      await updateEmailMutation.mutateAsync({
        id: selectedEmail.id,
        nome: editNome.trim(),
        email: editEmail.trim(),
      })

      toast({
        title: 'Sucesso!',
        description: `Email "${editNome.trim()}" atualizado.`,
      })

      setIsEditDialogOpen(false)
      setSelectedEmail(null)
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error)
      const message = error?.data?.zodError?.fieldErrors?.nome?.[0]
        || error?.data?.zodError?.fieldErrors?.email?.[0]
        || error?.message
        || 'Não foi possível atualizar o email.'
      setEditError(message)
    }
  }

  const handleDelete = async () => {
    if (!selectedEmail) return

    try {
      await deleteEmailMutation.mutateAsync({
        id: selectedEmail.id,
      })

      toast({
        title: 'Sucesso!',
        description: `Email "${selectedEmail.nome}" removido.`,
      })

      setIsEditDialogOpen(false)
      setSelectedEmail(null)
    } catch (error: any) {
      console.error('Erro ao deletar email:', error)
      setEditError(error?.message || 'Não foi possível remover o email.')
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

  const handleCreate = async () => {
    setCreateError('')

    if (!newNome.trim()) {
      setCreateError('Nome é obrigatório.')
      return
    }

    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setCreateError('Email inválido. Use o formato: exemplo@dominio.com')
      return
    }

    try {
      await createEmailMutation.mutateAsync({
        nome: newNome.trim(),
        email: newEmail.trim(),
      })

      toast({
        title: 'Sucesso!',
        description: `Email "${newNome.trim()}" adicionado.`,
      })

      setIsCreateDialogOpen(false)
      setNewNome('')
      setNewEmail('')
      setCreateError('')
    } catch (error: any) {
      console.error('Erro ao criar email:', error)
      const message = error?.data?.zodError?.fieldErrors?.nome?.[0]
        || error?.data?.zodError?.fieldErrors?.email?.[0]
        || error?.message
        || 'Não foi possível adicionar o email.'
      setCreateError(message)
    }
  }

  const columns: ColumnDef<EmailNotificacao>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.nome}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span>{row.original.email}</span>
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
      subtitle="Configure os emails para notificação de publicação de editais"
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
            <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Também receberá notificação quando um edital for publicado
                  </p>
                </div>
                <Button onClick={handleSaveEmailIC} disabled={setEmailICMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {setEmailICMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emails de Notificação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Emails de notificação
              </CardTitle>
              <CardDescription>
                Lista de emails que receberão notificação quando um edital for publicado
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Email
            </Button>
          </CardHeader>
          <CardContent>
            <TableComponent
              columns={columns}
              data={emailsNotificacao || []}
              searchableColumn="nome"
              searchPlaceholder="Buscar por nome..."
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Email</DialogTitle>
            <DialogDescription>
              Atualize as informações do email de notificação
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
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Ex: Professores do IC"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Ex: professores@ic.ufba.br"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEmailMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteEmailMutation.isPending ? 'Removendo...' : 'Remover'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateEmailMutation.isPending}>
                {updateEmailMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Email</DialogTitle>
            <DialogDescription>
              Adicione um novo email para receber notificação de publicação de editais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {createError && (
              <p className="text-sm text-red-500 font-medium">{createError}</p>
            )}
            <div>
              <Label htmlFor="new-nome">Nome *</Label>
              <Input
                id="new-nome"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                placeholder="Ex: Professores do IC"
              />
            </div>
            <div>
              <Label htmlFor="new-email">Email *</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ex: professores@ic.ufba.br"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createEmailMutation.isPending}>
              {createEmailMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
