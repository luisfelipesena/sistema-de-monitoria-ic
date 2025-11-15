import type { db } from '@/server/db'
import type { NewProjeto } from '@/server/db/schema'
import { sendProjectCreationNotification } from '@/server/lib/email'
import { BusinessError, NotFoundError } from '@/server/lib/errors'
import minioClient, { bucketName as MINIO_BUCKET } from '@/server/lib/minio'
import { parsePlanejamentoSpreadsheet, validateSpreadsheetStructure } from '@/server/lib/spreadsheet-parser'
import type { Semestre } from '@/types'
import {
  IMPORT_STATUS_CONCLUIDO,
  IMPORT_STATUS_CONCLUIDO_COM_ERROS,
  IMPORT_STATUS_ERRO,
  IMPORT_STATUS_PROCESSANDO,
  PROJETO_STATUS_PENDING_SIGNATURE,
  TIPO_PROPOSICAO_COLETIVA,
  TIPO_PROPOSICAO_INDIVIDUAL,
  type ImportStatus,
} from '@/types'
import { logger } from '@/utils/logger'
import { createImportProjectsRepository } from './import-projects-repository'

const log = logger.child({ context: 'ImportProjectsService' })

type Database = typeof db

interface UploadFileInput {
  fileId: string
  fileName: string
  ano: number
  semestre: Semestre
}

interface ProcessedRow {
  disciplinaCodigo: string
  disciplinaNome: string
  professoresSiapes: string[]
  vagas: number
}

