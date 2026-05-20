import { AtaSelecaoData } from "@/types"
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.1/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.1/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 11,
    padding: 40,
    color: "#333",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottom: "1px solid #ccc",
    paddingBottom: 3,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    backgroundColor: "#f2f2f2",
    padding: 5,
    fontWeight: "bold",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    padding: 5,
  },
  text: {
    marginBottom: 5,
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 50,
    textAlign: "center",
  },
  signatureLine: {
    borderBottom: "1px solid #333",
    width: "250px",
    margin: "0 auto",
    marginTop: 40,
  },
  signatureText: {
    marginTop: 5,
  },
})

export const AtaSelecaoTemplate = ({ data }: { data: AtaSelecaoData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>ATA DE SELEÇÃO DE MONITORES</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.text}>
          Aos {data.dataGeracao.toLocaleDateString("pt-BR")}, reuniram-se os membros da comissão de seleção para o
          projeto de monitoria, sob a responsabilidade do(a) Prof(a). {data.projeto.professorResponsavel.nomeCompleto},
          do Departamento de {data.projeto.departamento.nome}.
        </Text>
        <Text style={styles.text}>
          O processo seletivo refere-se ao projeto de monitoria intitulado "{data.projeto.titulo}".
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. DO PROCESSO SELETIVO</Text>
        <Text style={styles.text}>Total de candidatos inscritos: {data.totalInscritos}</Text>
        <Text style={styles.text}>Total de candidatos que compareceram à seleção: {data.totalCompareceram}</Text>
      </View>

      {data.inscricoesBolsista.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. RESULTADO - BOLSISTAS</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Classificação</Text>
              <Text style={styles.tableColHeader}>Nome do Candidato</Text>
              <Text style={styles.tableColHeader}>Matrícula</Text>
              <Text style={styles.tableColHeader}>Nota Final</Text>
            </View>
            {data.inscricoesBolsista.map((candidato, index) => (
              <View style={styles.tableRow} key={candidato.id}>
                <Text style={styles.tableCol}>{index + 1}º</Text>
                <Text style={styles.tableCol}>{candidato.aluno.user.username}</Text>
                <Text style={styles.tableCol}>{candidato.aluno.matricula}</Text>
                <Text style={styles.tableCol}>{Number(candidato.notaFinal).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.inscricoesVoluntario.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. RESULTADO - VOLUNTÁRIOS</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Classificação</Text>
              <Text style={styles.tableColHeader}>Nome do Candidato</Text>
              <Text style={styles.tableColHeader}>Matrícula</Text>
              <Text style={styles.tableColHeader}>Nota Final</Text>
            </View>
            {data.inscricoesVoluntario.map((candidato, index) => (
              <View style={styles.tableRow} key={candidato.id}>
                <Text style={styles.tableCol}>{index + 1}º</Text>
                <Text style={styles.tableCol}>{candidato.aluno.user.username}</Text>
                <Text style={styles.tableCol}>{candidato.aluno.matricula}</Text>
                <Text style={styles.tableCol}>{Number(candidato.notaFinal).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.text}>
          Nada mais havendo a tratar, foi lavrada a presente ata, que vai assinada por mim, presidente da comissão de
          seleção, e pelos demais membros.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureLine}></View>
        <Text style={styles.signatureText}>Prof(a). {data.projeto.professorResponsavel.nomeCompleto}</Text>
        <Text style={styles.signatureText}>Presidente da Comissão</Text>
      </View>
    </Page>
  </Document>
)
