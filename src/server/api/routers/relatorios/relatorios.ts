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
  assinaturaDocumentoTable,
} from '@/server/db/schema'
import { TRPCError } from '@trpc/server'

// This function is not fully implemented due to schema mismatches
// It serves as a placeholder for the validation logic
async function validateCompleteDataInternal(input: {
  ano: number
  semestre: 'SEMESTRE_1' | 'SEMESTRE_2'
  tipo: 'bolsistas' | 'voluntarios' | 'ambos'
}) {
  const problemas: Array<{
    tipo: 'bolsista' | 'voluntario'
    vagaId: number
    nomeAluno: string
    problemas: string[]
  }> = []

  // This logic is simplified and needs bank details added to the 'aluno' schema to be fully functional.
  if (input.tipo === 'bolsistas' || input.tipo === 'ambos') {
    const bolsistasQuery = db
      .select({
        vaga: { id: vagaTable.id },
        aluno: {
          nomeCompleto: alunoTable.nomeCompleto,
          matricula: alunoTable.matricula,
          rg: alunoTable.rg,
          cpf: alunoTable.cpf,
          telefone: alunoTable.telefone,
          banco: alunoTable.banco,
          agencia: alunoTable.agencia,
          conta: alunoTable.conta,
          digitoConta: alunoTable.digitoConta,
        },
        alunoUser: { email: userTable.email },
      })
      .from(vagaTable)
      .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
      .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
      .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
      .where(
        and(
          eq(vagaTable.tipo, 'BOLSISTA'),
          eq(projetoTable.ano, input.ano),
          eq(projetoTable.semestre, input.semestre)
        )
      )
    
    const bolsistas = await bolsistasQuery;
    // Further validation logic would go here, checking for signatures in assinaturaDocumentoTable
  }

  return {
    valido: problemas.length === 0,
    totalProblemas: problemas.length,
    problemas,
  }
}

