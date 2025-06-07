import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from '@react-pdf/renderer';

// Define the structure of the data the edital will receive
export interface EditalData {
  numeroEdital: string;
  ano: number;
  semestre: 'SEMESTRE_1' | 'SEMESTRE_2';
  dataInicioInscricao: string;
  dataFimInscricao: string;
  titulo: string;
  descricaoHtml: string; // This will be simple text for now
  projetos: Array<{
    titulo: string;
    departamento: string;
    professorResponsavel: string;
    disciplinas: string;
    bolsasDisponibilizadas: number;
    voluntariosSolicitados: number;
  }>;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: 60, height: 80, marginRight: 15 },
  headerText: { flexDirection: 'column', alignItems: 'flex-start' },
  universityName: { fontSize: 12, fontWeight: 'bold' },
  departmentName: { fontSize: 10 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 3 },
  paragraph: { fontSize: 10, lineHeight: 1.5, textAlign: 'justify', marginBottom: 10 },
  table: { width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: '#bfbfbf' },
  tableRow: { flexDirection: "row", borderBottomColor: '#bfbfbf', borderBottomWidth: 1 },
  tableColHeader: { width: "20%", borderStyle: "solid", borderRightColor: '#bfbfbf', borderRightWidth: 1, backgroundColor: '#E0E0E0', padding: 5, fontSize: 9, fontWeight: 'bold' },
  tableCol: { width: "20%", borderStyle: "solid", borderRightColor: '#bfbfbf', borderRightWidth: 1, padding: 5, fontSize: 8 },
});

export const EditalTemplate = ({ data }: { data: EditalData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src={'/images/logo-ufba.png'} />
        <View style={styles.headerText}>
          <Text style={styles.universityName}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
          <Text style={styles.departmentName}>Pró-Reitoria de Ensino de Graduação</Text>
        </View>
      </View>

      <Text style={styles.title}>
        EDITAL INTERNO DE SELEÇÃO DE MONITORES Nº {data.numeroEdital}/{data.ano}
      </Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. DO OBJETO</Text>
        <Text style={styles.paragraph}>
          O presente edital tem por objeto a seleção de estudantes de graduação para o Programa de Monitoria do Instituto de Computação para o semestre letivo de {data.ano}.{data.semestre === 'SEMESTRE_1' ? '1' : '2'}.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. DAS INSCRIÇÕES</Text>
        <Text style={styles.paragraph}>
          As inscrições estarão abertas no período de {data.dataInicioInscricao} a {data.dataFimInscricao}, e deverão ser realizadas exclusivamente através do Sistema de Monitoria do IC.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. DAS VAGAS</Text>
        <Text style={styles.paragraph}>
          As vagas estão distribuídas entre os projetos de monitoria aprovados, conforme a tabela abaixo:
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text>Projeto</Text></View>
            <View style={styles.tableColHeader}><Text>Departamento</Text></View>
            <View style={styles.tableColHeader}><Text>Professor Responsável</Text></View>
            <View style={styles.tableColHeader}><Text>Vagas Bolsista</Text></View>
            <View style={styles.tableColHeader}><Text>Vagas Voluntário</Text></View>
          </View>
          {data.projetos.map((projeto, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}><Text>{projeto.titulo}</Text></View>
              <View style={styles.tableCol}><Text>{projeto.departamento}</Text></View>
              <View style={styles.tableCol}><Text>{projeto.professorResponsavel}</Text></View>
              <View style={styles.tableCol}><Text>{projeto.bolsasDisponibilizadas}</Text></View>
              <View style={styles.tableCol}><Text>{projeto.voluntariosSolicitados}</Text></View>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. DISPOSIÇÕES FINAIS</Text>
        <Text style={styles.paragraph}>
          {data.descricaoHtml || 'Os casos omissos neste edital serão resolvidos pela Coordenação de Ensino de Graduação.'}
        </Text>
      </View>
    </Page>
  </Document>
); 