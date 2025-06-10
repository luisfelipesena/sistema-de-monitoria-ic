import { PagesLayout } from "@/components/layout/PagesLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SelecaoPage() {
  return (
    <PagesLayout title="Seleção de Monitores" subtitle="Realize o processo de seleção dos seus monitores">
      <Card>
        <CardHeader>
          <CardTitle>Processo Seletivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Em breve você poderá conduzir o processo de seleção dos monitores.
          </p>
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
