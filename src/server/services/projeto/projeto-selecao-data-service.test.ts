import { studentEmailService } from '@/server/lib/email'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProjetoSelecaoDataService } from './projeto-selecao-data-service'
import type { ProjetoRepository } from './projeto-repository'

function createRepository() {
  return {
    findById: vi.fn().mockResolvedValue({
      id: 1,
      professorResponsavelId: 10,
      localSelecao: null,
    }),
    update: vi.fn().mockResolvedValue({
      id: 1,
      titulo: 'Monitoria de Algoritmos',
      datasSelecaoEscolhidas: JSON.stringify([{ data: '2026-08-26', horario: '14:00' }]),
      dataSelecaoEscolhida: new Date('2026-08-26T00:00:00.000Z'),
      horarioSelecao: '14:00',
      localSelecao: 'Sala 123',
    }),
    findByIdWithRelations: vi.fn().mockResolvedValue({
      id: 1,
      titulo: 'Monitoria de Algoritmos',
      professorResponsavelId: 10,
      datasSelecaoEscolhidas: JSON.stringify([{ data: '2026-08-26', horario: '14:00' }]),
      dataSelecaoEscolhida: new Date('2026-08-26T00:00:00.000Z'),
      horarioSelecao: '14:00',
      localSelecao: 'Sala 123',
    }),
    findInscricoesWithUserByProjetoId: vi.fn().mockResolvedValue([
      {
        inscricao: { status: 'SUBMITTED' },
        aluno: { id: 20, nomeCompleto: 'Aluno Teste' },
        user: { email: 'aluno@ufba.br' },
      },
    ]),
  } as unknown as ProjetoRepository
}

describe('ProjetoSelecaoDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates the location without reopening confirmed edital data and notifies candidates', async () => {
    const repo = createRepository()
    vi.mocked(repo.findInscricoesWithUserByProjetoId).mockResolvedValue([
      {
        inscricao: { status: 'SUBMITTED' },
        aluno: { id: 20, nomeCompleto: 'Aluno Teste' },
        user: { email: 'aluno@ufba.br' },
      },
      {
        inscricao: { status: 'SUBMITTED' },
        aluno: { id: 20, nomeCompleto: 'Aluno Teste' },
        user: { email: 'aluno@ufba.br' },
      },
      {
        inscricao: { status: 'REJECTED_BY_PROFESSOR' },
        aluno: { id: 21, nomeCompleto: 'Outro Aluno' },
        user: { email: 'outro@ufba.br' },
      },
    ] as never)
    vi.mocked(studentEmailService.sendSelectionScheduleUpdated).mockResolvedValue({ sent: 1, failed: [] })

    const result = await createProjetoSelecaoDataService(repo).updateSelecaoData(
      1,
      { localSelecao: '  Sala 123  ' },
      99,
      'admin'
    )

    expect(repo.update).toHaveBeenCalledWith(1, { localSelecao: 'Sala 123' })
    expect(studentEmailService.sendSelectionScheduleUpdated).toHaveBeenCalledWith([
      expect.objectContaining({
        studentEmail: 'aluno@ufba.br',
        schedule: expect.objectContaining({ local: 'Sala 123' }),
      }),
    ])
    expect(result.notificationsSent).toBe(1)
  })

  it('reopens edital confirmation for content changes without sending schedule email', async () => {
    const repo = createRepository()
    const sendSpy = vi.mocked(studentEmailService.sendSelectionScheduleUpdated)

    const result = await createProjetoSelecaoDataService(repo).updateSelecaoData(
      1,
      { pontosProva: '  Listas e árvores  ' },
      99,
      'admin'
    )

    expect(repo.update).toHaveBeenCalledWith(1, {
      pontosProva: 'Listas e árvores',
      dadosEditalConfirmados: false,
    })
    expect(sendSpy).not.toHaveBeenCalled()
    expect(result.notificationsSent).toBe(0)
  })
})
