import { db } from '@/server/db'
import {
  alunoTable,
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
  userTable,
  vagaTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
} from '@/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'SeedCurrentReports' })

async function seed() {
  log.info('🌱 Iniciando criação de monitoria concluída no semestre atual (2026.2)...')

  try {
    // 1. Encontrar o usuário aluno1
    const [user] = await db.select().from(userTable).where(eq(userTable.email, 'aluno1@ufba.br')).limit(1)

    if (!user) {
      log.error('❌ Usuário aluno1@ufba.br não encontrado.')
      return
    }

    const [aluno] = await db.select().from(alunoTable).where(eq(alunoTable.userId, user.id)).limit(1)

    if (!aluno) {
      log.error('❌ Perfil de aluno para aluno1@ufba.br não encontrado.')
      return
    }

    // 2. Criar ou buscar o período de inscrição de 2026.2
    let [periodo] = await db
      .select()
      .from(periodoInscricaoTable)
      .where(and(eq(periodoInscricaoTable.ano, 2026), eq(periodoInscricaoTable.semestre, 'SEMESTRE_2')))
      .limit(1)

    if (!periodo) {
      ;[periodo] = await db
        .insert(periodoInscricaoTable)
        .values({
          semestre: 'SEMESTRE_2',
          ano: 2026,
          dataInicio: new Date('2026-07-01'),
          dataFim: new Date('2026-12-31'),
        })
        .returning()
      log.info('📅 Criado período de inscrição 2026.2')
    }

    // 3. Encontrar ou criar um projeto aprovado para 2026.2
    let [projeto] = await db
      .select()
      .from(projetoTable)
      .where(
        and(eq(projetoTable.ano, 2026), eq(projetoTable.semestre, 'SEMESTRE_2'), eq(projetoTable.status, 'APPROVED'))
      )
      .limit(1)

    if (!projeto) {
      // Buscar projeto aprovado de 2025.1 para clonar dados
      const [oldProjeto] = await db.select().from(projetoTable).where(eq(projetoTable.status, 'APPROVED')).limit(1)

      const [newProjeto] = await db
        .insert(projetoTable)
        .values({
          departamentoId: oldProjeto?.departamentoId || 1,
          ano: 2026,
          semestre: 'SEMESTRE_2',
          tipoProposicao: 'INDIVIDUAL',
          bolsasSolicitadas: 1,
          voluntariosSolicitados: 1,
          cargaHorariaSemana: 12,
          numeroSemanas: 18,
          publicoAlvo: 'Geral',
          estimativaPessoasBenificiadas: 30,
          professorResponsavelId: oldProjeto?.professorResponsavelId || 1,
          titulo: 'Monitoria de Introdução à Programação (2026.2)',
          descricao: 'Monitoria do semestre atual.',
          status: 'APPROVED',
        })
        .returning()
      projeto = newProjeto
      log.info('📋 Criado projeto aprovado para 2026.2')
    }

    // Limpar registros antigos para evitar conflitos de unique key
    await db.delete(relatorioFinalMonitorTable).where(eq(relatorioFinalMonitorTable.inscricaoId, 5))
    await db.delete(relatorioFinalDisciplinaTable).where(eq(relatorioFinalDisciplinaTable.projetoId, projeto.id))
    await db.delete(vagaTable).where(eq(vagaTable.inscricaoId, 5))
    await db.delete(inscricaoTable).where(eq(inscricaoTable.id, 5))

    // 4. Inserir a inscrição como ACCEPTED_BOLSISTA (aceita pelo aluno)
    const [inscricao] = await db
      .insert(inscricaoTable)
      .values({
        id: 5,
        periodoInscricaoId: periodo.id,
        projetoId: projeto.id,
        alunoId: aluno.id,
        tipoVagaPretendida: 'BOLSISTA',
        status: 'ACCEPTED_BOLSISTA',
        notaDisciplina: '9.00',
        notaSelecao: '8.50',
        coeficienteRendimento: '8.50',
        notaFinal: '8.75',
        cursouComponente: true,
        dataAssinaturaAluno: new Date(),
        localAssinaturaAluno: 'Salvador',
      })
      .returning()

    // 5. Criar a Vaga ativa correspondente
    const [vaga] = await db
      .insert(vagaTable)
      .values({
        alunoId: aluno.id,
        projetoId: projeto.id,
        inscricaoId: inscricao.id,
        tipo: 'BOLSISTA',
        dataInicio: new Date('2026-07-24'),
        dataFim: new Date('2026-11-26'),
      })
      .returning()

    // 6. Criar Relatório Final da Disciplina (assinado pelo professor)
    const [relatorioDisciplina] = await db
      .insert(relatorioFinalDisciplinaTable)
      .values({
        projetoId: projeto.id,
        status: 'APPROVED',
        conteudo: JSON.stringify({
          atividadesDesenvolvidas: 'Auxílio na correção de listas e atendimento de alunos.',
          dificuldadesEncontradas: 'Nenhuma dificuldade técnica.',
          avaliacaoGeral: 'Excelente desempenho do projeto.',
        }),
        professorAssinouEm: new Date(),
      })
      .returning()

    // 7. Criar Relatório Final do Monitor (assinado por aluno e professor)
    const [relatorioMonitor] = await db
      .insert(relatorioFinalMonitorTable)
      .values({
        inscricaoId: inscricao.id,
        relatorioDisciplinaId: relatorioDisciplina.id,
        status: 'APPROVED',
        conteudo: JSON.stringify({
          atividadesDesenvolvidas: 'Auxílio nas aulas de laboratório.',
          notaFinal: '9.5',
          frequencia: '100',
        }),
        alunoAssinouEm: new Date(),
        professorAssinouEm: new Date(),
      })
      .returning()

    log.info('✅ Monitoria e Relatórios Finais de 2026.2 criados e assinados!')
    log.info(`Vaga ID: ${vaga.id}`)
    log.info(`Relatório Disciplina ID: ${relatorioDisciplina.id}`)
    log.info(`Relatório Monitor ID: ${relatorioMonitor.id}`)
  } catch (error) {
    log.error({ error }, '💥 Erro ao criar monitoria concluída de 2026.2:')
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
