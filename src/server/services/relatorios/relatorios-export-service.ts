import { randomBytes } from 'crypto'
import { db } from '@/server/db'
import { consolidacaoProgradAssinaturaTable, editalTable, periodoInscricaoTable } from '@/server/db/schema'
import { sendDepartamentoConsolidationEmail } from '@/server/lib/email'
import { adminEmailService } from '@/server/lib/email/admin-emails'
import { BusinessError, NotFoundError, ValidationError } from '@/server/lib/errors'
import { createConsolidacaoPDFService } from './consolidacao-pdf-service'
import { createEditalPdfService } from '@/server/services/edital/edital-pdf-service'
import { createEditalRepository } from '@/server/services/edital/edital-repository'
import { createTermosService } from '@/server/services/termos/termos-service'
import {
  ACCEPTED_BOLSISTA,
  ADMIN,
  BOLSISTA,
  SEMESTRE_1,
  SEMESTRE_LABELS,
  TERMO_STATUS_COMPLETO,
  TERMO_STATUS_PENDENTE,
  TIPO_ASSINATURA_ATA_SELECAO,
  TIPO_ASSINATURA_TERMO_COMPROMISSO,
  VAGA_STATUS_ATIVO,
  VOLUNTARIO,
  type Semestre,
} from '@/types'
import { formatDateFullUTC } from '@/utils/date-utils'
import { logger } from '@/utils/logger'
import { and, eq } from 'drizzle-orm'
import ExcelJS from 'exceljs'
import type { RelatoriosRepository } from './relatorios-repository'

const _log = logger.child({ context: 'RelatoriosExportService' })

// Excel styling constants
const greenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
}
const headerFont: Partial<ExcelJS.Font> = { bold: true, size: 10 }

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = greenFill
    cell.font = headerFont
    cell.border = thinBorder
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  row.height = 25
}

function applyDataStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = thinBorder
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
}

function cleanDigits(val?: string | null): string {
  if (!val) return ''
  return val.replace(/\D/g, '') || val
}

function extractAgenciaParts(agencia?: string | null): { agencia: string; digito: string } {
  if (!agencia) return { agencia: '', digito: '' }
  const parts = agencia.split('-')
  if (parts.length > 1) {
    return { agencia: parts[0]?.trim() || '', digito: parts[1]?.trim() || '' }
  }
  return { agencia: agencia.trim(), digito: '' }
}

function formatEndereco(end?: unknown): string {
  if (!end) return ''
  if (typeof end === 'string') return end
  const e = end as Record<string, string | number | null | undefined>
  const parts = [
    e.rua,
    e.numero ? `${e.numero}` : '',
    e.complemento,
    e.bairro,
    e.cep ? `${e.cep}` : '',
    e.cidade,
    e.estado,
  ].filter(Boolean)
  return parts.join(', ')
}

