import { getBaseLayoutHTML } from './base-layout'

export function getNotificacaoGeralAdminsHTML(
  subjectTitle: string,
  htmlMessage: string,
  link?: { text: string; url: string }
): string {
  const ctaButton = link ? `<a href="${link.url}" class="action-button">${link.text}</a>` : ''
  const content = `
      <h2>${subjectTitle}</h2>
      <p>Prezada Coordenação/Administração,</p>
      ${htmlMessage}
      ${ctaButton}
  `
  return getBaseLayoutHTML(subjectTitle, content, '#673ab7')
}
