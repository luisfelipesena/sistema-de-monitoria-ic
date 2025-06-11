'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'

interface PDFDownloadWrapperProps {
  pdfData: any
  fileName: string
  buttonText?: string
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function PDFDownloadWrapper({
  pdfData,
  fileName,
  buttonText = 'Baixar PDF',
  disabled = false,
  size = 'default'
}: PDFDownloadWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)
  const [TermoCompromisso, setTermoCompromisso] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Carregar dinamicamente apenas no cliente
    const loadPDFComponents = async () => {
      try {
        const { PDFDownloadLink: PDFLink } = await import('@react-pdf/renderer')
        const TermoModule = await import('@/server/lib/pdfTemplates/termo-compromisso')
        
        setPDFDownloadLink(() => PDFLink)
        setTermoCompromisso(() => TermoModule.default)
      } catch (error) {
        console.error('Error loading PDF components:', error)
      }
    }

    loadPDFComponents()
  }, [])

  if (!isClient || !PDFDownloadLink || !TermoCompromisso) {
    return (
      <Button variant="outline" disabled size={size}>
        <FileText className="h-4 w-4 mr-1" />
        Carregando...
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<TermoCompromisso data={pdfData} />}
      fileName={fileName}
    >
      {({ loading }: { loading: boolean }) => (
        <Button variant="outline" disabled={loading || disabled} size={size}>
          <Download className="h-4 w-4 mr-1" />
          {loading ? 'Gerando...' : buttonText}
        </Button>
      )}
    </PDFDownloadLink>
  )
}