export function createRelatoriosExportService(
  repo: RelatoriosRepository,
  checkDadosFaltantes: (input: {
    ano: number
    semestre: Semestre
    tipo: 'bolsistas' | 'voluntarios' | 'ambos'
  }) => Promise<{ valido: boolean; totalProblemas: number; problemas: unknown[] }>
) {
  const pdfService = createConsolidacaoPDFService()

  return {
    async exportRelatorioXlsx(tipo: string, ano: number, semestre: Semestre) {
      const workbook = new ExcelJS.Workbook()
      let fileName = ''

      const addSheetWithData = (
        sheetName: string,
        headers: string[],
        rows: (string | number | null | undefined)[][]
      ) => {
        const sheet = workbook.addWorksheet(sheetName)
        const headerRow = sheet.addRow(headers)
        applyHeaderStyle(headerRow)
        rows.forEach((rowData) => {
          const row = sheet.addRow(rowData.map((v) => v ?? ''))
          applyDataStyle(row)
        })
        headers.forEach((_, idx) => {
          sheet.getColumn(idx + 1).width = Math.max(15, headers[idx].length + 5)
        })
      }

      switch (tipo) {
        case 'departamentos': {
          const dados = await repo.findDepartamentosReport(ano, semestre)
          const headers = [
            'Departamento',
            'Sigla',
            'Total Projetos',
            'Projetos Aprovados',
            'Bolsas Solicitadas',
            'Bolsas Disponibilizadas',
          ]
          const rows = dados.map((item) => [
            item.departamento.nome,
            item.departamento.sigla,
            item.projetos,
            Number(item.projetosAprovados) || 0,
            Number(item.bolsasSolicitadas) || 0,
            Number(item.bolsasDisponibilizadas) || 0,
          ])
          if (rows.length === 0) throw new NotFoundError('Dados', 'não encontrados para exportar')
          addSheetWithData('Departamentos', headers, rows)
          fileName = `relatorio-departamentos-${ano}-${semestre}.xlsx`
          break
        }

        case 'professores': {
          const dados = await repo.findProfessoresReport(ano, semestre)
          const headers = [
            'Nome Completo',
            'Email',
            'Departamento',
            'Sigla Depto',
            'Total Projetos',
            'Projetos Aprovados',
            'Bolsas Solicitadas',
            'Bolsas Disponibilizadas',
          ]
          const rows = dados.map((item) => [
            item.professor.nomeCompleto,
            item.professor.emailInstitucional,
            item.departamento.nome,
            item.departamento.sigla,
            item.projetos,
            Number(item.projetosAprovados) || 0,
            Number(item.bolsasSolicitadas) || 0,
            Number(item.bolsasDisponibilizadas) || 0,
          ])
          if (rows.length === 0) throw new NotFoundError('Dados', 'não encontrados para exportar')
          addSheetWithData('Professores', headers, rows)
          fileName = `relatorio-professores-${ano}-${semestre}.xlsx`
          break
        }

        case 'alunos': {
          const dados = await repo.findAlunosReport(ano, semestre)
          const headers = [
            'Nome Completo',
            'Email',
            'Matrícula',
            'CR',
            'Status Inscrição',
            'Tipo Vaga Pretendida',
            'Projeto',
            'Professor Responsável',
          ]
          const rows = dados.map((item) => [
            item.aluno.nomeCompleto,
            item.aluno.emailInstitucional,
            item.aluno.matricula,
            item.aluno.cr || 0,
            item.statusInscricao,
            item.tipoVagaPretendida,
            item.projeto.titulo,
            item.projeto.professorResponsavel,
          ])
          if (rows.length === 0) throw new NotFoundError('Dados', 'não encontrados para exportar')
          addSheetWithData('Alunos', headers, rows)
          fileName = `relatorio-alunos-${ano}-${semestre}.xlsx`
          break
        }

        case 'disciplinas': {
          const dados = await repo.findDisciplinasReport(ano, semestre)
          const headers = [
            'Código',
            'Nome Disciplina',
            'Departamento',
            'Sigla Depto',
            'Total Projetos',
            'Projetos Aprovados',
          ]
          const rows = dados.map((item) => [
            item.disciplina.codigo,
            item.disciplina.nome,
            item.departamento.nome,
            item.departamento.sigla,
            item.projetos,
            Number(item.projetosAprovados) || 0,
          ])
          if (rows.length === 0) throw new NotFoundError('Dados', 'não encontrados para exportar')
          addSheetWithData('Disciplinas', headers, rows)
          fileName = `relatorio-disciplinas-${ano}-${semestre}.xlsx`
          break
        }

        case 'editais': {
          const dados = await repo.findEditaisReport(ano)
          const headers = [
            'Número Edital',
            'Título',
            'Ano',
            'Semestre',
            'Data Início',
            'Data Fim',
            'Publicado',
            'Data Publicação',
            'Criado Por',
          ]
          const rows = dados.map((item) => [
            item.edital.numeroEdital,
            item.edital.titulo,
            item.periodo.ano,
            SEMESTRE_LABELS[item.periodo.semestre as keyof typeof SEMESTRE_LABELS],
            new Date(item.periodo.dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            new Date(item.periodo.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            item.edital.publicado ? 'Sim' : 'Não',
            item.edital.dataPublicacao
              ? new Date(item.edital.dataPublicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
              : '',
            item.criadoPor.username,
          ])
          if (rows.length === 0) throw new NotFoundError('Dados', 'não encontrados para exportar')
          addSheetWithData('Editais', headers, rows)
          fileName = `relatorio-editais-${ano}.xlsx`
          break
        }

        case 'geral': {
          const [projetosStats] = await repo.findProjetosStats(ano, semestre)
          const headers = ['Métrica', 'Valor']
          const rows = [
            ['Total de Projetos', projetosStats?.total || 0],
            ['Projetos Aprovados', Number(projetosStats?.aprovados) || 0],
            ['Projetos Submetidos', Number(projetosStats?.submetidos) || 0],
            ['Projetos em Rascunho', Number(projetosStats?.rascunhos) || 0],
            ['Total Bolsas Solicitadas', Number(projetosStats?.totalBolsasSolicitadas) || 0],
            ['Total Bolsas Disponibilizadas', Number(projetosStats?.totalBolsasDisponibilizadas) || 0],
          ]
          addSheetWithData('Resumo Geral', headers, rows)
          fileName = `relatorio-geral-${ano}-${semestre}.xlsx`
          break
        }

        default:
          throw new ValidationError('Tipo de relatório inválido')
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      return {
        success: true,
        fileName,
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`,
        message: 'Relatório gerado com sucesso. O download deve iniciar automaticamente.',
      }
    },

    async exportConsolidated(
      ano: number,
      semestre: Semestre,
      incluirBolsistas: boolean,
      incluirVoluntarios: boolean,
      departamentoId: number | undefined,
      remetenteUserId: number,
      emailDestino?: string
    ) {
      const validacao = await checkDadosFaltantes({
        ano,
        semestre,
        tipo: incluirBolsistas && incluirVoluntarios ? 'ambos' : incluirBolsistas ? 'bolsistas' : 'voluntarios',
      })

      if (!validacao.valido) {
        throw new ValidationError(
          `Dados incompletos encontrados. ${validacao.totalProblemas} problema(s) identificado(s). Corrija antes de exportar.`
        )
      }

      const vagas = await repo.findVagasWithRelations(ano, semestre)

      const filteredVagas = vagas.filter((vaga) => {
        const matchDepartamento = departamentoId ? vaga.projeto.departamentoId === departamentoId : true
        const matchTipo =
          (incluirBolsistas && vaga.tipo === BOLSISTA) || (incluirVoluntarios && vaga.tipo === VOLUNTARIO)
        return matchDepartamento && matchTipo
      })

      const bolsistasColumns = [
        { header: 'Nome Completo', key: 'nomeCompleto', width: 32 },
        { header: 'RG (somente números)', key: 'rg', width: 18 },
        { header: 'CPF (somente números)', key: 'cpf', width: 18 },
        { header: 'Matrícula', key: 'matricula', width: 14 },
        { header: 'Celular (DDD + número)', key: 'celular', width: 18 },
        { header: 'E-mail', key: 'email', width: 30 },
        { header: 'Banco (exceto Mercado Pago)', key: 'banco', width: 28 },
        { header: 'Agência', key: 'agencia', width: 12 },
        { header: 'Dígito', key: 'digitoAgencia', width: 10 },
        { header: 'Conta', key: 'conta', width: 14 },
        { header: 'Dígito', key: 'digitoConta', width: 10 },
        {
          header: 'Endereço completo (rua, nº, complemento, bairro, CEP, cidade e estado)',
          key: 'endereco',
          width: 50,
        },
        { header: 'Componente Curricular do Projeto (código e nome)', key: 'disciplina', width: 35 },
        { header: 'Professor Responsável', key: 'professor', width: 30 },
      ]

      const voluntariosColumns = [
        { header: 'Nome Completo', key: 'nomeCompleto', width: 32 },
        { header: 'RG (somente números)', key: 'rg', width: 18 },
        { header: 'CPF (somente números)', key: 'cpf', width: 18 },
        { header: 'Matrícula', key: 'matricula', width: 14 },
        { header: 'Componente Curricular do Projeto (código e nome)', key: 'disciplina', width: 35 },
        { header: 'Professor Responsável', key: 'professor', width: 30 },
      ]

      const createExcelBufferCustom = async (
        columns: Array<{ header: string; key: string; width: number }>,
        // biome-ignore lint/suspicious/noExplicitAny: row object payload
        rowsData: Record<string, any>[],
        sheetName: string
      ): Promise<Buffer> => {
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet(sheetName)
        sheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width }))
        const headerRow = sheet.getRow(1)
        applyHeaderStyle(headerRow)
        rowsData.forEach((rowObj) => {
          const row = sheet.addRow(rowObj)
          applyDataStyle(row)
        })
        return Buffer.from(await workbook.xlsx.writeBuffer())
      }

      const buildBolsistasRows = async (vagasData: typeof filteredVagas) => {
        return Promise.all(
          vagasData.map(async (vaga) => {
            const disciplinas = await repo.findDisciplinasByProjetoId(vaga.projetoId)
            const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')
            const { agencia, digito: digitoAgencia } = extractAgenciaParts(vaga.aluno.agencia)

            return {
              nomeCompleto: vaga.aluno.nomeCompleto || '',
              rg: cleanDigits(vaga.aluno.rg),
              cpf: cleanDigits(vaga.aluno.cpf),
              matricula: vaga.aluno.matricula || '',
              celular: cleanDigits(vaga.aluno.telefone),
              email: vaga.aluno.user.email || '',
              banco: vaga.aluno.banco || '',
              agencia,
              digitoAgencia,
              conta: vaga.aluno.conta || '',
              digitoConta: vaga.aluno.digitoConta || '',
              endereco: formatEndereco(vaga.aluno.endereco),
              disciplina: disciplinasTexto,
              professor: vaga.projeto.professorResponsavel.nomeCompleto || '',
            }
          })
        )
      }

      const buildVoluntariosRows = async (vagasData: typeof filteredVagas) => {
        return Promise.all(
          vagasData.map(async (vaga) => {
            const disciplinas = await repo.findDisciplinasByProjetoId(vaga.projetoId)
            const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

            return {
              nomeCompleto: vaga.aluno.nomeCompleto || '',
              rg: cleanDigits(vaga.aluno.rg),
              cpf: cleanDigits(vaga.aluno.cpf),
              matricula: vaga.aluno.matricula || '',
              disciplina: disciplinasTexto,
              professor: vaga.projeto.professorResponsavel.nomeCompleto || '',
            }
          })
        )
      }

      const anexos: Array<{ filename: string; buffer: Buffer }> = []
      const semestreDisplay = semestre === SEMESTRE_1 ? '1' : '2'

      // 1. Anexar PDF do Edital Interno Atual (com alocação de vagas)
      try {
        const periodo = await db.query.periodoInscricaoTable.findFirst({
          where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
        })

        if (periodo) {
          const edital = await db.query.editalTable.findFirst({
            where: eq(editalTable.periodoInscricaoId, periodo.id),
          })

          if (edital) {
            const editalRepo = createEditalRepository(db)
            const editalPdfService = createEditalPdfService(editalRepo)
            const editalPdf = await editalPdfService.generateEditalPdf(edital.id, remetenteUserId)
            if (editalPdf?.buffer) {
              anexos.push({
                filename: `edital-interno-monitoria-${ano}-${semestreDisplay}.pdf`,
                buffer: editalPdf.buffer,
              })
            }
          }
        }
      } catch (err) {
        _log.warn({ err }, 'Não foi possível gerar/anexar o PDF do Edital Interno atual')
      }

      // 2. Anexar PDF Consolidado de Resultados (Bolsistas)
      const signatureRecord = await db.query.consolidacaoProgradAssinaturaTable.findFirst({
        where: and(
          eq(consolidacaoProgradAssinaturaTable.ano, ano),
          eq(consolidacaoProgradAssinaturaTable.semestre, semestre)
        ),
      })

      const pdfConsolidadoBuffer = await pdfService.generateConsolidatedResultadosPDF({
        ano,
        semestre,
        chefeNome: signatureRecord?.chefeNome,
        chefeAssinatura: signatureRecord?.chefeAssinatura,
        chefeAssinouEm: signatureRecord?.chefeAssinouEm,
        adminUserId: remetenteUserId,
      })

      anexos.push({
        filename: `resultados-selecao-bolsistas-${ano}-${semestreDisplay}.pdf`,
        buffer: pdfConsolidadoBuffer,
      })

      // 2. Anexar Planilha Excel de Bolsistas
      if (incluirBolsistas) {
        const bolsistas = filteredVagas.filter((vaga) => vaga.tipo === BOLSISTA)
        if (bolsistas.length > 0) {
          const rows = await buildBolsistasRows(bolsistas)
          anexos.push({
            filename: `consolidacao-bolsistas-${ano}-${semestreDisplay}.xlsx`,
            buffer: await createExcelBufferCustom(bolsistasColumns, rows, 'Bolsistas'),
          })
        }
      }

      // 3. Anexar Planilha Excel de Voluntários
      if (incluirVoluntarios) {
        const voluntarios = filteredVagas.filter((vaga) => vaga.tipo === VOLUNTARIO)
        if (voluntarios.length > 0) {
          const rows = await buildVoluntariosRows(voluntarios)
          anexos.push({
            filename: `consolidacao-voluntarios-${ano}-${semestreDisplay}.xlsx`,
            buffer: await createExcelBufferCustom(voluntariosColumns, rows, 'Voluntários'),
          })
        }
      }

      // 4. Anexar Termos de Compromisso Individuais dos Monitores
      const termosService = createTermosService(db)
      for (const vaga of filteredVagas) {
        try {
          const termoRes = await termosService.getTermoBuffer(vaga.id, remetenteUserId, ADMIN)
          anexos.push({
            filename: termoRes.fileName,
            buffer: termoRes.buffer,
          })
        } catch (err) {
          _log.warn({ err, vagaId: vaga.id }, 'Não foi possível gerar Termo de Compromisso para anexo')
        }
      }

      if (anexos.length === 0) {
        throw new NotFoundError('Dados', 'não encontrados para os filtros aplicados')
      }

      let destinatarios: string[] = []
      if (emailDestino?.trim()) {
        destinatarios = [emailDestino.trim()]
      } else {
        const departamentos = await repo.findAllDepartamentos()
        destinatarios = departamentos
          .map((departamento) => departamento.emailChefeDepartamento)
          .filter((email): email is string => Boolean(email))
      }

      if (destinatarios.length === 0) {
        throw new BusinessError(
          'Nenhum email de destinatário ou chefe de departamento configurado para envio da consolidação.',
          'VALIDATION_ERROR'
        )
      }

      await Promise.all(
        destinatarios.map((email) =>
          sendDepartamentoConsolidationEmail({
            to: email,
            ano,
            semestre,
            anexos,
            remetenteUserId,
          })
        )
      )

      return {
        success: true,
        message: 'PDF consolidado e planilhas enviadas ao departamento com sucesso.',
        destinatarios,
      }
    },

    async getConsolidacaoSignatureStatus(ano: number, semestre: Semestre) {
      const record = await db.query.consolidacaoProgradAssinaturaTable.findFirst({
        where: and(
          eq(consolidacaoProgradAssinaturaTable.ano, ano),
          eq(consolidacaoProgradAssinaturaTable.semestre, semestre)
        ),
      })

      return {
        isSigned: Boolean(record?.chefeAssinouEm),
        chefeNome: record?.chefeNome || null,
        chefeEmail: record?.chefeEmail || null,
        chefeAssinouEm: record?.chefeAssinouEm || null,
        hasPendingToken: Boolean(record?.signatureToken && !record.chefeAssinouEm),
      }
    },

    async solicitarAssinaturaChefeConsolidacao(
      ano: number,
      semestre: Semestre,
      chefeEmail: string,
      chefeNome: string,
      requestedByUserId: number
    ) {
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 72) // 72 hours validity

      const existing = await db.query.consolidacaoProgradAssinaturaTable.findFirst({
        where: and(
          eq(consolidacaoProgradAssinaturaTable.ano, ano),
          eq(consolidacaoProgradAssinaturaTable.semestre, semestre)
        ),
      })

      if (existing) {
        await db
          .update(consolidacaoProgradAssinaturaTable)
          .set({
            chefeEmail,
            chefeNome,
            signatureToken: token,
            signatureTokenExpiresAt: expiresAt,
            requestedByUserId,
          })
          .where(eq(consolidacaoProgradAssinaturaTable.id, existing.id))
      } else {
        await db.insert(consolidacaoProgradAssinaturaTable).values({
          ano,
          semestre,
          chefeEmail,
          chefeNome,
          signatureToken: token,
          signatureTokenExpiresAt: expiresAt,
          requestedByUserId,
        })
      }

      const semestreDisplay = semestre === SEMESTRE_1 ? '1º Semestre' : '2º Semestre'

      await adminEmailService.sendChefeConsolidacaoSignatureRequest({
        chefeEmail,
        chefeNome,
        semestreFormatado: semestreDisplay,
        ano,
        signatureToken: token,
        expiresAt,
        remetenteUserId: requestedByUserId,
      })

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const link = `${clientUrl}/assinar-consolidacao?token=${token}`

      return {
        success: true,
        message: `Solicitação de assinatura enviada para ${chefeEmail}.`,
        link,
        token,
        expiresAt,
      }
    },

    async getConsolidacaoByToken(token: string) {
      const record = await db.query.consolidacaoProgradAssinaturaTable.findFirst({
        where: eq(consolidacaoProgradAssinaturaTable.signatureToken, token),
      })

      if (!record) {
        throw new NotFoundError('Token de assinatura', 'inválido ou expirado')
      }

      if (record.signatureTokenExpiresAt && record.signatureTokenExpiresAt < new Date()) {
        throw new ValidationError('O link de assinatura expirou')
      }

      return {
        id: record.id,
        ano: record.ano,
        semestre: record.semestre,
        chefeNome: record.chefeNome,
        chefeEmail: record.chefeEmail,
        isSigned: Boolean(record.chefeAssinouEm),
        chefeAssinouEm: record.chefeAssinouEm,
        chefeAssinatura: record.chefeAssinatura,
      }
    },

    async signConsolidacaoByToken(token: string, chefeAssinatura: string, chefeNome?: string) {
      const record = await db.query.consolidacaoProgradAssinaturaTable.findFirst({
        where: eq(consolidacaoProgradAssinaturaTable.signatureToken, token),
      })

      if (!record) {
        throw new NotFoundError('Token de assinatura', 'inválido ou não encontrado')
      }

      if (record.signatureTokenExpiresAt && record.signatureTokenExpiresAt < new Date()) {
        throw new ValidationError('O link de assinatura expirou')
      }

      if (record.chefeAssinouEm) {
        throw new ValidationError('Esta consolidação já foi assinada')
      }

      await db
        .update(consolidacaoProgradAssinaturaTable)
        .set({
          chefeAssinatura,
          chefeAssinouEm: new Date(),
          chefeNome: chefeNome || record.chefeNome,
        })
        .where(eq(consolidacaoProgradAssinaturaTable.id, record.id))

      return {
        success: true,
        message: 'Consolidação assinada com sucesso pelo Chefe do Departamento!',
      }
    },

    async getConsolidacaoPDFBuffer(ano: number, semestre: Semestre, adminUserId = 1): Promise<Buffer> {
      const signatureRecord = await db.query.consolidacaoProgradAssinaturaTable.findFirst({
        where: and(
          eq(consolidacaoProgradAssinaturaTable.ano, ano),
          eq(consolidacaoProgradAssinaturaTable.semestre, semestre)
        ),
      })

      return pdfService.generateConsolidatedResultadosPDF({
        ano,
        semestre,
        chefeNome: signatureRecord?.chefeNome,
        chefeAssinatura: signatureRecord?.chefeAssinatura,
        chefeAssinouEm: signatureRecord?.chefeAssinouEm,
        adminUserId,
      })
    },

    async getConsolidatedMonitoringData(ano: number, semestre: Semestre) {
      const vagas = await repo.findVagasWithRelations(ano, semestre)

      const consolidados = await Promise.all(
        vagas.map(async (vaga) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(vaga.projetoId)
          const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          const inicioSemestre = new Date(ano, semestre === SEMESTRE_1 ? 1 : 6, 1)
          const fimSemestre = new Date(ano, semestre === SEMESTRE_1 ? 5 : 11, 30)

          const tipoMonitoria = vaga.inscricao.status === ACCEPTED_BOLSISTA ? BOLSISTA : VOLUNTARIO

          return {
            id: vaga.inscricaoId,
            monitor: {
              nome: vaga.aluno.nomeCompleto,
              matricula: vaga.aluno.matricula,
              cpf: vaga.aluno.cpf,
              rg: vaga.aluno.rg,
              telefone: vaga.aluno.telefone,
              email: vaga.aluno.user.email,
              cr: vaga.aluno.cr,
              banco: vaga.aluno.banco,
              agencia: vaga.aluno.agencia,
              conta: vaga.aluno.conta,
              digitoConta: vaga.aluno.digitoConta,
              endereco: formatEndereco(vaga.aluno.endereco),
            },
            professor: {
              nome: vaga.projeto.professorResponsavel.nomeCompleto,
              matriculaSiape: vaga.projeto.professorResponsavel.matriculaSiape,
              email: vaga.projeto.professorResponsavel.emailInstitucional,
              departamento: vaga.projeto.departamento?.nome || 'N/A',
            },
            projeto: {
              titulo: vaga.projeto.titulo,
              disciplinas: disciplinasTexto,
              ano: vaga.projeto.ano,
              semestre: vaga.projeto.semestre,
              cargaHorariaSemana: vaga.projeto.cargaHorariaSemana,
              numeroSemanas: vaga.projeto.numeroSemanas,
            },
            monitoria: {
              tipo: tipoMonitoria,
              dataInicio: vaga.dataInicio?.toISOString() || inicioSemestre.toISOString(),
              dataFim: vaga.dataFim?.toISOString() || fimSemestre.toISOString(),
              valorBolsa: tipoMonitoria === BOLSISTA ? 400 : 0,
              status: VAGA_STATUS_ATIVO,
            },
          }
        })
      )

      return consolidados
    },

    async monitoresFinalBolsistas(ano: number, semestre: Semestre, departamentoId?: number) {
      const bolsistas = await repo.findBolsistasFinal(ano, semestre, departamentoId)

      const bolsistasCompletos = await Promise.all(
        bolsistas.map(async (bolsista) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(bolsista.projeto.id)
          const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          return {
            id: bolsista.vaga.id,
            nomeCompleto: bolsista.aluno.nomeCompleto,
            matricula: bolsista.aluno.matricula,
            emailInstitucional: bolsista.alunoUser.email,
            cr: bolsista.aluno.cr || 0,
            rg: bolsista.aluno.rg || undefined,
            cpf: bolsista.aluno.cpf,
            banco: bolsista.aluno.banco || undefined,
            agencia: bolsista.aluno.agencia || undefined,
            conta: bolsista.aluno.conta || undefined,
            digitoConta: bolsista.aluno.digitoConta || undefined,
            projeto: {
              titulo: bolsista.projeto.titulo,
              departamento: bolsista.departamento.nome,
              professorResponsavel: bolsista.professor.nomeCompleto,
              matriculaSiape: bolsista.professor.matriculaSiape || undefined,
              disciplinas: disciplinasTexto.split('; '),
              cargaHorariaSemana: bolsista.projeto.cargaHorariaSemana || 12,
              numeroSemanas: bolsista.projeto.numeroSemanas || 18,
            },
            tipo: BOLSISTA,
            valorBolsa: parseFloat(bolsista.edital.valorBolsa),
          }
        })
      )

      return bolsistasCompletos
    },

    async monitoresFinalVoluntarios(ano: number, semestre: Semestre, departamentoId?: number) {
      const voluntarios = await repo.findVoluntariosFinal(ano, semestre, departamentoId)

      const voluntariosCompletos = await Promise.all(
        voluntarios.map(async (voluntario) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(voluntario.projeto.id)
          const assinaturas = await repo.findAssinaturasByVagaId(voluntario.vaga.id)

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO)
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO)
          const statusTermo = assinaturaAluno && assinaturaProfessor ? TERMO_STATUS_COMPLETO : TERMO_STATUS_PENDENTE
          const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          const dataInicio = voluntario.vaga.dataInicio || new Date(ano, semestre === SEMESTRE_1 ? 1 : 6, 1)
          const dataFim = new Date(ano, semestre === SEMESTRE_1 ? 5 : 11, 30)

          return {
            id: voluntario.vaga.id,
            monitor: {
              nome: voluntario.aluno.nomeCompleto,
              matricula: voluntario.aluno.matricula,
              email: voluntario.alunoUser.email,
              rg: voluntario.aluno.rg,
              cpf: voluntario.aluno.cpf,
              cr: voluntario.aluno.cr || 0,
              telefone: voluntario.aluno.telefone,
            },
            professor: {
              nome: voluntario.professor.nomeCompleto,
              matriculaSiape: voluntario.professor.matriculaSiape,
            },
            projeto: {
              titulo: voluntario.projeto.titulo,
              disciplinas: disciplinasTexto,
              cargaHorariaSemana: voluntario.projeto.cargaHorariaSemana || 12,
              numeroSemanas: voluntario.projeto.numeroSemanas || 18,
            },
            departamento: {
              nome: voluntario.departamento.nome,
              sigla: voluntario.departamento.sigla,
            },
            periodo: {
              ano,
              semestre,
              dataInicio: formatDateFullUTC(dataInicio),
              dataFim: formatDateFullUTC(dataFim),
            },
            termo: {
              status: statusTermo,
              dataAssinaturaAluno: assinaturaAluno?.createdAt,
              dataAssinaturaProfessor: assinaturaProfessor?.createdAt,
            },
          }
        })
      )

      return voluntariosCompletos
    },
  }
}

export type RelatoriosExportService = ReturnType<typeof createRelatoriosExportService>
