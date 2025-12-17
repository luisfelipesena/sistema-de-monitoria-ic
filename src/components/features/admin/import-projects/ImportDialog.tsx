"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { importFormSchema, SEMESTRE_1, SEMESTRE_2 } from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type ImportFormData = z.infer<typeof importFormSchema>

interface ImportDialogProps {
  onSuccess: () => void
}

export function ImportDialog({ onSuccess }: ImportDialogProps) {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const apiUtils = api.useUtils()

  const invalidateProjectQueries = () => {
    // Invalidate all project-related queries to refresh lists
    apiUtils.projeto.getProjetos.invalidate()
    apiUtils.projeto.getProjetosFiltered.invalidate()
  }

  const uploadFileMutation = api.file.uploadFile.useMutation()
  const importProjectsMutation = api.importProjects.uploadFile.useMutation({
    onSuccess: async (importacao) => {
      toast({ title: "Arquivo enviado!", description: "Processando planilha..." })
      try {
        await processImportMutation.mutateAsync({ importacaoId: importacao.id })
      } catch {
        // Error handled in processImportMutation
      }
    },
    onError: (error) => {
      toast({ title: "Erro", description: `Erro ao importar: ${error.message}`, variant: "destructive" })
    },
  })

  const processImportMutation = api.importProjects.processImportedFileDCC.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Importação concluída!",
        description: `${result.projetosCriados} projetos criados. ${result.emailsEnviados} professores notificados.`,
      })
      setIsDialogOpen(false)
      setSelectedFile(null)
      form.reset()
      invalidateProjectQueries()
      onSuccess()
    },
    onError: (error) => {
      toast({ title: "Erro no processamento", description: `Erro ao processar: ${error.message}`, variant: "destructive" })
      invalidateProjectQueries()
      onSuccess() // Refresh list even on error
    },
  })

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: { ano: new Date().getFullYear(), semestre: SEMESTRE_1 },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
        toast({ title: "Erro", description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv).", variant: "destructive" })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleImport = async (data: ImportFormData) => {
    if (!selectedFile) {
      toast({ title: "Erro", description: "Por favor, selecione um arquivo", variant: "destructive" })
      return
    }

    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          resolve(base64.split(",")[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const uploadResult = await uploadFileMutation.mutateAsync({
        fileName: selectedFile.name,
        fileData,
        mimeType: selectedFile.type,
        entityType: "imports",
        entityId: `${data.ano}-${data.semestre}`,
      })

      await importProjectsMutation.mutateAsync({
        fileId: uploadResult.fileId,
        fileName: selectedFile.name,
        ano: data.ano,
        semestre: data.semestre,
      })
    } catch (error) {
      console.error("Error during import:", error)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Planejamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleImport)} className="space-y-4">
            <FormField
              control={form.control}
              name="ano"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="semestre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semestre</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o semestre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SEMESTRE_1}>1º Semestre</SelectItem>
                      <SelectItem value={SEMESTRE_2}>2º Semestre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo Excel/CSV</label>
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} required />
              {selectedFile && <p className="text-sm text-muted-foreground">Arquivo selecionado: {selectedFile.name}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={importProjectsMutation.isPending || !selectedFile}>
              {importProjectsMutation.isPending ? "Importando..." : "Importar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
