import { GENERO_FEMININO, GENERO_MASCULINO, GENERO_OUTRO, type AnexoIIIInputs } from '@/types'
import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'
import { anexoStyles, formatDateBR, formatDateFullBR } from './anexo-shared-styles'
import { UfbaPrograd } from './ufba-header'

function mark(active: boolean) {
  return active ? 'x' : ' '
}

function formatEnderecoCompleto(e: AnexoIIIInputs['monitor']['endereco']): string {
  const parts = [e.rua, e.numero ? String(e.numero) : '', e.bairro, e.cidade, e.estado, e.cep].filter(Boolean)
  return parts.join(', ')
}

export function AnexoIIIInscricaoBolsistaTemplate({ data }: { data: AnexoIIIInputs }) {
  const { monitor, projeto, declaracao, signature } = data
  const hoje = signature?.data ?? new Date()

  return (
    <Document>
      <Page size="A4" style={anexoStyles.page}>
        <UfbaPrograd />
        <Text style={anexoStyles.formTitle}>ANEXO III – FORMULÁRIO DE INSCRIÇÃO DE MONITOR BOLSISTA</Text>

        {/* ==================== SECTION 1: DADOS DA MONITORIA ==================== */}
        <View style={anexoStyles.table}>
          <View style={anexoStyles.sectionHeaderRow}>
            <Text style={anexoStyles.sectionHeaderText}>1. DADOS DA MONITORIA</Text>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>1.1 Unidade Universitária: {projeto.unidadeUniversitaria}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>1.2 Órgão responsável (Departamento ou Coord. Acadêmica): {projeto.departamentoNome}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>
                1.3 Componente(s) curricular(es) (código e nome): {projeto.disciplina.codigo} - {projeto.disciplina.nome}
              </Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>1.4 Professor(a) responsável pelo projeto: {projeto.professorResponsavelNome}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>1.5 Professor(a) orientador(a): {projeto.professorOrientadorNome}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>
                1.6 Período pretendido para atuação do(a) monitor(a): Início: {formatDateBR(projeto.periodoInicio)}{' '}
                Término: {formatDateBR(projeto.periodoFim)}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== SECTION 2: DADOS DO MONITOR ==================== */}
        <View style={[anexoStyles.table, { marginTop: 6 }]}>
          <View style={anexoStyles.sectionHeaderRow}>
            <Text style={anexoStyles.sectionHeaderText}>2. DADOS DO(A) MONITOR(A)</Text>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>2.1 Nome Completo: {monitor.nomeCompleto}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>2.2 Nome Social (se houver): {monitor.nomeSocial ?? ''}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={[anexoStyles.cell, { flex: 1.1 }]}>
              <Text>2.3 CPF: {monitor.cpf}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1 }]}>
              <Text>2.4 RG: {monitor.rg}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1, borderRightWidth: 0 }]}>
              <Text>2.5 Matrícula: {monitor.matricula}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={[anexoStyles.cell, { flex: 1 }]}>
              <Text>2.6 Data de Nascimento: {formatDateFullBR(monitor.dataNascimento)}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 2, borderRightWidth: 0 }]}>
              <Text>
                2.7 Gênero: Feminino ( {mark(monitor.genero === GENERO_FEMININO)} ) Masculino (
                {mark(monitor.genero === GENERO_MASCULINO)} ) Outro ( {mark(monitor.genero === GENERO_OUTRO)} ):
              </Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>2.8 Endereço residencial completo: {formatEnderecoCompleto(monitor.endereco)}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={[anexoStyles.cell, { flex: 1.3 }]}>
              <Text>Bairro: {monitor.endereco.bairro}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1 }]}>
              <Text>CEP: {monitor.endereco.cep}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1.1 }]}>
              <Text>Cidade: {monitor.endereco.cidade}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 0.9, borderRightWidth: 0 }]}>
              <Text>Estado: {monitor.endereco.estado}</Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={[anexoStyles.cell, { flex: 1 }]}>
              <Text>2.9 Tel. Fixo: {monitor.telefoneFixo ?? ''}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1.1 }]}>
              <Text>2.10 Celular: {monitor.telefone ?? ''}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1.6, borderRightWidth: 0 }]}>
              <Text>2.11 E-mail: {monitor.email}</Text>
            </View>
          </View>
        </View>

        {/* ==================== SECTION 3: DADOS BANCÁRIOS ==================== */}
        <View style={[anexoStyles.table, { marginTop: 6 }]}>
          <View style={anexoStyles.sectionHeaderRow}>
            <Text style={anexoStyles.sectionHeaderText}>3. DADOS BANCÁRIOS DO(A) MONITOR(A)</Text>
          </View>
          <View style={anexoStyles.row}>
            <View style={[anexoStyles.cell, { flex: 1.2 }]}>
              <Text>3.1. Banco: {monitor.banco ?? ''}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1 }]}>
              <Text>3.2. Agência: {monitor.agencia ?? ''}</Text>
            </View>
            <View style={[anexoStyles.cell, { flex: 1.2, borderRightWidth: 0 }]}>
              <Text>
                3.3. Conta: {monitor.conta ?? ''}
                {monitor.digitoConta ? `-${monitor.digitoConta}` : ''}
              </Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text style={anexoStyles.strongLabel}>
                Obs: O(A) monitor(a) deve ser titular da conta corrente. Não pode ser poupança e nem conta conjunta. Os
                dígitos verificadores da Agência e Conta devem ser informados. Bancos digitais são aceitos.
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== SECTION 4: DECLARAÇÃO ==================== */}
        <View style={[anexoStyles.table, { marginTop: 6 }]}>
          <View style={anexoStyles.sectionHeaderRow}>
            <Text style={anexoStyles.sectionHeaderText}>4. DECLARAÇÃO DO(A) MONITOR(A)</Text>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>
                4.1 Declara ter cursado com aprovação o componente curricular do qual será monitor(a): Sim (
                {mark(declaracao.cursouComponente)} ) Não ( {mark(!declaracao.cursouComponente)} )
              </Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>
                4.2 Em caso negativo no item anterior, declara ter cursado com aprovação componente curricular
                equivalente ao qual será monitor(a): Sim ({mark(!declaracao.cursouComponente && !!declaracao.disciplinaEquivalente)} )
              </Text>
            </View>
          </View>
          <View style={anexoStyles.row}>
            <View style={anexoStyles.cellFull}>
              <Text>
                4.2.1 Informar o código e o nome do componente curricular equivalente:{' '}
                {declaracao.disciplinaEquivalente
                  ? `${declaracao.disciplinaEquivalente.codigo} - ${declaracao.disciplinaEquivalente.nome}`
                  : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== SIGNATURES ==================== */}
        <View style={anexoStyles.signatureArea}>
          <View style={anexoStyles.signatureBox}>
            {signature && <Image src={signature.dataUrl} style={anexoStyles.signatureImage} />}
            <View style={anexoStyles.signatureLine} />
            <Text style={anexoStyles.signatureCaption}>Assinatura do(a) Monitor(a)</Text>
          </View>
          <View style={anexoStyles.signatureBox}>
            <View style={anexoStyles.signatureLine} />
            <Text style={anexoStyles.signatureCaption}>Assinatura do(a) Professor(a) Responsável</Text>
          </View>
        </View>

        {/* ==================== TERMO DE COMPROMISSO BOLSISTA ==================== */}
        <Text style={[anexoStyles.formTitle, { marginTop: 16 }]}>TERMO DE COMPROMISSO DO MONITOR BOLSISTA</Text>

        <Text style={anexoStyles.paragraph}>
          Através do presente instrumento, eu, <Text style={anexoStyles.strongLabel}>{monitor.nomeCompleto}</Text>,
          declaro ter ciência das obrigações inerentes à qualidade de Monitor(a) Bolsista do Programa de Monitoria da
          Universidade Federal Bahia e comprometo-me a:
        </Text>

        <Text style={anexoStyles.clausulaListItem}>
          1. Conhecer e respeitar o regulamento das atividades de monitoria (Resolução nº 05/2021 do CAE) e normas
          definidas no EDITAL PROGRAD/UFBA Nº 04/{projeto.ano};
        </Text>
        <Text style={anexoStyles.clausulaListItem}>2. Cumprir com dedicação as atividades propostas no projeto de monitoria;</Text>
        <Text style={anexoStyles.clausulaListItem}>3. Dispor de 12 (doze) horas semanais para atuar nas atividades de monitoria;</Text>
        <Text style={anexoStyles.clausulaListItem}>
          4. Ter cursado com aprovação o componente curricular ou equivalente ao qual se vincula o projeto de monitoria;
        </Text>
        <Text style={anexoStyles.clausulaListItem}>5. Participar das atividades gerais propostas pelo Programa de Monitoria.</Text>

        <Text style={[anexoStyles.paragraph, { marginTop: 8 }]}>
          Estou ciente que a inobservância dos requisitos citados acima implicará o cancelamento do meu vínculo com o
          Programa de Monitoria e o indeferimento da certificação.
        </Text>

        <View style={[anexoStyles.row, { borderBottomWidth: 0, marginTop: 18 }]}>
          <View style={[anexoStyles.cell, { flex: 1, borderRightWidth: 0 }]}>
            <Text>{signature?.local ?? ''}</Text>
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', marginTop: 8 }} />
            <Text style={anexoStyles.signatureCaption}>Local</Text>
          </View>
          <View style={[anexoStyles.cell, { flex: 1, borderRightWidth: 0 }]}>
            <Text>{formatDateFullBR(hoje)}</Text>
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', marginTop: 8 }} />
            <Text style={anexoStyles.signatureCaption}>Data</Text>
          </View>
          <View style={[anexoStyles.cell, { flex: 2, borderRightWidth: 0, position: 'relative' }]}>
            {signature && (
              <Image src={signature.dataUrl} style={[anexoStyles.signatureImage, { top: -4, left: 10 }]} />
            )}
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', marginTop: 24 }} />
            <Text style={anexoStyles.signatureCaption}>Assinatura do(a) Monitor(a)</Text>
          </View>
        </View>

        <Text style={anexoStyles.footerNote}>
          <Text style={anexoStyles.strongLabel}>ATENÇÃO:</Text> Informações incorretas ou incompletas inviabilizarão a
          realização do cadastro. Qualquer dúvida, procure informações junto ao professor ou órgão responsável pelo
          projeto.
        </Text>
      </Page>
    </Document>
  )
}
