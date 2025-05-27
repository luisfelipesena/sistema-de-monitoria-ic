import { db } from '@/server/database';
import { projetoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { z } from 'zod';

const log = logger.child({
  context: 'PlanilhasProgradAPI',
});

const planilhasParamsSchema = z.object({
  ano: z.string().transform(Number).optional(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
  departamentoId: z.string().transform(Number).optional(),
});

export const APIRoute = createAPIFileRoute('/api/relatorios/planilhas-prograd')(
  {
    GET: createAPIHandler(
      withAuthMiddleware(async (ctx) => {
        try {
          const { role } = ctx.state.user;

          // Verificar se é admin
          if (role !== 'admin') {
            return json(
              { error: 'Acesso restrito a administradores' },
              { status: 403 },
            );
          }

          // Parse dos parâmetros de query
          const url = new URL(ctx.request.url);
          const queryParams = Object.fromEntries(url.searchParams);
          const params = planilhasParamsSchema.parse(queryParams);

          // Usar ano/semestre atual se não especificado
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          const currentSemester =
            currentMonth <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2';

          const ano = params.ano || currentYear;
          const semestre = params.semestre || currentSemester;

          // Buscar todos os projetos aprovados do período
          let projetosWhere = and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            eq(projetoTable.status, 'APPROVED'),
          );

          if (params.departamentoId) {
            projetosWhere = and(
              projetosWhere,
              eq(projetoTable.departamentoId, params.departamentoId),
            );
          }

          // Buscar projetos com todos os relacionamentos
          const projetos = await db.query.projetoTable.findMany({
            where: projetosWhere,
            with: {
              professorResponsavel: true,
              departamento: true,
              vagas: {
                with: {
                  aluno: {
                    with: {
                      curso: true,
                    },
                  },
                },
              },
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          });

          // Preparar dados para planilhas
          const dadosMonitores: any[] = [];
          const dadosProjetos: any[] = [];
          const resumoPorDepartamento: { [key: string]: any } = {};

          projetos.forEach((projeto) => {
            // Dados do projeto
            const disciplinasStr = projeto.disciplinas
              .map((pd) => `${pd.disciplina.codigo} - ${pd.disciplina.nome}`)
              .join('; ');

            dadosProjetos.push({
              'ID Projeto': projeto.id,
              Título: projeto.titulo,
              Departamento: projeto.departamento.nome,
              'Professor Responsável':
                projeto.professorResponsavel.nomeCompleto,
              Disciplinas: disciplinasStr,
              'Bolsas Solicitadas': projeto.bolsasSolicitadas,
              'Bolsas Disponibilizadas': projeto.bolsasDisponibilizadas || 0,
              'Voluntários Solicitados': projeto.voluntariosSolicitados,
              'Carga Horária Semanal': projeto.cargaHorariaSemana,
              'Número de Semanas': projeto.numeroSemanas,
              'Público Alvo': projeto.publicoAlvo,
              Status: projeto.status,
            });

            // Dados dos monitores
            projeto.vagas.forEach((vaga) => {
              dadosMonitores.push({
                'ID Vaga': vaga.id,
                Projeto: projeto.titulo,
                Departamento: projeto.departamento.nome,
                'Professor Responsável':
                  projeto.professorResponsavel.nomeCompleto,
                Disciplinas: disciplinasStr,
                'Nome do Monitor': vaga.aluno.nomeCompleto,
                Matrícula: vaga.aluno.matricula,
                CPF: vaga.aluno.cpf,
                Email: vaga.aluno.emailInstitucional,
                Curso: vaga.aluno.curso.nome,
                CR: vaga.aluno.cr,
                'Tipo de Vaga': vaga.tipo,
                'Data Início': vaga.dataInicio
                  ? vaga.dataInicio.toLocaleDateString('pt-BR')
                  : '',
                'Data Fim': vaga.dataFim
                  ? vaga.dataFim.toLocaleDateString('pt-BR')
                  : '',
                'Carga Horária Semanal': projeto.cargaHorariaSemana,
                'Total de Horas':
                  projeto.cargaHorariaSemana * projeto.numeroSemanas,
              });
            });

            // Resumo por departamento
            const deptKey = projeto.departamento.nome;
            if (!resumoPorDepartamento[deptKey]) {
              resumoPorDepartamento[deptKey] = {
                Departamento: projeto.departamento.nome,
                'Total de Projetos': 0,
                'Bolsas Solicitadas': 0,
                'Bolsas Preenchidas': 0,
                'Voluntários Solicitados': 0,
                'Voluntários Ativos': 0,
                'Total de Monitores': 0,
              };
            }

            const resumo = resumoPorDepartamento[deptKey];
            resumo['Total de Projetos']++;
            resumo['Bolsas Solicitadas'] += projeto.bolsasSolicitadas;
            resumo['Voluntários Solicitados'] += projeto.voluntariosSolicitados;

            const bolsistasAtivos = projeto.vagas.filter(
              (v) => v.tipo === 'BOLSISTA',
            ).length;
            const voluntariosAtivos = projeto.vagas.filter(
              (v) => v.tipo === 'VOLUNTARIO',
            ).length;

            resumo['Bolsas Preenchidas'] += bolsistasAtivos;
            resumo['Voluntários Ativos'] += voluntariosAtivos;
            resumo['Total de Monitores'] += projeto.vagas.length;
          });

          // Criar workbook Excel
          const workbook = XLSX.utils.book_new();

          // Planilha 1: Resumo por Departamento
          const wsResumo = XLSX.utils.json_to_sheet(
            Object.values(resumoPorDepartamento),
          );
          XLSX.utils.book_append_sheet(
            workbook,
            wsResumo,
            'Resumo por Departamento',
          );

          // Planilha 2: Dados dos Monitores
          const wsMonitores = XLSX.utils.json_to_sheet(dadosMonitores);
          XLSX.utils.book_append_sheet(
            workbook,
            wsMonitores,
            'Monitores Ativos',
          );

          // Planilha 3: Dados dos Projetos
          const wsProjetos = XLSX.utils.json_to_sheet(dadosProjetos);
          XLSX.utils.book_append_sheet(
            workbook,
            wsProjetos,
            'Projetos Aprovados',
          );

          // Adicionar informações de cabeçalho
          const infoSheet = XLSX.utils.json_to_sheet([
            {
              Relatório: 'Planilha de Monitores para PROGRAD',
              Período: `${ano}.${semestre === 'SEMESTRE_1' ? '1' : '2'}`,
              'Data de Geração': new Date().toLocaleDateString('pt-BR'),
              'Hora de Geração': new Date().toLocaleTimeString('pt-BR'),
              'Total de Projetos': projetos.length,
              'Total de Monitores': dadosMonitores.length,
            },
          ]);
          XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informações');

          // Gerar arquivo Excel
          const excelBuffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
          });

          log.info(
            {
              ano,
              semestre,
              departamentoId: params.departamentoId,
              totalProjetos: projetos.length,
              totalMonitores: dadosMonitores.length,
            },
            'Planilha PROGRAD gerada com sucesso',
          );

          // Definir nome do arquivo
          const fileName = params.departamentoId
            ? `monitores-${ano}-${semestre === 'SEMESTRE_1' ? '1' : '2'}-dept-${params.departamentoId}.xlsx`
            : `monitores-${ano}-${semestre === 'SEMESTRE_1' ? '1' : '2'}-completo.xlsx`;

          return new Response(new Uint8Array(excelBuffer), {
            status: 200,
            headers: {
              'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': `attachment; filename="${fileName}"`,
            },
          });
        } catch (error) {
          log.error(error, 'Erro ao gerar planilha PROGRAD');
          return json({ error: 'Erro ao gerar planilha' }, { status: 500 });
        }
      }),
    ),
  },
);
