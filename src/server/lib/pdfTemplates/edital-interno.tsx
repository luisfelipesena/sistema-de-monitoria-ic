import { type Semestre, type TipoMonitoria } from "@/types"
import { IC_LOGO_BASE64, UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 50,
    paddingRight: 50,
    paddingBottom: 40,
    lineHeight: 1.4,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    width: "100%",
  },
  logo: {
    width: 45,
    height: 45,
    objectFit: "contain",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 15,
  },
  institutionHeader: {
    fontSize: 9,
    marginBottom: 1,
    textAlign: "center",
  },
  institutionHeaderBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
    textAlign: "center",
  },
  addressLine: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 15,
  },
  editalTitleContainer: {
    alignItems: "center",
    marginTop: 5,
    marginBottom: 15,
  },
  editalTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginBottom: 5,
  },
  programTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
    textAlign: "justify",
    textIndent: 30,
  },
  textNoIndent: {
    fontSize: 10,
    marginBottom: 5,
    textAlign: "justify",
  },
  textBold: {
    fontFamily: "Helvetica-Bold",
  },
  list: {
    marginLeft: 20,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 3,
    textAlign: "justify",
  },
  subListItem: {
    fontSize: 10,
    marginBottom: 2,
    marginLeft: 20,
    textAlign: "justify",
  },
  // Table styles
  table: {
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableColHeader: {
    padding: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  tableColHeaderLast: {
    padding: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    justifyContent: "center",
  },
  tableCol: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  tableColLast: {
    padding: 4,
    fontSize: 8,
    justifyContent: "center",
  },
  tableColCenter: {
    padding: 4,
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  // Column widths - main table
  colComponente: { width: "40%" },
  colVagasBolsa: { width: "12%" },
  colVagasVol: { width: "12%" },
  colProfessor: { width: "36%" },
  // Column widths - exam schedule table
  colExamComponente: { width: "40%" },
  colExamData: { width: "12%" },
  colExamHora: { width: "10%" },
  colExamProfessor: { width: "38%" },

  signature: {
    marginTop: 30,
    alignItems: "center",
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
  },
  signatureTitle: {
    fontSize: 9,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 50,
    fontSize: 8,
    color: "#666",
  },
  bibliografiaSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 20,
  },
  bibliografiaTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  bibliografiaItem: {
    fontSize: 9,
    marginBottom: 2,
    marginLeft: 10,
    textAlign: "justify",
  },
  pontosText: {
    fontSize: 9,
    marginBottom: 2,
    marginLeft: 10,
  },
})

export interface EditalInternoData {
  numeroEdital: string
  ano: number
  semestre: Semestre
  titulo: string
  descricao?: string
  periodoInscricao: {
    dataInicio: string
    dataFim: string
  }
  formularioInscricaoUrl?: string
  dataDivulgacao?: string
  chefeResponsavel?: {
    nome: string
    cargo: string
  }
  disciplinas: Array<{
    codigo: string
    nome: string
    turma?: string
    professor: {
      nome: string
      email?: string
    }
    tipoMonitoria: TipoMonitoria
    numTurmas?: number
    numBolsistas: number
    numVoluntarios: number
    pontosSelecao?: string[]
    bibliografia?: string[]
    dataSelecao?: string
    horarioSelecao?: string
    localSelecao?: string
  }>
  observacoes?: string
  equivalencias?: Array<{
    disciplina1: string
    disciplina2: string
  }>
}

