import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../init';
import { alunoRouter } from './aluno';
import { authRouter } from './auth';
import { cursoRouter } from './curso';
import { departamentoRouter } from './departamento';
import { onboardingRouter } from './onboarding';
import { professorRouter } from './professor';

const guitars = [
  { id: 1, brand: 'Fender', model: 'Stratocaster' },
  { id: 2, brand: 'Gibson', model: 'Les Paul' },
  { id: 3, brand: 'Ibanez', model: 'RG' },
];

const guitarRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return guitars;
  }),
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const guitar = guitars.find((guitar) => guitar.id === input.id);
      if (!guitar) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Guitar not found',
        });
      }
      return guitar;
    }),
});

export const trpcRouter = createTRPCRouter({
  guitars: guitarRouter,
  aluno: alunoRouter,
  onboarding: onboardingRouter,
  auth: authRouter,
  curso: cursoRouter,
  professor: professorRouter,
  departamento: departamentoRouter,
});

export type AppRouter = typeof trpcRouter;
