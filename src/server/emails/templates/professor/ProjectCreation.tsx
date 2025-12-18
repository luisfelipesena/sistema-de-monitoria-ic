import { Text, Link } from '@react-email/components'
import { BaseLayout, Button, Heading, InfoBox } from '../../components'

interface ProjectCreationProps {
  professorName: string
  ano: number
  semestreFormatado: string
  linkProjetos: string
}

export function ProjectCreation({
  professorName,
  ano,
  semestreFormatado,
  linkProjetos,
}: ProjectCreationProps) {
  return (
    <BaseLayout preview={`Novos projetos criados para ${semestreFormatado}/${ano}`}>
      <Heading>Novos Projetos de Monitoria Criados</Heading>

      <Text style={textStyle}>
        Olá, <strong>{professorName}</strong>,
      </Text>

      <Text style={textStyle}>
        Informamos que o planejamento de monitoria do{' '}
        <strong>
          {semestreFormatado}/{ano}
        </strong>{' '}
        foi importado e seus projetos foram criados automaticamente no sistema.
      </Text>

      <InfoBox variant="warning" title="Ação Necessária:">
        <Text style={infoTextStyle}>
          Entre no sistema para criar ou revisar os projetos de monitoria sob sua
          responsabilidade.
        </Text>
      </InfoBox>

      <InfoBox variant="info" title="Próximos passos:">
        <ol style={listStyle}>
          <li>Acesse o sistema clicando no botão abaixo</li>
          <li>Revise seus projetos criados e complete as informações</li>
          <li>Verifique se os dados estão corretos (objetivos, atividades, carga horária)</li>
          <li>Assine digitalmente seus projetos para submissão</li>
        </ol>
      </InfoBox>

      <Text style={textStyle}>
        Os projetos foram criados com base nos templates das disciplinas cadastradas.
        Você pode editar qualquer informação antes de assinar e submeter.
      </Text>

      <Button href={linkProjetos}>Acessar Meus Projetos</Button>

      <Text style={importantTextStyle}>
        <strong>Importante:</strong> Após assinar seus projetos, eles serão enviados
        para aprovação da coordenação.
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
