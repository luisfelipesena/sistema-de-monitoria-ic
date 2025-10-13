import { createTRPCRouter } from '@/server/api/trpc'
import { acceptPosition, aceitarInscricao, recusarInscricao, rejectPosition } from './handlers/accept-reject'
import { createInscricao, criarInscricao } from './handlers/create'
import { avaliarCandidato, evaluateApplications } from './handlers/evaluate'
import { getInscricoesProjeto, getMinhasInscricoes } from './handlers/list'
import { getMyResults, getMyStatus } from './handlers/student-status'
import { generateCommitmentTermData } from './handlers/termo'

export const inscricaoRouter = createTRPCRouter({
  // Student status and results
  getMyStatus,
  getMyResults,

  // Create inscriptions
  createInscricao,
  criarInscricao,

  // List inscriptions
  getMinhasInscricoes,
  getInscricoesProjeto,

  // Accept/reject positions
  aceitarInscricao,
  recusarInscricao,
  acceptPosition,
  rejectPosition,

  // Evaluate candidates
  avaliarCandidato,
  evaluateApplications,

  // Termo generation
  generateCommitmentTermData,
})
