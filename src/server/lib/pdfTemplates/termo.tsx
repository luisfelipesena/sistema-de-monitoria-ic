import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Registrar fontes (mesmo padrão dos outros templates)
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 11,
    padding: 40,
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  instituicao: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  departamento: {
    fontSize: 12,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  paragrafo: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  clausulaHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  clausulaContent: {
    marginBottom: 10,
    textAlign: 'justify',
    paddingLeft: 10,
  },
  dadosSecao: {
    marginTop: 20,
    marginBottom: 15,
  },
  dadosHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dadosItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dadosLabel: {
    width: 140,
    fontWeight: 'bold',
  },
  dadosValue: {
    flex: 1,
  },
  assinaturaSecao: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assinaturaBox: {
    width: '45%',
    textAlign: 'center',
  },
  assinaturaLinha: {
    borderTop: '1 solid #000',
    marginBottom: 5,
    paddingTop: 50,
  },
  assinaturaTexto: {
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
  destaque: {
    fontWeight: 'bold',
  },
})

export interface TermoCompromissoProps {
  vaga: {
    id: string
    tipoBolsa: 'bolsista' | 'voluntario'
    dataInicio: Date
    aluno: {
      user: {
        name: string
        email: string
      }
      matricula?: string
      rg?: string
      cpf?: string
    }
    projeto: {
      disciplina: {
        nome: string
        codigo?: string
        departamento: {
          nome: string
          sigla: string
        }
      }
      professor: {
        user: {
          name: string
          email: string
        }
        siape?: string
      }
    }
    semestre: {
      ano: number
      numero: number
    }
  }
  dataGeracao: Date
}

