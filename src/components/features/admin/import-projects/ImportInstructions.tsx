import { FileSpreadsheet } from "lucide-react"

export function ImportInstructions() {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Importação de Projetos</h3>
        <p className="text-muted-foreground mb-2">
          Faça upload de uma planilha Excel com o planejamento de monitoria.
        </p>
        <p className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</p>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-2">📋 Formato Planilha DCC (Planejamento):</h4>
        <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
          <p><strong>Colunas necessárias:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li><code>DISCIPLINA</code> - Código da disciplina (ex: MATA37)</li>
            <li><code>TURMA</code> - Número da turma (1, 2, 3...)</li>
            <li><code>NOME DISCIPLINA</code> - Nome completo da disciplina</li>
            <li><code>DOCENTE</code> - Nome do professor (última coluna)</li>
            <li><code>CH</code> (opcional) - Carga horária</li>
          </ul>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-700">
              💡 <strong>Formato DCC:</strong> O sistema ignora automaticamente professores substitutos (SUB 01, SUB 02) e
              &quot;docente a contratar&quot;. Busca professores por nome no sistema. Linhas vazias em DISCIPLINA são tratadas como
              continuação.
            </p>
          </div>
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-700">
              ⚠️ <strong>Importante:</strong> Certifique-se de que os professores estejam cadastrados no sistema com nomes
              que correspondam aos da planilha.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
