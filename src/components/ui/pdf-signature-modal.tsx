"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Pen, RotateCcw } from "lucide-react"
import { PDFDocument, rgb } from "pdf-lib"
import { useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"

interface PdfSignatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfUrl: string
  onSignComplete: (signedPdfBlob: Blob) => void
  title?: string
  description?: string
}

export function PdfSignatureModal({
  open,
  onOpenChange,
  pdfUrl,
  onSignComplete,
  title = "Assinar Documento",
  description = "Por favor, desenhe sua assinatura abaixo:",
}: PdfSignatureModalProps) {
  const signatureRef = useRef<SignatureCanvas>(null)
  const [isSigning, setIsSigning] = useState(false)

  const clearSignature = () => {
    signatureRef.current?.clear()
  }

  const { toast } = useToast()

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast({
        title: "Erro",
        description: "Por favor, desenhe sua assinatura antes de continuar",
        variant: "destructive",
      })
      return
    }

    setIsSigning(true)
    try {
      // Get signature as data URL
      const signatureDataUrl = signatureRef.current.toDataURL("image/png")

      // Fetch the PDF
      const pdfResponse = await fetch(pdfUrl)
      const pdfBytes = await pdfResponse.arrayBuffer()

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1]

      // Convert signature to PDF image
      const signatureImageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer())
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes)

      // Calculate signature dimensions and position
      const signatureWidth = 180
      const signatureHeight = 50
      const pageWidth = lastPage.getWidth()

      // Position signature in the designated signature area
      const x = pageWidth - signatureWidth - 20
      const y = 60

      // Draw the signature
      lastPage.drawImage(signatureImage, {
        x,
        y,
        width: signatureWidth,
        height: signatureHeight,
      })

      // Add signature date
      lastPage.drawText(new Date().toLocaleDateString("pt-BR"), {
        x: x + signatureWidth / 2 - 30,
        y: y - 15,
        size: 10,
        color: rgb(0, 0, 0),
      })

      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save()
      const signedPdfBlob = new Blob([new Uint8Array(signedPdfBytes)], { type: "application/pdf" })

      // Call the completion handler
      onSignComplete(signedPdfBlob)

      toast({
        title: "Sucesso!",
        description: "Documento assinado com sucesso!",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao assinar documento:", error)
      toast({
        title: "Erro",
        description: "Erro ao assinar o documento. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: 550,
                height: 200,
                className: "signature-canvas",
              }}
              backgroundColor="white"
            />
          </div>

          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={clearSignature} disabled={isSigning}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSigning}>
                Cancelar
              </Button>

              <Button type="button" onClick={handleSign} disabled={isSigning}>
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <Pen className="w-4 h-4 mr-2" />
                    Assinar Documento
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <style>{`
          .signature-canvas {
            touch-action: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
