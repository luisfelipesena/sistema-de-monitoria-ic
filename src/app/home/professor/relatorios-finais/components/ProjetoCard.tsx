'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SEMESTRE_LABELS, type RelatorioStatus, type Semestre } from '@/types'
import { CheckCircle, FileText, Users } from 'lucide-react'
import { RelatorioStatusBadge } from './RelatorioStatusBadge'

interface ProjetoCardProps {
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: string
    disciplinaNome: string | null
  }
  status: RelatorioStatus | null
  totalMonitores: number
  monitoresAssinados: number
  professorAssinouEm: Date | null
  hasRelatorio: boolean
  onClick: () => void
}

export function ProjetoCard({
  projeto,
  status,
  totalMonitores,
  monitoresAssinados,
  professorAssinouEm,
  hasRelatorio,
  onClick,
}: ProjetoCardProps) {
  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{projeto.titulo}</CardTitle>
            <CardDescription>
              {projeto.disciplinaNome} • {projeto.ano}/{SEMESTRE_LABELS[projeto.semestre as Semestre]}
            </CardDescription>
          </div>
          <RelatorioStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalMonitores} monitores</span>
          </div>
          {hasRelatorio && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>{monitoresAssinados}/{totalMonitores} assinados</span>
            </div>
          )}
          {professorAssinouEm && (
            <div className="flex items-center gap-1 text-green-600">
              <FileText className="h-4 w-4" />
              <span>Relatório assinado</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
