import { db } from '@/server/db'
import {
  alunoTable,
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'SeedApprovedSelection' })

async function seed() {
  log.info('🌱 Iniciando criação de resultado aprovado...')

  try {
    // 1. Encontrar o usuário aluno1
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, 'aluno1@ufba.br'))
      .limit(1)

    if (!user) {
      log.error('❌ Usuário aluno1@ufba.br não encontrado.')
      return
    }

    const [aluno] = await db
      .select()
      .from(alunoTable)
      .where(eq(alunoTable.userId, user.id))
      .limit(1)

    if (!aluno) {
      log.error('❌ Perfil de aluno para aluno1@ufba.br não encontrado.')
      return
    }

    // 2. Encontrar o período de inscrição
    const [periodo] = await db
      .select()
      .from(periodoInscricaoTable)
      .where(eq(periodoInscricaoTable.ano, 2025))
      .limit(1)

    if (!periodo) {
      log.error('❌ Período de inscrição de 2025 não encontrado.')
      return
    }

    // 3. Encontrar um projeto aprovado
    const [projeto] = await db
      .select()
      .from(projetoTable)
      .where(eq(projetoTable.status, 'APPROVED'))
      .limit(1)

    if (!projeto) {
      log.error('❌ Nenhum projeto aprovado encontrado para associar.')
      return
    }

    // Limpar inscrições antigas do aluno no mesmo projeto
    await db
      .delete(inscricaoTable)
      .where(eq(inscricaoTable.alunoId, aluno.id))

    // 4. Inserir a inscrição como selecionada (SELECTED_BOLSISTA)
    const [novaInscricao] = await db
      .insert(inscricaoTable)
      .values({
        periodoInscricaoId: periodo.id,
        projetoId: projeto.id,
        alunoId: aluno.id,
        tipoVagaPretendida: 'BOLSISTA',
        status: 'SELECTED_BOLSISTA',
        notaDisciplina: '9.00',
        notaSelecao: '8.50',
        coeficienteRendimento: '8.50',
        notaFinal: '8.75',
        cursouComponente: true,
        dataAssinaturaAluno: new Date(),
        localAssinaturaAluno: 'Salvador',
      })
      .returning()

    log.info(`✅ Inscrição criada com sucesso! ID: ${novaInscricao.id}`)
    log.info(`🎓 Aluno: ${aluno.nomeCompleto}`)
    log.info(`📋 Projeto: ${projeto.titulo}`)
    log.info('💡 Status: SELECTED_BOLSISTA (Aprovado e aguardando aceite do aluno)')
  } catch (error) {
    log.error({ error }, '💥 Erro ao criar resultado aprovado:')
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
