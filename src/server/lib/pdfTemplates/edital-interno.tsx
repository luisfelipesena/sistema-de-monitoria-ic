import { SEMESTRE_LABELS, type Semestre, type TipoMonitoria } from "@/types"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 65,
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1976d2",
  },
  text: {
    fontSize: 11,
    marginBottom: 5,
    textAlign: "justify",
  },
  textBold: {
    fontSize: 11,
    marginBottom: 5,
    fontWeight: "bold",
  },
  list: {
    marginLeft: 20,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 11,
    marginBottom: 3,
    textAlign: "justify",
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 8,
    fontWeight: "bold",
    fontSize: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 6,
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
    textAlign: "left",
    paddingHorizontal: 4,
  },
  tableCellCenter: {
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  tableCellNarrow: {
    width: 80,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  signature: {
    marginTop: 40,
    textAlign: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 5,
    paddingBottom: 30,
    marginHorizontal: 50,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 9,
    color: "#666",
  },
})

export interface EditalInternoData {
  numeroEdital: string
  ano: number
  semestre: Semestre
  titulo: string
  descricao?: string
  periodoInscricao: {
    dataInicio: string
    dataFim: string
  }
  formularioInscricaoUrl?: string
  dataDivulgacao?: string
  chefeResponsavel?: {
    nome: string
    cargo: string
  }
  disciplinas: Array<{
    codigo: string
    nome: string
    professor: {
      nome: string
      email?: string
    }
    tipoMonitoria: TipoMonitoria
    numTurmas?: number
    numBolsistas: number
    numVoluntarios: number
    pontosSelecao?: string[]
    bibliografia?: string[]
    dataSelecao?: string
    horarioSelecao?: string
  }>
  observacoes?: string
  equivalencias?: Array<{
    disciplina1: string
    disciplina2: string
  }>
}