export function TermoCompromissoTemplate({ vaga, dataGeracao }: TermoCompromissoProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).format(date)
  }

  const tipoMonitoria = vaga.tipoBolsa === 'bolsista' ? 'COM BOLSA' : 'VOLUNTÁRIA'
  const semestreTexto = `${vaga.semestre.ano}.${vaga.semestre.numero}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>UFBA</Text>
          <Text style={styles.instituicao}>
            UNIVERSIDADE FEDERAL DA BAHIA
          </Text>
          <Text style={styles.departamento}>
            {vaga.projeto.disciplina.departamento.nome} - {vaga.projeto.disciplina.departamento.sigla}
          </Text>
        </View>

        {/* Título */}
        <Text style={styles.titulo}>
          TERMO DE COMPROMISSO - MONITORIA {tipoMonitoria}
        </Text>

        {/* Dados do Monitor */}
        <View style={styles.dadosSecao}>
          <Text style={styles.dadosHeader}>Dados do Monitor</Text>
          <View style={styles.dadosItem}>
            <Text style={styles.dadosLabel}>Nome:</Text>
            <Text style={styles.dadosValue}>{vaga.aluno.user.name}</Text>
          </View>
          <View style={styles.dadosItem}>
            <Text style={styles.dadosLabel}>Email:</Text>
            <Text style={styles.dadosValue}>{vaga.aluno.user.email}</Text>
          </View>
          {vaga.aluno.matricula && (
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>Matrícula:</Text>
              <Text style={styles.dadosValue}>{vaga.aluno.matricula}</Text>
            </View>
          )}
          {vaga.aluno.rg && (
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>RG:</Text>
              <Text style={styles.dadosValue}>{vaga.aluno.rg}</Text>
            </View>
          )}
          {vaga.aluno.cpf && (
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>CPF:</Text>
              <Text style={styles.dadosValue}>{vaga.aluno.cpf}</Text>
            </View>
          )}
        </View>

        {/* Dados da Monitoria */}
        <View style={styles.dadosSecao}>
          <Text style={styles.dadosHeader}>Dados da Monitoria</Text>
          <View style={styles.dadosItem}>
            <Text style={styles.dadosLabel}>Disciplina:</Text>
            <Text style={styles.dadosValue}>
              {vaga.projeto.disciplina.nome}
              {vaga.projeto.disciplina.codigo && ` (${vaga.projeto.disciplina.codigo})`}
            </Text>
          </View>
          <View style={styles.dadosItem}>
            <Text style={styles.dadosLabel}>Professor Orientador:</Text>
            <Text style={styles.dadosValue}>{vaga.projeto.professor.user.name}</Text>
          </View>
          {vaga.projeto.professor.siape && (
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>SIAPE:</Text>
              <Text style={styles.dadosValue}>{vaga.projeto.professor.siape}</Text>
            </View>
          )}
          <View style={styles.dadosItem}>
            <Text style={styles.dadosLabel}>Tipo de Monitoria:</Text>
            <Text style={styles.dadosValue}>{tipoMonitoria}</Text>
          </View>
          <View style={styles.dadosItem}>
            <Text style={styles.dadosLabel}>Semestre:</Text>
            <Text style={styles.dadosValue}>{semestreTexto}</Text>
          </View>
          <View style={styles.dadosItem}>
            <Text style={styles.dadosLabel}>Data de Início:</Text>
            <Text style={styles.dadosValue}>{formatDate(vaga.dataInicio)}</Text>
          </View>
        </View>

        {/* Termo */}
        <Text style={styles.paragrafo}>
          Pelo presente termo, o(a) estudante acima identificado(a) se compromete a exercer as atividades 
          de monitoria na disciplina especificada, sob a orientação do professor responsável, durante o 
          período letivo {semestreTexto}.
        </Text>

        {/* Cláusulas */}
        <Text style={styles.clausulaHeader}>CLÁUSULA 1ª - DAS RESPONSABILIDADES DO MONITOR</Text>
        <Text style={styles.clausulaContent}>
          O monitor se compromete a:
        </Text>
        <Text style={styles.clausulaContent}>
          a) Auxiliar o professor nas atividades didáticas e de pesquisa relacionadas à disciplina;
        </Text>
        <Text style={styles.clausulaContent}>
          b) Atender aos estudantes regularmente matriculados na disciplina, esclarecendo dúvidas e 
          orientando estudos;
        </Text>
        <Text style={styles.clausulaContent}>
          c) Participar das reuniões e atividades de capacitação promovidas pelo programa;
        </Text>
        <Text style={styles.clausulaContent}>
          d) Manter sigilo sobre as informações acadêmicas dos estudantes;
        </Text>
        <Text style={styles.clausulaContent}>
          e) Cumprir a carga horária estabelecida pelo programa de monitoria.
        </Text>

        <Text style={styles.clausulaHeader}>CLÁUSULA 2ª - DAS RESPONSABILIDADES DO PROFESSOR ORIENTADOR</Text>
        <Text style={styles.clausulaContent}>
          O professor orientador se compromete a:
        </Text>
        <Text style={styles.clausulaContent}>
          a) Planejar e acompanhar as atividades de monitoria;
        </Text>
        <Text style={styles.clausulaContent}>
          b) Orientar o monitor no desenvolvimento de suas atividades;
        </Text>
        <Text style={styles.clausulaContent}>
          c) Avaliar o desempenho do monitor periodicamente;
        </Text>
        <Text style={styles.clausulaContent}>
          d) Fornecer os recursos necessários para o desenvolvimento das atividades.
        </Text>

        <Text style={styles.clausulaHeader}>CLÁUSULA 3ª - DA VIGÊNCIA</Text>
        <Text style={styles.clausulaContent}>
          Este termo tem vigência durante todo o período letivo {semestreTexto}, podendo ser rescindido 
          a qualquer tempo por descumprimento das obrigações estabelecidas ou por solicitação das partes.
        </Text>

        {vaga.tipoBolsa === 'bolsista' && (
          <>
            <Text style={styles.clausulaHeader}>CLÁUSULA 4ª - DA BOLSA</Text>
            <Text style={styles.clausulaContent}>
              O monitor fará jus ao recebimento de bolsa conforme valor estabelecido pela PROGRAD, 
              condicionado ao cumprimento integral de suas obrigações.
            </Text>
          </>
        )}

        <Text style={styles.paragrafo}>
          As partes declaram estar cientes e de acordo com os termos estabelecidos, firmando o presente 
          compromisso em duas vias de igual teor.
        </Text>

        {/* Data e Local */}
        <Text style={styles.paragrafo}>
          Salvador, {formatDate(dataGeracao)}.
        </Text>

        {/* Assinaturas */}
        <View style={styles.assinaturaSecao}>
          <View style={styles.assinaturaBox}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaTexto}>
              {vaga.aluno.user.name}
            </Text>
            <Text style={styles.assinaturaTexto}>
              Monitor(a)
            </Text>
          </View>

          <View style={styles.assinaturaBox}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaTexto}>
              {vaga.projeto.professor.user.name}
            </Text>
            <Text style={styles.assinaturaTexto}>
              Professor(a) Orientador(a)
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Documento gerado pelo Sistema de Monitoria IC - UFBA em {formatDate(dataGeracao)}
        </Text>
      </Page>
    </Document>
  )
}