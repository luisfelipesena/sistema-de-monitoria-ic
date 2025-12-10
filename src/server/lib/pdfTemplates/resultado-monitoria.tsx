import { PDF_PAGE_SIZE_A4 } from '@/constants/pdf'
import { getSemestreNumero, ResultadoMonitoriaData, TIPO_VAGA_BOLSISTA, type Semestre } from '@/types'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    paddingTop: 40,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 60,
    lineHeight: 1.5,
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
  titleSection: {
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoTable: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderBottomWidth: 0,
  },
  infoRowLast: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
  },
  infoLabel: {
    width: '35%',
    padding: 8,
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    fontSize: 11,
  },
  infoValue: {
    width: '65%',
    padding: 8,
    fontSize: 11,
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
  },
  tableColNome: {
    width: '50%',
    padding: 8,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableColNota: {
    width: '25%',
    padding: 8,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableColClass: {
    width: '25%',
    padding: 8,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableColNomeData: {
    width: '50%',
    padding: 8,
    fontSize: 11,
  },
  tableColNotaData: {
    width: '25%',
    padding: 8,
    fontSize: 11,
    textAlign: 'center',
  },
  tableColClassData: {
    width: '25%',
    padding: 8,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dateLocation: {
    textAlign: 'center',
    marginBottom: 60,
    marginTop: 20,
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

function formatNota(nota: number): string {
  return nota.toFixed(2).replace('.', ',')
}

function formatClassificacao(pos: number): string {
  return `${pos}º`
}

export function ResultadoMonitoriaTemplate({ data }: { data: ResultadoMonitoriaData }) {
  const tipoTexto = data.tipo === TIPO_VAGA_BOLSISTA ? 'COM BOLSA' : 'VOLUNTÁRIA'
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
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            RESULTADO PARA SELEÇÃO DE MONITORIA {tipoTexto}- {data.ano}.{semestreNum}
          </Text>
          <Text style={styles.subtitle}>EDITAL INTERNO Nº {data.editalNumero}</Text>
        </View>

        {/* Info Table */}
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NOME DA DISCIPLINA</Text>
            <Text style={styles.infoValue}>
              {data.disciplina.codigo} - {data.disciplina.nome}
            </Text>
          </View>
          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>ORIENTADOR:</Text>
            <Text style={styles.infoValue}>{data.professorNome}</Text>
          </View>
        </View>

        {/* Candidates Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColNome}>NOME DO CANDIDATO</Text>
            <Text style={styles.tableColNota}>NOTA</Text>
            <Text style={styles.tableColClass}>CLASSIFICAÇÃO</Text>
          </View>
          {data.candidatos.map((candidato, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableColNomeData}>{candidato.nome}</Text>
              <Text style={styles.tableColNotaData}>{formatNota(candidato.nota)}</Text>
              <Text style={styles.tableColClassData}>{formatClassificacao(candidato.classificacao)}</Text>
            </View>
          ))}
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
export function ResultadoMonitoriaBolsaTemplate({ data }: { data: Omit<ResultadoMonitoriaData, 'tipo'> }) {
  return <ResultadoMonitoriaTemplate data={{ ...data, tipo: TIPO_VAGA_BOLSISTA }} />
}

export function ResultadoMonitoriaVoluntariaTemplate({ data }: { data: Omit<ResultadoMonitoriaData, 'tipo'> }) {
  return <ResultadoMonitoriaTemplate data={{ ...data, tipo: 'VOLUNTARIO' }} />
}
