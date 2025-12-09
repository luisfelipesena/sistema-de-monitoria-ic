import { PDF_PAGE_SIZE_A4 } from "@/constants/pdf"
import { SEMESTRE_1, TIPO_PROPOSICAO_COLETIVA } from "@/types"
import { UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Image, Link, Page, StyleSheet, Text, View, type DocumentProps } from "@react-pdf/renderer"
import React, { type ReactElement } from "react"

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 15,
    paddingRight: 15,
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
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    backgroundColor: "#90EE90",
    padding: 6,
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
    flexDirection: "row",
    borderBottom: "1pt solid #000",
    minHeight: 18,
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#90EE90",
    borderBottom: "1pt solid #000",
    minHeight: 24,
  },
  // Unidade Universitária
  tableCol1: {
    width: "12%",
    borderRight: "1pt solid #000",
    padding: 3,
    justifyContent: "center",
  },
  // Órgão Responsável
  tableCol2: {
    width: "18%",
    borderRight: "1pt solid #000",
    padding: 3,
    justifyContent: "center",
  },
  // CÓDIGO
  tableCol3: {
    width: "8%",
    borderRight: "1pt solid #000",
    padding: 3,
    justifyContent: "center",
  },
  // Componente Curricular
  tableCol4: {
    width: "20%",
    borderRight: "1pt solid #000",
    padding: 3,
    justifyContent: "center",
  },
  // Professor Responsável
  tableCol5: {
    width: "16%",
    borderRight: "1pt solid #000",
    padding: 3,
    justifyContent: "center",
  },
  // Professores participantes
  tableCol6: {
    width: "16%",
    borderRight: "1pt solid #000",
    padding: 3,
    justifyContent: "center",
  },
  // Link PDF
  tableCol7: {
    width: "10%",
    padding: 3,
    justifyContent: "center",
  },
  tableCellText: {
    fontSize: 6,
    lineHeight: 1.3,
    textAlign: "center",
  },
  tableCellTextLeft: {
    fontSize: 6,
    lineHeight: 1.3,
    textAlign: "left",
  },
  headerCellText: {
    fontSize: 6,
    lineHeight: 1.2,
    textAlign: "center",
    fontWeight: "bold",
  },
  linkText: {
    fontSize: 5,
    color: "#0000EE",
    textDecoration: "underline",
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
    linkPDF?: string
  }>
}

export interface PlanilhaPROGRADProps extends DocumentProps {
  data: PlanilhaPROGRADData
}

export function PlanilhaPROGRADDocument({ data, ...rest }: PlanilhaPROGRADProps): ReactElement<DocumentProps> {
  // Group projects by department and sort
  const projetosPorDepartamento = data.projetos.reduce(
    (acc, projeto) => {
      if (!acc[projeto.departamentoNome]) {
        acc[projeto.departamentoNome] = []
      }
      acc[projeto.departamentoNome].push(projeto)
      return acc
    },
    {} as Record<string, typeof data.projetos>
  )

  // Sort departments alphabetically
  const sortedDepartments = Object.keys(projetosPorDepartamento).sort()

  return (
    <Document {...rest}>
      <Page size={PDF_PAGE_SIZE_A4} style={styles.page} orientation="landscape">
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
          {data.semestre === SEMESTRE_1 ? "1" : "2"}
        </Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRowHeader}>
            <View style={styles.tableCol1}>
              <Text style={styles.headerCellText}>Unidade Universitária</Text>
            </View>
            <View style={styles.tableCol2}>
              <Text style={styles.headerCellText}>Órgão Responsável{"\n"}(Dept. ou Coord. Acadêmica)</Text>
            </View>
            <View style={styles.tableCol3}>
              <Text style={styles.headerCellText}>CÓDIGO</Text>
            </View>
            <View style={styles.tableCol4}>
              <Text style={styles.headerCellText}>Componente(s) Curricular(es): NOME</Text>
            </View>
            <View style={styles.tableCol5}>
              <Text style={styles.headerCellText}>Professor Responsável{"\n"}pelo Projeto (Proponente)</Text>
            </View>
            <View style={styles.tableCol6}>
              <Text style={styles.headerCellText}>Professores participantes{"\n"}(Projetos coletivos)</Text>
            </View>
            <View style={styles.tableCol7}>
              <Text style={styles.headerCellText}>Link PDF</Text>
            </View>
          </View>

          {/* Table Rows - grouped by department */}
          {sortedDepartments.map((departamento) => {
            const projetos = projetosPorDepartamento[departamento]
            return (
              <React.Fragment key={departamento}>
                {projetos.map((projeto, index) => (
                  <View key={projeto.id} style={styles.tableRow} wrap={false}>
                    <View style={styles.tableCol1}>
                      <Text style={styles.tableCellText}>{index === 0 ? "Instituto de Computação" : ""}</Text>
                    </View>
                    <View style={styles.tableCol2}>
                      <Text style={styles.tableCellText}>{index === 0 ? departamento : ""}</Text>
                    </View>
                    <View style={styles.tableCol3}>
                      <Text style={styles.tableCellText}>{projeto.codigo}</Text>
                    </View>
                    <View style={styles.tableCol4}>
                      <Text style={styles.tableCellTextLeft}>{projeto.disciplinaNome}</Text>
                    </View>
                    <View style={styles.tableCol5}>
                      <Text style={styles.tableCellTextLeft}>{projeto.professorNome}</Text>
                    </View>
                    <View style={styles.tableCol6}>
                      <Text style={styles.tableCellTextLeft}>
                        {projeto.tipoProposicao === TIPO_PROPOSICAO_COLETIVA
                          ? projeto.professoresParticipantes || ""
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.tableCol7}>
                      {projeto.linkPDF ? (
                        <Link src={projeto.linkPDF} style={styles.linkText}>
                          Ver PDF
                        </Link>
                      ) : (
                        <Text style={styles.tableCellText}>-</Text>
                      )}
                    </View>
                  </View>
                ))}
              </React.Fragment>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}
