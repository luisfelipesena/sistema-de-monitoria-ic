import { BusinessError } from '@/server/lib/errors'
import { disciplinaTable, inscricaoDocumentoTable, inscricaoTable } from '@/server/db/schema'
import type { Database } from '@/server/services/inscricao/inscricao-repository'
import {
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_I_TERMO_COMPROMISSO,
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_III_BOLSISTA,
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_IV_VOLUNTARIO,
  TIPO_DOCUMENTO_INSCRICAO_COMBINADO,
  TIPO_VAGA_BOLSISTA,
  type AnexoIIIInputs,
  type AnexoITermoInputs,
  type AnexoIVInputs,
  type TipoVaga,
} from '@/types'
import { logger } from '@/utils/logger'
import { and, eq, inArray } from 'drizzle-orm'
import { createInscricaoPdfGenerator } from './inscricao-pdf-generator'

const log = logger.child({ context: 'InscricaoPdfService' })

const SEMESTER_MONTHS = {
  start: { SEMESTRE_1: 2, SEMESTRE_2: 7 }, // March / August
  end: { SEMESTRE_1: 6, SEMESTRE_2: 11 }, // July / December
} as const

const GENERATED_TIPOS = [
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_III_BOLSISTA,
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_IV_VOLUNTARIO,
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_I_TERMO_COMPROMISSO,
  TIPO_DOCUMENTO_INSCRICAO_COMBINADO,
] as const

