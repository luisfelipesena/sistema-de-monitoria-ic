import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface InvitationProps {
  professorEmail: string
  invitationLink: string
  adminName?: string
}

export function Invitation({
  invitationLink,
  adminName,
}: InvitationProps) {
  const adminDisplayName = adminName || 'a Administração do Sistema de Monitoria IC'

  return (
    <BaseLayout preview="Convite para se juntar ao Sistema de Monitoria IC">
      <Heading>Convite para Sistema de Monitoria IC</Heading>

      <Text style={textStyle}>Olá,</Text>

      <Text style={textStyle}>
        Você foi convidado por <strong>{adminDisplayName}</strong> para se juntar
        à plataforma Sistema de Monitoria IC como professor.
      </Text>

      <InfoBox variant="info" title="Próximos passos:">
        <Text style={infoTextStyle}>
          Para aceitar o convite e configurar sua conta, clique no botão abaixo.
        </Text>
      </InfoBox>

      <Button href={invitationLink}>Aceitar Convite</Button>

      <InfoBox variant="warning">
        <Text style={infoTextStyle}>
          <strong>O link de convite é válido por 7 dias.</strong> Após este prazo,
          uma nova solicitação deverá ser feita.
        </Text>
      </InfoBox>

      <Text style={mutedTextStyle}>
        Se você não estava esperando este convite, por favor, ignore este email.
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
