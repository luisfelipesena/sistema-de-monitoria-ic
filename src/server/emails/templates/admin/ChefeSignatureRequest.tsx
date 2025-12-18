import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, ProjectDetails, colors } from '../../components'

interface ChefeSignatureRequestProps {
  chefeNome?: string
  editalNumero: string
  editalTitulo: string
  semestreFormatado: string
  ano: number
  signatureUrl: string
  expiresAtFormatted: string
}

export function ChefeSignatureRequest({
  chefeNome,
  editalNumero,
  editalTitulo,
  semestreFormatado,
  ano,
  signatureUrl,
  expiresAtFormatted,
}: ChefeSignatureRequestProps) {
  return (
    <BaseLayout
      preview={`Solicitação de assinatura - ${editalTitulo}`}
      accentColor="#0b5394"
    >
      <Heading color="#0b5394">✍️ Solicitação de Assinatura de Edital</Heading>

      <Text style={textStyle}>
        Prezado(a) {chefeNome || 'Chefe do Departamento'},
      </Text>

      <Text style={textStyle}>
        O Coordenador de Monitoria do DCC solicita sua assinatura digital no{' '}
        <strong>{editalTitulo}</strong> referente ao período{' '}
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
        Clique no botão abaixo para visualizar o edital e realizar a assinatura
        digital. Você poderá revisar todo o conteúdo antes de assinar.
      </Text>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <Button href={signatureUrl} color="#0b5394">
          ✍️ Assinar Edital
        </Button>
      </div>

      <InfoBox variant="warning">
        <Text style={infoTextStyle}>
          <strong>⚠️ Atenção:</strong> Este link é válido até{' '}
          <strong>{expiresAtFormatted}</strong>. Após este prazo, uma nova
          solicitação deverá ser feita pelo coordenador.
        </Text>
      </InfoBox>

      <Text style={mutedTextStyle}>
        Se você recebeu este email por engano ou não é o Chefe do Departamento
        responsável, por favor desconsidere esta mensagem.
      </Text>

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

const mutedTextStyle: React.CSSProperties = {
  color: colors.muted,
  fontSize: '14px',
  marginTop: '30px',
}

const signatureStyle: React.CSSProperties = {
  marginTop: '20px',
}
