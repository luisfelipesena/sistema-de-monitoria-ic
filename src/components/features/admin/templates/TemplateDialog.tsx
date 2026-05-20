"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { UseFormReturn } from "react-hook-form"

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  form: UseFormReturn<any>
  onSubmit: (data: any) => void
  isSubmitting: boolean
  submitText?: string
  disciplinas?: Array<{
    id: number
    codigo: string
    nome: string
    departamento: { sigla: string | null }
  }>
  showDisciplinaField?: boolean
  atividades: string[]
  setAtividades: (atividades: string[]) => void
  publicoAlvoTipo: "estudantes_graduacao" | "outro"
  setPublicoAlvoTipo: (tipo: "estudantes_graduacao" | "outro") => void
  publicoAlvoCustom: string
  setPublicoAlvoCustom: (value: string) => void
}

export const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpenChange,
  title,
  form,
  onSubmit,
  isSubmitting,
  submitText = "Salvar",
  disciplinas,
  showDisciplinaField = true,
  atividades,
  setAtividades,
  publicoAlvoTipo,
  setPublicoAlvoTipo,
  publicoAlvoCustom,
  setPublicoAlvoCustom,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showDisciplinaField && disciplinas && (
              <FormField
                control={form.control}
                name="disciplinaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {disciplinas.map((disciplina) => (
                          <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                            {disciplina.codigo} - {disciplina.nome} ({disciplina.departamento.sigla || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tituloDefault"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Padrão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Monitoria de [Disciplina]" {...field} />
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
                    <Textarea rows={4} placeholder="Objetivos e justificativa do projeto..." {...field} />
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
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                        placeholder="16"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                    <div className="space-y-4">
                      <RadioGroup
                        value={publicoAlvoTipo}
                        onValueChange={(value: "estudantes_graduacao" | "outro") => {
                          setPublicoAlvoTipo(value)
                          if (value === "estudantes_graduacao") {
                            field.onChange("Estudantes de graduação")
                          }
                        }}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="estudantes_graduacao" id="dialog_estudantes_graduacao" />
                          <label
                            htmlFor="dialog_estudantes_graduacao"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Estudantes de graduação
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outro" id="dialog_outro" />
                          <label
                            htmlFor="dialog_outro"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Outro
                          </label>
                        </div>
                      </RadioGroup>

                      {publicoAlvoTipo === "outro" && (
                        <div className="mt-3">
                          <Input
                            placeholder="Descreva o público alvo específico"
                            value={publicoAlvoCustom}
                            onChange={(e) => {
                              setPublicoAlvoCustom(e.target.value)
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
              {atividades.map((atividade, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Ex: Elaborar material de apoio"
                    value={atividade}
                    onChange={(e) => {
                      const newAtividades = [...atividades]
                      newAtividades[index] = e.target.value
                      setAtividades(newAtividades)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newAtividades = atividades.filter((_, i) => i !== index)
                      setAtividades(newAtividades)
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
                onClick={() => setAtividades([...atividades, ""])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Atividade
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : submitText}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}