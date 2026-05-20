"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { duplicateTemplateSchema, type ProjectTemplateItem } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

type DuplicateFormData = z.infer<typeof duplicateTemplateSchema>

interface DuplicateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ProjectTemplateItem | null
  disciplinas?: Array<{
    id: number
    codigo: string
    nome: string
    departamento: { sigla: string | null }
  }>
  onSubmit: (data: DuplicateFormData) => void
  isSubmitting: boolean
}

export const DuplicateTemplateDialog: React.FC<DuplicateTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  disciplinas,
  onSubmit,
  isSubmitting,
}) => {
  const form = useForm<DuplicateFormData>({
    resolver: zodResolver(duplicateTemplateSchema),
    defaultValues: {
      sourceId: template?.id || 0,
      targetDisciplinaId: 0,
    },
  })

  const handleSubmit = (data: DuplicateFormData) => {
    onSubmit({
      ...data,
      sourceId: template?.id || 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar Template</DialogTitle>
          <DialogDescription>
            Duplicar template de {template?.disciplina.codigo} para outra disciplina
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetDisciplinaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciplina de Destino</FormLabel>
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
                      {disciplinas?.map((disciplina) => (
                        <SelectItem
                          key={disciplina.id}
                          value={disciplina.id.toString()}
                        >
                          {disciplina.codigo} - {disciplina.nome} (
                          {disciplina.departamento.sigla || 'N/A'})
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Duplicando..." : "Duplicar Template"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}