import { Disciplina, Professor, User, atividadeProjetoTable, projetoDisciplinaTable } from "@/server/db/schema"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

type AtividadeProjeto = typeof atividadeProjetoTable.$inferSelect
type ProjetoDisciplina = typeof projetoDisciplinaTable.$inferSelect

// Define a type for the form data, combining different parts of the schema
export interface MonitoriaFormData {
  titulo?: string
  descricao?: string
  departamento?: { id: number; nome: string }
  professorResponsavel?: Partial<Professor> & { user?: Partial<User> }
  coordenadorResponsavel?: string
  ano?: number
  semestre?: "SEMESTRE_1" | "SEMESTRE_2"
  tipoProposicao?: "INDIVIDUAL" | "COLETIVA"
  bolsasSolicitadas?: number
  voluntariosSolicitados?: number
  cargaHorariaSemana?: number
  numeroSemanas?: number
  publicoAlvo?: string
  estimativaPessoasBenificiadas?: number
  disciplinas?: (Partial<ProjetoDisciplina> & { disciplina: Partial<Disciplina> })[]
  atividades?: Partial<AtividadeProjeto>[]
  user?: Partial<User>
  projetoId?: number
  assinaturaProfessor?: string
  dataAssinaturaProfessor?: string
  assinaturaAdmin?: string
  dataAssinaturaAdmin?: string
  dataAprovacao?: string
  signingMode?: "professor" | "admin"
}

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 11,
    padding: 40,
    lineHeight: 1.5,
    color: "#333",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    margin: "0 auto 10px",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#555",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    padding: 5,
    marginBottom: 8,
    borderBottom: "1px solid #ccc",
  },
  field: {
    marginBottom: 5,
  },
  fieldLabel: {
    fontWeight: "bold",
  },
  fieldValue: {},
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    marginRight: 5,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  signatureBox: {
    width: "45%",
    borderTop: "1px solid #333",
    textAlign: "center",
    paddingTop: 8,
  },
  signatureImage: {
    width: 120,
    height: 60,
    margin: "0 auto",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "grey",
  },
})

export function MonitoriaFormTemplate({ data }: { data: MonitoriaFormData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src="/images/ic-logo-clean.png" />
          <Text style={styles.title}>Proposta de Projeto de Monitoria</Text>
          <Text style={styles.subtitle}>
            {data.ano}/{data.semestre === "SEMESTRE_1" ? 1 : 2}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Identificação do Projeto</Text>
          <Text style={styles.field}>
            <Text style={styles.fieldLabel}>Título: </Text>
            <Text style={styles.fieldValue}>{data.titulo}</Text>
          </Text>
          <Text style={styles.field}>
            <Text style={styles.fieldLabel}>Departamento: </Text>
            <Text style={styles.fieldValue}>{data.departamento?.nome}</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Justificativa e Objetivos</Text>
          <Text style={styles.fieldValue}>{data.descricao}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Detalhes da Proposta</Text>
          <View style={styles.grid}>
            <Text style={[styles.field, styles.gridItem]}>
              <Text style={styles.fieldLabel}>Carga Horária Semanal: </Text>
              <Text style={styles.fieldValue}>{data.cargaHorariaSemana}h</Text>
            </Text>
            <Text style={[styles.field, styles.gridItem]}>
              <Text style={styles.fieldLabel}>Vagas Bolsistas: </Text>
              <Text style={styles.fieldValue}>{data.bolsasSolicitadas}</Text>
            </Text>
            <Text style={[styles.field, styles.gridItem]}>
              <Text style={styles.fieldLabel}>Vagas Voluntários: </Text>
              <Text style={styles.fieldValue}>{data.voluntariosSolicitados}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Disciplinas Atendidas</Text>
          {data.disciplinas?.map((d) => (
            <View key={d.disciplina?.id} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text>
                {d.disciplina?.codigo} - {d.disciplina?.nome}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            {data.assinaturaProfessor && <Image style={styles.signatureImage} src={data.assinaturaProfessor} />}
            <Text>{data.professorResponsavel?.nomeCompleto}</Text>
            <Text style={{ fontSize: 10 }}>Professor Responsável</Text>
            {data.dataAssinaturaProfessor && (
              <Text style={{ fontSize: 9 }}>Assinado em: {data.dataAssinaturaProfessor}</Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            {data.assinaturaAdmin && <Image style={styles.signatureImage} src={data.assinaturaAdmin} />}
            <Text>{data.coordenadorResponsavel}</Text>
            <Text style={{ fontSize: 10 }}>Coordenação de Monitoria</Text>
            {data.dataAssinaturaAdmin && <Text style={{ fontSize: 9 }}>Assinado em: {data.dataAssinaturaAdmin}</Text>}
          </View>
        </View>

        <Text style={styles.footer}>
          Documento gerado pelo Sistema de Monitoria do IC - UFBA em {new Date().toLocaleDateString("pt-BR")}
        </Text>
      </Page>
    </Document>
  )
}
