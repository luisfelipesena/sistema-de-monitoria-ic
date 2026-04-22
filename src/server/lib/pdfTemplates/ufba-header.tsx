import { UFBA_LOGO__FORM_BASE64 } from '@/utils/images'
import { Image, Text, View } from '@react-pdf/renderer'
import React from 'react'
import { anexoStyles } from './anexo-shared-styles'

export function UfbaPrograd() {
  return (
    <View style={anexoStyles.headerContainer}>
      <Image style={anexoStyles.headerLogo} src={UFBA_LOGO__FORM_BASE64} cache={false} />
      <View style={anexoStyles.headerText}>
        <Text>UNIVERSIDADE FEDERAL DA BAHIA</Text>
        <Text>Pró-Reitoria de Ensino de Graduação</Text>
        <Text>Coordenação Acadêmica de Graduação</Text>
      </View>
    </View>
  )
}
