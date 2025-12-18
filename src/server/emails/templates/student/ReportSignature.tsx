import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, ProjectDetails, colors } from '../../components'

interface ReportSignatureProps {
  alunoNome: string
  projetoTitulo: string
  disciplinaNome: string
  professorNome: string
  linkRelatorio: string
}

export function ReportSignature({
  alunoNome,
  projetoTitulo,
  disciplinaNome,
  professorNome,
  linkRelatorio,
}: ReportSignatureProps) {
  return (
    <BaseLayout
      preview={`Relatório aguardando assinatura - ${disciplinaNome}`}
      accentColor={colors.success}
    >
      <Heading color={colors.success}>
        Relatório de Monitoria Aguardando Assinatura
      </Heading>

      <Text style={textStyle}>Prezado(a) {alunoNome},</Text>

      <Text style={textStyle}>
        Seu relatório final de monitoria foi gerado pelo Prof(a).{' '}
        <strong>{professorNome}</strong> e está aguardando sua assinatura.
      </Text>

      <ProjectDetails
        titulo={projetoTitulo}
        extraFields={[
          { label: 'Disciplina', value: disciplinaNome },
          { label: 'Professor', value: professorNome },
        ]}
      />

      <InfoBox variant="info" title="Importante:">
        <Text style={infoTextStyle}>
          Por favor, revise e assine seu relatório para que o certificado de
          monitoria possa ser emitido.
        </Text>
      </InfoBox>

      <Button href={linkRelatorio} color={colors.success}>
        Revisar e Assinar Relatório
      </Button>

      <Text style={signatureStyle}>
        Atenciosamente,
        <br />
        <strong>Sistema de Monitoria IC - UFBA</strong>
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

const signatureStyle: React.CSSProperties = {
  marginTop: '30px',
}
