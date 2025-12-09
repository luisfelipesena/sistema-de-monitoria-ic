import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import type { db } from '@/server/db'
import {
  alunoTable,
  configuracaoSistemaTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  vagaTable,
} from '@/server/db/schema'
import type { AdminType, ProjetoStatus, Semestre } from '@/types'
import { APPROVED, SUBMITTED } from '@/types'

type Database = typeof db

export function createAnalyticsRepository(db: Database) {
  return {
    async countActivePeriods(now: Date) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(periodoInscricaoTable)
        .where(and(lte(periodoInscricaoTable.dataInicio, now), gte(periodoInscricaoTable.dataFim, now)))
      return result?.count || 0
    },

    async countTotalProjects(adminType?: AdminType | null) {
      if (adminType) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(and(isNull(projetoTable.deletedAt), eq(departamentoTable.sigla, adminType)))
        return result?.count || 0
      }
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(isNull(projetoTable.deletedAt))
      return result?.count || 0
    },

    async countProjectsByStatus(status: ProjetoStatus, adminType?: AdminType | null) {
      if (adminType) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(
            and(eq(projetoTable.status, status), isNull(projetoTable.deletedAt), eq(departamentoTable.sigla, adminType))
          )
        return result?.count || 0
      }
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.status, status), isNull(projetoTable.deletedAt)))
      return result?.count || 0
    },

    async countTotalInscriptions(adminType?: AdminType | null) {
      if (adminType) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(inscricaoTable)
          .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
          .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(eq(departamentoTable.sigla, adminType))
        return result?.count || 0
      }
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(inscricaoTable)
      return result?.count || 0
    },

    async countTotalStudents() {
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(alunoTable)
      return result?.count || 0
    },

    async countTotalProfessors(adminType?: AdminType | null) {
      if (adminType) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(professorTable)
          .innerJoin(departamentoTable, eq(professorTable.departamentoId, departamentoTable.id))
          .where(eq(departamentoTable.sigla, adminType))
        return result?.count || 0
      }
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(professorTable)
      return result?.count || 0
    },

    async countTotalDepartments(adminType?: AdminType | null) {
      if (adminType) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(departamentoTable)
          .where(eq(departamentoTable.sigla, adminType))
        return result?.count || 0
      }
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(departamentoTable)
      return result?.count || 0
    },

    async countTotalDisciplines(adminType?: AdminType | null) {
      if (adminType) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(disciplinaTable)
          .innerJoin(departamentoTable, eq(disciplinaTable.departamentoId, departamentoTable.id))
          .where(and(isNull(disciplinaTable.deletedAt), eq(departamentoTable.sigla, adminType)))
        return result?.count || 0
      }
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(disciplinaTable)
        .where(isNull(disciplinaTable.deletedAt))
      return result?.count || 0
    },

    async getVagasStats(adminType?: AdminType | null) {
      const conditions = [eq(projetoTable.status, APPROVED), isNull(projetoTable.deletedAt)]

      if (adminType) {
        const [result] = await db
          .select({
            bolsas: sql<number>`coalesce(sum(${projetoTable.bolsasDisponibilizadas}), 0)::int`,
            voluntarios: sql<number>`coalesce(sum(${projetoTable.voluntariosSolicitados}), 0)::int`,
          })
          .from(projetoTable)
          .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(and(...conditions, eq(departamentoTable.sigla, adminType)))
        return {
          bolsas: result?.bolsas || 0,
          voluntarios: result?.voluntarios || 0,
        }
      }

      const [result] = await db
        .select({
          bolsas: sql<number>`coalesce(sum(${projetoTable.bolsasDisponibilizadas}), 0)::int`,
          voluntarios: sql<number>`coalesce(sum(${projetoTable.voluntariosSolicitados}), 0)::int`,
        })
        .from(projetoTable)
        .where(and(...conditions))
      return {
        bolsas: result?.bolsas || 0,
        voluntarios: result?.voluntarios || 0,
      }
    },

    async countOccupiedVagas(adminType?: AdminType | null) {
      if (adminType) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(vagaTable)
          .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
          .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(eq(departamentoTable.sigla, adminType))
        return result?.count || 0
      }
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(vagaTable)
      return result?.count || 0
    },

    async getProjectsByDepartment(adminType?: AdminType | null) {
      const query = db
        .select({
          departamento: departamentoTable.nome,
          sigla: departamentoTable.sigla,
          total: sql<number>`count(${projetoTable.id})::int`,
          aprovados: sql<number>`sum(case when ${projetoTable.status} = ${APPROVED} then 1 else 0 end)::int`,
          submetidos: sql<number>`sum(case when ${projetoTable.status} = ${SUBMITTED} then 1 else 0 end)::int`,
        })
        .from(departamentoTable)
        .leftJoin(
          projetoTable,
          and(eq(projetoTable.departamentoId, departamentoTable.id), isNull(projetoTable.deletedAt))
        )

      if (adminType) {
        return query
          .where(eq(departamentoTable.sigla, adminType))
          .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)
          .orderBy(sql`count(${projetoTable.id}) desc`)
      }

      return query
        .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)
        .orderBy(sql`count(${projetoTable.id}) desc`)
    },

    async getInscriptionsByPeriod(adminType?: AdminType | null) {
      if (adminType) {
        return db
          .select({
            periodo: sql<string>`${periodoInscricaoTable.ano} || '.' || ${periodoInscricaoTable.semestre}`,
            ano: periodoInscricaoTable.ano,
            semestre: periodoInscricaoTable.semestre,
            inscricoes: sql<number>`count(${inscricaoTable.id})::int`,
            projetos: sql<number>`count(distinct ${inscricaoTable.projetoId})::int`,
          })
          .from(periodoInscricaoTable)
          .leftJoin(inscricaoTable, eq(inscricaoTable.periodoInscricaoId, periodoInscricaoTable.id))
          .leftJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
          .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(eq(departamentoTable.sigla, adminType))
          .groupBy(periodoInscricaoTable.id, periodoInscricaoTable.ano, periodoInscricaoTable.semestre)
          .orderBy(desc(periodoInscricaoTable.ano), desc(periodoInscricaoTable.semestre))
          .limit(6)
      }

      return db
        .select({
          periodo: sql<string>`${periodoInscricaoTable.ano} || '.' || ${periodoInscricaoTable.semestre}`,
          ano: periodoInscricaoTable.ano,
          semestre: periodoInscricaoTable.semestre,
          inscricoes: sql<number>`count(${inscricaoTable.id})::int`,
          projetos: sql<number>`count(distinct ${inscricaoTable.projetoId})::int`,
        })
        .from(periodoInscricaoTable)
        .leftJoin(inscricaoTable, eq(inscricaoTable.periodoInscricaoId, periodoInscricaoTable.id))
        .groupBy(periodoInscricaoTable.id, periodoInscricaoTable.ano, periodoInscricaoTable.semestre)
        .orderBy(desc(periodoInscricaoTable.ano), desc(periodoInscricaoTable.semestre))
        .limit(6)
    },

    async getProfessorsByDepartment(adminType?: AdminType | null) {
      const query = db
        .select({
          departamento: departamentoTable.nome,
          professores: sql<number>`count(${professorTable.id})::int`,
          projetosAtivos: sql<number>`count(${projetoTable.id})::int`,
        })
        .from(departamentoTable)
        .leftJoin(professorTable, eq(professorTable.departamentoId, departamentoTable.id))
        .leftJoin(
          projetoTable,
          and(
            eq(projetoTable.professorResponsavelId, professorTable.id),
            eq(projetoTable.status, APPROVED),
            isNull(projetoTable.deletedAt)
          )
        )

      if (adminType) {
        return query
          .where(eq(departamentoTable.sigla, adminType))
          .groupBy(departamentoTable.id, departamentoTable.nome)
          .orderBy(sql`count(${professorTable.id}) desc`)
      }

      return query.groupBy(departamentoTable.id, departamentoTable.nome).orderBy(sql`count(${professorTable.id}) desc`)
    },

    async getRecentProjects(adminType?: AdminType | null) {
      const query = db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          status: projetoTable.status,
          createdAt: projetoTable.createdAt,
          professorResponsavelNome: professorTable.nomeCompleto,
          departamentoNome: departamentoTable.nome,
        })
        .from(projetoTable)
        .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))

      if (adminType) {
        return query
          .where(and(isNull(projetoTable.deletedAt), eq(departamentoTable.sigla, adminType)))
          .orderBy(desc(projetoTable.createdAt))
      }

      return query.where(isNull(projetoTable.deletedAt)).orderBy(desc(projetoTable.createdAt))
    },

    async getApprovedProjectsForPROGRAD(ano: number, semestre: Semestre, adminType?: AdminType | null) {
      const conditions = [
        eq(projetoTable.status, APPROVED),
        eq(projetoTable.ano, ano),
        eq(projetoTable.semestre, semestre),
        isNull(projetoTable.deletedAt),
      ]

      // Filter by department sigla if admin has a specific type
      if (adminType) {
        conditions.push(eq(departamentoTable.sigla, adminType))
      }

      return db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          disciplinaCodigo: disciplinaTable.codigo,
          professorNome: professorTable.nomeCompleto,
          professoresParticipantes: projetoTable.professoresParticipantes,
          departamentoNome: departamentoTable.nome,
          tipoProposicao: projetoTable.tipoProposicao,
        })
        .from(projetoTable)
        .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .leftJoin(projetoDisciplinaTable, eq(projetoTable.id, projetoDisciplinaTable.projetoId))
        .leftJoin(disciplinaTable, eq(projetoDisciplinaTable.disciplinaId, disciplinaTable.id))
        .where(and(...conditions))
        .orderBy(departamentoTable.nome, projetoTable.id)
    },

    async getDepartmentsWithEmails() {
      return db
        .select({
          id: departamentoTable.id,
          nome: departamentoTable.nome,
          sigla: departamentoTable.sigla,
          emailInstituto: departamentoTable.emailInstituto,
        })
        .from(departamentoTable)
    },

    async getConfiguracaoSistema(chave: string) {
      return db.query.configuracaoSistemaTable.findFirst({
        where: eq(configuracaoSistemaTable.chave, chave),
      })
    },
  }
}

export type AnalyticsRepository = ReturnType<typeof createAnalyticsRepository>
