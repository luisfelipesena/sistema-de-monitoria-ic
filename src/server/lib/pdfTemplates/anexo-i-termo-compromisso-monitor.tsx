import { SEMESTRE_1, TIPO_VAGA_BOLSISTA, type AnexoITermoInputs } from '@/types'
import { UFBA_LOGO__FORM_BASE64 } from '@/utils/images'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import React from 'react'
import { anexoStyles, formatDateLongBR } from './anexo-shared-styles'

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  progradBlock: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#00427a',
    lineHeight: 1.2,
  },
  anexoSmall: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
  },
  titleBig: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  bodyParagraph: {
    marginTop: 10,
    textAlign: 'justify',
    lineHeight: 1.45,
  },
  declaracao: {
    marginTop: 10,
    textAlign: 'justify',
    lineHeight: 1.45,
  },
  tableHeader: {
    backgroundColor: '#E5E7EB',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 5,
    textAlign: 'center',
    fontSize: 9.5,
  },
  bankTable: {
    borderStyle: 'solid',
    borderColor: '#000',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
  },
  bankRow: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderColor: '#000',
    borderBottomWidth: 1,
  },
  bankLabel: {
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderStyle: 'solid',
    borderColor: '#000',
    borderRightWidth: 1,
  },
  bankValue: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderStyle: 'solid',
    borderColor: '#000',
    borderRightWidth: 1,
  },
  bankValueLast: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  smallNote: {
    fontSize: 8.5,
    fontWeight: 'bold',
    marginTop: 4,
  },
  footerSignatures: {
    flexDirection: 'row',
    marginTop: 40,
  },
  footerCell: {
    paddingHorizontal: 6,
  },
})

