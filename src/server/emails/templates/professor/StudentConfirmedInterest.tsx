import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface StudentConfirmedInterestProps {
  professorName: string
  studentName: string
  studentMatricula: string
  projectTitle: string
  notaFinal: string
  linkSelecao: string
}

export function StudentConfirmedInterest({
  professorName,
  studentName,
  studentMatricula,
  projectTitle,
  notaFinal,
  linkSelecao,
}: StudentConfirmedInterestProps) {
  return (
    <BaseLayout
      preview={`${studentName} confirmou interesse no processo seletivo - ${projectTitle}`}
      accentColor={colors.success}
    >
      <Heading color={colors.success}>
        ✅ Aluno confirmou interesse no processo seletivo
      </Heading>

      <Text style={textStyle}>Prezado(a) Prof. {professorName},</Text>

      <Text style={textStyle}>
        O aluno <strong>{studentName}</strong> (matrícula: {studentMatricula})
        confirmou interesse em continuar no processo seletivo para o projeto "
        <strong>{projectTitle}</strong>".
      </Text>

      <InfoBox variant="info" title="Dados do candidato:">
        <Text style={infoTextStyle}>Nome: {studentName}</Text>
        <Text style={infoTextStyle}>Matrícula: {studentMatricula}</Text>
        <Text style={infoTextStyle}>Nota Final: {notaFinal}</Text>
      </InfoBox>

      <Text style={textStyle}>
        Você pode acessar a página de Seleção de Monitores para designar
        a bolsa quando estiver pronto(a).
      </Text>

      <Button href={linkSelecao} color={colors.success}>
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
