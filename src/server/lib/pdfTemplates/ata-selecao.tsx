import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 65,
    lineHeight: 1.5,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  text: {
    fontSize: 11,
    marginBottom: 5,
    textAlign: 'justify',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 6,
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
    textAlign: 'left',
  },
  tableCellCenter: {
    flex: 1,
    textAlign: 'center',
  },
  tableCellNarrow: {
    width: 60,
    textAlign: 'center',
  },
  signature: {
    marginTop: 40,
    textAlign: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
    paddingBottom: 30,
    marginHorizontal: 50,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
})

export interface AtaSelecaoData {
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: string
    departamento: {
      nome: string
      sigla: string | null
    }
    professorResponsavel: {
      nomeCompleto: string
      matriculaSiape: string | null
    }
    disciplinas: Array<{
      codigo: string
      nome: string
    }>
  }
  candidatos: Array<{
    id: number
    aluno: {
      nomeCompleto: string
      matricula: string
      cr: number | null
    }
    tipoVagaPretendida: string | null
    notaDisciplina: number | null
    notaSelecao: number | null
    coeficienteRendimento: number | null
    notaFinal: number | null
    status: string
    observacoes?: string | null
  }>
  ataInfo: {
    dataSelecao: string
    localSelecao?: string | null
    observacoes?: string | null
  }
}

export function AtaSelecaoTemplate({ data }: { data: AtaSelecaoData }) {
  const formatSemestre = (semestre: string) => {
    return semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre'
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'SELECTED_BOLSISTA':
        return 'Selecionado (Bolsista)'
      case 'SELECTED_VOLUNTARIO':
        return 'Selecionado (Voluntário)'
      case 'REJECTED_BY_PROFESSOR':
        return 'Não Selecionado'
      case 'WAITING_LIST':
        return 'Lista de Espera'
      default:
        return status
    }
  }

  const candidatosOrdenados = [...data.candidatos].sort((a, b) => {
    const notaA = a.notaFinal || 0
    const notaB = b.notaFinal || 0
    return notaB - notaA // Ordem decrescente
  })

  const aprovados = candidatosOrdenados.filter(c => 
    c.status === 'SELECTED_BOLSISTA' || c.status === 'SELECTED_VOLUNTARIO'
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            UNIVERSIDADE FEDERAL DA BAHIA
          </Text>
          <Text style={styles.subtitle}>
            INSTITUTO DE COMPUTAÇÃO
          </Text>
          <Text style={styles.subtitle}>
            ATA DE SELEÇÃO DE MONITORES
          </Text>
        </View>

        {/* Informações do Projeto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMAÇÕES DO PROJETO</Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Projeto:</Text> {data.projeto.titulo}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Período:</Text> {data.projeto.ano}.{formatSemestre(data.projeto.semestre)}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Departamento:</Text> {data.projeto.departamento.nome} 
            {data.projeto.departamento.sigla && ` (${data.projeto.departamento.sigla})`}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Professor Responsável:</Text> {data.projeto.professorResponsavel.nomeCompleto}
            {data.projeto.professorResponsavel.matriculaSiape && ` - SIAPE: ${data.projeto.professorResponsavel.matriculaSiape}`}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Disciplinas:</Text>{' '}
            {data.projeto.disciplinas.map(d => `${d.codigo} - ${d.nome}`).join('; ')}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Data da Seleção:</Text> {data.ataInfo.dataSelecao}
          </Text>
          {data.ataInfo.localSelecao && (
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Local:</Text> {data.ataInfo.localSelecao}
            </Text>
          )}
        </View>

        {/* Candidatos Inscritos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CANDIDATOS INSCRITOS</Text>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Nome</Text>
              <Text style={styles.tableCellNarrow}>Matrícula</Text>
              <Text style={styles.tableCellNarrow}>CR</Text>
              <Text style={styles.tableCellNarrow}>Tipo</Text>
              <Text style={styles.tableCellNarrow}>N. Disc.</Text>
              <Text style={styles.tableCellNarrow}>N. Prova</Text>
              <Text style={styles.tableCellNarrow}>N. Final</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Situação</Text>
            </View>
            
            {candidatosOrdenados.map((candidato, index) => (
              <View key={candidato.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {candidato.aluno.nomeCompleto}
                </Text>
                <Text style={styles.tableCellNarrow}>
                  {candidato.aluno.matricula}
                </Text>
                <Text style={styles.tableCellNarrow}>
                  {candidato.aluno.cr?.toFixed(2) || '-'}
                </Text>
                <Text style={styles.tableCellNarrow}>
                  {candidato.tipoVagaPretendida === 'BOLSISTA' ? 'B' : 'V'}
                </Text>
                <Text style={styles.tableCellNarrow}>
                  {candidato.notaDisciplina?.toFixed(1) || '-'}
                </Text>
                <Text style={styles.tableCellNarrow}>
                  {candidato.notaSelecao?.toFixed(1) || '-'}
                </Text>
                <Text style={styles.tableCellNarrow}>
                  {candidato.notaFinal?.toFixed(1) || '-'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {formatStatus(candidato.status)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Resultado da Seleção */}
        {aprovados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESULTADO DA SELEÇÃO</Text>
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Candidatos Selecionados:</Text>
            </Text>
            
            {aprovados.map((candidato, index) => (
              <Text key={candidato.id} style={styles.text}>
                {index + 1}. {candidato.aluno.nomeCompleto} - {candidato.aluno.matricula} - {formatStatus(candidato.status)} 
                {candidato.notaFinal && ` (Nota: ${candidato.notaFinal.toFixed(1)})`}
              </Text>
            ))}
          </View>
        )}

        {/* Observações */}
        {data.ataInfo.observacoes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
            <Text style={styles.text}>{data.ataInfo.observacoes}</Text>
          </View>
        )}

        {/* Assinatura */}
        <View style={styles.signature}>
          <Text style={styles.text}>
            Salvador, {new Date().toLocaleDateString('pt-BR')}
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.text}>
            {data.projeto.professorResponsavel.nomeCompleto}
          </Text>
          <Text style={styles.text}>
            Professor Responsável
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Instituto de Computação - UFBA | Av. Adhemar de Barros, s/n - Ondina, Salvador - BA
        </Text>
      </Page>
    </Document>
  )
}