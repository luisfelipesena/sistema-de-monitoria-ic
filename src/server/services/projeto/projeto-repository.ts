import type { db } from '@/server/db'
import {
  alunoTable,
  ataSelecaoTable,
  atividadeProjetoTable,
  departamentoTable,
  disciplinaProfessorResponsavelTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import type { ProjetoStatus, Semestre, StatusInscricao } from '@/types'
import { ADMIN, PROJETO_STATUS_APPROVED, TIPO_PROPOSICAO_COLETIVA } from '@/types'
import type { InferInsertModel, SQL } from 'drizzle-orm'
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from 'drizzle-orm'

export type ProjetoInsert = InferInsertModel<typeof projetoTable>
export type AtividadeProjetoInsert = InferInsertModel<typeof atividadeProjetoTable>
export type ProjetoDisciplinaInsert = InferInsertModel<typeof projetoDisciplinaTable>
export type DisciplinaProfessorInsert = InferInsertModel<typeof disciplinaProfessorResponsavelTable>

type Database = typeof db

export interface ProjetoFilters {
  ano?: number[]
  semestre?: Semestre[]
  status?: ProjetoStatus[]
  disciplina?: string // LIKE search on disciplina codigo or nome
  professorNome?: string // LIKE search on professor name
  departamentoId?: number
  limit?: number
  offset?: number
}

export function createProjetoRepository(db: Database) {
  return {
    // Basic CRUD
    async findById(id: number) {
      return db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, id), isNull(projetoTable.deletedAt)),
      })
    },

    async findByIdWithRelations(id: number) {
      return db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, id), isNull(projetoTable.deletedAt)),
        with: {
          departamento: true,
          professorResponsavel: true,
        },
      })
    },

    async findByProfessorId(professorId: number) {
      return db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          departamentoId: projetoTable.departamentoId,
          departamentoNome: departamentoTable.nome,
          professorResponsavelId: projetoTable.professorResponsavelId,
          professorResponsavelNome: professorTable.nomeCompleto,
          status: projetoTable.status,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          tipoProposicao: projetoTable.tipoProposicao,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          cargaHorariaSemana: projetoTable.cargaHorariaSemana,
          numeroSemanas: projetoTable.numeroSemanas,
          publicoAlvo: projetoTable.publicoAlvo,
          estimativaPessoasBenificiadas: projetoTable.estimativaPessoasBenificiadas,
          descricao: projetoTable.descricao,
          assinaturaProfessor: projetoTable.assinaturaProfessor,
          feedbackAdmin: projetoTable.feedbackAdmin,
          mensagemRevisao: projetoTable.mensagemRevisao,
          revisaoSolicitadaEm: projetoTable.revisaoSolicitadaEm,
          editalInternoId: projetoTable.editalInternoId,
          createdAt: projetoTable.createdAt,
          updatedAt: projetoTable.updatedAt,
          deletedAt: projetoTable.deletedAt,
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(and(eq(projetoTable.professorResponsavelId, professorId), isNull(projetoTable.deletedAt)))
        .orderBy(projetoTable.createdAt)
    },

    async findAll(departmentSigla?: string | null) {
      const conditions = [isNull(projetoTable.deletedAt)]

      // Filter by department sigla if provided (for admin type filtering)
      if (departmentSigla) {
        conditions.push(eq(departamentoTable.sigla, departmentSigla))
      }

      return db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          departamentoId: projetoTable.departamentoId,
          departamentoNome: departamentoTable.nome,
          departamentoSigla: departamentoTable.sigla,
          professorResponsavelId: projetoTable.professorResponsavelId,
          professorResponsavelNome: professorTable.nomeCompleto,
          status: projetoTable.status,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          tipoProposicao: projetoTable.tipoProposicao,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          cargaHorariaSemana: projetoTable.cargaHorariaSemana,
          numeroSemanas: projetoTable.numeroSemanas,
          publicoAlvo: projetoTable.publicoAlvo,
          estimativaPessoasBenificiadas: projetoTable.estimativaPessoasBenificiadas,
          descricao: projetoTable.descricao,
          assinaturaProfessor: projetoTable.assinaturaProfessor,
          feedbackAdmin: projetoTable.feedbackAdmin,
          mensagemRevisao: projetoTable.mensagemRevisao,
          revisaoSolicitadaEm: projetoTable.revisaoSolicitadaEm,
          editalInternoId: projetoTable.editalInternoId,
          createdAt: projetoTable.createdAt,
          updatedAt: projetoTable.updatedAt,
          deletedAt: projetoTable.deletedAt,
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(and(...conditions))
        .orderBy(projetoTable.createdAt)
    },

    /**
     * Find projects with server-side filtering and pagination
     */
    async findAllFiltered(filters: ProjetoFilters, departmentSigla?: string | null) {
      const conditions: SQL[] = [isNull(projetoTable.deletedAt)]

      // Admin type filtering by department sigla
      if (departmentSigla) {
        conditions.push(eq(departamentoTable.sigla, departmentSigla))
      }

      // Filter by ano (multiple values)
      if (filters.ano && filters.ano.length > 0) {
        conditions.push(inArray(projetoTable.ano, filters.ano))
      }

      // Filter by semestre (multiple values)
      if (filters.semestre && filters.semestre.length > 0) {
        conditions.push(inArray(projetoTable.semestre, filters.semestre))
      }

      // Filter by status (multiple values)
      if (filters.status && filters.status.length > 0) {
        conditions.push(inArray(projetoTable.status, filters.status))
      }

      // Filter by professor name (ILIKE search - case insensitive)
      if (filters.professorNome) {
        conditions.push(ilike(professorTable.nomeCompleto, `%${filters.professorNome}%`))
      }

      // Filter by departamento ID
      if (filters.departamentoId) {
        conditions.push(eq(projetoTable.departamentoId, filters.departamentoId))
      }

      // Filter by disciplina code/name OR professor name (SQL-level, before pagination)
      if (filters.disciplina) {
        const search = `%${filters.disciplina}%`
        conditions.push(
          or(
            ilike(professorTable.nomeCompleto, search),
            sql`EXISTS (
              SELECT 1 FROM ${projetoDisciplinaTable}
              INNER JOIN ${disciplinaTable} ON ${disciplinaTable.id} = ${projetoDisciplinaTable.disciplinaId}
              WHERE ${projetoDisciplinaTable.projetoId} = ${projetoTable.id}
              AND (${ilike(disciplinaTable.codigo, search)} OR ${ilike(disciplinaTable.nome, search)})
            )`
          ) as SQL
        )
      }

      // Build base query
      let query = db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          departamentoId: projetoTable.departamentoId,
          departamentoNome: departamentoTable.nome,
          departamentoSigla: departamentoTable.sigla,
          professorResponsavelId: projetoTable.professorResponsavelId,
          professorResponsavelNome: professorTable.nomeCompleto,
          status: projetoTable.status,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          tipoProposicao: projetoTable.tipoProposicao,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          cargaHorariaSemana: projetoTable.cargaHorariaSemana,
          numeroSemanas: projetoTable.numeroSemanas,
          publicoAlvo: projetoTable.publicoAlvo,
          estimativaPessoasBenificiadas: projetoTable.estimativaPessoasBenificiadas,
          descricao: projetoTable.descricao,
          assinaturaProfessor: projetoTable.assinaturaProfessor,
          feedbackAdmin: projetoTable.feedbackAdmin,
          mensagemRevisao: projetoTable.mensagemRevisao,
          revisaoSolicitadaEm: projetoTable.revisaoSolicitadaEm,
          editalInternoId: projetoTable.editalInternoId,
          createdAt: projetoTable.createdAt,
          updatedAt: projetoTable.updatedAt,
          deletedAt: projetoTable.deletedAt,
        })
        .from(projetoTable)
        .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(and(...conditions))
        .orderBy(desc(projetoTable.ano), desc(projetoTable.semestre), asc(projetoTable.titulo))

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit) as typeof query
      }
      if (filters.offset) {
        query = query.offset(filters.offset) as typeof query
      }

      return query
    },

    /**
     * Count projects with server-side filtering (same WHERE conditions as findAllFiltered)
     */
    async countFiltered(filters: ProjetoFilters, departmentSigla?: string | null): Promise<number> {
      const conditions: SQL[] = [isNull(projetoTable.deletedAt)]

      if (departmentSigla) {
        conditions.push(eq(departamentoTable.sigla, departmentSigla))
      }

      if (filters.ano && filters.ano.length > 0) {
        conditions.push(inArray(projetoTable.ano, filters.ano))
      }

      if (filters.semestre && filters.semestre.length > 0) {
        conditions.push(inArray(projetoTable.semestre, filters.semestre))
      }

      if (filters.status && filters.status.length > 0) {
        conditions.push(inArray(projetoTable.status, filters.status))
      }

      if (filters.professorNome) {
        conditions.push(ilike(professorTable.nomeCompleto, `%${filters.professorNome}%`))
      }

      if (filters.departamentoId) {
        conditions.push(eq(projetoTable.departamentoId, filters.departamentoId))
      }

      // Same EXISTS pattern as findAllFiltered for consistency
      if (filters.disciplina) {
        const search = `%${filters.disciplina}%`
        conditions.push(
          or(
            ilike(professorTable.nomeCompleto, search),
            sql`EXISTS (
              SELECT 1 FROM ${projetoDisciplinaTable}
              INNER JOIN ${disciplinaTable} ON ${disciplinaTable.id} = ${projetoDisciplinaTable.disciplinaId}
              WHERE ${projetoDisciplinaTable.projetoId} = ${projetoTable.id}
              AND (${ilike(disciplinaTable.codigo, search)} OR ${ilike(disciplinaTable.nome, search)})
            )`
          ) as SQL
        )
      }

      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(and(...conditions))

      return result?.count || 0
    },

    async findApprovedByPeriod(ano: number, semestre: Semestre) {
      return db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          descricao: projetoTable.descricao,
          departamentoNome: departamentoTable.nome,
          professorResponsavelNome: professorTable.nomeCompleto,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          cargaHorariaSemana: projetoTable.cargaHorariaSemana,
          publicoAlvo: projetoTable.publicoAlvo,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(
          and(
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(projetoTable.deletedAt)
          )
        )
        .orderBy(projetoTable.titulo)
    },

    async findExistingByDisciplinaPeriod(ano: number, semestre: Semestre) {
      return db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre), isNull(projetoTable.deletedAt)),
        with: {
          disciplinas: {
            with: {
              disciplina: true,
            },
          },
        },
      })
    },

    async insert(data: ProjetoInsert) {
      const [projeto] = await db.insert(projetoTable).values(data).returning()
      return projeto
    },

    async update(id: number, data: Partial<ProjetoInsert>) {
      const [projeto] = await db
        .update(projetoTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projetoTable.id, id))
        .returning()
      return projeto
    },

    async softDelete(id: number) {
      await db.update(projetoTable).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(projetoTable.id, id))
    },

    // Disciplinas
    async findDisciplinasByProjetoId(projetoId: number) {
      return db
        .select({
          id: disciplinaTable.id,
          nome: disciplinaTable.nome,
          codigo: disciplinaTable.codigo,
        })
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, projetoId))
    },

    async insertProjetoDisciplinas(values: ProjetoDisciplinaInsert[]) {
      if (values.length === 0) return
      await db.insert(projetoDisciplinaTable).values(values)
    },

    async findDisciplinaById(id: number) {
      return db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.id, id),
      })
    },

    async findDisciplinaProfessorAssociation(
      disciplinaId: number,
      professorId: number,
      ano: number,
      semestre: Semestre
    ) {
      return db.query.disciplinaProfessorResponsavelTable.findFirst({
        where: and(
          eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaId),
          eq(disciplinaProfessorResponsavelTable.professorId, professorId),
          eq(disciplinaProfessorResponsavelTable.ano, ano),
          eq(disciplinaProfessorResponsavelTable.semestre, semestre)
        ),
      })
    },

    async insertDisciplinaProfessor(data: DisciplinaProfessorInsert) {
      await db.insert(disciplinaProfessorResponsavelTable).values(data)
    },

    // Atividades
    async findAtividadesByProjetoId(projetoId: number) {
      return db.query.atividadeProjetoTable.findMany({
        where: eq(atividadeProjetoTable.projetoId, projetoId),
      })
    },

    async insertAtividades(values: AtividadeProjetoInsert[]) {
      if (values.length === 0) return
      await db.insert(atividadeProjetoTable).values(values)
    },

    async deleteAtividadesByProjetoId(projetoId: number) {
      await db.delete(atividadeProjetoTable).where(eq(atividadeProjetoTable.projetoId, projetoId))
    },

    // Professores Participantes
    async findProfessoresParticipantes(projetoId: number) {
      return db
        .select({
          id: professorTable.id,
          nomeCompleto: professorTable.nomeCompleto,
        })
        .from(professorTable)
        .innerJoin(
          projetoProfessorParticipanteTable,
          eq(professorTable.id, projetoProfessorParticipanteTable.professorId)
        )
        .where(eq(projetoProfessorParticipanteTable.projetoId, projetoId))
    },

    // Inscrições
    async getInscricoesCount() {
      return db
        .select({
          projetoId: inscricaoTable.projetoId,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          count: sql<number>`count(*)`,
        })
        .from(inscricaoTable)
        .groupBy(inscricaoTable.projetoId, inscricaoTable.tipoVagaPretendida)
    },

    async getInscricoesCountByProjetoId(projetoId: number) {
      return db
        .select({
          projetoId: inscricaoTable.projetoId,
          count: sql<number>`count(*)`,
        })
        .from(inscricaoTable)
        .where(eq(inscricaoTable.projetoId, projetoId))
        .groupBy(inscricaoTable.projetoId)
    },

    async findInscricoesByAlunoId(alunoId: number) {
      return db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.alunoId, alunoId),
      })
    },

    async findInscricoesByProjetoId(projetoId: number) {
      return db
        .select({
          id: inscricaoTable.id,
          aluno: {
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          coeficienteRendimento: inscricaoTable.coeficienteRendimento,
          notaFinal: inscricaoTable.notaFinal,
          status: inscricaoTable.status,
          observacoes: inscricaoTable.feedbackProfessor,
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .where(eq(inscricaoTable.projetoId, projetoId))
        .orderBy(desc(inscricaoTable.notaFinal))
    },

    async findInscricoesWithUserByProjetoId(projetoId: number) {
      return db
        .select({
          inscricao: {
            id: inscricaoTable.id,
            status: inscricaoTable.status,
            feedbackProfessor: inscricaoTable.feedbackProfessor,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
          },
          user: {
            email: userTable.email,
          },
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .where(eq(inscricaoTable.projetoId, projetoId))
    },

    async findAcceptedVolunteersByProfessorId(professorId: number, status: StatusInscricao) {
      return db
        .select({
          id: inscricaoTable.id,
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            telefone: alunoTable.telefone,
          },
          alunoUser: {
            email: userTable.email,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
          },
          status: inscricaoTable.status,
          createdAt: inscricaoTable.createdAt,
        })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .where(and(eq(projetoTable.professorResponsavelId, professorId), eq(inscricaoTable.status, status)))
    },

    async findInscricaoByAlunoIdAndStatus(alunoId: number, status: StatusInscricao) {
      return db.query.inscricaoTable.findFirst({
        where: and(eq(inscricaoTable.alunoId, alunoId), eq(inscricaoTable.status, status)),
        with: {
          projeto: true,
        },
      })
    },

    // Período de Inscrição
    async findActivePeriodo(ano: number, semestre: Semestre, now: Date) {
      return db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, ano),
          eq(periodoInscricaoTable.semestre, semestre),
          lte(periodoInscricaoTable.dataInicio, now),
          gte(periodoInscricaoTable.dataFim, now)
        ),
      })
    },

    async findPeriodoByProjetoSemestre(ano: number, semestre: Semestre) {
      return db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
        with: {
          edital: {
            columns: {
              numeroEdital: true,
              publicado: true,
            },
          },
        },
      })
    },

    async findEditaisByPeriodos() {
      return db.query.editalTable.findMany({
        columns: {
          id: true,
          numeroEdital: true,
          publicado: true,
        },
        with: {
          periodoInscricao: {
            columns: {
              ano: true,
              semestre: true,
              numeroEditalPrograd: true,
            },
          },
        },
      })
    },

    // Ata de Seleção
    async findAtaByProjetoId(projetoId: number) {
      return db.query.ataSelecaoTable.findFirst({
        where: eq(ataSelecaoTable.projetoId, projetoId),
      })
    },

    async insertAta(projetoId: number, geradoPorUserId: number) {
      const [ata] = await db
        .insert(ataSelecaoTable)
        .values({
          projetoId,
          geradoPorUserId,
        })
        .returning({ id: ataSelecaoTable.id })
      return ata
    },

    async updateAta(id: number) {
      await db
        .update(ataSelecaoTable)
        .set({
          dataGeracao: new Date(),
        })
        .where(eq(ataSelecaoTable.id, id))
    },

    // Users
    async findAdmins() {
      return db.query.userTable.findMany({
        where: eq(userTable.role, ADMIN),
      })
    },

    async findProfessorById(id: number) {
      return db.query.professorTable.findFirst({
        where: eq(professorTable.id, id),
      })
    },

    async findProfessorByUserId(userId: number) {
      return db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })
    },

    async findAlunoByUserId(userId: number) {
      return db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, userId),
      })
    },

    /**
     * Find project IDs that are INDIVIDUAL and covered by an APPROVED COLETIVA project
     * for the same discipline, ano, and semestre.
     */
    async findProjectIdsCoveredByCollective(projectIds: number[]): Promise<Set<number>> {
      if (projectIds.length === 0) return new Set()

      // Get discipline+period info for all given projects
      const projectDisciplinas = await db
        .select({
          projetoId: projetoDisciplinaTable.projetoId,
          disciplinaId: projetoDisciplinaTable.disciplinaId,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          tipoProposicao: projetoTable.tipoProposicao,
        })
        .from(projetoDisciplinaTable)
        .innerJoin(projetoTable, eq(projetoDisciplinaTable.projetoId, projetoTable.id))
        .where(inArray(projetoDisciplinaTable.projetoId, projectIds))

      // Find all APPROVED COLETIVA projects
      const approvedCollectives = await db
        .select({
          projetoId: projetoTable.id,
          disciplinaId: projetoDisciplinaTable.disciplinaId,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
        })
        .from(projetoTable)
        .innerJoin(projetoDisciplinaTable, eq(projetoTable.id, projetoDisciplinaTable.projetoId))
        .where(
          and(
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            eq(projetoTable.tipoProposicao, TIPO_PROPOSICAO_COLETIVA),
            isNull(projetoTable.deletedAt)
          )
        )

      // Build a set of "disciplinaId_ano_semestre" keys for approved collectives
      const collectiveKeys = new Set(approvedCollectives.map((c) => `${c.disciplinaId}_${c.ano}_${c.semestre}`))

      // Find INDIVIDUAL projects whose discipline+period is covered
      const coveredIds = new Set<number>()
      for (const pd of projectDisciplinas) {
        if (pd.tipoProposicao !== TIPO_PROPOSICAO_COLETIVA) {
          const key = `${pd.disciplinaId}_${pd.ano}_${pd.semestre}`
          if (collectiveKeys.has(key)) {
            coveredIds.add(pd.projetoId)
          }
        }
      }

      return coveredIds
    },
  }
}

export type ProjetoRepository = ReturnType<typeof createProjetoRepository>
