"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SEMESTRE_1, SEMESTRE_2 } from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { RelatoriosFilters } from "@/components/features/admin/relatorios/RelatoriosFilters"
import { SummaryCards } from "@/components/features/admin/relatorios/SummaryCards"
import { RelatorioDepartamentos } from "@/components/features/admin/relatorios/tabs/RelatorioDepartamentos"
import { RelatorioProfessores } from "@/components/features/admin/relatorios/tabs/RelatorioProfessores"
import { RelatorioAlunos } from "@/components/features/admin/relatorios/tabs/RelatorioAlunos"
import { RelatorioDisciplinas } from "@/components/features/admin/relatorios/tabs/RelatorioDisciplinas"
import { RelatorioEditais } from "@/components/features/admin/relatorios/tabs/RelatorioEditais"
import { useRelatorioExport } from "@/hooks/features/useRelatorioExport"

const filtersSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum([SEMESTRE_1, SEMESTRE_2]),
})

type FiltersData = z.infer<typeof filtersSchema>

export default function RelatoriosPage() {
  const [filters, setFilters] = useState<FiltersData>({
    ano: new Date().getFullYear(),
    semestre: SEMESTRE_1,
  })

  const form = useForm<FiltersData>({
    resolver: zodResolver(filtersSchema),
    defaultValues: filters,
  })

  const { data: relatorioGeral, isLoading: loadingGeral } = api.relatorios.getRelatorioGeral.useQuery(filters)
  const { data: departamentos, isLoading: loadingDepartamentos } =
    api.relatorios.getRelatorioPorDepartamento.useQuery(filters)
  const { data: professores, isLoading: loadingProfessores } = api.relatorios.getRelatorioProfessores.useQuery(filters)
  const { data: alunos, isLoading: loadingAlunos } = api.relatorios.getRelatorioAlunos.useQuery(filters)
  const { data: disciplinas, isLoading: loadingDisciplinas } = api.relatorios.getRelatorioDisciplinas.useQuery(filters)
  const { data: editais, isLoading: loadingEditais } = api.relatorios.getRelatorioEditais.useQuery({ ano: filters.ano })

  const { handleExport, isExporting } = useRelatorioExport(filters)

  const handleFiltersSubmit = (data: FiltersData) => {
    setFilters(data)
  }

  return (
    <PagesLayout
      title="Relatórios PROGRAD"
      subtitle="Relatórios administrativos e estatísticas do sistema de monitoria"
    >
      <div className="space-y-6">
        <RelatoriosFilters form={form} onSubmit={handleFiltersSubmit} />

        <SummaryCards data={relatorioGeral} />

        <Tabs defaultValue="departamentos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
            <TabsTrigger value="professores">Professores</TabsTrigger>
            <TabsTrigger value="alunos">Alunos</TabsTrigger>
            <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
            <TabsTrigger value="editais">Editais</TabsTrigger>
          </TabsList>

          <TabsContent value="departamentos">
            <RelatorioDepartamentos
              data={departamentos}
              isLoading={loadingDepartamentos}
              onExport={() => handleExport("departamentos")}
              isExporting={isExporting}
            />
          </TabsContent>

          <TabsContent value="professores">
            <RelatorioProfessores
              data={professores}
              isLoading={loadingProfessores}
              onExport={() => handleExport("professores")}
              isExporting={isExporting}
            />
          </TabsContent>

          <TabsContent value="alunos">
            <RelatorioAlunos
              data={alunos}
              isLoading={loadingAlunos}
              onExport={() => handleExport("alunos")}
              isExporting={isExporting}
            />
          </TabsContent>

          <TabsContent value="disciplinas">
            <RelatorioDisciplinas
              data={disciplinas}
              isLoading={loadingDisciplinas}
              onExport={() => handleExport("disciplinas")}
              isExporting={isExporting}
            />
          </TabsContent>

          <TabsContent value="editais">
            <RelatorioEditais
              data={editais}
              isLoading={loadingEditais}
              onExport={() => handleExport("editais")}
              isExporting={isExporting}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PagesLayout>
  )
}
