import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle } from "lucide-react"

interface ValidationProblem {
  nomeAluno: string
  tipo: string
  problemas: string[]
}

interface ValidationData {
  valido: boolean
  totalProblemas: number
  problemas: ValidationProblem[]
}

interface ValidationDialogProps {
  validationData: ValidationData | null | undefined
  showValidation: boolean
}

export function ValidationDialog({ validationData, showValidation }: ValidationDialogProps) {
  if (!showValidation || !validationData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {validationData.valido ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          Validação dos Dados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validationData.valido ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Todos os dados estão completos e prontos para exportação!</AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {validationData.totalProblemas} problema(s) encontrado(s). Corrija antes de exportar.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationData.problemas.map((problema, index) => (
                <div key={index} className="p-3 border rounded-lg bg-red-50">
                  <div className="font-medium">
                    {problema.nomeAluno} ({problema.tipo})
                  </div>
                  <div className="text-sm text-muted-foreground">Problemas: {problema.problemas.join(", ")}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
