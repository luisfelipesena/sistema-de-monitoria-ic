// Email service exports - organized by domain
export * from './email-sender'
export * from './projeto-emails'
export * from './student-emails'
export * from './admin-emails'
export * from './auth-emails'
export * from './professor-emails'
export * from './relatorios-emails'

// Legacy compatibility - re-export commonly used functions
import { projetoEmailService } from './projeto-emails'
import { studentEmailService } from './student-emails'
import { adminEmailService } from './admin-emails'
import { authEmailService } from './auth-emails'
import { professorEmailService } from './professor-emails'
import { emailSender } from './email-sender'

// Named function exports for direct imports
export const sendPlanilhaPROGRADEmail = adminEmailService.sendPlanilhaPROGRAD.bind(adminEmailService)
export const sendScholarshipAllocationNotification =
  projetoEmailService.sendScholarshipAllocation.bind(projetoEmailService)
export const sendStudentSelectionResultNotification = studentEmailService.sendSelectionResult.bind(studentEmailService)
export const sendEditalPublishedNotification = adminEmailService.sendEditalPublished.bind(adminEmailService)
export const sendProjectCreationNotification = projetoEmailService.sendCreationNotification.bind(projetoEmailService)
export const sendProfessorInvitationEmail = professorEmailService.sendInvitation.bind(professorEmailService)
export const sendDepartamentoConsolidationEmail = adminEmailService.sendDepartmentConsolidation.bind(adminEmailService)

export const emailService = {
  // Core sender
  sendGenericEmail: emailSender.send.bind(emailSender),

  // Project emails
  sendProjetoStatusChangeNotification: projetoEmailService.sendStatusChange.bind(projetoEmailService),
  sendProjetoSubmetidoParaAdminsNotification: projetoEmailService.sendSubmittedToAdmins.bind(projetoEmailService),
  sendProfessorAssinouPropostaNotification:
    projetoEmailService.sendProfessorSignedNotification.bind(projetoEmailService),
  sendAdminAssinouPropostaNotification: projetoEmailService.sendAdminSignedNotification.bind(projetoEmailService),
  sendProjetoGeradoParaAssinaturaNotification:
    projetoEmailService.sendPendingSignatureNotification.bind(projetoEmailService),
  sendLembreteSubmissaoProjetoPendente: projetoEmailService.sendSubmissionReminder.bind(projetoEmailService),
  sendProjectCreationNotification: projetoEmailService.sendCreationNotification.bind(projetoEmailService),
  sendScholarshipAllocationNotification: projetoEmailService.sendScholarshipAllocation.bind(projetoEmailService),

  // Student emails
  sendStudentSelectionResultNotification: studentEmailService.sendSelectionResult.bind(studentEmailService),
  sendLembreteSelecaoMonitoresPendente: studentEmailService.sendMonitorSelectionReminder.bind(studentEmailService),

  // Admin emails
  sendPlanilhaPROGRADEmail: adminEmailService.sendPlanilhaPROGRAD.bind(adminEmailService),
  sendDepartamentoConsolidationEmail: adminEmailService.sendDepartmentConsolidation.bind(adminEmailService),
  sendEditalPublishedNotification: adminEmailService.sendEditalPublished.bind(adminEmailService),
  sendChefeSignatureRequest: adminEmailService.sendChefeSignatureRequest.bind(adminEmailService),

  // Auth emails
  sendEmailVerification: authEmailService.sendEmailVerification.bind(authEmailService),
  sendPasswordResetEmail: authEmailService.sendPasswordReset.bind(authEmailService),

  // Professor emails
  sendProfessorInvitationEmail: professorEmailService.sendInvitation.bind(professorEmailService),
}
