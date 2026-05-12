import type { Semestre, StatusInscricao } from '@/types'
import { logger } from '@/utils/logger'
import type { RelatoriosRepository } from './relatorios-repository'

const _log = logger.child({ context: 'RelatoriosQueryService' })

export function createRelatoriosQueryService(repo: RelatoriosRepository) {
  return {
    async getRelatorioGeral(ano: number, semestre: Semestre) {
      const [projetosStats, inscricoesStats, vagasStats] = await Promise.all([
        repo.findProjetosStats(ano, semestre),
        repo.findInscricoesStats(ano, semestre),
        repo.findVagasStats(ano, semestre),
      ])

      const projetos = projetosStats[0]
      const inscricoes = inscricoesStats[0]
      const vagas = vagasStats[0]

      return {
        projetos: {
          total: projetos?.total || 0,
          aprovados: Number(projetos?.aprovados) || 0,
          submetidos: Number(projetos?.submetidos) || 0,
          rascunhos: Number(projetos?.rascunhos) || 0,
          totalBolsasSolicitadas: Number(projetos?.totalBolsasSolicitadas) || 0,
          totalBolsasDisponibilizadas: Number(projetos?.totalBolsasDisponibilizadas) || 0,
        },
        inscricoes: {
          total: inscricoes?.total || 0,
          submetidas: Number(inscricoes?.submetidas) || 0,
          selecionadas: Number(inscricoes?.selecionadas) || 0,
          aceitas: Number(inscricoes?.aceitas) || 0,
        },
        vagas: {
          total: vagas?.total || 0,
          bolsistas: Number(vagas?.bolsistas) || 0,
          voluntarios: Number(vagas?.voluntarios) || 0,
        },
      }
    },

    async getRelatorioPorDepartamento(ano: number, semestre: Semestre) {
      const departamentos = await repo.findDepartamentosReport(ano, semestre)

      return departamentos.map((dept) => ({
        departamento: dept.departamento,
        projetos: dept.projetos,
        projetosAprovados: Number(dept.projetosAprovados) || 0,
        bolsasSolicitadas: Number(dept.bolsasSolicitadas) || 0,
        bolsasDisponibilizadas: Number(dept.bolsasDisponibilizadas) || 0,
      }))
    },

    async getRelatorioProfessores(ano: number, semestre: Semestre, departamentoId?: number) {
      const professores = await repo.findProfessoresReport(ano, semestre, departamentoId)

      return professores.map((prof) => ({
        professor: prof.professor,
        departamento: prof.departamento,
        projetos: prof.projetos,
        projetosAprovados: Number(prof.projetosAprovados) || 0,
        bolsasSolicitadas: Number(prof.bolsasSolicitadas) || 0,
        bolsasDisponibilizadas: Number(prof.bolsasDisponibilizadas) || 0,
      }))
    },

    async getRelatorioAlunos(ano: number, semestre: Semestre, status?: StatusInscricao) {
      return repo.findAlunosReport(ano, semestre, status)
    },

    async getRelatorioDisciplinas(ano: number, semestre: Semestre) {
      const disciplinas = await repo.findDisciplinasReport(ano, semestre)

      return disciplinas.map((disc) => ({
        disciplina: disc.disciplina,
        departamento: disc.departamento,
        projetos: disc.projetos,
        projetosAprovados: Number(disc.projetosAprovados) || 0,
      }))
    },

    async getRelatorioEditais(ano?: number) {
      return repo.findEditaisReport(ano)
    },

    async getDashboardMetrics(ano: number, semestre: Semestre) {
      const [projetosStats] = await repo.findProjetosStats(ano, semestre)
      const [inscricoesStats] = await repo.findInscricoesStats(ano, semestre)
      const [vagasStats] = await repo.findVagasStats(ano, semestre)

      return {
        totalProjetos: projetosStats?.total || 0,
        projetosAprovados: Number(projetosStats?.aprovados) || 0,
        totalInscricoes: inscricoesStats?.total || 0,
        totalBolsas: Number(projetosStats?.totalBolsasDisponibilizadas) || 0,
        totalVoluntarios: Number(vagasStats?.voluntarios) || 0,
      }
    },

    async getBolsasRedistribuicaoStatus(ano: number, semestre: Semestre) {
      const rows = await repo.findBolsasRedistribuicaoStatus(ano, semestre)

      const projetosComSurplus: Array<{
        projetoId: number
        titulo: string
        professor: string
        bolsasSolicitadas: number
        bolsasDisponibilizadas: number
        bolsistasAceitos: number
        surplus: number
      }> = []

      const projetosComDemanda: Array<{
        projetoId: number
        titulo: string
        professor: string
        bolsasSolicitadas: number
        bolsasDisponibilizadas: number
        bolsistasAceitos: number
        demanda: number
        proximoAluno: { nome: string; matricula: string | null; notaFinal: number | null } | null
      }> = []

      for (const row of rows) {
        const bolsasDisponibilizadas = Number(row.bolsasDisponibilizadas) || 0
        const bolsistasAceitos = Number(row.bolsistasAceitos) || 0
        const diff = bolsasDisponibilizadas - bolsistasAceitos

        if (diff > 0) {
          projetosComSurplus.push({
            projetoId: row.projetoId,
            titulo: row.titulo,
            professor: row.professorNome,
            bolsasSolicitadas: row.bolsasSolicitadas,
            bolsasDisponibilizadas,
            bolsistasAceitos,
            surplus: diff,
          })
        } else if (diff < 0) {
          const proximoRaw = await repo.findProximoBolsistaAcimaCota(row.projetoId, bolsasDisponibilizadas)
          const proximoAluno = proximoRaw
            ? {
                nome: proximoRaw.nome,
                matricula: proximoRaw.matricula,
                notaFinal: proximoRaw.notaFinal !== null ? Number(proximoRaw.notaFinal) : null,
              }
            : null

          projetosComDemanda.push({
            projetoId: row.projetoId,
            titulo: row.titulo,
            professor: row.professorNome,
            bolsasSolicitadas: row.bolsasSolicitadas,
            bolsasDisponibilizadas,
            bolsistasAceitos,
            demanda: -diff,
            proximoAluno,
          })
        }
      }

      return { projetosComSurplus, projetosComDemanda }
    },
  }
}

export type RelatoriosQueryService = ReturnType<typeof createRelatoriosQueryService>
