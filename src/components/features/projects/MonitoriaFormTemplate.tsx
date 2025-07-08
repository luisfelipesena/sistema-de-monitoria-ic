import { MonitoriaFormData } from "@/types"
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import React from "react"

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    break: false,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    wrap: false,
    break: false,
  },
  logo: {
    width: 60,
    height: 80,
    marginRight: 15,
  },
  headerText: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  universityName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 2,
  },
  departmentName: {
    fontSize: 9,
    marginBottom: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    paddingHorizontal: 10,
    wrap: false,
  },
  section: {
    marginBottom: 8,
    border: "1pt solid #000",
    break: false,
  },
  sectionHeader: {
    backgroundColor: "#E0E0E0",
    fontWeight: "bold",
    fontSize: 9,
    padding: 3,
    borderBottom: "1pt solid #000",
    textAlign: "center",
  },
  row: {
    borderBottom: "1pt solid #000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    break: false,
  },
  lastRow: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    break: false,
  },
  label: {
    fontWeight: "bold",
    fontSize: 8,
  },
  value: {
    fontSize: 8,
    marginLeft: 3,
    flex: 1,
  },
  descriptionSection: {
    padding: 4,
    minHeight: 60,
    break: false,
  },
  descriptionText: {
    fontSize: 8,
    lineHeight: 1.3,
    textAlign: "justify",
  },
  professionalDataRow: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    flexDirection: "row",
    fontSize: 8,
    break: false,
  },
  declarationSection: {
    padding: 4,
    minHeight: 40,
    break: false,
  },
  declarationText: {
    fontSize: 8,
    lineHeight: 1.2,
    marginBottom: 10,
  },
  signatureArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    break: false,
  },
  signatureText: {
    fontSize: 8,
    flex: 1,
  },
  signatureLine: {
    borderBottom: "1pt solid #000",
    width: 200,
    height: 20,
    marginLeft: 10,
  },
  signatureImage: {
    width: 200,
    height: 60,
    objectFit: "contain",
    marginLeft: 10,
  },
  activeSignatureArea: {
    borderColor: "#0066cc",
    borderWidth: "2pt",
    backgroundColor: "#f0f8ff",
  },
  tableRow: {
    borderBottom: "1pt solid #000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    break: false,
  },
  tableCell: {
    fontSize: 8,
    marginLeft: 3,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    paddingHorizontal: 10,
    wrap: false,
  },
})

