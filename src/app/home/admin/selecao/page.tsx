'use client'

import { useMemo } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { SelecaoStatsCards, createSelecaoColumns } from '@/components/features/admin/selecao'
import { useSelecaoAdmin } from '@/hooks/features/useSelecaoAdmin'
import { Loader } from 'lucide-react'

export default function SelecaoAdminPage() {
  const {
    projetos,
    isLoading,
    stats,
    total,
    columnFilters,
    setColumnFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useSelecaoAdmin()

  const columns = useMemo(() => createSelecaoColumns(), [])

  return (
    <PagesLayout title="Gerenciar Seleções">
      {isLoading && projetos.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <SelecaoStatsCards stats={stats} />
          <TableComponent
            data={projetos}
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
