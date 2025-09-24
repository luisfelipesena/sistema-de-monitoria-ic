import { UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Image, Page, StyleSheet, Text, View, type DocumentProps } from "@react-pdf/renderer"
import React, { type ReactElement } from "react"

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    fontSize: 8,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginBottom: 15,
  },
  headerImage: {
    height: 50,
    width: 36,
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#90EE90",
    padding: 8,
    border: "1pt solid #000",
  },
  table: {
    display: "flex",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
    borderBottom: "1pt solid #000",
  },
  tableRowHeader: {
    margin: "auto",
    flexDirection: "row",
    backgroundColor: "#90EE90",
    borderBottom: "1pt solid #000",
  },
  tableCol1: {
    width: "15%",
    borderRight: "1pt solid #000",
    padding: 4,
    fontSize: 7,
    textAlign: "center",
  },
  tableCol2: {
    width: "20%",
    borderRight: "1pt solid #000",
    padding: 4,
    fontSize: 7,
    textAlign: "center",
  },
  tableCol3: {
    width: "8%",
    borderRight: "1pt solid #000",
    padding: 4,
    fontSize: 7,
    textAlign: "center",
  },
  tableCol4: {
    width: "25%",
    borderRight: "1pt solid #000",
    padding: 4,
    fontSize: 7,
    textAlign: "left",
  },
  tableCol5: {
    width: "16%",
    borderRight: "1pt solid #000",
    padding: 4,
    fontSize: 7,
    textAlign: "left",
  },
  tableCol6: {
    width: "16%",
    padding: 4,
    fontSize: 7,
    textAlign: "left",
  },
  tableCellText: {
    fontSize: 6,
    lineHeight: 1.2,
  },
  departmentHeader: {
    backgroundColor: "#E0E0E0",
    fontWeight: "bold",
    fontSize: 8,
  },
})

export interface PlanilhaPROGRADData {
  semestre: string
  ano: number
  projetos: Array<{
    id: number
    codigo: string
    disciplinaNome: string
    professorNome: string
    professoresParticipantes?: string
    departamentoNome: string
    tipoProposicao: string
  }>
}

export interface PlanilhaPROGRADProps extends DocumentProps {
  data: PlanilhaPROGRADData
}

export function PlanilhaPROGRADDocument({ data, ...rest }: PlanilhaPROGRADProps): ReactElement<DocumentProps> {
  // Group projects by department
  const projetosPorDepartamento = data.projetos.reduce((acc, projeto) => {
    if (!acc[projeto.departamentoNome]) {
      acc[projeto.departamentoNome] = []
    }
    acc[projeto.departamentoNome].push(projeto)
    return acc
  }, {} as Record<string, typeof data.projetos>)

  return (
    <Document {...rest}>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Header */}
        <View style={styles.header}>
          <Image style={styles.headerImage} src={UFBA_LOGO__FORM_BASE64} cache={false} />
          <View style={styles.headerText}>
            <Text>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text>Pró-Reitoria de Ensino de Graduação</Text>
            <Text>Instituto de Computação</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          PLANILHA DE DETALHAMENTO DOS PROJETOS APROVADOS NA CONGREGAÇÃO DO IC - {data.ano}.
          {data.semestre === "SEMESTRE_1" ? "1" : "2"}
        </Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRowHeader}>
            <View style={styles.tableCol1}>
              <Text style={styles.tableCellText}>Unidade Universitária</Text>
            </View>
            <View style={styles.tableCol2}>
              <Text style={styles.tableCellText}>Órgão Responsável{"\n"}(Dept. ou Coord. Acadêmica)</Text>
            </View>
            <View style={styles.tableCol3}>
              <Text style={styles.tableCellText}>CÓDIGO</Text>
            </View>
            <View style={styles.tableCol4}>
              <Text style={styles.tableCellText}>Componente(s) Curricular(es): NOME</Text>
            </View>
            <View style={styles.tableCol5}>
              <Text style={styles.tableCellText}>Professor Responsável pelo Projeto{"\n"}(Proponente)</Text>
            </View>
            <View style={styles.tableCol6}>
              <Text style={styles.tableCellText}>Professores participantes (Projetos coletivos)</Text>
            </View>
          </View>

          {/* Table Rows */}
          {Object.entries(projetosPorDepartamento).map(([departamento, projetos]) => (
            <React.Fragment key={departamento}>
              {/* Department Header Row */}
              <View style={[styles.tableRow, styles.departmentHeader]}>
                <View style={styles.tableCol1}>
                  <Text style={styles.tableCellText}>Instituto de Computação</Text>
                </View>
                <View style={styles.tableCol2}>
                  <Text style={styles.tableCellText}>{departamento}</Text>
                </View>
                <View style={styles.tableCol3}>
                  <Text style={styles.tableCellText}></Text>
                </View>
                <View style={styles.tableCol4}>
                  <Text style={styles.tableCellText}></Text>
                </View>
                <View style={styles.tableCol5}>
                  <Text style={styles.tableCellText}></Text>
                </View>
                <View style={styles.tableCol6}>
                  <Text style={styles.tableCellText}></Text>
                </View>
              </View>

              {/* Project Rows */}
              {projetos.map((projeto) => (
                <View key={projeto.id} style={styles.tableRow}>
                  <View style={styles.tableCol1}>
                    <Text style={styles.tableCellText}></Text>
                  </View>
                  <View style={styles.tableCol2}>
                    <Text style={styles.tableCellText}></Text>
                  </View>
                  <View style={styles.tableCol3}>
                    <Text style={styles.tableCellText}>{projeto.codigo}</Text>
                  </View>
                  <View style={styles.tableCol4}>
                    <Text style={styles.tableCellText}>{projeto.disciplinaNome}</Text>
                  </View>
                  <View style={styles.tableCol5}>
                    <Text style={styles.tableCellText}>{projeto.professorNome}</Text>
                  </View>
                  <View style={styles.tableCol6}>
                    <Text style={styles.tableCellText}>
                      {projeto.tipoProposicao === "COLETIVA" ? projeto.professoresParticipantes || "Não informado" : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </React.Fragment>
          ))}
        </View>
      </Page>
    </Document>
  )
}
