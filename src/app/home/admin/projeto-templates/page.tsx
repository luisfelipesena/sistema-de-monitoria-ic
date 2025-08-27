"use client";

import { PagesLayout } from "@/components/layout/PagesLayout";
import { TableComponent } from "@/components/layout/TableComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  duplicateTemplateSchema,
  projectTemplateSchema,
  type ProjectTemplateItem,
} from "@/types";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  Clock,
  Copy,
  Edit,
  FileText,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type TemplateFormData = z.infer<typeof projectTemplateSchema>;
type DuplicateFormData = z.infer<typeof duplicateTemplateSchema>;

export default function ProjetoTemplatesPage() {
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplateItem | null>(null);

  const {
    data: templates,
    isLoading,
    refetch,
  } = api.projetoTemplates.getTemplates.useQuery();
  const { data: disciplinasDisponiveis } =
    api.projetoTemplates.getDisciplinasDisponiveis.useQuery();
  const { data: stats } = api.projetoTemplates.getTemplateStats.useQuery();

  const createTemplateMutation =
    api.projetoTemplates.createTemplate.useMutation({
      onSuccess: () => {
        toast({
        title: "Sucesso!",
        description: "Template criado com sucesso!",
      });
        setIsCreateDialogOpen(false);
        refetch();
        createForm.reset();
        setCreateAtividades([]);
        setCreatePublicoAlvoTipo("estudantes_graduacao");
        setCreatePublicoAlvoCustom("");
      },
      onError: (error) => {
        toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
      },
    });

  const updateTemplateMutation =
    api.projetoTemplates.updateTemplate.useMutation({
      onSuccess: () => {
        toast({
        title: "Sucesso!",
        description: "Template atualizado com sucesso!",
      });
        setIsEditDialogOpen(false);
        setSelectedTemplate(null);
        refetch();
      },
      onError: (error) => {
        toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
      },
    });

  const deleteTemplateMutation =
    api.projetoTemplates.deleteTemplate.useMutation({
      onSuccess: () => {
        toast({
        title: "Sucesso!",
        description: "Template excluído com sucesso!",
      });
        refetch();
      },
      onError: (error) => {
        toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
      },
    });

  const duplicateTemplateMutation =
    api.projetoTemplates.duplicateTemplate.useMutation({
      onSuccess: () => {
        toast({
        title: "Sucesso!",
        description: "Template duplicado com sucesso!",
      });
        setIsDuplicateDialogOpen(false);
        refetch();
        duplicateForm.reset();
      },
      onError: (error) => {
        toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
      },
    });

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
  });

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
  });

  // Manual state management for activities since useFieldArray has type issues
  const [createAtividades, setCreateAtividades] = useState<string[]>([]);
  const [editAtividades, setEditAtividades] = useState<string[]>([]);
  
  // Estado para gerenciar o tipo de público alvo
  const [createPublicoAlvoTipo, setCreatePublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">("estudantes_graduacao");
  const [createPublicoAlvoCustom, setCreatePublicoAlvoCustom] = useState("");
  const [editPublicoAlvoTipo, setEditPublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">("estudantes_graduacao");
  const [editPublicoAlvoCustom, setEditPublicoAlvoCustom] = useState("");

  const duplicateForm = useForm<DuplicateFormData>({
    resolver: zodResolver(duplicateTemplateSchema),
  });

  const handleCreate = (data: TemplateFormData) => {
    const templateData = {
      ...data,
      atividadesDefault: createAtividades.filter((a) => a.trim() !== ""),
    };
    createTemplateMutation.mutate(templateData);
  };

  const handleEdit = (data: TemplateFormData) => {
    if (!selectedTemplate) return;
    const { disciplinaId, ...updateData } = data;
    const templateData = {
      ...updateData,
      atividadesDefault: editAtividades.filter((a) => a.trim() !== ""),
    };
    updateTemplateMutation.mutate({ id: selectedTemplate.id, ...templateData });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este template?")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  const handleDuplicate = (data: DuplicateFormData) => {
    duplicateTemplateMutation.mutate(data);
  };

  const openEditDialog = (template: ProjectTemplateItem) => {
    setSelectedTemplate(template);
    setEditAtividades(template.atividadesDefault || []);
    
    // Configurar o tipo de público alvo
    if (template.publicoAlvoDefault === "Estudantes de graduação") {
      setEditPublicoAlvoTipo("estudantes_graduacao");
      setEditPublicoAlvoCustom("");
    } else {
      setEditPublicoAlvoTipo("outro");
      setEditPublicoAlvoCustom(template.publicoAlvoDefault || "");
    }
    
    editForm.reset({
      disciplinaId: template.disciplinaId,
      tituloDefault: template.tituloDefault || "",
      descricaoDefault: template.descricaoDefault || "",
      cargaHorariaSemanaDefault:
        template.cargaHorariaSemanaDefault || undefined,
      numeroSemanasDefault: template.numeroSemanasDefault || undefined,
      publicoAlvoDefault: template.publicoAlvoDefault || "",
      atividadesDefault: [],
    });
    setIsEditDialogOpen(true);
  };

  const openDuplicateDialog = (template: ProjectTemplateItem) => {
    setSelectedTemplate(template);
    duplicateForm.reset({
      sourceId: template.id,
      targetDisciplinaId: 0,
    });
    setIsDuplicateDialogOpen(true);
  };

  const columns: ColumnDef<ProjectTemplateItem>[] = [
    {
      header: "Disciplina",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.disciplina.codigo}</div>
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {row.original.disciplina.nome}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.disciplina.departamento.sigla}
          </div>
        </div>
      ),
    },
    {
      header: "Template",
      cell: ({ row }) => (
        <div>
          <div className="font-medium truncate max-w-xs">
            {row.original.tituloDefault || "Sem título"}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.cargaHorariaSemanaDefault &&
              row.original.numeroSemanasDefault && (
                <span>
                  {row.original.cargaHorariaSemanaDefault}h/sem ×{" "}
                  {row.original.numeroSemanasDefault} sem
                </span>
              )}
          </div>
        </div>
      ),
    },
    {
      header: "Atividades",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-600" />
          <span className="text-sm">
            {row.original.atividadesDefault.length} atividade(s)
          </span>
        </div>
      ),
    },
    {
      header: "Última Atualização",
      cell: ({ row }) => (
        <div>
          <div className="text-sm">
            {row.original.updatedAt
              ? new Date(row.original.updatedAt).toLocaleDateString("pt-BR")
              : new Date(row.original.createdAt).toLocaleDateString("pt-BR")}
          </div>
          <div className="text-xs text-muted-foreground">
            {
              (row.original.ultimaAtualizacaoPor || row.original.criadoPor)
                ?.username
            }
          </div>
        </div>
      ),
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => {
        const template = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDuplicateDialog(template)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(template.id)}
              disabled={deleteTemplateMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PagesLayout
      title="Templates de Projeto"
      subtitle="Gerencie templates para agilizar a criação de projetos de monitoria"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total de Templates
                    </p>
                    <p className="text-2xl font-semibold">
                      {stats.totalTemplates}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total de Disciplinas
                    </p>
                    <p className="text-2xl font-semibold">
                      {stats.totalDisciplinas}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cobertura</p>
                    <p className="text-2xl font-semibold">{stats.cobertura}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Sem Template
                    </p>
                    <p className="text-2xl font-semibold">
                      {stats.disciplinasSemTemplate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    disabled={
                      !disciplinasDisponiveis ||
                      disciplinasDisponiveis.length === 0
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Template</DialogTitle>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form
                      onSubmit={createForm.handleSubmit(handleCreate)}
                      className="space-y-4"
                    >
                      <FormField
                        control={createForm.control}
                        name="disciplinaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disciplina</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a disciplina" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {disciplinasDisponiveis?.map((disciplina) => (
                                  <SelectItem
                                    key={disciplina.id}
                                    value={disciplina.id.toString()}
                                  >
                                    {disciplina.codigo} - {disciplina.nome} (
                                    {disciplina.departamento.sigla})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="tituloDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título Padrão</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Monitoria de [Disciplina]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="descricaoDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição Padrão</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={4}
                                placeholder="Objetivos e justificativa do projeto..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="cargaHorariaSemanaDefault"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Carga Horária Semanal</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="12"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="numeroSemanasDefault"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Semanas</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="16"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="publicoAlvoDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Público Alvo Padrão</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <RadioGroup
                                  value={createPublicoAlvoTipo}
                                  onValueChange={(value: "estudantes_graduacao" | "outro") => {
                                    setCreatePublicoAlvoTipo(value)
                                    if (value === "estudantes_graduacao") {
                                      field.onChange("Estudantes de graduação")
                                    }
                                  }}
                                  className="flex flex-col space-y-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="estudantes_graduacao" id="create_estudantes_graduacao" />
                                    <label htmlFor="create_estudantes_graduacao" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      Estudantes de graduação
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="outro" id="create_outro" />
                                    <label htmlFor="create_outro" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      Outro
                                    </label>
                                  </div>
                                </RadioGroup>
                                
                                {createPublicoAlvoTipo === "outro" && (
                                  <div className="mt-3">
                                    <Input
                                      placeholder="Descreva o público alvo específico"
                                      value={createPublicoAlvoCustom}
                                      onChange={(e) => {
                                        setCreatePublicoAlvoCustom(e.target.value)
                                        field.onChange(e.target.value)
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-4">
                        <FormLabel>Atividades Padrão</FormLabel>
                        {createAtividades.map((atividade, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              className="flex-1"
                              placeholder="Ex: Elaborar material de apoio"
                              value={atividade}
                              onChange={(e) => {
                                const newAtividades = [...createAtividades];
                                newAtividades[index] = e.target.value;
                                setCreateAtividades(newAtividades);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newAtividades = createAtividades.filter(
                                  (_, i) => i !== index
                                );
                                setCreateAtividades(newAtividades);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCreateAtividades([...createAtividades, ""])
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Atividade
                        </Button>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createTemplateMutation.isPending}
                      >
                        {createTemplateMutation.isPending
                          ? "Criando..."
                          : "Criar Template"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
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
              <TableComponent
                columns={columns}
                data={templates}
                searchableColumn="disciplina.codigo"
                searchPlaceholder="Buscar por código da disciplina..."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum template encontrado
                </h3>
                <p>
                  Crie templates para agilizar a criação de projetos de
                  monitoria.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Template</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEdit)}
                className="space-y-4"
              >
                <div className="text-sm text-muted-foreground">
                  Disciplina: {selectedTemplate?.disciplina.codigo} -{" "}
                  {selectedTemplate?.disciplina.nome}
                </div>
                <FormField
                  control={editForm.control}
                  name="tituloDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Padrão</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="descricaoDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Padrão</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="cargaHorariaSemanaDefault"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carga Horária Semanal</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="numeroSemanasDefault"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Semanas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="publicoAlvoDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Público Alvo Padrão</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <RadioGroup
                            value={editPublicoAlvoTipo}
                            onValueChange={(value: "estudantes_graduacao" | "outro") => {
                              setEditPublicoAlvoTipo(value)
                              if (value === "estudantes_graduacao") {
                                field.onChange("Estudantes de graduação")
                              }
                            }}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="estudantes_graduacao" id="edit_estudantes_graduacao" />
                              <label htmlFor="edit_estudantes_graduacao" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Estudantes de graduação
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="outro" id="edit_outro" />
                              <label htmlFor="edit_outro" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Outro
                              </label>
                            </div>
                          </RadioGroup>
                          
                          {editPublicoAlvoTipo === "outro" && (
                            <div className="mt-3">
                              <Input
                                placeholder="Descreva o público alvo específico"
                                value={editPublicoAlvoCustom}
                                onChange={(e) => {
                                  setEditPublicoAlvoCustom(e.target.value)
                                  field.onChange(e.target.value)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <FormLabel>Atividades Padrão</FormLabel>
                  {editAtividades.map((atividade, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        placeholder="Ex: Elaborar material de apoio"
                        value={atividade}
                        onChange={(e) => {
                          const newAtividades = [...editAtividades];
                          newAtividades[index] = e.target.value;
                          setEditAtividades(newAtividades);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newAtividades = editAtividades.filter(
                            (_, i) => i !== index
                          );
                          setEditAtividades(newAtividades);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditAtividades([...editAtividades, ""])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Atividade
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending
                    ? "Atualizando..."
                    : "Atualizar Template"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Duplicate Dialog */}
        <Dialog
          open={isDuplicateDialogOpen}
          onOpenChange={setIsDuplicateDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Duplicar Template</DialogTitle>
            </DialogHeader>
            <Form {...duplicateForm}>
              <form
                onSubmit={duplicateForm.handleSubmit(handleDuplicate)}
                className="space-y-4"
              >
                <div className="text-sm text-muted-foreground">
                  Duplicando template de: {selectedTemplate?.disciplina.codigo}{" "}
                  - {selectedTemplate?.disciplina.nome}
                </div>
                <FormField
                  control={duplicateForm.control}
                  name="targetDisciplinaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina de Destino</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a disciplina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {disciplinasDisponiveis?.map((disciplina) => (
                            <SelectItem
                              key={disciplina.id}
                              value={disciplina.id.toString()}
                            >
                              {disciplina.codigo} - {disciplina.nome} (
                              {disciplina.departamento.sigla})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={duplicateTemplateMutation.isPending}
                >
                  {duplicateTemplateMutation.isPending
                    ? "Duplicando..."
                    : "Duplicar Template"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  );
}
