"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/utils/api"
import { Upload } from "lucide-react"
import { useState, type ChangeEvent } from "react"
import { toast } from "sonner"

export default function ImportProjectsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [base64File, setBase64File] = useState<string>("")

  const importMutation = api.admin.importProjectsFromXlsx.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${data.createdCount} projetos importados com sucesso!`)
      } else {
        toast.error("Ocorreram erros durante a importação.", {
          description: `${data.errors.length} linhas com problemas.`,
        })
      }
    },
    onError: (error) => {
      toast.error("Falha na importação.", {
        description: error.message,
      })
    },
  })

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.readAsDataURL(selectedFile)
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]
        setBase64File(base64)
      }
      reader.onerror = (error) => {
        toast.error("Erro ao ler o arquivo.", { description: String(error) })
      }
    }
  }

  const handleImport = () => {
    if (!base64File) {
      toast.warning("Por favor, selecione um arquivo para importar.")
      return
    }
    // Hardcoded admin user ID for now
    importMutation.mutate({ file: base64File, adminUserId: 1 })
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Importar Planejamento de Projetos</CardTitle>
          <CardDescription>
            Faça o upload de um arquivo XLSX para criar múltiplos projetos de uma vez. Certifique-se que a planilha
            contém as colunas: `titulo`, `professor_siape`, `departamento_sigla`, `disciplina_codigo`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="xlsx-file">Arquivo XLSX</Label>
            <Input id="xlsx-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          </div>
          <Button onClick={handleImport} disabled={importMutation.isPending || !file}>
            {importMutation.isPending ? (
              "Importando..."
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Importar Projetos
              </>
            )}
          </Button>

          {importMutation.data && importMutation.data.errors.length > 0 && (
            <div>
              <h3 className="font-semibold">Erros de Importação:</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importMutation.data.errors.map((err, index) => (
                    <TableRow key={index}>
                      <TableCell>{err.row}</TableCell>
                      <TableCell>{err.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
