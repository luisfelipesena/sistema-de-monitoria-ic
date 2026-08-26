import { db } from '@/server/db'
import {
  alunoTable,
  departamentoTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { hashSync } from 'bcryptjs'
import { eq } from 'drizzle-orm'

const log = logger.child({ context: 'SeedCandidatesToGrade' })

async function run() {
  log.info('🌱 Ajustando banco de dados para criar candidatos pendentes de avaliação...')

  try {
    const passwordHash = hashSync('123456', 10)
    const now = new Date()

    // 1. Garantir Departamento
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

    // 2. Garantir Professor Carlos Silva
    let [profUser] = await db.select().from(userTable).where(eq(userTable.email, 'carlos.silva@ufba.br')).limit(1)
    if (!profUser) {
      ;[profUser] = await db
        .insert(userTable)
        .values({
          username: 'Carlos Silva',
          email: 'carlos.silva@ufba.br',
          role: 'professor',
          passwordHash,
          emailVerifiedAt: now,
        })
        .returning()
    }

    let [prof] = await db.select().from(professorTable).where(eq(professorTable.userId, profUser.id)).limit(1)
    if (!prof) {
      ;[prof] = await db
        .insert(professorTable)
        .values({
          userId: profUser.id,
          departamentoId: dcc.id,
          nomeCompleto: 'Prof. Dr. Carlos Silva',
        })
        .returning()
    }

    // 3. Garantir Período Ativo
    let [periodo] = await db.select().from(periodoInscricaoTable).where(eq(periodoInscricaoTable.ano, 2025)).limit(1)
    if (!periodo) {
      ;[periodo] = await db
        .insert(periodoInscricaoTable)
        .values({
          ano: 2025,
          semestre: 'SEMESTRE_1',
          dataInicio: new Date('2025-01-01'),
          dataFim: new Date('2025-12-31'),
        })
        .returning()
    }

    // 4. Criar/Garantir Projetos Aprovados do Professor Carlos Silva
    const projetosData = [
      {
        titulo: 'Estruturas de Dados e Algoritmos Avançados',
        ano: 2025,
        semestre: 'SEMESTRE_2' as const,
        bolsasDisponibilizadas: 2,
        voluntariosSolicitados: 2,
        cargaHorariaSemana: 12,
        numeroSemanas: 18,
        status: 'APPROVED' as const,
        tipoProposicao: 'INDIVIDUAL' as const,
        publicoAlvo: 'Alunos de graduação do IME',
        descricao: 'Projeto de ensino e monitoria em Estruturas de Dados e Algoritmos.',
        resumo: 'Monitoria em Estruturas de Dados e Algoritmos.',
        professorResponsavelId: prof.id,
        departamentoId: dcc.id,
        periodoInscricaoId: periodo.id,
      },
      {
        titulo: 'Inteligência Artificial e Aprendizado de Máquina',
        ano: 2025,
        semestre: 'SEMESTRE_1' as const,
        bolsasDisponibilizadas: 1,
        voluntariosSolicitados: 1,
        cargaHorariaSemana: 12,
        numeroSemanas: 18,
        status: 'APPROVED' as const,
        tipoProposicao: 'INDIVIDUAL' as const,
        publicoAlvo: 'Alunos de graduação em Ciência da Computação',
        descricao: 'Projeto de ensino e monitoria em Inteligência Artificial.',
        resumo: 'Monitoria em Inteligência Artificial.',
        professorResponsavelId: prof.id,
        departamentoId: dcc.id,
        periodoInscricaoId: periodo.id,
      },
    ]

    const projetosCriados = []
    for (const pData of projetosData) {
      let [p] = await db
        .select()
        .from(projetoTable)
        .where(eq(projetoTable.titulo, pData.titulo))
        .limit(1)
      if (!p) {
        ;[p] = await db.insert(projetoTable).values(pData).returning()
      }
      projetosCriados.push(p)
    }

    // 5. Garantir Alunos Teste
    const alunosData = [
      { username: 'Ana Clara Lima', email: 'anaclara@ufba.br', matricula: '22110001', cr: 8.7 },
      { username: 'Bruno Souza Santos', email: 'brunosouza@ufba.br', matricula: '22110002', cr: 7.9 },
      { username: 'Carla Beatriz Ribeiro', email: 'carlabeatriz@ufba.br', matricula: '22110003', cr: 9.1 },
      { username: 'Diego Ferreira Lima', email: 'diegoferreira@ufba.br', matricula: '22110004', cr: 8.2 },
    ]

    const alunosCriados = []
    for (const aData of alunosData) {
      let [u] = await db.select().from(userTable).where(eq(userTable.email, aData.email)).limit(1)
      if (!u) {
        ;[u] = await db
          .insert(userTable)
          .values({
            username: aData.username,
            email: aData.email,
            role: 'student',
            passwordHash,
            emailVerifiedAt: now,
          })
          .returning()
      }

      let [aluno] = await db.select().from(alunoTable).where(eq(alunoTable.userId, u.id)).limit(1)
      if (!aluno) {
        ;[aluno] = await db
          .insert(alunoTable)
          .values({
            userId: u.id,
            nomeCompleto: aData.username,
            matricula: aData.matricula,
            cr: aData.cr,
            cursoNome: 'Ciência da Computação',
          })
          .returning()
      }
      alunosCriados.push(aluno)
    }

    // 6. Criar Inscrições PENDENTES DE AVALIAÇÃO (status: 'SUBMITTED', notaDisciplina: null, notaFinal: null)
    for (const proj of projetosCriados) {
      // Limpar inscrições prévias do projeto para garantir estado limpo de teste
      await db.delete(inscricaoTable).where(eq(inscricaoTable.projetoId, proj.id))

      for (let i = 0; i < alunosCriados.length; i++) {
        const aluno = alunosCriados[i]
        const tipoVaga = i % 2 === 0 ? 'BOLSISTA' : 'VOLUNTARIO'

        await db.insert(inscricaoTable).values({
          periodoInscricaoId: periodo.id,
          projetoId: proj.id,
          alunoId: aluno.id,
          tipoVagaPretendida: tipoVaga,
          status: 'SUBMITTED',
          coeficienteRendimento: aluno.cr?.toString() || '8.00',
          notaDisciplina: null,
          notaSelecao: null,
          notaFinal: null,
          feedbackProfessor: null,
        })
      }
    }

    log.info('===================================================================')
    log.info('🎉 BANCO DE DADOS ATUALIZADO COM SUCESSO!')
    log.info('===================================================================')
  } catch (error) {
    log.error({ error }, '❌ Erro ao executar seed de candidatos')
  }
}

run().then(() => process.exit(0))
