import { db } from '@/server/database';
import {
  projetoTable,
  assinaturaDocumentoTable,
} from '@/server/database/schema';
import { eq, and } from 'drizzle-orm';
import type { MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate';

// Define a structural type for the transaction object or db client
type DBClient = {
  query: typeof db.query;
};

export async function getProjectPdfData(
  projectId: number,
  tx: DBClient,
): Promise<Partial<MonitoriaFormData>> {
  // Fetch project with its direct relations
  const projeto = await tx.query.projetoTable.findFirst({
    where: eq(projetoTable.id, projectId),
    with: {
      professorResponsavel: true,
      departamento: true,
      disciplinas: { with: { disciplina: true } },
      atividades: true,
    },
  });

  if (!projeto) {
    throw new Error('Projeto não encontrado para geração de PDF.');
  }

  // Fetch signatures separately
  const signatures = await tx.query.assinaturaDocumentoTable.findMany({
    where: eq(assinaturaDocumentoTable.projetoId, projectId),
    orderBy: (fields, operators) => [operators.desc(fields.createdAt)],
  });

  const professorSignatureRecord = signatures.find(
    (sig) => sig.tipoAssinatura === 'PROJETO_PROFESSOR_RESPONSAVEL',
  );
  const adminSignatureRecord = signatures.find(
    (sig) => sig.tipoAssinatura === 'PROJETO_COORDENADOR_DEPARTAMENTO',
  );

  const { professorResponsavel, departamento, disciplinas } = projeto;

  if (!professorResponsavel || !departamento) {
    throw new Error(
      'Dados essenciais do projeto (professor/departamento) ausentes.',
    );
  }

  const formData: Partial<MonitoriaFormData> = {
    titulo: projeto.titulo,
    descricao: projeto.descricao,
    departamento: {
      id: departamento.id,
      nome: departamento.nome,
    },
    professorResponsavel: {
      id: professorResponsavel.id,
      nomeCompleto: professorResponsavel.nomeCompleto,
      nomeSocial: professorResponsavel.nomeSocial || undefined,
      genero: professorResponsavel.genero,
      cpf: professorResponsavel.cpf,
      matriculaSiape: professorResponsavel.matriculaSiape || undefined,
      regime: professorResponsavel.regime,
      telefone: professorResponsavel.telefone || undefined,
      telefoneInstitucional:
        professorResponsavel.telefoneInstitucional || undefined,
      emailInstitucional: professorResponsavel.emailInstitucional,
    },
    ano: projeto.ano,
    semestre: projeto.semestre,
    tipoProposicao: projeto.tipoProposicao,
    bolsasSolicitadas: projeto.bolsasSolicitadas,
    voluntariosSolicitados: projeto.voluntariosSolicitados,
    cargaHorariaSemana: projeto.cargaHorariaSemana,
    numeroSemanas: projeto.numeroSemanas,
    publicoAlvo: projeto.publicoAlvo,
    estimativaPessoasBenificiadas:
      projeto.estimativaPessoasBenificiadas ?? undefined,
    disciplinas: disciplinas.map((pd) => ({
      id: pd.disciplina.id,
      codigo: pd.disciplina.codigo,
      nome: pd.disciplina.nome,
    })),
    assinaturaProfessor: professorSignatureRecord?.assinaturaData,
    dataAssinaturaProfessor:
      professorSignatureRecord?.createdAt.toLocaleDateString('pt-BR'),
    assinaturaAdmin: adminSignatureRecord?.assinaturaData,
    dataAssinaturaAdmin: adminSignatureRecord?.createdAt.toLocaleDateString(
      'pt-BR',
    ),
    dataAprovacao:
      projeto.status === 'APPROVED'
        ? projeto.updatedAt?.toLocaleDateString('pt-BR')
        : undefined,
  };

  return formData;
} 