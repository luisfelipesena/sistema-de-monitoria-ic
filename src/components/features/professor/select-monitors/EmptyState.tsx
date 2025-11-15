import { Card, CardContent } from "@/components/ui/card"
import { FileCheck } from "lucide-react"

export function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground">Você não possui projetos com inscricaos para seleção no momento.</p>
        </div>
      </CardContent>
    </Card>
  )
}
