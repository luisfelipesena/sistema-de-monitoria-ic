import type { db } from '@/server/db'
import {
  alunoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  userTable,
  vagaTable,
  departamentoTable,
} from '@/server/db/schema'
import { relatoriosEmailService } from '@/server/lib/email/relatorios-emails'
import { APPROVED, SEMESTRE_LABELS, type Semestre, extractNotaFromRelatorioConteudo } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm'
import * as XLSX from 'xlsx'

type Database = typeof db

const log = logger.child({ context: 'RelatoriosNotificationsService' })
const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export function createRelatoriosNotificationsService(database: Database) {
  return {
    /**
     * Notifica professores para gerar relatórios finais
     * Admin dispara essa notificação no final do semestre
     */
    async notifyProfessorsToGenerateReports(
      ano: number,
      semestre: Semestre,
      prazoFinal: Date | undefined,
      remetenteUserId: number
    ): Promise<{ success: boolean; emailsEnviados: number; errors: string[] }> {
      const errors: string[] = []
      let emailsEnviados = 0

      // Buscar professores com projetos aprovados que ainda não têm relatório final
      const professoresComProjetos = await database
        .select({
          professorId: professorTable.id,
          professorNome: professorTable.nomeCompleto,
          professorEmail: userTable.email,
          projetoId: projetoTable.id,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          relatorioId: relatorioFinalDisciplinaTable.id,
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(userTable, eq(professorTable.userId, userTable.id))
        .leftJoin(relatorioFinalDisciplinaTable, eq(projetoTable.id, relatorioFinalDisciplinaTable.projetoId))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre), eq(projetoTable.status, APPROVED)))

      // Filtrar apenas projetos sem relatório
      const projetosSemRelatorio = professoresComProjetos.filter((row) => !row.relatorioId)
      const allProjectIds = projetosSemRelatorio.map((row) => row.projetoId)

      // Pre-fetch all monitor counts in a single query (fix N+1)
      const monitorCountsByProject =
        allProjectIds.length > 0
          ? await database
              .select({
                projetoId: vagaTable.projetoId,
                count: count(),
              })
              .from(vagaTable)
              .where(inArray(vagaTable.projetoId, allProjectIds))
              .groupBy(vagaTable.projetoId)
          : []

      // Convert to Map for O(1) lookup
      const countsMap = new Map(monitorCountsByProject.map((r) => [r.projetoId, r.count]))

      // Agrupar por professor
      const professoresMap = new Map<
        number,
        {
          email: string
          nome: string
          projetos: { id: number; titulo: string; disciplinaNome: string; qtdMonitores: number }[]
        }
      >()

      for (const row of projetosSemRelatorio) {
        if (!professoresMap.has(row.professorId)) {
          professoresMap.set(row.professorId, {
            email: row.professorEmail,
            nome: row.professorNome,
            projetos: [],
          })
        }

        professoresMap.get(row.professorId)?.projetos.push({
          id: row.projetoId,
          titulo: row.projetoTitulo,
          disciplinaNome: row.disciplinaNome || 'N/A',
          qtdMonitores: countsMap.get(row.projetoId) || 0,
        })
      }

      // Enviar emails
      for (const [_professorId, data] of professoresMap) {
        if (data.projetos.length === 0) continue

        try {
          await relatoriosEmailService.sendProfessorRelatorioNotification({
            professorEmail: data.email,
            professorNome: data.nome,
            projetos: data.projetos,
            ano,
            semestre,
            prazoFinal,
            remetenteUserId,
          })
          emailsEnviados++
        } catch (error) {
          const errorMsg = `Erro ao enviar email para ${data.email}: ${error instanceof Error ? error.message : String(error)}`
          log.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      return { success: errors.length === 0, emailsEnviados, errors }
    },

    /**
     * Notifica alunos que têm relatórios pendentes de assinatura
     */
    async notifyStudentsWithPendingReports(
      ano: number,
      semestre: Semestre,
      remetenteUserId: number
    ): Promise<{ success: boolean; emailsEnviados: number; errors: string[] }> {
      const errors: string[] = []
      let emailsEnviados = 0

      // Buscar relatórios de monitores pendentes de assinatura do aluno
      const relatoriosPendentes = await database
        .select({
          relatorioId: relatorioFinalMonitorTable.id,
          alunoNome: alunoTable.nomeCompleto,
          alunoEmail: userTable.email,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          professorNome: professorTable.nomeCompleto,
        })
        .from(relatorioFinalMonitorTable)
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(relatorioFinalMonitorTable.alunoAssinouEm)
          )
        )

      for (const relatorio of relatoriosPendentes) {
        try {
          await relatoriosEmailService.sendStudentRelatorioNotification({
            alunoEmail: relatorio.alunoEmail,
            alunoNome: relatorio.alunoNome,
            projetoTitulo: relatorio.projetoTitulo,
            disciplinaNome: relatorio.disciplinaNome || 'N/A',
            professorNome: relatorio.professorNome,
            linkRelatorio: `${clientUrl}/home/student/relatorios?id=${relatorio.relatorioId}`,
            remetenteUserId,
          })
          emailsEnviados++
        } catch (error) {
          const errorMsg = `Erro ao enviar email para ${relatorio.alunoEmail}: ${error instanceof Error ? error.message : String(error)}`
          log.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      return { success: errors.length === 0, emailsEnviados, errors }
    },

    /**
     * Gera texto padrão para ata do departamento
     */
    async gerarTextoAta(ano: number, semestre: Semestre): Promise<string> {
      const semestreDisplay = SEMESTRE_LABELS[semestre]

      // Buscar todos os relatórios finais assinados
      const relatorios = await database
        .select({
          professorNome: professorTable.nomeCompleto,
          alunoNome: alunoTable.nomeCompleto,
          alunoMatricula: alunoTable.matricula,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          tipoVaga: vagaTable.tipo,
          relatorioConteudo: relatorioFinalMonitorTable.conteudo,
        })
        .from(relatorioFinalMonitorTable)
        .innerJoin(
          relatorioFinalDisciplinaTable,
          eq(relatorioFinalMonitorTable.relatorioDisciplinaId, relatorioFinalDisciplinaTable.id)
        )
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(vagaTable, eq(vagaTable.inscricaoId, inscricaoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      if (relatorios.length === 0) {
        return `Não há relatórios finais registrados para o período ${semestreDisplay}/${ano}.`
      }

      let texto = `RELATÓRIOS FINAIS DE MONITORIA - ${semestreDisplay}/${ano}\n\n`
      texto += `O Departamento de Ciência da Computação submete à apreciação do Colegiado os seguintes relatórios finais de monitoria:\n\n`

      for (const rel of relatorios) {
        const nota = extractNotaFromRelatorioConteudo(rel.relatorioConteudo)
        const tipoVaga = rel.tipoVaga === 'BOLSISTA' ? 'Bolsista' : 'Voluntário'
        texto += `- Professor(a) ${rel.professorNome} solicita aprovação do relatório de monitoria do(a) aluno(a) `
        texto += `${rel.alunoNome} (matrícula: ${rel.alunoMatricula || 'N/A'}), ${tipoVaga}, `
        texto += `com nota ${nota}, no semestre ${semestreDisplay}/${ano}, na disciplina ${rel.disciplinaNome || rel.projetoTitulo}.\n\n`
      }

      texto += `\nTotal de relatórios: ${relatorios.length}\n`

      return texto
    },

    /**
     * Gera planilhas de certificados (bolsistas, voluntários, relatórios)
     */
    async gerarPlanilhasCertificados(
      ano: number,
      semestre: Semestre
    ): Promise<{ bolsistas: Buffer; voluntarios: Buffer; relatoriosDisciplina: Buffer }> {
      const _semestreDisplay = SEMESTRE_LABELS[semestre]

      // Buscar dados dos monitores com relatórios assinados
      const monitores = await database
        .select({
          alunoNome: alunoTable.nomeCompleto,
          alunoMatricula: alunoTable.matricula,
          alunoCpf: alunoTable.cpf,
          alunoEmail: userTable.email,
          professorNome: professorTable.nomeCompleto,
          professorSiape: professorTable.matriculaSiape,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          projetoId: projetoTable.id,
          tipoVaga: vagaTable.tipo,
          cargaHoraria: sql<number>`${projetoTable.cargaHorariaSemana} * ${projetoTable.numeroSemanas}`,
          relatorioMonitorId: relatorioFinalMonitorTable.id,
          relatorioConteudo: relatorioFinalMonitorTable.conteudo,
          departamentoNome: departamentoTable.nome,
        })
        .from(relatorioFinalMonitorTable)
        .innerJoin(
          relatorioFinalDisciplinaTable,
          eq(relatorioFinalMonitorTable.relatorioDisciplinaId, relatorioFinalDisciplinaTable.id)
        )
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(vagaTable, eq(vagaTable.inscricaoId, inscricaoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      // Separar bolsistas e voluntários
      const bolsistas = monitores.filter((m) => m.tipoVaga === 'BOLSISTA')
      const voluntarios = monitores.filter((m) => m.tipoVaga === 'VOLUNTARIO')

      // Gerar planilha de bolsistas
      const bolsistasData = bolsistas.map((m) => ({
        'Nome do Aluno': m.alunoNome,
        Matrícula: m.alunoMatricula || '',
        CPF: m.alunoCpf || '',
        Email: m.alunoEmail,
        Disciplina: m.disciplinaNome || m.projetoTitulo,
        Professor: m.professorNome,
        SIAPE: m.professorSiape || '',
        Departamento: m.departamentoNome,
        'Carga Horária Total': m.cargaHoraria,
        Nota: extractNotaFromRelatorioConteudo(m.relatorioConteudo),
        'Link Relatório PDF': `${clientUrl}/api/relatorio-monitor/${m.relatorioMonitorId}/pdf`,
      }))

      const wsBolsistas = XLSX.utils.json_to_sheet(bolsistasData)
      const wbBolsistas = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wbBolsistas, wsBolsistas, 'Bolsistas')
      const bolsistasBuffer = Buffer.from(XLSX.write(wbBolsistas, { type: 'buffer', bookType: 'xlsx' }))

      // Gerar planilha de voluntários
      const voluntariosData = voluntarios.map((m) => ({
        'Nome do Aluno': m.alunoNome,
        Matrícula: m.alunoMatricula || '',
        CPF: m.alunoCpf || '',
        Email: m.alunoEmail,
        Disciplina: m.disciplinaNome || m.projetoTitulo,
        Professor: m.professorNome,
        Departamento: m.departamentoNome,
        'Carga Horária Total': m.cargaHoraria,
        Nota: extractNotaFromRelatorioConteudo(m.relatorioConteudo),
        'Link Relatório PDF': `${clientUrl}/api/relatorio-monitor/${m.relatorioMonitorId}/pdf`,
      }))

      const wsVoluntarios = XLSX.utils.json_to_sheet(voluntariosData)
      const wbVoluntarios = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wbVoluntarios, wsVoluntarios, 'Voluntários')
      const voluntariosBuffer = Buffer.from(XLSX.write(wbVoluntarios, { type: 'buffer', bookType: 'xlsx' }))

      // Gerar planilha de relatórios de disciplina
      const relatoriosDisciplina = await database
        .select({
          professorNome: professorTable.nomeCompleto,
          professorSiape: professorTable.matriculaSiape,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          projetoId: projetoTable.id,
          relatorioId: relatorioFinalDisciplinaTable.id,
          departamentoNome: departamentoTable.nome,
          status: relatorioFinalDisciplinaTable.status,
        })
        .from(relatorioFinalDisciplinaTable)
        .innerJoin(projetoTable, eq(relatorioFinalDisciplinaTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      const relatoriosData = relatoriosDisciplina.map((r) => ({
        Disciplina: r.disciplinaNome || r.projetoTitulo,
        Professor: r.professorNome,
        SIAPE: r.professorSiape || '',
        Departamento: r.departamentoNome,
        Status: r.status,
        'Link Relatório PDF': `${clientUrl}/api/relatorio-disciplina/${r.relatorioId}/pdf`,
      }))

      const wsRelatorios = XLSX.utils.json_to_sheet(relatoriosData)
      const wbRelatorios = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wbRelatorios, wsRelatorios, 'Relatórios')
      const relatoriosBuffer = Buffer.from(XLSX.write(wbRelatorios, { type: 'buffer', bookType: 'xlsx' }))

      return {
        bolsistas: bolsistasBuffer,
        voluntarios: voluntariosBuffer,
        relatoriosDisciplina: relatoriosBuffer,
      }
    },

    /**
     * Envia planilhas de certificados para o departamento/NUMOP
     */
    async enviarCertificadosParaNUMOP(
      ano: number,
      semestre: Semestre,
      emailDestino: string,
      remetenteUserId: number
    ): Promise<{ success: boolean; message: string }> {
      const semestreDisplay = SEMESTRE_LABELS[semestre]

      try {
        const planilhas = await this.gerarPlanilhasCertificados(ano, semestre)

        await relatoriosEmailService.sendCertificadosParaDepartamento({
          to: emailDestino,
          ano,
          semestre,
          anexos: [
            { filename: `Certificados_Bolsistas_${ano}_${semestreDisplay}.xlsx`, buffer: planilhas.bolsistas },
            { filename: `Certificados_Voluntarios_${ano}_${semestreDisplay}.xlsx`, buffer: planilhas.voluntarios },
            {
              filename: `Relatorios_Disciplinas_${ano}_${semestreDisplay}.xlsx`,
              buffer: planilhas.relatoriosDisciplina,
            },
          ],
          remetenteUserId,
        })

        return { success: true, message: `Planilhas enviadas com sucesso para ${emailDestino}` }
      } catch (error) {
        log.error(`Erro ao enviar certificados: ${error instanceof Error ? error.message : String(error)}`)
        return { success: false, message: `Erro ao enviar: ${error instanceof Error ? error.message : String(error)}` }
      }
    },

    /**
     * Obtém status de validação dos relatórios
     */
    async getValidationStatus(ano: number, semestre: Semestre) {
      // Contar projetos aprovados
      const [projetosCount] = await database
        .select({ count: count() })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre), eq(projetoTable.status, APPROVED)))

      // Contar relatórios de disciplina criados
      const [relatoriosDisciplinaCount] = await database
        .select({ count: count() })
        .from(relatorioFinalDisciplinaTable)
        .innerJoin(projetoTable, eq(relatorioFinalDisciplinaTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      // Contar relatórios de disciplina assinados
      const [relatoriosDisciplinaAssinadosCount] = await database
        .select({ count: count() })
        .from(relatorioFinalDisciplinaTable)
        .innerJoin(projetoTable, eq(relatorioFinalDisciplinaTable.projetoId, projetoTable.id))
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            sql`${relatorioFinalDisciplinaTable.professorAssinouEm} IS NOT NULL`
          )
        )

      // Contar vagas (monitores)
      const [vagasCount] = await database
        .select({ count: count() })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      // Contar relatórios de monitores criados
      const [relatoriosMonitorCount] = await database
        .select({ count: count() })
        .from(relatorioFinalMonitorTable)
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      // Contar relatórios de monitores totalmente assinados
      const [relatoriosMonitorAssinadosCount] = await database
        .select({ count: count() })
        .from(relatorioFinalMonitorTable)
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            sql`${relatorioFinalMonitorTable.alunoAssinouEm} IS NOT NULL`,
            sql`${relatorioFinalMonitorTable.professorAssinouEm} IS NOT NULL`
          )
        )

      return {
        projetos: {
          total: projetosCount?.count || 0,
          comRelatorio: relatoriosDisciplinaCount?.count || 0,
          assinados: relatoriosDisciplinaAssinadosCount?.count || 0,
        },
        monitores: {
          total: vagasCount?.count || 0,
          comRelatorio: relatoriosMonitorCount?.count || 0,
          totalmenteAssinados: relatoriosMonitorAssinadosCount?.count || 0,
        },
        podeExportar:
          (relatoriosDisciplinaAssinadosCount?.count || 0) > 0 && (relatoriosMonitorAssinadosCount?.count || 0) > 0,
      }
    },
  }
}

export type RelatoriosNotificationsService = ReturnType<typeof createRelatoriosNotificationsService>
