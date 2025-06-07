import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

export interface ResultadoData {
  projetoTitulo: string;
  departamento: string;
  semestre: string;
  dataPublicacao: string;
  aprovados: {
    nome: string;
    matricula: string;
    tipoVaga: 'Bolsista' | 'Voluntário';
  }[];
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 30 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 30, color: '#555' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 3 },
  table: { borderTopWidth: 1, borderTopColor: '#000', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bfbfbf', alignItems: 'center' },
  tableColHeader: { flex: 1, backgroundColor: '#E0E0E0', padding: 6, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableCol: { flex: 1, padding: 6, fontSize: 9 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: 'grey' },
});

export const ResultadoSelecaoTemplate = ({ data }: { data: ResultadoData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>RESULTADO FINAL DA SELEÇÃO DE MONITORIA</Text>
        <Text style={styles.subtitle}>Projeto: {data.projetoTitulo}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Candidatos Aprovados - {data.semestre}</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={{...styles.tableColHeader, flex: 3}}><Text>Nome do Candidato</Text></View>
            <View style={{...styles.tableColHeader, flex: 1.5}}><Text>Matrícula</Text></View>
            <View style={{...styles.tableColHeader, flex: 1.5}}><Text>Tipo da Vaga</Text></View>
          </View>
          {data.aprovados.map((aprovado) => (
            <View style={styles.tableRow} key={aprovado.matricula}>
              <View style={{...styles.tableCol, flex: 3}}><Text>{aprovado.nome}</Text></View>
              <View style={{...styles.tableCol, flex: 1.5}}><Text>{aprovado.matricula}</Text></View>
              <View style={{...styles.tableCol, flex: 1.5}}><Text>{aprovado.tipoVaga}</Text></View>
            </View>
          ))}
        </View>
      </View>
      
      <Text style={styles.footer}>
        Publicado em {data.dataPublicacao}. Os candidatos aprovados devem verificar seu email para os próximos passos.
      </Text>
    </Page>
  </Document>
); 