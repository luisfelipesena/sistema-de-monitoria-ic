'use client'

import { useMemo } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { AtasStatsCards, createAtasColumns } from '@/components/features/admin/atas-selecao'
import { useAtasAdmin } from '@/hooks/features/useAtasAdmin'
import { Loader } from 'lucide-react'

export default function AtasSelecaoAdminPage() {
  const { atas, isLoading, stats, columnFilters, setColumnFilters } = useAtasAdmin()

  const columns = useMemo(() => createAtasColumns(), [])

  return (
    <PagesLayout title="Atas de Seleção">
      {isLoading ? (
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
            searchableColumn="projetoTitulo"
            searchPlaceholder="Buscar por projeto..."
          />
        </div>
      )}
    </PagesLayout>
  )
}
