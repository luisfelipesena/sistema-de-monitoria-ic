import type { PeriodoInscricaoResponse } from '@/routes/api/periodo-inscricao/-types';
import type { ProjetoResponse } from '@/routes/api/projeto/-types';
import type { User } from 'lucia';
import { env } from '@/utils/env';

export interface EditalPdfData {
  edital: {
    id: number;
    numeroEdital: string;
    titulo: string;
    descricaoHtml?: string | null;
    dataPublicacao?: Date | null;
  };
  periodoInscricao: PeriodoInscricaoResponse;
  projetosComVagas: Array<
    ProjetoResponse & {
      disciplinasNomes?: string;
      vagasBolsistaDisponiveis: number;
      vagasVoluntarioDisponiveis: number;
    }
  >;
  adminUser?: {
    nomeCompleto?: string;
    cargo?: string;
  };
}

const editalStyles = `
  body { 
    font-family: 'Times New Roman', Times, serif; 
    font-size: 12px; 
    line-height: 1.4; 
    margin: 0; 
    padding: 20px; 
    color: #000; 
    background: white;
  }
  @page { 
    margin: 2cm; 
    size: A4; 
  }
  
  .header-container { 
    display: flex; 
    align-items: flex-start; 
    margin-bottom: 20px; 
    border-bottom: 2px solid #000;
    padding-bottom: 15px;
  }
  
  .logo-section { 
    width: 80px; 
    margin-right: 15px; 
    text-align: center;
  }
  
  .logo-placeholder {
    width: 70px;
    height: 70px;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #666;
  }
  
  .university-info { 
    flex: 1; 
    text-align: center; 
    font-weight: bold; 
    font-size: 14px; 
    line-height: 1.2; 
  }
  
  .university-info .main-title {
    font-size: 16px;
    margin-bottom: 5px;
  }
  
  .university-info .sub-title {
    font-size: 13px;
    margin-bottom: 2px;
  }
  
  .university-info .address {
    font-size: 10px;
    font-weight: normal;
    font-style: italic;
    margin-top: 8px;
  }
  
  .logo-right {
    width: 80px;
    margin-left: 15px;
    text-align: center;
  }
  
  .edital-number { 
    font-size: 16px; 
    font-weight: bold; 
    text-align: center; 
    margin: 20px 0; 
  }
  
  .edital-title { 
    font-size: 14px; 
    font-weight: bold; 
    text-align: center; 
    margin: 10px 0 30px 0; 
    text-transform: uppercase;
  }
  
  .intro-text {
    text-align: justify;
    margin-bottom: 20px;
    line-height: 1.5;
  }
  
  .section { 
    margin-bottom: 20px; 
    page-break-inside: avoid; 
  }
  
  .section-title { 
    font-weight: bold; 
    font-size: 12px; 
    margin-bottom: 10px; 
    margin-top: 15px;
  }
  
  .subsection-title {
    font-weight: bold;
    font-size: 12px;
    margin: 10px 0 5px 0;
  }
  
  .paragraph { 
    text-align: justify; 
    margin-bottom: 10px; 
    line-height: 1.5;
  }
  
  .vagas-table { 
    width: 100%; 
    border-collapse: collapse; 
    font-size: 11px; 
    margin: 15px 0;
    border: 2px solid #000;
  }
  
  .vagas-table th { 
    border: 1px solid #000; 
    padding: 8px; 
    text-align: center; 
    background-color: #90EE90;
    font-weight: bold;
    font-size: 11px;
  }
  
  .vagas-table td { 
    border: 1px solid #000; 
    padding: 6px; 
    text-align: left;
    vertical-align: top;
  }
  
  .vagas-table td.center { 
    text-align: center; 
  }
  
  .cronograma-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin: 15px 0;
    border: 2px solid #000;
  }
  
  .cronograma-table th {
    border: 1px solid #000;
    padding: 8px;
    text-align: center;
    background-color: #90EE90;
    font-weight: bold;
  }
  
  .cronograma-table td {
    border: 1px solid #000;
    padding: 6px;
    text-align: center;
  }
  
  .assinatura-section { 
    margin-top: 60px; 
    text-align: center; 
    page-break-inside: avoid; 
  }
  
  .assinatura-line { 
    border-bottom: 1px solid #000; 
    width: 350px; 
    margin: 40px auto 5px auto; 
    display: block; 
  }
  
  .assinatura-name {
    font-weight: bold;
    margin-top: 5px;
  }
  
  .assinatura-title {
    font-size: 11px;
    margin-top: 2px;
  }
  
  .text-center { text-align: center; }
  .text-bold { font-weight: bold; }
  .text-italic { font-style: italic; }
`;

