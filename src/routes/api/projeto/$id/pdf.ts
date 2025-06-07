import { db } from '@/server/database';
import {
  projetoTable,
  assinaturaDocumentoTable,
  tipoAssinaturaEnum,
} from '@/server/database/schema';
import { MonitoriaFormTemplate } from '@/components/features/projects/MonitoriaFormTemplate';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { renderToBuffer } from '@react-pdf/renderer';

const log = logger.child({
  context: 'ProjetoPDFAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/pdf')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userNumericId = ctx.state.user?.userId ? parseInt(ctx.state.user.userId, 10) : undefined;

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }
        if (!userNumericId || isNaN(userNumericId)) {
          return json({ error: 'Usuário inválido'}, { status: 401 });
        }

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: true,
            departamento: true,
            disciplinas: { with: { disciplina: true } },
            atividades: true,
          },
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        if (ctx.state.user.role === 'professor') {
          if (projeto.professorResponsavelId !== userNumericId) {
            return json(
              { error: 'Acesso não autorizado a este projeto' },
              { status: 403 },
            );
          }
        } else if (ctx.state.user.role !== 'admin') {
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        let assinaturaProfessor: string | undefined = undefined;
        const signatureRecord = await db.query.assinaturaDocumentoTable.findFirst({
          where: and(
            eq(assinaturaDocumentoTable.projetoId, projetoId),
            eq(assinaturaDocumentoTable.tipoAssinatura, tipoAssinaturaEnum.enumValues[0])
          ),
          orderBy: (fields, operators) => [operators.desc(fields.createdAt)],
        });

        if (signatureRecord) {
          assinaturaProfessor = signatureRecord.assinaturaData;
        }

        const professor = projeto.professorResponsavel;
        const departamento = projeto.departamento;
        const disciplinasRel = projeto.disciplinas;
        const atividadesRel = projeto.atividades;

        if (!professor || !departamento ) {
             log.error('Dados relacionados ao projeto (professor/departamento) não encontrados após eager loading.', { projetoId });
             return json({ error: 'Dados essenciais do projeto ausentes.' }, { status: 500});
        }

        const formData = {
          titulo: projeto.titulo,
          descricao: projeto.descricao,
          departamento: {
            id: departamento.id,
            nome: departamento.nome,
          },
          professorResponsavel: {
            id: professor.id,
            nomeCompleto: professor.nomeCompleto,
            nomeSocial: professor.nomeSocial || undefined,
            genero: professor.genero as 'MASCULINO' | 'FEMININO' | 'OUTRO',
            cpf: professor.cpf,
            matriculaSiape: professor.matriculaSiape || undefined,
            regime: professor.regime as '20H' | '40H' | 'DE',
            telefone: professor.telefone || undefined,
            telefoneInstitucional: professor.telefoneInstitucional || undefined,
            emailInstitucional: professor.emailInstitucional,
          },
          ano: projeto.ano,
          semestre: projeto.semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
          tipoProposicao: projeto.tipoProposicao as 'INDIVIDUAL' | 'COLETIVA',
          bolsasSolicitadas: projeto.bolsasSolicitadas,
          voluntariosSolicitados: projeto.voluntariosSolicitados,
          cargaHorariaSemana: projeto.cargaHorariaSemana,
          numeroSemanas: projeto.numeroSemanas,
          publicoAlvo: projeto.publicoAlvo,
          estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas ?? undefined,
          disciplinas: disciplinasRel.map((pd) => ({
            id: pd.disciplina.id,
            codigo: pd.disciplina.codigo,
            nome: pd.disciplina.nome,
          })),
          assinaturaProfessor: assinaturaProfessor,
        };

        const pdfBuffer = await renderToBuffer(MonitoriaFormTemplate({ data: formData }));

        return new Response(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="projeto-monitoria-${projetoId}.pdf"`,
          },
        });
      } catch (error) {
        log.error(error, 'Erro ao gerar PDF do projeto');
        return json({ error: 'Erro ao gerar PDF do projeto' }, { status: 500 });
      }
    }),
  ),
});
