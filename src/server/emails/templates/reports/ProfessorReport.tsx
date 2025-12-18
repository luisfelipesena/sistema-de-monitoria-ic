import { Text, Link } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, Table } from '../../components'

interface Projeto {
  id: number
  titulo: string
  disciplinaNome: string
  qtdMonitores: number
  linkRelatorio: string
}

interface ProfessorReportProps {
  professorNome: string
  ano: number
  semestreDisplay: string
  projetos: Projeto[]
  prazoText: string
  linkRelatorios: string
}

export function ProfessorReport({
  professorNome,
  ano,
  semestreDisplay,
  projetos,
  prazoText,
  linkRelatorios,
}: ProfessorReportProps) {
  const tableData = projetos.map((p) => ({
    disciplina: p.disciplinaNome,
    titulo: p.titulo,
    monitores: String(p.qtdMonitores),
    acao: (
      <Link href={p.linkRelatorio} style={linkStyle}>
        Acessar
      </Link>
    ),
  }))

  return (
    <BaseLayout
      preview={`Solicitação de Relatórios Finais - ${semestreDisplay}/${ano}`}
      accentColor="#0b5394"
    >
      <Heading color="#0b5394">
        Solicitação de Relatórios Finais - {semestreDisplay}/{ano}
      </Heading>

      <Text style={textStyle}>
        Prezado(a) Prof(a). <strong>{professorNome}</strong>,
      </Text>

      <Text style={textStyle}>
        O período de{' '}
        <strong>
          {semestreDisplay}/{ano}
        </strong>{' '}
        está finalizando. Solicitamos a geração dos relatórios finais de monitoria{' '}
        {prazoText}.
      </Text>

      <Text style={subtitleStyle}>Projetos Pendentes de Relatório</Text>

      <Table
        columns={[
          { key: 'disciplina', header: 'Disciplina', align: 'left' },
          { key: 'titulo', header: 'Projeto', align: 'left' },
          { key: 'monitores', header: 'Monitores', align: 'center' },
          { key: 'acao', header: 'Ação', align: 'center' },
        ]}
        data={tableData}
        headerBgColor="#0b5394"
      />

      <InfoBox variant="warning" title="Importante:">
        <ul style={listStyle}>
          <li>Gerar relatório final da disciplina</li>
          <li>Gerar relatório individual para cada monitor</li>
          <li>Assinar todos os relatórios digitalmente</li>
          <li>Os monitores também precisarão assinar seus relatórios</li>
        </ul>
      </InfoBox>

      <Button href={linkRelatorios} color="#0b5394">
        Acessar Relatórios Finais
      </Button>

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

const subtitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333333',
  marginTop: '25px',
  marginBottom: '15px',
}

const listStyle: React.CSSProperties = {
  margin: '10px 0',
  paddingLeft: '20px',
}

const linkStyle: React.CSSProperties = {
  color: '#0066cc',
  textDecoration: 'underline',
}

const signatureStyle: React.CSSProperties = {
  marginTop: '30px',
  color: '#666666',
}