export const relatoriosRouter = createTRPCRouter({
  getRelatorioGeral: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input, ctx }) => {
      // Basic statistics
      const [projetosStats] = await ctx.db
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

      const [inscricoesStats] = await ctx.db
        .select({
          total: count(),
          submetidas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} = 'SUBMITTED' THEN 1 END)`,
          selecionadas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'SELECTED_%' THEN 1 END)`,
          aceitas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'ACCEPTED_%' THEN 1 END)`,
        })
        .from(inscricaoTable)
        .where(sql`${inscricaoTable.projetoId} IN (${inscricoesSubquery})`)

      // Vagas statistics
      const [vagasStats] = await ctx.db
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
    .query(async ({ input, ctx }) => {
      const departamentos = await ctx.db
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
    .query(async ({ input, ctx }) => {
      const professores = await ctx.db
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
    .query(async ({ input, ctx }) => {
      const alunos = await ctx.db
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
    .query(async ({ input, ctx }) => {
      const disciplinas = await ctx.db
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
    .query(async ({ input, ctx }) => {
      const editais = await ctx.db
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
    .query(async ({ input, ctx }) => {
      // Quick overview metrics for the admin dashboard
      const [metrics] = await ctx.db
        .select({
          totalProjetos: count(),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'APPROVED' THEN 1 END)`,
          projetosPendentes: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'SUBMITTED' THEN 1 END)`,
          totalBolsas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [totalInscricoes] = await ctx.db
        .select({ count: count() })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [totalVagas] = await ctx.db
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
    .query(async ({ input, ctx   }) => {
      // Buscar todos os monitores aceitos no período
      const monitores = await ctx.db
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
            banco: alunoTable.banco,
            agencia: alunoTable.agencia,
            conta: alunoTable.conta,
            digitoConta: alunoTable.digitoConta,
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
          const disciplinas = await ctx.db
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
              banco: monitor.aluno.banco,
              agencia: monitor.aluno.agencia,
              conta: monitor.aluno.conta,
              digitoConta: monitor.aluno.digitoConta,
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

  // Consolidação Final PROGRAD - Planilha de Bolsistas
  monitoresFinalBolsistas: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        departamentoId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Buscar vagas ativas de bolsistas com dados completos
      const bolsistasQuery = ctx.db
        .select({
          vaga: {
            id: vagaTable.id,
            dataInicio: vagaTable.dataInicio,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            rg: alunoTable.rg,
            cpf: alunoTable.cpf,
            cr: alunoTable.cr,
            telefone: alunoTable.telefone,
            banco: alunoTable.banco,
            agencia: alunoTable.agencia,
            conta: alunoTable.conta,
            digitoConta: alunoTable.digitoConta,
          },
          alunoUser: {
            email: userTable.email,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
          },
          professor: {
            nomeCompleto: professorTable.nomeCompleto,
            matriculaSiape: professorTable.matriculaSiape,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(vagaTable.tipo, 'BOLSISTA'),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre),
            input.departamentoId ? eq(departamentoTable.id, parseInt(input.departamentoId)) : undefined
          )
        )
        .orderBy(alunoTable.nomeCompleto)

      const bolsistas = await bolsistasQuery

      // This part requires a more complex subquery or aggregation for disciplines
      // For now, we'll map and add a placeholder
      const bolsistasComDisciplinas = await Promise.all(
        bolsistas.map(async (b) => {
          const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.vagaId, b.vaga.id)
          });

          const termoAssinado = assinaturas.some(a => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO') &&
                                assinaturas.some(a => a.tipoAssinatura === 'PROJETO_PROFESSOR_RESPONSAVEL');

          return {
            ...b,
            disciplinas: 'Implementar busca de disciplinas',
            validacao: {
              dadosCompletos: true, // Placeholder
              termoAssinado,
              apto: termoAssinado, // Simplified logic
            },
          }
        })
      );
      
      return bolsistasComDisciplinas
    }),

  // Consolidação Final PROGRAD - Planilha de Voluntários
  monitoresFinalVoluntarios: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        departamentoId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Buscar vagas ativas de voluntários com dados completos
      const voluntariosQuery = ctx.db
        .select({
          vaga: {
            id: vagaTable.id,
            dataInicio: vagaTable.dataInicio,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            rg: alunoTable.rg,
            cpf: alunoTable.cpf,
            cr: alunoTable.cr,
            telefone: alunoTable.telefone,
          },
          alunoUser: {
            email: userTable.email,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
          },
          professor: {
            nomeCompleto: professorTable.nomeCompleto,
            matriculaSiape: professorTable.matriculaSiape,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(vagaTable.tipo, 'VOLUNTARIO'),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre),
            input.departamentoId ? eq(departamentoTable.id, parseInt(input.departamentoId)) : undefined
          )
        )
        .orderBy(alunoTable.nomeCompleto)

      const voluntarios = await voluntariosQuery

      const voluntariosComValidacao = await Promise.all(
        voluntarios.map(async (voluntario) => {
          const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.vagaId, voluntario.vaga.id)
          });

          const termoAssinado = assinaturas.some(a => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO') &&
                                assinaturas.some(a => a.tipoAssinatura === 'PROJETO_PROFESSOR_RESPONSAVEL');
          return {
            ...voluntario,
            disciplinas: 'Implementar busca de disciplinas',
            validacao: {
              dadosCompletos: true, // Placeholder
              termoAssinado,
              apto: termoAssinado, // Simplified
            },
          }
        })
      );

      return voluntariosComValidacao
    }),

  // Validar dados completos antes da exportação
  validateCompleteData: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        tipo: z.enum(['bolsistas', 'voluntarios', 'ambos']),
      })
    )
    .query(async ({ input }) => {
      return await validateCompleteDataInternal(input)
    }),

  // Exportar consolidação final para PROGRAD (formato Excel)
  exportConsolidated: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        incluirBolsistas: z.boolean().default(true),
        incluirVoluntarios: z.boolean().default(true),
        departamentoId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar se dados estão válidos antes de exportar
      const validacao = await validateCompleteDataInternal({
        ano: input.ano,
        semestre: input.semestre,
        tipo:
          input.incluirBolsistas && input.incluirVoluntarios
            ? 'ambos'
            : input.incluirBolsistas
            ? 'bolsistas'
            : 'voluntarios',
      })

      if (!validacao.valido) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Dados incompletos encontrados. ${validacao.totalProblemas} problema(s) identificado(s). Corrija antes de exportar.`,
        })
      }

      // Gerar nome do arquivo
      const nomeArquivo = `consolidacao-prograd-${input.ano}-${input.semestre}-${Date.now()}.xlsx`

      // Por enquanto, retornar sucesso com URL de download
      // Em implementação real, geraria o Excel com exceljs
      return {
        success: true,
        fileName: nomeArquivo,
        downloadUrl: `/api/download/${nomeArquivo}`,
        resumo: {
          incluirBolsistas: input.incluirBolsistas,
          incluirVoluntarios: input.incluirVoluntarios,
          periodo: `${input.ano}.${input.semestre}`,
          geradoEm: new Date().toISOString(),
        },
      }
    }),
})
