import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { useState } from 'react'

export function useFileAccess(_fileId: string, _action: 'view' | 'download' = 'view') {
  return api.file.getPresignedUrlMutation.useMutation()
}

export function useFileUpload() {
  return api.file.getPresignedUrlMutation.useMutation()
}

export function useFileDelete() {
  return api.file.deleteFileMutation.useMutation()
}

export function useEditalPdf() {
  return api.edital.generateEditalPdf.useMutation()
}

export function useViewFile() {
  const { toast } = useToast()
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null)
  const getPresignedUrl = api.file.getPresignedUrlMutation.useMutation()

  // A aba tem que abrir dentro do gesto do usuário: depois do await o navegador bloqueia o popup
  const viewFile = async (fileId: string, label = 'arquivo') => {
    const tab = window.open('', '_blank')
    tab?.document.write(`Carregando ${label}...`)
    setLoadingFileId(fileId)

    try {
      const url = await getPresignedUrl.mutateAsync({ fileId, action: 'view' })
      if (tab) {
        tab.location.href = url
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      tab?.close()
      toast({
        title: `Erro ao abrir ${label}`,
        description: error instanceof Error ? error.message : `Não foi possível carregar o ${label}.`,
        variant: 'destructive',
      })
    } finally {
      setLoadingFileId(null)
    }
  }

  return { viewFile, loadingFileId }
}