export function generateEditalInternoHTML(data: EditalPdfData): string {
  const { edital, periodoInscricao, projetosComVagas, adminUser } = data;

  // Formatação de datas
  const dataPublicacao = edital.dataPublicacao 
    ? new Date(edital.dataPublicacao).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
    
  const dataInicio = new Date(periodoInscricao.dataInicio).toLocaleDateString('pt-BR');
  const dataFim = new Date(periodoInscricao.dataFim).toLocaleDateString('pt-BR');

  // Criar tabela de vagas por disciplina
  let vagasTableRows = '';
  projetosComVagas.forEach(projeto => {
    const disciplinas = projeto.disciplinasNomes || projeto.titulo;
    const professorNome = projeto.professorResponsavel?.nomeCompleto || 'N/A';
    
    vagasTableRows += `
      <tr>
        <td>${disciplinas}</td>
        <td class="center">${projeto.vagasBolsistaDisponiveis}</td>
        <td class="center">${projeto.vagasVoluntarioDisponiveis}</td>
        <td>${professorNome}</td>
      </tr>
    `;
  });

  // Cronograma de provas baseado nos dados reais do edital
  let cronogramaRows = '';
  projetosComVagas.forEach((projeto, index) => {
    const disciplinas = projeto.disciplinasNomes || projeto.titulo;
    const professorNome = projeto.professorResponsavel?.nomeCompleto || 'N/A';
    
    // Definir datas baseadas no período de inscrições (simulação de cronograma)
    const dataProva = new Date(periodoInscricao.dataFim);
    dataProva.setDate(dataProva.getDate() + 1 + Math.floor(index / 3)); // Distribuir ao longo de alguns dias
    const horaProva = index % 2 === 0 ? '09:00' : '14:00';
    
    cronogramaRows += `
      <tr>
        <td>${disciplinas}</td>
        <td>${dataProva.toLocaleDateString('pt-BR')}</td>
        <td>${horaProva}</td>
        <td>${professorNome}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Edital ${edital.numeroEdital} - ${edital.titulo}</title>
        <style>${editalStyles}</style>
    </head>
    <body>
        <div class="header-container">
            <div class="logo-section">
                <div class="logo-placeholder">LOGO UFBA</div>
            </div>
            <div class="university-info">
                <div class="main-title">MINISTÉRIO DA EDUCAÇÃO</div>
                <div class="main-title">UNIVERSIDADE FEDERAL DA BAHIA</div>
                <div class="sub-title">INSTITUTO DE COMPUTAÇÃO</div>
                <div class="sub-title">DEPARTAMENTO DE CIÊNCIA DA COMPUTAÇÃO</div>
                <div class="address">
                    Av. Milton Santos s/n – Campus Universitário de Ondina, Ondina – Salvador-Bahia<br>
                    CEP 40170-110 e-mail: csc-ic@ufba.br
                </div>
            </div>
            <div class="logo-right">
                <div class="logo-placeholder">LOGO IC</div>
            </div>
        </div>

        <div class="edital-number">
            EDITAL INTERNO Nº ${edital.numeroEdital}
        </div>

        <div class="edital-title">
            SELEÇÃO PARA MONITORIA COM BOLSA E VOLUNTÁRIA EM PROJETOS ACADÊMICOS
        </div>

        <div class="intro-text">
            A Chefia do Departamento de Ciência da Computação do Instituto de Computação da Universidade Federal da Bahia, no uso de suas atribuições legais, tendo em vista o disposto na Resolução no 06/2012 e nº 07/2017 do Conselho Acadêmico de Ensino da UFBA, que regulamentam as atividades de monitoria no âmbito dos cursos de graduação, torna público que estarão abertas as inscrições para a seleção de monitor com bolsa e monitor voluntário em projetos acadêmicos do departamento de Ciência da Computação, de acordo com a legislação pertinente, mediante as normas e condições contidas neste Edital Interno, publicado no Instituto de Computação.
        </div>

        <div class="section">
            <div class="section-title">1. Das disposições Preliminares</div>
            <div class="subsection-title">1.1.</div>
            <div class="paragraph">
                Cada um dos projetos listados abaixo, com o respectivo docente responsável, dispõe de vaga(s) de monitoria, com carga horária semanal de 12 horas, e um conjunto de vagas para bolsistas e vagas para voluntários:
            </div>

            <table class="vagas-table">
                <thead>
                    <tr>
                        <th>Componente Curricular</th>
                        <th>Vagas BOLSISTAS</th>
                        <th>Vagas VOLUNTÁRIOS</th>
                        <th>Professor Responsável</th>
                    </tr>
                </thead>
                <tbody>
                    ${vagasTableRows}
                </tbody>
            </table>

            <div class="subsection-title">1.2.</div>
            <div class="paragraph">
                O processo seletivo será conduzido sob responsabilidade do professor responsável pelo respectivo componente curricular. A distribuição das bolsas observará a ordem de classificação dos candidatos.
            </div>
        </div>

        <div class="section">
            <div class="section-title">2. Das Inscrições</div>
            <div class="subsection-title">2.1.</div>
            <div class="paragraph">
                As inscrições estarão abertas no período de <strong>${dataInicio} a ${dataFim}</strong>.
            </div>

            <div class="subsection-title">2.2.</div>
            <div class="paragraph">
                Para inscrever-se, o(a) candidato(a) à monitoria com bolsa deverá preencher o Formulário de inscrição de monitor bolsista e Termo de compromisso do monitor bolsista (Anexo III do EDITAL PROGRAD/UFBA Nº. 01/2024) e o candidato à monitoria voluntária deverá preencher o Formulário de inscrição de monitor voluntário e Termo de compromisso do monitor voluntário (Anexo IV do EDITAL PROGRAD/UFBA Nº. 01/2024).
            </div>

            <div class="subsection-title">2.3.</div>
            <div class="paragraph">
                Digitalizar os seguintes documentos: Carteira de Identidade e CPF do estudante e Histórico Escolar da UFBA (com autenticação digital).
            </div>

            <div class="subsection-title">2.4.</div>
            <div class="paragraph">
                Preencher o <strong>FORMULÁRIO DE INSCRIÇÃO</strong> com os dados do candidato e com os documentos elencados nos itens 2.2 e 2.3. Caso o candidato queira concorrer a mais de uma vaga, pode submeter o formulário mais de uma vez, tanto para bolsista quanto para voluntário.
            </div>

            <div class="subsection-title">2.5.</div>
            <div class="paragraph">
                A qualquer tempo poderão ser anuladas a inscrição e as provas, desde que verificada a falsidade em qualquer declaração prestada e/ou qualquer irregularidade no processo de seleção.
            </div>
        </div>

        <div class="section">
            <div class="section-title">3. Requisitos para inscrição</div>
            <div class="paragraph">
                O candidato deverá estar regularmente matriculado em curso de graduação da UFBA há pelo menos 02 (dois) semestres.
            </div>

            <div class="subsection-title">3.2</div>
            <div class="paragraph">
                O candidato deverá ter cursado, com aprovação, o componente curricular, ou disciplinas equivalentes, que estejam vinculadas ao projeto no qual fará a seleção.
            </div>

            <div class="subsection-title">3.2.1</div>
            <div class="paragraph">
                Para candidatura à monitoria no componente MAT045 - Processamento de Dados, será considerada, a título de equivalência, à disciplina MATA37 - Introdução à Lógica de Programação.
            </div>
        </div>

        <div class="section">
            <div class="section-title">4. Descrição das atividades</div>
            <div class="subsection-title">4.1.</div>
            <div class="paragraph">
                Objetivando contribuir para a melhoria da qualidade do processo ensino-aprendizagem-avaliação, bem como intensificar a cooperação entre estudantes e professores nas atividades de ensino da Universidade, os projetos de monitoria, que envolvem alunos de graduação na execução de atividades curriculares, prevê as seguintes atividades:
            </div>

            <div style="margin-left: 20px;">
                <div class="subsection-title">4.1.1.</div>
                <div class="paragraph">Participar da elaboração do plano de trabalho da monitoria com os professores responsáveis;</div>

                <div class="subsection-title">4.1.2.</div>
                <div class="paragraph">Interagir com professores e alunos, visando ao desenvolvimento da aprendizagem;</div>

                <div class="subsection-title">4.1.3.</div>
                <div class="paragraph">Auxiliar o professor na realização dos trabalhos práticos e experimentais, na preparação de material didático, na organização do ambiente virtual de aprendizagem, e em atividades em classe.</div>
            </div>

            <div class="subsection-title">4.2.</div>
            <div class="paragraph">Além disso, são obrigações do monitor:</div>

            <div style="margin-left: 20px;">
                <div class="subsection-title">4.2.1.</div>
                <div class="paragraph">Exercer suas tarefas conforme plano de trabalho elaborado juntamente com o(s) professor(es) orientador(es);</div>

                <div class="subsection-title">4.2.2.</div>
                <div class="paragraph">Cumprir 12 (doze) horas semanais de monitoria, distribuídas de acordo com o planejamento estabelecido com os professores orientadores, sendo no mínimo 3 (três) horas semanais de atendimento remoto aos alunos da disciplina. Observa-se que tal planejamento deverá respeitar a vida acadêmica do monitor, de forma a não prejudicar o horário das atividades acadêmicas do discente, respeitando os horários das componentes curriculares que esteja matriculado;</div>

                <div class="subsection-title">4.2.3.</div>
                <div class="paragraph">Ao final do semestre, apresentar ao professor orientador relatório global de suas atividades, contendo descrição das atividades realizadas, em consonância com o planejamento da monitoria, breve avaliação do seu desempenho, da orientação recebida e das condições em que desenvolveu suas atividades.</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">5. Descrição dos benefícios</div>
            <div class="subsection-title">5.1.</div>
            <div class="paragraph">
                O voluntário que obtiver nota igual ou superior a 7 (sete) e tiver cumprido, ao menos, setenta e cinco por cento do período previsto receberá Certificado de Monitoria, a ser expedido pela Pró-Reitoria de Ensino de Graduação, mediante solicitação do monitor;
            </div>
        </div>

        <div class="section">
            <div class="section-title">6. Do processo seletivo</div>
            <div class="subsection-title">6.1.</div>
            <div class="paragraph">O processo seletivo constará de:</div>

            <div style="margin-left: 20px;">
                <div class="subsection-title">6.1.1.</div>
                <div class="paragraph">Prova escrita ou oral, com questões objetivas e/ou discursivas sobre pontos indicados neste edital, valendo 10 (dez) pontos, sendo reprovados aqueles que obtiverem nota inferior a 7 (sete);</div>

                <div class="subsection-title">6.1.2.</div>
                <div class="paragraph">Nota obtida na disciplina associada ao projeto de monitoria, ou disciplina equivalente;</div>

                <div class="subsection-title">6.1.3.</div>
                <div class="paragraph">Coeficiente de rendimento do candidato.</div>
            </div>

            <div class="subsection-title">6.2.</div>
            <div class="paragraph">A nota final do estudante no processo seletivo será determinada pela média ponderada dos três valores seguintes:</div>

            <div style="margin-left: 20px;">
                <div class="paragraph">I – nota obtida em prova escrita ou oral, com peso 5 (cinco);</div>
                <div class="paragraph">II – nota obtida na disciplina associada ao projeto de monitoria, ou equivalente, com peso 3 (três);</div>
                <div class="paragraph">III – coeficiente de rendimento, com peso 2 (dois);</div>

                <div class="subsection-title">6.2.1.</div>
                <div class="paragraph">Serão classificados apenas os estudantes que obtiverem nota final igual ou maior que 7,0 (sete).</div>

                <div class="subsection-title">6.2.2.</div>
                <div class="paragraph">A nota final correspondente à média ponderada será expressa sob a forma de números inteiros ou fracionários, até uma casa decimal, numa escala de 0 (zero) a 10 (dez).</div>

                <div class="subsection-title">6.2.3.</div>
                <div class="paragraph">As provas serão realizadas presencialmente ou remotamente, em sala a ser informada, seguindo o escalonamento a seguir, e tendo duração de 2 (duas) horas:</div>
            </div>

            <table class="cronograma-table">
                <thead>
                    <tr>
                        <th>Componente Curricular</th>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Professor Responsável</th>
                    </tr>
                </thead>
                <tbody>
                    ${cronogramaRows}
                </tbody>
            </table>

            <div class="subsection-title">6.2.4.</div>
            <div class="paragraph">
                O link ou local para a realização da prova será enviado para o email do candidato informado na hora da inscrição em até 01 hora antes do início da prova.
            </div>

            <div class="subsection-title">6.4</div>
            <div class="paragraph">
                Não será admitida a comunicação direta ou indireta entre os candidatos durante o processo seletivo;
            </div>

            <div class="subsection-title">6.5</div>
            <div class="paragraph">Os critérios de desempate serão os seguintes, em ordem decrescente:</div>
            <div style="margin-left: 20px;">
                <div class="paragraph">■ Nota na disciplina associada ao projeto de monitoria, ou em disciplina equivalente;</div>
                <div class="paragraph">■ Coeficiente de rendimento;</div>
                <div class="paragraph">■ Avaliação de currículo;</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">7. Divulgação do resultado</div>
            <div class="paragraph">
                O resultado será divulgado até o dia <strong>15 de março de 2024</strong>, no site do Instituto de Computação.
            </div>
        </div>

        <div class="assinatura-section">
            <p>Salvador, ${dataPublicacao}.</p>
            <div class="assinatura-line"></div>
            <div class="assinatura-name">Cássio Vinícius Serafim Prazeres</div>
            <div class="assinatura-title">Chefe do Departamento de Ciência da Computação</div>
        </div>
    </body>
    </html>
  `;
} 