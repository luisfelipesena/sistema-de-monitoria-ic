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
import * as XLSX from 'xlsx'
import type { RelatoriosRepository } from './relatorios-repository'

const _log = logger.child({ context: 'RelatoriosExportService' })

export function createRelatoriosExportService(
  repo: RelatoriosRepository,
  checkDadosFaltantes: (input: {
    ano: number
    semestre: Semestre
    tipo: 'bolsistas' | 'voluntarios' | 'ambos'
  }) => Promise<{ valido: boolean; totalProblemas: number; problemas: unknown[] }>
) {
  return {
    async exportRelatorioCsv(tipo: string, ano: number, semestre: Semestre) {
      const generateCsvRow = (data: (string | number | null | undefined)[]) => {
        return data
          .map((value) => {
            const stringValue = String(value || '')
            return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue
          })
          .join(',')
      }

      let csvData = ''
      let fileName = ''

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
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.departamento.nome,
              item.departamento.sigla,
              item.projetos,
              Number(item.projetosAprovados) || 0,
              Number(item.bolsasSolicitadas) || 0,
              Number(item.bolsasDisponibilizadas) || 0,
            ])}\n`
          })
          fileName = `relatorio-departamentos-${ano}-${semestre}.csv`
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
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.professor.nomeCompleto,
              item.professor.emailInstitucional,
              item.departamento.nome,
              item.departamento.sigla,
              item.projetos,
              Number(item.projetosAprovados) || 0,
              Number(item.bolsasSolicitadas) || 0,
              Number(item.bolsasDisponibilizadas) || 0,
            ])}\n`
          })
          fileName = `relatorio-professores-${ano}-${semestre}.csv`
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
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.aluno.nomeCompleto,
              item.aluno.emailInstitucional,
              item.aluno.matricula,
              item.aluno.cr || 0,
              item.statusInscricao,
              item.tipoVagaPretendida,
              item.projeto.titulo,
              item.projeto.professorResponsavel,
            ])}\n`
          })
          fileName = `relatorio-alunos-${ano}-${semestre}.csv`
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
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.disciplina.codigo,
              item.disciplina.nome,
              item.departamento.nome,
              item.departamento.sigla,
              item.projetos,
              Number(item.projetosAprovados) || 0,
            ])}\n`
          })
          fileName = `relatorio-disciplinas-${ano}-${semestre}.csv`
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
          csvData = `${headers.join(',')}\n`
          dados.forEach((item) => {
            csvData += `${generateCsvRow([
              item.edital.numeroEdital,
              item.edital.titulo,
              item.periodo.ano,
              SEMESTRE_LABELS[item.periodo.semestre as keyof typeof SEMESTRE_LABELS],
              new Date(item.periodo.dataInicio).toLocaleDateString('pt-BR'),
              new Date(item.periodo.dataFim).toLocaleDateString('pt-BR'),
              item.edital.publicado ? 'Sim' : 'Não',
              item.edital.dataPublicacao ? new Date(item.edital.dataPublicacao).toLocaleDateString('pt-BR') : '',
              item.criadoPor.username,
            ])}\n`
          })
          fileName = `relatorio-editais-${ano}.csv`
          break
        }

        case 'geral': {
          const [projetosStats] = await repo.findProjetosStats(ano, semestre)
          const headers = ['Métrica', 'Valor']
          csvData = `${headers.join(',')}\n`
          csvData += `${generateCsvRow(['Total de Projetos', projetosStats?.total || 0])}\n`
          csvData += `${generateCsvRow(['Projetos Aprovados', Number(projetosStats?.aprovados) || 0])}\n`
          csvData += `${generateCsvRow(['Projetos Submetidos', Number(projetosStats?.submetidos) || 0])}\n`
          csvData += `${generateCsvRow(['Projetos em Rascunho', Number(projetosStats?.rascunhos) || 0])}\n`
          csvData += `${generateCsvRow(['Total Bolsas Solicitadas', Number(projetosStats?.totalBolsasSolicitadas) || 0])}\n`
          csvData += `${generateCsvRow(['Total Bolsas Disponibilizadas', Number(projetosStats?.totalBolsasDisponibilizadas) || 0])}\n`
          fileName = `relatorio-geral-${ano}-${semestre}.csv`
          break
        }

        default:
          throw new ValidationError('Tipo de relatório inválido')
      }

      if (csvData.split('\n').length <= 1) {
        throw new NotFoundError('Dados', 'não encontrados para exportar com os filtros aplicados')
      }

      const csvBase64 = Buffer.from(csvData, 'utf-8').toString('base64')

      return {
        success: true,
        fileName,
        downloadUrl: `data:text/csv;charset=utf-8;base64,${csvBase64}`,
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
              Departamento: vaga.projeto.departamento.nome,
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
      const createExcelBuffer = (rows: ExcelRow[], sheetName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        const colWidths = [
          { wch: 15 },
          { wch: 30 },
          { wch: 30 },
          { wch: 8 },
          { wch: 15 },
          { wch: 12 },
          { wch: 40 },
          { wch: 50 },
          { wch: 30 },
          { wch: 15 },
          { wch: 25 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
          { wch: 10 },
          { wch: 15 },
          { wch: 10 },
          { wch: 15 },
          { wch: 8 },
        ]
        worksheet['!cols'] = colWidths
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
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
          buffer: createExcelBuffer(rows, 'Bolsistas'),
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
          buffer: createExcelBuffer(rows, 'Voluntários'),
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
              departamento: vaga.projeto.departamento.nome,
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
