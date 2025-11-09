import { analyticsRouter } from '@/server/api/routers/analytics/analytics'
import { apiKeyRouter } from '@/server/api/routers/api-key/api-key'
import { authRouter } from '@/server/api/routers/auth/auth'
import { meRouter } from '@/server/api/routers/auth/me/me'
import { configuracoesRouter } from '@/server/api/routers/configuracoes/configuracoes'
import { courseRouter } from '@/server/api/routers/course/course'
import { departamentoRouter } from '@/server/api/routers/departamento/departamento'
import { disciplineRouter } from '@/server/api/routers/discipline/discipline'
import { editalRouter } from '@/server/api/routers/edital/edital'
import { fileRouter } from '@/server/api/routers/file/file'
import { importProjectsRouter } from '@/server/api/routers/import-projects/import-projects'
import { inscricaoRouter } from '@/server/api/routers/inscricao/inscricao'
import { inviteProfessorRouter } from '@/server/api/routers/invite-professor/invite-professor'
import { notificacoesRouter } from '@/server/api/routers/notificacoes/notificacoes'
import { onboardingRouter } from '@/server/api/routers/onboarding/onboarding'
import { projetoTemplatesRouter } from '@/server/api/routers/projeto-templates/projeto-templates'
import { projetoRouter } from '@/server/api/routers/projeto/projeto'
import { relatoriosRouter } from '@/server/api/routers/relatorios/relatorios'
import { scholarshipAllocationRouter } from '@/server/api/routers/scholarship-allocation/scholarship-allocation'
import { selecaoRouter } from '@/server/api/routers/selecao/selecao'
import { signatureRouter } from '@/server/api/routers/signature/signature'
import { termosRouter } from '@/server/api/routers/termos/termos'
import { userRouter } from '@/server/api/routers/user/user'
import { vagasRouter } from '@/server/api/routers/vagas/vagas'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  me: meRouter,
  course: courseRouter,
  discipline: disciplineRouter,
  file: fileRouter,
  onboarding: onboardingRouter,
  edital: editalRouter,
  departamento: departamentoRouter,
  projeto: projetoRouter,
  inscricao: inscricaoRouter,
  signature: signatureRouter,
  user: userRouter,
  importProjects: importProjectsRouter,
  scholarshipAllocation: scholarshipAllocationRouter,
  inviteProfessor: inviteProfessorRouter,
  projetoTemplates: projetoTemplatesRouter,
  relatorios: relatoriosRouter,
  analytics: analyticsRouter,
  apiKey: apiKeyRouter,
  selecao: selecaoRouter,
  vagas: vagasRouter,
  termos: termosRouter,
  notificacoes: notificacoesRouter,
  configuracoes: configuracoesRouter,
})

export type AppRouter = typeof appRouter
