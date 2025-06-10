import { adminRouter } from './routers/admin'
import { authRouter } from './routers/auth'
import { cursoRouter } from './routers/curso'
import { departamentoRouter } from './routers/departamento'
import { disciplinaRouter } from './routers/disciplina'
import { editalRouter } from './routers/edital'
import { filesRouter } from './routers/files'
import { inscricaoRouter } from './routers/inscricao'
import { invitationRouter } from './routers/invitation'
import { notificationsRouter } from './routers/notifications'
import { onboardingRouter } from './routers/onboarding'
import { periodoInscricaoRouter } from './routers/periodoInscricao'
import { professorRouter } from './routers/professor'
import { projetoRouter } from './routers/projeto'
import { publicRouter } from './routers/public'
import { relatoriosRouter } from './routers/relatorios'
import { studentRouter } from './routers/student'
import { templateRouter } from './routers/template'
import { userRouter } from './routers/user'
import { vagaRouter } from './routers/vaga'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  admin: adminRouter,
  professor: professorRouter,
  student: studentRouter,
  user: userRouter,
  files: filesRouter,
  public: publicRouter,
  relatorios: relatoriosRouter,
  departamento: departamentoRouter,
  curso: cursoRouter,
  disciplina: disciplinaRouter,
  inscricao: inscricaoRouter,
  periodoInscricao: periodoInscricaoRouter,
  projeto: projetoRouter,
  template: templateRouter,
  edital: editalRouter,
  vaga: vagaRouter,
  invitation: invitationRouter,
  onboarding: onboardingRouter,
  notifications: notificationsRouter,
})

export type AppRouter = typeof appRouter
