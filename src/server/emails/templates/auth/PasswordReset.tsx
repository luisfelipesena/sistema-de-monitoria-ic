import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface PasswordResetProps {
  resetLink: string
}

export function PasswordReset({ resetLink }: PasswordResetProps) {
  return (
    <BaseLayout preview="Redefinição de senha - Sistema de Monitoria IC">
      <Heading>Redefinição de Senha</Heading>

      <Text style={textStyle}>Olá,</Text>

      <Text style={textStyle}>
        Recebemos uma solicitação para redefinir sua senha no Sistema de Monitoria IC.
      </Text>

      <InfoBox variant="warning" title="Ação necessária:">
        <Text style={infoTextStyle}>
          Se você fez essa solicitação, clique no botão abaixo para criar uma nova senha.
        </Text>
      </InfoBox>

      <Button href={resetLink}>Redefinir Senha</Button>

      <InfoBox variant="info">
        <Text style={infoTextStyle}>
          <strong>Este link expira em 1 hora.</strong> Caso não tenha solicitado a
          redefinição, ignore este e-mail - sua senha permanecerá inalterada.
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
