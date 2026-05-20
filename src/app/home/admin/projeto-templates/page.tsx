"use client"

export const dynamic = 'force-dynamic'

import { DuplicateTemplateDialog } from "@/components/features/admin/templates/DuplicateTemplateDialog"
import { TemplateDialog } from "@/components/features/admin/templates/TemplateDialog"
import { TemplateStats } from "@/components/features/admin/templates/TemplateStats"
import { TemplateTable } from "@/components/features/admin/templates/TemplateTable"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DialogTrigger, Dialog } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  duplicateTemplateSchema,
  projectTemplateSchema,
  type ProjectTemplateItem,
} from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type TemplateFormData = z.infer<typeof projectTemplateSchema>
type DuplicateFormData = z.infer<typeof duplicateTemplateSchema>

export default function ProjetoTemplatesPage() {
  const { toast } = useToast()

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplateItem | null>(null)

  // Activity states
  const [createAtividades, setCreateAtividades] = useState<string[]>([])
  const [editAtividades, setEditAtividades] = useState<string[]>([])

  // Public target states
  const [createPublicoAlvoTipo, setCreatePublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">(
    "estudantes_graduacao"
  )
  const [createPublicoAlvoCustom, setCreatePublicoAlvoCustom] = useState("")
  const [editPublicoAlvoTipo, setEditPublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">(
    "estudantes_graduacao"
  )
  const [editPublicoAlvoCustom, setEditPublicoAlvoCustom] = useState("")

  // Queries
  const { data: templates, isLoading, refetch } = api.projetoTemplates.getTemplates.useQuery()
  const { data: disciplinasDisponiveis } = api.projetoTemplates.getDisciplinasDisponiveis.useQuery()
  const { data: stats } = api.projetoTemplates.getTemplateStats.useQuery()

  // Mutations
  const createTemplateMutation = api.projetoTemplates.createTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Template criado com sucesso!",
      })
      setIsCreateDialogOpen(false)
      refetch()
      createForm.reset()
      setCreateAtividades([])
      setCreatePublicoAlvoTipo("estudantes_graduacao")
      setCreatePublicoAlvoCustom("")
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const updateTemplateMutation = api.projetoTemplates.updateTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Template atualizado com sucesso!",
      })
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const deleteTemplateMutation = api.projetoTemplates.deleteTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Template excluído com sucesso!",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const duplicateTemplateMutation = api.projetoTemplates.duplicateTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Template duplicado com sucesso!",
      })
      setIsDuplicateDialogOpen(false)
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  // Forms
  const createForm = useForm<TemplateFormData>({
    resolver: zodResolver(projectTemplateSchema),
    defaultValues: {
      disciplinaId: 0,
      tituloDefault: "",
      descricaoDefault: "",
      cargaHorariaSemanaDefault: undefined,
      numeroSemanasDefault: undefined,
      publicoAlvoDefault: "",
      atividadesDefault: [],
    },
  })

  const editForm = useForm<TemplateFormData>({
    resolver: zodResolver(projectTemplateSchema),
    defaultValues: {
      disciplinaId: 0,
      tituloDefault: "",
      descricaoDefault: "",
      cargaHorariaSemanaDefault: undefined,
      numeroSemanasDefault: undefined,
      publicoAlvoDefault: "",
      atividadesDefault: [],
    },
  })

  // Handlers
  const handleCreate = (data: TemplateFormData) => {
    const templateData = {
      ...data,
      atividadesDefault: createAtividades.filter((a) => a.trim() !== ""),
      publicoAlvoDefault:
        createPublicoAlvoTipo === "estudantes_graduacao"
          ? "Estudantes de graduação"
          : createPublicoAlvoCustom,
    }
    createTemplateMutation.mutate(templateData)
  }

  const handleEdit = (data: TemplateFormData) => {
    if (!selectedTemplate) return
    const templateData = {
      ...data,
      atividadesDefault: editAtividades.filter((a) => a.trim() !== ""),
      publicoAlvoDefault:
        editPublicoAlvoTipo === "estudantes_graduacao"
          ? "Estudantes de graduação"
          : editPublicoAlvoCustom,
    }
    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      ...templateData,
    })
  }

  const handleDelete = (template: ProjectTemplateItem) => {
    if (confirm(`Tem certeza que deseja excluir o template de ${template.disciplina.nome}?`)) {
      deleteTemplateMutation.mutate({ id: template.id })
    }
  }

  const handleDuplicate = (data: DuplicateFormData) => {
    duplicateTemplateMutation.mutate(data)
  }

  const openEditDialog = (template: ProjectTemplateItem) => {
    setSelectedTemplate(template)
    editForm.reset({
      disciplinaId: template.disciplinaId,
      tituloDefault: template.tituloDefault || "",
      descricaoDefault: template.descricaoDefault || "",
      cargaHorariaSemanaDefault: template.cargaHorariaSemanaDefault || undefined,
      numeroSemanasDefault: template.numeroSemanasDefault || undefined,
      publicoAlvoDefault: template.publicoAlvoDefault || "",
      atividadesDefault: template.atividadesDefault || [],
    })
    setEditAtividades(template.atividadesDefault || [])

    if (template.publicoAlvoDefault === "Estudantes de graduação") {
      setEditPublicoAlvoTipo("estudantes_graduacao")
      setEditPublicoAlvoCustom("")
    } else {
      setEditPublicoAlvoTipo("outro")
      setEditPublicoAlvoCustom(template.publicoAlvoDefault || "")
    }

    setIsEditDialogOpen(true)
  }

  const openDuplicateDialog = (template: ProjectTemplateItem) => {
    setSelectedTemplate(template)
    setIsDuplicateDialogOpen(true)
  }

  return (
    <PagesLayout
      title="Templates de Projeto"
      subtitle="Gerencie os templates padrão para projetos de monitoria"
    >
      <div className="space-y-6">
        {/* Statistics */}
        {stats && <TemplateStats stats={stats} />}

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Projeto
                {templates && (
                  <Badge variant="outline" className="ml-2">
                    {templates.length} template(s)
                  </Badge>
                )}
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!disciplinasDisponiveis || disciplinasDisponiveis.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2">Carregando templates...</p>
                </div>
              </div>
            ) : templates && templates.length > 0 ? (
              <TemplateTable
                templates={templates}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onDuplicate={openDuplicateDialog}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum template cadastrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <TemplateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          title="Criar Novo Template"
          form={createForm}
          onSubmit={handleCreate}
          isSubmitting={createTemplateMutation.isPending}
          submitText="Criar Template"
          disciplinas={disciplinasDisponiveis}
          showDisciplinaField={true}
          atividades={createAtividades}
          setAtividades={setCreateAtividades}
          publicoAlvoTipo={createPublicoAlvoTipo}
          setPublicoAlvoTipo={setCreatePublicoAlvoTipo}
          publicoAlvoCustom={createPublicoAlvoCustom}
          setPublicoAlvoCustom={setCreatePublicoAlvoCustom}
        />

        {/* Edit Dialog */}
        <TemplateDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Editar Template"
          form={editForm}
          onSubmit={handleEdit}
          isSubmitting={updateTemplateMutation.isPending}
          submitText="Atualizar Template"
          showDisciplinaField={false}
          atividades={editAtividades}
          setAtividades={setEditAtividades}
          publicoAlvoTipo={editPublicoAlvoTipo}
          setPublicoAlvoTipo={setEditPublicoAlvoTipo}
          publicoAlvoCustom={editPublicoAlvoCustom}
          setPublicoAlvoCustom={setEditPublicoAlvoCustom}
        />

        {/* Duplicate Dialog */}
        <DuplicateTemplateDialog
          open={isDuplicateDialogOpen}
          onOpenChange={setIsDuplicateDialogOpen}
          template={selectedTemplate}
          disciplinas={disciplinasDisponiveis}
          onSubmit={handleDuplicate}
          isSubmitting={duplicateTemplateMutation.isPending}
        />
      </div>
    </PagesLayout>
  )
}