'use client'

// 1. Imports necessários, incluindo o PagesLayout que vi no seu exemplo
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Cog } from 'lucide-react'
import { useState } from 'react'

// 2. Define o tipo de dado para a tabela (da nossa API)
type DepartamentoEmail = {
  id: number
  nome: string
  sigla: string | null
  emailInstituto: string | null
  emailChefeDepartamento: string | null
}

// 3. Define o tipo de dado para o formulário (manual, como no seu exemplo)
type FormData = {
  emailInstituto: string
  emailChefeDepartamento: string
}

export default function ConfiguracoesEmailPage() {
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<DepartamentoEmail | null>(
    null,
  )
  const [formData, setFormData] = useState<FormData>({
    emailInstituto: '',
    emailChefeDepartamento: '',
  })

  // 4. Busca os dados da API que criamos
  const { data: departamentos, isLoading } =
    api.configuracoes.getDepartamentos.useQuery()
  const apiUtils = api.useUtils()

  // 5. Define a mutação tRPC (para salvar)
  const updateEmailsMutation = api.configuracoes.updateEmails.useMutation({
    onSuccess: () => {
      // Atualiza a tabela na página
      apiUtils.configuracoes.getDepartamentos.invalidate()
    },
  })

  // 6. Define o handler de "Editar" (como no seu exemplo)
  const handleEdit = (departamento: DepartamentoEmail) => {
    setSelectedDept(departamento)
    setFormData({
      emailInstituto: departamento.emailInstituto || '',
      emailChefeDepartamento: departamento.emailChefeDepartamento || '',
    })
    setIsEditDialogOpen(true)
  }

  // 7. Define o handler de "Salvar" (como no seu exemplo)
  const handleUpdate = async () => {
    if (!selectedDept) return

    try {
      await updateEmailsMutation.mutateAsync({
        departamentoId: selectedDept.id,
        emailInstituto: formData.emailInstituto || null,
        emailChefeDepartamento: formData.emailChefeDepartamento || null,
      })

      toast({
        title: 'Sucesso!',
        description: `Emails do ${selectedDept.nome} atualizados.`,
      })

      setIsEditDialogOpen(false)
      setSelectedDept(null)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível atualizar os emails.',
        variant: 'destructive',
      })
    }
  }

  // 8. Define as colunas (como no seu exemplo)
  const columns: ColumnDef<DepartamentoEmail>[] = [
    {
      accessorKey: 'nome',
      header: 'Departamento',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.sigla}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'emailInstituto',
      header: 'Email do Instituto',
      cell: ({ row }) => row.original.emailInstituto || 'Não definido',
    },
    {
      accessorKey: 'emailChefeDepartamento',
      header: 'Email do Chefe Depto.',
      cell: ({ row }) =>
        row.original.emailChefeDepartamento || 'Não definido',
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const departamento = row.original
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(departamento)}
          >
            <Cog className="h-4 w-4" />
          </Button>
        )
      },
    },
  ]

  return (
    <PagesLayout
      title="Configuração de Emails"
      subtitle="Gerencie os emails do instituto e do chefe de departamento para relatórios"
    >
      <Card>
        <CardContent className="p-4">
          <TableComponent
            columns={columns}
            data={departamentos || []}
            searchableColumn="nome"
            searchPlaceholder="Buscar por nome do departamento..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Emails do Departamento</DialogTitle>
            <DialogDescription>
              {selectedDept?.nome} ({selectedDept?.sigla})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="email-instituto">Email do Instituto</Label>
              <Input
                id="email-instituto"
                type="email"
                value={formData.emailInstituto}
                onChange={(e) =>
                  setFormData({ ...formData, emailInstituto: e.target.value })
                }
                placeholder="instituto@ufba.br"
              />
            </div>
            <div>
              <Label htmlFor="email-chefe">Email do Chefe Depto.</Label>
              <Input
                id="email-chefe"
                type="email"
                value={formData.emailChefeDepartamento}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emailChefeDepartamento: e.target.value,
                  })
                }
                placeholder="chefe.depto@ufba.br"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateEmailsMutation.isPending}
            >
              {updateEmailsMutation.isPending
                ? 'Salvando...'
                : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}