import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { BolsasRedistribuicaoStatus, ProjetoDemanda, ProjetoSurplus } from "@/types"
import { ArrowRight, Info } from "lucide-react"
import { useState } from "react"

interface BolsasRedistribuicaoSectionProps {
  data: BolsasRedistribuicaoStatus | undefined
  isLoading: boolean
  isRedistribuindo: boolean
  onRedistribuir: (fromProjetoId: number, toProjetoId: number) => void
}

export function BolsasRedistribuicaoSection({
  data,
  isLoading,
  isRedistribuindo,
  onRedistribuir,
}: BolsasRedistribuicaoSectionProps) {
  const [fromId, setFromId] = useState<number | null>(null)
  const [toId, setToId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const surplus = data?.projetosComSurplus ?? []
  const demanda = data?.projetosComDemanda ?? []

  const fromProjeto = surplus.find((p) => p.projetoId === fromId) ?? null
  const toProjeto = demanda.find((p) => p.projetoId === toId) ?? null
  const canTransfer = !!fromProjeto && !!toProjeto && !isRedistribuindo

  const handleConfirm = () => {
    if (fromProjeto && toProjeto) {
      onRedistribuir(fromProjeto.projetoId, toProjeto.projetoId)
      setConfirmOpen(false)
      setFromId(null)
      setToId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validação de Bolsas — Redistribuição</CardTitle>
        <p className="text-sm text-muted-foreground">
          Transfira bolsas de projetos com vagas não preenchidas para projetos que tenham alunos aceitos acima da cota
          atual. A operação ajusta apenas o número de bolsas alocadas; vagas e aceitações já existentes não são
          alteradas.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : surplus.length === 0 && demanda.length === 0 ? (
          <div className="rounded-lg border bg-muted/40 p-4 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum desbalanceamento detectado. Todos os projetos aprovados deste período têm o mesmo número de
              bolsistas aceitos e bolsas alocadas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SurplusTable projetos={surplus} selectedId={fromId} onSelect={setFromId} />
              <DemandaTable projetos={demanda} selectedId={toId} onSelect={setToId} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-lg border p-4 bg-muted/30">
              <div className="text-sm">
                {fromProjeto && toProjeto ? (
                  <span className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{fromProjeto.titulo}</Badge>
                    <ArrowRight className="h-4 w-4" />
                    <Badge variant="outline">{toProjeto.titulo}</Badge>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Selecione um projeto de origem (esquerda) e destino (direita) para transferir 1 bolsa.
                  </span>
                )}
              </div>
              <Button onClick={() => setConfirmOpen(true)} disabled={!canTransfer}>
                Transferir 1 bolsa
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar redistribuição</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Transferir <strong>1 bolsa</strong> do projeto:
                </p>
                {fromProjeto && (
                  <div className="rounded-md border p-2 text-sm">
                    <div className="font-medium">{fromProjeto.titulo}</div>
                    <div className="text-muted-foreground">
                      {fromProjeto.bolsasDisponibilizadas} → {fromProjeto.bolsasDisponibilizadas - 1} bolsa(s)
                    </div>
                  </div>
                )}
                <p>para o projeto:</p>
                {toProjeto && (
                  <div className="rounded-md border p-2 text-sm">
                    <div className="font-medium">{toProjeto.titulo}</div>
                    <div className="text-muted-foreground">
                      {toProjeto.bolsasDisponibilizadas} → {toProjeto.bolsasDisponibilizadas + 1} bolsa(s)
                    </div>
                    {toProjeto.proximoAluno && (
                      <div className="text-xs mt-1">
                        Aluno beneficiado: <strong>{toProjeto.proximoAluno.nome}</strong>
                        {toProjeto.proximoAluno.notaFinal !== null && ` (nota ${toProjeto.proximoAluno.notaFinal.toFixed(2)})`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRedistribuindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isRedistribuindo}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

interface SurplusTableProps {
  projetos: ProjetoSurplus[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}

function SurplusTable({ projetos, selectedId, onSelect }: SurplusTableProps) {
  return (
    <div className="rounded-lg border">
      <div className="px-4 py-2 border-b bg-muted/40">
        <h4 className="font-medium text-sm">Projetos com bolsa em surplus (origem)</h4>
        <p className="text-xs text-muted-foreground">Bolsas alocadas mas não preenchidas</p>
      </div>
      {projetos.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Nenhum projeto com surplus.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Projeto</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead className="text-right">Aloc/Aceitos</TableHead>
              <TableHead className="text-right">Surplus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projetos.map((p) => (
              <TableRow
                key={p.projetoId}
                className={selectedId === p.projetoId ? "bg-primary/10" : "cursor-pointer"}
                onClick={() => onSelect(selectedId === p.projetoId ? null : p.projetoId)}
              >
                <TableCell>
                  <input
                    type="radio"
                    checked={selectedId === p.projetoId}
                    onChange={() => onSelect(p.projetoId)}
                    aria-label={`Selecionar origem ${p.titulo}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{p.titulo}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.professor}</TableCell>
                <TableCell className="text-right text-sm">
                  {p.bolsasDisponibilizadas}/{p.bolsistasAceitos}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">+{p.surplus}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

interface DemandaTableProps {
  projetos: ProjetoDemanda[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}

function DemandaTable({ projetos, selectedId, onSelect }: DemandaTableProps) {
  return (
    <div className="rounded-lg border">
      <div className="px-4 py-2 border-b bg-muted/40">
        <h4 className="font-medium text-sm">Projetos com demanda (destino)</h4>
        <p className="text-xs text-muted-foreground">Alunos aceitos acima da cota atual</p>
      </div>
      {projetos.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Nenhum projeto com demanda.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Projeto</TableHead>
              <TableHead>Próximo aluno</TableHead>
              <TableHead className="text-right">Aloc/Aceitos</TableHead>
              <TableHead className="text-right">Demanda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projetos.map((p) => {
              const limiteAtingido = p.bolsasDisponibilizadas + 1 > p.bolsasSolicitadas
              return (
                <TableRow
                  key={p.projetoId}
                  className={
                    limiteAtingido
                      ? "opacity-50 cursor-not-allowed"
                      : selectedId === p.projetoId
                        ? "bg-primary/10"
                        : "cursor-pointer"
                  }
                  onClick={() => {
                    if (!limiteAtingido) onSelect(selectedId === p.projetoId ? null : p.projetoId)
                  }}
                >
                  <TableCell>
                    <input
                      type="radio"
                      checked={selectedId === p.projetoId}
                      onChange={() => onSelect(p.projetoId)}
                      disabled={limiteAtingido}
                      aria-label={`Selecionar destino ${p.titulo}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{p.titulo}</div>
                    <div className="text-xs text-muted-foreground">{p.professor}</div>
                    {limiteAtingido && (
                      <div className="text-xs text-amber-600 mt-1">Limite do professor atingido</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.proximoAluno ? (
                      <>
                        <div>{p.proximoAluno.nome}</div>
                        {p.proximoAluno.notaFinal !== null && (
                          <div className="text-xs text-muted-foreground">
                            nota {p.proximoAluno.notaFinal.toFixed(2)}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {p.bolsasDisponibilizadas}/{p.bolsistasAceitos}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">−{p.demanda}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
