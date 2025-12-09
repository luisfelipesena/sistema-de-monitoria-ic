import { and, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/server/db/schema'
import {
  alunoTable,
  departamentoTable,
  disciplinaTable,
  equivalenciaDisciplinasTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  notaAlunoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import type { ACCEPTED_BOLSISTA, Semestre, StatusInscricao, TipoInscricao } from '@/types'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'InscricaoRepository' })

export type Database = PostgresJsDatabase<typeof schema>

export interface InscricaoCreateData {
  periodoInscricaoId: number
  projetoId: number
  alunoId: number
  tipoVagaPretendida: TipoInscricao
  status: StatusInscricao
  coeficienteRendimento: string | null
  notaDisciplina: string | null
}

export interface InscricaoUpdateData {
  status?: StatusInscricao
  notaDisciplina?: string
  notaSelecao?: string
  coeficienteRendimento?: string
  notaFinal?: string
  feedbackProfessor?: string
  updatedAt: Date
}

export interface DocumentoData {
  fileId: string
  tipoDocumento: string
}

export class InscricaoRepository {
  constructor(private db: Database) {}

  async findStudentGradeWithEquivalents(alunoId: number, disciplinaId: number): Promise<number | null> {
    try {
      // Direct grade lookup
      const directGrade = await this.db.query.notaAlunoTable.findFirst({
        where: and(eq(notaAlunoTable.alunoId, alunoId), eq(notaAlunoTable.disciplinaId, disciplinaId)),
      })

      if (directGrade) {
        log.info({ alunoId, disciplinaId, nota: directGrade.nota }, 'Found direct grade')
        return directGrade.nota
      }

      // Find equivalences (bidirectional)
      const equivalences = await this.db.query.equivalenciaDisciplinasTable.findMany({
        where: or(
          eq(equivalenciaDisciplinasTable.disciplinaOrigemId, disciplinaId),
          eq(equivalenciaDisciplinasTable.disciplinaEquivalenteId, disciplinaId)
        ),
      })

      if (equivalences.length === 0) {
        log.info({ alunoId, disciplinaId }, 'No equivalences found')
        return null
      }

      // Extract equivalent discipline IDs
      const equivalentIds = equivalences.map((equiv) =>
        equiv.disciplinaOrigemId === disciplinaId ? equiv.disciplinaEquivalenteId : equiv.disciplinaOrigemId
      )

      // Search in equivalent disciplines
      const equivalentGrade = await this.db.query.notaAlunoTable.findFirst({
        where: and(eq(notaAlunoTable.alunoId, alunoId), inArray(notaAlunoTable.disciplinaId, equivalentIds)),
      })

      if (equivalentGrade) {
        log.info(
          {
            alunoId,
            targetDisciplinaId: disciplinaId,
            foundInDisciplinaId: equivalentGrade.disciplinaId,
            nota: equivalentGrade.nota,
          },
          'Found grade in equivalent discipline'
        )
        return equivalentGrade.nota
      }

      log.info({ alunoId, disciplinaId, equivalentIds }, 'No grade found')
      return null
    } catch (error) {
      log.error(error, 'Error finding student grade with equivalents')
      return null
    }
  }

