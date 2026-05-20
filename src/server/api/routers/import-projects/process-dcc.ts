import type { TRPCContext } from '@/server/api/trpc'
import { createImportProjectsService } from '@/server/services/import-projects/import-projects-service'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'

const log = logger.child({ context: 'ProcessDCC' })

/**
 * Processa arquivo de planejamento DCC
 * Delega toda a lógica para o serviço (seguindo padrão Router -> Service -> Repository)
 */
export async function processImportedFileDCC(importacaoId: number, ctx: TRPCContext) {
  try {
    const service = createImportProjectsService(ctx.db)
    const result = await service.processImportedFileDCC(importacaoId)

    log.info(
      {
        importacaoId,
        projetosCriados: result.projetosCriados,
        projetosComErro: result.projetosComErro,
      },
      'Processamento DCC concluído via service'
    )

    return result
  } catch (error) {
    log.error(error, 'Erro ao processar importação DCC')

    if (error instanceof TRPCError) throw error

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Erro ao processar importação DCC',
    })
  }
}
