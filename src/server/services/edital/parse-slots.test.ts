import { describe, expect, it, vi } from 'vitest'
import { parseSlots } from './parse-slots'

vi.mock('@/utils/logger', () => ({
  logger: {
    child: () => ({
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

describe('parseSlots', () => {
  describe('retorna array vazio para entradas inválidas', () => {
    it('retorna [] para null', () => {
      expect(parseSlots(null)).toEqual([])
    })

    it('retorna [] para string vazia', () => {
      expect(parseSlots('')).toEqual([])
    })

    it('retorna [] para JSON inválido', () => {
      expect(parseSlots('not-valid-json')).toEqual([])
    })

    it('retorna [] para JSON que não é array', () => {
      expect(parseSlots(JSON.stringify({ data: '2025-03-15', horario: '14:00-16:00' }))).toEqual([])
    })

    it('retorna [] para array vazio', () => {
      expect(parseSlots(JSON.stringify([]))).toEqual([])
    })
  })

  describe('formato novo (array de objetos)', () => {
    it('parseia array de SlotDataHorario válidos', () => {
      const input = [
        { data: '2025-03-15', horario: '14:00-16:00' },
        { data: '2025-03-17', horario: '10:00-12:00' },
      ]
      expect(parseSlots(JSON.stringify(input))).toEqual(input)
    })

    it('filtra objetos sem campo data', () => {
      const input = [
        { data: '2025-03-15', horario: '14:00-16:00' },
        { horario: '10:00-12:00' },
      ]
      expect(parseSlots(JSON.stringify(input))).toEqual([{ data: '2025-03-15', horario: '14:00-16:00' }])
    })

    it('filtra objetos sem campo horario', () => {
      const input = [
        { data: '2025-03-15', horario: '14:00-16:00' },
        { data: '2025-03-17' },
      ]
      expect(parseSlots(JSON.stringify(input))).toEqual([{ data: '2025-03-15', horario: '14:00-16:00' }])
    })

    it('filtra objetos com campos vazios', () => {
      const input = [
        { data: '2025-03-15', horario: '14:00-16:00' },
        { data: '', horario: '10:00-12:00' },
        { data: '2025-03-17', horario: '' },
      ]
      expect(parseSlots(JSON.stringify(input))).toEqual([{ data: '2025-03-15', horario: '14:00-16:00' }])
    })

    it('filtra valores null no array', () => {
      const input = [{ data: '2025-03-15', horario: '14:00-16:00' }, null]
      expect(parseSlots(JSON.stringify(input))).toEqual([{ data: '2025-03-15', horario: '14:00-16:00' }])
    })
  })

  describe('formato legado (array de strings)', () => {
    it('converte array de strings "data horario" para objetos', () => {
      const input = ['2025-03-15 14:00-16:00', '2025-03-17 10:00-12:00']
      expect(parseSlots(JSON.stringify(input))).toEqual([
        { data: '2025-03-15', horario: '14:00-16:00' },
        { data: '2025-03-17', horario: '10:00-12:00' },
      ])
    })

    it('lida com string sem espaço (somente data)', () => {
      const input = ['2025-03-15']
      expect(parseSlots(JSON.stringify(input))).toEqual([{ data: '2025-03-15', horario: '' }])
    })

    it('lida com string vazia no array legado', () => {
      const input = ['']
      expect(parseSlots(JSON.stringify(input))).toEqual([{ data: '', horario: '' }])
    })
  })
})