export function EditalInternoTemplate({ data }: { data: EditalInternoData }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
  }

  const formatDateExtended = (dateString: string) => {
    const date = new Date(dateString)
    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ]
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`
  }

  const hasPontosOuBibliografia = data.disciplinas.some(
    (d) => (d.pontosSelecao && d.pontosSelecao.length > 0) || (d.bibliografia && d.bibliografia.length > 0)
  )

  const hasExamSchedule = data.disciplinas.some((d) => d.dataSelecao)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image src={UFBA_LOGO__FORM_BASE64} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.institutionHeader}>MINISTÉRIO DA EDUCAÇÃO</Text>
            <Text style={styles.institutionHeaderBold}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text style={styles.institutionHeader}>INSTITUTO DE COMPUTAÇÃO</Text>
            <Text style={styles.institutionHeaderBold}>DEPARTAMENTO DE CIÊNCIA DA COMPUTAÇÃO</Text>
          </View>
          <Image src={IC_LOGO_BASE64} style={styles.logo} />
        </View>

        {/* Address line */}
        <Text style={styles.addressLine}>
          Av. Milton Santos s/n – Campus Universitário de Ondina, Ondina – Salvador-Bahia{"\n"}
          CEP 40170-110 e-mail: ceag-ic@ufba.br
        </Text>

        {/* Title */}
        <View style={styles.editalTitleContainer}>
          <Text style={styles.editalTitle}>EDITAL INTERNO Nº {data.numeroEdital}</Text>
          <Text style={styles.programTitle}>
            SELEÇÃO PARA MONITORIA COM BOLSA E VOLUNTÁRIA EM PROJETOS ACADÊMICOS
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.text}>
            A Chefia do Departamento de Ciência da Computação do Instituto de Computação da Universidade Federal da
            Bahia, no uso de suas atribuições legais, tendo em vista o disposto na Resolução nº 06/2012 e nº 07/2017 do
            Conselho Acadêmico de Ensino da UFBA, que regulamentam as atividades de monitoria no âmbito dos cursos de
            graduação, torna público que estarão abertas as inscrições para a seleção de monitor com bolsa e monitor
            voluntário em projetos acadêmicos do departamento de Ciência da Computação, de acordo com a legislação
            pertinente, mediante as normas e condições contidas neste Edital Interno, publicado no Instituto de
            Computação.
          </Text>
        </View>

        {/* 1. Das disposições Preliminares */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Das disposições Preliminares</Text>
          <Text style={styles.text}>
            1.1. Cada um dos projetos listados abaixo, com o respectivo docente responsável, dispõe de vaga(s) de
            monitoria, com carga horária semanal de 12 horas, e um conjunto de vagas para bolsistas e vagas para
            voluntários:
          </Text>

          {/* Table of disciplines */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colComponente}>
                <Text style={styles.tableColHeader}>Componente Curricular</Text>
              </View>
              <View style={styles.colVagasBolsa}>
                <Text style={styles.tableColHeader}>Vagas{"\n"}BOLSISTAS</Text>
              </View>
              <View style={styles.colVagasVol}>
                <Text style={styles.tableColHeader}>Vagas{"\n"}VOLUNTÁRIOS</Text>
              </View>
              <View style={styles.colProfessor}>
                <Text style={styles.tableColHeaderLast}>Professor Responsável</Text>
              </View>
            </View>

            {data.disciplinas.map((disciplina, index) => {
              const isLast = index === data.disciplinas.length - 1
              const rowStyle = isLast ? styles.tableRowLast : styles.tableRow
              return (
                <View key={index} style={rowStyle}>
                  <View style={styles.colComponente}>
                    <Text style={styles.tableCol}>
                      {disciplina.codigo} - {disciplina.nome}
                    </Text>
                  </View>
                  <View style={styles.colVagasBolsa}>
                    <Text style={styles.tableColCenter}>{disciplina.numBolsistas || ""}</Text>
                  </View>
                  <View style={styles.colVagasVol}>
                    <Text style={styles.tableColCenter}>{disciplina.numVoluntarios || ""}</Text>
                  </View>
                  <View style={styles.colProfessor}>
                    <Text style={styles.tableColLast}>{disciplina.professor.nome}</Text>
                  </View>
                </View>
              )
            })}
          </View>

          <Text style={styles.text}>
            1.2. O processo seletivo será conduzido sob responsabilidade do professor responsável pelo respectivo
            componente curricular. A distribuição das bolsas observará a ordem de classificação dos candidatos.
          </Text>
        </View>

        {/* 2. Das Inscrições */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Das Inscrições</Text>
          <Text style={styles.text}>
            2.1. As inscrições estarão abertas no período de{" "}
            <Text style={styles.textBold}>
              {formatDate(data.periodoInscricao.dataInicio)} a {formatDate(data.periodoInscricao.dataFim)}
            </Text>
            .
          </Text>
          <Text style={styles.text}>
            2.2. Para inscrever-se, o(a) candidato(a) à monitoria com bolsa ou voluntária deverá digitalizar os
            seguintes documentos: Carteira de Identidade e CPF do estudante e Histórico Escolar da UFBA (com
            autenticação digital).
          </Text>
          <Text style={styles.text}>
            2.3. Preencher o{" "}
            <Text style={styles.textBold}>
              FORMULÁRIO DE INSCRIÇÃO{" "}
              {data.formularioInscricaoUrl ? `(${data.formularioInscricaoUrl})` : "(disponível no sistema de monitoria)"}
            </Text>{" "}
            com os dados do candidato e com os documentos elencados no item 2.2. Caso o candidato queira concorrer a
            mais de uma vaga, pode submeter o formulário mais de uma vez, tanto para bolsista quanto para voluntário.
          </Text>
          <Text style={styles.text}>
            2.4. A qualquer tempo poderão ser anuladas a inscrição e as provas, desde que verificada a falsidade em
            qualquer declaração prestada e/ou qualquer irregularidade no processo de seleção.
          </Text>
        </View>

        {/* 3. Requisitos para inscrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Requisitos para inscrição</Text>
          <Text style={styles.text}>
            3.1 O candidato deverá estar matriculado em curso de graduação da UFBA há pelo menos 02 (dois) semestres;
          </Text>
          <Text style={styles.text}>
            3.2 O candidato deverá ter cursado, com aprovação, o componente curricular, ou disciplinas equivalentes, que
            estejam vinculadas ao projeto no qual fará a seleção.
          </Text>
          {data.equivalencias && data.equivalencias.length > 0 && (
            <View style={styles.list}>
              {data.equivalencias.map((eq, index) => (
                <Text key={index} style={styles.subListItem}>
                  3.2.{index + 1} Para candidatura à monitoria no componente {eq.disciplina1}, será considerada, a
                  título de equivalência, a disciplina {eq.disciplina2}.
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* 4. Descrição das atividades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Descrição das atividades</Text>
          <Text style={styles.text}>
            4.1. Objetivando contribuir para a melhoria da qualidade do processo ensino-aprendizagem-avaliação, bem como
            intensificar a cooperação entre estudantes e professores nas atividades de ensino da Universidade, os
            projetos de monitoria, que envolvem alunos de graduação na execução de atividades curriculares, prevê as
            seguintes atividades:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              4.1.1. Participar da elaboração do plano de trabalho da monitoria com os professores responsáveis;
            </Text>
            <Text style={styles.listItem}>
              4.1.2. Interagir com professores e alunos, visando ao desenvolvimento da aprendizagem;
            </Text>
            <Text style={styles.listItem}>
              4.1.3. Auxiliar o professor na realização dos trabalhos práticos e experimentais, na preparação de
              material didático, na organização do ambiente virtual de aprendizagem, e em atividades em classe.
            </Text>
          </View>
          <Text style={styles.text}>4.2. Além disso, são obrigações do monitor:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              4.2.1. Exercer suas tarefas conforme plano de trabalho elaborado juntamente com o(s) professor(es)
              orientador(es);
            </Text>
            <Text style={styles.listItem}>
              4.2.2. Cumprir 12 (doze) horas semanais de monitoria, distribuídas de acordo com o planejamento
              estabelecido com os professores orientadores, sendo no mínimo 3 (três) horas semanais de atendimento
              remoto aos alunos da disciplina. Observa-se que tal planejamento deverá respeitar a vida acadêmica do
              monitor, de forma a não prejudicar o horário das atividades acadêmicas do discente, respeitando os
              horários das componentes curriculares que esteja matriculado;
            </Text>
            <Text style={styles.listItem}>
              4.2.3. Ao final do semestre, apresentar ao professor orientador relatório global de suas atividades,
              contendo descrição das atividades realizadas, em consonância com o planejamento da monitoria, breve
              avaliação do seu desempenho, da orientação recebida e das condições em que desenvolveu suas atividades.
            </Text>
          </View>
        </View>

        {/* 5. Descrição dos benefícios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Descrição dos benefícios</Text>
          <Text style={styles.text}>
            5.1. O voluntário que obtiver nota igual ou superior a 7 (sete) e tiver cumprido, ao menos, setenta e cinco
            por cento do período previsto receberá Certificado de Monitoria, a ser expedido pela Pró-Reitoria de Ensino
            de Graduação, mediante solicitação do monitor;
          </Text>
        </View>

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Second page - Process selection */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image src={UFBA_LOGO__FORM_BASE64} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.institutionHeader}>MINISTÉRIO DA EDUCAÇÃO</Text>
            <Text style={styles.institutionHeaderBold}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text style={styles.institutionHeader}>INSTITUTO DE COMPUTAÇÃO</Text>
            <Text style={styles.institutionHeaderBold}>DEPARTAMENTO DE CIÊNCIA DA COMPUTAÇÃO</Text>
          </View>
          <Image src={IC_LOGO_BASE64} style={styles.logo} />
        </View>

        {/* 6. Do processo seletivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Do processo seletivo</Text>
          <Text style={styles.text}>6.1. O processo seletivo constará de:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              6.1.1. Prova escrita ou oral, com questões objetivas e/ou discursivas sobre pontos indicados neste edital,
              valendo 10 (dez) pontos, sendo reprovados aqueles que obtiverem nota inferior a 7 (sete);
            </Text>
            <Text style={styles.listItem}>
              6.1.2. Nota obtida na disciplina associada ao projeto de monitoria, ou disciplina equivalente;
            </Text>
            <Text style={styles.listItem}>6.1.3. Coeficiente de rendimento do candidato.</Text>
          </View>
          <Text style={styles.text}>
            6.2. A nota final do estudante no processo seletivo será determinada pela média ponderada dos três valores
            seguintes:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>I – nota obtida em prova escrita ou oral, com peso 5 (cinco);</Text>
            <Text style={styles.listItem}>
              II – nota obtida na disciplina associada ao projeto de monitoria, ou equivalente, com peso 3 (três);
            </Text>
            <Text style={styles.listItem}>III – coeficiente de rendimento, com peso 2 (dois);</Text>
          </View>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              6.2.1. Serão classificados apenas os estudantes que obtiverem nota final igual ou maior que 7,0 (sete).
            </Text>
            <Text style={styles.listItem}>
              6.2.2. A nota final correspondente à média ponderada será expressa sob a forma de números inteiros ou
              fracionários, até uma casa decimal, numa escala de 0 (zero) a 10 (dez).
            </Text>
            {hasExamSchedule && (
              <Text style={styles.listItem}>
                6.2.3. As provas serão realizadas presencialmente ou remotamente, em sala a ser informada, seguindo o
                escalonamento a seguir, e tendo duração de 2 (duas) horas:
              </Text>
            )}
          </View>

          {/* Exam schedule table */}
          {hasExamSchedule && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.colExamComponente}>
                  <Text style={styles.tableColHeader}>Componente Curricular</Text>
                </View>
                <View style={styles.colExamData}>
                  <Text style={styles.tableColHeader}>Data</Text>
                </View>
                <View style={styles.colExamHora}>
                  <Text style={styles.tableColHeader}>Hora</Text>
                </View>
                <View style={styles.colExamProfessor}>
                  <Text style={styles.tableColHeaderLast}>Professor Responsável</Text>
                </View>
              </View>

              {data.disciplinas
                .filter((d) => d.dataSelecao)
                .map((disciplina, index, arr) => {
                  const isLast = index === arr.length - 1
                  const rowStyle = isLast ? styles.tableRowLast : styles.tableRow
                  return (
                    <View key={index} style={rowStyle}>
                      <View style={styles.colExamComponente}>
                        <Text style={styles.tableCol}>
                          {disciplina.codigo} - {disciplina.nome}
                        </Text>
                      </View>
                      <View style={styles.colExamData}>
                        <Text style={styles.tableColCenter}>
                          {disciplina.dataSelecao ? formatDateShort(disciplina.dataSelecao) : ""}
                        </Text>
                      </View>
                      <View style={styles.colExamHora}>
                        <Text style={styles.tableColCenter}>{disciplina.horarioSelecao || ""}</Text>
                      </View>
                      <View style={styles.colExamProfessor}>
                        <Text style={styles.tableColLast}>{disciplina.professor.nome}</Text>
                      </View>
                    </View>
                  )
                })}
            </View>
          )}

          {hasExamSchedule && (
            <View style={styles.list}>
              <Text style={styles.listItem}>
                6.2.4. O link ou local para a realização da prova será enviado para o email do candidato informado na
                hora da inscrição em até 01 hora antes do início da prova.
              </Text>
            </View>
          )}

          {/* 6.3 Pontos e bibliografias */}
          {hasPontosOuBibliografia && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.text}>
                6.3 Para as provas escritas e/ou orais estão indicados os seguintes pontos e bibliografias:
              </Text>

              {data.disciplinas.map((disciplina, index) => {
                if (
                  (!disciplina.pontosSelecao || disciplina.pontosSelecao.length === 0) &&
                  (!disciplina.bibliografia || disciplina.bibliografia.length === 0)
                )
                  return null

                return (
                  <View key={index} style={styles.bibliografiaSection}>
                    <Text style={styles.bibliografiaTitle}>
                      ■ {disciplina.codigo} – {disciplina.nome}
                    </Text>
                    {disciplina.pontosSelecao && disciplina.pontosSelecao.length > 0 && (
                      <View>
                        <Text style={styles.pontosText}>
                          Pontos: {disciplina.pontosSelecao.join("; ")}
                          {disciplina.pontosSelecao[disciplina.pontosSelecao.length - 1]?.endsWith(".") ? "" : "."}
                        </Text>
                      </View>
                    )}
                    {disciplina.bibliografia && disciplina.bibliografia.length > 0 && (
                      <View>
                        <Text style={styles.pontosText}>Bibliografia:</Text>
                        {disciplina.bibliografia.map((bib, idx) => (
                          <Text key={idx} style={styles.bibliografiaItem}>
                            {bib}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          <Text style={styles.text}>
            6.4 Não será admitida a comunicação direta ou indireta entre os candidatos durante o processo seletivo;
          </Text>
          <Text style={styles.text}>6.5 Os critérios de desempate serão os seguintes, em ordem decrescente:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              ■ Nota na disciplina associada ao projeto de monitoria, ou em disciplina equivalente;
            </Text>
            <Text style={styles.listItem}>■ Coeficiente de rendimento;</Text>
            <Text style={styles.listItem}>■ Avaliação de currículo;</Text>
          </View>
        </View>

        {/* 7. Divulgação do resultado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Divulgação do resultado</Text>
          <Text style={styles.text}>
            O resultado será divulgado até o dia{" "}
            <Text style={styles.textBold}>
              {data.dataDivulgacao ? formatDate(data.dataDivulgacao) : "a definir"}
            </Text>
            , no site do Instituto de Computação.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={styles.textNoIndent}>Salvador, {formatDateExtended(data.periodoInscricao.dataInicio)}.</Text>
          <Text style={styles.signatureName}>{data.chefeResponsavel?.nome || "Chefe do Departamento"}</Text>
          <Text style={styles.signatureTitle}>
            {data.chefeResponsavel?.cargo || "Chefe do Departamento de Ciência da Computação"}
          </Text>
        </View>

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
