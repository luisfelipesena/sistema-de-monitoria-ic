'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { RelatorioFinalDisciplinaContent } from '@/types'
import { Loader2 } from 'lucide-react'

interface RelatorioDisciplinaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  form: RelatorioFinalDisciplinaContent
  onFormChange: (form: RelatorioFinalDisciplinaContent) => void
  onSubmit: () => void
  isPending: boolean
}

export function RelatorioDisciplinaDialog({
  open,
  onOpenChange,
  isEditing,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: RelatorioDisciplinaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Relatório da Disciplina' : 'Criar Relatório da Disciplina'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Resumo das Atividades *</Label>
            <Textarea
              value={form.resumoAtividades}
              onChange={(e) => onFormChange({ ...form, resumoAtividades: e.target.value })}
              placeholder="Descreva as atividades realizadas durante o período..."
              rows={4}
            />
          </div>
          <div>
            <Label>Avaliação Geral *</Label>
            <Textarea
              value={form.avaliacaoGeral}
              onChange={(e) => onFormChange({ ...form, avaliacaoGeral: e.target.value })}
              placeholder="Avaliação geral do programa de monitoria..."
              rows={4}
            />
          </div>
          <div>
            <Label>Dificuldades Encontradas</Label>
            <Textarea
              value={form.dificuldadesEncontradas}
              onChange={(e) => onFormChange({ ...form, dificuldadesEncontradas: e.target.value })}
              placeholder="Descreva as dificuldades encontradas..."
              rows={3}
            />
          </div>
          <div>
            <Label>Sugestões de Melhorias</Label>
            <Textarea
              value={form.sugestoesMelhorias}
              onChange={(e) => onFormChange({ ...form, sugestoesMelhorias: e.target.value })}
              placeholder="Sugestões para melhoria do programa..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
