import { DepartamentoResponse } from '@/routes/api/department/-types';
import { DisciplinaResponse } from '@/routes/api/disciplina/-types';

export interface ProjetoFormData {
  titulo: string;
  descricao: string;
  departamentoId: number;
  ano: number;
  semestre: 'SEMESTRE_1' | 'SEMESTRE_2';
  tipoProposicao: 'INDIVIDUAL' | 'COLETIVA';
  bolsasSolicitadas: number;
  voluntariosSolicitados: number;
  cargaHorariaSemana: number;
  numeroSemanas: number;
  publicoAlvo: string;
  estimativaPessoasBenificiadas?: number;
  disciplinaIds: number[];
}

export interface ProjetoTemplateData {
  formData: ProjetoFormData;
  departamento?: DepartamentoResponse;
  disciplinas: DisciplinaResponse[];
  user: {
    username?: string;
    email?: string;
  };
}

export function generateProjetoHTML(data: ProjetoTemplateData): string {
  const { formData, departamento, disciplinas, user } = data;

  const semestreLabel =
    formData.semestre === 'SEMESTRE_1'
      ? `${formData.ano}.1`
      : `${formData.ano}.2`;

  const tipoProposicaoLabel =
    formData.tipoProposicao === 'INDIVIDUAL' ? 'Individual' : 'Coletiva';

  const disciplinasText = disciplinas
    .map((d) => `${d.codigo} - ${d.nome}`)
    .join(', ');

  return `
    <div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; padding: 20px; max-height: 600px; overflow-y: auto; border: 1px solid #ddd; background: white;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">
          UNIVERSIDADE FEDERAL DA BAHIA<br/>
          Pró - Reitoria de Ensino de Graduação<br/>
          Coordenação Acadêmica de Graduação
        </div>
        <div style="font-size: 14px; font-weight: bold; margin: 20px 0;">
          ANEXO I – FORMULÁRIO PARA SUBMISSÃO DE PROJETO DE MONITORIA
        </div>
      </div>
      
      <div style="border: 2px solid #000; margin-bottom: 10px;">
        <div style="background-color: #d0d0d0; font-weight: bold; padding: 5px; border-bottom: 1px solid #000;">
          1. IDENTIFICAÇÃO DO PROJETO
        </div>
        <div style="padding: 5px;">
          <div style="margin-bottom: 5px;"><strong>1.1 Unidade Universitária:</strong> Instituto de Computação</div>
          <div style="margin-bottom: 5px;"><strong>1.2 Órgão responsável:</strong> ${departamento?.nome || 'Não selecionado'}</div>
          <div style="margin-bottom: 5px;"><strong>1.3 Título:</strong> ${formData.titulo}</div>
          <div style="margin-bottom: 5px;"><strong>1.4 Componente(s) curricular(es):</strong> ${disciplinasText || 'Nenhuma disciplina selecionada'}</div>
          <div style="margin-bottom: 5px;"><strong>1.5 Semestre:</strong> ${semestreLabel}</div>
          <div style="margin-bottom: 5px;"><strong>1.6 Proposição:</strong> ${tipoProposicaoLabel}</div>
          <div style="margin-bottom: 5px;"><strong>1.7 Número de monitores:</strong> ${(formData.bolsasSolicitadas || 0) + (formData.voluntariosSolicitados || 0)}</div>
          <div style="margin-bottom: 5px;"><strong>1.8 Carga horária semanal:</strong> ${formData.cargaHorariaSemana || 0}h</div>
          <div style="margin-bottom: 5px;"><strong>1.9 Carga horária total:</strong> ${(formData.cargaHorariaSemana || 0) * (formData.numeroSemanas || 0)}h</div>
          <div style="margin-bottom: 5px;"><strong>1.10 Público-alvo:</strong> ${formData.publicoAlvo || 'Não informado'}</div>
          <div style="margin-bottom: 5px;"><strong>1.11 Estimativa de beneficiados:</strong> ${formData.estimativaPessoasBenificiadas || 'Não informado'}</div>
        </div>
      </div>

      <div style="border: 2px solid #000; margin-bottom: 10px;">
        <div style="background-color: #d0d0d0; font-weight: bold; padding: 5px; border-bottom: 1px solid #000;">
          2. DADOS DO PROFESSOR RESPONSÁVEL
        </div>
        <div style="padding: 5px;">
          <div><strong>Nome:</strong> ${user?.username || 'Professor Responsável'}</div>
          <div><strong>E-mail:</strong> ${user?.email || 'professor@ufba.br'}</div>
        </div>
      </div>

      <div style="border: 2px solid #000; margin-bottom: 10px;">
        <div style="background-color: #d0d0d0; font-weight: bold; padding: 5px; border-bottom: 1px solid #000;">
          3. DESCRIÇÃO DO PROJETO
        </div>
        <div style="padding: 10px; min-height: 60px;">
          ${formData.descricao}
        </div>
      </div>
    </div>
  `;
}

export function downloadPDFFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
