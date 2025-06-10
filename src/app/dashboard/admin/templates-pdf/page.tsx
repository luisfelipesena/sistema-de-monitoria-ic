"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/utils/api"

const templateFormSchema = z.object({
  disciplinaId: z.number(),
  tituloDefault: z.string().optional(),
  descricaoDefault: z.string().optional(),
  cargaHorariaSemanaDefault: z.number().optional(),
  numeroSemanasDefault: z.number().optional(),
  publicoAlvoDefault: z.string().optional(),
  atividadesDefault: z.string().optional(),
})

type TemplateFormData = z.infer<typeof templateFormSchema>

export default function TemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: templates = [], refetch } = api.template.list.useQuery()
  const { data: disciplinas = [] } = api.disciplina.list.useQuery({ departamentoId: undefined })

  const createTemplateMutation = api.template.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!")
      setIsDialogOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`)
    },
  })

  const deleteTemplateMutation = api.template.delete.useMutation({
    onSuccess: () => {
      toast.success("Template excluído com sucesso!")
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao excluir template: ${error.message}`)
    },
  })

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      disciplinaId: 0,
      tituloDefault: "",
      descricaoDefault: "",
      cargaHorariaSemanaDefault: 0,
      numeroSemanasDefault: 0,
      publicoAlvoDefault: "",
      atividadesDefault: "",
    },
  })

  const onSubmit = (data: TemplateFormData) => {
    createTemplateMutation.mutate({
      ...data,
      criadoPorUserId: 1, // Mock user ID
    })
  }

  const columns = [
    {
      accessorKey: "disciplina.nome",
      header: "Disciplina",
      cell: ({ row }: { row: any }) => (
        <div>
          <p className="font-medium">{row.original.disciplina.nome}</p>
          <p className="text-sm text-muted-foreground">{row.original.disciplina.codigo}</p>
        </div>
      ),
    },
    {
      accessorKey: "tituloDefault",
      header: "Título Padrão",
      cell: ({ row }: { row: any }) => <p className="max-w-[300px] truncate">{row.original.tituloDefault || "-"}</p>,
    },
    {
      accessorKey: "cargaHorariaSemanaDefault",
      header: "Carga Horária/Semana",
      cell: ({ row }: { row: any }) => (
        <p>{row.original.cargaHorariaSemanaDefault ? `${row.original.cargaHorariaSemanaDefault}h` : "-"}</p>
      ),
    },
    {
      accessorKey: "numeroSemanasDefault",
      header: "Nº Semanas",
      cell: ({ row }: { row: any }) => <p>{row.original.numeroSemanasDefault || "-"}</p>,
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }: { row: any }) => <p>{new Date(row.original.createdAt).toLocaleDateString("pt-BR")}</p>,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: { row: any }) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteTemplateMutation.mutate({ id: row.original.id })}
          disabled={deleteTemplateMutation.isPending}
        >
          Excluir
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates PDF</h1>
          <p className="text-muted-foreground">Gerencie templates padrão para criação automática de projetos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="disciplinaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina</FormLabel>
                      <Select
                        onValueChange={(value: string) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma disciplina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {disciplinas.map((disciplina) => (
                            <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                              {disciplina.nome} ({disciplina.codigo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tituloDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Padrão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Monitoria de..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricaoDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Padrão</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição/objetivos padrão do projeto..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cargaHorariaSemanaDefault"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carga Horária Semanal</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 12"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numeroSemanasDefault"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Semanas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 18"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="publicoAlvoDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Público Alvo Padrão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Estudantes de Engenharia..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="atividadesDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atividades Padrão</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Atividades que serão desenvolvidas..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTemplateMutation.isPending}>
                    {createTemplateMutation.isPending ? "Criando..." : "Criar Template"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={templates} />
    </div>
  )
}
