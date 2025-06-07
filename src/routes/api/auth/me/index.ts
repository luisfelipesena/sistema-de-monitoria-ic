'use client';
;
import { db } from '@/server/database';
import { userTable } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { User } from 'lucia';

// Define a more detailed user type for the frontend
export type AppUser = User & {
  professor?: {
    id: number;
    departamentoId: number;
    // add other fields if needed
  } | null;
  aluno?: {
    id: number;
    cursoId: number;
    // add other fields if needed
  } | null;
};

export const APIRoute = createAPIFileRoute('/api/auth/me')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      const { userId } = ctx.state.user;
      
      const baseUser = await db.query.userTable.findFirst({
          where: eq(userTable.id, parseInt(userId))
      });

      if (!baseUser) {
          return json(null);
      }

      let fullUser: AppUser = baseUser;

      if (baseUser.role === 'professor') {
        const professorProfile = await db.query.professorTable.findFirst({
          where: (table, { eq }) => eq(table.userId, baseUser.id),
          columns: {
            id: true,
            departamentoId: true,
          },
        });
        fullUser = { ...baseUser, professor: professorProfile };
      } else if (baseUser.role === 'student') {
        const alunoProfile = await db.query.alunoTable.findFirst({
          where: (table, { eq }) => eq(table.userId, baseUser.id),
          columns: {
            id: true,
            cursoId: true,
          },
        });
        fullUser = { ...baseUser, aluno: alunoProfile };
      }

      return json(fullUser);
    })
  ),
}) 