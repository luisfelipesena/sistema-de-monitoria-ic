"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface BankFormData {
  banco: string
  agencia: string
  conta: string
  digitoConta: string
}

interface StudentProfile {
  nomeCompleto: string
  matricula: string | null
  cpf: string | null
  cr: number | null
  cursoNome: string | null
  telefone?: string | null
  banco?: string | null
  agencia?: string | null
  conta?: string | null
  digitoConta?: string | null
}

interface BankDataModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentData?: StudentProfile | null
}

export function BankDataModal({ open, onClose, onSuccess, currentData }: BankDataModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<BankFormData>({
    banco: "",
    agencia: "",
    conta: "",
    digitoConta: "",
  })

  const utils = api.useUtils()
  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Dados bancários salvos",
        description: "Agora você pode aceitar a bolsa.",
      })
      utils.user.getProfile.invalidate()
      onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    if (currentData) {
      setFormData({
        banco: currentData.banco || "",
        agencia: currentData.agencia || "",
        conta: currentData.conta || "",
        digitoConta: currentData.digitoConta || "",
      })
    }
  }, [currentData])

  const handleSave = () => {
    if (!formData.banco || !formData.agencia || !formData.conta) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha banco, agência e conta.",
        variant: "destructive",
      })
      return
    }

    if (!currentData) {
      toast({
        title: "Erro",
        description: "Dados do perfil não encontrados.",
        variant: "destructive",
      })
      return
    }

    // Passa todos os campos obrigatórios + dados bancários atualizados
    updateProfileMutation.mutate({
      studentData: {
        nomeCompleto: currentData.nomeCompleto,
        matricula: currentData.matricula || "",
        cpf: currentData.cpf || "",
        cr: currentData.cr || 0,
        cursoNome: currentData.cursoNome || undefined,
        telefone: currentData.telefone || undefined,
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta,
        digitoConta: formData.digitoConta || undefined,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dados Bancários</DialogTitle>
          <DialogDescription>
            Para receber a bolsa, preencha seus dados bancários. Esta informação é obrigatória para bolsistas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="banco">Banco *</Label>
            <Input
              id="banco"
              value={formData.banco}
              onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              placeholder="Ex: Banco do Brasil, Caixa, Itaú..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="agencia">Agência *</Label>
              <Input
                id="agencia"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="Ex: 1234-5"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conta">Conta *</Label>
              <Input
                id="conta"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                placeholder="Ex: 12345-6"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="digitoConta">Dígito (se houver)</Label>
            <Input
              id="digitoConta"
              value={formData.digitoConta}
              onChange={(e) => setFormData({ ...formData, digitoConta: e.target.value })}
              placeholder="Ex: 7"
              maxLength={2}
              className="w-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e Aceitar Bolsa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
