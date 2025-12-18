import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, ProjectDetails, colors } from '../../components'

interface ProjectSubmittedProps {
  professorNome: string
  projetoTitulo: string
  projetoId: number
  departamento?: string
  periodoFormatado?: string
  linkProjeto: string
}

export function ProjectSubmitted({
  professorNome,
  projetoTitulo,
  projetoId,
  departamento,
  periodoFormatado,
  linkProjeto,
}: ProjectSubmittedProps) {
  const extraFields = []
  if (departamento) {
    extraFields.push({ label: 'Departamento', value: departamento })
  }
  if (periodoFormatado) {
    extraFields.push({ label: 'Período', value: periodoFormatado })
  }

  return (
    <BaseLayout
      preview={`Novo projeto submetido: ${projetoTitulo}`}
      accentColor={colors.admin}
    >
      <Heading color={colors.admin}>Novo Projeto Submetido para Análise</Heading>

      <Text style={textStyle}>Prezada Coordenação/Administração,</Text>

      <Text style={textStyle}>
        O projeto de monitoria "<strong>{projetoTitulo}</strong>" foi submetido
        pelo Prof(a). {professorNome} e aguarda análise.
      </Text>

      <ProjectDetails
        projetoId={projetoId}
        titulo={projetoTitulo}
        extraFields={extraFields}
      />

      <Button href={linkProjeto} color={colors.admin}>
        Revisar Projeto
      </Button>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}
