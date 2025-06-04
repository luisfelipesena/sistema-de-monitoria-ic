import type { PeriodoInscricaoResponse } from '@/routes/api/periodo-inscricao/-types';
import type { ProjetoResponse } from '@/routes/api/projeto/-types'; // Assumindo que ProjetoResponse tem os dados necessários
import type { User } from 'lucia'; // Para dados do criador/admin
import { env } from '@/utils/env';

// Interface para os dados completos necessários para gerar o PDF do Edital
export interface EditalPdfData {
  edital: {
    id: number;
    numeroEdital: string;
    titulo: string;
    descricaoHtml?: string | null; // Corpo do edital, regras, etc.
    dataPublicacao?: Date | null;
    // fileIdAssinado?: string | null;
  };
  periodoInscricao: PeriodoInscricaoResponse;
  projetosComVagas: Array<
    ProjetoResponse & { // Estende ProjetoResponse
      disciplinasNomes?: string; // Nomes concatenados das disciplinas do projeto
      vagasBolsistaDisponiveis: number;
      vagasVoluntarioDisponiveis: number;
    }
  >;
  adminUser?: { // Usuário que gerou/publicou, para assinatura (ex: Chefe Depto)
    nomeCompleto?: string;
    cargo?: string;
  };
}

// Estilos CSS para o HTML do Edital (similar aos de Projeto, mas pode ser ajustado)
const editalStyles = `
  body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; color: #000; }
  @page { margin: 20mm; size: A4; }
  .header-container { display: flex; align-items: flex-start; margin-bottom: 10px; padding-bottom: 5px; }
  .logo-section { width: 70px; margin-right: 10px; }
  .logo { width: 70px; height: auto; }
  .university-info { flex: 1; text-align: center; font-weight: bold; font-size: 11px; line-height: 1.3; }
  .title { font-size: 14px; font-weight: bold; text-align: center; margin: 15px 0; padding-bottom: 8px; border-bottom: 1px solid #000; }
  .section { margin-bottom: 10px; page-break-inside: avoid; }
  .section-header { font-weight: bold; font-size: 11px; margin-bottom: 5px; padding-top: 5px; border-top: 0.5px solid #eee; }
  .sub-section-header { font-weight: bold; font-size: 10.5px; margin-top: 8px; margin-bottom: 3px; }
  .edital-body { text-align: justify; margin-bottom: 15px; }
  .edital-body p, .edital-body ul, .edital-body ol { margin-bottom: 8px; }
  .edital-body ul, .edital-body ol { padding-left: 20px; }
  .vagas-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top:10px; }
  .vagas-table th, .vagas-table td { border: 1px solid #ccc; padding: 4px; text-align: left; }
  .vagas-table th { background-color: #f2f2f2; font-weight: bold; }
  .assinatura-section { margin-top: 40px; text-align: center; page-break-inside: avoid; }
  .assinatura-line { border-bottom: 1px solid #000; width: 280px; margin: 30px auto 5px auto; display: block; }
  .assinatura-caption { font-size: 9px; }
  .text-center { text-align: center; }
  .text-bold { font-weight: bold; }
  .mt-2 { margin-top: 8px; }
  .mb-1 { margin-bottom: 4px; }
`;

export function generateEditalInternoHTML(data: EditalPdfData): string {
  const { edital, periodoInscricao, projetosComVagas, adminUser } = data;
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000'; // Para links, se necessário

  // Agrupar projetos por departamento para listagem
  const projetosPorDepartamento: { [key: string]: typeof projetosComVagas } = {};
  projetosComVagas.forEach(p => {
    const deptNome = p.departamento?.nome || 'Departamento não especificado';
    if (!projetosPorDepartamento[deptNome]) {
      projetosPorDepartamento[deptNome] = [];
    }
    projetosPorDepartamento[deptNome].push(p);
  });

  let vagasHtml = '';
  for (const deptNome in projetosPorDepartamento) {
    vagasHtml += `<h3 class="sub-section-header">DEPARTAMENTO: ${deptNome.toUpperCase()}</h3>`;
    vagasHtml += '<table class="vagas-table">';
    vagasHtml += '<thead><tr><th>Componente Curricular (Projeto)</th><th>Professor(a) Responsável</th><th>Vagas Bolsista</th><th>Vagas Voluntário</th></tr></thead><tbody>';
    projetosPorDepartamento[deptNome].forEach(p => {
      vagasHtml += `
        <tr>
          <td>${p.disciplinasNomes || p.titulo}</td>
          <td>${p.professorResponsavel?.nomeCompleto || 'N/A'}</td>
          <td class="text-center">${p.vagasBolsistaDisponiveis}</td>
          <td class="text-center">${p.vagasVoluntarioDisponiveis}</td>
        </tr>
      `;
    });
    vagasHtml += '</tbody></table>';
  }
  if (projetosComVagas.length === 0) {
    vagasHtml = '<p class="text-center">Nenhuma vaga de monitoria cadastrada para este edital até o momento.</p>';
  }

  const dataPublicacaoFormatada = edital.dataPublicacao 
    ? new Date(edital.dataPublicacao).toLocaleDateString('pt-BR') 
    : '__/__/____';
  const periodoInicioFormatado = new Date(periodoInscricao.dataInicio).toLocaleDateString('pt-BR');
  const periodoFimFormatado = new Date(periodoInscricao.dataFim).toLocaleDateString('pt-BR');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${edital.titulo} - ${edital.numeroEdital}</title>
        <style>${editalStyles}</style>
    </head>
    <body>
        <div class="header-container">
            <div class="logo-section">
                <!-- <img src="${clientUrl}/images/logo-ufba.png" alt="Logo UFBA" class="logo"> -->
            </div>
            <div class="university-info">
                UNIVERSIDADE FEDERAL DA BAHIA<br>
                INSTITUTO DE COMPUTAÇÃO<br>
                COMISSÃO DE MONITORIA
            </div>
        </div>

        <div class="title">
            ${edital.titulo.toUpperCase()}<br>
            EDITAL Nº ${edital.numeroEdital}
        </div>

        <div class="section edital-body">
            <p class="text-bold">Período de Inscrição: ${periodoInicioFormatado} a ${periodoFimFormatado}</p>
            <hr/>
            ${edital.descricaoHtml || '<p><i>[Conteúdo do edital, incluindo objetivos, público-alvo, requisitos, critérios de seleção, cronograma completo, etc. a ser inserido aqui.]</i></p>'}
        </div>

        <div class="section">
            <h2 class="section-header">QUADRO DE VAGAS</h2>
            ${vagasHtml}
        </div>
        
        <!-- Outras seções comuns de um edital podem ser adicionadas aqui -->
        <div class="section">
            <h2 class="section-header">DISPOSIÇÕES GERAIS</h2>
            <div class="edital-body">
                <p>Casos omissos neste Edital serão resolvidos pela Comissão de Monitoria do Instituto de Computação.</p>
            </div>
        </div>

        <div class="assinatura-section">
            <p>Salvador, ${dataPublicacaoFormatada}.</p>
            <div class="assinatura-line"></div>
            <p class="assinatura-caption">${adminUser?.nomeCompleto || '______________________________________'}</p>
            <p class="assinatura-caption">${adminUser?.cargo || 'Chefia do Departamento / Coordenação de Monitoria'}</p>
        </div>
    </body>
    </html>
  `;
} 