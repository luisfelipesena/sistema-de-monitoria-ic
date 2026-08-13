import { isAdmin } from '@/server/lib/auth-helpers'
import { ForbiddenError } from '@/server/lib/errors'
import type { UserRole } from '@/types'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'EditalWindowGuard' })

interface EditalWithWindow {
  id: number
  dataInicioAlteracao: Date | null
  dataFimAlteracao: Date | null
}

/**
 * Verifica se o momento atual está dentro da janela de alteração do edital.
 * Retorna true se:
 *  - Não há janela definida (campos null) → considera aberto
 *  - now >= dataInicioAlteracao && now <= dataFimAlteracao
 */
export function isWithinEditWindow(edital: EditalWithWindow): boolean {
  if (!edital.dataInicioAlteracao || !edital.dataFimAlteracao) {
    return true // Sem janela definida = aberto para alterações
  }

  const now = new Date()
  return now >= edital.dataInicioAlteracao && now <= edital.dataFimAlteracao
}

/**
 * Guard que bloqueia operações de professor/aluno fora da janela de alteração do edital.
 * Admin sempre passa.
 *
 * @throws ForbiddenError se fora da janela e não é admin
 */
export function enforceEditWindow(edital: EditalWithWindow | null | undefined, userRole: UserRole): void {
  if (isAdmin(userRole)) {
    return // Admin sempre pode
  }

  if (!edital) {
    // Sem edital vinculado ao período, permitir (projetos sem edital vinculado)
    return
  }

  if (!isWithinEditWindow(edital)) {
    log.warn(
      { editalId: edital.id, dataFimAlteracao: edital.dataFimAlteracao },
      'Operação bloqueada: fora da janela de alteração do edital'
    )
    throw new ForbiddenError(
      'O período de alteração do edital encerrou. Não é possível criar, editar ou submeter projetos neste momento.'
    )
  }
}
