import { getBaseLayoutHTML } from './base-layout'

export interface LembreteSubmissaoData {
  professorEmail: string
  professorNome: string
  periodoFormatado: string
  customMessage?: string
  linkPlataforma: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export interface LembreteSelecaoData {
  professorEmail: string
  professorNome: string
  projetoTitulo: string
  customMessage?: string
  linkPlataforma: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export function getLembreteSubmissaoProjetoHTML(data: LembreteSubmissaoData): string {
  const title = 'Lembrete: Submissão de Projeto de Monitoria'
  let message = `
    <p>Este é um lembrete sobre a submissão do seu projeto de monitoria para o período <strong>${data.periodoFormatado}</strong>.</p>
    <p>Nossos registros indicam que você ainda não submeteu um projeto para este período. Se você planeja oferecer monitoria, por favor:</p>
    <ol>
      <li>Acesse a plataforma de monitoria (${data.linkPlataforma})</li>
      <li>Crie seu projeto de monitoria</li>
      <li>Submeta o projeto para aprovação</li>
    </ol>
  `
  if (data.customMessage) {
    message += `<div class="info-box"><p><strong>Mensagem adicional da coordenação:</strong><br>${data.customMessage}</p></div>`
  }
  message += `<p>Se você não planeja oferecer monitoria neste período, ou já submeteu seu projeto, pode desconsiderar este email.</p>
             <p>Em caso de dúvidas, entre em contato com a coordenação do programa de monitoria.</p>`

  const content = `
      <h2>${title}</h2>
      <p>Prezado(a) Professor(a) ${data.professorNome},</p>
      ${message}
      <a href="${data.linkPlataforma}" class="action-button">Acessar Plataforma</a>
  `
  return getBaseLayoutHTML(title, content, '#ffc107')
}

export function getLembreteSelecaoMonitoresHTML(data: LembreteSelecaoData): string {
  const title = 'Lembrete: Seleção de Monitores Pendente'
  let message = `
    <p>Este é um lembrete sobre a seleção de monitores para o projeto "<strong>${data.projetoTitulo}</strong>".</p>
    <p>Favor verificar se há candidatos inscritos e proceder com a seleção através da plataforma (${data.linkPlataforma}).</p>
  `
  if (data.customMessage) {
    message += `<div class="info-box"><p><strong>Mensagem adicional da coordenação:</strong><br>${data.customMessage}</p></div>`
  }
  const projectDetails = data.projetoId
    ? `
    <div class="project-info">
        <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
        <p><strong>Título:</strong> ${data.projetoTitulo}</p>
    </div>
  `
    : ''
  const content = `
      <h2>${title}</h2>
      <p>Prezado(a) Professor(a) ${data.professorNome},</p>
      ${message}
      ${projectDetails}
      <a href="${data.linkPlataforma}" class="action-button">Acessar Projeto na Plataforma</a>
  `
  return getBaseLayoutHTML(title, content, '#ff9800')
}
