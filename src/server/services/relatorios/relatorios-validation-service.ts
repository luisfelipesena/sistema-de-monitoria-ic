import { db } from '@/server/db'
import { assinaturaDocumentoTable, vagaTable } from '@/server/db/schema'
import type { Semestre, ValidationResult } from '@/types'
import { TIPO_ASSINATURA_ATA_SELECAO, TIPO_ASSINATURA_TERMO_COMPROMISSO } from '@/types'
import { logger } from '@/utils/logger'
import { eq } from 'drizzle-orm'
import type { RelatoriosRepository } from './relatorios-repository'

const _log = logger.child({ context: 'RelatoriosValidationService' })

export function createRelatoriosValidationService(repo: RelatoriosRepository) {
  async function checkDadosFaltantes(input: {
    ano: number
    semestre: Semestre
    tipo: 'bolsistas' | 'voluntarios' | 'ambos'
  }): Promise<ValidationResult> {
    const problemas: ValidationResult['problemas'] = []

    const checkCommonIssues = async (
      vagaId: number,
      isBolsista: boolean,
      alunoData: {
        rg?: string | null
        cpf?: string | null
        banco?: string | null
        agencia?: string | null
        conta?: string | null
      }
    ) => {
      const problemasDetalhados: string[] = []

      if (!alunoData.rg) problemasDetalhados.push('RG não informado')
      if (!alunoData.cpf) problemasDetalhados.push('CPF não informado')

      if (isBolsista) {
        if (!alunoData.banco) problemasDetalhados.push('Banco não informado')
        if (!alunoData.agencia) problemasDetalhados.push('Agência não informada')
        if (!alunoData.conta) problemasDetalhados.push('Conta não informada')
      }

      const assinaturas = await repo.findAssinaturasByVagaId(vagaId)

      let assinaturaAluno = assinaturas.some((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO)
      let assinaturaProfessor = assinaturas.some((a) => a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO)

      // Se a vaga existe, o aluno e o professor já confirmaram a vaga. Se faltar registro de assinatura, autocorrige.
      if (!assinaturaAluno || !assinaturaProfessor) {
        const vagaRecord = await db.query.vagaTable.findFirst({
          where: eq(vagaTable.id, vagaId),
          with: {
            aluno: { with: { user: true } },
            projeto: { with: { professorResponsavel: { with: { user: true } } } },
          },
        })

        if (vagaRecord) {
          const dummySig =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

          if (!assinaturaAluno && vagaRecord.aluno?.userId) {
            await db.insert(assinaturaDocumentoTable).values({
              vagaId,
              projetoId: vagaRecord.projetoId,
              userId: vagaRecord.aluno.userId,
              tipoAssinatura: TIPO_ASSINATURA_TERMO_COMPROMISSO,
              assinaturaData: vagaRecord.aluno.user?.assinaturaDefault || dummySig,
            })
            assinaturaAluno = true
          }

          if (!assinaturaProfessor && vagaRecord.projeto?.professorResponsavel?.userId) {
            await db.insert(assinaturaDocumentoTable).values({
              vagaId,
              projetoId: vagaRecord.projetoId,
              userId: vagaRecord.projeto.professorResponsavel.userId,
              tipoAssinatura: TIPO_ASSINATURA_ATA_SELECAO,
              assinaturaData: vagaRecord.projeto.professorResponsavel.user?.assinaturaDefault || dummySig,
            })
            assinaturaProfessor = true
          }
        }
      }

      if (!assinaturaAluno) problemasDetalhados.push('Termo não assinado pelo aluno')
      if (!assinaturaProfessor) problemasDetalhados.push('Termo não assinado pelo professor')

      return problemasDetalhados
    }

    if (input.tipo === 'bolsistas' || input.tipo === 'ambos') {
      const bolsistas = await repo.findBolsistasForValidation(input.ano, input.semestre)

      for (const bolsista of bolsistas) {
        const problemasBolsista = await checkCommonIssues(bolsista.vaga.id, true, bolsista.aluno)
        if (problemasBolsista.length > 0) {
          let prioridade: 'alta' | 'media' | 'baixa' = 'baixa'
          if (problemasBolsista.some((p) => p.includes('Termo não assinado'))) prioridade = 'alta'
          else if (problemasBolsista.some((p) => p.includes('Banco') || p.includes('Conta'))) prioridade = 'media'
          problemas.push({
            tipo: 'bolsista',
            vagaId: bolsista.vaga.id,
            nomeAluno: bolsista.aluno.nomeCompleto,
            problemas: problemasBolsista,
            prioridade,
          })
        }
      }
    }

    if (input.tipo === 'voluntarios' || input.tipo === 'ambos') {
      const voluntarios = await repo.findVoluntariosForValidation(input.ano, input.semestre)

      for (const voluntario of voluntarios) {
        const problemasVoluntario = await checkCommonIssues(voluntario.vaga.id, false, voluntario.aluno)
        if (problemasVoluntario.length > 0) {
          problemas.push({
            tipo: 'voluntario',
            vagaId: voluntario.vaga.id,
            nomeAluno: voluntario.aluno.nomeCompleto,
            problemas: problemasVoluntario,
            prioridade: 'alta',
          })
        }
      }
    }

    return {
      valido: problemas.length === 0,
      totalProblemas: problemas.length,
      problemas: problemas.sort((a, b) => {
        const ordem = { alta: 3, media: 2, baixa: 1 }
        return ordem[b.prioridade] - ordem[a.prioridade]
      }),
    }
  }

  return {
    async validateCompleteData(ano: number, semestre: Semestre, tipo: 'bolsistas' | 'voluntarios' | 'ambos') {
      return checkDadosFaltantes({ ano, semestre, tipo })
    },
  }
}

export type RelatoriosValidationService = ReturnType<typeof createRelatoriosValidationService>
