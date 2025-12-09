import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { NotFoundError } from '@/server/lib/errors'
import type { AppUser } from '@/types'
import { PROFESSOR, STUDENT } from '@/types'

type Database = typeof db

export const createMeService = (database: Database) => {
  return {
    async getMe(userId: number): Promise<AppUser> {
      const user = await database.query.userTable.findFirst({
        where: eq(userTable.id, userId),
      })

      if (!user) {
        throw new NotFoundError('User', userId)
      }

      let professorProfile = null
      if (user.role === PROFESSOR) {
        professorProfile = await database.query.professorTable.findFirst({
          where: (table, { eq }) => eq(table.userId, user.id),
        })
      }

      let alunoProfile = null
      if (user.role === STUDENT) {
        alunoProfile = await database.query.alunoTable.findFirst({
          where: (table, { eq }) => eq(table.userId, user.id),
          columns: {
            id: true,
            cursoNome: true,
            cr: true,
          },
        })
      }

      return {
        ...user,
        professor: professorProfile,
        aluno: alunoProfile,
      }
    },
  }
}

export const meService = createMeService(db)
