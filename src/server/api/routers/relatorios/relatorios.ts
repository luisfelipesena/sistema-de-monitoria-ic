import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  alunoTable,
  assinaturaDocumentoTable,
  departamentoTable,
  disciplinaTable,
  editalTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import {
  alunoRelatorioSchema,
  csvExportInputSchema,
  csvExportOutputSchema,
  dashboardQuickMetricsSchema,
  departamentoRelatorioSchema,
  disciplinaRelatorioSchema,
  editalRelatorioSchema,
  monitorConsolidadoSchema,
  monitoresFinalFiltersSchema,
  monitorFinalBolsistaSchema,
  professorRelatorioSchema,
  relatorioFiltersSchema,
  relatorioFiltersWithDeptSchema,
  relatorioFiltersWithStatusSchema,
  relatorioGeralSchema,
  semestreSchema,
  ValidationResult,
  type Semestre,
  ACCEPTED_BOLSISTA,
  SUBMITTED,
  APPROVED,
  REJECTED,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  ACCEPTED_VOLUNTARIO,
  BOLSISTA,
  VOLUNTARIO,
  TIPO_VAGA_ENUM,
  PROJETO_STATUS_ENUM,
  SEMESTRE_LABELS,
} from '@/types'
import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, sql, sum } from 'drizzle-orm'
import { z } from 'zod'

