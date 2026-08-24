'use client'

import { useMemo, useState } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { InscricoesStatsCards, createInscricoesColumns } from '@/components/features/admin/inscricoes'
import { useInscricoesAdmin } from '@/hooks/features/useInscricoesAdmin'
import { Loader } from 'lucide-react'
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

export default function InscricoesAdminPage() {
  const {
    inscricoes,
    isLoading,
    stats,
    total,
    columnFilters,
    setColumnFilters,
    deleteInscricao,
    isDeleting,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useInscricoesAdmin()

  const [selectedToDelete, setSelectedToDelete] = useState<any | null>(null)

  const columns = useMemo(
    () =>
      createInscricoesColumns({
        onDelete: (inscricao) => setSelectedToDelete(inscricao),
      }),
    []
  )

  const handleConfirmDelete = async () => {
    if (!selectedToDelete) return
    try {
      await deleteInscricao(selectedToDelete.id)
    } finally {
      setSelectedToDelete(null)
    }
  }

  return (
    <PagesLayout title="Visualizar Inscrições">
      {isLoading && inscricoes.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando inscrições...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <InscricoesStatsCards stats={stats} />
          <TableComponent
            data={inscricoes}
            columns={columns}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            isLoading={isLoading}
            serverPagination={{
              totalCount: total,
              pageIndex: page,
              pageSize,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />

          <AlertDialog open={!!selectedToDelete} onOpenChange={(open) => !open && setSelectedToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Inscrição</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover a inscrição do aluno{' '}
                  <strong className="text-gray-900">{selectedToDelete?.aluno.nomeCompleto}</strong> no projeto{' '}
                  <strong className="text-gray-900">{selectedToDelete?.projeto.titulo}</strong>? Esta ação não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Removendo...' : 'Remover Inscrição'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </PagesLayout>
  )
}
