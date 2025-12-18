import { Section, Text } from '@react-email/components'
import { colors } from './BaseLayout'

interface ProjectDetailsProps {
  projetoId?: number
  titulo: string
  extraFields?: { label: string; value: string }[]
}

export function ProjectDetails({
  projetoId,
  titulo,
  extraFields,
}: ProjectDetailsProps) {
  return (
    <Section style={boxStyle}>
      {projetoId && (
        <Text style={fieldStyle}>
          <strong style={labelStyle}>ID do Projeto:</strong> #{projetoId}
        </Text>
      )}
      <Text style={fieldStyle}>
        <strong style={labelStyle}>Título:</strong> {titulo}
      </Text>
      {extraFields?.map((field, index) => (
        <Text key={index} style={fieldStyle}>
          <strong style={labelStyle}>{field.label}:</strong> {field.value}
        </Text>
      ))}
    </Section>
  )
}

const boxStyle: React.CSSProperties = {
  backgroundColor: '#f9f9f9',
  border: `1px solid ${colors.border}`,
  padding: '15px',
  borderRadius: '6px',
  margin: '20px 0',
}

const fieldStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '14px',
}

const labelStyle: React.CSSProperties = {
  color: '#555555',
}
