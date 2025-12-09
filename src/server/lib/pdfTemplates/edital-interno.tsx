import { SEMESTRE_LABELS, type Semestre, type TipoMonitoria } from "@/types"
import { IC_LOGO_BASE64, UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 30,
    lineHeight: 1.3,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    width: "100%",
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  institutionHeader: {
    fontSize: 9,
    marginBottom: 1,
    textAlign: "center",
  },
  institutionHeaderBold: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 1,
    textAlign: "center",
  },
  editalTitleContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  editalTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 2,
  },
  programTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    textDecoration: "underline",
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    textAlign: "justify",
    textIndent: 20,
  },
  textNoIndent: {
    fontSize: 10,
    marginBottom: 3,
    textAlign: "justify",
  },
  textBold: {
    fontSize: 10,
    fontWeight: "bold",
  },
  list: {
    marginLeft: 15,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: "justify",
  },
  // Table styles
  table: {
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f0f0f0",
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
    padding: 3,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  tableColHeaderLast: {
    padding: 3,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    justifyContent: "center",
  },
  tableCol: {
    padding: 3,
    fontSize: 8,
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  tableColLast: {
    padding: 3,
    fontSize: 8,
    justifyContent: "center",
  },
  tableColCenter: {
    padding: 3,
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  // Column widths
  colComponente: { width: "45%" },
  colVagas: { width: "10%" },
  colProfessor: { width: "35%" },

  signature: {
    marginTop: 30,
    alignItems: "center",
  },
  signatureLine: {
    width: 250,
    borderBottomWidth: 1,
    borderColor: "#000",
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: "bold",
  },
  signatureTitle: {
    fontSize: 9,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: "#000",
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
  const formatSemestre = (semestre: Semestre) => {
    return SEMESTRE_LABELS[semestre]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
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

  const totalBolsistas = data.disciplinas.reduce((sum, d) => sum + d.numBolsistas, 0)
  const totalVoluntarios = data.disciplinas.reduce((sum, d) => sum + d.numVoluntarios, 0)

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

        <View style={styles.editalTitleContainer}>
          <Text style={styles.editalTitle}>
            EDITAL INTERNO Nº {data.numeroEdital}/{data.ano}
          </Text>
          <Text style={styles.programTitle}>
            SELEÇÃO DE MONITORES {formatSemestre(data.semestre)} - {data.ano}
          </Text>
        </View>

        {/* 1. DISPOSIÇÕES PRELIMINARES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. DISPOSIÇÕES PRELIMINARES</Text>
          <Text style={styles.text}>
            O Chefe do Departamento de Ciência da Computação do Instituto de Computação da Universidade Federal da
            Bahia, no uso de suas atribuições, torna público aos interessados que estarão abertas as inscrições para a
            seleção de monitores (Bolsistas e Voluntários) para o Semestre Letivo {formatSemestre(data.semestre)} de{" "}
            {data.ano}, em conformidade com a Resolução nº 04/2019 do CONSEPE e o Edital de Monitoria da PROGRAD/UFBA.
          </Text>
        </View>

        {/* 2. DAS VAGAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. DAS VAGAS</Text>
          <Text style={styles.text}>
            Serão oferecidas vagas para monitoria remunerada (bolsista) e não remunerada (voluntário) nos componentes
            curriculares listados abaixo:
          </Text>

          {/* Tabela de Disciplinas */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colComponente}>
                <Text style={styles.tableColHeader}>Componente Curricular</Text>
              </View>
              <View style={styles.colVagas}>
                <Text style={styles.tableColHeader}>Vagas{"\n"}Bolsa</Text>
              </View>
              <View style={styles.colVagas}>
                <Text style={styles.tableColHeader}>Vagas{"\n"}Vol.</Text>
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
                  <View style={styles.colVagas}>
                    <Text style={styles.tableColCenter}>{disciplina.numBolsistas}</Text>
                  </View>
                  <View style={styles.colVagas}>
                    <Text style={styles.tableColCenter}>{disciplina.numVoluntarios}</Text>
                  </View>
                  <View style={styles.colProfessor}>
                    <Text style={styles.tableColLast}>{disciplina.professor.nome}</Text>
                  </View>
                </View>
              )
            })}
            {/* Total Row */}
            <View style={[styles.tableRowLast, { backgroundColor: "#f0f0f0", borderTopWidth: 1, borderColor: "#000" }]}>
              <View style={styles.colComponente}>
                <Text style={[styles.tableCol, { fontWeight: "bold", textAlign: "right" }]}>TOTAL</Text>
              </View>
              <View style={styles.colVagas}>
                <Text style={[styles.tableColCenter, { fontWeight: "bold" }]}>{totalBolsistas}</Text>
              </View>
              <View style={styles.colVagas}>
                <Text style={[styles.tableColCenter, { fontWeight: "bold" }]}>{totalVoluntarios}</Text>
              </View>
              <View style={styles.colProfessor}>
                <Text style={styles.tableColLast}></Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. DAS INSCRIÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. DAS INSCRIÇÕES</Text>
          <Text style={styles.text}>
            3.1. As inscrições serão realizadas no período de{" "}
            <Text style={styles.textBold}>
              {formatDate(data.periodoInscricao.dataInicio)} a {formatDate(data.periodoInscricao.dataFim)}
            </Text>
            , exclusivamente através do Sistema de Monitoria do IC (
            {data.formularioInscricaoUrl || "https://monitoria.ic.ufba.br"}).
          </Text>
          <Text style={styles.text}>
            3.2. Podem inscrever-se alunos regularmente matriculados nos cursos de graduação da UFBA.
          </Text>
          <Text style={styles.text}>
            3.3. No ato da inscrição, o aluno deverá indicar a(s) disciplina(s) de seu interesse, observando os
            pré-requisitos estabelecidos.
          </Text>
        </View>

        {/* 4. DO PROCESSO SELETIVO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. DO PROCESSO SELETIVO</Text>
          <Text style={styles.text}>
            4.1. A seleção será realizada pelo professor responsável pela disciplina, podendo consistir em análise de
            histórico escolar, entrevista e/ou prova de conhecimento.
          </Text>
          <Text style={styles.text}>
            4.2. Os critérios de seleção e pesos, bem como os conteúdos programáticos (quando houver prova), estão
            descritos no Anexo I deste Edital.
          </Text>
          <Text style={styles.text}>
            4.3. O resultado da seleção será divulgado no Sistema de Monitoria e/ou no site do DCC a partir de{" "}
            {data.dataDivulgacao ? formatDate(data.dataDivulgacao) : "data a definir"}.
          </Text>
        </View>

        {/* 5. DA IMPLEMENTAÇÃO DA MONITORIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. DA IMPLEMENTAÇÃO DA MONITORIA</Text>
          <Text style={styles.text}>
            5.1. O exercício da monitoria terá início e término conforme calendário acadêmico da UFBA.
          </Text>
          <Text style={styles.text}>5.2. O monitor deverá cumprir carga horária de 12 (doze) horas semanais.</Text>
          <Text style={styles.text}>
            5.3. É vedado ao monitor acumular bolsas de monitoria ou de outros programas acadêmicos da UFBA, salvo
            exceções previstas na regulamentação vigente.
          </Text>
        </View>

        {/* 6. DAS EQUIVALÊNCIAS */}
        {data.equivalencias && data.equivalencias.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. DAS EQUIVALÊNCIAS DE DISCIPLINAS</Text>
            <Text style={styles.text}>
              6.1. Para fins de inscrição na monitoria, serão aceitas as seguintes equivalências de disciplinas:
            </Text>
            <View style={styles.list}>
              {data.equivalencias.map((eq, index) => (
                <Text key={index} style={styles.listItem}>
                  • {eq.disciplina1} ↔ {eq.disciplina2}
                </Text>
              ))}
            </View>
            <Text style={styles.text}>
              6.2. O aluno que cursou disciplina equivalente poderá se inscrever para monitoria da disciplina
              correspondente, desde que atenda aos demais requisitos do edital.
            </Text>
          </View>
        )}

        {/* 7. DISPOSIÇÕES FINAIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {data.equivalencias && data.equivalencias.length > 0 ? "7" : "6"}. DISPOSIÇÕES FINAIS
          </Text>
          <Text style={styles.text}>
            {data.equivalencias && data.equivalencias.length > 0 ? "7" : "6"}.1. A inscrição do candidato implicará o
            conhecimento e a tácita aceitação das normas e condições estabelecidas neste Edital, em relação às quais não
            poderá alegar desconhecimento.
          </Text>
          <Text style={styles.text}>
            {data.equivalencias && data.equivalencias.length > 0 ? "7" : "6"}.2. Os casos omissos serão resolvidos pelo
            Chefe do Departamento.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={[styles.textNoIndent, { marginBottom: 20 }]}>
            Salvador, {formatDateExtended(new Date().toISOString())}
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{data.chefeResponsavel?.nome || "Luciano de Oliveira Serpa"}</Text>
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

      {/* Anexo I - Conteúdo Programático e Critérios */}
      {data.disciplinas.some(
        (d) => (d.pontosSelecao && d.pontosSelecao.length > 0) || (d.bibliografia && d.bibliografia.length > 0)
      ) && (
        <Page size="A4" style={styles.page}>
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

          <View style={styles.editalTitleContainer}>
            <Text style={styles.editalTitle}>ANEXO I</Text>
            <Text style={styles.programTitle}>CRITÉRIOS DE SELEÇÃO E CONTEÚDO PROGRAMÁTICO</Text>
          </View>

          {data.disciplinas.map((disciplina, index) => {
            if (
              (!disciplina.pontosSelecao || disciplina.pontosSelecao.length === 0) &&
              (!disciplina.bibliografia || disciplina.bibliografia.length === 0)
            )
              return null

            return (
              <View
                key={index}
                style={{
                  marginBottom: 15,
                  borderBottomWidth: 1,
                  borderColor: "#ccc",
                  borderStyle: "dashed",
                  paddingBottom: 10,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 2 }}>
                  {disciplina.codigo} - {disciplina.nome}
                </Text>
                <Text style={{ fontSize: 10, marginBottom: 4 }}>Professor: {disciplina.professor.nome}</Text>

                {disciplina.dataSelecao && (
                  <Text style={{ fontSize: 10, marginBottom: 2 }}>
                    Data da Seleção: {formatDate(disciplina.dataSelecao)}{" "}
                    {disciplina.horarioSelecao ? `às ${disciplina.horarioSelecao}` : ""}
                    {disciplina.localSelecao ? ` - Local: ${disciplina.localSelecao}` : ""}
                  </Text>
                )}

                {disciplina.pontosSelecao && disciplina.pontosSelecao.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 2 }}>
                      Conteúdo Programático/Pontos:
                    </Text>
                    {disciplina.pontosSelecao.map((ponto, idx) => (
                      <Text key={idx} style={{ fontSize: 10, marginLeft: 10 }}>
                        - {ponto}
                      </Text>
                    ))}
                  </View>
                )}

                {disciplina.bibliografia && disciplina.bibliografia.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 2 }}>Bibliografia:</Text>
                    {disciplina.bibliografia.map((bib, idx) => (
                      <Text key={idx} style={{ fontSize: 10, marginLeft: 10 }}>
                        - {bib}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )
          })}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      )}
    </Document>
  )
}
