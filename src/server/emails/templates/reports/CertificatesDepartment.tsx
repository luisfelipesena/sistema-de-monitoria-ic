import { Text } from '@react-email/components'
import { BaseLayout, Heading, InfoBox } from '../../components'

interface CertificatesDepartmentProps {
  semestreDisplay: string
  ano: number
  anexos: { filename: string }[]
}

export function CertificatesDepartment({
  semestreDisplay,
  ano,
  anexos,
}: CertificatesDepartmentProps) {
  return (
    <BaseLayout
      preview={`Planilhas de Certificados - ${semestreDisplay}/${ano}`}
      accentColor="#0b5394"
    >
      <Heading color="#0b5394">
        Planilhas de Certificados - {semestreDisplay}/{ano}
      </Heading>

      <Text style={textStyle}>Prezados,</Text>

      <Text style={textStyle}>
        Seguem em anexo as planilhas de certificados de monitoria referentes ao
        período{' '}
        <strong>
          {semestreDisplay}/{ano}
        </strong>{' '}
        para encaminhamento ao NUMOP.
      </Text>

      <InfoBox variant="info" title="Anexos incluídos:">
        <ul style={listStyle}>
          {anexos.map((anexo, index) => (
            <li key={index}>{anexo.filename}</li>
          ))}
        </ul>
      </InfoBox>

      <Text style={textStyle}>
        Cada planilha contém os dados necessários para emissão dos certificados,
        incluindo links para os relatórios finais em PDF.
      </Text>

      <Text style={signatureStyle}>
        Atenciosamente,
        <br />
        <strong>Sistema de Monitoria IC - UFBA</strong>
        <br />
        Instituto de Computação
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
  marginTop: '30px',
  color: '#666666',
}
