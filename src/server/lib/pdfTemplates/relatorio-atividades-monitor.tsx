import { PDF_PAGE_SIZE_A4 } from '@/constants/pdf'
import { RelatorioAtividadesMonitorData, TIPO_VAGA_BOLSISTA } from '@/types'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 40,
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  headerLine: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#e0e0e0',
    padding: 5,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#000',
    borderBottomWidth: 0,
  },
  infoRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
  },
  infoLabel: {
    width: '100%',
    padding: 5,
    fontSize: 10,
  },
  textAreaSection: {
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    minHeight: 100,
    padding: 10,
  },
  textAreaSectionTall: {
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    minHeight: 150,
    padding: 10,
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    padding: 10,
    alignItems: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dotted',
    width: '70%',
    marginTop: 20,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  parecerRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
  },
  parecerLabel: {
    flex: 1,
    padding: 5,
    fontSize: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 3,
    textAlign: 'center',
    fontSize: 8,
  },
  checkboxLabel: {
    fontSize: 10,
    marginRight: 15,
  },
  notaFrequenciaRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
  },
  notaCol: {
    width: '50%',
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
  },
  frequenciaCol: {
    width: '50%',
    padding: 5,
    fontSize: 10,
  },
  aprovacaoSection: {
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    padding: 10,
    minHeight: 60,
  },
  aprovacaoText: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 30,
  },
})

export function RelatorioAtividadesMonitorTemplate({ data }: { data: RelatorioAtividadesMonitorData }) {
  const modalidadeTexto = data.monitor.modalidade === TIPO_VAGA_BOLSISTA ? 'Bolsista' : 'Voluntário'

  return (
    <Document>
      <Page size={PDF_PAGE_SIZE_A4} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLine}>UFBA - Universidade Federal da Bahia</Text>
          <Text style={styles.headerLine}>PROGRAD - Pró-Reitoria de Ensino de Graduação</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Anexo II</Text>
        <Text style={styles.subtitle}>RELATÓRIO DE ATIVIDADES DO MONITOR</Text>

        {/* Section 1: INFORMAÇÕES DO PROJETO */}
        <Text style={styles.sectionTitle}>1. INFORMAÇÕES DO PROJETO</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>1.1. Unidade Universitária: {data.projeto.unidadeUniversitaria}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            1.2. Órgão responsável (Departamento ou Coord. Acadêmica): {data.projeto.orgaoResponsavel}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            1.3. Componente curricular (código e nome): {data.projeto.componenteCurricular}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>1.4. Professor(a) orientador(a): {data.projeto.professorOrientador}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>1.5. Semestre letivo: {data.projeto.semestreLetivo}</Text>
        </View>

        {/* Section 2: INFORMAÇÕES DO MONITOR */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>2. INFORMAÇÕES DO MONITOR</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>2.1. Nome completo: {data.monitor.nomeCompleto}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>2.2. Modalidade (bolsista ou voluntário): {modalidadeTexto}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            2.3. Período de atuação (data de início e data de término): {data.monitor.periodoAtuacao}
          </Text>
        </View>

        {/* Section 3: RELATÓRIO DE ATIVIDADES */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
          3. RELATÓRIO DE ATIVIDADES (a ser preenchido pelo monitor)
        </Text>
        <View style={styles.textAreaSectionTall}>
          <Text style={{ fontSize: 10, lineHeight: 1.6 }}>{data.relatorioAtividades || ''}</Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Assinatura do(a) monitor(a)</Text>
          {data.dataAssinaturaMonitor && (
            <Text style={[styles.signatureLabel, { marginTop: 5 }]}>Data: {data.dataAssinaturaMonitor}</Text>
          )}
        </View>

        {/* Section 4: PARECER AVALIATIVO */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
          4. PARECER AVALIATIVO REFERENTE AO DESEMPENHO DO MONITOR (a ser preenchido pelo orientador)
        </Text>
        <View style={styles.textAreaSection}>
          <Text style={{ fontSize: 10, lineHeight: 1.6 }}>{data.parecer.textoAvaliacao || ''}</Text>
        </View>
        <View style={styles.parecerRow}>
          <Text style={styles.parecerLabel}>
            4.1. O monitor cumpriu a carga horária obrigatória de 12 horas semanais?{' '}
            <Text style={{ fontWeight: 'bold' }}>( {data.parecer.cumpriuCargaHoraria ? 'X' : ' '} ) Sim</Text>{' '}
            <Text style={{ fontWeight: 'bold' }}>( {!data.parecer.cumpriuCargaHoraria ? 'X' : ' '} ) Não</Text>
          </Text>
        </View>
        <View style={styles.notaFrequenciaRow}>
          <Text style={styles.notaCol}>4.2. Nota (0 a 10): {data.parecer.nota.toFixed(1)}</Text>
          <Text style={styles.frequenciaCol}>4.3. Frequência (0 a 100%): {data.parecer.frequencia}%</Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Assinatura do(a) professor(a) orientador(a)</Text>
          {data.dataAssinaturaProfessor && (
            <Text style={[styles.signatureLabel, { marginTop: 5 }]}>Data: {data.dataAssinaturaProfessor}</Text>
          )}
        </View>

        {/* Section 5: APROVAÇÃO DO ÓRGÃO RESPONSÁVEL */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>5. APROVAÇÃO DO ÓRGÃO RESPONSÁVEL</Text>
        <View style={styles.aprovacaoSection}>
          <Text style={styles.aprovacaoText}>
            {data.aprovacaoOrgao?.dataAprovacao || '........./........./.............'},{' '}
            {data.aprovacaoOrgao?.assinaturaChefe ||
              '...............................................................................................................'}
          </Text>
          <Text style={[styles.signatureLabel, { marginTop: 10 }]}>
            Data de aprovação e Assinatura do(a) Chefe do órgão responsável pelo componente curricular
          </Text>
        </View>
      </Page>
    </Document>
  )
}
