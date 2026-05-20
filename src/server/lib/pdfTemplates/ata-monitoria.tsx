import { PDF_PAGE_SIZE_A4 } from '@/constants/pdf'
import { AtaMonitoriaData, getSemestreNumero, TIPO_VAGA_BOLSISTA, type Semestre } from '@/types'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    paddingTop: 40,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 60,
    lineHeight: 1.6,
  },
  header: {
    textAlign: 'center',
    marginBottom: 50,
  },
  headerLine: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
  },
  body: {
    textAlign: 'justify',
    marginBottom: 30,
    lineHeight: 1.8,
  },
  dateLocation: {
    textAlign: 'right',
    marginBottom: 60,
    marginTop: 30,
  },
  signatureSection: {
    textAlign: 'center',
    marginTop: 40,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
    paddingBottom: 30,
    marginHorizontal: 100,
  },
  signatureLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
})

function formatMediaExtenso(media: number): string {
  const inteiro = Math.floor(media)
  const decimal = Math.round((media - inteiro) * 100)
  const inteiroExtenso = numberToExtenso(inteiro)
  const decimalExtenso = decimal > 0 ? numberToExtenso(decimal) : ''

  if (decimal === 0) {
    return `${media.toFixed(2).replace('.', ',')} (${inteiroExtenso})`
  }
  return `${media.toFixed(2).replace('.', ',')} (${inteiroExtenso} vírgula ${decimalExtenso})`
}

function numberToExtenso(n: number): string {
  const unidades = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const dezADezenove = [
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ]
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']

  if (n < 10) return unidades[n]
  if (n < 20) return dezADezenove[n - 10]
  if (n < 100) {
    const dezena = Math.floor(n / 10)
    const unidade = n % 10
    return unidade === 0 ? dezenas[dezena] : `${dezenas[dezena]} e ${unidades[unidade]}`
  }
  return String(n)
}

function formatClassificados(classificados: AtaMonitoriaData['classificados']): string {
  if (classificados.length === 0) return 'nenhum candidato'
  if (classificados.length === 1) {
    return `o candidato ${classificados[0].nome} com média ${formatMediaExtenso(classificados[0].media)}`
  }

  const items = classificados.map((c) => `${c.nome} com média ${formatMediaExtenso(c.media)}`)
  const lastItem = items.pop()
  return `os candidatos ${items.join(', ')} e ${lastItem}`
}

export function AtaMonitoriaTemplate({ data }: { data: AtaMonitoriaData }) {
  const tipoTexto = data.tipo === TIPO_VAGA_BOLSISTA ? 'COM BOLSA' : 'VOLUNTÁRIA'
  const tipoTextoCorpo = data.tipo === TIPO_VAGA_BOLSISTA ? 'com bolsa' : 'voluntária'
  const semestreNum = getSemestreNumero(data.semestre as Semestre)

  return (
    <Document>
      <Page size={PDF_PAGE_SIZE_A4} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLine}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
          <Text style={styles.headerLine}>INSTITUTO DE COMPUTAÇÃO</Text>
          <Text style={styles.headerLine}>
            {data.departamento.sigla ? data.departamento.sigla.toUpperCase() : data.departamento.nome.toUpperCase()}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          ATA DE SELEÇÃO DE MONITORIA {tipoTexto} SEMESTRE {data.ano}.{semestreNum}
        </Text>

        {/* Body */}
        <View style={styles.body}>
          <Text>
            Em {data.dataSelecao} às {data.horaSelecao} horas deram início as Provas relativas à seleção de monitoria{' '}
            {tipoTextoCorpo} em projetos acadêmicos para a Disciplina {data.disciplina.codigo} – {data.disciplina.nome},
            conforme Edital Interno nº {data.editalNumero}. Inscreveram-se {data.totalInscritos} candidatos e
            compareceram à seleção {data.totalCompareceram} dos candidatos inscritos. Eu, {data.professorNome}, docente
            responsável pelo projeto, após análise, conforme os critérios estabelecidos, conclui que foram
            classificado(s) {formatClassificados(data.classificados)}.
          </Text>
        </View>

        {/* Date and Location */}
        <Text style={styles.dateLocation}>Salvador, {data.dataDocumento}.</Text>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Docente Responsável pela Seleção</Text>
        </View>
      </Page>
    </Document>
  )
}

// Convenience exports for specific types
export function AtaMonitoriaBolsaTemplate({ data }: { data: Omit<AtaMonitoriaData, 'tipo'> }) {
  return <AtaMonitoriaTemplate data={{ ...data, tipo: TIPO_VAGA_BOLSISTA }} />
}

export function AtaMonitoriaVoluntariaTemplate({ data }: { data: Omit<AtaMonitoriaData, 'tipo'> }) {
  return <AtaMonitoriaTemplate data={{ ...data, tipo: 'VOLUNTARIO' }} />
}
