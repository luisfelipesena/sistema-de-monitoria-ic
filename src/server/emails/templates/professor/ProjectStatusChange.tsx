import { Text } from '@react-email/components'
import {
  PROJETO_STATUS_APPROVED,
  PROJETO_STATUS_PENDING_REVISION,
  PROJETO_STATUS_PENDING_SIGNATURE,
  PROJETO_STATUS_REJECTED,
  PROJETO_STATUS_SUBMITTED,
} from '@/types'
import { BaseLayout, Button, Heading, InfoBox, ProjectDetails, colors } from '../../components'

interface ProjectStatusChangeProps {
  professorNome: string
  projetoTitulo: string
  projetoId?: number
  novoStatus: string
  feedback?: string
  bolsasDisponibilizadas?: number
  linkProjeto?: string
}

function getStatusConfig(status: string) {
  switch (status) {
    case PROJETO_STATUS_SUBMITTED:
      return {
        title: 'Projeto Submetido para Análise',
        emoji: '📄',
        color: '#2196f3',
        message:
          'Seu projeto foi submetido com sucesso e agora aguarda análise da coordenação.',
      }
    case PROJETO_STATUS_PENDING_SIGNATURE:
      return {
        title: 'Assinatura Pendente no Projeto',
        emoji: '✍️',
        color: '#ff9800',
        message:
          'O projeto foi gerado ou precisa de sua atenção para assinatura. Por favor, acesse o sistema para revisar os detalhes, baixar o documento para assinatura e realizar o upload do documento assinado.',
      }
    case PROJETO_STATUS_APPROVED:
      return {
        title: 'Projeto Aprovado!',
        emoji: '✅',
        color: colors.success,
        message: 'Parabéns! Seu projeto foi APROVADO.',
      }
    case PROJETO_STATUS_REJECTED:
      return {
        title: 'Projeto Rejeitado',
        emoji: '❌',
        color: colors.error,
        message: 'Informamos que seu projeto foi REJEITADO.',
      }
    case PROJETO_STATUS_PENDING_REVISION:
      return {
        title: 'Revisão Solicitada no Projeto',
        emoji: '📝',
        color: '#ff9800',
        message:
          'A coordenação solicitou revisões no seu projeto. Por favor, acesse o sistema para verificar as observações, realizar as correções necessárias e re-assinar o documento.',
      }
    default:
      return {
        title: 'Atualização de Status do Projeto',
        emoji: 'ℹ️',
        color: colors.primary,
        message: `O status do seu projeto foi atualizado para: ${status}.`,
      }
  }
}

export function ProjectStatusChange({
  professorNome,
  projetoTitulo,
  projetoId,
  novoStatus,
  feedback,
  bolsasDisponibilizadas,
  linkProjeto,
}: ProjectStatusChangeProps) {
  const config = getStatusConfig(novoStatus)

  return (
    <BaseLayout
      preview={`${config.title} - ${projetoTitulo}`}
      accentColor={config.color}
    >
      <Heading color={config.color}>
        {config.emoji} {config.title}
      </Heading>

      <Text style={textStyle}>Prezado(a) Professor(a) {professorNome},</Text>

      <Text style={textStyle}>
        {config.message.includes('APROVADO') || config.message.includes('REJEITADO') ? (
          <>
            {config.message.replace('APROVADO', '').replace('REJEITADO', '')}
            <strong>{novoStatus === PROJETO_STATUS_APPROVED ? 'APROVADO' : 'REJEITADO'}</strong>
            {'.'}
          </>
        ) : (
          config.message
        )}
      </Text>

      <Text style={textStyle}>
        Projeto: "<strong>{projetoTitulo}</strong>"
      </Text>

      {bolsasDisponibilizadas !== undefined && novoStatus === PROJETO_STATUS_APPROVED && (
        <Text style={textStyle}>
          <strong>Bolsas disponibilizadas:</strong> {bolsasDisponibilizadas}
        </Text>
      )}

      {feedback && (
        <InfoBox variant={novoStatus === PROJETO_STATUS_REJECTED ? 'error' : novoStatus === PROJETO_STATUS_PENDING_REVISION ? 'warning' : 'info'}>
          <Text style={infoTextStyle}>
            <strong>
              {novoStatus === PROJETO_STATUS_REJECTED
                ? 'Motivo/Observações da Coordenação:'
                : novoStatus === PROJETO_STATUS_PENDING_REVISION
                  ? 'Revisões Solicitadas pela Coordenação:'
                  : 'Observações da Coordenação:'}
            </strong>
            <br />
            {feedback}
          </Text>
        </InfoBox>
      )}

      {novoStatus === PROJETO_STATUS_APPROVED && (
        <Text style={textStyle}>
          O próximo passo é aguardar o período de inscrições dos estudantes. Você será
          notificado.
        </Text>
      )}

      {novoStatus === PROJETO_STATUS_REJECTED && (
        <Text style={textStyle}>
          Por favor, revise as observações e, se desejar, realize as correções e submeta
          o projeto novamente.
        </Text>
      )}

      {novoStatus === PROJETO_STATUS_PENDING_REVISION && (
        <Text style={textStyle}>
          Após realizar as correções solicitadas, você precisará assinar o projeto novamente
          e submetê-lo para uma nova análise.
        </Text>
      )}

      {projetoId && <ProjectDetails projetoId={projetoId} titulo={projetoTitulo} />}

      {linkProjeto && (
        <Button href={linkProjeto} color={config.color}>
          Acessar Projeto no Sistema
        </Button>
      )}
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}

const infoTextStyle: React.CSSProperties = {
  margin: 0,
}
