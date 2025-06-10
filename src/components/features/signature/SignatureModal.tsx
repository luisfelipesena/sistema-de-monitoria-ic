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
import { Eraser, Save } from "lucide-react"
import { useRef } from "react"
import SignatureCanvas from "react-signature-canvas"
import { toast } from "sonner"

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (signature: string) => void
  title?: string
  description?: string
}

export function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Assinar Documento",
  description = "Desenhe sua assinatura no campo abaixo. Ela será salva e vinculada a este documento.",
}: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)

  const clearSignature = () => {
    sigCanvas.current?.clear()
  }

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error("A assinatura não pode estar vazia.")
      return
    }
    const signatureImage = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png")
    if (signatureImage) {
      onConfirm(signatureImage)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="w-full h-48 border border-gray-300 rounded-md">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              className: "w-full h-full",
            }}
          />
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="ghost" onClick={clearSignature}>
            <Eraser className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={saveSignature}>
            <Save className="mr-2 h-4 w-4" />
            Confirmar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