export function EditalInternoTemplate({ data }: { data: EditalInternoData }) {
  const formatSemestre = (semestre: Semestre) => {
    return SEMESTRE_LABELS[semestre]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
          <Text style={styles.subtitle}>INSTITUTO DE COMPUTAÇÃO</Text>
          <Text style={styles.subtitle}>DEPARTAMENTO DE CIÊNCIA DA COMPUTAÇÃO</Text>
          <Text style={[styles.title, { marginTop: 20 }]}>
            EDITAL Nº {data.numeroEdital}/{data.ano}
          </Text>
          <Text style={styles.subtitle}>
            {data.titulo || `PROGRAMA DE MONITORIA - ${formatSemestre(data.semestre)} ${data.ano}`}
          </Text>
        </View>

        {/* Descrição/Introdução */}
        <View style={styles.section}>
          <Text style={styles.text}>
            {data.descricao ||
              `O Departamento de Ciência da Computação (DCC) do Instituto de Computação da UFBA 
            torna público o presente edital para seleção de monitores para o ${formatSemestre(data.semestre)} 
            de ${data.ano}, conforme as normas estabelecidas pela Resolução 04/2019 do CONSEPE.`}
          </Text>
        </View>

        {/* 1. Das Inscrições */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. DAS INSCRIÇÕES</Text>
          <Text style={styles.text}>
            As inscrições para o Programa de Monitoria deverão ser realizadas no período de{" "}
            <Text style={{ fontWeight: "bold" }}>
              {formatDate(data.periodoInscricao.dataInicio)} a {formatDate(data.periodoInscricao.dataFim)}
            </Text>
            , exclusivamente através do formulário eletrônico disponível em:
          </Text>
          {data.formularioInscricaoUrl && (
            <Text style={[styles.text, { color: "#1976d2", textDecoration: "underline" }]}>
              {data.formularioInscricaoUrl}
            </Text>
          )}
        </View>

        {/* 2. Dos Documentos Necessários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. DOS DOCUMENTOS NECESSÁRIOS</Text>
          <Text style={styles.text}>O candidato deverá anexar os seguintes documentos no ato da inscrição:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>a) Formulário de inscrição devidamente preenchido e assinado;</Text>
            <Text style={styles.listItem}>b) Termo de compromisso assinado;</Text>
            <Text style={styles.listItem}>c) Cópia da carteira de identidade;</Text>
            <Text style={styles.listItem}>d) Cópia do CPF;</Text>
            <Text style={styles.listItem}>e) Histórico escolar atualizado.</Text>
          </View>
        </View>

        {/* 3. Das Disciplinas e Vagas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. DAS DISCIPLINAS E VAGAS OFERECIDAS</Text>
          <Text style={styles.text}>Estão sendo oferecidas as seguintes vagas para monitoria:</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Disciplina</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Professor Responsável</Text>
              <Text style={styles.tableCellNarrow}>Bolsistas</Text>
              <Text style={styles.tableCellNarrow}>Voluntários</Text>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>Data/Horário Seleção</Text>
            </View>

            {data.disciplinas.map((disciplina, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {disciplina.codigo} - {disciplina.nome}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{disciplina.professor.nome}</Text>
                <Text style={styles.tableCellNarrow}>{disciplina.numBolsistas}</Text>
                <Text style={styles.tableCellNarrow}>{disciplina.numVoluntarios}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>
                  {disciplina.dataSelecao && disciplina.horarioSelecao
                    ? `${formatDate(disciplina.dataSelecao)} ${disciplina.horarioSelecao}`
                    : "A definir"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Do Processo Seletivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. DO PROCESSO SELETIVO</Text>
          <Text style={styles.text}>
            O processo seletivo será realizado mediante prova específica para cada disciplina, considerando o conteúdo
            programático e bibliografia indicados pelo professor responsável.
          </Text>
          <Text style={styles.text}>
            A nota final será calculada pela média ponderada entre a nota obtida na disciplina (peso 4), o coeficiente
            de rendimento (peso 3) e a nota da prova de seleção (peso 3).
          </Text>
        </View>

        {/* Equivalências (se houver) */}
        {data.equivalencias && data.equivalencias.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. DAS EQUIVALÊNCIAS</Text>
            <Text style={styles.text}>
              Para efeito de monitoria, são consideradas equivalentes as seguintes disciplinas:
            </Text>
            <View style={styles.list}>
              {data.equivalencias.map((equiv, index) => (
                <Text key={index} style={styles.listItem}>
                  • {equiv.disciplina1} = {equiv.disciplina2}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Divulgação dos Resultados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {data.equivalencias && data.equivalencias.length > 0 ? "6" : "5"}. DA DIVULGAÇÃO DOS RESULTADOS
          </Text>
          <Text style={styles.text}>
            Os resultados das seleções serão divulgados{" "}
            {data.dataDivulgacao
              ? `até o dia ${formatDate(data.dataDivulgacao)}`
              : "conforme cronograma estabelecido pelos professores responsáveis"}
            , através do sistema de monitoria e comunicação direta aos candidatos.
          </Text>
        </View>

        {/* Observações Adicionais */}
        {data.observacoes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
            <Text style={styles.text}>{data.observacoes}</Text>
          </View>
        )}

        {/* Disposições Finais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DISPOSIÇÕES FINAIS</Text>
          <Text style={styles.text}>Os casos omissos serão resolvidos pela Comissão de Monitoria do DCC.</Text>
        </View>

        {/* Data e Assinatura */}
        <View style={styles.signature}>
          <Text style={styles.text}>Salvador, {new Date().toLocaleDateString("pt-BR")}</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.text}>{data.chefeResponsavel?.nome || "Prof. Dr. [Nome do Chefe]"}</Text>
          <Text style={styles.text}>
            {data.chefeResponsavel?.cargo || "Chefe do Departamento de Ciência da Computação"}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Instituto de Computação - UFBA | Av. Adhemar de Barros, s/n - Ondina, Salvador - BA
        </Text>
      </Page>

      {/* Segunda página com pontos e bibliografia por disciplina */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ANEXO I - CONTEÚDO PROGRAMÁTICO E BIBLIOGRAFIA</Text>
          <Text style={styles.subtitle}>
            EDITAL Nº {data.numeroEdital}/{data.ano}
          </Text>
        </View>

        {data.disciplinas.map((disciplina, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {disciplina.codigo} - {disciplina.nome}
            </Text>
            <Text style={styles.textBold}>Professor: {disciplina.professor.nome}</Text>

            {disciplina.pontosSelecao && disciplina.pontosSelecao.length > 0 && (
              <>
                <Text style={[styles.textBold, { marginTop: 10 }]}>Pontos para Seleção:</Text>
                <View style={styles.list}>
                  {disciplina.pontosSelecao.map((ponto, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      {idx + 1}. {ponto}
                    </Text>
                  ))}
                </View>
              </>
            )}

            {disciplina.bibliografia && disciplina.bibliografia.length > 0 && (
              <>
                <Text style={[styles.textBold, { marginTop: 10 }]}>Bibliografia:</Text>
                <View style={styles.list}>
                  {disciplina.bibliografia.map((ref, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {ref}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Instituto de Computação - UFBA | Av. Adhemar de Barros, s/n - Ondina, Salvador - BA
        </Text>
      </Page>
    </Document>
  )
}