const MonitoriaFormTemplateComponent = ({ data }: { data: MonitoriaFormData }) => {
  // Memo para evitar recálculos desnecessários
  const semestreLabel = React.useMemo(() => 
    `${data.ano}.${data.semestre === "SEMESTRE_1" ? "1" : "2"}`, 
    [data.ano, data.semestre]
  )
  
  const disciplinasText = React.useMemo(() => 
    data.disciplinas?.map((d) => `${d.codigo} - ${d.nome}`).join(", ") || "Não informado",
    [data.disciplinas]
  )
  
  const totalMonitores = React.useMemo(() => 
    data.bolsasSolicitadas + data.voluntariosSolicitados,
    [data.bolsasSolicitadas, data.voluntariosSolicitados]
  )
  
  const cargaHorariaTotal = React.useMemo(() => 
    data.cargaHorariaSemana * data.numeroSemanas,
    [data.cargaHorariaSemana, data.numeroSemanas]
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src="/images/logo-ufba.png" />
          <View style={styles.headerText}>
            <Text style={styles.universityName}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text style={styles.departmentName}>Pró - Reitoria de Ensino de Graduação</Text>
            <Text style={styles.departmentName}>Coordenação Acadêmica de Graduação</Text>
          </View>
        </View>

        <Text style={styles.title}>ANEXO I – FORMULÁRIO PARA SUBMISSÃO DE PROJETO DE MONITORIA</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>1. IDENTIFICAÇÃO DO PROJETO</Text>

          <View style={styles.row}>
            <Text style={styles.label}>1.1 Unidade Universitária:</Text>
            <Text style={styles.value}>Instituto de Computação</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.2 Órgão responsável (Departamento ou Coord. Acadêmica):</Text>
            <Text style={styles.value}>{data.departamento?.nome || "Não selecionado"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.3 Data da aprovação do projeto:</Text>
            <Text style={styles.value}>{data.dataAprovacao || "_________________"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.4 Componente(s) curricular(es) (código e nome):</Text>
            <Text style={styles.value}>{disciplinasText}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.5 Semestre:</Text>
            <Text style={styles.value}>{semestreLabel}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.6 Proposição:</Text>
            <Text style={styles.value}>
              {data.tipoProposicao === "INDIVIDUAL" ? "( X )" : "(   )"} Individual
              {data.tipoProposicao === "COLETIVA" ? "( X )" : "(   )"} Coletiva - Nesse caso, informar quantos
              professores: ___
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.7 Número desejado de monitores:</Text>
            <Text style={styles.value}>{totalMonitores}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.8 Carga horária semanal:</Text>
            <Text style={styles.value}>{data.cargaHorariaSemana}h (Resolução CAE Nº 05/2021, Art. 7º, inciso I)</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.9 Carga horária total pretendida (12h x Nº de semanas):</Text>
            <Text style={styles.value}>{cargaHorariaTotal}h</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>1.10 Público-alvo:</Text>
            <Text style={styles.value}>
              ( X ) Estudantes de graduação ( ) Outros ( ) - Informar qual: {data.publicoAlvo}
            </Text>
          </View>

          <View style={styles.lastRow}>
            <Text style={styles.label}>1.11 Estimativa de quantas pessoas serão beneficiadas com o projeto:</Text>
            <Text style={styles.value}>( {data.estimativaPessoasBenificiadas || "___"} )</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>2. DADOS DO PROFESSOR RESPONSÁVEL PELO PROJETO (PROPONENTE)</Text>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              2.1 Nome Completo:{" "}
              {data.professorResponsavel?.nomeCompleto ||
                (data.user?.role !== "admin" ? data.user?.nomeCompleto : "") ||
                "Não informado"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              2.2 Nome Social (se houver):{" "}
              {data.professorResponsavel?.nomeSocial || "_________________________________"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>2.3 CPF: {data.professorResponsavel?.cpf || "___.___.___ - __"}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              2.4 SIAPE: {data.professorResponsavel?.matriculaSiape || "_________________"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              2.5 Regime: 20h ({data.professorResponsavel?.regime === "20H" ? "X" : " "}) 40h (
              {data.professorResponsavel?.regime === "40H" ? "X" : " "}) DE (
              {data.professorResponsavel?.regime === "DE" ? "X" : " "})
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              2.6 Tel. Institucional: {data.professorResponsavel?.telefoneInstitucional || "_________________"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              2.7 Celular: {data.professorResponsavel?.telefone || "_________________"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              2.8 E-mail institucional:{" "}
              {data.professorResponsavel?.emailInstitucional || data.user?.email || "professor@ufba.br"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>3. BREVE DESCRIÇÃO DO PROJETO</Text>
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>{data.descricao || "Descrição do projeto não informada."}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>4. ATIVIDADES QUE SERÃO DESENVOLVIDAS PELOS(AS) MONITORES(AS)</Text>
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              • Auxiliar o professor na elaboração de problemas para listas e provas{"\n"}• Auxiliar os alunos no uso
              das plataformas de submissão de problemas{"\n"}• Auxiliar os alunos quanto ao uso das técnicas e comandos
              de programação{"\n"}• Auxiliar os alunos em horário extra classe{"\n"}• Outras atividades relacionadas ao
              projeto de monitoria
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>5. DECLARAÇÃO</Text>
          <View style={styles.declarationSection}>
            <Text style={styles.declarationText}>
              Declaro ter conhecimento da Resolução nº 05/2021 do CAE e das normas descritas no Edital PROGRAD/UFBA Nº
              001/2025 – Programa de Monitoria 2025.1 ( X )
            </Text>

            <View style={styles.signatureArea}>
              <Text style={styles.signatureText}>
                Data e Assinatura do(a) Prof(a). Responsável:{" "}
                {data.dataAssinaturaProfessor || new Date().toLocaleDateString("pt-BR")}
              </Text>
              {data.assinaturaProfessor ? (
                <Image src={data.assinaturaProfessor} style={styles.signatureImage} />
              ) : (
                <View
                  style={
                    data.signingMode === "professor"
                      ? [styles.signatureLine, styles.activeSignatureArea]
                      : styles.signatureLine
                  }
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>6. APROVAÇÃO DO COORDENADOR</Text>
          <View style={styles.declarationSection}>
            <Text style={styles.declarationText}>
              Declaro que o projeto de monitoria acima descrito foi analisado e aprovado pelo departamento/coordenação
              acadêmica responsável, estando em conformidade com as diretrizes institucionais.
            </Text>

            <View style={styles.signatureArea}>
              <Text style={styles.signatureText}>
                Coordenador Responsável:{" "}
                {data.coordenadorResponsavel ||
                  (data.user?.role === "admin" ? data.user?.nomeCompleto : "") ||
                  "Coordenador"}
              </Text>
            </View>

            <View style={styles.signatureArea}>
              <Text style={styles.signatureText}>
                Data e Assinatura do(a) Coordenador(a):{" "}
                {data.dataAssinaturaAdmin || new Date().toLocaleDateString("pt-BR")}
              </Text>
              {data.assinaturaAdmin ? (
                <Image src={data.assinaturaAdmin} style={styles.signatureImage} />
              ) : (
                <View
                  style={
                    data.signingMode === "admin"
                      ? [styles.signatureLine, styles.activeSignatureArea]
                      : styles.signatureLine
                  }
                />
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export const MonitoriaFormTemplate = React.memo(MonitoriaFormTemplateComponent)
