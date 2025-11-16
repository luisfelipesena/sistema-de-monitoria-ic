"use client"

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus } from 'lucide-react'
import { DepartmentStats } from '@/components/features/admin/departamentos/DepartmentStats'
import { getDepartmentColumns } from '@/components/features/admin/departamentos/DepartmentTableColumns'
import { DepartmentFormDialog } from '@/components/features/admin/departamentos/DepartmentFormDialog'
import { useDepartmentManagement } from '@/hooks/features/useDepartmentManagement'

export default function DepartamentosPage() {
  const {
    departamentos,
    isLoading,
    formData,
    setFormData,
    createDialog,
    editDialog,
    deleteDialog,
    handleCreate,
    handleEdit,
    handleUpdate,
    handleDelete,
    resetForm,
    isCreating,
    isUpdating,
    isDeleting,
  } = useDepartmentManagement()

  const columns = getDepartmentColumns({
    onEdit: handleEdit,
    onDelete: (dept) => deleteDialog.open(dept),
  })

  return (
    <PagesLayout
      title="Gerenciamento de Departamentos"
      subtitle="Gerencie departamentos e suas informações"
    >
      <div className="space-y-6">
        <DepartmentStats departamentos={departamentos} />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Departamentos</h2>

          <Button onClick={() => createDialog.open()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Departamento
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={departamentos}
              searchableColumn="nome"
              searchPlaceholder="Buscar por nome do departamento..."
            />
          </CardContent>
        </Card>

        <DepartmentFormDialog
          isOpen={createDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              createDialog.close()
              resetForm()
            }
          }}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          isLoading={isCreating}
          title="Criar Novo Departamento"
          description="Preencha as informações do novo departamento"
          submitLabel="Criar Departamento"
        />

        <DepartmentFormDialog
          isOpen={editDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              editDialog.close()
              resetForm()
            }
          }}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          title="Editar Departamento"
          description="Atualize as informações do departamento"
          submitLabel="Atualizar Departamento"
        />

        <AlertDialog
          open={deleteDialog.isOpen}
          onOpenChange={deleteDialog.close}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o departamento{' '}
                <span className="font-semibold">
                  {deleteDialog.data?.nome}
                </span>
                ? Esta ação não pode ser desfeita e pode afetar outros dados
                relacionados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PagesLayout>
  )
}
