import React from 'react'
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { IC_LOGO_BASE64, UFBA_LOGO__FORM_BASE64 } from '@/utils/images'
import { formatDateExtenso } from './AtaSelecaoTemplate'

if (typeof Font?.registerHyphenationCallback === 'function') {
  Font.registerHyphenationCallback((word) => [word])
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    paddingTop: 40,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 50,
    lineHeight: 1.5,
    color: '#000000',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 35,
    width: '100%',
  },
  logoUfba: {
    width: 65,
    height: 75,
    objectFit: 'contain',
  },
  logoIc: {
    width: 70,
    height: 75,
    objectFit: 'contain',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  institutionHeaderBold: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    marginBottom: 3,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: 11,
    textAlign: 'justify',
    marginTop: 20,
    marginBottom: 30,
    textIndent: 30,
    lineHeight: 1.6,
  },
  dateContainer: {
    alignItems: 'flex-end',
    marginTop: 30,
    marginBottom: 50,
  },
  dateText: {
    fontSize: 11,
  },
  signatureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signatureImage: {
    height: 50,
    objectFit: 'contain',
    marginBottom: 5,
  },
  signatureLine: {
    width: 250,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    textAlign: 'center',
    color: '#444444',
  },
})

interface ConsolidacaoValidacaoChefeData {
  ano: number
  semestre: string
  chefeNome?: string | null
  chefeAssinatura?: string | null
  chefeAssinouEm?: Date | null
  totalProjetosBolsistas: number
}

export function ConsolidacaoValidacaoChefeTemplate({ data }: { data: ConsolidacaoValidacaoChefeData }) {
  const dataExtenso = data.chefeAssinouEm ? formatDateExtenso(data.chefeAssinouEm.toISOString()) : formatDateExtenso(new Date().toISOString())

  return (
    <Document title={`Consolidação de Resultados com Bolsistas - ${data.ano}.${data.semestre}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image src={UFBA_LOGO__FORM_BASE64} style={styles.logoUfba} cache={false} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.institutionHeaderBold}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text style={styles.institutionHeaderBold}>INSTITUTO DE COMPUTAÇÃO</Text>
            <Text style={styles.institutionHeaderBold}>DEPARTAMENTO DE CIÊNCIA DA COMPUTAÇÃO</Text>
          </View>
          <Image src={IC_LOGO_BASE64} style={styles.logoIc} cache={false} />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>TERMO DE VALIDAÇÃO E CONSOLIDAÇÃO DE RESULTADOS DA MONITORIA</Text>
          <Text style={styles.subTitle}>PROCESSO SELETIVO - PERÍODO LETIVO {data.ano}.{data.semestre}</Text>
        </View>

        {/* Body */}
        <Text style={styles.bodyText}>
          Apresentamos a consolidação oficial dos resultados do processo seletivo do Programa de Monitoria do Instituto de Computação da UFBA, referente ao semestre letivo {data.ano}.{data.semestre}. Este documento unifica os resultados das {data.totalProjetosBolsistas} disciplina(s) / projeto(s) contemplados com bolsa de monitoria PROGRAD.
        </Text>

        <Text style={styles.bodyText}>
          Atesto a conferência e aprovação de todas as atas e listas de classificação dos candidatos selecionados para as vagas de bolsistas constantes nos relatórios em anexo, para encaminhamento à Pró-Reitoria de Ensino de Graduação (PROGRAD).
        </Text>

        {/* Date */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{dataExtenso}</Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureContainer}>
          {data.chefeAssinatura ? (
            <Image src={data.chefeAssinatura} style={styles.signatureImage} cache={false} />
          ) : (
            <View style={{ height: 50 }} />
          )}
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{data.chefeNome || 'Chefe do Departamento de Ciência da Computação'}</Text>
          <Text style={styles.signatureRole}>Chefe do Departamento de Ciência da Computação - IC/UFBA</Text>
        </View>
      </Page>
    </Document>
  )
}
