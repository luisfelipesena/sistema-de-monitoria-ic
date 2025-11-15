import type { db } from '@/server/db'
import {
  alunoTable,
  assinaturaDocumentoTable,
  departamentoTable,
  disciplinaTable,
  editalTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import {
  APPROVED,
  BOLSISTA,
  PROJETO_STATUS_DRAFT,
  SUBMITTED,
  VOLUNTARIO,
  type Semestre,
  type StatusInscricao,
} from '@/types'
import { and, count, desc, eq, sql, sum } from 'drizzle-orm'

type Database = typeof db

export function createRelatoriosRepository(db: Database) {
  return {
    // General Report Stats
    async findProjetosStats(ano: number, semestre: Semestre) {
      return db
        .select({
          total: count(),
          aprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
          submetidos: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${SUBMITTED} THEN 1 END)`,
          rascunhos: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${PROJETO_STATUS_DRAFT} THEN 1 END)`,
          totalBolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          totalBolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))
    },

    async findInscricoesStats(ano: number, semestre: Semestre) {
      const inscricoesSubquery = db
        .select({ projetoId: projetoTable.id })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      return db
        .select({
          total: count(),
          submetidas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} = ${SUBMITTED} THEN 1 END)`,
          selecionadas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'SELECTED_%' THEN 1 END)`,
          aceitas: sql<number>`COUNT(CASE WHEN ${inscricaoTable.status} LIKE 'ACCEPTED_%' THEN 1 END)`,
        })
        .from(inscricaoTable)
        .where(sql`${inscricaoTable.projetoId} IN (${inscricoesSubquery})`)
    },

    async findVagasStats(ano: number, semestre: Semestre) {
      return db
        .select({
          total: count(),
          bolsistas: sql<number>`COUNT(CASE WHEN ${vagaTable.tipo} = ${BOLSISTA} THEN 1 END)`,
          voluntarios: sql<number>`COUNT(CASE WHEN ${vagaTable.tipo} = ${VOLUNTARIO} THEN 1 END)`,
        })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))
    },

    // Department Report
    async findDepartamentosReport(ano: number, semestre: Semestre) {
      return db
        .select({
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(projetoTable.id),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
          bolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          bolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(departamentoTable)
        .leftJoin(
          projetoTable,
          and(
            eq(departamentoTable.id, projetoTable.departamentoId),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre)
          )
        )
        .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)
        .orderBy(desc(count(projetoTable.id)))
    },

    // Professor Report
    async findProfessoresReport(ano: number, semestre: Semestre, departamentoId?: number) {
      return db
        .select({
          professor: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
            emailInstitucional: professorTable.emailInstitucional,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(projetoTable.id),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
          bolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          bolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(professorTable)
        .innerJoin(departamentoTable, eq(professorTable.departamentoId, departamentoTable.id))
        .leftJoin(
          projetoTable,
          and(
            eq(professorTable.id, projetoTable.professorResponsavelId),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre)
          )
        )
        .where(departamentoId ? eq(professorTable.departamentoId, departamentoId) : undefined)
        .groupBy(
          professorTable.id,
          professorTable.nomeCompleto,
          professorTable.emailInstitucional,
          departamentoTable.nome,
          departamentoTable.sigla
        )
        .orderBy(desc(count(projetoTable.id)))
    },

    // Student Report
    async findAlunosReport(ano: number, semestre: Semestre, status?: StatusInscricao) {
      return db
        .select({
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            emailInstitucional: alunoTable.emailInstitucional,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          inscricoes: count(inscricaoTable.id),
          statusInscricao: inscricaoTable.status,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          projeto: {
            titulo: projetoTable.titulo,
            professorResponsavel: professorTable.nomeCompleto,
          },
        })
        .from(alunoTable)
        .innerJoin(inscricaoTable, eq(alunoTable.id, inscricaoTable.alunoId))
        .innerJoin(
          projetoTable,
          and(
            eq(inscricaoTable.projetoId, projetoTable.id),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre)
          )
        )
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(status ? eq(inscricaoTable.status, status as StatusInscricao) : undefined)
        .groupBy(
          alunoTable.id,
          alunoTable.nomeCompleto,
          alunoTable.emailInstitucional,
          alunoTable.matricula,
          alunoTable.cr,
          inscricaoTable.status,
          inscricaoTable.tipoVagaPretendida,
          projetoTable.titulo,
          professorTable.nomeCompleto
        )
        .orderBy(desc(alunoTable.cr))
    },

    // Discipline Report
    async findDisciplinasReport(ano: number, semestre: Semestre) {
      return db
        .select({
          disciplina: {
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(projetoTable.id),
          projetosAprovados: sql<number>`COUNT(CASE WHEN ${projetoTable.status} = ${APPROVED} THEN 1 END)`,
        })
        .from(disciplinaTable)
        .innerJoin(departamentoTable, eq(disciplinaTable.departamentoId, departamentoTable.id))
        .leftJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .leftJoin(
          projetoTable,
          and(
            eq(projetoDisciplinaTable.projetoId, projetoTable.id),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre)
          )
        )
        .groupBy(
          disciplinaTable.id,
          disciplinaTable.nome,
          disciplinaTable.codigo,
          departamentoTable.nome,
          departamentoTable.sigla
        )
        .orderBy(desc(count(projetoTable.id)))
    },

    // Edital Report
    async findEditaisReport(ano?: number) {
      return db
        .select({
          edital: {
            id: editalTable.id,
            numeroEdital: editalTable.numeroEdital,
            titulo: editalTable.titulo,
            publicado: editalTable.publicado,
            dataPublicacao: editalTable.dataPublicacao,
          },
          periodo: {
            ano: periodoInscricaoTable.ano,
            semestre: periodoInscricaoTable.semestre,
            dataInicio: periodoInscricaoTable.dataInicio,
            dataFim: periodoInscricaoTable.dataFim,
          },
          criadoPor: {
            username: userTable.username,
          },
        })
        .from(editalTable)
        .innerJoin(periodoInscricaoTable, eq(editalTable.periodoInscricaoId, periodoInscricaoTable.id))
        .innerJoin(userTable, eq(editalTable.criadoPorUserId, userTable.id))
        .where(ano ? eq(periodoInscricaoTable.ano, ano) : undefined)
        .orderBy(desc(periodoInscricaoTable.ano), desc(periodoInscricaoTable.semestre))
    },

    // Consolidated Monitoring Data
    async findVagasWithRelations(ano: number, semestre: Semestre) {
      const vagas = await db.query.vagaTable.findMany({
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: true,
            },
          },
          inscricao: {
            with: {
              aluno: true,
              projeto: true,
            },
          },
        },
      })

      return vagas.filter((vaga) => vaga.projeto.ano === ano && vaga.projeto.semestre === semestre)
    },

    async findDisciplinasByProjetoId(projetoId: number) {
      return db
        .select({
          codigo: disciplinaTable.codigo,
          nome: disciplinaTable.nome,
        })
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, projetoId))
    },

    // Bolsistas Final
    async findBolsistasFinal(ano: number, semestre: Semestre, departamentoId?: number) {
      let whereCondition = and(
        eq(vagaTable.tipo, BOLSISTA),
        eq(projetoTable.ano, ano),
        eq(projetoTable.semestre, semestre)
      )

      if (departamentoId) {
        whereCondition = and(whereCondition, eq(projetoTable.departamentoId, departamentoId))
      }

      return db
        .select({
          vaga: {
            id: vagaTable.id,
            dataInicio: vagaTable.dataInicio,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            rg: alunoTable.rg,
            cpf: alunoTable.cpf,
            cr: alunoTable.cr,
            telefone: alunoTable.telefone,
            banco: alunoTable.banco,
            agencia: alunoTable.agencia,
            conta: alunoTable.conta,
            digitoConta: alunoTable.digitoConta,
          },
          alunoUser: { email: userTable.email },
          professor: {
            nomeCompleto: professorTable.nomeCompleto,
            matriculaSiape: professorTable.matriculaSiape,
            emailInstitucional: professorTable.emailInstitucional,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            cargaHorariaSemana: projetoTable.cargaHorariaSemana,
            numeroSemanas: projetoTable.numeroSemanas,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          edital: {
            valorBolsa: editalTable.valorBolsa,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(inscricaoTable, eq(vagaTable.inscricaoId, inscricaoTable.id))
        .innerJoin(periodoInscricaoTable, eq(inscricaoTable.periodoInscricaoId, periodoInscricaoTable.id))
        .innerJoin(editalTable, eq(periodoInscricaoTable.id, editalTable.periodoInscricaoId))
        .where(whereCondition)
        .orderBy(departamentoTable.nome, alunoTable.nomeCompleto)
    },

    // Voluntários Final
    async findVoluntariosFinal(ano: number, semestre: Semestre, departamentoId?: number) {
      let whereCondition = and(
        eq(vagaTable.tipo, VOLUNTARIO),
        eq(projetoTable.ano, ano),
        eq(projetoTable.semestre, semestre)
      )

      if (departamentoId) {
        whereCondition = and(whereCondition, eq(projetoTable.departamentoId, departamentoId))
      }

      return db
        .select({
          vaga: {
            id: vagaTable.id,
            dataInicio: vagaTable.dataInicio,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            rg: alunoTable.rg,
            cpf: alunoTable.cpf,
            cr: alunoTable.cr,
            telefone: alunoTable.telefone,
          },
          alunoUser: {
            email: userTable.email,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            cargaHorariaSemana: projetoTable.cargaHorariaSemana,
            numeroSemanas: projetoTable.numeroSemanas,
          },
          professor: {
            nomeCompleto: professorTable.nomeCompleto,
            matriculaSiape: professorTable.matriculaSiape,
          },
          departamento: {
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(whereCondition)
        .orderBy(alunoTable.nomeCompleto)
    },

    async findAssinaturasByVagaId(vagaId: number) {
      return db
        .select({
          tipoAssinatura: assinaturaDocumentoTable.tipoAssinatura,
          createdAt: assinaturaDocumentoTable.createdAt,
        })
        .from(assinaturaDocumentoTable)
        .where(eq(assinaturaDocumentoTable.vagaId, vagaId))
    },

    // Validation Data
    async findBolsistasForValidation(ano: number, semestre: Semestre) {
      return db
        .select({
          vaga: { id: vagaTable.id },
          aluno: {
            nomeCompleto: alunoTable.nomeCompleto,
            rg: alunoTable.rg,
            cpf: alunoTable.cpf,
            banco: alunoTable.banco,
            agencia: alunoTable.agencia,
            conta: alunoTable.conta,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(and(eq(vagaTable.tipo, BOLSISTA), eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))
    },

    async findVoluntariosForValidation(ano: number, semestre: Semestre) {
      return db
        .select({
          vaga: { id: vagaTable.id },
          aluno: {
            nomeCompleto: alunoTable.nomeCompleto,
            rg: alunoTable.rg,
            cpf: alunoTable.cpf,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(and(eq(vagaTable.tipo, VOLUNTARIO), eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))
    },

    // Departamentos for Consolidation
    async findAllDepartamentos() {
      return db
        .select({
          nome: departamentoTable.nome,
          emailChefeDepartamento: departamentoTable.emailChefeDepartamento,
        })
        .from(departamentoTable)
    },
  }
}

export type RelatoriosRepository = ReturnType<typeof createRelatoriosRepository>
