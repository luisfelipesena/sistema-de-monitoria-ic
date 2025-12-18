import { api } from '@/utils/api'
import { useToast } from '@/hooks/use-toast'
import type { TipoRelatorio } from '@/types'

interface UseRelatorioExportParams {
  ano: number
  semestre: 'SEMESTRE_1' | 'SEMESTRE_2'
}

export function useRelatorioExport({ ano, semestre }: UseRelatorioExportParams) {
  const { toast } = useToast()

  const exportXlsxMutation = api.relatorios.exportRelatorioXlsx.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Sucesso!',
        description: 'Relatório exportado com sucesso!',
      })

      if (data.downloadUrl && data.fileName) {
        try {
          const link = document.createElement('a')
          link.setAttribute('href', data.downloadUrl)
          link.setAttribute('download', data.fileName)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } catch (error) {
          toast({
            title: 'Erro',
            description: 'Erro ao processar download do arquivo',
            variant: 'destructive',
          })
          console.error('Erro no download:', error)
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const handleExport = (tipo: TipoRelatorio) => {
    exportXlsxMutation.mutate({
      tipo,
      ano,
      semestre,
    })
  }

  return {
    handleExport,
    isExporting: exportXlsxMutation.isPending,
  }
}
