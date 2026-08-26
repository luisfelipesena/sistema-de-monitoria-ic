import type { Projeto } from '@/server/db/schema'
import { parseSlots } from '@/server/services/edital/parse-slots'
import type { SelecaoSchedule } from '@/types'

type SelecaoSource = Pick<
  Projeto,
  'datasSelecaoEscolhidas' | 'dataSelecaoEscolhida' | 'horarioSelecao' | 'localSelecao'
>

export function getSelecaoSchedule(projeto: SelecaoSource): SelecaoSchedule {
  const datas = parseSlots(projeto.datasSelecaoEscolhidas)

  if (datas.length === 0 && projeto.dataSelecaoEscolhida && projeto.horarioSelecao) {
    datas.push({
      data: projeto.dataSelecaoEscolhida.toISOString().split('T')[0],
      horario: projeto.horarioSelecao,
    })
  }

  return {
    datas,
    local: projeto.localSelecao?.trim() || null,
  }
}
