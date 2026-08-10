"use client"

import { SlotSelectionModal } from "@/components/features/projeto/SlotSelectionModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import type { SlotDataHorario } from "@/types/selecao-inputs"
import { api } from "@/utils/api"
import { Calendar, Edit2, Loader2, Save } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface DadosSelecaoSectionProps {
  projetoId: number
}

export function DadosSelecaoSection({ projetoId }: DadosSelecaoSectionProps) {
  const { toast } = useToast()
  const apiUtils = api.useUtils()

  // Query selection info for this project
  const { data: selecaoInfo, isLoading } = api.selecao.getProjetoSelecaoInfo.useQuery(
    { projetoId },
    { refetchOnWindowFocus: false }
  )

  // Local state for editable fields
  const [voluntarios, setVoluntarios] = useState<number>(0)
  const [pontosProva, setPontosProva] = useState<string>("")
  const [bibliografia, setBibliografia] = useState<string>("")
  const [slotModalOpen, setSlotModalOpen] = useState(false)

  // Track if fields have been modified locally
  const [voluntariosDirty, setVoluntariosDirty] = useState(false)
  const [pontosProvaDirty, setPontosProvaDirty] = useState(false)
  const [bibliografiaDirty, setBibliografiaDirty] = useState(false)

  // Sync local state with server data
  useEffect(() => {
    if (selecaoInfo) {
      if (!voluntariosDirty) setVoluntarios(selecaoInfo.voluntariosSolicitados)
      if (!pontosProvaDirty) setPontosProva(selecaoInfo.pontosProva ?? "")
      if (!bibliografiaDirty) setBibliografia(selecaoInfo.bibliografia ?? "")
    }
  }, [selecaoInfo, voluntariosDirty, pontosProvaDirty, bibliografiaDirty])

  // Mutations
  const chooseSlotMutation = api.selecao.chooseSelecaoSlot.useMutation({
    onSuccess: async () => {
      toast({ title: "Data da seleção definida com sucesso" })
      await apiUtils.selecao.getProjetoSelecaoInfo.invalidate({ projetoId })
      await apiUtils.projeto.getProjetos.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao definir data",
        description: error.message,
        variant: "destructive",
      })
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
      toast({
        title: "Erro ao atualizar voluntários",
        description: error.message,
        variant: "destructive",
      })
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
      toast({
        title: "Erro ao salvar dados",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Handlers
  const handleSlotConfirm = useCallback(
    (slot: SlotDataHorario) => {
      chooseSlotMutation.mutate({
        projetoId,
        data: slot.data,
        horario: slot.horario,
      })
      setSlotModalOpen(false)
    },
    [projetoId, chooseSlotMutation]
  )

  const handleSaveVoluntarios = useCallback(() => {
    updateVoluntariosMutation.mutate({
      projetoId,
      voluntariosSolicitados: voluntarios,
    })
  }, [projetoId, voluntarios, updateVoluntariosMutation])

  const handleSaveSelecaoData = useCallback(() => {
    updateSelecaoDataMutation.mutate({
      projetoId,
      pontosProva: pontosProva || undefined,
      bibliografia: bibliografia || undefined,
    })
  }, [projetoId, pontosProva, bibliografia, updateSelecaoDataMutation])

  if (isLoading) {
    return (
      <Card className="mt-3">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando dados da seleção...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!selecaoInfo || !selecaoInfo.hasEditalInterno) {
    return null
  }

  const hasSlots = selecaoInfo.slotsDisponiveis.length > 0
  const currentSelection: SlotDataHorario | undefined =
    selecaoInfo.dataSelecaoEscolhida && selecaoInfo.horarioSelecao
      ? { data: selecaoInfo.dataSelecaoEscolhida, horario: selecaoInfo.horarioSelecao }
      : undefined

  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-")
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  return (
    <>
      <Card className="mt-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dados da Seleção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data/Horário Section */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Data e Horário da Seleção</Label>
            {currentSelection ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {formatDate(currentSelection.data)} — {currentSelection.horario}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSlotModalOpen(true)}
                  disabled={!hasSlots}
                  className="h-7 px-2"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Alterar
                </Button>
              </div>
            ) : (
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSlotModalOpen(true)}
                          disabled={!hasSlots}
                        >
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Definir Data da Seleção
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!hasSlots && (
                      <TooltipContent>
                        <p>As datas ainda não foram definidas pelo Admin</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Bolsistas + Voluntários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`bolsistas-${projetoId}`} className="text-xs font-medium text-muted-foreground">
                Bolsistas
              </Label>
              <Input
                id={`bolsistas-${projetoId}`}
                type="number"
                value={selecaoInfo.bolsasDisponibilizadas}
                readOnly
                disabled
                className="h-8 bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`voluntarios-${projetoId}`} className="text-xs font-medium text-muted-foreground">
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
                  className="h-8"
                />
                {voluntariosDirty && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveVoluntarios}
                    disabled={updateVoluntariosMutation.isPending}
                    className="h-8 px-2"
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

          {/* Pontos de Prova */}
          <div className="space-y-1.5">
            <Label htmlFor={`pontos-${projetoId}`} className="text-xs font-medium text-muted-foreground">
              Pontos de Prova
            </Label>
            <Textarea
              id={`pontos-${projetoId}`}
              value={pontosProva}
              onChange={(e) => {
                setPontosProva(e.target.value)
                setPontosProvaDirty(true)
              }}
              placeholder="Tópicos da prova de seleção..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Bibliografia */}
          <div className="space-y-1.5">
            <Label htmlFor={`bibliografia-${projetoId}`} className="text-xs font-medium text-muted-foreground">
              Bibliografia
            </Label>
            <Textarea
              id={`bibliografia-${projetoId}`}
              value={bibliografia}
              onChange={(e) => {
                setBibliografia(e.target.value)
                setBibliografiaDirty(true)
              }}
              placeholder="Bibliografia recomendada..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Save button for text fields */}
          {(pontosProvaDirty || bibliografiaDirty) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSelecaoData}
                disabled={updateSelecaoDataMutation.isPending}
              >
                {updateSelecaoDataMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Salvar Dados
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slot Selection Modal */}
      <SlotSelectionModal
        open={slotModalOpen}
        onOpenChange={setSlotModalOpen}
        slots={selecaoInfo.slotsDisponiveis}
        currentSelection={currentSelection}
        onConfirm={handleSlotConfirm}
        isLoading={chooseSlotMutation.isPending}
      />
    </>
  )
}
