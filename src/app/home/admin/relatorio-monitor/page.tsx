'use client'

import { useMemo } from 'react'
import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { RelatorioMonitorStatsCards, createRelatorioMonitorColumns } from '@/components/features/admin/relatorio-monitor'
import { useRelatorioMonitorAdmin } from '@/hooks/features/useRelatorioMonitorAdmin'
import { Loader } from 'lucide-react'

export default function RelatorioMonitorAdminPage() {
  const { relatorios, isLoading, stats, columnFilters, setColumnFilters } = useRelatorioMonitorAdmin()

  const columns = useMemo(() => createRelatorioMonitorColumns(), [])

  return (
    <PagesLayout title="Relatórios por Monitor">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando relatórios...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <RelatorioMonitorStatsCards stats={stats} />
          <TableComponent
            data={relatorios}
            columns={columns}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            searchableColumn="monitorNome"
            searchPlaceholder="Buscar por monitor..."
          />
        </div>
      )}
    </PagesLayout>
  )
}
