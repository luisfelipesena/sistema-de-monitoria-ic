import React from "react"
import { compareCandidates } from "@/utils/candidate-sorting"
import { AtaSelecaoData, getSemestreNumero, Semestre } from "@/types"
import { IC_LOGO_BASE64, UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { formatDateExtenso } from "./AtaSelecaoTemplate"

if (typeof Font?.registerHyphenationCallback === "function") {
  Font.registerHyphenationCallback((word) => [word])
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    paddingTop: 40,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 50,
    lineHeight: 1.4,
    color: "#000000",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 35,
    width: "100%",
  },
  logoUfba: {
    width: 65,
    height: 75,
    objectFit: "contain",
  },
  logoIc: {
    width: 70,
    height: 75,
    objectFit: "contain",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  institutionHeaderBold: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    marginBottom: 3,
    textAlign: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 30,
  },
  title: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  tableContainer: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 40,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderStyle: "solid",
    minHeight: 22,
    alignItems: "center",
  },
  tableRowNoBorder: {
    flexDirection: "row",
    minHeight: 22,
    alignItems: "center",
  },
  cellLeftHeaderLabel: {
    width: "35%",
    fontFamily: "Times-Bold",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderStyle: "solid",
    textTransform: "uppercase",
  },
  cellLeftHeaderValue: {
    width: "65%",
    fontFamily: "Times-Roman",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 10,
  },
  colCandidateHeader: {
    width: "50%",
    fontFamily: "Times-Bold",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderStyle: "solid",
    textTransform: "uppercase",
  },
  colGradeHeader: {
    width: "25%",
    fontFamily: "Times-Bold",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderStyle: "solid",
    textTransform: "uppercase",
  },
  colRankHeader: {
    width: "25%",
    fontFamily: "Times-Bold",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 10,
    textTransform: "uppercase",
  },
  colCandidateValue: {
    width: "50%",
    fontFamily: "Times-Roman",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderStyle: "solid",
  },
  colGradeValue: {
    width: "25%",
    fontFamily: "Times-Roman",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderStyle: "solid",
  },
  colRankValue: {
    width: "25%",
    fontFamily: "Times-Bold",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  dateContainer: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 10,
  },
  dateText: {
    fontSize: 11,
    textAlign: "center",
  },
  signatureContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  signatureImage: {
    height: 45,
    width: 140,
    marginBottom: -8,
    objectFit: "contain",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    width: 260,
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textAlign: "center",
  },
})

export interface ResultadoSelecaoProps {
  data: AtaSelecaoData
  tipo: "BOLSISTA" | "VOLUNTARIO"
}

