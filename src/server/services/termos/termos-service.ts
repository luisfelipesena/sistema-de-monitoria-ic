import type { db } from '@/server/db'
import { BusinessError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import type { SignatureTypeTermo, UserRole } from '@/types'
import { ADMIN, PROFESSOR, STUDENT } from '@/types'
import { logger } from '@/utils/logger'
import { createPdfGenerator } from './termos-pdf-generator'
import { createTermosRepository } from './termos-repository'

const log = logger.child({ context: 'TermosService' })

type Database = typeof db

export function createTermosService(db: Database) {
  const repo = createTermosRepository(db)
  const pdfGen = createPdfGenerator()

  return {
    async generateTermo(vagaId: number, userId: number, userRole: UserRole) {
      const vagaData = await repo.findVagaById(vagaId)

      if (!vagaData) {
        throw new NotFoundError('Vaga', vagaId)
      }

      if (userRole !== ADMIN && (userRole !== PROFESSOR || vagaData.projeto.professorResponsavelId !== userId)) {
        throw new ForbiddenError('Você não tem permissão para gerar este termo')
      }

      const pdfBuffer = await pdfGen.generateTermo(vagaData)
      const fileName = pdfGen.generateFileName(vagaData.projeto.ano, vagaData.projeto.semestre, vagaData.id)
      const termoNumero = pdfGen.generateTermoNumero(vagaData.projeto.ano, vagaData.projeto.semestre, vagaData.id)

      await pdfGen.uploadToMinio(fileName, pdfBuffer)

      await repo.insertProjetoDocumento(vagaData.projetoId, fileName, `Termo de compromisso gerado para vaga ${vagaId}`)

      log.info({ vagaId, fileName }, 'Termo de compromisso gerado com sucesso')

      return {
        success: true,
        termoNumero,
        fileName,
        message: 'Termo de compromisso gerado com sucesso',
      }
    },

    async downloadTermo(vagaId: number, userId: number, userRole: UserRole) {
      const vagaData = await repo.findVagaSimple(vagaId)

      if (!vagaData) {
        throw new NotFoundError('Vaga', vagaId)
      }

      const isAluno = userRole === STUDENT && vagaData.aluno.userId === userId
      const isProfessor = userRole === PROFESSOR && vagaData.projeto.professorResponsavelId === userId
      const isAdmin = userRole === ADMIN

      if (!isAluno && !isProfessor && !isAdmin) {
        throw new ForbiddenError('Você não tem permissão para baixar este termo')
      }

      const termoNumero = pdfGen.generateTermoNumero(vagaData.projeto.ano, vagaData.projeto.semestre, vagaData.id)
      const fileName = `termos/${termoNumero}.pdf`

      const downloadUrl = await pdfGen.generatePresignedUrl(fileName)

      const stat = await pdfGen
        .getFromMinio(fileName)
        .then((buffer) => buffer.length)
        .catch(() => 0)

      return {
        downloadUrl,
        fileName: `${termoNumero}.pdf`,
        fileSize: stat,
      }
    },

    async signTermo(
      vagaId: number,
      assinaturaData: string,
      tipoAssinatura: SignatureTypeTermo,
      userId: number,
      _userRole: UserRole
    ) {
      const vagaData = await repo.findVagaSimple(vagaId)

      if (!vagaData) {
        throw new NotFoundError('Vaga', vagaId)
      }

      if (tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO' && vagaData.aluno.userId !== userId) {
        throw new ForbiddenError('Apenas o aluno pode assinar como aluno.')
      }
      if (tipoAssinatura === 'ATA_SELECAO_PROFESSOR' && vagaData.projeto.professorResponsavelId !== userId) {
        throw new ForbiddenError('Apenas o professor responsável pode assinar.')
      }

      const assinaturaExistente = await repo.findSignature(vagaId, tipoAssinatura)

      if (assinaturaExistente) {
        throw new BusinessError('Este documento já foi assinado por você.', 'ALREADY_SIGNED')
      }

      const fileName = pdfGen.generateFileName(vagaData.projeto.ano, vagaData.projeto.semestre, vagaData.id)

      await db.transaction(async (tx) => {
        const txRepo = createTermosRepository(tx as unknown as Database)
        const txPdfGen = createPdfGenerator()

        await txRepo.insertSignature(userId, vagaId, assinaturaData, tipoAssinatura)

        const allSignatures = await txRepo.findSignaturesByVagaId(vagaId)

        await txPdfGen.embedSignatures(fileName, allSignatures)
      })

      log.info({ vagaId, tipoAssinatura, userId }, 'Termo assinado com sucesso')

      return { success: true, message: 'Termo assinado com sucesso' }
    },

    async getTermosStatus(
      projetoId: number | undefined,
      vagaId: number | undefined,
      userId: number,
      userRole: UserRole
    ) {
      if (!projetoId && !vagaId) {
        throw new BusinessError('Forneça projetoId ou vagaId', 'MISSING_PARAMETER')
      }

      type VagaType = Awaited<ReturnType<typeof repo.findVagasByProjetoId>>[number]
      let vagas: VagaType[] = []

      if (projetoId) {
        vagas = await repo.findVagasByProjetoId(projetoId)

        if (vagas.length > 0) {
          const projeto = vagas[0]?.projeto
          if (!projeto) {
            throw new NotFoundError('Projeto', 'não encontrado')
          }
          if (userRole === PROFESSOR && projeto.professorResponsavelId !== userId) {
            throw new ForbiddenError('Você só pode ver termos de seus próprios projetos')
          }
        }
      } else if (vagaId) {
        const vaga = await repo.findVagaSimple(vagaId)

        if (!vaga) {
          throw new NotFoundError('Vaga', vagaId)
        }

        vagas = [vaga]

        const isAluno = userRole === STUDENT && vaga.aluno.userId === userId
        const isProfessor = userRole === PROFESSOR && vaga.projeto.professorResponsavelId === userId
        const isAdmin = userRole === ADMIN

        if (!isAluno && !isProfessor && !isAdmin) {
          throw new ForbiddenError('Você não tem permissão para ver este termo')
        }
      }

      const termosStatus = await Promise.all(
        vagas.map(async (vagaItem) => {
          const assinaturas = await repo.findSignaturesByVagaId(vagaItem.id)

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')

          let statusTermo = 'pendente_assinatura'
          if (assinaturaAluno && assinaturaProfessor) {
            statusTermo = 'assinado_completo'
          } else if (assinaturaAluno || assinaturaProfessor) {
            statusTermo = 'parcialmente_assinado'
          }

          return {
            vagaId: vagaItem.id,
            alunoNome: vagaItem.aluno.user.username,
            tipoVaga: vagaItem.tipo,
            statusTermo,
            assinaturaAluno: !!assinaturaAluno,
            assinaturaProfessor: !!assinaturaProfessor,
            dataAssinaturaAluno: assinaturaAluno?.createdAt,
            dataAssinaturaProfessor: assinaturaProfessor?.createdAt,
            termoNumero: pdfGen.generateTermoNumero(vagaItem.projeto.ano, vagaItem.projeto.semestre, vagaItem.id),
            observacoes: null,
          }
        })
      )

      return termosStatus
    },

    async getTermosPendentes(userId: number, userRole: UserRole) {
      if (userRole === STUDENT) {
        const vagasAluno = await repo.findVagasForStudent(userId)

        const termosPendentes = await Promise.all(
          vagasAluno.map(async (vagaItem) => {
            const assinaturaAluno = await repo.findSignature(vagaItem.id, 'TERMO_COMPROMISSO_ALUNO')

            if (!assinaturaAluno) {
              return {
                vagaId: vagaItem.id,
                projeto: vagaItem.projeto.titulo,
                tipo: vagaItem.tipo,
                professor: vagaItem.projeto.professorResponsavel.nomeCompleto,
                pendenteDe: 'aluno',
              }
            }
            return null
          })
        )

        return termosPendentes.filter(Boolean)
      }

      if (userRole === PROFESSOR) {
        const vagasProfessor = await repo.findVagasForProfessor(userId)

        const termosPendentes = await Promise.all(
          vagasProfessor.map(async (vagaItem) => {
            const assinaturaProfessor = await repo.findSignature(vagaItem.id, 'ATA_SELECAO_PROFESSOR')

            if (!assinaturaProfessor) {
              return {
                vagaId: vagaItem.id,
                projeto: vagaItem.projeto.titulo,
                tipo: vagaItem.tipo,
                aluno: vagaItem.aluno.user.username,
                pendenteDe: PROFESSOR,
              }
            }
            return null
          })
        )

        return termosPendentes.filter(Boolean)
      }

      const todasVagas = await repo.findAllVagas()

      const termosPendentes = await Promise.all(
        todasVagas.map(async (vagaItem) => {
          const assinaturas = await repo.findSignaturesByVagaId(vagaItem.id)

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')

          if (!assinaturaAluno || !assinaturaProfessor) {
            return {
              vagaId: vagaItem.id,
              projeto: vagaItem.projeto.titulo,
              tipo: vagaItem.tipo,
              aluno: vagaItem.aluno.user.username,
              professor: vagaItem.projeto.professorResponsavel.nomeCompleto,
              pendenteDe: !assinaturaAluno ? 'aluno' : 'professor',
              statusCompleto: !!(assinaturaAluno && assinaturaProfessor),
            }
          }
          return null
        })
      )

      return termosPendentes.filter(Boolean)
    },

    async validateTermoReady(vagaId: number, userId: number, userRole: UserRole) {
      const vagaData = await repo.findVagaSimple(vagaId)

      if (!vagaData) {
        throw new NotFoundError('Vaga', vagaId)
      }

      const isAluno = userRole === STUDENT && vagaData.aluno.userId === userId
      const isProfessor = userRole === PROFESSOR && vagaData.projeto.professorResponsavelId === userId
      const isAdmin = userRole === ADMIN

      if (!isAluno && !isProfessor && !isAdmin) {
        throw new ForbiddenError('Você não tem permissão para validar este termo')
      }

      const assinaturas = await repo.findSignaturesByVagaId(vagaId)

      const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
      const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')

      const pendencias: string[] = []
      if (!assinaturaAluno) pendencias.push('Assinatura do aluno')
      if (!assinaturaProfessor) pendencias.push('Assinatura do professor responsável')

      return {
        termoCompleto: pendencias.length === 0,
        pendencias,
        statusDetalhado: {
          assinaturaAluno: !!assinaturaAluno,
          assinaturaProfessor: !!assinaturaProfessor,
          dataAssinaturaAluno: assinaturaAluno?.createdAt,
          dataAssinaturaProfessor: assinaturaProfessor?.createdAt,
        },
        proximosPassos:
          pendencias.length === 0
            ? ['Termo pronto para ativação da monitoria']
            : pendencias.map((p) => `Aguardando: ${p}`),
      }
    },
  }
}

export type TermosService = ReturnType<typeof createTermosService>
