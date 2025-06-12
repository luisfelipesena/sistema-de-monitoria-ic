import { courseRouter } from '@/server/api/routers/course/course'
import { disciplineRouter } from '@/server/api/routers/discipline/discipline'
import { fileRouter } from '@/server/api/routers/file/file'
import { onboardingRouter } from '@/server/api/routers/onboarding/onboarding'
import { editalRouter } from '@/server/api/routers/edital/edital'
import { departamentoRouter } from '@/server/api/routers/departamento/departamento'
import { projetoRouter } from '@/server/api/routers/projeto/projeto'
import { inscricaoRouter } from '@/server/api/routers/inscricao/inscricao'
import { signatureRouter } from '@/server/api/routers/signature/signature'
import { userRouter } from '@/server/api/routers/user/user'
import { importProjectsRouter } from '@/server/api/routers/import-projects/import-projects'
import { scholarshipAllocationRouter } from '@/server/api/routers/scholarship-allocation/scholarship-allocation'
import { inviteProfessorRouter } from '@/server/api/routers/invite-professor/invite-professor'
import { projetoTemplatesRouter } from '@/server/api/routers/projeto-templates/projeto-templates'
import { relatoriosRouter } from '@/server/api/routers/relatorios/relatorios'
import { analyticsRouter } from '@/server/api/routers/analytics/analytics'
import { apiKeyRouter } from '@/server/api/routers/api-key/api-key'
import { selecaoRouter } from '@/server/api/routers/selecao/selecao'
import { vagasRouter } from '@/server/api/routers/vagas/vagas'
import { termosRouter } from '@/server/api/routers/termos/termos'
import { notificacoesRouter } from '@/server/api/routers/notificacoes/notificacoes'
import { periodoInscricaoRouter } from '@/server/api/routers/periodo-inscricao/periodo-inscricao'
import { meRouter } from './routers/auth/me/me'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
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
  periodoInscricao: periodoInscricaoRouter,
})

export type AppRouter = typeof appRouter
