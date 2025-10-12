import { createTRPCRouter } from '@/server/api/trpc'
import { createProjetoHandler, deleteProjetoHandler, updateProjetoHandler } from './handlers/crud'
import { getProjetoHandler } from './handlers/detail'
import { getAvailableProjectsHandler, getProjetosHandler } from './handlers/list'
import {
  generateSelectionMinutesDataHandler,
  notifySelectionResultsHandler,
  saveSelectionMinutesHandler,
} from './handlers/selection'
import { signDocumentHandler, signProfessorHandler } from './handlers/signature'
import { getVolunteersHandler, updateVolunteerStatusHandler } from './handlers/volunteers'
import { approveProjetoHandler, rejectProjetoHandler, submitProjetoHandler } from './handlers/workflow'

export const projetoRouter = createTRPCRouter({
  // List operations
  getProjetos: getProjetosHandler,
  getAvailableProjects: getAvailableProjectsHandler,

  // Detail operations
  getProjeto: getProjetoHandler,

  // CRUD operations
  createProjeto: createProjetoHandler,
  updateProjeto: updateProjetoHandler,
  deleteProjeto: deleteProjetoHandler,

  // Workflow operations
  submitProjeto: submitProjetoHandler,
  approveProjeto: approveProjetoHandler,
  rejectProjeto: rejectProjetoHandler,

  // Signature operations
  signProfessor: signProfessorHandler,
  signDocument: signDocumentHandler,

  // Volunteer operations
  getVolunteers: getVolunteersHandler,
  updateVolunteerStatus: updateVolunteerStatusHandler,

  // Selection operations
  generateSelectionMinutesData: generateSelectionMinutesDataHandler,
  saveSelectionMinutes: saveSelectionMinutesHandler,
  notifySelectionResults: notifySelectionResultsHandler,
})
