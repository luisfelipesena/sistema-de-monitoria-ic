import { sendDepartamentoConsolidationEmail } from '@/server/lib/email'
import { BusinessError, NotFoundError, ValidationError } from '@/server/lib/errors'
import {
  ACCEPTED_BOLSISTA,
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
import { logger } from '@/utils/logger'
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

export function createRelatoriosExportService(
  repo: RelatoriosRepository,
  checkDadosFaltantes: (input: {
    ano: number
    semestre: Semestre
    tipo: 'bolsistas' | 'voluntarios' | 'ambos'
  }) => Promise<{ valido: boolean; totalProblemas: number; problemas: unknown[] }>
) {
  return {
    async exportRelatorioXlsx(tipo: string, ano: number, semestre: Semestre) {
      const workbook = new ExcelJS.Workbook()
      let fileName = ''

      const addSheetWithData = (sheetName: string, headers: string[], rows: (string | number | null | undefined)[][]) => {
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
          const headers = ['Departamento', 'Sigla', 'Total Projetos', 'Projetos Aprovados', 'Bolsas Solicitadas', 'Bolsas Disponibilizadas']
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
          const headers = ['Nome Completo', 'Email', 'Departamento', 'Sigla Depto', 'Total Projetos', 'Projetos Aprovados', 'Bolsas Solicitadas', 'Bolsas Disponibilizadas']
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
          const headers = ['Nome Completo', 'Email', 'Matrícula', 'CR', 'Status Inscrição', 'Tipo Vaga Pretendida', 'Projeto', 'Professor Responsável']
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
          const headers = ['Código', 'Nome Disciplina', 'Departamento', 'Sigla Depto', 'Total Projetos', 'Projetos Aprovados']
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
          const headers = ['Número Edital', 'Título', 'Ano', 'Semestre', 'Data Início', 'Data Fim', 'Publicado', 'Data Publicação', 'Criado Por']
          const rows = dados.map((item) => [
            item.edital.numeroEdital,
            item.edital.titulo,
            item.periodo.ano,
            SEMESTRE_LABELS[item.periodo.semestre as keyof typeof SEMESTRE_LABELS],
            new Date(item.periodo.dataInicio).toLocaleDateString('pt-BR'),
            new Date(item.periodo.dataFim).toLocaleDateString('pt-BR'),
            item.edital.publicado ? 'Sim' : 'Não',
            item.edital.dataPublicacao ? new Date(item.edital.dataPublicacao).toLocaleDateString('pt-BR') : '',
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
      remetenteUserId: number
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

      const buildExcelRows = async (vagasData: typeof filteredVagas) => {
        return Promise.all(
          vagasData.map(async (vaga) => {
            const disciplinas = await repo.findDisciplinasByProjetoId(vaga.projetoId)
            const disciplinasTexto = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

            return {
              'Matrícula Monitor': vaga.aluno.matricula || 'N/A',
              'Nome Monitor': vaga.aluno.nomeCompleto,
              'Email Monitor': vaga.aluno.user.email,
              CR: vaga.aluno.cr?.toFixed(2) || '0.00',
              'Tipo Monitoria': vaga.tipo === BOLSISTA ? 'Bolsista' : 'Voluntário',
              'Valor Bolsa': vaga.tipo === BOLSISTA ? 'R$ 400,00' : 'N/A',
              Projeto: vaga.projeto.titulo,
              Disciplinas: disciplinasTexto,
              'Professor Responsável': vaga.projeto.professorResponsavel.nomeCompleto,
              'SIAPE Professor': vaga.projeto.professorResponsavel.matriculaSiape || 'N/A',
              Departamento: vaga.projeto.departamento?.nome || 'N/A',
              'Carga Horária Semanal': vaga.projeto.cargaHorariaSemana || 12,
              'Total Horas': (vaga.projeto.cargaHorariaSemana || 12) * (vaga.projeto.numeroSemanas || 17),
              'Data Início': vaga.dataInicio?.toLocaleDateString('pt-BR') || 'N/A',
              'Data Fim': vaga.dataFim?.toLocaleDateString('pt-BR') || 'N/A',
              Status: 'Ativo',
              Período: `${ano}.${semestre === SEMESTRE_1 ? '1' : '2'}`,
              Banco: vaga.aluno.banco || 'N/A',
              Agência: vaga.aluno.agencia || 'N/A',
              Conta: vaga.aluno.conta || 'N/A',
              Dígito: vaga.aluno.digitoConta || 'N/A',
            }
          })
        )
      }

      type ExcelRow = Record<string, string | number>
      const createExcelBuffer = async (rows: ExcelRow[], sheetName: string): Promise<Buffer> => {
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet(sheetName)
        if (rows.length === 0) return Buffer.from(await workbook.xlsx.writeBuffer())
        const headers = Object.keys(rows[0])
        const headerRow = sheet.addRow(headers)
        applyHeaderStyle(headerRow)
        rows.forEach((rowObj) => {
          const row = sheet.addRow(Object.values(rowObj))
          applyDataStyle(row)
        })
        const colWidths = [15, 30, 30, 8, 15, 12, 40, 50, 30, 15, 25, 15, 12, 12, 10, 10, 15, 10, 15, 8]
        headers.forEach((_, idx) => {
          sheet.getColumn(idx + 1).width = colWidths[idx] || 15
        })
        return Buffer.from(await workbook.xlsx.writeBuffer())
      }

      const anexos: { filename: string; buffer: Buffer }[] = []
      const semestreDisplay = semestre === SEMESTRE_1 ? '1' : '2'

      if (incluirBolsistas) {
        const bolsistas = filteredVagas.filter((vaga) => vaga.tipo === BOLSISTA)
        if (bolsistas.length === 0) {
          throw new NotFoundError('Bolsista', 'não encontrado para o período selecionado')
        }
        const rows = await buildExcelRows(bolsistas)
        anexos.push({
          filename: `consolidacao-bolsistas-${ano}-${semestreDisplay}.xlsx`,
          buffer: await createExcelBuffer(rows, 'Bolsistas'),
        })
      }

      if (incluirVoluntarios) {
        const voluntarios = filteredVagas.filter((vaga) => vaga.tipo === VOLUNTARIO)
        if (voluntarios.length === 0) {
          throw new NotFoundError('Voluntário', 'não encontrado para o período selecionado')
        }
        const rows = await buildExcelRows(voluntarios)
        anexos.push({
          filename: `consolidacao-voluntarios-${ano}-${semestreDisplay}.xlsx`,
          buffer: await createExcelBuffer(rows, 'Voluntários'),
        })
      }

      if (anexos.length === 0) {
        throw new NotFoundError('Dados', 'não encontrados para os filtros aplicados')
      }

      const departamentos = await repo.findAllDepartamentos()

      const destinatarios = departamentos
        .map((departamento) => departamento.emailChefeDepartamento)
        .filter((email): email is string => Boolean(email))

      if (destinatarios.length === 0) {
        throw new BusinessError(
          'Nenhum email do chefe de departamento configurado para envio da consolidação.',
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
        message: 'Planilhas enviadas ao departamento para validação e encaminhamento à PROGRAD.',
        destinatarios,
      }
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
              email: vaga.aluno.user.email,
              cr: vaga.aluno.cr,
              banco: vaga.aluno.banco,
              agencia: vaga.aluno.agencia,
              conta: vaga.aluno.conta,
              digitoConta: vaga.aluno.digitoConta,
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
              dataInicio: dataInicio.toLocaleDateString('pt-BR'),
              dataFim: dataFim.toLocaleDateString('pt-BR'),
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
