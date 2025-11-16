import type { db } from '@/server/db'
import {
  alunoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  vagaTable,
} from '@/server/db/schema'
import type { Semestre, StatusInscricao, TipoVaga } from '@/types'
import { PROJETO_STATUS_APPROVED, STATUS_INSCRICAO_SUBMITTED, TIPO_VAGA_BOLSISTA } from '@/types'
import { and, count, desc, eq, inArray, isNull, sum } from 'drizzle-orm'

type Database = typeof db

export function createScholarshipAllocationRepository(db: Database) {
  return {
    async findPeriodo(ano: number, semestre: Semestre) {
      return db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
      })
    },

    async getTotalBolsasAlocadas(ano: number, semestre: Semestre) {
      const [totalRow] = await db
        .select({ total: sum(projetoTable.bolsasDisponibilizadas) })
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            isNull(projetoTable.deletedAt)
          )
        )

      return Number(totalRow?.total || 0)
    },

    async getApprovedProjects(ano: number, semestre: Semestre) {
      return db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          professorResponsavel: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
            emailInstitucional: professorTable.emailInstitucional,
          },
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(projetoTable.deletedAt)
          )
        )
        .orderBy(desc(projetoTable.titulo))
    },

    async getDisciplinasForProject(projetoId: number) {
      return db
        .select({
          id: disciplinaTable.id,
          codigo: disciplinaTable.codigo,
          nome: disciplinaTable.nome,
        })
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, projetoId))
    },

    async getBolsasAlocadas(projetoId: number) {
      const bolsasAlocadas = await db
        .select({ count: count() })
        .from(vagaTable)
        .where(and(eq(vagaTable.projetoId, projetoId), eq(vagaTable.tipo, TIPO_VAGA_BOLSISTA)))

      return bolsasAlocadas[0]?.count || 0
    },

    async findProjetoById(projetoId: number) {
      return db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, projetoId),
        columns: {
          id: true,
          ano: true,
          semestre: true,
          bolsasDisponibilizadas: true,
        },
      })
    },

    async findProjetosByIds(projetoIds: number[]) {
      return db
        .select({
          id: projetoTable.id,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
        })
        .from(projetoTable)
        .where(inArray(projetoTable.id, projetoIds))
    },

    async updateBolsasDisponibilizadas(projetoId: number, bolsasDisponibilizadas: number) {
      await db.update(projetoTable).set({ bolsasDisponibilizadas }).where(eq(projetoTable.id, projetoId))
    },

    async updateTotalBolsasPrograd(periodoId: number, totalBolsas: number) {
      await db
        .update(periodoInscricaoTable)
        .set({ totalBolsasPrograd: totalBolsas })
        .where(eq(periodoInscricaoTable.id, periodoId))
    },

    async getAllocationSummary(ano: number, semestre: Semestre) {
      const summary = await db
        .select({
          totalProjetos: count(),
          totalBolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          totalBolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
          totalVoluntariosSolicitados: sum(projetoTable.voluntariosSolicitados),
        })
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(projetoTable.deletedAt)
          )
        )

      return (
        summary[0] || {
          totalProjetos: 0,
          totalBolsasSolicitadas: 0,
          totalBolsasDisponibilizadas: 0,
          totalVoluntariosSolicitados: 0,
        }
      )
    },

    async getDepartmentSummary(ano: number, semestre: Semestre) {
      const departmentSummary = await db
        .select({
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(),
          bolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          bolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(projetoTable.deletedAt)
          )
        )
        .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)

      return departmentSummary.map((dept) => ({
        departamento: dept.departamento,
        projetos: dept.projetos,
        bolsasSolicitadas: Number(dept.bolsasSolicitadas) || 0,
        bolsasDisponibilizadas: Number(dept.bolsasDisponibilizadas) || 0,
      }))
    },

    async getCandidatesForProject(projetoId: number) {
      return db
        .select({
          id: inscricaoTable.id,
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            emailInstitucional: alunoTable.emailInstitucional,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          status: inscricaoTable.status,
          notaFinal: inscricaoTable.notaFinal,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          coeficienteRendimento: inscricaoTable.coeficienteRendimento,
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .where(and(eq(inscricaoTable.projetoId, projetoId), eq(inscricaoTable.status, STATUS_INSCRICAO_SUBMITTED)))
        .orderBy(desc(inscricaoTable.notaFinal))
    },

    async updateInscricaoStatus(inscricaoId: number, status: StatusInscricao) {
      await db.update(inscricaoTable).set({ status }).where(eq(inscricaoTable.id, inscricaoId))
    },

    async findInscricaoById(inscricaoId: number) {
      return db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, inscricaoId),
      })
    },

    async createVaga(alunoId: number, projetoId: number, inscricaoId: number, tipo: TipoVaga) {
      await db.insert(vagaTable).values({
        alunoId,
        projetoId,
        inscricaoId,
        tipo,
      })
    },

    async getProjectsWithProfessors(ano: number, semestre: Semestre) {
      return db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          professorId: professorTable.id,
          professorNome: professorTable.nomeCompleto,
          professorEmail: professorTable.emailInstitucional,
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(
          and(
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(projetoTable.deletedAt)
          )
        )
    },
  }
}

export type ScholarshipAllocationRepository = ReturnType<typeof createScholarshipAllocationRepository>
