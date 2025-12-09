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
import { Building2, Cog, Mail, Save } from 'lucide-react'
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
  const [selectedDept, setSelectedDept] = useState<DepartamentoEmail | null>(null)
  const [deptEmail, setDeptEmail] = useState('')
  const [emailIC, setEmailIC] = useState('')

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

  const handleEdit = (departamento: DepartamentoEmail) => {
    setSelectedDept(departamento)
    setDeptEmail(departamento.emailInstituto || '')
    setIsEditDialogOpen(true)
  }

  const handleUpdateDeptEmail = async () => {
    if (!selectedDept) return

    try {
      await updateDeptEmailMutation.mutateAsync({
        departamentoId: selectedDept.id,
        email: deptEmail || null,
      })

      toast({
        title: 'Sucesso!',
        description: `Email do ${selectedDept.nome} atualizado.`,
      })

      setIsEditDialogOpen(false)
      setSelectedDept(null)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível atualizar o email.',
        variant: 'destructive',
      })
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

  const columns: ColumnDef<DepartamentoEmail>[] = [
    {
      accessorKey: 'nome',
      header: 'Departamento',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          <div className="text-sm text-muted-foreground">{row.original.sigla}</div>
        </div>
      ),
    },
    {
      accessorKey: 'emailInstituto',
      header: 'Email do Departamento',
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
        <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Emails dos Departamentos
            </CardTitle>
            <CardDescription>
              Email de cada departamento (DCC/DCI) para receber a planilha correspondente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableComponent
              columns={columns}
              data={departamentos || []}
              searchableColumn="nome"
              searchPlaceholder="Buscar por nome do departamento..."
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Email do Departamento</DialogTitle>
            <DialogDescription>
              {selectedDept?.nome} ({selectedDept?.sigla})
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="email-dept">Email</Label>
            <Input
              id="email-dept"
              type="email"
              value={deptEmail}
              onChange={(e) => setDeptEmail(e.target.value)}
              placeholder="departamento@ufba.br"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDeptEmail} disabled={updateDeptEmailMutation.isPending}>
              {updateDeptEmailMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
