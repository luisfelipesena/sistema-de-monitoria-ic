import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface EmailVerificationProps {
  verificationLink: string
}

export function EmailVerification({ verificationLink }: EmailVerificationProps) {
  return (
    <BaseLayout preview="Confirme seu email no Sistema de Monitoria IC">
      <Heading>Confirme seu E-mail</Heading>

      <Text style={textStyle}>Olá,</Text>

      <Text style={textStyle}>
        Recebemos uma solicitação de criação de conta no Sistema de Monitoria IC.
      </Text>

      <InfoBox variant="info" title="Próximo passo:">
        <Text style={infoTextStyle}>
          Para confirmar seu e-mail e concluir o cadastro, clique no botão abaixo.
        </Text>
      </InfoBox>

      <Button href={verificationLink}>Confirmar E-mail</Button>

      <Text style={mutedTextStyle}>
        Se você não solicitou esta conta, pode ignorar este e-mail com segurança.
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
  marginTop: '30px',
  color: colors.muted,
  fontSize: '14px',
}

const signatureStyle: React.CSSProperties = {
  marginTop: '20px',
}
