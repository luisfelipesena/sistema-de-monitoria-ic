"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import { SignatureModal } from "./SignatureModal"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface InteractivePDFViewerProps {
  pdfUrl: string
  onSign: () => void
  onSignatureConfirm: (signature: string) => void
  isSigning: boolean
  isLoading: boolean
  documentTitle?: string
}

export function InteractivePDFViewer({
  pdfUrl,
  onSign,
  onSignatureConfirm,
  isSigning,
  isLoading,
  documentTitle = "Visualizar Documento",
}: InteractivePDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [isSignatureModalOpen, setSignatureModalOpen] = useState(false)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const handleSignatureConfirm = (signature: string) => {
    onSignatureConfirm(signature)
    setSignatureModalOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{documentTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Carregando documento...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="border rounded-md overflow-auto w-full max-h-[70vh]">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<Loader2 className="animate-spin" />}
              >
                <Page pageNumber={pageNumber} scale={scale} />
              </Document>
            </div>
            {numPages && (
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setScale(scale - 0.1)} disabled={scale <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span>
                  Página {pageNumber} de {numPages}
                </span>
                <Button variant="outline" onClick={() => setScale(scale + 0.1)} disabled={scale >= 2.5}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => (window.location.href = pdfUrl)}>
          Abrir em nova aba
        </Button>
        <Button onClick={() => setSignatureModalOpen(true)} disabled={isSigning}>
          {isSigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Assinar Documento
        </Button>
      </CardFooter>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
      />
    </Card>
  )
}
