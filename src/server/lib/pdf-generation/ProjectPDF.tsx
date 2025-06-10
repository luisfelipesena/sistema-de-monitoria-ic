import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 10,
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  universityName: {
    fontSize: 12,
    textAlign: "center",
  },
  title: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
    marginVertical: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    backgroundColor: "#E0E0E0",
    padding: 5,
  },
  field: {
    fontSize: 10,
    marginBottom: 5,
  },
  fieldLabel: {
    fontWeight: "bold",
  },
  signatureArea: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 10,
    alignItems: "center",
  },
  signatureImage: {
    width: 150,
    height: 75,
  },
  signatureLabel: {
    fontSize: 10,
    marginTop: 5,
  },
})

interface ProjectPDFProps {
  project: any // Replace with a more specific project type
  professorSignature?: string
  adminSignature?: string
}

// PDF Document Component
export const ProjectPDF = ({ project, professorSignature, adminSignature }: ProjectPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {/* Placeholder for university logo */}
        {/* <Image style={styles.logo} src="/images/logo-ufba.png" /> */}
        <Text style={styles.universityName}>UNIVERSIDADE FEDERAL DA BAHIA{"\n"}INSTITUTO DE COMPUTAÇÃO</Text>
      </View>

      <Text style={styles.title}>
        PROPOSTA DE PROJETO DE MONITORIA - {project.ano}.{project.semestre}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. IDENTIFICAÇÃO DO PROJETO</Text>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Título:</Text> {project.titulo}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Departamento:</Text> {project.departamento.nome}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Professor Responsável:</Text> {project.professorResponsavel.nomeCompleto}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Disciplinas:</Text>{" "}
          {project.disciplinas.map((d: any) => `${d.nome} (${d.codigo})`).join(", ")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. DESCRIÇÃO DO PROJETO</Text>
        <Text style={styles.field}>{project.descricao}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. VAGAS E CARGA HORÁRIA</Text>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Bolsas Solicitadas:</Text> {project.bolsasSolicitadas}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Voluntários Solicitados:</Text> {project.voluntariosSolicitados}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Carga Horária Semanal:</Text> {project.cargaHorariaSemana} horas
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. ATIVIDADES DO MONITOR</Text>
        <Text style={styles.field}>{project.atividades.map((a: any) => `- ${a.descricao}`).join("\n")}</Text>
      </View>

      <View style={styles.signatureArea}>
        {professorSignature && <Image style={styles.signatureImage} src={professorSignature} />}
        <Text style={styles.signatureLabel}>{project.professorResponsavel.nomeCompleto}</Text>
        <Text style={styles.signatureLabel}>Professor(a) Responsável</Text>
      </View>

      {adminSignature && (
        <View style={styles.signatureArea}>
          <Image style={styles.signatureImage} src={adminSignature} />
          {/* Add admin name here */}
          <Text style={styles.signatureLabel}>Coordenação de Monitoria</Text>
        </View>
      )}
    </Page>
  </Document>
)
