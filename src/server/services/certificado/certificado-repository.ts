import type { db } from '@/server/db'
import { departamentoTable, projetoTable, vagaTable } from '@/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'

type Database = typeof db

export function createCertificadoRepository(db: Database) {
  return {
    async findVagaById(vagaId: number) {
      return db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, vagaId),
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: {
                  user: true,
                },
              },
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
          inscricao: true,
        },
      })
    },

    async findVagasByAlunoId(alunoId: number) {
      return db.query.vagaTable.findMany({
        where: eq(vagaTable.alunoId, alunoId),
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: {
                  user: true,
                },
              },
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
          inscricao: true,
        },
        orderBy: (vaga, { desc }) => [desc(vaga.createdAt)],
      })
    },

    async findVagasByProjetoId(projetoId: number) {
      return db.query.vagaTable.findMany({
        where: eq(vagaTable.projetoId, projetoId),
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: {
                  user: true,
                },
              },
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
          inscricao: true,
        },
        orderBy: (vaga, { desc }) => [desc(vaga.createdAt)],
      })
    },

    async findCompletedVagasForPeriod(ano: number, semestre: string, departamentoId?: number) {
      // Find all vagas that have completed their term
      const projetos = await db.query.projetoTable.findMany({
        where: departamentoId
          ? and(
              eq(projetoTable.ano, ano),
              eq(projetoTable.semestre, semestre as 'SEMESTRE_1' | 'SEMESTRE_2'),
              eq(projetoTable.departamentoId, departamentoId)
            )
          : and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre as 'SEMESTRE_1' | 'SEMESTRE_2')),
        columns: { id: true },
      })

      if (projetos.length === 0) return []

      const projetoIds = projetos.map((p) => p.id)

      return db.query.vagaTable.findMany({
        where: inArray(vagaTable.projetoId, projetoIds),
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: {
                  user: true,
                },
              },
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
          inscricao: true,
        },
      })
    },

    async findChefeDepartamento(departamentoId: number) {
      // Find the department head (this could be stored in departamento table or a separate table)
      const departamento = await db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.id, departamentoId),
      })

      if (!departamento?.emailChefeDepartamento) {
        return null
      }

      return {
        nome: departamento.coordenador || 'Chefe do Departamento',
        email: departamento.emailChefeDepartamento,
        cargo: `Chefe do Departamento de ${departamento.sigla || departamento.nome}`,
      }
    },
  }
}

export type CertificadoRepository = ReturnType<typeof createCertificadoRepository>
