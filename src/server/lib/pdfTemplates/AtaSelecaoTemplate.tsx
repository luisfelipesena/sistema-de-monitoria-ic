import { AtaSelecaoData, getSemestreNumero, Semestre } from "@/types"
import { compareCandidates } from "@/utils/candidate-sorting"
import { IC_LOGO_BASE64, UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

if (typeof Font?.registerHyphenationCallback === "function") {
  Font.registerHyphenationCallback((word) => [word])
}

const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"]
const DEZES = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]

function intParaExtenso(n: number): string {
  if (n <= 10) return UNIDADES[n]
  if (n >= 10 && n < 20) return DEZES[n - 10]
  const d = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${UNIDADES[u]}`
}

export function formatNotaExtenso(nota: number | null | undefined): string {
  if (nota === null || nota === undefined || Number.isNaN(nota)) return "-"
  const rounded = Math.round(nota * 10) / 10
  const formattedNum = rounded.toFixed(1).replace(".", ",")
  const [inteiroStr, decimalStr] = rounded.toFixed(1).split(".")
  const inteiro = parseInt(inteiroStr, 10)
  const decimal = parseInt(decimalStr, 10)

  const extensoInteiro = intParaExtenso(inteiro)
  if (decimal === 0) {
    return `${formattedNum} (${extensoInteiro})`
  }
  const extensoDecimal = intParaExtenso(decimal)
  return `${formattedNum} (${extensoInteiro} vírgula ${extensoDecimal})`
}

export function formatDateExtenso(dateInput?: string | Date | null): string {
  if (!dateInput) {
    return formatValidDate(new Date())
  }
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? formatValidDate(new Date()) : formatValidDate(dateInput)
  }

  const str = String(dateInput).trim()
  if (str.includes("/")) {
    const parts = str.split("/")
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      if (!isNaN(d.getTime())) {
        return formatValidDate(d)
      }
    }
  }

  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return formatValidDate(d)
  }

  return formatValidDate(new Date())
}

function formatValidDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, "0")
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
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `Salvador, ${day} de ${month} de ${year}.`
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    paddingTop: 40,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 50,
    lineHeight: 1.5,
    color: "#000000",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
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
    marginTop: 20,
    marginBottom: 35,
  },
  title: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 40,
    textIndent: 30,
  },
  dateContainer: {
    alignItems: "flex-end",
    marginBottom: 40,
  },
  dateText: {
    fontSize: 11,
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

export const AtaSelecaoTemplate = ({ data }: { data: AtaSelecaoData }) => {
  const semestreNum = getSemestreNumero(data.projeto.semestre as Semestre)
  const ano = data.projeto.ano
  const departamentoNome = data.projeto.departamento?.nome || "CIÊNCIA DA COMPUTAÇÃO"
  const professorNome = data.projeto.professorResponsavel?.nomeCompleto || "Docente Responsável"
  const professorAssinatura = (data.projeto.professorResponsavel as any)?.user?.assinaturaDefault

  const disciplina = data.projeto.disciplinas?.[0]
  const disciplinaStr = disciplina ? `${disciplina.codigo} – ${disciplina.nome}` : data.projeto.titulo

  const isVoluntarioAta = data.tipoAta === "VOLUNTARIO"
  const tipoVagaStr = isVoluntarioAta ? "VOLUNTÁRIA" : "COM BOLSA"
  const monitoriaTexto = isVoluntarioAta ? "monitoria voluntária" : "monitoria com bolsa"

  const editalNum = "02/2025"

  // Obter candidatos filtrados de acordo com o tipo da Ata
  const rawList = isVoluntarioAta
    ? (data.inscricoesVoluntario && data.inscricoesVoluntario.length > 0
        ? data.inscricoesVoluntario
        : (data.candidatos || []).filter((c) => c.tipoVagaPretendida === "VOLUNTARIO" || c.status?.includes("VOLUNTARIO")))
    : (data.inscricoesBolsista && data.inscricoesBolsista.length > 0
        ? data.inscricoesBolsista
        : (data.candidatos || []).filter((c) => c.tipoVagaPretendida !== "VOLUNTARIO"))

  const todosCandidatos = rawList.map((c: any) => ({
    id: c.id,
    aluno: c.aluno,
    tipoVagaPretendida: c.tipoVagaPretendida,
    notaDisciplina: c.notaDisciplina ? Number(c.notaDisciplina) : null,
    notaSelecao: c.notaSelecao ? Number(c.notaSelecao) : null,
    notaFinal: c.notaFinal ? Number(c.notaFinal) : null,
    status: c.status,
  }))

  const candidatosCompareceram = todosCandidatos.filter(
    (c) => c.notaFinal !== null || c.notaDisciplina !== null || c.notaSelecao !== null
  )

  const candidatosClassificados = [...todosCandidatos]
    .filter((c) => c.notaFinal !== null && c.notaFinal >= 7.0)
    .sort(compareCandidates)

  const countInscritos = rawList.length || data.totalInscritos || 0
  const countCompareceram = candidatosCompareceram.length
  const countClassificados = candidatosClassificados.length

  const totalInscritosPad = countInscritos.toString().padStart(2, "0")
  const totalCompareceramPad = countCompareceram.toString().padStart(2, "0")

  const inscritosTexto = (countInscritos === 1)
    ? `Inscreveu-se ${totalInscritosPad} candidato e compareceu à seleção ${totalCompareceramPad} candidato`
    : `Inscreveram-se ${totalInscritosPad} candidatos e compareceram à seleção ${totalCompareceramPad} candidatos inscritos`

  let conclusaoTexto = ""
  if (countClassificados === 1) {
    const c = candidatosClassificados[0]
    conclusaoTexto = `conclui que foi classificado o candidato ${c.aluno.nomeCompleto} com média ${formatNotaExtenso(c.notaFinal)}`
  } else if (countClassificados > 1) {
    const classificadosStr = candidatosClassificados
      .map((c) => `${c.aluno.nomeCompleto} com média ${formatNotaExtenso(c.notaFinal)}`)
      .reduce((acc, current, idx, arr) => {
        if (idx === 0) return current
        if (idx === arr.length - 1) return `${acc}, e último ${current}`
        return `${acc}, ${current}`
      }, "")
    conclusaoTexto = `conclui que foram classificado(s) o(s) candidato(s) ${classificadosStr}`
  } else {
    conclusaoTexto = "conclui que não houveram candidatos classificados"
  }

  const dataAtaStr = data.ataInfo?.dataSelecao || new Date().toLocaleDateString("pt-BR")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecalho com Logos */}
        <View style={styles.headerContainer}>
          <Image src={UFBA_LOGO__FORM_BASE64} style={styles.logoUfba} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.institutionHeaderBold}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text style={styles.institutionHeaderBold}>INSTITUTO DE COMPUTAÇÃO</Text>
            <Text style={styles.institutionHeaderBold}>
              DEPARTAMENTO DE {departamentoNome.toUpperCase()}
            </Text>
          </View>
          <Image src={IC_LOGO_BASE64} style={styles.logoIc} />
        </View>

        {/* Titulo */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            ATA DE SELEÇÃO DE MONITORIA {tipoVagaStr} SEMESTRE {ano}.{semestreNum}
          </Text>
        </View>

        {/* Parágrafo Narrativo Oficial */}
        <Text style={styles.paragraph}>
          Em {dataAtaStr} às 10:00 horas deram início as Provas relativas à seleção de {monitoriaTexto} em projetos acadêmicos para a Disciplina {disciplinaStr}, conforme Edital Interno nº {editalNum}. {inscritosTexto}. Eu, {professorNome}, docente responsável pelo projeto, após análise, conforme os critérios estabelecidos, {conclusaoTexto}.
        </Text>

        {/* Data por Extenso */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDateExtenso()}</Text>
        </View>

        {/* Assinatura do Professor */}
        <View style={styles.signatureContainer}>
          {professorAssinatura ? (
            <Image src={professorAssinatura} style={styles.signatureImage} />
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
