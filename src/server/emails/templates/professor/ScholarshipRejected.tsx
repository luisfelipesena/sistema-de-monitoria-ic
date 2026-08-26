import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface ScholarshipRejectedProps {
  professorName: string
  studentName: string
  studentMatricula: string
  projectTitle: string
  motivo?: string
  linkSelecao: string
}

export function ScholarshipRejected({
  professorName,
  studentName,
  studentMatricula,
  projectTitle,
  motivo,
  linkSelecao,
}: ScholarshipRejectedProps) {
  return (
    <BaseLayout
      preview={`Bolsa rejeitada por ${studentName} - ${projectTitle}`}
      accentColor={colors.error}
    >
      <Heading color={colors.error}>
        ❌ Bolsa de Monitoria Rejeitada
      </Heading>

      <Text style={textStyle}>Prezado(a) Prof. {professorName},</Text>

      <Text style={textStyle}>
        O aluno <strong>{studentName}</strong> (matrícula: {studentMatricula}){' '}
        <strong>rejeitou a bolsa de monitoria</strong> para o projeto "
        <strong>{projectTitle}</strong>".
      </Text>

      {motivo && (
        <InfoBox variant="info" title="Motivo informado pelo aluno:">
          <Text style={infoTextStyle}>{motivo}</Text>
        </InfoBox>
      )}

      <InfoBox variant="warning" title="O que fazer agora?">
        <Text style={infoTextStyle}>
          Acesse a página de Seleção de Monitores para designar a bolsa
          para outro candidato que confirmou interesse no processo seletivo.
        </Text>
      </InfoBox>

      <Button href={linkSelecao} color={colors.primary}>
        Acessar Seleção de Monitores
      </Button>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}

const infoTextStyle: React.CSSProperties = {
  margin: '4px 0',
}
