import type { InscricaoRepository } from '@/server/services/inscricao/inscricao-repository'
import { ProfessorInscricaoService } from '@/server/services/inscricao/professor-inscricao-service'
import { PROFESSOR } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const PROJETO = { id: 594, professorResponsavelId: 29 }

const repository = {
  findProjetoById: vi.fn().mockResolvedValue(PROJETO),
  findProfessorByUserId: vi.fn(),
  isProfessorParticipante: vi.fn(),
  findInscricoesByProjetoId: vi.fn().mockResolvedValue([]),
}

const service = () => new ProfessorInscricaoService(repository as unknown as InscricaoRepository)

describe('ProfessorInscricaoService.getInscricoesProjeto', () => {
  beforeEach(() => {
    repository.isProfessorParticipante.mockResolvedValue(false)
  })

  it('allows the professor responsável', async () => {
    repository.findProfessorByUserId.mockResolvedValue({ id: 29 })

    await expect(service().getInscricoesProjeto(65, PROFESSOR, PROJETO.id)).resolves.toEqual([])
  })

  it('allows a professor participante', async () => {
    repository.findProfessorByUserId.mockResolvedValue({ id: 20 })
    repository.isProfessorParticipante.mockResolvedValue(true)

    await expect(service().getInscricoesProjeto(56, PROFESSOR, PROJETO.id)).resolves.toEqual([])
  })

  it('denies a professor with no link to the projeto', async () => {
    repository.findProfessorByUserId.mockResolvedValue({ id: 7 })

    await expect(service().getInscricoesProjeto(99, PROFESSOR, PROJETO.id)).rejects.toThrow('Acesso negado')
  })
})
