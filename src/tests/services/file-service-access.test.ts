import { db } from '@/server/db'
import { createFileService } from '@/server/services/file/file-service'
import { PROFESSOR, STUDENT } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const repo = {
  findAlunoByFileId: vi.fn(),
  findProfessorByFileId: vi.fn(),
  findProjetoDocumentosByFileId: vi.fn(),
  findInscricaoDocumentosByFileId: vi.fn(),
  findProfessorByUserId: vi.fn(),
}

vi.mock('@/server/services/file/file-repository', () => ({
  createFileRepository: () => repo,
}))

const HISTORICO = 'user_document/193/historico.pdf'

// O aluno reaproveita o mesmo histórico em várias inscrições, cada uma de um professor diferente
const inscricaoDocumentos = [
  {
    inscricao: {
      aluno: { userId: 193 },
      projeto: { professorResponsavelId: 29, professoresParticipantes: [] },
    },
  },
  {
    inscricao: {
      aluno: { userId: 193 },
      projeto: { professorResponsavelId: 20, professoresParticipantes: [] },
    },
  },
]

describe('fileService.canAccessFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repo.findAlunoByFileId.mockResolvedValue(null)
    repo.findProfessorByFileId.mockResolvedValue(null)
    repo.findProjetoDocumentosByFileId.mockResolvedValue([])
    repo.findInscricaoDocumentosByFileId.mockResolvedValue(inscricaoDocumentos)
  })

  it('authorizes every professor whose projeto received the shared file', async () => {
    const service = createFileService(db)

    for (const professor of [
      { id: 29, userId: 65 },
      { id: 20, userId: 56 },
    ]) {
      repo.findProfessorByUserId.mockResolvedValue(professor)
      await expect(service.canAccessFile(HISTORICO, professor.userId, PROFESSOR)).resolves.toBe(true)
    }
  })

  it('denies a professor with no inscrição for the file', async () => {
    repo.findProfessorByUserId.mockResolvedValue({ id: 7, userId: 99 })
    const service = createFileService(db)

    await expect(service.canAccessFile(HISTORICO, 99, PROFESSOR)).resolves.toBe(false)
  })

  it('authorizes the student who owns the inscrição', async () => {
    const service = createFileService(db)

    await expect(service.canAccessFile(HISTORICO, 193, STUDENT)).resolves.toBe(true)
  })
})