export function createInscricaoPdfService(db: Database) {
  const generator = createInscricaoPdfGenerator()

  async function buildInputs(inscricaoId: number): Promise<{
    anexoIIIouIV: { kind: 'III'; inputs: AnexoIIIInputs } | { kind: 'IV'; inputs: AnexoIVInputs }
    anexoI: AnexoITermoInputs
    tipoVaga: TipoVaga
  }> {
    const inscricao = await db.query.inscricaoTable.findFirst({
      where: eq(inscricaoTable.id, inscricaoId),
      with: {
        aluno: {
          with: {
            user: true,
            endereco: true,
          },
        },
        projeto: {
          with: {
            professorResponsavel: { with: { user: true } },
            departamento: true,
            disciplinas: { with: { disciplina: true } },
          },
        },
        periodoInscricao: true,
      },
    })

    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    const aluno = inscricao.aluno
    const alunoUser = aluno.user
    const endereco = aluno.endereco
    const projeto = inscricao.projeto
    const professor = projeto.professorResponsavel

    if (!endereco) {
      throw new BusinessError('Perfil do aluno incompleto: endereço ausente', 'BAD_REQUEST')
    }
    if (!aluno.cpf || !aluno.rg || !aluno.matricula || !aluno.nomeCompleto) {
      throw new BusinessError('Perfil do aluno incompleto: CPF, RG, matrícula ou nome ausentes', 'BAD_REQUEST')
    }

    const disciplinaPrincipal = projeto.disciplinas[0]?.disciplina
    if (!disciplinaPrincipal) {
      throw new BusinessError('Projeto sem disciplina vinculada', 'BAD_REQUEST')
    }

    let disciplinaEquivalente: { codigo: string; nome: string } | null = null
    if (inscricao.disciplinaEquivalenteId) {
      const eqDisc = await db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.id, inscricao.disciplinaEquivalenteId),
      })
      if (eqDisc) disciplinaEquivalente = { codigo: eqDisc.codigo, nome: eqDisc.nome }
    }

    const startMonth = SEMESTER_MONTHS.start[projeto.semestre]
    const endMonth = SEMESTER_MONTHS.end[projeto.semestre]
    const periodoInicio = new Date(projeto.ano, startMonth, 1)
    const periodoFim = new Date(projeto.ano, endMonth, 30)

    const tipoVaga: TipoVaga = inscricao.tipoVagaPretendida === 'VOLUNTARIO' ? 'VOLUNTARIO' : 'BOLSISTA'

    const signature =
      inscricao.assinaturaAlunoFileId && inscricao.dataAssinaturaAluno && inscricao.localAssinaturaAluno
        ? {
            dataUrl: inscricao.assinaturaAlunoFileId,
            local: inscricao.localAssinaturaAluno,
            data: inscricao.dataAssinaturaAluno,
          }
        : null

    const monitor = {
      nomeCompleto: aluno.nomeCompleto,
      nomeSocial: aluno.nomeSocial,
      cpf: aluno.cpf,
      rg: aluno.rg,
      matricula: aluno.matricula,
      dataNascimento: aluno.dataNascimento,
      genero: aluno.genero,
      endereco: {
        rua: endereco.rua,
        numero: endereco.numero,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        complemento: endereco.complemento,
      },
      telefone: aluno.telefone,
      telefoneFixo: aluno.telefoneFixo,
      email: aluno.emailInstitucional ?? alunoUser.email,
      cursoNome: aluno.cursoNome,
      cr: aluno.cr,
      banco: aluno.banco,
      agencia: aluno.agencia,
      conta: aluno.conta,
      digitoConta: aluno.digitoConta,
    }

    const projetoHeader = {
      unidadeUniversitaria: 'Instituto de Computação',
      departamentoNome: projeto.departamento?.nome ?? 'Departamento de Ciência da Computação',
      disciplina: { codigo: disciplinaPrincipal.codigo, nome: disciplinaPrincipal.nome },
      professorResponsavelNome: professor.nomeCompleto,
      professorOrientadorNome: professor.nomeCompleto,
      ano: projeto.ano,
      semestre: projeto.semestre,
      periodoInicio,
      periodoFim,
    }

    const declaracao = {
      cursouComponente: !!inscricao.cursouComponente,
      disciplinaEquivalente,
    }

    const anexoI: AnexoITermoInputs = { monitor, projeto: projetoHeader, tipoVaga, signature }

    if (tipoVaga === TIPO_VAGA_BOLSISTA) {
      const inputs: AnexoIIIInputs = { monitor, projeto: projetoHeader, declaracao, signature }
      return { anexoIIIouIV: { kind: 'III', inputs }, anexoI, tipoVaga }
    }

    const inputs: AnexoIVInputs = { monitor, projeto: projetoHeader, declaracao, signature }
    return { anexoIIIouIV: { kind: 'IV', inputs }, anexoI, tipoVaga }
  }

  async function generateAndPersist(inscricaoId: number, userId: number) {
    const { anexoIIIouIV, anexoI, tipoVaga } = await buildInputs(inscricaoId)

    log.info({ inscricaoId, tipoVaga }, 'Gerando PDFs da inscrição')

    const anexoBuffer =
      anexoIIIouIV.kind === 'III'
        ? await generator.renderAnexoIII(anexoIIIouIV.inputs)
        : await generator.renderAnexoIV(anexoIIIouIV.inputs)

    const termoBuffer = await generator.renderAnexoITermo(anexoI)
    const combinedBuffer = await generator.mergePdfs([anexoBuffer, termoBuffer])

    const [anexoFileId, termoFileId, combinedFileId] = await Promise.all([
      generator.uploadToMinio(
        inscricaoId,
        anexoIIIouIV.kind === 'III' ? 'anexo-iii-bolsista' : 'anexo-iv-voluntario',
        anexoBuffer
      ),
      generator.uploadToMinio(inscricaoId, 'anexo-i-termo-compromisso', termoBuffer),
      generator.uploadToMinio(inscricaoId, 'comprovante-inscricao-combinado', combinedBuffer),
    ])

    const tipoAnexo =
      anexoIIIouIV.kind === 'III'
        ? TIPO_DOCUMENTO_INSCRICAO_ANEXO_III_BOLSISTA
        : TIPO_DOCUMENTO_INSCRICAO_ANEXO_IV_VOLUNTARIO

    // Substitui apenas os documentos gerados pelo sistema (preserva uploads RG/CPF/HISTORICO)
    await db
      .delete(inscricaoDocumentoTable)
      .where(
        and(
          eq(inscricaoDocumentoTable.inscricaoId, inscricaoId),
          inArray(inscricaoDocumentoTable.tipoDocumento, [...GENERATED_TIPOS])
        )
      )

    await db.insert(inscricaoDocumentoTable).values([
      { inscricaoId, fileId: anexoFileId, tipoDocumento: tipoAnexo, assinadoPorUserId: userId },
      {
        inscricaoId,
        fileId: termoFileId,
        tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_ANEXO_I_TERMO_COMPROMISSO,
        assinadoPorUserId: userId,
      },
      {
        inscricaoId,
        fileId: combinedFileId,
        tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_COMBINADO,
        assinadoPorUserId: userId,
      },
    ])

    log.info({ inscricaoId, anexoFileId, termoFileId, combinedFileId }, 'PDFs da inscrição persistidos')

    return { anexoFileId, termoFileId, combinedFileId }
  }

  async function getInscricaoDocumentos(inscricaoId: number) {
    const docs = await db.query.inscricaoDocumentoTable.findMany({
      where: eq(inscricaoDocumentoTable.inscricaoId, inscricaoId),
    })

    const withUrls = await Promise.all(
      docs.map(async (doc) => ({
        id: doc.id,
        fileId: doc.fileId,
        tipoDocumento: doc.tipoDocumento,
        createdAt: doc.createdAt,
        presignedUrl: await generator.presignedUrl(doc.fileId).catch(() => null),
      }))
    )

    return withUrls
  }

  async function previewPdf(inputs: {
    kind: 'III' | 'IV'
    anexo: AnexoIIIInputs | AnexoIVInputs
    anexoI: AnexoITermoInputs
  }): Promise<Buffer> {
    const anexoBuffer =
      inputs.kind === 'III'
        ? await generator.renderAnexoIII(inputs.anexo as AnexoIIIInputs)
        : await generator.renderAnexoIV(inputs.anexo as AnexoIVInputs)
    const termoBuffer = await generator.renderAnexoITermo(inputs.anexoI)
    return generator.mergePdfs([anexoBuffer, termoBuffer])
  }

  return { buildInputs, generateAndPersist, getInscricaoDocumentos, previewPdf }
}

export type InscricaoPdfService = ReturnType<typeof createInscricaoPdfService>
