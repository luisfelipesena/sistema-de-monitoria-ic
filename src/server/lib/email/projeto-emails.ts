import { getNotificacaoGeralAdminsHTML } from '@/server/email-templates/admin-notifications'
import {
  getProjetoStatusChangeHTML,
  type ProjetoStatusChangeData,
} from '@/server/email-templates/project-status-change'
import {
  getLembreteSubmissaoProjetoHTML,
  type LembreteSubmissaoData,
} from '@/server/email-templates/reminder-templates'
import { getSemestreNumero, PROJETO_STATUS_PENDING_SIGNATURE, SEMESTRE_LABELS, type Semestre } from '@/types'
import { env } from '@/utils/env'
import { emailSender } from './email-sender'

const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export const projetoEmailService = {
  async sendStatusChange(data: ProjetoStatusChangeData, remetenteUserId?: number): Promise<void> {
    data.linkProjeto = `${clientUrl}/home/professor/project/${data.projetoId}`

    const html = getProjetoStatusChangeHTML(data)
    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Projeto ${data.novoStatus}: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: `PROJETO_${data.novoStatus.toUpperCase()}`,
      projetoId: data.projetoId,
      remetenteUserId: remetenteUserId ?? data.remetenteUserId,
    })
  },

  async sendSubmittedToAdmins(
    data: {
      professorNome: string
      projetoTitulo: string
      projetoId: number
      departamento?: string
      semestre?: string
      ano?: number
      remetenteUserId?: number
    },
    adminEmails: string[]
  ): Promise<void> {
    const linkProjeto = `${clientUrl}/home/admin/project/${data.projetoId}`

    const htmlMessage = `
      <p>O projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi submetido pelo Prof(a). ${data.professorNome} e aguarda análise.</p>
      <div class="project-info">
          <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
          <p><strong>Título:</strong> ${data.projetoTitulo}</p>
          ${data.departamento ? `<p><strong>Departamento:</strong> ${data.departamento}</p>` : ''}
          ${data.ano && data.semestre ? `<p><strong>Período:</strong> ${data.ano}.${getSemestreNumero(data.semestre as Semestre)}</p>` : ''}
      </div>
    `

    const html = getNotificacaoGeralAdminsHTML('Novo Projeto Submetido para Análise', htmlMessage, {
      text: 'Revisar Projeto',
      url: linkProjeto,
    })

    await emailSender.sendBatch(
      adminEmails.map((adminEmail) => ({
        to: adminEmail,
        subject: `[Monitoria IC] Novo Projeto Submetido: ${data.projetoTitulo}`,
        html,
        tipoNotificacao: 'PROJETO_SUBMETIDO_ADMIN',
        projetoId: data.projetoId,
        remetenteUserId: data.remetenteUserId,
      }))
    )
  },

  async sendProfessorSignedNotification(
    data: {
      professorNome: string
      projetoTitulo: string
      projetoId: number
      novoStatusProjeto: string
      remetenteUserId?: number
    },
    adminEmails: string[]
  ): Promise<void> {
    const linkProjeto = `${clientUrl}/home/admin/dashboard`

    const htmlMessage = `
      <p>O Prof(a). ${data.professorNome} assinou e enviou a proposta para o projeto "<strong>${data.projetoTitulo}</strong>".</p>
      <p>O projeto está agora com status "<strong>${data.novoStatusProjeto}</strong>" e pode requerer sua revisão e/ou assinatura como administrador.</p>
      <div class="project-info">
          <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
          <p><strong>Título:</strong> ${data.projetoTitulo}</p>
      </div>
    `

    const html = getNotificacaoGeralAdminsHTML('Proposta Assinada pelo Professor', htmlMessage, {
      text: 'Revisar Proposta',
      url: linkProjeto,
    })

    await emailSender.sendBatch(
      adminEmails.map((adminEmail) => ({
        to: adminEmail,
        subject: `[Monitoria IC] Proposta Assinada: ${data.projetoTitulo}`,
        html,
        tipoNotificacao: 'PROPOSTA_PROFESSOR_ASSINADA_ADMIN',
        projetoId: data.projetoId,
        remetenteUserId: data.remetenteUserId,
      }))
    )
  },

  async sendPendingSignatureNotification(data: {
    professorEmail: string
    professorNome: string
    projetoId: number
    projetoTitulo: string
    remetenteUserId?: number
  }): Promise<void> {
    const emailPayload: ProjetoStatusChangeData = {
      professorEmail: data.professorEmail,
      professorNome: data.professorNome,
      projetoTitulo: data.projetoTitulo,
      projetoId: data.projetoId,
      novoStatus: PROJETO_STATUS_PENDING_SIGNATURE,
      linkProjeto: `${clientUrl}/home/professor/project/${data.projetoId}`,
      remetenteUserId: data.remetenteUserId,
    }

    const html = getProjetoStatusChangeHTML(emailPayload)
    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Projeto Gerado: ${data.projetoTitulo} - Assinatura Necessária`,
      html,
      tipoNotificacao: 'PROJETO_GERADO_ASSINATURA_PROFESSOR',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendAdminSignedNotification(data: {
    professorEmail: string
    professorNome: string
    projetoTitulo: string
    projetoId: number
    novoStatusProjeto: string
    remetenteUserId?: number
  }): Promise<void> {
    const emailData: ProjetoStatusChangeData = {
      professorEmail: data.professorEmail,
      professorNome: data.professorNome,
      projetoTitulo: data.projetoTitulo,
      projetoId: data.projetoId,
      novoStatus: data.novoStatusProjeto,
      linkProjeto: `${clientUrl}/home/professor/project/${data.projetoId}`,
      feedback: 'A proposta foi assinada pelo administrador e o projeto está aprovado.',
      remetenteUserId: data.remetenteUserId,
    }

    const html = getProjetoStatusChangeHTML(emailData)
    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Projeto Aprovado e Assinado: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: 'PROJETO_ADMIN_ASSINOU_PROFESSOR',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendCreationNotification(data: {
    to: string
    professorName: string
    ano: number
    semestre: Semestre
  }): Promise<void> {
    const semestreFormatado = SEMESTRE_LABELS[data.semestre]

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Novos Projetos de Monitoria Criados</h2>

        <p>Olá, <strong>${data.professorName}</strong>,</p>

        <p>Informamos que o planejamento de monitoria do <strong>${semestreFormatado}/${data.ano}</strong> foi importado e seus projetos foram criados automaticamente no sistema.</p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>🔔 Ação Necessária:</strong></p>
          <p style="margin: 10px 0;">Entre no sistema para criar ou revisar os projetos de monitoria sob sua responsabilidade.</p>
        </div>

        <div style="background-color: #e6f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Próximos passos:</strong></p>
          <ol style="margin: 10px 0;">
            <li>Acesse o sistema clicando no botão abaixo</li>
            <li>Revise seus projetos criados e complete as informações</li>
            <li>Verifique se os dados estão corretos (objetivos, atividades, carga horária)</li>
            <li>Assine digitalmente seus projetos para submissão</li>
          </ol>
        </div>

        <p>Os projetos foram criados com base nos templates das disciplinas cadastradas. Você pode editar qualquer informação antes de assinar e submeter.</p>

        <p style="margin-top: 20px;">
          <a href="${clientUrl}/home/professor/dashboard"
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Acessar Meus Projetos
          </a>
        </p>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          <strong>Importante:</strong> Após assinar seus projetos, eles serão enviados para aprovação da coordenação.
        </p>

        <p style="margin-top: 20px;">Atenciosamente,<br/>
        <strong>Sistema de Monitoria IC - UFBA</strong></p>
      </div>
    `

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Projetos criados para ${semestreFormatado}/${data.ano}`,
      html,
      tipoNotificacao: 'PROJECT_CREATION_NOTIFICATION',
    })
  },

  async sendSubmissionReminder(data: LembreteSubmissaoData): Promise<void> {
    const html = getLembreteSubmissaoProjetoHTML(data)
    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Lembrete: Submissão de Projeto Pendente - Período ${data.periodoFormatado}`,
      html,
      tipoNotificacao: 'LEMBRETE_SUBMISSAO_PROJETO',
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendScholarshipAllocation(data: {
    to: string
    professorName: string
    ano: number
    semestre: string
    projetos: { titulo: string; bolsas: number; voluntarios: number }[]
  }): Promise<void> {
    const semestreFormatado = data.semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre'
    const totalBolsas = data.projetos.reduce((sum, p) => sum + p.bolsas, 0)
    const projetosSemBolsas = data.projetos.filter((p) => p.bolsas === 0).length

    const projetosHtml = data.projetos
      .map(
        (p) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.titulo}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><strong>${p.bolsas}</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.voluntarios}</td>
      </tr>
    `
      )
      .join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Bolsas de Monitoria Alocadas</h2>

        <p>Olá, <strong>${data.professorName}</strong>,</p>

        <p>Informamos que as bolsas de monitoria para o <strong>${semestreFormatado}/${data.ano}</strong> foram alocadas pela coordenação.</p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📊 Resumo de Alocação:</strong></p>
          <p style="margin: 10px 0;">Total de <strong>${totalBolsas}</strong> bolsa(s) alocada(s) para seus projetos:</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Projeto</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Bolsas</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Voluntários</th>
            </tr>
          </thead>
          <tbody>
            ${projetosHtml}
          </tbody>
        </table>

        <div style="background-color: #e6f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Próximos passos:</strong></p>
          <ol style="margin: 10px 0;">
            <li>Acesse o sistema e verifique a alocação de bolsas</li>
            <li>Preencha as informações do edital interno DCC (datas de prova, pontos, bibliografia)</li>
            <li>Aguarde a publicação do edital para início das inscrições</li>
          </ol>
        </div>

        <p style="margin-top: 20px;">
          <a href="${clientUrl}/home/professor/dashboard"
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Acessar Meus Projetos
          </a>
        </p>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          <strong>Importante:</strong> O número de bolsas alocadas é definido pela coordenação e não pode ser alterado.
          ${
            projetosSemBolsas > 0
              ? `Os projetos que receberam <strong>0 bolsa PROGRAD</strong> devem operar apenas com vagas voluntárias.`
              : 'Você pode definir vagas voluntárias adicionais se desejar.'
          }
        </p>

        <p style="margin-top: 20px;">Atenciosamente,<br/>
        <strong>Sistema de Monitoria IC - UFBA</strong></p>
      </div>
    `

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Bolsas alocadas para ${semestreFormatado}/${data.ano}`,
      html,
      tipoNotificacao: 'SCHOLARSHIP_ALLOCATION_NOTIFICATION',
    })
  },
}
