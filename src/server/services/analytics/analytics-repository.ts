import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import type { db } from '@/server/db'
import {
  alunoTable,
  cursoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoTable,
  vagaTable,
} from '@/server/db/schema'
import type { ProjetoStatus, Semestre } from '@/types'
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

    async countTotalProjects() {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(isNull(projetoTable.deletedAt))
      return result?.count || 0
    },

    async countProjectsByStatus(status: ProjetoStatus) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.status, status), isNull(projetoTable.deletedAt)))
      return result?.count || 0
    },

    async countTotalInscriptions() {
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(inscricaoTable)
      return result?.count || 0
    },

    async countTotalStudents() {
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(alunoTable)
      return result?.count || 0
    },

    async countTotalProfessors() {
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(professorTable)
      return result?.count || 0
    },

    async countTotalDepartments() {
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(departamentoTable)
      return result?.count || 0
    },

    async countTotalCourses() {
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(cursoTable)
      return result?.count || 0
    },

    async countTotalDisciplines() {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(disciplinaTable)
        .where(isNull(disciplinaTable.deletedAt))
      return result?.count || 0
    },

    async getVagasStats() {
      const [result] = await db
        .select({
          bolsas: sql<number>`coalesce(sum(${projetoTable.bolsasDisponibilizadas}), 0)::int`,
          voluntarios: sql<number>`coalesce(sum(${projetoTable.voluntariosSolicitados}), 0)::int`,
        })
        .from(projetoTable)
        .where(and(eq(projetoTable.status, APPROVED), isNull(projetoTable.deletedAt)))
      return {
        bolsas: result?.bolsas || 0,
        voluntarios: result?.voluntarios || 0,
      }
    },

    async countOccupiedVagas() {
      const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(vagaTable)
      return result?.count || 0
    },

    async getProjectsByDepartment() {
      return db
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
        .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)
        .orderBy(sql`count(${projetoTable.id}) desc`)
    },

    async getInscriptionsByPeriod() {
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

    async getStudentsByCourse() {
      return db
        .select({
          curso: cursoTable.nome,
          alunos: sql<number>`count(${alunoTable.id})::int`,
          inscricoes: sql<number>`count(${inscricaoTable.id})::int`,
        })
        .from(cursoTable)
        .leftJoin(alunoTable, eq(alunoTable.cursoId, cursoTable.id))
        .leftJoin(inscricaoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .groupBy(cursoTable.id, cursoTable.nome)
        .orderBy(sql`count(${alunoTable.id}) desc`)
        .limit(10)
    },

    async getProfessorsByDepartment() {
      return db
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
        .groupBy(departamentoTable.id, departamentoTable.nome)
        .orderBy(sql`count(${professorTable.id}) desc`)
    },

    async getRecentProjects() {
      return db
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
        .where(isNull(projetoTable.deletedAt))
        .orderBy(desc(projetoTable.createdAt))
    },

    async getApprovedProjectsForPROGRAD(ano: number, semestre: Semestre) {
      return db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          professorNome: professorTable.nomeCompleto,
          professoresParticipantes: projetoTable.professoresParticipantes,
          departamentoNome: departamentoTable.nome,
          tipoProposicao: projetoTable.tipoProposicao,
        })
        .from(projetoTable)
        .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(projetoTable.status, APPROVED),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(projetoTable.deletedAt)
          )
        )
        .orderBy(departamentoTable.nome, projetoTable.id)
    },

    async getDepartmentsWithEmails() {
      return db
        .select({
          id: departamentoTable.id,
          nome: departamentoTable.nome,
          emailInstituto: departamentoTable.emailInstituto,
        })
        .from(departamentoTable)
    },
  }
}

export type AnalyticsRepository = ReturnType<typeof createAnalyticsRepository>
