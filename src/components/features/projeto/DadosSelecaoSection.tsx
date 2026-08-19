"use client"

import { SlotSelectionModal } from "@/components/features/projeto/SlotSelectionModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import type { SlotDataHorario } from "@/types/selecao-inputs"
import { api } from "@/utils/api"
import { BookOpen, Calendar, CheckCircle2, Clock, Edit2, Info, Loader2, Save, Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface DadosSelecaoSectionProps {
  projetoId: number
}

export function DadosSelecaoSection({ projetoId }: DadosSelecaoSectionProps) {
  const { toast } = useToast()
  const apiUtils = api.useUtils()

  const { data: selecaoInfo, isLoading, error } = api.selecao.getProjetoSelecaoInfo.useQuery(
    { projetoId },
    { refetchOnWindowFocus: false, retry: false }
  )

  const [voluntarios, setVoluntarios] = useState<number>(0)
  const [pontosProva, setPontosProva] = useState<string>("")
  const [bibliografia, setBibliografia] = useState<string>("")
  const [slotModalOpen, setSlotModalOpen] = useState(false)

  const [voluntariosDirty, setVoluntariosDirty] = useState(false)
  const [pontosProvaDirty, setPontosProvaDirty] = useState(false)
  const [bibliografiaDirty, setBibliografiaDirty] = useState(false)

  useEffect(() => {
    if (selecaoInfo) {
      if (!voluntariosDirty) setVoluntarios(selecaoInfo.voluntariosSolicitados)
      if (!pontosProvaDirty) setPontosProva(selecaoInfo.pontosProva ?? "")
      if (!bibliografiaDirty) setBibliografia(selecaoInfo.bibliografia ?? "")
    }
  }, [selecaoInfo, voluntariosDirty, pontosProvaDirty, bibliografiaDirty])

  const chooseSlotsMutation = api.selecao.chooseSelecaoSlots.useMutation({
    onSuccess: async () => {
      toast({ title: "Datas da seleção definidas com sucesso" })
      await apiUtils.selecao.getProjetoSelecaoInfo.invalidate({ projetoId })
      await apiUtils.projeto.getProjetos.invalidate()
    },
    onError: (error) => {
      toast({ title: "Erro ao definir datas", description: error.message, variant: "destructive" })
    },
  })

  const updateVoluntariosMutation = api.selecao.updateVoluntarios.useMutation({
    onSuccess: async () => {
      toast({ title: "Voluntários atualizado com sucesso" })
      setVoluntariosDirty(false)
      await apiUtils.selecao.getProjetoSelecaoInfo.invalidate({ projetoId })
      await apiUtils.projeto.getProjetos.invalidate()
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar voluntários", description: error.message, variant: "destructive" })
    },
  })

  const updateSelecaoDataMutation = api.selecao.updateSelecaoData.useMutation({
    onSuccess: async () => {
      toast({ title: "Dados da seleção salvos com sucesso" })
      setPontosProvaDirty(false)
      setBibliografiaDirty(false)
      await apiUtils.selecao.getProjetoSelecaoInfo.invalidate({ projetoId })
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar dados", description: error.message, variant: "destructive" })
    },
  })

  const confirmVoluntariosMutation = api.selecao.confirmVoluntarios.useMutation({
    onSuccess: async () => {
      toast({ title: "Voluntários confirmados com sucesso!" })
      setVoluntariosDirty(false)
      await apiUtils.selecao.getProjetoSelecaoInfo.invalidate({ projetoId })
      await apiUtils.projeto.getProjetos.invalidate()
    },
    onError: (error) => {
      toast({ title: "Erro ao confirmar voluntários", description: error.message, variant: "destructive" })
    },
  })

  const confirmDadosEditalMutation = api.selecao.confirmDadosEdital.useMutation({
    onSuccess: async () => {
      toast({ title: "Dados confirmados para o edital!", description: "Datas, pontos de prova, bibliografia e voluntários foram confirmados." })
      await apiUtils.selecao.getProjetoSelecaoInfo.invalidate({ projetoId })
      await apiUtils.projeto.getProjetos.invalidate()
    },
    onError: (error) => {
      toast({ title: "Erro ao confirmar dados para o edital", description: error.message, variant: "destructive" })
    },
  })

  const handleSlotsConfirm = useCallback(
    (slots: SlotDataHorario[]) => {
      chooseSlotsMutation.mutate({ projetoId, slots })
      setSlotModalOpen(false)
    },
    [projetoId, chooseSlotsMutation]
  )

  const handleSaveVoluntarios = useCallback(() => {
    updateVoluntariosMutation.mutate({ projetoId, voluntariosSolicitados: voluntarios })
  }, [projetoId, voluntarios, updateVoluntariosMutation])

  const handleConfirmVoluntarios = useCallback(() => {
    confirmVoluntariosMutation.mutate({ projetoId })
  }, [projetoId, confirmVoluntariosMutation])

  const handleConfirmDadosEdital = useCallback(() => {
    confirmDadosEditalMutation.mutate({ projetoId })
  }, [projetoId, confirmDadosEditalMutation])

  const handleSaveSelecaoData = useCallback(() => {
    // Validate locally: pontos de prova and bibliografia cannot be empty
    if (pontosProvaDirty && !pontosProva.trim()) {
      toast({ title: "Pontos de prova obrigatórios", description: "Os pontos de prova não podem ficar vazios.", variant: "destructive" })
      return
    }
    if (bibliografiaDirty && !bibliografia.trim()) {
      toast({ title: "Bibliografia obrigatória", description: "A bibliografia não pode ficar vazia.", variant: "destructive" })
      return
    }

    updateSelecaoDataMutation.mutate({
      projetoId,
      pontosProva: pontosProvaDirty ? pontosProva : undefined,
      bibliografia: bibliografiaDirty ? bibliografia : undefined,
    })
  }, [projetoId, pontosProva, bibliografia, pontosProvaDirty, bibliografiaDirty, updateSelecaoDataMutation, toast])

  if (isLoading) {
    return (
      <Card className="mt-3">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando dados da seleção...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3 mt-3">
        <Info className="h-4 w-4 text-red-600 shrink-0" />
        <p className="text-sm text-red-800">
          Erro ao carregar dados da seleção: {error.message}
        </p>
      </div>
    )
  }

  if (!selecaoInfo || !selecaoInfo.hasEditalInterno) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 mt-3">
        <Info className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          Este projeto ainda não está vinculado a um edital interno. Entre em contato com a coordenação para verificar.
        </p>
      </div>
    )
  }

  const hasRange = !!selecaoInfo.rangeSelecao
  const hasSlots = selecaoInfo.slotsDisponiveis.length > 0
  const canChoose = hasRange || hasSlots
  const currentSelections: SlotDataHorario[] = selecaoInfo.datasSelecaoEscolhidas ?? []

  const formatDateShort = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-")
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const formatDateLong = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-")
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(date)
  }

  return (
    <>
      <div className="space-y-5">
          {/* ── Bloco 1: Range do Admin + Datas escolhidas ── */}
          <div className="space-y-3">
            {selecaoInfo.rangeSelecao && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Período disponível para seleção</p>
                  <p className="text-blue-700 mt-0.5">
                    {formatDateShort(selecaoInfo.rangeSelecao.dataInicio)} a {formatDateShort(selecaoInfo.rangeSelecao.dataFim)}
                    {selecaoInfo.rangeSelecao.horarioInicio && selecaoInfo.rangeSelecao.horarioFim && (
                      <span> · {selecaoInfo.rangeSelecao.horarioInicio} às {selecaoInfo.rangeSelecao.horarioFim}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Data escolhida pelo professor */}
            {currentSelections.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sua data escolhida
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSlotModalOpen(true)}
                    disabled={!canChoose}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Alterar
                  </Button>
                </div>
                <div className="grid gap-1.5">
                  {currentSelections.map((slot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{formatDateLong(slot.data)}</span>
                      <span className="text-muted-foreground">às</span>
                      <span className="font-medium">{slot.horario}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-3">
                <p className="text-sm text-muted-foreground">Nenhuma data de seleção definida ainda</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSlotModalOpen(true)}
                          disabled={!canChoose}
                        >
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Escolher Datas
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canChoose && (
                      <TooltipContent>
                        <p>As datas ainda não foram definidas pelo Admin</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Bloco 2: Vagas ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Vagas
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor={`bolsistas-${projetoId}`} className="text-xs text-muted-foreground">
                  Bolsistas
                </Label>
                <Input
                  id={`bolsistas-${projetoId}`}
                  type="number"
                  value={selecaoInfo.bolsasDisponibilizadas}
                  readOnly
                  disabled
                  className="h-9 bg-muted text-center font-medium"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`voluntarios-${projetoId}`} className="text-xs text-muted-foreground">
                  Voluntários
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    id={`voluntarios-${projetoId}`}
                    type="number"
                    min={0}
                    value={voluntarios}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setVoluntarios(isNaN(val) ? 0 : val)
                      setVoluntariosDirty(true)
                    }}
                    className="h-9 text-center font-medium"
                  />
                  {voluntariosDirty && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSaveVoluntarios}
                      disabled={updateVoluntariosMutation.isPending}
                      className="h-9 w-9 shrink-0"
                    >
                      {updateVoluntariosMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation status + button */}
            {selecaoInfo.voluntariosConfirmados ? (
              <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-800 font-medium">Voluntários confirmados</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                <p className="text-xs text-amber-800">
                  Confirme o número de voluntários para que apareça no edital.
                </p>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleConfirmVoluntarios}
                  disabled={confirmVoluntariosMutation.isPending || voluntariosDirty}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700"
                >
                  {confirmVoluntariosMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : null}
                  Confirmar
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Bloco 3: Conteúdo da Prova ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Conteúdo da Prova
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`pontos-${projetoId}`} className="text-xs text-muted-foreground">
                Pontos de Prova
              </Label>
              <Textarea
                id={`pontos-${projetoId}`}
                value={pontosProva}
                onChange={(e) => {
                  setPontosProva(e.target.value)
                  setPontosProvaDirty(true)
                }}
                placeholder="Insira cada tópico em uma linha separada..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`bibliografia-${projetoId}`} className="text-xs text-muted-foreground">
                Bibliografia
              </Label>
              <Textarea
                id={`bibliografia-${projetoId}`}
                value={bibliografia}
                onChange={(e) => {
                  setBibliografia(e.target.value)
                  setBibliografiaDirty(true)
                }}
                placeholder="Insira cada referência em uma linha separada..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {(pontosProvaDirty || bibliografiaDirty) && (
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={handleSaveSelecaoData}
                  disabled={updateSelecaoDataMutation.isPending}
                >
                  {updateSelecaoDataMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Salvar
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Bloco 4: Confirmação para o Edital ── */}
          {selecaoInfo.dadosEditalConfirmados ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <span className="text-sm text-green-800 font-semibold">Dados confirmados para o Edital</span>
                <p className="text-xs text-green-700 mt-0.5">
                  Datas, pontos de prova, bibliografia e voluntários estão confirmados e aparecerão no edital publicado.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Ao confirmar, as datas/horários da seleção, pontos de prova, bibliografia e voluntários serão publicados no edital.
                </p>

                {/* Checklist de pendências */}
                <ul className="space-y-1.5 mb-4">
                  <li className={`flex items-center gap-2 text-xs ${currentSelections.length >= 1 ? "text-green-700" : "text-red-600"}`}>
                    {currentSelections.length >= 1 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    Data/horário de seleção escolhido
                  </li>
                  <li className={`flex items-center gap-2 text-xs ${pontosProva.trim() ? "text-green-700" : "text-red-600"}`}>
                    {pontosProva.trim() ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    Pontos de prova preenchidos
                  </li>
                  <li className={`flex items-center gap-2 text-xs ${bibliografia.trim() ? "text-green-700" : "text-red-600"}`}>
                    {bibliografia.trim() ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    Bibliografia preenchida
                  </li>
                  <li className={`flex items-center gap-2 text-xs ${selecaoInfo.voluntariosConfirmados ? "text-green-700" : "text-red-600"}`}>
                    {selecaoInfo.voluntariosConfirmados ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    Voluntários confirmados
                  </li>
                </ul>

                <Button
                  variant="default"
                  onClick={handleConfirmDadosEdital}
                  disabled={
                    confirmDadosEditalMutation.isPending ||
                    currentSelections.length < 1 ||
                    !pontosProva.trim() ||
                    !bibliografia.trim() ||
                    !selecaoInfo.voluntariosConfirmados ||
                    pontosProvaDirty ||
                    bibliografiaDirty ||
                    voluntariosDirty
                  }
                  className="w-full sm:w-auto"
                >
                  {confirmDadosEditalMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Confirmar para o Edital
                </Button>
              </div>
            </div>
          )}
        </div>

      {/* Modal */}
      <SlotSelectionModal
        open={slotModalOpen}
        onOpenChange={setSlotModalOpen}
        rangeSelecao={selecaoInfo.rangeSelecao}
        currentSelections={currentSelections}
        onConfirm={handleSlotsConfirm}
        isLoading={chooseSlotsMutation.isPending}
      />
    </>
  )
}
