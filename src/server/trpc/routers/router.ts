import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../init';
import { alunoRouter } from './aluno';
import { onboardingRouter } from './onboarding';

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
});

export type AppRouter = typeof trpcRouter;
