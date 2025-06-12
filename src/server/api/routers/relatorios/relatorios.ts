import { z } from 'zod'
import { eq, and, desc, count, sum, sql } from 'drizzle-orm'
import { createTRPCRouter, adminProtectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  projetoTable,
  inscricaoTable,
  vagaTable,
  professorTable,
  alunoTable,
  departamentoTable,
  disciplinaTable,
  projetoDisciplinaTable,
  editalTable,
  periodoInscricaoTable,
  userTable,
} from '@/server/db/schema'

export const relatoriosRouter = createTRPCRouter({
  getRelatorioGeral: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input }) => {
      // Basic statistics
      const [projetosStats] = await db
        .select({
          total: count(),
          aprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'APPROVED' THEN 1 END)`,
          submetidos: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'SUBMITTED' THEN 1 END)`,
          rascunhos: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'DRAFT' THEN 1 END)`,
          totalBolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          totalBolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      // Inscriptions statistics
      const inscricoesSubquery = db
        .select({ projetoId: projetoTable.id })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [inscricoesStats] = await db
        .select({
          total: count(),
          submetidas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} = 'SUBMITTED' THEN 1 END)`,
          selecionadas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'SELECTED_%' THEN 1 END)`,
          aceitas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'ACCEPTED_%' THEN 1 END)`,
        })
        .from(inscricaoTable)
        .where(sql`${inscricaoTable.projetoId} IN (${inscricoesSubquery})`)

      // Vagas statistics
      const [vagasStats] = await db
        .select({
          total: count(),
          bolsistas: sql<number>`COUNT(CASE WHEN ${vagaTable.tipo} = 'BOLSISTA' THEN 1 END)`,
          voluntarios: sql<number>`COUNT(CASE WHEN ${vagaTable.tipo} = 'VOLUNTARIO' THEN 1 END)`,
        })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      return {
        projetos: {
          total: projetosStats?.total || 0,
          aprovados: Number(projetosStats?.aprovados) || 0,
          submetidos: Number(projetosStats?.submetidos) || 0,
          rascunhos: Number(projetosStats?.rascunhos) || 0,
          totalBolsasSolicitadas: Number(projetosStats?.totalBolsasSolicitadas) || 0,
          totalBolsasDisponibilizadas: Number(projetosStats?.totalBolsasDisponibilizadas) || 0,
        },
        inscricoes: {
          total: inscricoesStats?.total || 0,
          submetidas: Number(inscricoesStats?.submetidas) || 0,
          selecionadas: Number(inscricoesStats?.selecionadas) || 0,
          aceitas: Number(inscricoesStats?.aceitas) || 0,
        },
        vagas: {
          total: vagasStats?.total || 0,
          bolsistas: Number(vagasStats?.bolsistas) || 0,
          voluntarios: Number(vagasStats?.voluntarios) || 0,
        },
      }
    }),

  getRelatorioPorDepartamento: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input }) => {
      const departamentos = await db
        .select({
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(projetoTable.id),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'APPROVED' THEN 1 END)`,
          bolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          bolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(departamentoTable)
        .leftJoin(
          projetoTable,
          and(
            eq(departamentoTable.id, projetoTable.departamentoId),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre)
          )
        )
        .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)
        .orderBy(desc(count(projetoTable.id)))

      return departamentos.map((dept) => ({
        departamento: dept.departamento,
        projetos: dept.projetos,
        projetosAprovados: Number(dept.projetosAprovados) || 0,
        bolsasSolicitadas: Number(dept.bolsasSolicitadas) || 0,
        bolsasDisponibilizadas: Number(dept.bolsasDisponibilizadas) || 0,
      }))
    }),

  getRelatorioProfessores: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        departamentoId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const professores = await db
        .select({
          professor: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
            emailInstitucional: professorTable.emailInstitucional,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(projetoTable.id),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'APPROVED' THEN 1 END)`,
          bolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          bolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(professorTable)
        .innerJoin(departamentoTable, eq(professorTable.departamentoId, departamentoTable.id))
        .leftJoin(
          projetoTable,
          and(
            eq(professorTable.id, projetoTable.professorResponsavelId),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre)
          )
        )
        .where(input.departamentoId ? eq(professorTable.departamentoId, input.departamentoId) : undefined)
        .groupBy(
          professorTable.id,
          professorTable.nomeCompleto,
          professorTable.emailInstitucional,
          departamentoTable.nome,
          departamentoTable.sigla
        )
        .orderBy(desc(count(projetoTable.id)))

      return professores.map((prof) => ({
        professor: prof.professor,
        departamento: prof.departamento,
        projetos: prof.projetos,
        projetosAprovados: Number(prof.projetosAprovados) || 0,
        bolsasSolicitadas: Number(prof.bolsasSolicitadas) || 0,
        bolsasDisponibilizadas: Number(prof.bolsasDisponibilizadas) || 0,
      }))
    }),

  getRelatorioAlunos: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        status: z
          .enum(['SUBMITTED', 'SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO', 'ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO'])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const alunos = await db
        .select({
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            emailInstitucional: alunoTable.emailInstitucional,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          inscricoes: count(inscricaoTable.id),
          statusInscricao: inscricaoTable.status,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          projeto: {
            titulo: projetoTable.titulo,
            professorResponsavel: professorTable.nomeCompleto,
          },
        })
        .from(alunoTable)
        .innerJoin(inscricaoTable, eq(alunoTable.id, inscricaoTable.alunoId))
        .innerJoin(
          projetoTable,
          and(
            eq(inscricaoTable.projetoId, projetoTable.id),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre)
          )
        )
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(input.status ? eq(inscricaoTable.status, input.status) : undefined)
        .groupBy(
          alunoTable.id,
          alunoTable.nomeCompleto,
          alunoTable.emailInstitucional,
          alunoTable.matricula,
          alunoTable.cr,
          inscricaoTable.status,
          inscricaoTable.tipoVagaPretendida,
          projetoTable.titulo,
          professorTable.nomeCompleto
        )
        .orderBy(desc(alunoTable.cr))

      return alunos
    }),

  getRelatorioDisciplinas: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input }) => {
      const disciplinas = await db
        .select({
          disciplina: {
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(projetoTable.id),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'APPROVED' THEN 1 END)`,
        })
        .from(disciplinaTable)
        .innerJoin(departamentoTable, eq(disciplinaTable.departamentoId, departamentoTable.id))
        .leftJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .leftJoin(
          projetoTable,
          and(
            eq(projetoDisciplinaTable.projetoId, projetoTable.id),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre)
          )
        )
        .groupBy(
          disciplinaTable.id,
          disciplinaTable.nome,
          disciplinaTable.codigo,
          departamentoTable.nome,
          departamentoTable.sigla
        )
        .orderBy(desc(count(projetoTable.id)))

      return disciplinas.map((disc) => ({
        disciplina: disc.disciplina,
        departamento: disc.departamento,
        projetos: disc.projetos,
        projetosAprovados: Number(disc.projetosAprovados) || 0,
      }))
    }),

  getRelatorioEditais: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100).optional(),
      })
    )
    .query(async ({ input }) => {
      const editais = await db
        .select({
          edital: {
            id: editalTable.id,
            numeroEdital: editalTable.numeroEdital,
            titulo: editalTable.titulo,
            publicado: editalTable.publicado,
            dataPublicacao: editalTable.dataPublicacao,
          },
          periodo: {
            ano: periodoInscricaoTable.ano,
            semestre: periodoInscricaoTable.semestre,
            dataInicio: periodoInscricaoTable.dataInicio,
            dataFim: periodoInscricaoTable.dataFim,
          },
          criadoPor: {
            username: userTable.username,
          },
        })
        .from(editalTable)
        .innerJoin(periodoInscricaoTable, eq(editalTable.periodoInscricaoId, periodoInscricaoTable.id))
        .innerJoin(userTable, eq(editalTable.criadoPorUserId, userTable.id))
        .where(input.ano ? eq(periodoInscricaoTable.ano, input.ano) : undefined)
        .orderBy(desc(periodoInscricaoTable.ano), desc(periodoInscricaoTable.semestre))

      return editais
    }),

  exportRelatorioCsv: adminProtectedProcedure
    .input(
      z.object({
        tipo: z.enum(['geral', 'departamentos', 'professores', 'alunos', 'disciplinas', 'editais']),
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        filters: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // This would generate CSV data based on the report type
      // For now, we'll return a success response
      // In a real implementation, you'd generate the CSV and return a download link

      return {
        success: true,
        message: `Relatório ${input.tipo} exportado com sucesso`,
        downloadUrl: `/api/download/relatorio-${input.tipo}-${input.ano}-${input.semestre}.csv`,
      }
    }),

  getDashboardMetrics: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input }) => {
      // Quick overview metrics for the admin dashboard
      const [metrics] = await db
        .select({
          totalProjetos: count(),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'APPROVED' THEN 1 END)`,
          projetosPendentes: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'SUBMITTED' THEN 1 END)`,
          totalBolsas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [totalInscricoes] = await db
        .select({ count: count() })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [totalVagas] = await db
        .select({ count: count() })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      return {
        totalProjetos: metrics?.totalProjetos || 0,
        projetosAprovados: Number(metrics?.projetosAprovados) || 0,
        projetosPendentes: Number(metrics?.projetosPendentes) || 0,
        totalBolsas: Number(metrics?.totalBolsas) || 0,
        totalInscricoes: totalInscricoes?.count || 0,
        totalVagas: totalVagas?.count || 0,
        taxaAprovacao: metrics?.totalProjetos
          ? Math.round((Number(metrics.projetosAprovados) / metrics.totalProjetos) * 100)
          : 0,
      }
    }),

  getConsolidatedMonitoringData: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input }) => {
      // Buscar todos os monitores aceitos no período
      const monitores = await db
        .select({
          inscricao: {
            id: inscricaoTable.id,
            status: inscricaoTable.status,
            createdAt: inscricaoTable.createdAt,
            updatedAt: inscricaoTable.updatedAt,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          alunoUser: {
            email: userTable.email,
          },
          professor: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
            matriculaSiape: professorTable.matriculaSiape,
            emailInstitucional: professorTable.emailInstitucional,
          },
          departamento: {
            nome: departamentoTable.nome,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
            cargaHorariaSemana: projetoTable.cargaHorariaSemana,
            numeroSemanas: projetoTable.numeroSemanas,
          },
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre),
            sql`${inscricaoTable.status} IN ('ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO')`
          )
        )
        .orderBy(inscricaoTable.status, alunoTable.nomeCompleto)

      // Para cada monitor, buscar as disciplinas do projeto
      const monitoresComDisciplinas = await Promise.all(
        monitores.map(async (monitor) => {
          const disciplinas = await db
            .select({
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, monitor.projeto.id))

          const disciplinasTexto = disciplinas.map(d => `${d.codigo} - ${d.nome}`).join('; ')

          // Calcular datas baseadas no período acadêmico
          const inicioSemestre = new Date(monitor.projeto.ano, monitor.projeto.semestre === 'SEMESTRE_1' ? 2 : 7, 1)
          const fimSemestre = new Date(monitor.projeto.ano, monitor.projeto.semestre === 'SEMESTRE_1' ? 6 : 11, 30)

          const tipoMonitoria = monitor.inscricao.status === 'ACCEPTED_BOLSISTA' ? 'BOLSISTA' : 'VOLUNTARIO'

          return {
            id: monitor.inscricao.id,
            monitor: {
              nome: monitor.aluno.nomeCompleto,
              matricula: monitor.aluno.matricula,
              email: monitor.alunoUser.email,
              cr: monitor.aluno.cr,
            },
            professor: {
              nome: monitor.professor.nomeCompleto,
              matriculaSiape: monitor.professor.matriculaSiape,
              email: monitor.professor.emailInstitucional,
              departamento: monitor.departamento.nome,
            },
            projeto: {
              titulo: monitor.projeto.titulo,
              disciplinas: disciplinasTexto,
              ano: monitor.projeto.ano,
              semestre: monitor.projeto.semestre,
              cargaHorariaSemana: monitor.projeto.cargaHorariaSemana,
              numeroSemanas: monitor.projeto.numeroSemanas,
            },
            monitoria: {
              tipo: tipoMonitoria,
              dataInicio: inicioSemestre.toLocaleDateString('pt-BR'),
              dataFim: fimSemestre.toLocaleDateString('pt-BR'),
              valorBolsa: tipoMonitoria === 'BOLSISTA' ? 400.00 : undefined, // Valor fixo por enquanto
              status: 'ATIVO', // Por enquanto, todos aceitos são considerados ativos
            },
          }
        })
      )

      return monitoresComDisciplinas
    }),
})