export function createImportProjectsService(db: Database) {
  const repo = createImportProjectsRepository(db)

  return {
    async uploadFile(input: UploadFileInput, userId: number) {
      const stream = await minioClient.getObject(MINIO_BUCKET, input.fileId)
      const chunks: Buffer[] = []

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve())
        stream.on('error', reject)
      })

      const fileBuffer = Buffer.concat(chunks)

      const validation = validateSpreadsheetStructure(fileBuffer)
      if (!validation.valid) {
        throw new BusinessError(`Planilha inválida: ${validation.message}`, 'INVALID_SPREADSHEET')
      }

      const importacao = await repo.createImportacao({
        fileId: input.fileId,
        nomeArquivo: input.fileName,
        ano: input.ano,
        semestre: input.semestre,
        status: IMPORT_STATUS_PROCESSANDO,
        importadoPorUserId: userId,
      })

      log.info({ importacaoId: importacao.id }, 'Importação criada, iniciando processamento')

      return importacao
    },

    async processImportedFile(importacaoId: number) {
      const TIMEOUT_MS = 5 * 60 * 1000
      const startTime = Date.now()

      let projetosCriados = 0
      let projetosComErro = 0
      const erros: string[] = []
      const warnings: string[] = []
      const professoresNotificar = new Set<number>()

      const importacao = await repo.findImportacao(importacaoId)

      if (!importacao) {
        throw new NotFoundError('Importação', importacaoId)
      }

      if (importacao.status !== IMPORT_STATUS_PROCESSANDO) {
        throw new BusinessError('Importação não está em processamento', 'INVALID_STATUS')
      }

      const stream = await minioClient.getObject(MINIO_BUCKET, importacao.fileId)
      const chunks: Buffer[] = []

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve())
        stream.on('error', reject)
      })

      const fileBuffer = Buffer.concat(chunks)
      const parsed = await parsePlanejamentoSpreadsheet(fileBuffer)

      warnings.push(...parsed.warnings)
      erros.push(...parsed.errors)

      log.info(
        {
          totalLinhas: parsed.rows.length,
          warnings: parsed.warnings.length,
          errors: parsed.errors.length,
        },
        'Planilha parseada'
      )

      for (const row of parsed.rows as ProcessedRow[]) {
        if (Date.now() - startTime > TIMEOUT_MS) {
          erros.push('Timeout: Importação cancelada devido ao tempo limite excedido')
          break
        }

        try {
          const disciplina = await repo.findDisciplinaByCodigo(row.disciplinaCodigo)

          if (!disciplina) {
            erros.push(`Disciplina ${row.disciplinaCodigo} (${row.disciplinaNome}) não encontrada no sistema`)
            projetosComErro++
            continue
          }

          const professores = await repo.findProfessoresBySiapes(row.professoresSiapes)

          if (professores.length === 0) {
            erros.push(
              `Nenhum professor encontrado para ${row.disciplinaCodigo}: SIAPEs ${row.professoresSiapes.join(', ')}`
            )
            projetosComErro++
            continue
          }

          if (professores.length < row.professoresSiapes.length) {
            const encontrados = professores.map((p) => p.matriculaSiape)
            const naoEncontrados = row.professoresSiapes.filter((s) => !encontrados.includes(s))
            warnings.push(
              `Disciplina ${row.disciplinaCodigo}: Professores não encontrados: ${naoEncontrados.join(', ')}`
            )
          }

          const tipoProposicao = professores.length > 1 ? TIPO_PROPOSICAO_COLETIVA : TIPO_PROPOSICAO_INDIVIDUAL
          const professorResponsavel = professores[0]

          if (!professorResponsavel.departamentoId) {
            erros.push(
              `Disciplina ${row.disciplinaCodigo}: Professor ${professorResponsavel.nomeCompleto} não possui departamento associado`
            )
            projetosComErro++
            continue
          }

          const template = await repo.findTemplatePorDisciplina(disciplina.id)

          let titulo = row.disciplinaNome
          let descricao = `Projeto de monitoria para ${row.disciplinaNome}`
          let cargaHorariaSemana = 12
          let numeroSemanas = 17
          let publicoAlvo = 'Estudantes do curso'
          let atividades: string[] = []
          let professoresParticipantes: string | null = null

          if (template) {
            titulo = template.tituloDefault || titulo
            descricao = template.descricaoDefault || descricao
            cargaHorariaSemana = template.cargaHorariaSemanaDefault || cargaHorariaSemana
            numeroSemanas = template.numeroSemanasDefault || numeroSemanas
            publicoAlvo = template.publicoAlvoDefault || publicoAlvo

            if (template.atividadesDefault) {
              try {
                atividades = JSON.parse(template.atividadesDefault)
              } catch {
                atividades = template.atividadesDefault.split(';').filter((a) => a.trim().length > 0)
              }
            }

            log.info({ disciplinaId: disciplina.id, templateId: template.id }, 'Template encontrado e aplicado')
          } else {
            warnings.push(`Disciplina ${row.disciplinaCodigo}: Sem template cadastrado, usando valores padrão`)
          }

          if (tipoProposicao === TIPO_PROPOSICAO_COLETIVA) {
            professoresParticipantes = professores.map((p) => p.nomeCompleto).join(', ')
          }

          const novoProjeto: NewProjeto = {
            titulo,
            descricao,
            professorResponsavelId: professorResponsavel.id,
            departamentoId: professorResponsavel.departamentoId,
            disciplinaNome: row.disciplinaNome,
            ano: importacao.ano,
            semestre: importacao.semestre,
            cargaHorariaSemana,
            numeroSemanas,
            publicoAlvo,
            bolsasSolicitadas: row.vagas || 0,
            voluntariosSolicitados: 0,
            tipoProposicao,
            professoresParticipantes,
            status: PROJETO_STATUS_PENDING_SIGNATURE,
          }

          const projeto = await repo.createProjeto(novoProjeto)

          await repo.associateProjetoDisciplina(projeto.id, disciplina.id)

          const existingAssociation = await repo.findAssociacaoProfessorDisciplina(
            disciplina.id,
            professorResponsavel.id,
            importacao.ano,
            importacao.semestre
          )

          if (!existingAssociation) {
            await repo.createAssociacaoProfessorDisciplina(
              disciplina.id,
              professorResponsavel.id,
              importacao.ano,
              importacao.semestre
            )
          }

          if (atividades.length > 0) {
            const atividadesData = atividades.map((descricao) => ({
              projetoId: projeto.id,
              descricao,
            }))
            await repo.insertAtividades(atividadesData)
          }

          professores.forEach((p) => professoresNotificar.add(p.userId))

          projetosCriados++
          log.info(
            {
              projetoId: projeto.id,
              disciplina: row.disciplinaCodigo,
              tipo: tipoProposicao,
              professores: professores.length,
            },
            'Projeto criado'
          )
        } catch (error) {
          erros.push(
            `Erro ao criar projeto para ${row.disciplinaCodigo}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          )
          projetosComErro++
        }
      }

      let finalStatus: ImportStatus = IMPORT_STATUS_CONCLUIDO
      if (erros.some((erro) => erro.includes('Timeout'))) {
        finalStatus = IMPORT_STATUS_ERRO
      } else if (projetosComErro > 0 && projetosCriados === 0) {
        finalStatus = IMPORT_STATUS_ERRO
      } else if (projetosComErro > 0) {
        finalStatus = IMPORT_STATUS_CONCLUIDO_COM_ERROS
      }

      await repo.updateImportacao(importacaoId, {
        totalProjetos: parsed.rows.length,
        projetosCriados,
        projetosComErro,
        status: finalStatus,
        erros: erros.length > 0 || warnings.length > 0 ? JSON.stringify({ erros, warnings }) : null,
      })

      if (projetosCriados > 0 && professoresNotificar.size > 0) {
        try {
          const professoresParaNotificar = await repo.findProfessoresByIds(Array.from(professoresNotificar))

          for (const professor of professoresParaNotificar) {
            try {
              await sendProjectCreationNotification({
                to: professor.user.email,
                professorName: professor.nomeCompleto,
                ano: importacao.ano,
                semestre: importacao.semestre,
              })

              log.info({ professorId: professor.id, email: professor.user.email }, 'Email enviado')
            } catch (emailError) {
              log.error(emailError, 'Erro ao enviar email para professor')
              warnings.push(`Erro ao enviar email para ${professor.user.email}`)
            }
          }

          log.info({ totalProfessores: professoresParaNotificar.length }, 'Emails de notificação enviados')
        } catch (error) {
          log.error(error, 'Erro ao enviar emails de notificação')
          warnings.push('Erro ao enviar emails de notificação para professores')
        }
      }

      log.info(
        {
          importacaoId,
          projetosCriados,
          projetosComErro,
          emailsEnviados: professoresNotificar.size,
        },
        'Importação finalizada'
      )

      return {
        projetosCriados,
        projetosComErro,
        erros,
        warnings,
        emailsEnviados: professoresNotificar.size,
      }
    },

    async getImportHistory() {
      const imports = await repo.findAllImportacoes()

      return imports.map((imp) => ({
        id: imp.id,
        nomeArquivo: imp.nomeArquivo,
        ano: imp.ano,
        semestre: imp.semestre,
        totalProjetos: imp.totalProjetos,
        projetosCriados: imp.projetosCriados,
        projetosComErro: imp.projetosComErro,
        status: imp.status,
        erros: imp.erros ? JSON.parse(imp.erros) : { erros: [], warnings: [] },
        importadoPor: imp.importadoPor,
        createdAt: imp.createdAt,
      }))
    },

    async getImportDetails(id: number) {
      const importacao = await repo.findImportacaoComDetalhes(id)

      if (!importacao) {
        throw new NotFoundError('Importação', id)
      }

      return {
        ...importacao,
        erros: importacao.erros ? JSON.parse(importacao.erros) : { erros: [], warnings: [] },
      }
    },

    async deleteImport(id: number) {
      await repo.deleteImportacao(id)
      return { success: true }
    },

    async getProfessores() {
      return repo.findAllProfessores()
    },

    async getDisciplinas() {
      return repo.findAllDisciplinas()
    },
  }
}

export type ImportProjectsService = ReturnType<typeof createImportProjectsService>