async function checkDadosFaltantesPrograd(
  dbInstance: typeof db,
  input: {
    ano: number
    semestre: Semestre
    tipo: 'bolsistas' | 'voluntarios' | 'ambos'
  }
): Promise<ValidationResult> {
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

    const assinaturas = await dbInstance
      .select({ tipoAssinatura: assinaturaDocumentoTable.tipoAssinatura })
      .from(assinaturaDocumentoTable)
      .where(eq(assinaturaDocumentoTable.vagaId, vagaId))

    const assinaturaAluno = assinaturas.some((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
    const assinaturaProfessor = assinaturas.some((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')

    if (!assinaturaAluno) problemasDetalhados.push('Termo não assinado pelo aluno')
    if (!assinaturaProfessor) problemasDetalhados.push('Termo não assinado pelo professor')

    return problemasDetalhados
  }

  if (input.tipo === 'bolsistas' || input.tipo === 'ambos') {
    const bolsistas = await dbInstance
      .select({
        vaga: { id: vagaTable.id },
        aluno: {
          nomeCompleto: alunoTable.nomeCompleto,
          rg: alunoTable.rg,
          cpf: alunoTable.cpf,
          banco: alunoTable.banco,
          agencia: alunoTable.agencia,
          conta: alunoTable.conta,
        },
      })
      .from(vagaTable)
      .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
      .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
      .where(
        and(eq(vagaTable.tipo, BOLSISTA), eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre))
      )

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
    const voluntarios = await dbInstance
      .select({
        vaga: { id: vagaTable.id },
        aluno: {
          nomeCompleto: alunoTable.nomeCompleto,
          rg: alunoTable.rg,
          cpf: alunoTable.cpf,
        },
      })
      .from(vagaTable)
      .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
      .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
      .where(
        and(
          eq(vagaTable.tipo, VOLUNTARIO),
          eq(projetoTable.ano, input.ano),
          eq(projetoTable.semestre, input.semestre)
        )
      )

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

export const relatoriosRouter = createTRPCRouter({
  getRelatorioGeral: adminProtectedProcedure
    .input(relatorioFiltersSchema)
    .output(relatorioGeralSchema)
    .query(async ({ input, ctx }) => {
      const [projetosStats] = await ctx.db
        .select({
          total: count(),
          aprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
          submetidos: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${SUBMITTED} THEN 1 END)`,
          rascunhos: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = 'DRAFT' THEN 1 END)`,
          totalBolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          totalBolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const inscricoesSubquery = ctx.db
        .select({ projetoId: projetoTable.id })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [inscricoesStats] = await ctx.db
        .select({
          total: count(),
          submetidas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} = ${SUBMITTED} THEN 1 END)`,
          selecionadas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'SELECTED_%' THEN 1 END)`,
          aceitas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'ACCEPTED_%' THEN 1 END)`,
        })
        .from(inscricaoTable)
        .where(sql`${inscricaoTable.projetoId} IN (${inscricoesSubquery})`)

      const [vagasStats] = await ctx.db
        .select({
          total: count(),
          bolsistas: sql<number>`COUNT(CASE WHEN ${vagaTable.tipo} = ${BOLSISTA} THEN 1 END)`,
          voluntarios: sql<number>`COUNT(CASE WHEN ${vagaTable.tipo} = ${VOLUNTARIO} THEN 1 END)`,
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
    .input(relatorioFiltersSchema)
    .output(z.array(departamentoRelatorioSchema))
    .query(async ({ input, ctx }) => {
      const departamentos = await ctx.db
        .select({
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(projetoTable.id),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
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
    .input(relatorioFiltersWithDeptSchema)
    .output(z.array(professorRelatorioSchema))
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
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
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
    .input(relatorioFiltersWithStatusSchema)
    .output(z.array(alunoRelatorioSchema))
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
        semestre: semestreSchema,
      })
    )
    .output(z.array(disciplinaRelatorioSchema))
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
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
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
    .output(z.array(editalRelatorioSchema))
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
    .input(csvExportInputSchema)
    .output(csvExportOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const generateCsvRow = (data: (string | number | null | undefined)[]) => {
        return data
          .map((value) => {
            const stringValue = String(value || '')
            return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue
          })
          .join(',')
      }

      let csvData = ''
      let fileName = ''

      switch (input.tipo) {
        case 'departamentos': {
          const dados = await ctx.db
            .select({
              departamento: {
                nome: departamentoTable.nome,
                sigla: departamentoTable.sigla,
              },
              projetos: count(projetoTable.id),
              projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
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

          const headers = [
            'Departamento',
            'Sigla',
            'Total Projetos',
            'Projetos Aprovados',
            'Bolsas Solicitadas',
            'Bolsas Disponibilizadas',
          ]
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.departamento.nome,
              item.departamento.sigla,
              item.projetos,
              Number(item.projetosAprovados) || 0,
              Number(item.bolsasSolicitadas) || 0,
              Number(item.bolsasDisponibilizadas) || 0,
            ])}\n`
          })
          fileName = `relatorio-departamentos-${input.ano}-${input.semestre}.csv`
          break
        }

        case 'professores': {
          const dados = await ctx.db
            .select({
              professor: {
                nomeCompleto: professorTable.nomeCompleto,
                emailInstitucional: professorTable.emailInstitucional,
              },
              departamento: {
                nome: departamentoTable.nome,
                sigla: departamentoTable.sigla,
              },
              projetos: count(projetoTable.id),
              projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
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
            .groupBy(
              professorTable.id,
              professorTable.nomeCompleto,
              professorTable.emailInstitucional,
              departamentoTable.nome,
              departamentoTable.sigla
            )

          const headers = [
            'Nome Completo',
            'Email',
            'Departamento',
            'Sigla Depto',
            'Total Projetos',
            'Projetos Aprovados',
            'Bolsas Solicitadas',
            'Bolsas Disponibilizadas',
          ]
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.professor.nomeCompleto,
              item.professor.emailInstitucional,
              item.departamento.nome,
              item.departamento.sigla,
              item.projetos,
              Number(item.projetosAprovados) || 0,
              Number(item.bolsasSolicitadas) || 0,
              Number(item.bolsasDisponibilizadas) || 0,
            ])}\n`
          })
          fileName = `relatorio-professores-${input.ano}-${input.semestre}.csv`
          break
        }

        case 'alunos': {
          const dados = await ctx.db
            .select({
              aluno: {
                nomeCompleto: alunoTable.nomeCompleto,
                emailInstitucional: alunoTable.emailInstitucional,
                matricula: alunoTable.matricula,
                cr: alunoTable.cr,
              },
              statusInscricao: inscricaoTable.status,
              tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
              projeto: {
                titulo: projetoTable.titulo,
              },
              professorResponsavel: professorTable.nomeCompleto,
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

          const headers = [
            'Nome Completo',
            'Email',
            'Matrícula',
            'CR',
            'Status Inscrição',
            'Tipo Vaga Pretendida',
            'Projeto',
            'Professor Responsável',
          ]
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.aluno.nomeCompleto,
              item.aluno.emailInstitucional,
              item.aluno.matricula,
              item.aluno.cr || 0,
              item.statusInscricao,
              item.tipoVagaPretendida,
              item.projeto.titulo,
              item.professorResponsavel,
            ])}\n`
          })
          fileName = `relatorio-alunos-${input.ano}-${input.semestre}.csv`
          break
        }

        case 'disciplinas': {
          const dados = await ctx.db
            .select({
              disciplina: {
                nome: disciplinaTable.nome,
                codigo: disciplinaTable.codigo,
              },
              departamento: {
                nome: departamentoTable.nome,
                sigla: departamentoTable.sigla,
              },
              projetos: count(projetoTable.id),
              projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
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

          const headers = [
            'Código',
            'Nome Disciplina',
            'Departamento',
            'Sigla Depto',
            'Total Projetos',
            'Projetos Aprovados',
          ]
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.disciplina.codigo,
              item.disciplina.nome,
              item.departamento.nome,
              item.departamento.sigla,
              item.projetos,
              Number(item.projetosAprovados) || 0,
            ])}\n`
          })
          fileName = `relatorio-disciplinas-${input.ano}-${input.semestre}.csv`
          break
        }

        case 'editais': {
          const dados = await ctx.db
            .select({
              edital: {
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
            .where(eq(periodoInscricaoTable.ano, input.ano))

          const headers = [
            'Número Edital',
            'Título',
            'Ano',
            'Semestre',
            'Data Início',
            'Data Fim',
            'Publicado',
            'Data Publicação',
            'Criado Por',
          ]
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.edital.numeroEdital,
              item.edital.titulo,
              item.periodo.ano,
              SEMESTRE_LABELS[item.periodo.semestre as keyof typeof SEMESTRE_LABELS],
              new Date(item.periodo.dataInicio).toLocaleDateString('pt-BR'),
              new Date(item.periodo.dataFim).toLocaleDateString('pt-BR'),
              item.edital.publicado ? 'Sim' : 'Não',
              item.edital.dataPublicacao ? new Date(item.edital.dataPublicacao).toLocaleDateString('pt-BR') : '',
              item.criadoPor.username,
            ])}\n`
          })
          fileName = `relatorio-editais-${input.ano}.csv`
          break
        }

        case 'geral': {
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

          const headers = ['Métrica', 'Valor']
          csvData = `${headers.join(',')}\n`
          csvData += `${generateCsvRow(['Total de Projetos', projetosStats?.total || 0])}\n`
          csvData += `${generateCsvRow(['Projetos Aprovados', Number(projetosStats?.aprovados) || 0])}\n`
          csvData += `${generateCsvRow(['Projetos Submetidos', Number(projetosStats?.submetidos) || 0])}\n`
          csvData += `${generateCsvRow(['Projetos em Rascunho', Number(projetosStats?.rascunhos) || 0])}\n`
          csvData += `${generateCsvRow(['Total Bolsas Solicitadas', Number(projetosStats?.totalBolsasSolicitadas) || 0])}\n`
          csvData += `${generateCsvRow(['Total Bolsas Disponibilizadas', Number(projetosStats?.totalBolsasDisponibilizadas) || 0])}\n`

          fileName = `relatorio-geral-${input.ano}-${input.semestre}.csv`
          break
        }

        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Tipo de relatório inválido',
          })
      }

      // Verificar se há dados para exportar
      if (csvData.split('\n').length <= 1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Nenhum dado encontrado para exportar com os filtros aplicados',
        })
      }

      const csvBase64 = Buffer.from(csvData, 'utf-8').toString('base64')

      return {
        success: true,
        fileName,
        downloadUrl: `data:text/csv;charset=utf-8;base64,${csvBase64}`,
        message: 'Relatório gerado com sucesso. O download deve iniciar automaticamente.',
      }
    }),

  getDashboardMetrics: adminProtectedProcedure
    .input(relatorioFiltersSchema)
    .output(dashboardQuickMetricsSchema)
    .query(async ({ input, ctx }) => {
      // Quick overview metrics for the admin dashboard
      const [metrics] = await ctx.db
        .select({
          totalProjetos: count(),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
          totalBolsas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [totalInscricoes] = await ctx.db
        .select({ count: count() })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, input.ano), eq(projetoTable.semestre, input.semestre)))

      const [totalVoluntarios] = await ctx.db
        .select({ count: count() })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(
          and(
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre),
            eq(vagaTable.tipo, VOLUNTARIO)
          )
        )

      return {
        totalProjetos: metrics?.totalProjetos || 0,
        projetosAprovados: Number(metrics?.projetosAprovados) || 0,
        totalInscricoes: totalInscricoes?.count || 0,
        totalBolsas: Number(metrics?.totalBolsas) || 0,
        totalVoluntarios: totalVoluntarios?.count || 0,
      }
    }),

  getConsolidatedMonitoringData: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .output(z.array(monitorConsolidadoSchema))
    .query(async ({ input, ctx }) => {
      const { ano, semestre } = input

      const vagas = await ctx.db.query.vagaTable.findMany({
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: true,
            },
          },
          inscricao: {
            with: {
              aluno: true,
              projeto: true,
            },
          },
        },
      })

      const filteredVagas = vagas.filter((vaga) => vaga.projeto.ano === ano && vaga.projeto.semestre === semestre)

      const consolidados = await Promise.all(
        filteredVagas.map(async (vaga) => {
          const disciplinas = await ctx.db
            .select({
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, vaga.projetoId))

          const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          // Calcular datas baseadas no período acadêmico
          const inicioSemestre = new Date(ano, semestre === 'SEMESTRE_1' ? 1 : 6, 1)
          const fimSemestre = new Date(ano, semestre === 'SEMESTRE_1' ? 5 : 11, 30)

          const tipoMonitoria: typeof TIPO_VAGA_ENUM[number] =
            vaga.inscricao.status === ACCEPTED_BOLSISTA ? BOLSISTA : VOLUNTARIO

          return {
            id: vaga.inscricaoId,
            monitor: {
              nome: vaga.aluno.nomeCompleto,
              matricula: vaga.aluno.matricula,
              email: vaga.aluno.user.email,
              cr: vaga.aluno.cr,
              banco: vaga.aluno.banco,
              agencia: vaga.aluno.agencia,
              conta: vaga.aluno.conta,
              digitoConta: vaga.aluno.digitoConta,
            },
            professor: {
              nome: vaga.projeto.professorResponsavel.nomeCompleto,
              matriculaSiape: vaga.projeto.professorResponsavel.matriculaSiape,
              email: vaga.projeto.professorResponsavel.emailInstitucional,
              departamento: vaga.projeto.departamento.nome,
            },
            projeto: {
              titulo: vaga.projeto.titulo,
              disciplinas: disciplinasTexto,
              ano: vaga.projeto.ano,
              semestre: vaga.projeto.semestre,
              cargaHorariaSemana: vaga.projeto.cargaHorariaSemana,
              numeroSemanas: vaga.projeto.numeroSemanas,
            },
            monitoria: {
              tipo: tipoMonitoria,
              dataInicio: vaga.dataInicio?.toISOString() || inicioSemestre.toISOString(),
              dataFim: vaga.dataFim?.toISOString() || fimSemestre.toISOString(),
              valorBolsa: tipoMonitoria === BOLSISTA ? 400 : 0, // Valor padrão conforme UFBA
              status: 'ATIVO', // Placeholder, logic needed
            },
          }
        })
      )

      return consolidados
    }),

  // Consolidação Final PROGRAD - Planilha de Bolsistas
  monitoresFinalBolsistas: adminProtectedProcedure
    .input(monitoresFinalFiltersSchema)
    .output(z.array(monitorFinalBolsistaSchema))
    .query(async ({ input, ctx }) => {
      let whereCondition = and(
        eq(vagaTable.tipo, BOLSISTA),
        eq(projetoTable.ano, input.ano),
        eq(projetoTable.semestre, input.semestre)
      )

      if (input.departamentoId) {
        whereCondition = and(whereCondition, eq(projetoTable.departamentoId, input.departamentoId))
      }

      const bolsistas = await ctx.db
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
          alunoUser: { email: userTable.email },
          professor: {
            nomeCompleto: professorTable.nomeCompleto,
            matriculaSiape: professorTable.matriculaSiape,
            emailInstitucional: professorTable.emailInstitucional,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            cargaHorariaSemana: projetoTable.cargaHorariaSemana,
            numeroSemanas: projetoTable.numeroSemanas,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          edital: {
            valorBolsa: editalTable.valorBolsa,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(inscricaoTable, eq(vagaTable.inscricaoId, inscricaoTable.id))
        .innerJoin(periodoInscricaoTable, eq(inscricaoTable.periodoInscricaoId, periodoInscricaoTable.id))
        .innerJoin(editalTable, eq(periodoInscricaoTable.id, editalTable.periodoInscricaoId))
        .where(whereCondition)
        .orderBy(departamentoTable.nome, alunoTable.nomeCompleto)

      const bolsistasCompletos = await Promise.all(
        bolsistas.map(async (bolsista) => {
          const disciplinas = await ctx.db
            .select({
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, bolsista.projeto.id))

          const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          return {
            id: bolsista.vaga.id,
            nomeCompleto: bolsista.aluno.nomeCompleto,
            matricula: bolsista.aluno.matricula,
            emailInstitucional: bolsista.alunoUser.email,
            cr: bolsista.aluno.cr || 0,
            rg: bolsista.aluno.rg || undefined,
            cpf: bolsista.aluno.cpf,
            banco: bolsista.aluno.banco || undefined,
            agencia: bolsista.aluno.agencia || undefined,
            conta: bolsista.aluno.conta || undefined,
            digitoConta: bolsista.aluno.digitoConta || undefined,
            projeto: {
              titulo: bolsista.projeto.titulo,
              departamento: bolsista.departamento.nome,
              professorResponsavel: bolsista.professor.nomeCompleto,
              matriculaSiape: bolsista.professor.matriculaSiape || undefined,
              disciplinas: disciplinasTexto.split('; '),
              cargaHorariaSemana: bolsista.projeto.cargaHorariaSemana || 12,
              numeroSemanas: bolsista.projeto.numeroSemanas || 18,
            },
            tipo: BOLSISTA,
            valorBolsa: parseFloat(bolsista.edital.valorBolsa),
          }
        })
      )

      return bolsistasCompletos
    }),

  // Consolidação Final PROGRAD - Planilha de Voluntários
  monitoresFinalVoluntarios: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        departamentoId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      let whereCondition = and(
        eq(vagaTable.tipo, VOLUNTARIO),
        eq(projetoTable.ano, input.ano),
        eq(projetoTable.semestre, input.semestre)
      )

      if (input.departamentoId) {
        whereCondition = and(whereCondition, eq(projetoTable.departamentoId, parseInt(input.departamentoId)))
      }

      const voluntarios = await ctx.db
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
            cargaHorariaSemana: projetoTable.cargaHorariaSemana,
            numeroSemanas: projetoTable.numeroSemanas,
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
        .where(whereCondition)
        .orderBy(alunoTable.nomeCompleto)

      const voluntariosCompletos = await Promise.all(
        voluntarios.map(async (voluntario) => {
          const disciplinas = await ctx.db
            .select({
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, voluntario.projeto.id))

          const assinaturas = await ctx.db
            .select({
              tipoAssinatura: assinaturaDocumentoTable.tipoAssinatura,
              createdAt: assinaturaDocumentoTable.createdAt,
            })
            .from(assinaturaDocumentoTable)
            .where(eq(assinaturaDocumentoTable.vagaId, voluntario.vaga.id))

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')
          const statusTermo = assinaturaAluno && assinaturaProfessor ? 'COMPLETO' : 'PENDENTE'
          const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          const anoSemestre = input.ano
          const dataInicio =
            voluntario.vaga.dataInicio || new Date(anoSemestre, input.semestre === 'SEMESTRE_1' ? 1 : 6, 1)
          const dataFim = new Date(anoSemestre, input.semestre === 'SEMESTRE_1' ? 5 : 11, 30)

          return {
            id: voluntario.vaga.id,
            monitor: {
              nome: voluntario.aluno.nomeCompleto,
              matricula: voluntario.aluno.matricula,
              email: voluntario.alunoUser.email,
              rg: voluntario.aluno.rg,
              cpf: voluntario.aluno.cpf,
              cr: voluntario.aluno.cr || 0,
              telefone: voluntario.aluno.telefone,
            },
            professor: {
              nome: voluntario.professor.nomeCompleto,
              matriculaSiape: voluntario.professor.matriculaSiape,
            },
            projeto: {
              titulo: voluntario.projeto.titulo,
              disciplinas: disciplinasTexto,
              cargaHorariaSemana: voluntario.projeto.cargaHorariaSemana || 12,
              numeroSemanas: voluntario.projeto.numeroSemanas || 18,
            },
            departamento: {
              nome: voluntario.departamento.nome,
              sigla: voluntario.departamento.sigla,
            },
            periodo: {
              ano: anoSemestre,
              semestre: input.semestre,
              dataInicio: dataInicio.toLocaleDateString('pt-BR'),
              dataFim: dataFim.toLocaleDateString('pt-BR'),
            },
            termo: {
              status: statusTermo,
              dataAssinaturaAluno: assinaturaAluno?.createdAt,
              dataAssinaturaProfessor: assinaturaProfessor?.createdAt,
            },
          }
        })
      )

      return voluntariosCompletos
    }),

  // Validar dados completos antes da exportação
  validateCompleteData: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        tipo: z.enum(['bolsistas', 'voluntarios', 'ambos']),
      })
    )
    .query(async ({ input }) => {
      return await checkDadosFaltantesPrograd(db, input)
    }),

  // Exportar consolidação final para PROGRAD (formato Excel)
  exportConsolidated: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        incluirBolsistas: z.boolean().default(true),
        incluirVoluntarios: z.boolean().default(true),
        departamentoId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const validacao = await checkDadosFaltantesPrograd(ctx.db, {
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
          cause: validacao.problemas,
        })
      }

      const nomeArquivo = `consolidacao-prograd-${input.ano}-${input.semestre.replace('_', '')}-${Date.now()}.xlsx`
      return {
        success: true,
        fileName: nomeArquivo,
        message: 'A exportação será gerada em segundo plano.',
      }
    }),
})
