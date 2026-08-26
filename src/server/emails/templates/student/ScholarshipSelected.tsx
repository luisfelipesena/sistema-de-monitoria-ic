import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface ScholarshipSelectedProps {
  studentName: string
  projectTitle: string
  professorName: string
  linkAceite: string
}

export function ScholarshipSelected({
  studentName,
  projectTitle,
  professorName,
  linkAceite,
}: ScholarshipSelectedProps) {
  return (
    <BaseLayout
      preview={`Você foi selecionado(a) para bolsa de monitoria - ${projectTitle}`}
      accentColor={colors.success}
    >
      <Heading color={colors.success}>
        🎉 Você foi selecionado(a) para uma Bolsa de Monitoria!
      </Heading>

      <Text style={textStyle}>Prezado(a) {studentName},</Text>

      <Text style={textStyle}>
        O Prof(a). {professorName} selecionou você para receber uma{' '}
        <strong>bolsa de monitoria</strong> no projeto "
        <strong>{projectTitle}</strong>".
      </Text>

      <InfoBox variant="warning" title="Ação necessária:">
        <Text style={infoTextStyle}>
          Acesse o sistema para <strong>aceitar</strong> ou{' '}
          <strong>rejeitar</strong> a bolsa. Caso não responda, o professor
          poderá designar a bolsa para outro candidato.
        </Text>
      </InfoBox>

      <Button href={linkAceite} color={colors.success}>
        Aceitar ou Rejeitar Bolsa
      </Button>

      <Text style={textStyle}>
        Se tiver dúvidas, entre em contato com o professor responsável.
      </Text>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}

const infoTextStyle: React.CSSProperties = {
  margin: '4px 0',
}
