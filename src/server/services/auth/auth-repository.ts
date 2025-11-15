import type { db } from '@/server/db'
import { alunoTable, professorTable, userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import type { UserRole } from '@/types'

type Database = typeof db

export interface CreateUserData {
  username: string
  email: string
  role: UserRole
  passwordHash: string
  verificationToken: string
  verificationTokenExpiresAt: Date
}

export interface CreateProfileData {
  userId: number
  nomeCompleto: string
}

export interface UpdatePasswordData {
  passwordHash: string
  emailVerifiedAt: Date
  passwordResetToken?: null
  passwordResetExpiresAt?: null
  verificationToken?: null
  verificationTokenExpiresAt?: null
}

export const createAuthRepository = (database: Database) => {
  return {
    async findByEmail(email: string) {
      return database.query.userTable.findFirst({
        where: eq(userTable.email, email),
      })
    },

    async findByVerificationToken(token: string) {
      return database.query.userTable.findFirst({
        where: eq(userTable.verificationToken, token),
      })
    },

    async findByPasswordResetToken(token: string) {
      return database.query.userTable.findFirst({
        where: eq(userTable.passwordResetToken, token),
      })
    },

    async findById(id: number) {
      return database.query.userTable.findFirst({
        where: eq(userTable.id, id),
      })
    },

    async createUser(data: CreateUserData) {
      const [newUser] = await database
        .insert(userTable)
        .values({
          username: data.username,
          email: data.email,
          role: data.role,
          passwordHash: data.passwordHash,
          verificationToken: data.verificationToken,
          verificationTokenExpiresAt: data.verificationTokenExpiresAt,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        })
        .returning({ id: userTable.id, email: userTable.email })

      return newUser
    },

    async createProfessorProfile(data: CreateProfileData) {
      await database.insert(professorTable).values({
        userId: data.userId,
        nomeCompleto: data.nomeCompleto,
      } as typeof professorTable.$inferInsert)
    },

    async createStudentProfile(data: CreateProfileData) {
      await database.insert(alunoTable).values({
        userId: data.userId,
        nomeCompleto: data.nomeCompleto,
      } as typeof alunoTable.$inferInsert)
    },

    async updateVerificationToken(userId: number, token: string, expiresAt: Date) {
      await database
        .update(userTable)
        .set({
          verificationToken: token,
          verificationTokenExpiresAt: expiresAt,
        })
        .where(eq(userTable.id, userId))
    },

    async verifyEmail(userId: number) {
      await database
        .update(userTable)
        .set({
          emailVerifiedAt: new Date(),
          verificationToken: null,
          verificationTokenExpiresAt: null,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        })
        .where(eq(userTable.id, userId))
    },

    async updatePasswordResetToken(userId: number, token: string, expiresAt: Date) {
      await database
        .update(userTable)
        .set({
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        })
        .where(eq(userTable.id, userId))
    },

    async updatePassword(userId: number, data: UpdatePasswordData) {
      await database.update(userTable).set(data).where(eq(userTable.id, userId))
    },
  }
}
