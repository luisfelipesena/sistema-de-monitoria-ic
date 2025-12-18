import { Text } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox, Table } from '../../components'

interface Projeto {
  titulo: string
  bolsas: number
  voluntarios: number
}

interface ScholarshipAllocationProps {
  professorName: string
  ano: number
  semestreFormatado: string
  projetos: Projeto[]
  linkProjetos: string
}

export function ScholarshipAllocation({
  professorName,
  ano,
  semestreFormatado,
  projetos,
  linkProjetos,
}: ScholarshipAllocationProps) {
  const totalBolsas = projetos.reduce((sum, p) => sum + p.bolsas, 0)
  const projetosSemBolsas = projetos.filter((p) => p.bolsas === 0).length

  const tableData = projetos.map((p) => ({
    titulo: p.titulo,
    bolsas: <strong>{p.bolsas}</strong>,
    voluntarios: String(p.voluntarios),
  }))

  return (
    <BaseLayout preview={`Bolsas alocadas para ${semestreFormatado}/${ano}`}>
      <Heading>Bolsas de Monitoria Alocadas</Heading>

      <Text style={textStyle}>
        Olá, <strong>{professorName}</strong>,
      </Text>

      <Text style={textStyle}>
        Informamos que as bolsas de monitoria para o{' '}
        <strong>
          {semestreFormatado}/{ano}
        </strong>{' '}
        foram alocadas pela coordenação.
      </Text>

      <InfoBox variant="warning" title="📊 Resumo de Alocação:">
        <Text style={infoTextStyle}>
          Total de <strong>{totalBolsas}</strong> bolsa(s) alocada(s) para seus projetos:
        </Text>
      </InfoBox>

      <Table
        columns={[
          { key: 'titulo', header: 'Projeto', align: 'left' },
          { key: 'bolsas', header: 'Bolsas', align: 'center' },
          { key: 'voluntarios', header: 'Voluntários', align: 'center' },
        ]}
        data={tableData}
      />

      <InfoBox variant="info" title="Próximos passos:">
        <ol style={listStyle}>
          <li>Acesse o sistema e verifique a alocação de bolsas</li>
          <li>
            Preencha as informações do edital interno DCC (datas de prova, pontos,
            bibliografia)
          </li>
          <li>Aguarde a publicação do edital para início das inscrições</li>
        </ol>
      </InfoBox>

      <Button href={linkProjetos}>Acessar Meus Projetos</Button>

      <Text style={importantTextStyle}>
        <strong>Importante:</strong> O número de bolsas alocadas é definido pela
        coordenação e não pode ser alterado.{' '}
        {projetosSemBolsas > 0
          ? `Os projetos que receberam 0 bolsa PROGRAD devem operar apenas com vagas voluntárias.`
          : 'Você pode definir vagas voluntárias adicionais se desejar.'}
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

const listStyle: React.CSSProperties = {
  margin: '10px 0',
  paddingLeft: '20px',
}

const importantTextStyle: React.CSSProperties = {
  marginTop: '30px',
  color: '#666666',
  fontSize: '14px',
}

const signatureStyle: React.CSSProperties = {
  marginTop: '20px',
}
