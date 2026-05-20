import { Semestre } from '@/types'
import { api } from '@/utils/api'
import { keepPreviousData } from '@tanstack/react-query'

export function useConsolidatedMonitoringData(ano: number, semestre: Semestre) {
  return api.relatorios.getConsolidatedMonitoringData.useQuery(
    { ano, semestre },
    {
      placeholderData: keepPreviousData,
    }
  )
}

export function useExportConsolidated() {
  return api.relatorios.exportConsolidated.useMutation()
}

export function useValidateCompleteData(
  ano: number,
  semestre: Semestre,
  tipo: 'ambos' | 'bolsistas' | 'voluntarios',
  enabled: boolean
) {
  return api.relatorios.validateCompleteData.useQuery(
    { ano, semestre, tipo },
    {
      enabled,
    }
  )
}
