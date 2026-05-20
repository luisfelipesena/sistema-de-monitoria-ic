import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, ProjectDetails, colors } from '../../components'

interface SelectionReminderProps {
  professorNome: string
  projetoTitulo: string
  projetoId?: number
  customMessage?: string
  linkPlataforma: string
}

export function SelectionReminder({
  professorNome,
  projetoTitulo,
  projetoId,
  customMessage,
  linkPlataforma,
}: SelectionReminderProps) {
  return (
    <BaseLayout
      preview={`Lembrete: Seleção de Monitores - ${projetoTitulo}`}
      accentColor="#ff9800"
    >
      <Heading color="#ff9800">Lembrete: Seleção de Monitores Pendente</Heading>

      <Text style={textStyle}>Prezado(a) Professor(a) {professorNome},</Text>

      <Text style={textStyle}>
        Este é um lembrete sobre a seleção de monitores para o projeto "
        <strong>{projetoTitulo}</strong>".
      </Text>

      <Text style={textStyle}>
        Favor verificar se há candidatos inscritos e proceder com a seleção através
        da plataforma.
      </Text>

      {customMessage && (
        <InfoBox variant="info" title="Mensagem adicional da coordenação:">
          <Text style={infoTextStyle}>{customMessage}</Text>
        </InfoBox>
      )}

      {projetoId && <ProjectDetails projetoId={projetoId} titulo={projetoTitulo} />}

      <Button href={linkPlataforma} color="#ff9800">
        Acessar Projeto na Plataforma
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
