'use client'

import { useMemo } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { InscricoesStatsCards, createInscricoesColumns } from '@/components/features/admin/inscricoes'
import { useInscricoesAdmin } from '@/hooks/features/useInscricoesAdmin'
import { Loader } from 'lucide-react'

export default function InscricoesAdminPage() {
  const {
    inscricoes,
    isLoading,
    stats,
    total,
    columnFilters,
    setColumnFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useInscricoesAdmin()

  const columns = useMemo(() => createInscricoesColumns(), [])

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
        </div>
      )}
    </PagesLayout>
  )
}
