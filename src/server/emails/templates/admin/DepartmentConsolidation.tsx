import { Text } from '@react-email/components'
import { BaseLayout, Heading, InfoBox } from '../../components'

interface DepartmentConsolidationProps {
  semestreDisplay: string
  ano: number
  anexos: { filename: string }[]
}

export function DepartmentConsolidation({
  semestreDisplay,
  ano,
  anexos,
}: DepartmentConsolidationProps) {
  return (
    <BaseLayout
      preview={`Consolidação final ${semestreDisplay}/${ano}`}
      accentColor="#0b5394"
    >
      <Heading color="#0b5394">Consolidação Final de Monitoria</Heading>

      <Text style={textStyle}>Prezados,</Text>

      <Text style={textStyle}>
        Seguem anexadas as planilhas consolidadas de monitores bolsistas e
        voluntários referentes ao{' '}
        <strong>
          {semestreDisplay}/{ano}
        </strong>
        . Após validação departamental, essas planilhas podem ser encaminhadas à
        PROGRAD.
      </Text>

      <InfoBox variant="info" title="📎 Anexos incluídos:">
        <ul style={listStyle}>
          {anexos.map((anexo, index) => (
            <li key={index}>{anexo.filename}</li>
          ))}
        </ul>
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

const listStyle: React.CSSProperties = {
  margin: '10px 0',
  paddingLeft: '20px',
}

const signatureStyle: React.CSSProperties = {
  marginTop: '20px',
}
