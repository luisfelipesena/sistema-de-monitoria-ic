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
import { eq } from 'drizzle-orm'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'SeedCompletedReports' })

async function seed() {
  log.info('🌱 Iniciando criação de monitoria concluída com relatórios assinados...')

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

    // 2. Encontrar o período de inscrição
    const [periodo] = await db.select().from(periodoInscricaoTable).where(eq(periodoInscricaoTable.ano, 2025)).limit(1)

    if (!periodo) {
      log.error('❌ Período de inscrição de 2025 não encontrado.')
      return
    }

    // 3. Encontrar o projeto aprovado
    const [projeto] = await db.select().from(projetoTable).where(eq(projetoTable.status, 'APPROVED')).limit(1)

    if (!projeto) {
      log.error('❌ Nenhum projeto aprovado encontrado.')
      return
    }

    // Limpar registros antigos para evitar conflitos de unique key
    await db.delete(relatorioFinalMonitorTable).where(eq(relatorioFinalMonitorTable.inscricaoId, 4))
    await db.delete(relatorioFinalDisciplinaTable).where(eq(relatorioFinalDisciplinaTable.projetoId, projeto.id))
    await db.delete(vagaTable).where(eq(vagaTable.inscricaoId, 4))
    await db.delete(inscricaoTable).where(eq(inscricaoTable.id, 4))

    // 4. Inserir a inscrição como ACCEPTED_BOLSISTA (aceita pelo aluno)
    const [inscricao] = await db
      .insert(inscricaoTable)
      .values({
        id: 4,
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
        dataInicio: new Date('2025-02-24'),
        dataFim: new Date('2025-06-26'),
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

    log.info('✅ Monitoria e Relatórios Finais criados e assinados!')
    log.info(`Vaga ID: ${vaga.id}`)
    log.info(`Relatório Disciplina ID: ${relatorioDisciplina.id}`)
    log.info(`Relatório Monitor ID: ${relatorioMonitor.id}`)
  } catch (error) {
    log.error({ error }, '💥 Erro ao criar monitoria concluída:')
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
