interface ProfessorData {
  nomeCompleto: string;
  nomeSocial?: string;
  genero: string;
  cpf: string;
  siape: string;
  regime: string;
  telefoneInstitucional?: string;
  celular?: string;
  emailInstitucional: string;
}

interface DepartamentoData {
  nome: string;
  unidadeUniversitaria?: string;
}

interface DisciplinaData {
  codigo: string;
  nome: string;
}

interface AtividadeData {
  id: number;
  descricao: string;
}

export interface ProjetoMonitoriaData {
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
  estimativaPessoasBeneficiadas?: number;
  professor: ProfessorData;
  departamento: DepartamentoData;
  disciplinas: DisciplinaData[];
  atividades?: AtividadeData[];
  dataAprovacao?: string;
  editalProgradNumero?: string;
  editalProgradAno?: string;
  assinaturaProfessorBase64?: string;
}

export function generateProjetoMonitoriaPDF(
  data: ProjetoMonitoriaData,
): string {
  const semestreLabel =
    data.semestre === 'SEMESTRE_1' ? `${data.ano}.1` : `${data.ano}.2`;
  const tipoProposicaoLabel =
    data.tipoProposicao === 'INDIVIDUAL' ? 'Individual' : 'Coletiva';
  
  let disciplinasText = 'Não especificadas';
  if (data.disciplinas && data.disciplinas.length > 0) {
    disciplinasText = data.disciplinas
      .map((d) => `${d.codigo} - ${d.nome}`)
      .join('; ');
  }

  let atividadesHtml = '<li>Nenhuma atividade prevista especificada.</li>';
  if (data.atividades && data.atividades.length > 0) {
    atividadesHtml = data.atividades
      .map((a) => `<li>${a.descricao}</li>`)
      .join('');
  }

  const generoCheckboxes = {
    feminino: data.professor.genero === 'FEMININO' ? 'X' : '&nbsp;',
    masculino: data.professor.genero === 'MASCULINO' ? 'X' : '&nbsp;',
    outro: data.professor.genero === 'OUTRO' ? 'X' : '&nbsp;',
  };

  const regimeCheckboxes = {
    '20h': data.professor.regime === '20H' ? 'X' : '&nbsp;',
    '40h': data.professor.regime === '40H' ? 'X' : '&nbsp;',
    de: data.professor.regime === 'DE' ? 'X' : '&nbsp;',
  };

  const tipoProposicaoCheckboxes = {
    individual: data.tipoProposicao === 'INDIVIDUAL' ? 'X' : '&nbsp;',
    coletiva: data.tipoProposicao === 'COLETIVA' ? 'X' : '&nbsp;',
  };

  const editalProgradNumero = data.editalProgradNumero || '_______';
  const editalProgradAno = data.editalProgradAno || '____';
  
  const totalMonitores = (data.bolsasSolicitadas || 0) + (data.voluntariosSolicitados || 0);

  let professorSignatureHtml = `
    <div class="signature-line-container">
        <div class="signature-line"></div>
        <div class="signature-caption">${data.professor.nomeCompleto}</div>
        <div class="signature-caption">Professor(a) Responsável pelo Projeto</div>
    </div>`;

  if (data.assinaturaProfessorBase64) {
    professorSignatureHtml = `
    <div class="signature-image-container" style="text-align: center; margin-bottom: 5px;">
        <img src="${data.assinaturaProfessorBase64}" alt="Assinatura do Professor" style="width: 220px; height: auto; max-height: 80px; display: inline-block;"/>
    </div>
    <div class="signature-line-container" style="margin-top: 0;">
        <div class="signature-caption" style="font-weight: bold;">${data.professor.nomeCompleto}</div>
        <div class="signature-caption">Professor(a) Responsável pelo Projeto (Assinado Digitalmente)</div>
    </div>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Formulário de Submissão de Projeto de Monitoria</title>
    <style>
        @page {
            margin: 20mm;
            size: A4;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            color: #000;
        }
        
        .header-container {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            padding-bottom: 5px;
        }
        
        .logo-section {
            width: 70px;
            margin-right: 10px;
        }
        
        .logo {
            width: 70px;
            height: auto;
        }
        
        .university-info {
            flex: 1;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            line-height: 1.3;
        }
        
        .title {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            padding: 8px 0;
        }
        
        .section {
            border: 1.5px solid #000;
            margin-bottom: 6px;
            page-break-inside: avoid;
        }
        
        .section-header {
            background-color: #e0e0e0;
            font-weight: bold;
            padding: 4px 6px;
            border-bottom: 1px solid #000;
            font-size: 10.5px;
        }
        
        .form-row {
            border-bottom: 0.5px solid #000;
            padding: 4px 6px;
            min-height: 18px;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-wrap: wrap;
        }

        .form-row.no-border {
            border-bottom: none;
        }
        
        .form-row:last-child {
            border-bottom: none;
        }
        
        .field-label {
            font-weight: bold;
            margin-right: 5px;
        }
        
        .field-value {
        }

        .field-group {
            display: flex;
            margin-right: 10px;
            padding-bottom: 2px;
        }
        
        .checkbox-group {
            display: inline-flex;
            align-items: center;
            margin-right: 8px;
        }

        .checkbox {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1px solid #000;
            text-align: center;
            line-height: 9px;
            font-size: 8px;
            margin: 0 3px 0 1px;
            vertical-align: middle;
        }
        
        .description-box, .activities-box {
            min-height: 60px;
            padding: 8px;
            line-height: 1.3;
            text-align: justify;
        }
        .activities-box ul {
            padding-left: 15px;
            margin-top: 0;
            margin-bottom: 0;
        }
        .activities-box li {
            margin-bottom: 3px;
        }

        .signature-section {
            margin-top: 20px;
            page-break-inside: avoid;
        }
        
        .signature-line-container {
            text-align: center;
            margin-top: 30px;
        }

        .signature-line {
            border-bottom: 1px solid #000;
            width: 280px;
            display: inline-block;
        }
        .signature-caption {
            font-size: 9px;
            margin-top: 3px;
        }
        
        .approval-signatures {
            margin-top: 25px;
            border-top: 1px solid #000;
            padding-top: 15px;
            page-break-inside: avoid;
        }

        .approval-admin-title {
            text-align: center; 
            font-weight: bold; 
            margin-bottom: 15px;
            border-bottom: 1px solid #000; 
            padding-bottom: 8px;
        }
        
        .approval-row {
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .approval-field {
            flex: 1;
            margin-right: 15px;
        }
        
        .approval-signature {
            flex: 0 0 220px;
            text-align: center;
        }
        
        .small-text {
            font-size: 8.5px;
            color: #333;
        }
        .input-placeholder {
            border-bottom: 0.5px dotted #555;
            padding: 0 2px;
            min-width: 50px;
            display: inline-block;
        }
        .full-width-row {
            width: 100%;
        }
        .half-width-row {
            width: calc(50% - 5px);
            display: inline-block;
        }
         .third-width-row {
            width: calc(33.33% - 7px);
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="header-container">
        <div class="logo-section">
        </div>
        <div class="university-info">
            UNIVERSIDADE FEDERAL DA BAHIA<br>
            ${data.departamento.unidadeUniversitaria || 'INSTITUTO DE COMPUTAÇÃO'}<br>
            Pró-Reitoria de Ensino de Graduação - PROGRAD<br>
        </div>
    </div>

    <div class="title">
        FORMULÁRIO PARA SUBMISSÃO DE PROJETO DE MONITORIA<br>
        PROGRAMA DE MONITORIA ${data.ano} – EDITAL PROGRAD/UFBA Nº ${editalProgradNumero}/${editalProgradAno}
    </div>

    <div class="section">
        <div class="section-header">1. IDENTIFICAÇÃO DO PROJETO</div>
        <div class="form-row">
            <span class="field-label">1.1. Título do Projeto:</span>
            <span class="field-value">${data.titulo}</span>
        </div>
        <div class="form-row">
            <span class="field-label">1.2. Unidade Universitária/Escola:</span>
            <span class="field-value">${data.departamento.unidadeUniversitaria || 'Instituto de Computação'}</span>
        </div>
        <div class="form-row">
            <span class="field-label">1.3. Departamento:</span>
            <span class="field-value">${data.departamento.nome}</span>
        </div>
        <div class="form-row">
            <span class="field-label">1.4. Componente(s) Curricular(es) Atendido(s) pelo Projeto (Código e Nome):</span>
            <span class="field-value">${disciplinasText}</span>
        </div>
        <div class="form-row">
             <div class="field-group" style="width: calc(30% - 5px);">
                <span class="field-label">1.5. Semestre Letivo:</span>
                <span class="field-value">${semestreLabel}</span>
            </div>
            <div class="field-group" style="width: calc(70% - 5px);">
                <span class="field-label">1.6. Tipo de Proposição:</span>
                <span class="checkbox-group">Individual <span class="checkbox">${tipoProposicaoCheckboxes.individual}</span></span>
                <span class="checkbox-group">Coletiva <span class="checkbox">${tipoProposicaoCheckboxes.coletiva}</span></span>
                ${data.tipoProposicao === 'COLETIVA' ? '<span class="field-label">Nº de Professores:</span><span class="field-value input-placeholder">___</span>' : ''}
            </div>
        </div>
        <div class="form-row">
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">1.7. Nº de Monitores com Bolsa Desejado:</span>
                <span class="field-value">${data.bolsasSolicitadas}</span>
            </div>
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">1.8. Nº de Monitores Voluntários Desejado:</span>
                <span class="field-value">${data.voluntariosSolicitados}</span>
            </div>
        </div>
        <div class="form-row">
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">1.9. Carga Horária Semanal Prevista para o Monitor:</span>
                <span class="field-value">${data.cargaHorariaSemana} horas</span>
            </div>
             <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">1.10. Nº de Semanas Previstas para Atuação do Monitor:</span>
                <span class="field-value">${data.numeroSemanas}</span>
            </div>
        </div>
         <div class="form-row no-border">
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">1.11. Público Alvo:</span>
                <span class="field-value">${data.publicoAlvo}</span>
            </div>
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">1.12. Estimativa de Pessoas Beneficiadas:</span>
                <span class="field-value">${data.estimativaPessoasBeneficiadas || '____'}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">2. DADOS DO(A) PROFESSOR(A) PROPONENTE RESPONSÁVEL PELO PROJETO</div>
        <div class="form-row">
            <span class="field-label">2.1. Nome Completo:</span>
            <span class="field-value">${data.professor.nomeCompleto}</span>
        </div>
        <div class="form-row">
            <span class="field-label">2.2. Nome Social (se houver):</span>
            <span class="field-value">${data.professor.nomeSocial || 'Não informado'}</span>
        </div>
        <div class="form-row">
            <div class="field-group" style="width: calc(40% - 5px);">
                <span class="field-label">2.3. CPF:</span>
                <span class="field-value">${data.professor.cpf || '___.___.___-__'}</span>
            </div>
            <div class="field-group" style="width: calc(30% - 5px);">
                <span class="field-label">2.4. SIAPE:</span>
                <span class="field-value">${data.professor.siape || '_______'}</span>
            </div>
             <div class="field-group" style="width: calc(30% - 5px);">
                <span class="field-label">2.5. Gênero:</span>
                <span class="checkbox-group">F <span class="checkbox">${generoCheckboxes.feminino}</span></span>
                <span class="checkbox-group">M <span class="checkbox">${generoCheckboxes.masculino}</span></span>
                <span class="checkbox-group">Outro <span class="checkbox">${generoCheckboxes.outro}</span></span>
            </div>
        </div>
        <div class="form-row">
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">2.6. Regime de Trabalho:</span>
                <span class="checkbox-group">20h <span class="checkbox">${regimeCheckboxes['20h']}</span></span>
                <span class="checkbox-group">40h <span class="checkbox">${regimeCheckboxes['40h']}</span></span>
                <span class="checkbox-group">DE <span class="checkbox">${regimeCheckboxes.de}</span></span>
            </div>
             <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">2.7. Lotação (Departamento):</span>
                <span class="field-value">${data.departamento.nome}</span>
            </div>
        </div>
        <div class="form-row">
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">2.8. Telefone Institucional:</span>
                <span class="field-value">${data.professor.telefoneInstitucional || 'Não informado'}</span>
            </div>
            <div class="field-group" style="width: calc(50% - 5px);">
                <span class="field-label">2.9. Telefone Celular:</span>
                <span class="field-value">${data.professor.celular || 'Não informado'}</span>
            </div>
        </div>
        <div class="form-row no-border">
            <span class="field-label">2.10. E-mail Institucional:</span>
            <span class="field-value">${data.professor.emailInstitucional}</span>
        </div>
    </div>
    
    <div class="section">
        <div class="section-header">3. OBJETIVOS E JUSTIFICATIVA DO PROJETO</div>
        <div class="description-box">
            ${data.descricao.replace(/\\n/g, '<br>')}
        </div>
    </div>

    <div class="section">
        <div class="section-header">4. PLANO DE TRABALHO DO(S) MONITOR(ES)</div>
        <div class="activities-box">
            <strong>Atividades a serem desenvolvidas:</strong>
            <ul>
                ${atividadesHtml}
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-header">5. DECLARAÇÃO</div>
        <div class="form-row no-border" style="text-align: justify;">
            <span class="field-value">
                Declaro ter conhecimento da Resolução nº 05/2021 do CAE/UFBA e das normas descritas no Edital PROGRAD/UFBA Nº ${editalProgradNumero}/${editalProgradAno} – Programa de Monitoria ${semestreLabel}.
                <span class="checkbox" style="margin-left: 5px;">X</span>
            </span>
        </div>
    </div>

    <div class="signature-section">
        ${professorSignatureHtml} 
         <div style="text-align: left; margin-top: 10px;">
            Salvador, <span class="input-placeholder" style="min-width: 80px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> de <span class="input-placeholder" style="min-width: 100px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> de ${data.ano}.
        </div>
    </div>

    <div class="approval-signatures">
        <div class="approval-admin-title">
            PARA USO EXCLUSIVO DA ADMINISTRAÇÃO
        </div>
        <div class="approval-row">
            <div class="approval-field">
                <strong>Aprovação da Chefia do Departamento:</strong><br>
                <span class="small-text">Aprovado (&nbsp;&nbsp;) Rejeitado (&nbsp;&nbsp;)</span><br>
                Data: ___/___/____
            </div>
            <div class="approval-signature">
                <div class="signature-line"></div>
                <div class="signature-caption">Assinatura e Carimbo</div>
            </div>
        </div>
        <div class="approval-row">
            <div class="approval-field">
                <strong>Aprovação da Coordenação de Monitoria do IC:</strong><br>
                <span class="small-text">Aprovado (&nbsp;&nbsp;) Rejeitado (&nbsp;&nbsp;)</span><br>
                Data: ___/___/____
            </div>
            <div class="approval-signature">
                <div class="signature-line"></div>
                <div class="signature-caption">Assinatura e Carimbo</div>
            </div>
        </div>
        <div class="form-row" style="margin-top: 15px; border-top: 1px solid #000; padding-top: 10px;">
            <span class="field-label">Número de Bolsas Concedidas:</span>
            <span class="field-value input-placeholder" style="min-width: 30px;">____</span>
        </div>
        <div class="form-row">
            <span class="field-label">Número de Vagas para Voluntários Concedidas:</span>
            <span class="field-value input-placeholder" style="min-width: 30px;">____</span>
        </div>
         <div class="form-row no-border">
            <span class="field-label">Observações/Justificativa:</span>
            <span class="field-value input-placeholder" style="min-width: 400px; display:block; margin-top:5px;">&nbsp;</span>
        </div>
    </div>
    <div style="margin-top: 20px; font-size: 8px; text-align:center; color: #555;">
        Formulário baseado no modelo PROGRAD/UFBA.
    </div>
</body>
</html>
`;
} 