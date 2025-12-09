import { getSemestreNumero, TIPO_VAGA_BOLSISTA, type Semestre } from "@/types"
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

// Register fonts
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
})

Font.register({
  family: "Roboto-Bold",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
})

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 50,
    fontFamily: "Roboto",
    fontSize: 12,
    lineHeight: 1.5,
  },
  border: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 3,
    borderColor: "#1e3a8a",
    borderStyle: "solid",
  },
  innerBorder: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    bottom: 25,
    borderWidth: 1,
    borderColor: "#1e3a8a",
    borderStyle: "solid",
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 10,
  },
  universityName: {
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    marginBottom: 5,
    color: "#1e3a8a",
    textTransform: "uppercase",
  },
  instituteName: {
    fontSize: 14,
    fontFamily: "Roboto-Bold",
    marginBottom: 5,
    color: "#1e3a8a",
  },
  title: {
    fontSize: 24,
    fontFamily: "Roboto-Bold",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 30,
    color: "#1e3a8a",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  content: {
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  certifyText: {
    fontSize: 12,
    marginBottom: 15,
    color: "#374151",
  },
  studentName: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    marginBottom: 15,
    color: "#1e3a8a",
    textDecoration: "underline",
  },
  activityDescription: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 10,
    color: "#374151",
    lineHeight: 1.6,
  },
  highlightText: {
    fontFamily: "Roboto-Bold",
    color: "#1e3a8a",
  },
  detailsSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 60,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    width: "40%",
    fontSize: 11,
    fontFamily: "Roboto-Bold",
    color: "#4b5563",
  },
  detailValue: {
    width: "60%",
    fontSize: 11,
    color: "#1f2937",
  },
  signatureSection: {
    marginTop: 40,
    paddingHorizontal: 60,
  },
  signatureBox: {
    alignItems: "center",
    marginBottom: 10,
  },
  signatureLine: {
    width: 250,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Roboto-Bold",
    textAlign: "center",
  },
  signatureTitle: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 50,
    right: 50,
    textAlign: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#9ca3af",
  },
  validationCode: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 5,
  },
})

export interface CertificadoMonitoriaData {
  monitor: {
    nome: string
    matricula: string
    cpf?: string
  }
  projeto: {
    titulo: string
    disciplinas: Array<{ codigo: string; nome: string }>
    ano: number
    semestre: Semestre
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  professor: {
    nome: string
    matriculaSiape?: string
  }
  departamento: {
    nome: string
    sigla?: string
  }
  monitoria: {
    tipo: "BOLSISTA" | "VOLUNTARIO"
    dataInicio: string
    dataFim: string
  }
  certificado: {
    numero: string
    dataEmissao: string
    validationCode: string
  }
  chefeDepartamento?: {
    nome: string
    cargo?: string
  }
}

export default function CertificadoMonitoria({ data }: { data: CertificadoMonitoriaData }) {
  const { monitor, projeto, professor, departamento, monitoria, certificado, chefeDepartamento } = data

  const semestreNum = getSemestreNumero(projeto.semestre)
  const cargaHorariaTotal = projeto.cargaHorariaSemana * projeto.numeroSemanas
  const tipoMonitoria = monitoria.tipo === TIPO_VAGA_BOLSISTA ? "Bolsista" : "Voluntária"
  const disciplinasTexto = projeto.disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join(", ")

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.universityName}>Universidade Federal da Bahia</Text>
          <Text style={styles.instituteName}>Instituto de Computação</Text>
          <Text style={styles.instituteName}>{departamento.nome}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Certificado de Monitoria</Text>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.certifyText}>Certificamos que</Text>
          <Text style={styles.studentName}>{monitor.nome}</Text>
          <Text style={styles.activityDescription}>
            participou do Programa de Monitoria da Universidade Federal da Bahia como{" "}
            <Text style={styles.highlightText}>Monitor(a) {tipoMonitoria}</Text>, no período de{" "}
            <Text style={styles.highlightText}>{monitoria.dataInicio}</Text> a{" "}
            <Text style={styles.highlightText}>{monitoria.dataFim}</Text>, na(s) disciplina(s){" "}
            <Text style={styles.highlightText}>{disciplinasTexto}</Text>, sob orientação do(a) Professor(a){" "}
            <Text style={styles.highlightText}>{professor.nome}</Text>, com carga horária total de{" "}
            <Text style={styles.highlightText}>{cargaHorariaTotal} horas</Text>.
          </Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Projeto:</Text>
            <Text style={styles.detailValue}>{projeto.titulo}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Período Acadêmico:</Text>
            <Text style={styles.detailValue}>
              {projeto.ano}.{semestreNum}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Carga Horária Semanal:</Text>
            <Text style={styles.detailValue}>{projeto.cargaHorariaSemana} horas</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Matrícula:</Text>
            <Text style={styles.detailValue}>{monitor.matricula}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{chefeDepartamento?.nome || "Chefe do Departamento"}</Text>
            <Text style={styles.signatureTitle}>
              {chefeDepartamento?.cargo || `Chefe do ${departamento.sigla || departamento.nome}`}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Salvador, {certificado.dataEmissao} | Certificado nº {certificado.numero}
          </Text>
          <Text style={styles.validationCode}>Código de validação: {certificado.validationCode}</Text>
        </View>
      </Page>
    </Document>
  )
}
