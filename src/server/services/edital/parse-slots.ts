import type { SlotDataHorario } from '@/types/selecao-inputs'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'parseSlots' })

/**
 * Deserializa o campo `datasProvasDisponiveis` do banco (TEXT/JSON).
 *
 * Aceita dois formatos:
 * - Formato novo: array de objetos `{data, horario}`
 * - Formato legado: array de strings `"YYYY-MM-DD HH:MM-HH:MM"`
 *
 * Retorna array vazio para JSON inválido, null ou dados não-array.
 */
export function parseSlots(raw: string | null): SlotDataHorario[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    if (parsed.length === 0) return []

    // Formato legado: array de strings
    if (typeof parsed[0] === 'string') {
      log.warn({ sampleValue: parsed[0] }, 'Formato legado detectado em datasProvasDisponiveis. Convertendo strings para objetos SlotDataHorario.')
      return parsed.map((s: string) => {
        const [data, horario] = s.split(' ')
        return { data: data || '', horario: horario || '' }
      })
    }

    // Formato novo: array de objetos
    return parsed.filter((s: unknown) => {
      if (typeof s !== 'object' || s === null) return false
      const slot = s as Record<string, unknown>
      return typeof slot.data === 'string' && slot.data && typeof slot.horario === 'string' && slot.horario
    }) as SlotDataHorario[]
  } catch {
    return []
  }
}
