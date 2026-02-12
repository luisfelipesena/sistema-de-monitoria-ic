import type { db } from '@/server/db'
import {
  alunoTable,
  assinaturaDocumentoTable,
  ataSelecaoTable,
  auditLogTable,
  disciplinaProfessorResponsavelTable,
  editalSignatureTokenTable,
  editalTable,
  importacaoPlanejamentoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  notificacaoHistoricoTable,
  professorInvitationTable,
  professorTable,
  projetoDocumentoTable,
  projetoProfessorParticipanteTable,
  projetoTable,
  projetoTemplateTable,
  publicPdfTokenTable,
  relatorioTemplateTable,
  reminderExecutionLogTable,
  sessionTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import { normalizePhone, type AdminType, type Regime, type TipoProfessor, type UserRole } from '@/types'
import {
  PROFESSOR,
  PROFESSOR_STATUS_ATIVO,
  PROFESSOR_STATUS_INATIVO,
  PROJETO_STATUS_APPROVED,
  STUDENT,
  TIPO_VAGA_BOLSISTA,
  TIPO_VAGA_VOLUNTARIO,
} from '@/types'
import { and, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm'
type Database = typeof db

export interface UserFilters {
  search?: string
  role?: UserRole[]
  nomeCompleto?: string
  emailInstitucional?: string
  departamentoId?: number[]
  cursoNome?: string
  regime?: Regime[]
  tipoProfessor?: TipoProfessor[]
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
    tipoProfessor?: TipoProfessor
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
  // Build subquery for profile-based filtering
  const buildProfileFilteredUserIds = async (filters: UserFilters): Promise<number[] | null> => {
    const hasProfessorFilters =
      filters.nomeCompleto ||
      filters.emailInstitucional ||
      (filters.departamentoId && filters.departamentoId.length > 0) ||
      (filters.regime && filters.regime.length > 0) ||
      (filters.tipoProfessor && filters.tipoProfessor.length > 0)

    const hasStudentFilters = filters.nomeCompleto || filters.emailInstitucional || filters.cursoNome

    if (!hasProfessorFilters && !hasStudentFilters) {
      return null // No profile filters, skip subquery
    }

    const userIds: Set<number> = new Set()
    const isProfessorRoleIncluded = !filters.role || filters.role.length === 0 || filters.role.includes(PROFESSOR)
    const isStudentRoleIncluded = !filters.role || filters.role.length === 0 || filters.role.includes(STUDENT)

    // Query professors if relevant
    if (hasProfessorFilters && isProfessorRoleIncluded) {
      const profConditions: SQL[] = []
      if (filters.nomeCompleto) {
        profConditions.push(ilike(professorTable.nomeCompleto, `%${filters.nomeCompleto}%`))
      }
      if (filters.emailInstitucional) {
        profConditions.push(ilike(professorTable.emailInstitucional, `%${filters.emailInstitucional}%`))
      }
      if (filters.departamentoId && filters.departamentoId.length > 0) {
        profConditions.push(inArray(professorTable.departamentoId, filters.departamentoId))
      }
      if (filters.regime && filters.regime.length > 0) {
        profConditions.push(inArray(professorTable.regime, filters.regime))
      }
      if (filters.tipoProfessor && filters.tipoProfessor.length > 0) {
        profConditions.push(inArray(professorTable.tipoProfessor, filters.tipoProfessor))
      }

      if (profConditions.length > 0) {
        const professors = await db
          .select({ userId: professorTable.userId })
          .from(professorTable)
          .where(and(...profConditions))
        professors.forEach((p) => userIds.add(p.userId))
      }
    }

    // Query students if relevant
    if (hasStudentFilters && isStudentRoleIncluded) {
      const studentConditions: SQL[] = []
      if (filters.nomeCompleto) {
        studentConditions.push(ilike(alunoTable.nomeCompleto, `%${filters.nomeCompleto}%`))
      }
      if (filters.emailInstitucional) {
        studentConditions.push(ilike(alunoTable.emailInstitucional, `%${filters.emailInstitucional}%`))
      }
      if (filters.cursoNome) {
        studentConditions.push(ilike(alunoTable.cursoNome, `%${filters.cursoNome}%`))
      }

      if (studentConditions.length > 0) {
        const students = await db
          .select({ userId: alunoTable.userId })
          .from(alunoTable)
          .where(and(...studentConditions))
        students.forEach((s) => userIds.add(s.userId))
      }
    }

    return Array.from(userIds)
  }

  return {
    async findMany(filters: UserFilters) {
      const whereConditions: SQL[] = []

      // Role filter (now array)
      if (filters.role && filters.role.length > 0) {
        whereConditions.push(inArray(userTable.role, filters.role))
      }

      // Search filter (username or email)
      if (filters.search) {
        const searchCondition = or(
          ilike(userTable.username, `%${filters.search}%`),
          ilike(userTable.email, `%${filters.search}%`)
        )
        if (searchCondition) {
          whereConditions.push(searchCondition)
        }
      }

      // Profile-based filters via subquery
      const profileUserIds = await buildProfileFilteredUserIds(filters)
      if (profileUserIds !== null) {
        if (profileUserIds.length === 0) {
          return [] // No matching profiles found
        }
        whereConditions.push(inArray(userTable.id, profileUserIds))
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

      // Role filter (now array)
      if (filters.role && filters.role.length > 0) {
        whereConditions.push(inArray(userTable.role, filters.role))
      }

      // Search filter
      if (filters.search) {
        const searchCondition = or(
          ilike(userTable.username, `%${filters.search}%`),
          ilike(userTable.email, `%${filters.search}%`)
        )
        if (searchCondition) {
          whereConditions.push(searchCondition)
        }
      }

      // Profile-based filters via subquery
      const profileUserIds = await buildProfileFilteredUserIds(filters)
      if (profileUserIds !== null) {
        if (profileUserIds.length === 0) {
          return 0 // No matching profiles found
        }
        whereConditions.push(inArray(userTable.id, profileUserIds))
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
              telefone: normalizePhone(data.professorData.telefone),
              telefoneInstitucional: normalizePhone(data.professorData.telefoneInstitucional),
              regime: data.professorData.regime as Regime,
              tipoProfessor: data.professorData.tipoProfessor,
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
              telefone: normalizePhone(data.studentData.telefone),
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
      const accountStatus = status === PROFESSOR_STATUS_ATIVO ? 'ACTIVE' : 'INACTIVE'

      await db
        .update(professorTable)
        .set({ accountStatus: accountStatus as 'ACTIVE' | 'INACTIVE', updatedAt: new Date() })
        .where(eq(professorTable.userId, userId))
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

    async softDeleteProfessorProjects(professorId: number) {
      await db
        .update(projetoTable)
        .set({ deletedAt: new Date() })
        .where(and(eq(projetoTable.professorResponsavelId, professorId), isNull(projetoTable.deletedAt)))
    },

    async deleteStudentInscricoes(alunoId: number) {
      // First delete related vagas
      await db.delete(vagaTable).where(eq(vagaTable.alunoId, alunoId))

      // Delete inscricao documents
      const inscricoes = await db
        .select({ id: inscricaoTable.id })
        .from(inscricaoTable)
        .where(eq(inscricaoTable.alunoId, alunoId))

      if (inscricoes.length > 0) {
        const inscricaoIds = inscricoes.map((i) => i.id)
        await db
          .delete(inscricaoDocumentoTable)
          .where(sql`${inscricaoDocumentoTable.inscricaoId} IN (${sql.join(inscricaoIds, sql`, `)})`)
      }

      // Delete inscricoes
      await db.delete(inscricaoTable).where(eq(inscricaoTable.alunoId, alunoId))
    },

    async checkUserDeletionConstraints(userId: number) {
      // Check for blocking constraints that would prevent deletion
      const [editaisCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(editalTable)
        .where(eq(editalTable.criadoPorUserId, userId))

      const [templatesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTemplateTable)
        .where(eq(projetoTemplateTable.criadoPorUserId, userId))

      const [importacoesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(importacaoPlanejamentoTable)
        .where(eq(importacaoPlanejamentoTable.importadoPorUserId, userId))

      return {
        hasEditais: (editaisCount?.count || 0) > 0,
        hasTemplates: (templatesCount?.count || 0) > 0,
        hasImportacoes: (importacoesCount?.count || 0) > 0,
        editaisCount: editaisCount?.count || 0,
        templatesCount: templatesCount?.count || 0,
        importacoesCount: importacoesCount?.count || 0,
      }
    },

    async transferUserOwnership(fromUserId: number, toUserId: number) {
      // Transfer ownership of records to another user (typically admin)
      await db.transaction(async (tx) => {
        // Transfer edital ownership
        await tx
          .update(editalTable)
          .set({ criadoPorUserId: toUserId })
          .where(eq(editalTable.criadoPorUserId, fromUserId))

        // Transfer projetoTemplate ownership
        await tx
          .update(projetoTemplateTable)
          .set({ criadoPorUserId: toUserId })
          .where(eq(projetoTemplateTable.criadoPorUserId, fromUserId))

        // Transfer importacaoPlanejamento ownership
        await tx
          .update(importacaoPlanejamentoTable)
          .set({ importadoPorUserId: toUserId })
          .where(eq(importacaoPlanejamentoTable.importadoPorUserId, fromUserId))

        // Transfer ataSelecao ownership
        await tx
          .update(ataSelecaoTable)
          .set({ geradoPorUserId: toUserId })
          .where(eq(ataSelecaoTable.geradoPorUserId, fromUserId))
      })
    },

    async deleteUser(userId: number) {
      await db.transaction(async (tx) => {
        // 1. Delete sessions first
        await tx.delete(sessionTable).where(eq(sessionTable.userId, userId))

        // 2. Handle professor-specific FK constraints
        const professor = await tx.query.professorTable.findFirst({
          where: eq(professorTable.userId, userId),
        })

        if (professor) {
          // Delete professor invitation
          await tx.delete(professorInvitationTable).where(eq(professorInvitationTable.professorId, professor.id))

          // Delete professor participation in projects (as participant, not responsible)
          await tx
            .delete(projetoProfessorParticipanteTable)
            .where(eq(projetoProfessorParticipanteTable.professorId, professor.id))

          // Delete professor discipline responsibilities
          await tx
            .delete(disciplinaProfessorResponsavelTable)
            .where(eq(disciplinaProfessorResponsavelTable.professorId, professor.id))
        }

        // 3. Handle user-level FK constraints (set to NULL or delete)
        // Delete digital signatures by this user
        await tx.delete(assinaturaDocumentoTable).where(eq(assinaturaDocumentoTable.userId, userId))

        // Set projetoDocumento assinadoPorUserId to NULL
        await tx
          .update(projetoDocumentoTable)
          .set({ assinadoPorUserId: null })
          .where(eq(projetoDocumentoTable.assinadoPorUserId, userId))

        // For chefeDepartamentoId, set to NULL
        await tx
          .update(editalTable)
          .set({ chefeDepartamentoId: null })
          .where(eq(editalTable.chefeDepartamentoId, userId))

        // Set projetoTemplate to NULL where possible
        await tx
          .update(projetoTemplateTable)
          .set({ ultimaAtualizacaoUserId: null })
          .where(eq(projetoTemplateTable.ultimaAtualizacaoUserId, userId))

        // Note: ataSelecao, edital, projetoTemplate, and importacaoPlanejamento
        // are handled by transferUserOwnership before calling deleteUser

        // Set auditLog userId to NULL (keep audit trail but anonymize)
        await tx.update(auditLogTable).set({ userId: null }).where(eq(auditLogTable.userId, userId))

        // Delete edital signature tokens requested by this user
        await tx.delete(editalSignatureTokenTable).where(eq(editalSignatureTokenTable.requestedByUserId, userId))

        // Delete public PDF tokens created by this user
        await tx.delete(publicPdfTokenTable).where(eq(publicPdfTokenTable.createdByUserId, userId))

        // Set reminder execution log to NULL
        await tx
          .update(reminderExecutionLogTable)
          .set({ executedByUserId: null })
          .where(eq(reminderExecutionLogTable.executedByUserId, userId))

        // Set notificacao historico to NULL
        await tx
          .update(notificacaoHistoricoTable)
          .set({ remetenteUserId: null })
          .where(eq(notificacaoHistoricoTable.remetenteUserId, userId))

        // Delete relatorio templates created by this user
        await tx.delete(relatorioTemplateTable).where(eq(relatorioTemplateTable.criadoPorUserId, userId))

        // Handle professor invitation FK to user (invitedBy, acceptedBy)
        // Set acceptedByUserId to NULL for invitations accepted by this user
        await tx
          .update(professorInvitationTable)
          .set({ acceptedByUserId: null })
          .where(eq(professorInvitationTable.acceptedByUserId, userId))

        // Delete invitations sent by this user (admin)
        await tx.delete(professorInvitationTable).where(eq(professorInvitationTable.invitedByUserId, userId))

        // 4. Delete professor/aluno profiles (cascade should work but being explicit)
        await tx.delete(professorTable).where(eq(professorTable.userId, userId))
        await tx.delete(alunoTable).where(eq(alunoTable.userId, userId))

        // 5. Finally delete the user
        await tx.delete(userTable).where(eq(userTable.id, userId))
      })
    },
  }
}
