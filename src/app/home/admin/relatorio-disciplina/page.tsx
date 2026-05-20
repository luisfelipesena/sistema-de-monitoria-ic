'use client'

import { useMemo } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { RelatorioDisciplinaStatsCards, createRelatorioDisciplinaColumns } from '@/components/features/admin/relatorio-disciplina'
import { useRelatorioDisciplinaAdmin } from '@/hooks/features/useRelatorioDisciplinaAdmin'
import { Loader } from 'lucide-react'

export default function RelatorioDisciplinaAdminPage() {
  const {
    relatorios,
    isLoading,
    stats,
    total,
    columnFilters,
    setColumnFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useRelatorioDisciplinaAdmin()

  const columns = useMemo(() => createRelatorioDisciplinaColumns(), [])

  return (
    <PagesLayout title="Relatórios por Disciplina">
      {isLoading && relatorios.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando relatórios...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <RelatorioDisciplinaStatsCards stats={stats} />
          <TableComponent
            data={relatorios}
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
