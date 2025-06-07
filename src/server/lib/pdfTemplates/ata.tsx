import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from '@react-pdf/renderer';

export interface AtaData {
  projetoTitulo: string;
  departamento: string;
  semestre: string;
  dataReuniao: string;
  professorResponsavel: string;
  candidatos: {
    classificacao: number;
    nome: string;
    matricula: string;
    notaFinal: number;
    status: 'Aprovado (Bolsista)' | 'Aprovado (Voluntário)' | 'Reprovado';
  }[];
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 60, height: 80, marginRight: 20 },
  headerText: { flexDirection: 'column' },
  universityName: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  departmentNamePDF: { fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 30 },
  paragraph: { fontSize: 11, lineHeight: 1.5, textAlign: 'justify', marginBottom: 20, textIndent: 30 },
  table: { borderTopWidth: 1, borderTopColor: '#000', marginTop: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bfbfbf', alignItems: 'center' },
  tableColHeader: { flex: 1, backgroundColor: '#E0E0E0', padding: 6, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableCol: { flex: 1, padding: 6, fontSize: 9 },
  signatureSection: { marginTop: 80 },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#000', width: 250, marginHorizontal: 'auto', paddingTop: 5, textAlign: 'center' },
});

export const AtaSelecaoTemplate = ({ data }: { data: AtaData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src="/images/logo-ufba.png" />
        <View style={styles.headerText}>
          <Text style={styles.universityName}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
          <Text style={styles.departmentNamePDF}>Pró - Reitoria de Ensino de Graduação</Text>
        </View>
      </View>
      <View>
        <Text style={styles.title}>ATA DA REUNIÃO DE SELEÇÃO DE MONITORES</Text>
        <Text style={styles.subtitle}>Projeto: {data.projetoTitulo}</Text>
      </View>

      <Text style={styles.paragraph}>
        Aos {data.dataReuniao}, reuniram-se os membros da banca de seleção do projeto de monitoria "{data.projetoTitulo}", vinculado ao Departamento de {data.departamento}, para o semestre letivo {data.semestre}, a fim de avaliar os candidatos inscritos e classificar os aprovados para as vagas de bolsistas e voluntários.
      </Text>
      <Text style={styles.paragraph}>
        Após análise curricular, entrevista e/ou prova de seleção, a comissão deliberou e obteve o seguinte resultado final:
      </Text>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{ ...styles.tableColHeader, flex: 0.5 }}><Text>Class.</Text></View>
          <View style={{ ...styles.tableColHeader, flex: 2.5 }}><Text>Nome do Candidato</Text></View>
          <View style={styles.tableColHeader}><Text>Matrícula</Text></View>
          <View style={styles.tableColHeader}><Text>Nota Final</Text></View>
          <View style={{ ...styles.tableColHeader, flex: 1.5 }}><Text>Situação</Text></View>
        </View>
        {data.candidatos.map((candidato) => (
          <View style={styles.tableRow} key={candidato.matricula}>
            <View style={{ ...styles.tableCol, flex: 0.5, textAlign: 'center' }}><Text>{candidato.classificacao}</Text></View>
            <View style={{ ...styles.tableCol, flex: 2.5 }}><Text>{candidato.nome}</Text></View>
            <View style={styles.tableCol}><Text>{candidato.matricula}</Text></View>
            <View style={{ ...styles.tableCol, textAlign: 'center' }}><Text>{candidato.notaFinal.toFixed(2)}</Text></View>
            <View style={{ ...styles.tableCol, flex: 1.5 }}><Text>{candidato.status}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureLine}>
            <Text>{data.professorResponsavel}</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Professor(a) Responsável</Text>
        </View>
      </View>
    </Page>
  </Document>
); 