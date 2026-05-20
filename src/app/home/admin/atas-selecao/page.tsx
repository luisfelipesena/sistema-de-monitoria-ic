'use client'

import { useMemo } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { AtasStatsCards, createAtasColumns } from '@/components/features/admin/atas-selecao'
import { useAtasAdmin } from '@/hooks/features/useAtasAdmin'
import { Loader } from 'lucide-react'

export default function AtasSelecaoAdminPage() {
  const {
    atas,
    isLoading,
    stats,
    total,
    columnFilters,
    setColumnFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useAtasAdmin()

  const columns = useMemo(() => createAtasColumns(), [])

  return (
    <PagesLayout title="Atas de Seleção">
      {isLoading && atas.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando atas...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <AtasStatsCards stats={stats} />
          <TableComponent
            data={atas}
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
