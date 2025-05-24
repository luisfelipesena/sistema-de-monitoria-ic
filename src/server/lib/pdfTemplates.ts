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
    feminino: data.professor.genero === 'FEMININO' ? 'X' : '',
    masculino: data.professor.genero === 'MASCULINO' ? 'X' : '',
    outro: data.professor.genero === 'OUTRO' ? 'X' : '',
  };

  const regimeCheckboxes = {
    '20h': data.professor.regime === '20H' ? 'X' : '',
    '40h': data.professor.regime === '40H' ? 'X' : '',
    de: data.professor.regime === 'DE' ? 'X' : '',
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Formulário de Submissão de Projeto de Monitoria</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            margin: 20px;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
        }
        .university-info {
            font-weight: bold;
            margin-bottom: 20px;
        }
        .title {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .section {
            border: 2px solid #000;
            margin-bottom: 10px;
        }
        .section-header {
            background-color: #d0d0d0;
            font-weight: bold;
            padding: 5px;
            border-bottom: 1px solid #000;
        }
        .form-row {
            border-bottom: 1px solid #000;
            padding: 4px;
            min-height: 18px;
            display: flex;
            align-items: center;
        }
        .form-row:last-child {
            border-bottom: none;
        }
        .field-label {
            font-weight: bold;
            margin-right: 5px;
        }
        .field-value {
            flex: 1;
        }
        .checkbox {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            margin: 0 3px;
            text-align: center;
            line-height: 10px;
            font-size: 10px;
        }
        .description-box {
            min-height: 100px;
            padding: 10px;
            border: 1px solid #000;
            margin: 10px 0;
        }
        .activities-box {
            min-height: 60px;
            padding: 10px;
            border: 1px solid #000;
            margin: 10px 0;
        }
        .signature-section {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 20px;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            margin: 20px auto;
            text-align: center;
            padding-bottom: 5px;
        }
        .page-break {
            page-break-before: always;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td {
            padding: 3px;
            vertical-align: top;
        }
    </style>
</head>
<body>
    <div class="header">
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
            <span class="field-value">${data.dataAprovacao || '______________'}</span>
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
                ${tipoProposicaoLabel}
                <span class="checkbox">${data.tipoProposicao === 'INDIVIDUAL' ? 'X' : ''}</span> ( )
                Coletiva <span class="checkbox">${data.tipoProposicao === 'COLETIVA' ? 'X' : ''}</span> ( ) - Nesse caso, informar quantos professores: ____
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
                ${data.publicoAlvo} <span class="checkbox">X</span> ( ), Outros ( ) – Informar qual: ____
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
            <table>
                <tr>
                    <td>
                        <span class="field-label">2.3 Gênero:</span>
                        Feminino <span class="checkbox">${generoCheckboxes.feminino}</span> ( )
                        Masculino <span class="checkbox">${generoCheckboxes.masculino}</span> ( )
                        Outro <span class="checkbox">${generoCheckboxes.outro}</span> ( )
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="form-row">
            <table>
                <tr>
                    <td style="width: 45%;">
                        <span class="field-label">2.4 CPF:</span> ${data.professor.cpf}
                    </td>
                    <td style="width: 30%;">
                        <span class="field-label">2.5 SIAPE:</span> ${data.professor.siape}
                    </td>
                    <td style="width: 25%;">
                        <span class="field-label">2.6 Regime:</span>
                        20h <span class="checkbox">${regimeCheckboxes['20h']}</span> ( )
                        40h <span class="checkbox">${regimeCheckboxes['40h']}</span> ( )
                        DE <span class="checkbox">${regimeCheckboxes.de}</span> ( )
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="form-row">
            <table>
                <tr>
                    <td style="width: 50%;">
                        <span class="field-label">2.7 Tel. Institucional:</span> ${data.professor.telefoneInstitucional || '( )'}
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
            • Auxiliar os alunos quanto ao uso de comandos e comandos de programação em Python e lógica de programação em sala<br>
            • Auxiliar os alunos em horário extra classe
        </div>
    </div>

    <!-- 5. DECLARAÇÃO -->
    <div class="section">
        <div class="section-header">5. DECLARAÇÃO</div>
        <div class="form-row">
            Declaro ter conhecimento da Resolução nº 05/2021 do CAE e das normas descritas no Edital PROGRAD/UFBA Nº 001/2025 –
            Programa de Monitoria 2025.1 <span class="checkbox">X</span> ( )
        </div>
    </div>

    <div class="signature-section">
        <div style="text-align: center; margin-top: 40px;">
            <table style="width: 100%;">
                <tr>
                    <td style="text-align: left;">
                        Data e Assinatura do(a) Prof(a). Responsável: ___/___/2025
                    </td>
                    <td style="text-align: right; width: 200px;">
                        _________________________
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
  `;
}
