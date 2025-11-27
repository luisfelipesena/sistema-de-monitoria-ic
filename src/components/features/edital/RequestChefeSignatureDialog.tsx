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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, Loader2, Send } from "lucide-react"
import { useState } from "react"

interface RequestChefeSignatureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editalNumero: string
  editalTitulo: string
  onConfirm: (chefeEmail: string, chefeNome?: string) => Promise<void>
  isLoading?: boolean
}

export function RequestChefeSignatureDialog({
  open,
  onOpenChange,
  editalNumero,
  editalTitulo,
  onConfirm,
  isLoading = false,
}: RequestChefeSignatureDialogProps) {
  const [chefeEmail, setChefeEmail] = useState("")
  const [chefeNome, setChefeNome] = useState("")
  const [error, setError] = useState("")

  const handleConfirm = async () => {
    setError("")

    if (!chefeEmail.trim()) {
      setError("Email é obrigatório")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(chefeEmail)) {
      setError("Email inválido")
      return
    }

    try {
      await onConfirm(chefeEmail.trim(), chefeNome.trim() || undefined)
      // Reset form on success
      setChefeEmail("")
      setChefeNome("")
    } catch (err) {
      // Error handled by parent
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setChefeEmail("")
      setChefeNome("")
      setError("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Solicitar Assinatura do Chefe
          </DialogTitle>
          <DialogDescription>
            Envie um link de assinatura para o Chefe do Departamento assinar o edital digitalmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Edital Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm">
              <span className="font-medium">Edital:</span> {editalNumero}
            </p>
            <p className="text-sm text-muted-foreground">{editalTitulo}</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chefeEmail">
                Email do Chefe do Departamento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="chefeEmail"
                type="email"
                placeholder="chefe@ufba.br"
                value={chefeEmail}
                onChange={(e) => {
                  setChefeEmail(e.target.value)
                  setError("")
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chefeNome">Nome do Chefe (opcional)</Label>
              <Input
                id="chefeNome"
                placeholder="Prof. Dr. Nome Completo"
                value={chefeNome}
                onChange={(e) => setChefeNome(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                O nome será usado na saudação do email e no documento assinado.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Como funciona:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Um email será enviado com link exclusivo para assinatura</li>
                <li>O link expira em <strong>72 horas</strong></li>
                <li>Após a assinatura, você poderá publicar o edital</li>
                <li>Se necessário, você pode reenviar a solicitação</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
