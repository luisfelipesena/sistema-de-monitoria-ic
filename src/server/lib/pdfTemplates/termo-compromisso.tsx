import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (optional, but good for better text rendering)
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 11,
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 10,
  },
  universityName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  departmentName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paragraph: {
    textAlign: 'justify',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '30%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  tableCol: {
    width: '70%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    paddingTop: 5,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
  clauseNumber: {
    fontWeight: 'bold',
  },
})

export interface TermoCompromissoData {
  monitor: {
    nome: string
    matricula: string
    email: string
    telefone?: string
    cr: number
  }
  professor: {
    nome: string
    matriculaSiape?: string
    email: string
    departamento: string
  }
  projeto: {
    titulo: string
    disciplinas: Array<{
      codigo: string
      nome: string
    }>
    ano: number
    semestre: string
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  monitoria: {
    tipo: 'BOLSISTA' | 'VOLUNTARIO'
    dataInicio: string
    dataFim: string
    valorBolsa?: number
  }
  termo: {
    numero: string
    dataGeracao: string
  }
}

export default function TermoCompromisso({ data }: { data: TermoCompromissoData }) {
  const { monitor, professor, projeto, monitoria, termo } = data

  const semestre = projeto.semestre === 'SEMESTRE_1' ? '1º' : '2º'
  const cargaHorariaTotal = projeto.cargaHorariaSemana * projeto.numeroSemanas
  const tipoMonitoria = monitoria.tipo === 'BOLSISTA' ? 'Bolsista' : 'Voluntária'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.universityName}>
            UNIVERSIDADE FEDERAL DA BAHIA
          </Text>
          <Text style={styles.departmentName}>
            INSTITUTO DE COMPUTAÇÃO
          </Text>
          <Text style={styles.departmentName}>
            COORDENAÇÃO DE MONITORIA
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          TERMO DE COMPROMISSO DE MONITORIA {tipoMonitoria.toUpperCase()}
        </Text>
        <Text style={[styles.paragraph, { textAlign: 'center', fontSize: 10, marginBottom: 20 }]}>
          Termo nº {termo.numero} - {projeto.ano}.{projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}
        </Text>

        {/* Monitor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. DADOS DO MONITOR</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Nome Completo:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{monitor.nome}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Matrícula:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{monitor.matricula}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>E-mail:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{monitor.email}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>CR:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{monitor.cr.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. DADOS DO PROJETO</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Título:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{projeto.titulo}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Professor Responsável:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{professor.nome}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Disciplina(s):</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {projeto.disciplinas.map(d => `${d.codigo} - ${d.nome}`).join('; ')}
                </Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Período:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{projeto.ano}.{semestre}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Carga Horária:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {projeto.cargaHorariaSemana}h/semana - Total: {cargaHorariaTotal}h
                </Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Tipo de Monitoria:</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {tipoMonitoria}
                  {monitoria.tipo === 'BOLSISTA' && monitoria.valorBolsa && 
                    ` - Valor: R$ ${monitoria.valorBolsa.toFixed(2)}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. CLÁUSULAS E CONDIÇÕES</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.clauseNumber}>3.1.</Text> O monitor compromete-se a cumprir fielmente as atividades 
            de monitoria conforme estabelecido no projeto de monitoria aprovado, sob orientação do professor responsável.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.clauseNumber}>3.2.</Text> O monitor deverá cumprir a carga horária de {projeto.cargaHorariaSemana} 
            horas semanais, totalizando {cargaHorariaTotal} horas durante o período de vigência da monitoria.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.clauseNumber}>3.3.</Text> O monitor deverá manter postura ética e profissional adequada, 
            sendo vedado o exercício de atividades incompatíveis com a função de monitor.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.clauseNumber}>3.4.</Text> O monitor deverá elaborar e entregar relatórios periódicos 
            de atividades conforme cronograma estabelecido pelo professor responsável.
          </Text>

          {monitoria.tipo === 'BOLSISTA' && (
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>3.5.</Text> O monitor bolsista receberá auxílio financeiro mensal 
              {monitoria.valorBolsa && ` no valor de R$ ${monitoria.valorBolsa.toFixed(2)}`}, 
              condicionado ao cumprimento das atividades estabelecidas.
            </Text>
          )}

          <Text style={styles.paragraph}>
            <Text style={styles.clauseNumber}>
              {monitoria.tipo === 'BOLSISTA' ? '3.6.' : '3.5.'}
            </Text> O descumprimento das obrigações estabelecidas neste termo poderá resultar 
            no cancelamento da monitoria, sem direito a indenização.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.clauseNumber}>
              {monitoria.tipo === 'BOLSISTA' ? '3.7.' : '3.6.'}
            </Text> A vigência deste termo é de {monitoria.dataInicio} a {monitoria.dataFim}, 
            podendo ser renovado conforme regulamentação vigente.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Monitor</Text>
            <Text style={[styles.signatureLabel, { marginTop: 5, fontSize: 9 }]}>
              {monitor.nome}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Professor Responsável</Text>
            <Text style={[styles.signatureLabel, { marginTop: 5, fontSize: 9 }]}>
              {professor.nome}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Salvador, {termo.dataGeracao} | Documento gerado pelo Sistema de Monitoria IC-UFBA
          </Text>
        </View>
      </Page>
    </Document>
  )
}