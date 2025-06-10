import { PagesLayout } from "@/components/layout/PagesLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PeriodosPage() {
  return (
    <PagesLayout title="Períodos de Inscrição" subtitle="Configure os períodos de inscrição para monitoria">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Períodos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Em breve você poderá configurar períodos de inscrição.
          </p>
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
