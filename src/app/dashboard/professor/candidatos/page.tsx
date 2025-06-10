import { PagesLayout } from "@/components/layout/PagesLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CandidatosPage() {
  return (
    <PagesLayout title="Gerenciar Candidatos" subtitle="Visualize e gerencie os candidatos às suas vagas de monitoria">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Candidatos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Em breve você poderá visualizar todos os candidatos aos seus projetos.
          </p>
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
