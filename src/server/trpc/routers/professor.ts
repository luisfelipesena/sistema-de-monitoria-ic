import { db } from '@/server/database';
import {
  professorTable,
  selectProfessorTableSchema
} from '@/server/database/schema';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, privateProcedure } from '../init';

// Schema simplificado para o onboarding de professor
const professorInputSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  matriculaSiape: z.string().min(1, 'Matrícula SIAPE é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  emailInstitucional: z.string().email('Email institucional inválido'),
  regime: z.enum(['20H', '40H', 'DE']),
  genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  departamentoId: z.number().int().positive(),
});

export const professorRouter = createTRPCRouter({
  get: privateProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'professor') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a professor' });
    }
    const professor = await db.query.professorTable.findFirst({
      where: eq(professorTable.userId, ctx.user.id),
    });
    if (!professor) return {};
    return selectProfessorTableSchema.parse(professor);
  }),
  set: privateProcedure
    .input(professorInputSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'professor') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a professor' });
      }
      let professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, ctx.user.id),
      });
      if (!professor) {
        const [created] = await db
          .insert(professorTable)
          .values({ ...input, userId: ctx.user.id })
          .returning();
        return selectProfessorTableSchema.parse(created);
      }
      const [updated] = await db
        .update(professorTable)
        .set(input)
        .where(eq(professorTable.id, professor.id))
        .returning();
      return selectProfessorTableSchema.parse(updated);
    }),
});
