import { Text } from '@react-email/components'
import { BaseLayout, Heading, colors } from '../../components'

interface PlanilhaProgradProps {
  semestreDisplay: string
  ano: number
  formatoTexto: string
  totalPdfAttachments?: number
}

export function PlanilhaPrograd({
  semestreDisplay,
  ano,
  formatoTexto,
  totalPdfAttachments = 0,
}: PlanilhaProgradProps) {
  return (
    <BaseLayout
      preview={`Consolidação para Instituto - ${ano}.${semestreDisplay}`}
      accentColor="#1976d2"
    >
      <Heading color="#1976d2">
        Planilha para Instituto - {ano}.{semestreDisplay}
      </Heading>

      <Text style={textStyle}>Prezados,</Text>

      <Text style={textStyle}>
        Segue em anexo a planilha de consolidação dos monitores aprovados no
        Instituto de Computação para o período {ano}.{semestreDisplay} em formato{' '}
        {formatoTexto}.
      </Text>

      <Text style={textStyle}>
        Esta planilha contém informações completas sobre:
      </Text>

      <ul style={listStyle}>
        <li>Monitores bolsistas e voluntários selecionados</li>
        <li>Dados pessoais e acadêmicos dos monitores</li>
        <li>Informações bancárias (quando aplicável)</li>
        <li>Projetos e disciplinas vinculadas</li>
        <li>Professores responsáveis e carga horária</li>
        <li>Departamentos e códigos das disciplinas</li>
      </ul>

      {totalPdfAttachments > 0 && (
        <>
          <Text style={textStyle}>
            <strong>📎 Anexos incluídos:</strong>
          </Text>
          <ul style={listStyle}>
            <li>Planilha consolidada ({formatoTexto})</li>
            <li>{totalPdfAttachments} PDF(s) individual(is) de projeto(s) aprovado(s)</li>
          </ul>
        </>
      )}

      <Text style={textStyle}>
        Esta planilha será encaminhada pelo Instituto de Computação à PROGRAD para
        processamento.
      </Text>

      <Text style={textStyle}>
        Para dúvidas ou esclarecimentos, entrar em contato através do Sistema de
        Monitoria IC.
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
  margin: '10px 0 20px 0',
  paddingLeft: '20px',
}

const signatureStyle: React.CSSProperties = {
  marginTop: '20px',
}
