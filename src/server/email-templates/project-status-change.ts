import { getBaseLayoutHTML } from './base-layout'

export interface ProjetoStatusChangeData {
  professorNome: string
  professorEmail: string
  projetoTitulo: string
  statusAnterior?: string
  novoStatus: string
  feedback?: string
  bolsasDisponibilizadas?: number
  linkProjeto?: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export function getProjetoStatusChangeHTML(data: ProjetoStatusChangeData): string {
  let title = ''
  let message = ''
  let color = '#1976d2'

  switch (data.novoStatus) {
    case 'SUBMITTED':
      title = '📄 Projeto Submetido para Análise'
      message = `<p>Seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi submetido com sucesso e agora aguarda análise da coordenação.</p>`
      color = '#2196f3'
      break
    case 'PENDING_PROFESSOR_SIGNATURE':
      title = '✍️ Assinatura Pendente no Projeto'
      message = `<p>O projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi gerado ou precisa de sua atenção para assinatura.</p>
                 <p>Por favor, acesse o sistema para revisar os detalhes, baixar o documento para assinatura e realizar o upload do documento assinado.</p>`
      color = '#ff9800'
      break
    case 'PENDING_ADMIN_SIGNATURE':
      title = '✍️ Projeto Aguardando Assinatura do Administrador'
      message = `<p>O projeto de monitoria "<strong>${data.projetoTitulo}</strong>", submetido pelo Prof(a). ${data.professorNome}, foi aprovado preliminarmente e agora aguarda a assinatura do administrador.</p>
                 <p>Acesse o sistema para revisar e assinar a proposta.</p>`
      color = '#ff9800'
      break
    case 'APPROVED':
      title = '✅ Projeto Aprovado!'
      message = `<p>Parabéns! Seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi <strong>APROVADO</strong>.</p>`
      if (data.bolsasDisponibilizadas !== undefined) {
        message += `<p><strong>Bolsas disponibilizadas:</strong> ${data.bolsasDisponibilizadas}</p>`
      }
      if (data.feedback) {
        message += `<div class="info-box"><p><strong>Observações da Coordenação:</strong><br>${data.feedback}</p></div>`
      }
      message += `<p>O próximo passo é aguardar o período de inscrições dos estudantes. Você será notificado.</p>`
      color = '#4caf50'
      break
    case 'REJECTED':
      title = '❌ Projeto Rejeitado'
      message = `<p>Informamos que seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi <strong>REJEITADO</strong>.</p>`
      if (data.feedback) {
        message += `<div class="info-box"><p><strong>Motivo/Observações da Coordenação:</strong><br>${data.feedback}</p></div>`
      }
      message += `<p>Por favor, revise as observações e, se desejar, realize as correções e submeta o projeto novamente.</p>`
      color = '#f44336'
      break
    default:
      title = 'ℹ️ Atualização de Status do Projeto'
      message = `<p>O status do seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi atualizado para: <strong>${data.novoStatus}</strong>.</p>`
  }

  const projectDetails = data.projetoId
    ? `
    <div class="project-info">
        <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
        <p><strong>Título:</strong> ${data.projetoTitulo}</p>
    </div>
  `
    : ''

  const linkHtml = data.linkProjeto
    ? `<a href="${data.linkProjeto}" class="action-button">Acessar Projeto no Sistema</a>`
    : ''

  const content = `
      <h2>${title}</h2>
      <p>Prezado(a) Professor(a) ${data.professorNome},</p>
      ${message}
      ${projectDetails}
      ${linkHtml}
  `

  return getBaseLayoutHTML(title, content, color)
}
