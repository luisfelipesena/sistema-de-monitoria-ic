"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { api } from "@/utils/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, FileText, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface EditalFormData {
  titulo: string
  numeroEdital: string
  descricaoHtml: string
  periodoInscricaoId: number | null
  publicado: boolean
  dataPublicacao: Date | null
}

interface EditalFormModalProps {
  edital?: {
    id: number
    titulo: string
    numeroEdital: string
    descricaoHtml?: string
    publicado: boolean
    dataPublicacao?: Date | null
    periodoInscricaoId: number
  }
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function EditalFormModal({ edital, onSuccess, trigger }: EditalFormModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<EditalFormData>({
    titulo: edital?.titulo || "",
    numeroEdital: edital?.numeroEdital || "",
    descricaoHtml: edital?.descricaoHtml || "",
    periodoInscricaoId: edital?.periodoInscricaoId || null,
    publicado: edital?.publicado || false,
    dataPublicacao: edital?.dataPublicacao || null,
  })

  const { data: periodos } = api.periodoInscricao.list.useQuery({})
  const { data: user } = api.auth.me.useQuery()
  const createMutation = api.edital.create.useMutation()
  const updateMutation = api.edital.update.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim() || !formData.numeroEdital.trim() || !formData.periodoInscricaoId) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (!user) {
      toast.error("Usuário não autenticado")
      return
    }

    try {
      if (edital) {
        await updateMutation.mutateAsync({
          id: edital.id,
          titulo: formData.titulo,
          numeroEdital: formData.numeroEdital,
          descricaoHtml: formData.descricaoHtml,
          publicado: formData.publicado,
          dataPublicacao: formData.dataPublicacao || undefined,
        })
        toast.success("Edital atualizado com sucesso!")
      } else {
        await createMutation.mutateAsync({
          ...formData,
          periodoInscricaoId: formData.periodoInscricaoId!,
          criadoPorUserId: user.id,
        })
        toast.success("Edital criado com sucesso!")
      }

      setOpen(false)
      onSuccess?.()

      if (!edital) {
        setFormData({
          titulo: "",
          numeroEdital: "",
          descricaoHtml: "",
          periodoInscricaoId: null,
          publicado: false,
          dataPublicacao: null,
        })
      }
    } catch (error) {
      toast.error("Erro ao salvar edital")
      console.error("Error saving edital:", error)
    }
  }

  const handleGeneratePDF = async () => {
    if (!edital?.id) {
      toast.error("Salve o edital antes de gerar o PDF")
      return
    }

    try {
      const periodo = periodos?.find((p) => p.id === formData.periodoInscricaoId)
      if (!periodo) {
        toast.error("Período de inscrição não encontrado")
        return
      }

      const pdfContent = generateEditalPDF({
        titulo: formData.titulo,
        numeroEdital: formData.numeroEdital,
        descricaoHtml: formData.descricaoHtml,
        periodo: {
          semestre: periodo.semestre,
          ano: periodo.ano,
          dataInicio: periodo.dataInicio,
          dataFim: periodo.dataFim,
        },
        dataPublicacao: formData.dataPublicacao,
      })

      const blob = new Blob([pdfContent], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `edital-${formData.numeroEdital}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("PDF gerado com sucesso!")
    } catch (error) {
      toast.error("Erro ao gerar PDF")
      console.error("Error generating PDF:", error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            {edital ? "Editar Edital" : "Novo Edital"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{edital ? "Editar Edital" : "Criar Novo Edital"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Edital de Monitoria 2024.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroEdital">Número do Edital *</Label>
              <Input
                id="numeroEdital"
                value={formData.numeroEdital}
                onChange={(e) => setFormData((prev) => ({ ...prev, numeroEdital: e.target.value }))}
                placeholder="Ex: 001/2024"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodo">Período de Inscrição *</Label>
            <Select
              value={formData.periodoInscricaoId?.toString() || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  periodoInscricaoId: parseInt(value),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periodos?.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    {periodo.semestre === "SEMESTRE_1" ? "1º" : "2º"} Semestre {periodo.ano} (
                    {format(new Date(periodo.dataInicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(new Date(periodo.dataFim), "dd/MM/yyyy", { locale: ptBR })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricaoHtml}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricaoHtml: e.target.value }))}
              placeholder="Descrição detalhada do edital..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="publicado"
                checked={formData.publicado}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, publicado: checked }))}
              />
              <Label htmlFor="publicado">Publicar edital</Label>
            </div>

            <div className="space-y-2">
              <Label>Data de Publicação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dataPublicacao && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataPublicacao
                      ? format(formData.dataPublicacao, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dataPublicacao || undefined}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, dataPublicacao: date || null }))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {edital && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Gerar PDF do Edital</h4>
                  <p className="text-sm text-muted-foreground">Gere o documento PDF oficial do edital</p>
                </div>
                <Button type="button" variant="outline" onClick={handleGeneratePDF}>
                  <Upload className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : edital ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function generateEditalPDF(data: {
  titulo: string
  numeroEdital: string
  descricaoHtml: string
  periodo: {
    semestre: string
    ano: number
    dataInicio: Date
    dataFim: Date
  }
  dataPublicacao: Date | null
}): string {
  const semestreTexto = data.periodo.semestre === "SEMESTRE_1" ? "1º" : "2º"

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Edital ${data.numeroEdital}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .edital-number { font-weight: bold; font-size: 18px; }
            .title { font-size: 16px; margin: 20px 0; }
            .content { text-align: justify; line-height: 1.6; }
            .period { margin: 20px 0; padding: 15px; background-color: #f5f5f5; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>UNIVERSIDADE FEDERAL DA BAHIA</h1>
            <h2>INSTITUTO DE COMPUTAÇÃO</h2>
            <div class="edital-number">EDITAL Nº ${data.numeroEdital}</div>
        </div>
        
        <div class="title">
            <strong>${data.titulo}</strong>
        </div>
        
        <div class="period">
            <strong>Período de Inscrição:</strong> ${semestreTexto} Semestre ${data.periodo.ano}<br>
            <strong>Data de Início:</strong> ${format(data.periodo.dataInicio, "dd/MM/yyyy", { locale: ptBR })}<br>
            <strong>Data de Término:</strong> ${format(data.periodo.dataFim, "dd/MM/yyyy", { locale: ptBR })}
        </div>
        
        <div class="content">
            ${data.descricaoHtml || ""}
        </div>
        
        ${
          data.dataPublicacao
            ? `
        <div style="margin-top: 40px; text-align: right;">
            Salvador, ${format(data.dataPublicacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        `
            : ""
        }
    </body>
    </html>
  `

  return html
}
