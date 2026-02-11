import type { db } from '@/server/db'
import type { NewProjeto } from '@/server/db/schema'
import { sendProjectCreationNotification } from '@/server/lib/email'
import { BusinessError, NotFoundError } from '@/server/lib/errors'
import minioClient, { bucketName as MINIO_BUCKET } from '@/server/lib/minio'
import { groupByDisciplina, parsePlanejamentoDCC } from '@/server/lib/planejamento-dcc-parser'
import { parsePlanejamentoSpreadsheet, validateSpreadsheetStructure } from '@/server/lib/spreadsheet-parser'
import { createAuditService } from '@/server/services/audit/audit-service'
import type { Semestre } from '@/types'
import {
  AUDIT_ACTION_CREATE,
  AUDIT_ENTITY_PROJETO,
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
import {
  findMatchingProfessors,
  sanitizeDisciplineCode,
  sanitizeSiape,
  sanitizeTitle,
} from '@/utils/string-normalization'
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
  const auditService = createAuditService(db)

  // Helper function to create a project for a single professor
  async function createProjetoForProfessor(
    disciplina: { id: number; codigo: string; nome: string },
    professor: { id: number; nomeCompleto: string; departamentoId: number | null; userId: number },
    importacao: { id: number; ano: number; semestre: Semestre },
    row: ProcessedRow,
    professoresNotificar: Set<number>,
    warnings: string[],
    erros: string[]
  ): Promise<number> {
    const codigoSanitizado = sanitizeDisciplineCode(row.disciplinaCodigo)
    const nomeSanitizado = sanitizeTitle(row.disciplinaNome)

    // Deduplication: skip if active project already exists for this professor+discipline+ano+semestre
    const existing = await repo.findExistingProjeto(professor.id, disciplina.id, importacao.ano, importacao.semestre)
    if (existing) {
      warnings.push(
        `Projeto já existe para ${professor.nomeCompleto} em ${codigoSanitizado} (${importacao.ano}/${importacao.semestre}). Pulando.`
      )
      return 0
    }

    if (!professor.departamentoId) {
      erros.push(
        `Disciplina ${codigoSanitizado}: Professor ${professor.nomeCompleto} não possui departamento associado`
      )
      return 0
    }

    const template = await repo.findTemplatePorDisciplina(disciplina.id)

    // Sanitize title from spreadsheet or template
    let titulo = sanitizeTitle(nomeSanitizado)
    let descricao = `Projeto de monitoria para ${titulo}`
    let cargaHorariaSemana = 12
    let numeroSemanas = 17
    let publicoAlvo = 'Estudantes do curso'
    let atividades: string[] = []

    if (template) {
      titulo = sanitizeTitle(template.tituloDefault || titulo)
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
    } else {
      warnings.push(`Disciplina ${codigoSanitizado}: Sem template cadastrado, usando valores padrão`)
    }

    const novoProjeto: NewProjeto = {
      titulo,
      descricao,
      professorResponsavelId: professor.id,
      departamentoId: professor.departamentoId,
      disciplinaNome: titulo,
      ano: importacao.ano,
      semestre: importacao.semestre,
      cargaHorariaSemana,
      numeroSemanas,
      publicoAlvo,
      bolsasSolicitadas: row.vagas || 0,
      voluntariosSolicitados: 0,
      tipoProposicao: TIPO_PROPOSICAO_INDIVIDUAL,
      professoresParticipantes: null,
      status: PROJETO_STATUS_PENDING_SIGNATURE,
      importacaoPlanejamentoId: importacao.id,
    }

    const projeto = await repo.createProjeto(novoProjeto)
    await repo.associateProjetoDisciplina(projeto.id, disciplina.id)

    const existingAssociation = await repo.findAssociacaoProfessorDisciplina(
      disciplina.id,
      professor.id,
      importacao.ano,
      importacao.semestre
    )

    if (!existingAssociation) {
      await repo.createAssociacaoProfessorDisciplina(disciplina.id, professor.id, importacao.ano, importacao.semestre)
    }

    if (atividades.length > 0) {
      const atividadesData = atividades.map((descricao) => ({
        projetoId: projeto.id,
        descricao,
      }))
      await repo.insertAtividades(atividadesData)
    }

    professoresNotificar.add(professor.userId)

    log.info(
      {
        projetoId: projeto.id,
        disciplina: codigoSanitizado,
        titulo,
        professor: professor.nomeCompleto,
      },
      'Projeto criado para professor individual'
    )

    return 1
  }

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
          // Sanitize discipline code
          const codigoSanitizado = sanitizeDisciplineCode(row.disciplinaCodigo)
          const nomeSanitizado = sanitizeTitle(row.disciplinaNome)

          // Try to find discipline by code
          let disciplina = await repo.findDisciplinaByCodigo(codigoSanitizado)

          // Sanitize SIAPE numbers
          const siapesSanitizados = row.professoresSiapes.map(sanitizeSiape).filter((s) => s.length > 0)

          // Separate SIAPEs (numeric) from potential names (non-numeric)
          const siapesNumericos = siapesSanitizados.filter((s) => /^\d{6,8}$/.test(s))
          const possiveisNomes = row.professoresSiapes.filter((s) => !/^\d{6,8}$/.test(sanitizeSiape(s)))

          // Find professors by SIAPE first
          const professores = await repo.findProfessoresBySiapes(siapesNumericos)

          // If we have potential names (non-SIAPE values), try fuzzy matching
          // Also check if any SIAPE values might actually be names
          if (possiveisNomes.length > 0 || (professores.length === 0 && row.professoresSiapes.length > 0)) {
            log.info(
              { siapes: siapesSanitizados, possiveisNomes },
              'Tentando busca por nome fuzzy para valores não-SIAPE'
            )

            // Try each non-SIAPE value as a potential name
            // Also try SIAPE values if no professors found yet
            const valoresParaBuscar = [...possiveisNomes, ...(professores.length === 0 ? row.professoresSiapes : [])]

            for (const possibleName of valoresParaBuscar) {
              // Skip if already found by SIAPE
              if (siapesNumericos.includes(sanitizeSiape(possibleName))) continue

              const fuzzyMatch = await repo.findProfessorByNameFuzzy(possibleName)
              if (fuzzyMatch && !professores.find((p) => p.id === fuzzyMatch.id)) {
                professores.push(fuzzyMatch)
                warnings.push(
                  `Disciplina ${codigoSanitizado}: Professor "${possibleName}" encontrado por correspondência fuzzy como "${fuzzyMatch.nomeCompleto}"`
                )
              }
            }
          }

          // Check if professor field contains comma-separated names
          // If we have multiple potential names and found multiple professors, create separate projects
          const temMultiplosNomes = possiveisNomes.length > 1 || row.professoresSiapes.some((s) => s.includes(','))

          if (professores.length === 0) {
            warnings.push(
              `⚠️ Disciplina ${codigoSanitizado} (${nomeSanitizado}): NENHUM PROFESSOR ENCONTRADO. SIAPEs/Nomes informados: ${row.professoresSiapes.join(', ')}. Verifique se o professor foi cadastrado previamente no sistema.`
            )
            projetosComErro++
            continue
          }

          if (professores.length < row.professoresSiapes.length) {
            const encontrados = professores.map((p) => p.matriculaSiape).filter(Boolean)
            const naoEncontrados = siapesSanitizados.filter((s) => !encontrados.includes(s))
            if (naoEncontrados.length > 0) {
              warnings.push(
                `Disciplina ${codigoSanitizado}: Alguns professores não encontrados: ${naoEncontrados.join(', ')}`
              )
            }
          }

          // If we have comma-separated names and found multiple professors, create separate projects for each
          if (temMultiplosNomes && professores.length > 1) {
            warnings.push(
              `Disciplina ${codigoSanitizado}: Múltiplos professores detectados (${professores.map((p) => p.nomeCompleto).join(', ')}). Criando projetos separados para cada professor.`
            )

            // Create a project for each professor
            for (const professor of professores) {
              if (!professor.departamentoId) {
                erros.push(
                  `Disciplina ${codigoSanitizado}: Professor ${professor.nomeCompleto} não possui departamento associado`
                )
                projetosComErro++
                continue
              }

              // Find or create discipline for this professor's department
              let disciplina = await repo.findDisciplinaByCodigo(codigoSanitizado)
              if (!disciplina) {
                const result = await repo.findOrCreateDisciplina({
                  codigo: codigoSanitizado,
                  nome: nomeSanitizado,
                  departamentoId: professor.departamentoId,
                })
                disciplina = result.disciplina
                if (result.created) {
                  warnings.push(
                    `Disciplina ${codigoSanitizado} (${nomeSanitizado}) não existia e foi criada automaticamente`
                  )
                }
              }

              const created = await createProjetoForProfessor(
                disciplina,
                professor,
                importacao,
                row,
                professoresNotificar,
                warnings,
                erros
              )
              if (created > 0) {
                projetosCriados++
              } else {
                projetosComErro++
              }
            }

            continue
          }

          // Single project (original logic)
          const tipoProposicao = professores.length > 1 ? TIPO_PROPOSICAO_COLETIVA : TIPO_PROPOSICAO_INDIVIDUAL
          const professorResponsavel = professores[0]

          if (!professorResponsavel.departamentoId) {
            erros.push(
              `Disciplina ${codigoSanitizado}: Professor ${professorResponsavel.nomeCompleto} não possui departamento associado`
            )
            projetosComErro++
            continue
          }

          // If discipline doesn't exist, create it in the professor's department
          if (!disciplina) {
            const result = await repo.findOrCreateDisciplina({
              codigo: codigoSanitizado,
              nome: nomeSanitizado,
              departamentoId: professorResponsavel.departamentoId,
            })
            disciplina = result.disciplina

            if (result.created) {
              warnings.push(
                `Disciplina ${codigoSanitizado} (${nomeSanitizado}) não existia e foi criada automaticamente`
              )
              log.info(
                { disciplinaId: disciplina.id, codigo: codigoSanitizado, nome: nomeSanitizado },
                'Disciplina criada automaticamente'
              )
            }
          }

          // Deduplication: skip if active project already exists
          const existingProjeto = await repo.findExistingProjeto(
            professorResponsavel.id, disciplina.id, importacao.ano, importacao.semestre
          )
          if (existingProjeto) {
            warnings.push(
              `Projeto já existe para ${professorResponsavel.nomeCompleto} em ${codigoSanitizado} (${importacao.ano}/${importacao.semestre}). Pulando.`
            )
            continue
          }

          const template = await repo.findTemplatePorDisciplina(disciplina.id)

          // Sanitize title from spreadsheet or template
          let titulo = sanitizeTitle(nomeSanitizado)
          let descricao = `Projeto de monitoria para ${titulo}`
          let cargaHorariaSemana = 12
          let numeroSemanas = 17
          let publicoAlvo = 'Estudantes do curso'
          let atividades: string[] = []
          let professoresParticipantes: string | null = null

          if (template) {
            titulo = sanitizeTitle(template.tituloDefault || titulo)
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
            warnings.push(`Disciplina ${codigoSanitizado}: Sem template cadastrado, usando valores padrão`)
          }

          if (tipoProposicao === TIPO_PROPOSICAO_COLETIVA) {
            professoresParticipantes = professores.map((p) => p.nomeCompleto).join(', ')
          }

          const novoProjeto: NewProjeto = {
            titulo,
            descricao,
            professorResponsavelId: professorResponsavel.id,
            departamentoId: professorResponsavel.departamentoId,
            disciplinaNome: titulo,
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
            importacaoPlanejamentoId: importacao.id,
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
              disciplina: codigoSanitizado,
              titulo,
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

      // Audit log for batch import completion
      if (projetosCriados > 0) {
        await auditService.logAction(
          importacao.importadoPorUserId,
          AUDIT_ACTION_CREATE,
          AUDIT_ENTITY_PROJETO,
          importacaoId,
          {
            action: 'BATCH_IMPORT',
            importacaoId,
            ano: importacao.ano,
            semestre: importacao.semestre,
            projetosCriados,
            projetosComErro,
            status: finalStatus,
          }
        )
      }

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
      // Soft-delete all projects created by this import before deleting the import record
      await repo.softDeleteProjetosByImportacaoId(id)
      await repo.deleteImportacao(id)
      return { success: true }
    },

    async getProfessores() {
      return repo.findAllProfessores()
    },

    async getDisciplinas() {
      return repo.findAllDisciplinas()
    },

    /**
     * Processa arquivo de planejamento DCC (formato específico com nomes de professores)
     */
    async processImportedFileDCC(importacaoId: number) {
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
      const parsed = await parsePlanejamentoDCC(fileBuffer)

      warnings.push(...parsed.warnings)
      erros.push(...parsed.errors)

      log.info(
        {
          totalLinhas: parsed.rows.length,
          warnings: parsed.warnings.length,
          errors: parsed.errors.length,
        },
        'Planilha DCC parseada'
      )

      // Agrupar por disciplina (código)
      const grouped = groupByDisciplina(parsed.rows)

      // Buscar departamento DCC para auto-criação de disciplinas
      const dccDepartamento = await repo.findDepartamentoBySigla('DCC')

      if (!dccDepartamento) {
        erros.push('Departamento DCC não encontrado no sistema. Certifique-se de que existe.')
      }

      // Cache de professores para busca fuzzy
      const allProfessors = await repo.findAllProfessoresComUsuario()

      // Processar cada disciplina
      for (const [_key, entries] of grouped.entries()) {
        if (Date.now() - startTime > TIMEOUT_MS) {
          erros.push('Timeout: Importação cancelada devido ao tempo limite excedido')
          break
        }

        try {
          const firstEntry = entries[0]
          const codigoSanitizado = sanitizeDisciplineCode(firstEntry.disciplinaCodigo)
          const nomeSanitizado = sanitizeTitle(firstEntry.disciplinaNome)

          // Buscar ou criar disciplina
          let disciplina = await repo.findDisciplinaByCodigo(codigoSanitizado)

          if (!disciplina && dccDepartamento) {
            const result = await repo.findOrCreateDisciplina({
              codigo: codigoSanitizado,
              nome: nomeSanitizado,
              departamentoId: dccDepartamento.id,
            })
            disciplina = result.disciplina

            if (result.created) {
              warnings.push(`Disciplina ${codigoSanitizado} (${nomeSanitizado}) criada automaticamente`)
              log.info({ disciplinaId: disciplina.id, codigo: codigoSanitizado }, 'Disciplina criada automaticamente')
            }
          }

          if (!disciplina) {
            erros.push(
              `Disciplina ${codigoSanitizado} (${nomeSanitizado}) não encontrada e não foi possível criar (DCC não existe)`
            )
            projetosComErro++
            continue
          }

          // Buscar professores por NOME usando fuzzy matching
          const professoresNomes = entries.map((e) => e.professorNome)
          const professores: typeof allProfessors = []

          for (const nomeProf of professoresNomes) {
            const matches = findMatchingProfessors(nomeProf, allProfessors)

            if (matches.length > 0) {
              const professor = matches[0]
              if (!professores.find((p) => p.id === professor.id)) {
                professores.push(professor)
              }
              if (matches.length > 1) {
                warnings.push(
                  `Professor "${nomeProf}" tem ${matches.length} possíveis matches. Usando: ${professor.nomeCompleto}`
                )
              }
            } else {
              warnings.push(
                `⚠️ Professor "${nomeProf}" NÃO ENCONTRADO no sistema para ${codigoSanitizado}. Verifique se o professor foi cadastrado previamente.`
              )
            }
          }

          if (professores.length === 0) {
            warnings.push(
              `⚠️ Disciplina ${codigoSanitizado}: NENHUM PROFESSOR ENCONTRADO. ` +
                `Nomes informados: ${professoresNomes.join(', ')}. Projeto não criado.`
            )
            projetosComErro++
            continue
          }

          // Create one INDIVIDUAL project per professor
          const dccRow: ProcessedRow = {
            disciplinaCodigo: codigoSanitizado,
            disciplinaNome: nomeSanitizado,
            professoresSiapes: [],
            vagas: 0,
          }

          for (const professor of professores) {
            const created = await createProjetoForProfessor(
              disciplina,
              professor,
              importacao,
              dccRow,
              professoresNotificar,
              warnings,
              erros
            )
            if (created > 0) {
              projetosCriados++
            } else {
              projetosComErro++
            }
          }
        } catch (error) {
          erros.push(
            `Erro ao criar projeto para ${entries[0].disciplinaCodigo}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
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
        totalProjetos: grouped.size,
        projetosCriados,
        projetosComErro,
        status: finalStatus,
        erros: erros.length > 0 || warnings.length > 0 ? JSON.stringify({ erros, warnings }) : null,
      })

      // Enviar emails
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
        } catch (error) {
          log.error(error, 'Erro ao enviar emails de notificação')
        }
      }

      log.info(
        {
          importacaoId,
          projetosCriados,
          projetosComErro,
          emailsEnviados: professoresNotificar.size,
        },
        'Importação DCC finalizada'
      )

      // Audit log for DCC batch import completion
      if (projetosCriados > 0) {
        await auditService.logAction(
          importacao.importadoPorUserId,
          AUDIT_ACTION_CREATE,
          AUDIT_ENTITY_PROJETO,
          importacaoId,
          {
            action: 'BATCH_IMPORT_DCC',
            importacaoId,
            ano: importacao.ano,
            semestre: importacao.semestre,
            projetosCriados,
            projetosComErro,
            status: finalStatus,
          }
        )
      }

      return {
        projetosCriados,
        projetosComErro,
        erros,
        warnings,
        emailsEnviados: professoresNotificar.size,
      }
    },
  }
}

export type ImportProjectsService = ReturnType<typeof createImportProjectsService>
