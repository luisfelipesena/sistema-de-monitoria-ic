import { createTRPCRouter } from '../init';
import { alunoRouter } from './aluno';
import { authRouter } from './auth/auth';
import { cursoRouter } from './curso';
import { departamentoRouter } from './departamento';
import { filesRouter } from './files/files';
import { onboardingRouter } from './onboarding';
import { professorRouter } from './professor';

export const trpcRouter = createTRPCRouter({
  aluno: alunoRouter,
  onboarding: onboardingRouter,
  auth: authRouter,
  curso: cursoRouter,
  professor: professorRouter,
  departamento: departamentoRouter,
  files: filesRouter,
});

export type AppRouter = typeof trpcRouter;
