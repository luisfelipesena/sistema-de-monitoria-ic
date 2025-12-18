import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, ProjectDetails, colors } from '../../components'

interface EditalPublishedProps {
  editalNumero: string
  editalTitulo: string
  semestreFormatado: string
  ano: number
  linkPDF: string
}

export function EditalPublished({
  editalNumero,
  editalTitulo,
  semestreFormatado,
  ano,
  linkPDF,
}: EditalPublishedProps) {
  return (
    <BaseLayout
      preview={`Edital publicado - ${semestreFormatado}/${ano}`}
      accentColor={colors.primary}
    >
      <Heading>
        📢 Edital Publicado - {semestreFormatado}/{ano}
      </Heading>

      <Text style={textStyle}>Prezados estudantes e professores,</Text>

      <Text style={textStyle}>
        Foi publicado o <strong>{editalTitulo}</strong> para o período de{' '}
        <strong>
          {semestreFormatado}/{ano}
        </strong>
        .
      </Text>

      <ProjectDetails
        titulo={editalTitulo}
        extraFields={[
          { label: '📋 Edital', value: editalNumero },
          { label: '📅 Período', value: `${semestreFormatado}/${ano}` },
        ]}
      />

      <Text style={textStyle}>
        Acesse o edital completo através do botão abaixo:
      </Text>

      <Button href={linkPDF}>📄 Visualizar Edital (PDF)</Button>

      <InfoBox variant="info">
        <Text style={infoTextStyle}>
          <strong>📌 Para estudantes:</strong> Consulte o edital para informações
          sobre prazos de inscrição e requisitos.
        </Text>
      </InfoBox>

      <InfoBox variant="info">
        <Text style={infoTextStyle}>
          <strong>👨‍🏫 Para professores:</strong> Consulte o edital para informações
          sobre o processo seletivo de monitores.
        </Text>
      </InfoBox>

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
  marginTop: '20px',
}
