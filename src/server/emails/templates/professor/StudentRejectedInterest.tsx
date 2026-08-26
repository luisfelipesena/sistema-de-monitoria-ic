import { Text } from '@react-email/components'
import { BaseLayout, Heading, InfoBox, colors } from '../../components'

interface StudentRejectedInterestProps {
  professorName: string
  studentName: string
  studentMatricula: string
  projectTitle: string
}

export function StudentRejectedInterest({
  professorName,
  studentName,
  studentMatricula,
  projectTitle,
}: StudentRejectedInterestProps) {
  return (
    <BaseLayout
      preview={`${studentName} rejeitou participação no processo seletivo - ${projectTitle}`}
      accentColor={colors.error}
    >
      <Heading color={colors.error}>
        ❌ Aluno rejeitou participação no processo seletivo
      </Heading>

      <Text style={textStyle}>Prezado(a) Prof. {professorName},</Text>

      <Text style={textStyle}>
        O aluno <strong>{studentName}</strong> (matrícula: {studentMatricula}){' '}
        <strong>rejeitou a continuação no processo seletivo</strong> para o projeto "
        <strong>{projectTitle}</strong>".
      </Text>

      <InfoBox variant="warning" title="O que isso significa?">
        <Text style={infoTextStyle}>
          Este aluno não estará mais disponível para seleção como monitor
          neste projeto.
        </Text>
      </InfoBox>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}

const infoTextStyle: React.CSSProperties = {
  margin: '4px 0',
}
