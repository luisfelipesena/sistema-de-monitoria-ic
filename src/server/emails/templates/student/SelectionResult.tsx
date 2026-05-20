import { Text } from '@react-email/components'
import { REJECTED_BY_PROFESSOR, SELECTED_BOLSISTA, SELECTED_VOLUNTARIO } from '@/types'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface SelectionResultProps {
  studentName: string
  projectTitle: string
  professorName: string
  status: typeof SELECTED_BOLSISTA | typeof SELECTED_VOLUNTARIO | typeof REJECTED_BY_PROFESSOR
  linkConfirmacao?: string
  feedbackProfessor?: string
}

export function SelectionResult({
  studentName,
  projectTitle,
  professorName,
  status,
  linkConfirmacao,
  feedbackProfessor,
}: SelectionResultProps) {
  const isSelected = status === SELECTED_BOLSISTA || status === SELECTED_VOLUNTARIO
  const tipoVaga = status === SELECTED_BOLSISTA ? 'Bolsista' : 'Voluntário'

  if (isSelected) {
    return (
      <BaseLayout
        preview={`Parabéns! Você foi selecionado(a) para Monitoria (${tipoVaga})`}
        accentColor={colors.success}
      >
        <Heading color={colors.success}>
          🎉 Parabéns! Você foi selecionado(a) para Monitoria ({tipoVaga})
        </Heading>

        <Text style={textStyle}>Prezado(a) {studentName},</Text>

        <Text style={textStyle}>
          Você foi <strong>SELECIONADO(A)</strong> como <strong>{tipoVaga}</strong>{' '}
          para a monitoria do projeto "<strong>{projectTitle}</strong>" com o
          Prof(a). {professorName}.
        </Text>

        <InfoBox variant="warning" title="Ação necessária:">
          <Text style={infoTextStyle}>
            Por favor, acesse o sistema para confirmar ou recusar sua participação.
          </Text>
        </InfoBox>

        {linkConfirmacao && (
          <Button href={linkConfirmacao} color={colors.success}>
            Confirmar/Recusar Vaga
          </Button>
        )}
      </BaseLayout>
    )
  }

  return (
    <BaseLayout
      preview="Resultado da Seleção de Monitoria"
      accentColor={colors.error}
    >
      <Heading color={colors.error}>Resultado da Seleção de Monitoria</Heading>

      <Text style={textStyle}>Prezado(a) {studentName},</Text>

      <Text style={textStyle}>
        Agradecemos seu interesse na monitoria do projeto "
        <strong>{projectTitle}</strong>".
      </Text>

      <Text style={textStyle}>
        Neste momento, você não foi selecionado(a) para esta vaga.
      </Text>

      {feedbackProfessor && (
        <InfoBox variant="info" title="Feedback:">
          <Text style={infoTextStyle}>{feedbackProfessor}</Text>
        </InfoBox>
      )}

      <Text style={textStyle}>
        Encorajamos você a se candidatar para outras oportunidades de monitoria.
      </Text>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}

const infoTextStyle: React.CSSProperties = {
  margin: 0,
}
