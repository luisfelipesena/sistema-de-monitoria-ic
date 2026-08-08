import type { db } from '@/server/db'
import { BusinessError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import type { SignatureTypeTermo, TermoWorkflowStatus, UserRole } from '@/types'
import {
  ADMIN,
  PROFESSOR,
  STUDENT,
  TIPO_ASSINATURA_ATA_SELECAO,
  TIPO_ASSINATURA_PROJETO_PROFESSOR,
  TIPO_ASSINATURA_TERMO_COMPROMISSO,
  TERMO_WORKFLOW_STATUS_ASSINADO_COMPLETO,
  TERMO_WORKFLOW_STATUS_PARCIALMENTE_ASSINADO,
  TERMO_WORKFLOW_STATUS_PENDENTE_ASSINATURA,
} from '@/types'
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

      const isAluno = userRole === STUDENT && vagaData.aluno.userId === userId
      const isProfessor =
        userRole === PROFESSOR &&
        (vagaData.projeto.professorResponsavelId === userId ||
          vagaData.projeto.professorResponsavel?.userId === userId)
      const isAdmin = userRole === ADMIN

      if (!isAluno && !isProfessor && !isAdmin) {
        throw new ForbiddenError('Você não tem permissão para gerar este termo')
      }

      // Buscar assinaturas cadastradas para a vaga ou projeto
      const signatures = await repo.findSignaturesByVagaId(vagaId, vagaData.projetoId)

      // Assinatura do aluno: do termo ou do formulário de inscrição
      const alunoSigRecord = signatures.find((s) => s.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO)
      const alunoAssinaturaBase64 = alunoSigRecord?.assinaturaData || vagaData.inscricao?.assinaturaAlunoFileId || null

      // Assinatura do professor
      const profSigRecord = signatures.find(
        (s) =>
          s.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO ||
          s.tipoAssinatura === TIPO_ASSINATURA_PROJETO_PROFESSOR
      )
      const professorAssinaturaBase64 = profSigRecord?.assinaturaData || null

      const pdfBuffer = await pdfGen.generateTermo({
        ...vagaData,
        alunoAssinaturaBase64,
        professorAssinaturaBase64,
      })

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
      const isProfessor =
        userRole === PROFESSOR &&
        (vagaData.projeto.professorResponsavelId === userId ||
          vagaData.projeto.professorResponsavel?.userId === userId)
      const isAdmin = userRole === ADMIN

      if (!isAluno && !isProfessor && !isAdmin) {
        throw new ForbiddenError('Você não tem permissão para baixar este termo')
      }

      // Re-gerar o PDF do termo com as assinaturas atualizadas antes de gerar a URL de download
      await this.generateTermo(vagaId, userId, userRole)

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
      userRole: UserRole
    ) {
      const vagaData = await repo.findVagaSimple(vagaId)

      if (!vagaData) {
        throw new NotFoundError('Vaga', vagaId)
      }

      const isAluno = vagaData.aluno.userId === userId
      const isProfessor =
        vagaData.projeto.professorResponsavelId === userId ||
        vagaData.projeto.professorResponsavel?.userId === userId

      if (tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO && !isAluno) {
        throw new ForbiddenError('Apenas o aluno pode assinar como aluno.')
      }
      if (tipoAssinatura !== TIPO_ASSINATURA_TERMO_COMPROMISSO && !isProfessor) {
        throw new ForbiddenError('Apenas o professor responsável pode assinar.')
      }

      const assinaturaExistente = await repo.findSignature(vagaId, tipoAssinatura)

      if (assinaturaExistente) {
        throw new BusinessError('Este documento já foi assinado por você.', 'ALREADY_SIGNED')
      }

      await repo.insertSignature(userId, vagaId, assinaturaData, tipoAssinatura)

      // Re-gerar PDF com a nova assinatura
      await this.generateTermo(vagaId, userId, userRole)

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
          const isOwner =
            projeto.professorResponsavelId === userId ||
            projeto.professorResponsavel?.userId === userId

          if (userRole === PROFESSOR && !isOwner) {
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
        const isProfessor =
          userRole === PROFESSOR &&
          (vaga.projeto.professorResponsavelId === userId ||
            vaga.projeto.professorResponsavel?.userId === userId)
        const isAdmin = userRole === ADMIN

        if (!isAluno && !isProfessor && !isAdmin) {
          throw new ForbiddenError('Você não tem permissão para ver este termo')
        }
      }

      const termosStatus = await Promise.all(
        vagas.map(async (vagaItem) => {
          const assinaturas = await repo.findSignaturesByVagaId(vagaItem.id, vagaItem.projetoId)

          const temAssinaturaAluno =
            assinaturas.some((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO) ||
            !!(vagaItem as any).inscricao?.assinaturaAlunoFileId ||
            !!(vagaItem as any).inscricao?.dataAssinaturaAluno

          const temAssinaturaProfessor =
            assinaturas.some(
              (a) =>
                a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO ||
                a.tipoAssinatura === TIPO_ASSINATURA_PROJETO_PROFESSOR
            ) || vagaItem.projeto.status === 'APPROVED'

          let statusTermo: TermoWorkflowStatus = TERMO_WORKFLOW_STATUS_PENDENTE_ASSINATURA
          if (temAssinaturaAluno && temAssinaturaProfessor) {
            statusTermo = TERMO_WORKFLOW_STATUS_ASSINADO_COMPLETO
          } else if (temAssinaturaAluno || temAssinaturaProfessor) {
            statusTermo = TERMO_WORKFLOW_STATUS_PARCIALMENTE_ASSINADO
          }

          return {
            vagaId: vagaItem.id,
            alunoNome: vagaItem.aluno.user.username,
            tipoVaga: vagaItem.tipo,
            statusTermo,
            assinaturaAluno: temAssinaturaAluno,
            assinaturaProfessor: temAssinaturaProfessor,
            dataAssinaturaAluno: (vagaItem as any).inscricao?.dataAssinaturaAluno || null,
            dataAssinaturaProfessor: null,
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
            const assinaturaAluno = await repo.findSignature(vagaItem.id, TIPO_ASSINATURA_TERMO_COMPROMISSO)

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
            const assinaturaProfessor = await repo.findSignature(vagaItem.id, TIPO_ASSINATURA_ATA_SELECAO)

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

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO)
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO)

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

      const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO)
      const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO)

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
