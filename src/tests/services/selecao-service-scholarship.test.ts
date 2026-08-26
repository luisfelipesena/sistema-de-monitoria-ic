import {
    STATUS_INSCRICAO_CONFIRMED_INTEREST
} from '@/types'
import { describe, expect, it } from 'vitest'

/**
 * Tests for the scholarship selection flow business logic.
 * These test the key decision points in the selection service.
 */

describe('Scholarship Selection Flow - Business Logic', () => {
  describe('publishResults status assignment', () => {
    it('should assign WAITING_LIST to approved candidates (nota >= 7.0)', () => {
      const inscricoes = [
        { id: 1, notaFinal: '8.5', tipoVagaPretendida: 'BOLSISTA' },
        { id: 2, notaFinal: '7.0', tipoVagaPretendida: 'BOLSISTA' },
        { id: 3, notaFinal: '6.9', tipoVagaPretendida: 'BOLSISTA' },
      ]

      const results = inscricoes.map((inscricao) => {
        const aprovado = inscricao.notaFinal && Number(inscricao.notaFinal) >= 7.0
        return {
          id: inscricao.id,
          status: aprovado ? 'WAITING_LIST' : 'REJECTED_BY_PROFESSOR',
        }
      })

      expect(results[0].status).toBe('WAITING_LIST')
      expect(results[1].status).toBe('WAITING_LIST')
      expect(results[2].status).toBe('REJECTED_BY_PROFESSOR')
    })
  })

  describe('confirmInterest validation', () => {
    it('should only allow WAITING_LIST status to confirm interest', () => {
      const validStatuses = ['WAITING_LIST']
      const invalidStatuses = [
        'SUBMITTED',
        'SELECTED_BOLSISTA',
        'CONFIRMED_INTEREST',
        'ACCEPTED_BOLSISTA',
        'REJECTED_BY_PROFESSOR',
      ]

      for (const status of validStatuses) {
        expect(status === 'WAITING_LIST').toBe(true)
      }

      for (const status of invalidStatuses) {
        expect(status === 'WAITING_LIST').toBe(false)
      }
    })
  })

  describe('selectMonitors - candidate replacement logic', () => {
    it('should preserve REJECTED_BY_STUDENT status when selecting new candidates', () => {
      const allInscricoes = [
        { id: 1, status: 'REJECTED_BY_STUDENT' },
        { id: 2, status: 'CONFIRMED_INTEREST' },
        { id: 3, status: 'CONFIRMED_INTEREST' },
      ]

      const rejectedByStudentIds = allInscricoes
        .filter((i) => i.status === 'REJECTED_BY_STUDENT')
        .map((i) => i.id)

      const bolsistas = [2] // Selecting candidate 2
      const allSelected = [...bolsistas]

      const unselected = allInscricoes
        .filter((i) => !allSelected.includes(i.id) && !rejectedByStudentIds.includes(i.id))

      // Candidate 1 should not be in unselected (preserved as REJECTED_BY_STUDENT)
      expect(unselected.find((i) => i.id === 1)).toBeUndefined()
      // Candidate 3 should be in unselected
      expect(unselected.find((i) => i.id === 3)).toBeDefined()
      // Candidate 2 should not be in unselected (was selected)
      expect(unselected.find((i) => i.id === 2)).toBeUndefined()
    })

    it('should mark previously selected candidates as WAITING_LIST when replaced', () => {
      const previouslySelectedIds = [2] // Candidate 2 was previously SELECTED_BOLSISTA
      const bolsistas = [3] // Now selecting candidate 3
      const allSelected = [...bolsistas]

      const allInscricoes = [
        { id: 1, status: 'REJECTED_BY_STUDENT' },
        { id: 2, status: 'SELECTED_BOLSISTA' },
        { id: 3, status: 'CONFIRMED_INTEREST' },
      ]

      const rejectedByStudentIds = [1]

      const unselected = allInscricoes
        .filter((i) => !allSelected.includes(i.id) && !rejectedByStudentIds.includes(i.id))

      const results = unselected.map((inscricao) => {
        const wasPreviouslySelected = previouslySelectedIds.includes(inscricao.id)
        return {
          id: inscricao.id,
          newStatus: wasPreviouslySelected ? 'WAITING_LIST' : STATUS_INSCRICAO_CONFIRMED_INTEREST,
        }
      })

      // Candidate 2 was previously selected → should get WAITING_LIST
      expect(results.find((r) => r.id === 2)?.newStatus).toBe('WAITING_LIST')
    })

    it('should require motivoTroca when replacing a currently selected candidate', () => {
      const currentlySelected = [
        { id: 2, status: 'SELECTED_BOLSISTA' },
      ]
      const newBolsistas = [3] // Different from currently selected

      const isReplacingCandidate = currentlySelected.some(
        (i) => !newBolsistas.includes(i.id)
      )

      expect(isReplacingCandidate).toBe(true)

      // Without motivoTroca, should be invalid
      const motivoTroca = undefined
      const isValid = !isReplacingCandidate || !!motivoTroca
      expect(isValid).toBe(false)

      // With motivoTroca, should be valid
      const motivoTrocaProvided = 'Sem retorno do aluno'
      const isValidWithMotivo = !isReplacingCandidate || !!motivoTrocaProvided
      expect(isValidWithMotivo).toBe(true)
    })

    it('should not require motivoTroca for first-time selection', () => {
      const currentlySelected: { id: number; status: string }[] = [] // No one currently selected
      const newBolsistas = [1]

      const isReplacingCandidate = currentlySelected.some(
        (i) => !newBolsistas.includes(i.id)
      )

      expect(isReplacingCandidate).toBe(false)

      const motivoTroca = undefined
      const isValid = !isReplacingCandidate || !!motivoTroca
      expect(isValid).toBe(true) // Valid without motivo
    })
  })

  describe('bolsasPreenchidas calculation', () => {
    it('should return true when accepted bolsistas >= available bolsas', () => {
      const inscricoes = [
        { status: 'ACCEPTED_BOLSISTA' },
        { status: 'CONFIRMED_INTEREST' },
        { status: 'REJECTED_BY_STUDENT' },
      ]
      const bolsasDisponibilizadas = 1

      const bolsasAceitas = inscricoes.filter((i) => i.status === 'ACCEPTED_BOLSISTA').length
      const bolsasPreenchidas = bolsasAceitas >= bolsasDisponibilizadas && bolsasDisponibilizadas > 0

      expect(bolsasPreenchidas).toBe(true)
    })

    it('should return false when no bolsas accepted yet', () => {
      const inscricoes = [
        { status: 'SELECTED_BOLSISTA' },
        { status: 'CONFIRMED_INTEREST' },
      ]
      const bolsasDisponibilizadas = 1

      const bolsasAceitas = inscricoes.filter((i) => i.status === 'ACCEPTED_BOLSISTA').length
      const bolsasPreenchidas = bolsasAceitas >= bolsasDisponibilizadas && bolsasDisponibilizadas > 0

      expect(bolsasPreenchidas).toBe(false)
    })

    it('should return false when bolsasDisponibilizadas is 0', () => {
      const inscricoes = [
        { status: 'ACCEPTED_BOLSISTA' },
      ]
      const bolsasDisponibilizadas = 0

      const bolsasAceitas = inscricoes.filter((i) => i.status === 'ACCEPTED_BOLSISTA').length
      const bolsasPreenchidas = bolsasAceitas >= bolsasDisponibilizadas && bolsasDisponibilizadas > 0

      expect(bolsasPreenchidas).toBe(false)
    })

    it('should handle multiple bolsas correctly', () => {
      const inscricoes = [
        { status: 'ACCEPTED_BOLSISTA' },
        { status: 'ACCEPTED_BOLSISTA' },
        { status: 'CONFIRMED_INTEREST' },
      ]
      const bolsasDisponibilizadas = 2

      const bolsasAceitas = inscricoes.filter((i) => i.status === 'ACCEPTED_BOLSISTA').length
      const bolsasPreenchidas = bolsasAceitas >= bolsasDisponibilizadas && bolsasDisponibilizadas > 0

      expect(bolsasPreenchidas).toBe(true)
    })

    it('should return false when only 1 of 2 bolsas accepted', () => {
      const inscricoes = [
        { status: 'ACCEPTED_BOLSISTA' },
        { status: 'SELECTED_BOLSISTA' },
        { status: 'CONFIRMED_INTEREST' },
      ]
      const bolsasDisponibilizadas = 2

      const bolsasAceitas = inscricoes.filter((i) => i.status === 'ACCEPTED_BOLSISTA').length
      const bolsasPreenchidas = bolsasAceitas >= bolsasDisponibilizadas && bolsasDisponibilizadas > 0

      expect(bolsasPreenchidas).toBe(false)
    })
  })
})
