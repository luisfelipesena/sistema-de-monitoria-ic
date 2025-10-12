import { createTRPCRouter } from '@/server/api/trpc'
import { createEditalHandler, deleteEditalHandler, updateEditalHandler } from './handlers/crud'
import { checkEditalFileHandler, getEditalPdfUrlHandler } from './handlers/download'
import { getCurrentPeriodoHandler, getEditalByIdHandler, listEditaisHandler } from './handlers/list'
import { publishEditalHandler, signEditalHandler, unpublishEditalHandler } from './handlers/publication'

export const editalRouter = createTRPCRouter({
  // List operations
  list: listEditaisHandler,
  getById: getEditalByIdHandler,
  getCurrentPeriodo: getCurrentPeriodoHandler,

  // CRUD operations
  create: createEditalHandler,
  update: updateEditalHandler,
  delete: deleteEditalHandler,

  // Publication operations
  publish: publishEditalHandler,
  unpublish: unpublishEditalHandler,
  sign: signEditalHandler,

  // Download operations
  getPdfUrl: getEditalPdfUrlHandler,
  checkFile: checkEditalFileHandler,
})