export function AnexoITermoCompromissoMonitorTemplate({ data }: { data: AnexoITermoInputs }) {
  const { monitor, projeto, tipoVaga, signature } = data
  const isBolsista = tipoVaga === TIPO_VAGA_BOLSISTA
  const tipoText = isBolsista ? 'bolsista' : 'voluntário'
  const semestreNum = projeto.semestre === SEMESTRE_1 ? 1 : 2
  const enderecoCompleto = [
    monitor.endereco.rua,
    monitor.endereco.numero ? String(monitor.endereco.numero) : '',
    monitor.endereco.bairro,
    monitor.endereco.cidade,
    monitor.endereco.estado,
    monitor.endereco.cep,
  ]
    .filter(Boolean)
    .join(', ')
  const hoje = signature?.data ?? new Date()

  return (
    <Document>
      <Page size="A4" style={anexoStyles.page}>
        {/* Header: UFBA + PROGRAD placeholder text */}
        <View style={styles.headerRow}>
          <Image src={UFBA_LOGO__FORM_BASE64} style={{ width: 55, height: 68 }} cache={false} />
          <View style={styles.progradBlock}>
            <Text>PROGRAD</Text>
            <Text style={{ fontSize: 7.5, marginTop: 2 }}>PRÓ-REITORIA DE ENSINO DE GRADUAÇÃO</Text>
          </View>
        </View>

        <Text style={styles.anexoSmall}>Anexo I</Text>
        <Text style={styles.titleBig}>TERMO DE COMPROMISSO DO MONITOR</Text>

        <Text style={styles.bodyParagraph}>
          Eu, <Text style={anexoStyles.strongLabel}>{monitor.nomeCompleto}</Text>, portador(a) do RG nº{' '}
          <Text style={anexoStyles.strongLabel}>{monitor.rg}</Text> e do CPF nº{' '}
          <Text style={anexoStyles.strongLabel}>{monitor.cpf}</Text>, regularmente matriculado(a) na UFBA no curso de
          graduação em <Text style={anexoStyles.strongLabel}>{monitor.cursoNome ?? '—'}</Text>, sob o nº de matrícula{' '}
          <Text style={anexoStyles.strongLabel}>{monitor.matricula}</Text>, devidamente selecionado(a) para atuar como
          monitor(a) <Text style={{ fontStyle: 'italic' }}>(bolsista ou voluntário)</Text>{' '}
          <Text style={anexoStyles.strongLabel}>{tipoText}</Text> no projeto vinculado ao componente curricular{' '}
          <Text style={{ fontStyle: 'italic' }}>(código e nome)</Text>{' '}
          <Text style={anexoStyles.strongLabel}>
            {projeto.disciplina.codigo} - {projeto.disciplina.nome}
          </Text>
          , a ser desenvolvido durante o semestre{' '}
          <Text style={anexoStyles.strongLabel}>
            {projeto.ano}.{semestreNum}
          </Text>
          , sob a responsabilidade do(a) professor(a){' '}
          <Text style={anexoStyles.strongLabel}>{projeto.professorResponsavelNome}</Text>, comprometo-me a:
        </Text>

        <Text style={styles.bodyParagraph}>
          1. Conhecer e respeitar as normas relativas às atividades de monitoria (Resolução CAE nº 05/2021 e edital
          correspondente), disponíveis na página do programa no sítio eletrônico da PROGRAD.
        </Text>
        <Text style={styles.bodyParagraph}>
          2. Cumprir as atividades propostas no projeto de monitoria indicado neste termo, assim como a carga horária de{' '}
          <Text style={anexoStyles.strongLabel}>12 horas semanais</Text>.
        </Text>
        <Text style={styles.bodyParagraph}>
          3. Interagir com professores e estudantes, visando apoiar os discentes matriculados no componente curricular
          de modo a potencializar o processo de ensino-aprendizagem.
        </Text>
        <Text style={styles.bodyParagraph}>4. Apresentar ao professor orientador o relatório final das atividades.</Text>

        <Text style={styles.declaracao}>
          Declaro <Text style={anexoStyles.strongLabel}>ter cursado, com aprovação,</Text> ou{' '}
          <Text style={anexoStyles.strongLabel}>ter obtido dispensa</Text> do componente curricular ou equivalente ao
          qual se vincula o projeto.
        </Text>

        <Text style={styles.declaracao}>
          Declaro <Text style={anexoStyles.strongLabel}>não possuir nenhum tipo de bolsa na presente data</Text>,
          estando ciente da vedação quanto à acumulação de bolsa de monitoria com outras modalidades de bolsas
          oferecidas pela UFBA ou por órgãos externos, exceto quando se tratar de bolsa auxílio de permanência.
        </Text>

        <Text style={styles.declaracao}>
          Estou ciente que a inobservância dos termos acima implicará o desligamento do programa, o indeferimento da
          certificação e a devolução de valores recebidos indevidamente, se for o caso.
        </Text>

        {/* Banking table */}
        <View style={{ marginTop: 14 }}>
          <Text style={styles.tableHeader}>Informações adicionais para recebimento da bolsa (apenas bolsistas)</Text>
          <View style={styles.bankTable}>
            <View style={styles.bankRow}>
              <View style={[styles.bankLabel, { width: '16%' }]}>
                <Text>Banco*</Text>
              </View>
              <View style={[styles.bankValue, { width: '17%' }]}>
                <Text>{isBolsista ? (monitor.banco ?? '') : ''}</Text>
              </View>
              <View style={[styles.bankLabel, { width: '17%' }]}>
                <Text>Agência e dígito</Text>
              </View>
              <View style={[styles.bankValue, { width: '17%' }]}>
                <Text>{isBolsista ? (monitor.agencia ?? '') : ''}</Text>
              </View>
              <View style={[styles.bankLabel, { width: '16%' }]}>
                <Text>Conta e dígito**</Text>
              </View>
              <View style={[styles.bankValueLast, { width: '17%' }]}>
                <Text>
                  {isBolsista
                    ? `${monitor.conta ?? ''}${monitor.digitoConta ? `-${monitor.digitoConta}` : ''}`
                    : ''}
                </Text>
              </View>
            </View>
            <View style={styles.bankRow}>
              <View style={[styles.bankLabel, { width: '16%' }]}>
                <Text>Endereço e CEP</Text>
              </View>
              <View style={[styles.bankValueLast, { width: '84%' }]}>
                <Text>{enderecoCompleto}</Text>
              </View>
            </View>
            <View style={styles.bankRow}>
              <View style={[styles.bankLabel, { width: '16%' }]}>
                <Text>Celular com DDD</Text>
              </View>
              <View style={[styles.bankValue, { width: '34%' }]}>
                <Text>{monitor.telefone ?? ''}</Text>
              </View>
              <View style={[styles.bankLabel, { width: '13%' }]}>
                <Text>E-mail</Text>
              </View>
              <View style={[styles.bankValueLast, { width: '37%' }]}>
                <Text>{monitor.email}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.smallNote}>* exceto Mercado Pago</Text>
          <Text style={styles.smallNote}>** não pode ser conta poupança</Text>
        </View>

        {/* Footer signatures */}
        <View style={styles.footerSignatures}>
          <View style={[styles.footerCell, { flex: 1 }]}>
            <Text>{signature?.local ?? ''}</Text>
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', marginTop: 6 }} />
            <Text style={anexoStyles.signatureCaption}>Local</Text>
          </View>
          <View style={[styles.footerCell, { flex: 1 }]}>
            <Text>{formatDateLongBR(hoje)}</Text>
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', marginTop: 6 }} />
            <Text style={anexoStyles.signatureCaption}>Data</Text>
          </View>
          <View style={[styles.footerCell, { flex: 2, position: 'relative' }]}>
            {signature && (
              <Image src={signature.dataUrl} style={[anexoStyles.signatureImage, { top: -8, left: 20 }]} />
            )}
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', marginTop: 24 }} />
            <Text style={anexoStyles.signatureCaption}>Assinatura do(a) monitor(a)</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
