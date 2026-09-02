import { db } from '@/server/db'
import {
  departamentoTable,
  disciplinaTable,
  editalTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { eq } from 'drizzle-orm'

const log = logger.child({ context: 'SeedOpenEnrollment' })

async function run() {
  log.info('🌱 Criando período de inscrição e projetos abertos para inscrição local...')

  const today = new Date()
  const year = today.getFullYear()
  const semester = 'SEMESTRE_1'

  const dataInicio = new Date(today)
  dataInicio.setDate(today.getDate() - 5) // Começou há 5 dias

  const dataFim = new Date(today)
  dataFim.setDate(today.getDate() + 30) // Vai até daqui a 30 dias

  // 1. Criar ou atualizar período de inscrição ativo
  let [periodo] = await db.select().from(periodoInscricaoTable).where(eq(periodoInscricaoTable.ano, year)).limit(1)

  if (periodo) {
    await db
      .update(periodoInscricaoTable)
      .set({
        dataInicio,
        dataFim,
        semestre: semester,
      })
      .where(eq(periodoInscricaoTable.id, periodo.id))
    log.info({ id: periodo.id }, 'Período de inscrição atualizado com sucesso!')
  } else {
    ;[periodo] = await db
      .insert(periodoInscricaoTable)
      .values({
        ano: year,
        semestre: semester,
        dataInicio,
        dataFim,
        totalBolsasPrograd: 10,
        numeroEditalPrograd: `001/${year}`,
      })
      .returning()
    log.info({ id: periodo.id }, 'Novo período de inscrição criado com sucesso!')
  }

  // 2. Obter ou criar professor para os projetos
  let [profUser] = await db.select().from(userTable).where(eq(userTable.email, 'carlos.silva@ufba.br')).limit(1)
  if (!profUser) {
    const [u] = await db.select().from(userTable).limit(1)
    profUser = u
  }

  let [prof] = profUser
    ? await db.select().from(professorTable).where(eq(professorTable.userId, profUser.id)).limit(1)
    : []
  if (!prof) {
    const [p] = await db.select().from(professorTable).limit(1)
    prof = p
  }

  if (!profUser || !prof) {
    log.error('Nenhum professor encontrado no banco para vincular aos projetos!')
    return
  }

  // 3. Garantir Edital publicado
  let [edital] = await db.select().from(editalTable).where(eq(editalTable.periodoInscricaoId, periodo.id)).limit(1)

  if (!edital) {
    ;[edital] = await db
      .insert(editalTable)
      .values({
        periodoInscricaoId: periodo.id,
        numeroEdital: `001/${year}`,
        titulo: `Edital de Monitoria DCC ${year}.1`,
        publicado: true,
        dataPublicacao: today,
        dataInicioSelecao: today,
        dataFimSelecao: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        dataDivulgacaoResultado: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
        valorBolsa: '400.00',
        pontosProva: '1. Programação Básica\n2. Algoritmos e Estruturas de Dados\n3. Projeto de Software',
        criadoPorUserId: profUser.id,
      })
      .returning()
    log.info({ id: edital.id }, 'Edital interno criado e publicado!')
  } else {
    await db.update(editalTable).set({ publicado: true }).where(eq(editalTable.id, edital.id))
  }

  // Garantir departamento DCC
  let [dcc] = await db.select().from(departamentoTable).where(eq(departamentoTable.sigla, 'DCC')).limit(1)
  if (!dcc) {
    ;[dcc] = await db
      .insert(departamentoTable)
      .values({
        nome: 'Departamento de Ciência da Computação',
        sigla: 'DCC',
        unidadeUniversitaria: 'IME',
      })
      .returning()
  }

  // 4. Garantir Disciplinas
  const disciplinasMock = [
    { codigo: 'MATA55', nome: 'Engenharia de Software I' },
    { codigo: 'MATA68', nome: 'Redes de Computadores I' },
    { codigo: 'MATA37', nome: 'Introdução à Programação' },
  ]

  for (const disc of disciplinasMock) {
    let [d] = await db.select().from(disciplinaTable).where(eq(disciplinaTable.codigo, disc.codigo)).limit(1)
    if (!d) {
      ;[d] = await db
        .insert(disciplinaTable)
        .values({
          codigo: disc.codigo,
          nome: disc.nome,
          departamentoId: dcc.id,
        })
        .returning()
    }

    // Criar projeto em status APPROVED com bolsas e voluntários liberados
    const [projetoExistente] = await db
      .select()
      .from(projetoTable)
      .where(eq(projetoTable.titulo, `Monitoria de ${disc.nome}`))
      .limit(1)

    let projId: number
    if (!projetoExistente) {
      const [novoProj] = await db
        .insert(projetoTable)
        .values({
          titulo: `Monitoria de ${disc.nome}`,
          departamentoId: dcc.id,
          descricao: `Projeto de monitoria acadêmica para auxílio no ensino da disciplina ${disc.nome} (${disc.codigo}).`,
          ano: year,
          semestre: semester,
          professorResponsavelId: prof.id,
          tipoProposicao: 'INDIVIDUAL',
          cargaHorariaSemana: 12,
          numeroSemanas: 18,
          publicoAlvo: 'Estudantes de Ciência da Computação e cursos afins',
          bolsasSolicitadas: 2,
          voluntariosSolicitados: 2,
          bolsasDisponibilizadas: 2,
          status: 'APPROVED',
          dadosEditalConfirmados: true,
          editalInternoId: edital.id,
          localSelecao: 'Laboratório 105 - DCC / PAF I',
          horarioSelecao: '14:00 - 16:00',
          pontosProva: '1. Fundamentos da disciplina\n2. Exercícios práticos',
          bibliografia: 'Livro-texto recomendado no plano de curso.',
        })
        .returning()
      projId = novoProj.id
      log.info({ id: projId, disciplina: disc.codigo }, 'Projeto de monitoria criado com sucesso!')
    } else {
      projId = projetoExistente.id
      await db
        .update(projetoTable)
        .set({
          status: 'APPROVED',
          dadosEditalConfirmados: true,
          editalInternoId: edital.id,
          bolsasDisponibilizadas: 2,
        })
        .where(eq(projetoTable.id, projId))
    }

    // Vincular disciplina ao projeto
    const [linkExistente] = await db
      .select()
      .from(projetoDisciplinaTable)
      .where(eq(projetoDisciplinaTable.projetoId, projId))
      .limit(1)

    if (!linkExistente) {
      await db.insert(projetoDisciplinaTable).values({
        projetoId: projId,
        disciplinaId: d.id,
      })
    }
  }

  log.info('✅ Concluído! Monitorias abertas para inscrição e prontas para testes locais.')
  process.exit(0)
}

run().catch((err) => {
  log.error({ err }, 'Erro ao executar seed de monitorias abertas')
  process.exit(1)
})