  async findAlunoByUserId(userId: number) {
    return this.db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, userId),
    })
  }

  async findProfessorByUserId(userId: number) {
    return this.db.query.professorTable.findFirst({
      where: eq(professorTable.userId, userId),
    })
  }

  async findProjetoById(projetoId: number) {
    return this.db.query.projetoTable.findFirst({
      where: and(eq(projetoTable.id, projetoId), isNull(projetoTable.deletedAt)),
    })
  }

  async findActivePeriodoInscricao(ano: number, semestre: Semestre) {
    const now = new Date()
    return this.db.query.periodoInscricaoTable.findFirst({
      where: and(
        eq(periodoInscricaoTable.ano, ano),
        eq(periodoInscricaoTable.semestre, semestre),
        lte(periodoInscricaoTable.dataInicio, now),
        gte(periodoInscricaoTable.dataFim, now)
      ),
    })
  }

  async findInscricaoByAlunoAndProjeto(alunoId: number, projetoId: number, periodoInscricaoId: number) {
    return this.db.query.inscricaoTable.findFirst({
      where: and(
        eq(inscricaoTable.alunoId, alunoId),
        eq(inscricaoTable.projetoId, projetoId),
        eq(inscricaoTable.periodoInscricaoId, periodoInscricaoId)
      ),
    })
  }

  async findInscricoesByAlunoId(alunoId: number) {
    return this.db.query.inscricaoTable.findMany({
      where: eq(inscricaoTable.alunoId, alunoId),
      with: {
        projeto: {
          with: {
            professorResponsavel: true,
            disciplinas: {
              with: {
                disciplina: true,
              },
            },
          },
        },
      },
    })
  }

  async findInscricaoById(inscricaoId: number) {
    return this.db.query.inscricaoTable.findFirst({
      where: eq(inscricaoTable.id, inscricaoId),
      with: {
        projeto: true,
      },
    })
  }

  async findInscricaoByIdAndAlunoId(inscricaoId: number, alunoId: number) {
    return this.db.query.inscricaoTable.findFirst({
      where: and(eq(inscricaoTable.id, inscricaoId), eq(inscricaoTable.alunoId, alunoId)),
      with: {
        projeto: true,
      },
    })
  }

  async findAcceptedBolsaBySemester(alunoId: number, status: typeof ACCEPTED_BOLSISTA) {
    return this.db.query.inscricaoTable.findFirst({
      where: and(eq(inscricaoTable.alunoId, alunoId), eq(inscricaoTable.status, status)),
      with: {
        projeto: true,
      },
    })
  }

  async findInscricaoWithFullDetails(inscricaoId: number) {
    return this.db.query.inscricaoTable.findFirst({
      where: eq(inscricaoTable.id, inscricaoId),
      with: {
        aluno: {
          with: {
            user: true,
          },
        },
        projeto: {
          with: {
            professorResponsavel: true,
            departamento: true,
          },
        },
        periodoInscricao: {
          with: {
            edital: true,
          },
        },
      },
    })
  }

  async findInscricoesByProjetoId(projetoId: number) {
    return this.db
      .select({
        id: inscricaoTable.id,
        projetoId: inscricaoTable.projetoId,
        alunoId: inscricaoTable.alunoId,
        tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
        status: inscricaoTable.status,
        notaDisciplina: inscricaoTable.notaDisciplina,
        notaSelecao: inscricaoTable.notaSelecao,
        coeficienteRendimento: inscricaoTable.coeficienteRendimento,
        notaFinal: inscricaoTable.notaFinal,
        feedbackProfessor: inscricaoTable.feedbackProfessor,
        createdAt: inscricaoTable.createdAt,
        updatedAt: inscricaoTable.updatedAt,
        projeto: {
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          descricao: projetoTable.descricao,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          status: projetoTable.status,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
        },
        professorResponsavel: {
          id: professorTable.id,
          nomeCompleto: professorTable.nomeCompleto,
          emailInstitucional: professorTable.emailInstitucional,
        },
        departamento: {
          id: departamentoTable.id,
          nome: departamentoTable.nome,
        },
        aluno: {
          id: alunoTable.id,
          nomeCompleto: alunoTable.nomeCompleto,
          matricula: alunoTable.matricula,
          cr: alunoTable.cr,
        },
        alunoUser: {
          id: userTable.id,
          email: userTable.email,
        },
      })
      .from(inscricaoTable)
      .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
      .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
      .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
      .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
      .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
      .where(eq(inscricaoTable.projetoId, projetoId))
      .orderBy(inscricaoTable.notaFinal, inscricaoTable.createdAt)
  }

  async findInscricoesWithDetails(alunoId: number) {
    return this.db
      .select({
        id: inscricaoTable.id,
        projetoId: inscricaoTable.projetoId,
        alunoId: inscricaoTable.alunoId,
        tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
        status: inscricaoTable.status,
        notaDisciplina: inscricaoTable.notaDisciplina,
        notaSelecao: inscricaoTable.notaSelecao,
        coeficienteRendimento: inscricaoTable.coeficienteRendimento,
        notaFinal: inscricaoTable.notaFinal,
        feedbackProfessor: inscricaoTable.feedbackProfessor,
        createdAt: inscricaoTable.createdAt,
        updatedAt: inscricaoTable.updatedAt,
        projeto: {
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          descricao: projetoTable.descricao,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          status: projetoTable.status,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
        },
        professorResponsavel: {
          id: professorTable.id,
          nomeCompleto: professorTable.nomeCompleto,
          emailInstitucional: professorTable.emailInstitucional,
        },
        departamento: {
          id: departamentoTable.id,
          nome: departamentoTable.nome,
        },
        aluno: {
          id: alunoTable.id,
          nomeCompleto: alunoTable.nomeCompleto,
          matricula: alunoTable.matricula,
          cr: alunoTable.cr,
        },
        alunoUser: {
          id: userTable.id,
          email: userTable.email,
        },
      })
      .from(inscricaoTable)
      .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
      .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
      .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
      .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
      .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
      .where(eq(inscricaoTable.alunoId, alunoId))
      .orderBy(inscricaoTable.createdAt)
  }

  async findProjetoDisciplinas(projetoId: number) {
    return this.db.query.projetoDisciplinaTable.findMany({
      where: eq(projetoDisciplinaTable.projetoId, projetoId),
      with: {
        disciplina: true,
      },
    })
  }

  async findDisciplinasByProjetoId(projetoId: number) {
    return this.db
      .select({
        id: disciplinaTable.id,
        nome: disciplinaTable.nome,
        codigo: disciplinaTable.codigo,
      })
      .from(disciplinaTable)
      .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
      .where(eq(projetoDisciplinaTable.projetoId, projetoId))
  }

  async createInscricao(data: InscricaoCreateData) {
    const [inscricao] = await this.db.insert(inscricaoTable).values(data).returning()
    return inscricao
  }

  async createDocumentos(inscricaoId: number, documentos: DocumentoData[]) {
    const documentosToInsert = documentos.map((doc) => ({
      inscricaoId,
      fileId: doc.fileId,
      tipoDocumento: doc.tipoDocumento,
    }))
    return this.db.insert(inscricaoDocumentoTable).values(documentosToInsert)
  }

  async updateInscricao(inscricaoId: number, data: InscricaoUpdateData) {
    await this.db.update(inscricaoTable).set(data).where(eq(inscricaoTable.id, inscricaoId))
  }

  async findInscricaoWithProjetoProfessor(inscricaoId: number) {
    return this.db.query.inscricaoTable.findFirst({
      where: eq(inscricaoTable.id, inscricaoId),
      with: {
        projeto: {
          with: {
            professorResponsavel: true,
          },
        },
      },
    })
  }
}

export const createInscricaoRepository = (db: Database) => new InscricaoRepository(db)
