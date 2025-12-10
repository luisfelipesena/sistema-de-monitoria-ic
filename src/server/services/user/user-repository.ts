import type { db } from '@/server/db'
import {
  alunoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  professorInvitationTable,
  professorTable,
  projetoTable,
  sessionTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import type { AdminType, Regime, UserRole } from '@/types'
import {
  PROFESSOR,
  PROFESSOR_STATUS_ATIVO,
  PROFESSOR_STATUS_INATIVO,
  PROJETO_STATUS_APPROVED,
  STUDENT,
  TIPO_VAGA_BOLSISTA,
  TIPO_VAGA_VOLUNTARIO,
} from '@/types'
import { and, eq, isNull, like, or, sql, type SQL } from 'drizzle-orm'
type Database = typeof db

export interface UserFilters {
  search?: string
  role?: UserRole
  limit?: number
  offset?: number
}

export interface UpdateProfileData {
  username?: string
  professorData?: {
    nomeCompleto: string
    cpf: string
    telefone?: string
    telefoneInstitucional?: string
    regime: Regime
  }
  studentData?: {
    nomeCompleto: string
    matricula: string
    cpf: string
    cr: number
    cursoNome?: string
    telefone?: string
    banco?: string
    agencia?: string
    conta?: string
    digitoConta?: string
  }
}

export const createUserRepository = (db: Database) => {
  return {
    async findMany(filters: UserFilters) {
      const whereConditions: SQL[] = []

      if (filters.role) {
        whereConditions.push(eq(userTable.role, filters.role))
      }

      if (filters.search) {
        const searchCondition = or(
          like(userTable.username, `%${filters.search}%`),
          like(userTable.email, `%${filters.search}%`)
        )
        if (searchCondition) {
          whereConditions.push(searchCondition)
        }
      }

      return db.query.userTable.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          professorProfile: {
            with: {
              departamento: true,
            },
          },
          studentProfile: true,
        },
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        orderBy: (table, { asc }) => [asc(table.username)],
      })
    },

    async count(filters: UserFilters): Promise<number> {
      const whereConditions: SQL[] = []

      if (filters.role) {
        whereConditions.push(eq(userTable.role, filters.role))
      }

      if (filters.search) {
        const searchCondition = or(
          like(userTable.username, `%${filters.search}%`),
          like(userTable.email, `%${filters.search}%`)
        )
        if (searchCondition) {
          whereConditions.push(searchCondition)
        }
      }

      return db.$count(userTable, whereConditions.length > 0 ? and(...whereConditions) : undefined)
    },

    async findById(id: number) {
      return db.query.userTable.findFirst({
        where: eq(userTable.id, id),
        with: {
          professorProfile: {
            with: {
              departamento: true,
            },
          },
          studentProfile: true,
        },
      })
    },

    async getProfessorStats(professorId: number) {
      const [projetosCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.professorResponsavelId, professorId), isNull(projetoTable.deletedAt)))

      const [projetosAtivosCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.professorResponsavelId, professorId),
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            isNull(projetoTable.deletedAt)
          )
        )

      return {
        projetos: projetosCount?.count || 0,
        projetosAtivos: projetosAtivosCount?.count || 0,
      }
    },

    async getStudentStats(studentId: number) {
      const [inscricoesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(inscricaoTable)
        .where(eq(inscricaoTable.alunoId, studentId))

      const [bolsasAtivasCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(vagaTable)
        .where(and(eq(vagaTable.alunoId, studentId), eq(vagaTable.tipo, TIPO_VAGA_BOLSISTA)))

      const [voluntariadosAtivosCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(vagaTable)
        .where(and(eq(vagaTable.alunoId, studentId), eq(vagaTable.tipo, TIPO_VAGA_VOLUNTARIO)))

      const [totalDocumentosCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(inscricaoDocumentoTable)
        .innerJoin(inscricaoTable, eq(inscricaoDocumentoTable.inscricaoId, inscricaoTable.id))
        .where(eq(inscricaoTable.alunoId, studentId))

      const [documentosValidadosCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(inscricaoDocumentoTable)
        .innerJoin(inscricaoTable, eq(inscricaoDocumentoTable.inscricaoId, inscricaoTable.id))
        .where(
          and(
            eq(inscricaoTable.alunoId, studentId),
            sql`${inscricaoTable.status} IN ('ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO')`
          )
        )

      return {
        inscricoes: inscricoesCount?.count || 0,
        bolsasAtivas: bolsasAtivasCount?.count || 0,
        voluntariadosAtivos: voluntariadosAtivosCount?.count || 0,
        totalDocumentos: totalDocumentosCount?.count || 0,
        documentosValidados: documentosValidadosCount?.count || 0,
      }
    },

    async updateProfile(userId: number, data: UpdateProfileData) {
      return db.transaction(async (tx) => {
        if (data.username) {
          await tx.update(userTable).set({ username: data.username }).where(eq(userTable.id, userId))
        }

        if (data.professorData) {
          await tx
            .update(professorTable)
            .set({
              nomeCompleto: data.professorData.nomeCompleto,
              cpf: data.professorData.cpf,
              telefone: data.professorData.telefone,
              telefoneInstitucional: data.professorData.telefoneInstitucional,
              regime: data.professorData.regime as Regime,
              updatedAt: new Date(),
            })
            .where(eq(professorTable.userId, userId))
        }

        if (data.studentData) {
          await tx
            .update(alunoTable)
            .set({
              nomeCompleto: data.studentData.nomeCompleto,
              matricula: data.studentData.matricula,
              cpf: data.studentData.cpf,
              cr: data.studentData.cr,
              cursoNome: data.studentData.cursoNome,
              telefone: data.studentData.telefone,
              banco: data.studentData.banco,
              agencia: data.studentData.agencia,
              conta: data.studentData.conta,
              digitoConta: data.studentData.digitoConta,
              updatedAt: new Date(),
            })
            .where(eq(alunoTable.userId, userId))
        }
      })
    },

    async update(id: number, data: { username?: string; email?: string; role?: UserRole }) {
      await db.update(userTable).set(data).where(eq(userTable.id, id))
    },

    async updateProfessorStatus(
      userId: number,
      status: typeof PROFESSOR_STATUS_ATIVO | typeof PROFESSOR_STATUS_INATIVO
    ) {
      const newRole = status === PROFESSOR_STATUS_ATIVO ? PROFESSOR : PROFESSOR

      await db.transaction(async (tx) => {
        await tx.update(userTable).set({ role: newRole }).where(eq(userTable.id, userId))

        await tx.update(professorTable).set({ updatedAt: new Date() }).where(eq(professorTable.userId, userId))
      })
    },

    async isProfessor(userId: number): Promise<boolean> {
      const user = await db.query.userTable.findFirst({
        where: eq(userTable.id, userId),
      })
      return user?.role === PROFESSOR
    },

    async isStudent(userId: number): Promise<boolean> {
      const user = await db.query.userTable.findFirst({
        where: eq(userTable.id, userId),
      })
      return user?.role === STUDENT
    },

    async updateAdminType(userId: number, adminType: AdminType) {
      await db.update(userTable).set({ adminType }).where(eq(userTable.id, userId))
    },

    async hasActiveProjects(professorId: number): Promise<boolean> {
      const [count] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.professorResponsavelId, professorId), isNull(projetoTable.deletedAt)))

      return (count?.count || 0) > 0
    },

    async hasActiveInscricoes(alunoId: number): Promise<boolean> {
      const [count] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(inscricaoTable)
        .where(eq(inscricaoTable.alunoId, alunoId))

      return (count?.count || 0) > 0
    },

    async deleteUser(userId: number) {
      await db.transaction(async (tx) => {
        // Delete sessions first
        await tx.delete(sessionTable).where(eq(sessionTable.userId, userId))

        // Delete professor invitation if exists
        const professor = await tx.query.professorTable.findFirst({
          where: eq(professorTable.userId, userId),
        })

        if (professor) {
          await tx.delete(professorInvitationTable).where(eq(professorInvitationTable.professorId, professor.id))
        }

        // The cascade should handle professor/aluno tables, but let's be explicit
        await tx.delete(professorTable).where(eq(professorTable.userId, userId))
        await tx.delete(alunoTable).where(eq(alunoTable.userId, userId))

        // Finally delete the user
        await tx.delete(userTable).where(eq(userTable.id, userId))
      })
    },
  }
}
