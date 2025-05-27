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
  disciplinaIds: number[];
  professor: ProfessorData;
  departamento: DepartamentoData;
  disciplinas: DisciplinaData[];
  dataAprovacao?: string;
}

export function generateProjetoMonitoriaPDF(
  data: ProjetoMonitoriaData,
): string {
  const semestreLabel =
    data.semestre === 'SEMESTRE_1' ? `${data.ano}.1` : `${data.ano}.2`;
  const tipoProposicaoLabel =
    data.tipoProposicao === 'INDIVIDUAL' ? 'Individual' : 'Coletiva';
  const disciplinasText = data.disciplinas
    .map((d) => `${d.codigo} - ${d.nome}`)
    .join(', ');

  const generoCheckboxes = {
    feminino: data.professor.genero === 'FEMININO' ? 'X' : ' ',
    masculino: data.professor.genero === 'MASCULINO' ? 'X' : ' ',
    outro: data.professor.genero === 'OUTRO' ? 'X' : ' ',
  };

  const regimeCheckboxes = {
    '20h': data.professor.regime === '20H' ? 'X' : ' ',
    '40h': data.professor.regime === '40H' ? 'X' : ' ',
    de: data.professor.regime === 'DE' ? 'X' : ' ',
  };

  const tipoProposicaoCheckboxes = {
    individual: data.tipoProposicao === 'INDIVIDUAL' ? 'X' : ' ',
    coletiva: data.tipoProposicao === 'COLETIVA' ? 'X' : ' ',
  };

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
            font-size: 11px;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            color: #000;
        }
        
        .header-container {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
        }
        
        .logo-section {
            width: 80px;
            margin-right: 15px;
        }
        
        .logo {
            width: 80px;
            height: auto;
        }
        
        .university-info {
            flex: 1;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .title {
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 10px 0;
        }
        
        .section {
            border: 2px solid #000;
            margin-bottom: 8px;
            page-break-inside: avoid;
        }
        
        .section-header {
            background-color: #d0d0d0;
            font-weight: bold;
            padding: 5px 8px;
            border-bottom: 1px solid #000;
            font-size: 11px;
        }
        
        .form-row {
            border-bottom: 1px solid #000;
            padding: 6px 8px;
            min-height: 20px;
            display: table;
            width: 100%;
            box-sizing: border-box;
        }
        
        .form-row:last-child {
            border-bottom: none;
        }
        
        .field-label {
            font-weight: bold;
            display: inline;
        }
        
        .field-value {
            display: inline;
            margin-left: 5px;
        }
        
        .checkbox {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            text-align: center;
            line-height: 10px;
            font-size: 8px;
            margin: 0 2px;
            vertical-align: middle;
        }
        
        .description-box {
            min-height: 80px;
            padding: 10px;
            line-height: 1.4;
            text-align: justify;
        }
        
        .activities-box {
            min-height: 60px;
            padding: 10px;
            line-height: 1.4;
        }
        
        .inline-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .inline-table td {
            padding: 0;
            vertical-align: middle;
            border: none;
        }
        
        .signature-section {
            margin-top: 30px;
            page-break-inside: avoid;
        }
        
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .signature-table td {
            padding: 10px 0;
            vertical-align: bottom;
            border: none;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 250px;
            height: 40px;
            display: inline-block;
        }
        
        .approval-signatures {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 20px;
            page-break-inside: avoid;
        }
        
        .approval-row {
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .approval-field {
            flex: 1;
            margin-right: 20px;
        }
        
        .approval-signature {
            flex: 0 0 200px;
            text-align: center;
        }
        
        .small-text {
            font-size: 9px;
            color: #666;
        }
    </style>
</head>
<body>
    <!-- Cabeçalho com logo da UFBA -->
    <div class="header-container">
        <div class="logo-section">
            <img src="/images/logo-ufba.png" alt="Logo UFBA" class="logo">
        </div>
        <div class="university-info">
            UNIVERSIDADE FEDERAL DA BAHIA<br>
            Pró - Reitoria de Ensino de Graduação<br>
            Coordenação Acadêmica de Graduação
        </div>
    </div>

    <div class="title">
        ANEXO I – FORMULÁRIO PARA SUBMISSÃO DE PROJETO DE MONITORIA
    </div>

    <!-- 1. IDENTIFICAÇÃO DO PROJETO -->
    <div class="section">
        <div class="section-header">1. IDENTIFICAÇÃO DO PROJETO</div>
        
        <div class="form-row">
            <span class="field-label">1.1 Unidade Universitária:</span>
            <span class="field-value">${data.departamento.unidadeUniversitaria || 'Instituto de Computação'}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.2 Órgão responsável (Departamento ou Coord. Acadêmica):</span>
            <span class="field-value">${data.departamento.nome}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.3 Data da aprovação do projeto:</span>
            <span class="field-value">${data.dataAprovacao || '___/___/____'}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.4 Componente(s) curricular(es) (código e nome):</span>
            <span class="field-value">${disciplinasText}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.5 Semestre:</span>
            <span class="field-value">${semestreLabel}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.6 Proposição:</span>
            <span class="field-value">
                Individual <span class="checkbox">${tipoProposicaoCheckboxes.individual}</span> ( )
                Coletiva <span class="checkbox">${tipoProposicaoCheckboxes.coletiva}</span> ( ) – Nesse caso, informar quantos professores: ____
            </span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.7 Número desejado de monitores:</span>
            <span class="field-value">${data.bolsasSolicitadas + data.voluntariosSolicitados}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.8 Carga horária semanal:</span>
            <span class="field-value">${data.cargaHorariaSemana}h (Resolução CAE Nº 05/2021, Art. 7º, inciso I)</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.9 Carga horária total pretendida (12h x Nº de semanas):</span>
            <span class="field-value">${data.cargaHorariaSemana * data.numeroSemanas}h</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.10 Público-alvo:</span>
            <span class="field-value">
                Estudantes de graduação <span class="checkbox">X</span> ( ), Outros <span class="checkbox"> </span> ( ) – Informar qual: ____
            </span>
        </div>
        
        <div class="form-row">
            <span class="field-label">1.11 Estimativa de quantas pessoas serão beneficiadas com o projeto:</span>
            <span class="field-value">${data.estimativaPessoasBeneficiadas || '____'}</span>
        </div>
    </div>

    <!-- 2. DADOS DO PROFESSOR RESPONSÁVEL PELO PROJETO -->
    <div class="section">
        <div class="section-header">2. DADOS DO PROFESSOR RESPONSÁVEL PELO PROJETO (PROPONENTE)</div>
        
        <div class="form-row">
            <span class="field-label">2.1 Nome Completo:</span>
            <span class="field-value">${data.professor.nomeCompleto}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">2.2 Nome Social (se houver):</span>
            <span class="field-value">${data.professor.nomeSocial || ''}</span>
        </div>
        
        <div class="form-row">
            <span class="field-label">2.3 Gênero:</span>
            <span class="field-value">
                Feminino <span class="checkbox">${generoCheckboxes.feminino}</span> ( )
                Masculino <span class="checkbox">${generoCheckboxes.masculino}</span> ( )
                Outro <span class="checkbox">${generoCheckboxes.outro}</span> ( )
            </span>
        </div>
        
        <div class="form-row">
            <table class="inline-table">
                <tr>
                    <td style="width: 40%;">
                        <span class="field-label">2.4 CPF:</span> ${data.professor.cpf || '___.___.___-__'}
                    </td>
                    <td style="width: 30%;">
                        <span class="field-label">2.5 SIAPE:</span> ${data.professor.siape || '_______'}
                    </td>
                    <td style="width: 30%;">
                        <span class="field-label">2.6 Regime:</span>
                        20h <span class="checkbox">${regimeCheckboxes['20h']}</span> ( )
                        40h <span class="checkbox">${regimeCheckboxes['40h']}</span> ( )
                        DE <span class="checkbox">${regimeCheckboxes.de}</span> ( )
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="form-row">
            <table class="inline-table">
                <tr>
                    <td style="width: 50%;">
                        <span class="field-label">2.7 Tel. Institucional:</span> ( ${data.professor.telefoneInstitucional || ''} )
                    </td>
                    <td style="width: 50%;">
                        <span class="field-label">2.8 Celular:</span> ( ${data.professor.celular || ''} )
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="form-row">
            <span class="field-label">2.9 E-mail institucional:</span>
            <span class="field-value">${data.professor.emailInstitucional}</span>
        </div>
    </div>

    <!-- 3. DESCRIÇÃO DO PROJETO -->
    <div class="section">
        <div class="section-header">3. DESCRIÇÃO DO PROJETO</div>
        <div class="description-box">
            ${data.descricao}
        </div>
    </div>

    <!-- 4. ATIVIDADES QUE SERÃO DESENVOLVIDAS PELO(S) MONITOR(ES) -->
    <div class="section">
        <div class="section-header">4. ATIVIDADES QUE SERÃO DESENVOLVIDAS PELO(S) MONITOR(ES)</div>
        <div class="activities-box">
            • Auxiliar o professor na elaboração de problemas para listas e provas<br>
            • Auxiliar os alunos no uso das plataformas de submissão de problemas<br>
            • Auxiliar os alunos quanto ao uso de comandos e programação em Python e lógica de programação em sala<br>
            • Auxiliar os alunos em horário extra classe
        </div>
    </div>

    <!-- 5. DECLARAÇÃO -->
    <div class="section">
        <div class="section-header">5. DECLARAÇÃO</div>
        <div class="form-row">
            Declaro ter conhecimento da Resolução nº 05/2021 do CAE e das normas descritas no Edital PROGRAD/UFBA Nº 001/2025 –
            Programa de Monitoria ${semestreLabel} <span class="checkbox">X</span> ( )
        </div>
    </div>

    <!-- SEÇÃO DE ASSINATURAS -->
    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td style="width: 60%; text-align: left;">
                    <strong>Data e Assinatura do(a) Prof(a). Responsável:</strong> ___/___/${data.ano}
                </td>
                <td style="width: 40%; text-align: center;">
                    <div class="signature-line"></div>
                </td>
            </tr>
        </table>
    </div>

    <!-- SEÇÕES DE APROVAÇÃO ADMINISTRATIVA -->
    <div class="approval-signatures">
        <div style="text-align: center; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 10px;">
            PARA USO EXCLUSIVO DA ADMINISTRAÇÃO
        </div>
        
        <div class="approval-row">
            <div class="approval-field">
                <strong>Coordenação do Curso:</strong><br>
                <span class="small-text">Aprovado ( ) Rejeitado ( )</span><br>
                Data: ___/___/${data.ano}
            </div>
            <div class="approval-signature">
                <div class="signature-line"></div>
                <div style="margin-top: 5px; font-size: 9px;">Assinatura e Carimbo</div>
            </div>
        </div>
        
        <div class="approval-row">
            <div class="approval-field">
                <strong>Coordenação Acadêmica:</strong><br>
                <span class="small-text">Aprovado ( ) Rejeitado ( )</span><br>
                <strong>Bolsas Disponibilizadas:</strong> ____<br>
                Data: ___/___/${data.ano}
            </div>
            <div class="approval-signature">
                <div class="signature-line"></div>
                <div style="margin-top: 5px; font-size: 9px;">Assinatura e Carimbo</div>
            </div>
        </div>
        
        <div class="approval-row">
            <div class="approval-field">
                <strong>Observações:</strong><br>
                <div style="border: 1px solid #000; min-height: 40px; padding: 5px; margin-top: 5px;"></div>
            </div>
            <div class="approval-signature"></div>
        </div>
    </div>
</body>
</html>
  `;
}
