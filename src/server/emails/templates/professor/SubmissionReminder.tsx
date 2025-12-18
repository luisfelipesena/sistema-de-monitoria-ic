import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface SubmissionReminderProps {
  professorNome: string
  periodoFormatado: string
  customMessage?: string
  linkPlataforma: string
}

export function SubmissionReminder({
  professorNome,
  periodoFormatado,
  customMessage,
  linkPlataforma,
}: SubmissionReminderProps) {
  return (
    <BaseLayout
      preview={`Lembrete: Submissão de Projeto - ${periodoFormatado}`}
      accentColor={colors.warning}
    >
      <Heading color={colors.warning}>
        Lembrete: Submissão de Projeto de Monitoria
      </Heading>

      <Text style={textStyle}>Prezado(a) Professor(a) {professorNome},</Text>

      <Text style={textStyle}>
        Este é um lembrete sobre a submissão do seu projeto de monitoria para o
        período <strong>{periodoFormatado}</strong>.
      </Text>

      <Text style={textStyle}>
        Nossos registros indicam que você ainda não submeteu um projeto para este
        período. Se você planeja oferecer monitoria, por favor:
      </Text>

      <ol style={listStyle}>
        <li>Acesse a plataforma de monitoria</li>
        <li>Crie seu projeto de monitoria</li>
        <li>Submeta o projeto para aprovação</li>
      </ol>

      {customMessage && (
        <InfoBox variant="info" title="Mensagem adicional da coordenação:">
          <Text style={infoTextStyle}>{customMessage}</Text>
        </InfoBox>
      )}

      <Text style={textStyle}>
        Se você não planeja oferecer monitoria neste período, ou já submeteu seu
        projeto, pode desconsiderar este email.
      </Text>

      <Text style={textStyle}>
        Em caso de dúvidas, entre em contato com a coordenação do programa de
        monitoria.
      </Text>

      <Button href={linkPlataforma} color={colors.warning}>
        Acessar Plataforma
      </Button>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}

const infoTextStyle: React.CSSProperties = {
  margin: 0,
}

const listStyle: React.CSSProperties = {
  margin: '10px 0 20px 0',
  paddingLeft: '20px',
}
