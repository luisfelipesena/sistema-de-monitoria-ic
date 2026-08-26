import { describe, expect, it } from 'vitest'
import { getSelecaoSchedule } from './selecao-schedule'

describe('getSelecaoSchedule', () => {
  it('returns the selected slots and trims the location', () => {
    expect(
      getSelecaoSchedule({
        datasSelecaoEscolhidas: JSON.stringify([{ data: '2026-08-26', horario: '14:00' }]),
        dataSelecaoEscolhida: null,
        horarioSelecao: null,
        localSelecao: '  Sala 123, PAF I  ',
      })
    ).toEqual({
      datas: [{ data: '2026-08-26', horario: '14:00' }],
      local: 'Sala 123, PAF I',
    })
  })

  it('falls back to the legacy date and keeps a pending location explicit', () => {
    expect(
      getSelecaoSchedule({
        datasSelecaoEscolhidas: null,
        dataSelecaoEscolhida: new Date('2026-08-27T00:00:00.000Z'),
        horarioSelecao: '09:00',
        localSelecao: null,
      })
    ).toEqual({
      datas: [{ data: '2026-08-27', horario: '09:00' }],
      local: null,
    })
  })
})