export function ResultadoSelecaoTemplate({ data, tipo }: ResultadoSelecaoProps) {
  const semestreNum = getSemestreNumero(data.projeto.semestre as Semestre)
  const ano = data.projeto.ano
  const departamentoNome = data.projeto.departamento?.nome || "CIÊNCIA DA COMPUTAÇÃO"
  const professorNome = data.projeto.professorResponsavel?.nomeCompleto || "Docente Responsável"
  const professorAssinatura = (data.projeto.professorResponsavel as any)?.user?.assinaturaDefault

  const disciplina = data.projeto.disciplinas?.[0]
  const disciplinaStr = disciplina ? `${disciplina.codigo} - ${disciplina.nome}` : data.projeto.titulo

  const isVoluntario = tipo === "VOLUNTARIO"
  const tipoTituloStr = isVoluntario ? "VOLUNTÁRIA" : "COM BOLSA"
  const editalNum = "02/2025"

  // Obter lista de candidatos de acordo com o tipo
  const rawList = isVoluntario
    ? data.inscricoesVoluntario && data.inscricoesVoluntario.length > 0
      ? data.inscricoesVoluntario
      : (data.candidatos || []).filter(
          (c) => c.tipoVagaPretendida === "VOLUNTARIO" || c.status?.includes("VOLUNTARIO")
        )
    : data.inscricoesBolsista && data.inscricoesBolsista.length > 0
    ? data.inscricoesBolsista
    : (data.candidatos || []).filter((c) => c.tipoVagaPretendida !== "VOLUNTARIO")

  // Regra estrita: Apenas candidatos com nota final >= 7.0 entram no resultado
  const candidatosAprovados = rawList
    .map((c: any) => ({
      id: c.id,
      alunoNome: c.aluno?.nomeCompleto || c.aluno?.user?.username || "Candidato",
      notaDisciplina: c.notaDisciplina ? Number(c.notaDisciplina) : null,
      coeficienteRendimento: c.coeficienteRendimento ? Number(c.coeficienteRendimento) : null,
      aluno: c.aluno,
      notaFinal: c.notaFinal !== null && c.notaFinal !== undefined ? Math.round(Number(c.notaFinal) * 10) / 10 : null,
    }))
    .filter((c) => c.notaFinal !== null && c.notaFinal >= 7.0)
    .sort(compareCandidates)

  const dataAtaStr = data.ataInfo?.dataSelecao || new Date()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho com Logos */}
        <View style={styles.headerContainer}>
          <Image src={UFBA_LOGO__FORM_BASE64} style={styles.logoUfba} cache={false} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.institutionHeaderBold}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text style={styles.institutionHeaderBold}>INSTITUTO DE COMPUTAÇÃO</Text>
            <Text style={styles.institutionHeaderBold}>
              DEPARTAMENTO DE {departamentoNome.toUpperCase()}
            </Text>
          </View>
          <Image src={IC_LOGO_BASE64} style={styles.logoIc} cache={false} />
        </View>

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            RESULTADO PARA SELEÇÃO DE MONITORIA {tipoTituloStr}- {ano}.{semestreNum}
          </Text>
          <Text style={styles.subTitle}>EDITAL INTERNO Nº {editalNum}</Text>
        </View>

        {/* Tabela de Resultados */}
        <View style={styles.tableContainer}>
          {/* Linha 1: Nome da Disciplina */}
          <View style={styles.tableRow}>
            <Text style={styles.cellLeftHeaderLabel}>NOME DA DISCIPLINA</Text>
            <Text style={styles.cellLeftHeaderValue}>{disciplinaStr}</Text>
          </View>

          {/* Linha 2: Orientador */}
          <View style={styles.tableRow}>
            <Text style={styles.cellLeftHeaderLabel}>ORIENTADOR:</Text>
            <Text style={styles.cellLeftHeaderValue}>{professorNome}</Text>
          </View>

          {/* Linha 3: Cabeçalho das Colunas */}
          <View style={styles.tableRow}>
            <Text style={styles.colCandidateHeader}>NOME DO CANDIDATO</Text>
            <Text style={styles.colGradeHeader}>NOTA</Text>
            <Text style={styles.colRankHeader}>CLASSIFICAÇÃO</Text>
          </View>

          {/* Linhas de Candidatos (apenas nota >= 7.0) */}
          {candidatosAprovados.length > 0 ? (
            candidatosAprovados.map((cand, idx) => {
              const isLast = idx === candidatosAprovados.length - 1
              const rowStyle = isLast ? styles.tableRowNoBorder : styles.tableRow
              const rankStr = `${idx + 1}º`
              const gradeStr = cand.notaFinal!.toFixed(1).replace(".", ",")

              return (
                <View key={cand.id} style={rowStyle}>
                  <Text style={styles.colCandidateValue}>{cand.alunoNome}</Text>
                  <Text style={styles.colGradeValue}>{gradeStr}</Text>
                  <Text style={styles.colRankValue}>{rankStr}</Text>
                </View>
              )
            })
          ) : (
            <View style={styles.tableRowNoBorder}>
              <Text style={[styles.colCandidateValue, { width: "100%", textAlign: "center", borderRightWidth: 0 }]}>
                Nenhum candidato aprovado (nota &ge; 7,0)
              </Text>
            </View>
          )}
        </View>

        {/* Data */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDateExtenso(dataAtaStr)}</Text>
        </View>

        {/* Assinatura do Professor */}
        <View style={styles.signatureContainer}>
          {professorAssinatura ? (
            <Image src={professorAssinatura} style={styles.signatureImage} cache={false} />
          ) : (
            <View style={{ height: 35 }} />
          )}
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>Prof. {professorNome}</Text>
        </View>
      </Page>
    </Document>
  )
}
