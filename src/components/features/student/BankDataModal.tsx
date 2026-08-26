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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { BANCOS_BRASIL, validarAgencia, validarConta } from "@/utils/bancos-brasil"
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
  const [errors, setErrors] = useState<Partial<Record<keyof BankFormData, string>>>({})

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

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BankFormData, string>> = {}

    if (!formData.banco) {
      newErrors.banco = "Selecione um banco"
    }

    if (!formData.agencia) {
      newErrors.agencia = "Agência é obrigatória"
    } else if (!validarAgencia(formData.agencia)) {
      newErrors.agencia = "Agência inválida (3-6 dígitos)"
    }

    if (!formData.conta) {
      newErrors.conta = "Conta é obrigatória"
    } else if (!validarConta(formData.conta)) {
      newErrors.conta = "Conta inválida (4-13 dígitos)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    if (!currentData) {
      toast({
        title: "Erro",
        description: "Dados do perfil não encontrados.",
        variant: "destructive",
      })
      return
    }

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
            <Select
              value={formData.banco}
              onValueChange={(value) => {
                setFormData({ ...formData, banco: value })
                setErrors({ ...errors, banco: undefined })
              }}
            >
              <SelectTrigger className={errors.banco ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o banco..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {BANCOS_BRASIL.map((banco) => (
                  <SelectItem key={banco.codigo} value={`${banco.codigo} - ${banco.nome}`}>
                    {banco.codigo} - {banco.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.banco && <p className="text-xs text-red-500">{errors.banco}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="agencia">Agência *</Label>
              <Input
                id="agencia"
                value={formData.agencia}
                onChange={(e) => {
                  setFormData({ ...formData, agencia: e.target.value })
                  setErrors({ ...errors, agencia: undefined })
                }}
                placeholder="Ex: 1234"
                className={errors.agencia ? "border-red-500" : ""}
              />
              {errors.agencia && <p className="text-xs text-red-500">{errors.agencia}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conta">Conta *</Label>
              <Input
                id="conta"
                value={formData.conta}
                onChange={(e) => {
                  setFormData({ ...formData, conta: e.target.value })
                  setErrors({ ...errors, conta: undefined })
                }}
                placeholder="Ex: 12345-6"
                className={errors.conta ? "border-red-500" : ""}
              />
              {errors.conta && <p className="text-xs text-red-500">{errors.conta}</p>}
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
