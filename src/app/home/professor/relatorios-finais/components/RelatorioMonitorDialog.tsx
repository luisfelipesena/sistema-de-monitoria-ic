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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { RelatorioFinalMonitorContent } from '@/types'
import { Loader2 } from 'lucide-react'

const FREQUENCIA_OPTIONS = [
  { value: 'Excelente (90-100%)', label: 'Excelente (90-100%)' },
  { value: 'Boa (75-89%)', label: 'Boa (75-89%)' },
  { value: 'Regular (60-74%)', label: 'Regular (60-74%)' },
  { value: 'Insuficiente (<60%)', label: 'Insuficiente (<60%)' },
]

const NOTA_OPTIONS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

interface RelatorioMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  monitorName: string | null
  form: RelatorioFinalMonitorContent
  onFormChange: (form: RelatorioFinalMonitorContent) => void
  onSubmit: () => void
  isPending: boolean
}

export function RelatorioMonitorDialog({
  open,
  onOpenChange,
  monitorName,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: RelatorioMonitorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Relatório do Monitor: {monitorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Desempenho Geral *</Label>
            <Textarea
              value={form.desempenhoGeral}
              onChange={(e) => onFormChange({ ...form, desempenhoGeral: e.target.value })}
              placeholder="Avaliação do desempenho do monitor..."
              rows={3}
            />
          </div>
          <div>
            <Label>Atividades Realizadas *</Label>
            <Textarea
              value={form.atividadesRealizadas}
              onChange={(e) => onFormChange({ ...form, atividadesRealizadas: e.target.value })}
              placeholder="Descrição das atividades realizadas pelo monitor..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frequência *</Label>
              <Select
                value={form.frequencia}
                onValueChange={(v) => onFormChange({ ...form, frequencia: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota Final (0-10) *</Label>
              <Select
                value={form.notaFinal.toString()}
                onValueChange={(v) => onFormChange({ ...form, notaFinal: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {NOTA_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Avaliação Qualitativa</Label>
            <Textarea
              value={form.avaliacaoQualitativa}
              onChange={(e) => onFormChange({ ...form, avaliacaoQualitativa: e.target.value })}
              placeholder="Comentários adicionais sobre o desempenho..."
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
            Criar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
