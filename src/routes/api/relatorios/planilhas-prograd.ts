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
import ExcelJS from 'exceljs';
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

          const workbook = new ExcelJS.Workbook();
          workbook.creator = 'Sistema de Monitoria IC';
          workbook.created = new Date();

          // Helper to add a worksheet with styled headers
          const addWorksheet = (name: string, columns: any[], data: any[]) => {
            const worksheet = workbook.addWorksheet(name);
            worksheet.columns = columns;
            worksheet.addRows(data);
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern:'solid',
                fgColor:{argb:'FF203764'}
            };
            columns.forEach((col, index) => {
                worksheet.getColumn(index + 1).width = col.width || 20;
            });
          };

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

          // Define columns for each sheet
          const projetosColumns = [
              { header: 'ID', key: 'id', width: 10 },
              { header: 'Título do Projeto', key: 'titulo', width: 40 },
              { header: 'Departamento', key: 'departamento', width: 30 },
              { header: 'Professor Responsável', key: 'professor', width: 30 },
              { header: 'Disciplinas', key: 'disciplinas', width: 40 },
              { header: 'Bolsas Solicitadas', key: 'bolsasSolicitadas', width: 20 },
              { header: 'Bolsas Concedidas', key: 'bolsasDisponibilizadas', width: 20 },
              { header: 'Voluntários Solicitados', key: 'voluntariosSolicitados', width: 25 },
          ];

          const monitoresColumns = [
              { header: 'Projeto', key: 'projeto', width: 40 },
              { header: 'Tipo de Vaga', key: 'tipoVaga', width: 15 },
              { header: 'Nome do Monitor', key: 'nomeMonitor', width: 30 },
              { header: 'Matrícula', key: 'matricula', width: 15 },
              { header: 'CPF', key: 'cpf', width: 15 },
              { header: 'Email', key: 'email', width: 30 },
              { header: 'Curso', key: 'curso', width: 30 },
              { header: 'CR', key: 'cr', width: 10 },
          ];

          addWorksheet('Projetos Aprovados', projetosColumns, dadosProjetos);
          addWorksheet('Monitores Selecionados', monitoresColumns, dadosMonitores);
          
          const buffer = await workbook.xlsx.writeBuffer();

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

          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
