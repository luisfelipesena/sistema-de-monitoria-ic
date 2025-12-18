import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, ProjectDetails, colors } from '../../components'

interface ProfessorSignedProps {
  professorNome: string
  projetoTitulo: string
  projetoId: number
  novoStatusProjeto: string
  linkDashboard: string
}

export function ProfessorSigned({
  professorNome,
  projetoTitulo,
  projetoId,
  novoStatusProjeto,
  linkDashboard,
}: ProfessorSignedProps) {
  return (
    <BaseLayout
      preview={`Proposta assinada: ${projetoTitulo}`}
      accentColor={colors.admin}
    >
      <Heading color={colors.admin}>Proposta Assinada pelo Professor</Heading>

      <Text style={textStyle}>Prezada Coordenação/Administração,</Text>

      <Text style={textStyle}>
        O Prof(a). {professorNome} assinou e enviou a proposta para o projeto "
        <strong>{projetoTitulo}</strong>".
      </Text>

      <Text style={textStyle}>
        O projeto está agora com status "<strong>{novoStatusProjeto}</strong>" e
        pode requerer sua revisão e/ou assinatura como administrador.
      </Text>

      <ProjectDetails projetoId={projetoId} titulo={projetoTitulo} />

      <Button href={linkDashboard} color={colors.admin}>
        Revisar Proposta
      </Button>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}
