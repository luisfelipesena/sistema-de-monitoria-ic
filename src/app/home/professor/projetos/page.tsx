"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectStatsCards } from "@/components/features/professor/projetos/ProjectStatsCards"
import { ProjectDetailDialog } from "@/components/features/professor/projetos/ProjectDetailDialog"
import { createProjectColumns } from "@/components/features/professor/projetos/ProjectTableColumns"
import { useProjectList } from "@/hooks/features/useProjectList"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ProfessorProjetosPage() {
  const { projetos, selectedProjeto, isDetailDialogOpen, loadingPdfProjetoId, handlers } = useProjectList()

  const columns = createProjectColumns({
    onViewProjeto: handlers.handleViewProjeto,
    onViewPdf: handlers.handleViewPdf,
    loadingPdfProjetoId,
  })

  return (
    <PagesLayout title="Meus Projetos de Monitoria" subtitle="Gerencie seus projetos de monitoria">
      <div className="space-y-6">
        <ProjectStatsCards projetos={projetos} />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Projetos</h2>

          <Button asChild>
            <Link href="/home/professor/projetos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={projetos}
              searchableColumn="titulo"
              searchPlaceholder="Buscar por título do projeto..."
            />
          </CardContent>
        </Card>

        <ProjectDetailDialog projeto={selectedProjeto} isOpen={isDetailDialogOpen} onClose={handlers.handleCloseDialog} />
      </div>
    </PagesLayout>
  )
}
