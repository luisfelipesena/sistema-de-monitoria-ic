import type { Semestre, ValidationResult } from '@/types'
import { logger } from '@/utils/logger'
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

      const assinaturaAluno = assinaturas.some((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
      const assinaturaProfessor = assinaturas.some((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')

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
