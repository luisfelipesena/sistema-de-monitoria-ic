import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { 
  vagaTable, 
  projetoTable, 
  alunoTable,
  userTable,
  projetoDocumentoTable,
  assinaturaDocumentoTable,
  professorTable
} from '@/server/db/schema'
import { z } from 'zod'
import { eq, and, desc, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import minioClient from '@/server/lib/minio'
import { TermoCompromissoTemplate, type TermoCompromissoProps } from '@/server/lib/pdfTemplates/termo'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

export const termosRouter = createTRPCRouter({
  // Gerar termo de compromisso
  generateTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      // Buscar vaga com dados relacionados
      const vagaData = await db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, parseInt(input.vagaId)),
        with: {
          aluno: {
            with: { user: true }
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: { user: true }
              },
              disciplinas: {
                with: {
                  disciplina: true
                }
              }
            }
          },
        }
      })

      if (!vagaData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vaga não encontrada',
        })
      }

      // Verificar permissões (professor do projeto ou admin)
      if (user.role !== 'admin' && 
          (user.role !== 'professor' || vagaData.projeto.professorResponsavelId !== user.id)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para gerar este termo',
        })
      }

      const disciplinaPrincipal = vagaData.projeto.disciplinas[0]?.disciplina ?? { nome: 'N/A', codigo: 'N/A' };

      // Preparar dados para o PDF
      const termoData: TermoCompromissoProps = {
        vaga: {
          id: vagaData.id.toString(),
          tipoBolsa: vagaData.tipo.toLowerCase() as 'bolsista' | 'voluntario',
          dataInicio: vagaData.dataInicio || new Date(),
          aluno: {
            user: {
              name: vagaData.aluno.user.username,
              email: vagaData.aluno.user.email,
            },
            matricula: vagaData.aluno.matricula,
            rg: vagaData.aluno.rg ?? undefined,
            cpf: vagaData.aluno.cpf,
          },
          projeto: {
            disciplina: {
              nome: disciplinaPrincipal.nome,
              codigo: disciplinaPrincipal.codigo,
              departamento: {
                nome: vagaData.projeto.departamento.nome,
                sigla: vagaData.projeto.departamento.sigla || 'IC',
              }
            },
            professor: {
              user: {
                name: vagaData.projeto.professorResponsavel.user.username,
                email: vagaData.projeto.professorResponsavel.user.email,
              },
              siape: vagaData.projeto.professorResponsavel.matriculaSiape ?? undefined,
            }
          },
          semestre: {
            ano: vagaData.projeto.ano,
            numero: vagaData.projeto.semestre === 'SEMESTRE_1' ? 1 : 2,
          }
        },
        dataGeracao: new Date(),
      }

      try {
        // Gerar PDF
        const pdfBuffer = await renderToBuffer(<TermoCompromissoTemplate {...termoData} />)
        
        // Upload para MinIO
        const fileName = `termos/TC-${vagaData.projeto.ano}-${vagaData.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}-${vagaData.id}.pdf`
        await minioClient.putObject('documents', fileName, pdfBuffer, pdfBuffer.length, {
          'Content-Type': 'application/pdf',
        })

        // Salvar no banco (documento do projeto)
        await db.insert(projetoDocumentoTable).values({
          projetoId: vagaData.projetoId,
          fileId: fileName,
          tipoDocumento: 'PROPOSTA_ORIGINAL', // TODO: Add TERMO_COMPROMISSO type
          observacoes: `Termo de compromisso gerado para vaga ${input.vagaId}`,
        })

        return {
          success: true,
          termoNumero: `TC-${vagaData.projeto.ano}-${vagaData.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}-${vagaData.id}`,
          fileName,
          message: 'Termo de compromisso gerado com sucesso',
        }

      } catch (error) {
        console.error('Erro ao gerar termo:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao gerar termo de compromisso',
        })
      }
    }),

  // Download do termo de compromisso
  downloadTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      // Buscar vaga
      const vagaData = await db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, parseInt(input.vagaId)),
        with: {
          aluno: {
            with: { user: true }
          },
          projeto: {
            with: {
              professorResponsavel: true
            }
          }
        }
      })

      if (!vagaData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vaga não encontrada',
        })
      }

      // Verificar permissões (aluno da vaga, professor do projeto ou admin)
      const isAluno = user.role === 'student' && vagaData.aluno.userId === user.id
      const isProfessor = user.role === 'professor' && vagaData.projeto.professorResponsavelId === user.id
      const isAdmin = user.role === 'admin'

      if (!isAluno && !isProfessor && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para baixar este termo',
        })
      }

      // Buscar documento do termo
      const termoNumero = `TC-${vagaData.projeto.ano}-${vagaData.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}-${vagaData.id}`
      const fileName = `termos/${termoNumero}.pdf`

      try {
        // Verificar se arquivo existe no MinIO
        const stat = await minioClient.statObject('documents', fileName)
        
        // Gerar URL pré-assinada para download
        const downloadUrl = await minioClient.presignedGetObject('documents', fileName, 24 * 60 * 60) // 24 horas

        return {
          downloadUrl,
          fileName: `${termoNumero}.pdf`,
          fileSize: stat.size,
        }

      } catch (error) {
        console.error('Erro ao gerar download:', error)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Termo não encontrado. Gere o termo primeiro.',
        })
      }
    }),

  // Assinar termo digitalmente
  signTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
        assinaturaData: z.string(), // Base64 da assinatura
        tipoAssinatura: z.enum(['TERMO_COMPROMISSO_ALUNO', 'PROJETO_PROFESSOR_RESPONSAVEL']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      // Buscar vaga
      const vagaData = await db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, parseInt(input.vagaId)),
        with: {
          aluno: {
            with: { user: true }
          },
          projeto: {
            with: {
              professorResponsavel: true
            }
          }
        }
      })

      if (!vagaData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vaga não encontrada',
        })
      }

      // Verificar permissões baseado no tipo de assinatura
      if (input.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO') {
        if (user.role !== 'student' || vagaData.aluno.userId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas o aluno pode assinar como aluno',
          })
        }
      } else if (input.tipoAssinatura === 'PROJETO_PROFESSOR_RESPONSAVEL') {
        if (user.role !== 'professor' || vagaData.projeto.professorResponsavelId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas o professor responsável pode assinar como professor',
          })
        }
      }

      // Verificar se já assinou
      const assinaturaExistente = await db.query.assinaturaDocumentoTable.findFirst({
        where: and(
          eq(assinaturaDocumentoTable.vagaId, parseInt(input.vagaId)),
          eq(assinaturaDocumentoTable.userId, user.id),
          eq(assinaturaDocumentoTable.tipoAssinatura, input.tipoAssinatura)
        )
      })

      if (assinaturaExistente) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você já assinou este termo',
        })
      }

      // Salvar assinatura
      await db.insert(assinaturaDocumentoTable).values({
        assinaturaData: input.assinaturaData,
        tipoAssinatura: input.tipoAssinatura,
        userId: user.id,
        vagaId: parseInt(input.vagaId),
      })

      return {
        success: true,
        message: 'Termo assinado com sucesso',
      }
    }),

  // Buscar status dos termos de um projeto
  getTermosStatus: protectedProcedure
    .input(
      z.object({
        projetoId: z.string().optional(),
        vagaId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      if (!input.projetoId && !input.vagaId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Forneça projetoId ou vagaId',
        })
      }

      let vagas: any[] = []

      if (input.projetoId) {
        // Buscar todas as vagas do projeto
        vagas = await db.query.vagaTable.findMany({
          where: eq(vagaTable.projetoId, parseInt(input.projetoId)),
          with: {
            aluno: {
              with: { user: true }
            },
            projeto: {
              with: {
                professorResponsavel: true
              }
            }
          }
        })

        // Verificar permissões do projeto
        if (vagas.length > 0) {
          const projeto = vagas[0].projeto
          if (user.role === 'professor' && projeto.professorResponsavelId !== user.id) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Você só pode ver termos de seus próprios projetos',
            })
          }
        }
      } else {
        // Buscar vaga específica
        const vaga = await db.query.vagaTable.findFirst({
          where: eq(vagaTable.id, parseInt(input.vagaId!)),
          with: {
            aluno: {
              with: { user: true }
            },
            projeto: {
              with: {
                professorResponsavel: true
              }
            }
          }
        })

        if (!vaga) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vaga não encontrada',
          })
        }

        vagas = [vaga]

        // Verificar permissões da vaga
        const isAluno = user.role === 'student' && vaga.aluno.userId === user.id
        const isProfessor = user.role === 'professor' && vaga.projeto.professorResponsavelId === user.id
        const isAdmin = user.role === 'admin'

        if (!isAluno && !isProfessor && !isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Você não tem permissão para ver este termo',
          })
        }
      }

      // Para cada vaga, buscar status das assinaturas
      const termosStatus = await Promise.all(
        vagas.map(async (vagaItem) => {
          const assinaturas = await db.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.vagaId, vagaItem.id),
            with: {
              user: true
            }
          })

          const assinaturaAluno = assinaturas.find(a => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
          const assinaturaProfessor = assinaturas.find(a => a.tipoAssinatura === 'PROJETO_PROFESSOR_RESPONSAVEL')

          let statusTermo = 'pendente_assinatura'
          if (assinaturaAluno && assinaturaProfessor) {
            statusTermo = 'assinado_completo'
          } else if (assinaturaAluno || assinaturaProfessor) {
            statusTermo = 'parcialmente_assinado'
          }

          return {
            vagaId: vagaItem.id,
            alunoNome: vagaItem.aluno.user.username,
            tipoVaga: vagaItem.tipo,
            statusTermo,
            assinaturaAluno: !!assinaturaAluno,
            assinaturaProfessor: !!assinaturaProfessor,
            dataAssinaturaAluno: assinaturaAluno?.createdAt,
            dataAssinaturaProfessor: assinaturaProfessor?.createdAt,
            termoNumero: `TC-${vagaItem.projeto.ano}-${vagaItem.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}-${vagaItem.id}`,
            observacoes: null, // Pode ser implementado se necessário
          }
        })
      )

      return termosStatus
    }),

  // Buscar termos pendentes (para dashboard)
  getTermosPendentes: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx

      if (user.role === 'student') {
        // Aluno: termos pendentes de sua assinatura
        const vagasAluno = await db.query.vagaTable.findMany({
          where: sql`${vagaTable.alunoId} IN (
            SELECT id FROM ${alunoTable} WHERE ${alunoTable.userId} = ${user.id}
          )`,
          with: {
            projeto: {
              columns: {
                titulo: true,
              },
              with: {
                professorResponsavel: true,
              }
            },
            aluno: true
          }
        })

        const termosPendentes = await Promise.all(
          vagasAluno.map(async (vagaItem) => {
            const assinaturaAluno = await db.query.assinaturaDocumentoTable.findFirst({
              where: and(
                eq(assinaturaDocumentoTable.vagaId, vagaItem.id),
                eq(assinaturaDocumentoTable.tipoAssinatura, 'TERMO_COMPROMISSO_ALUNO')
              )
            })

            if (!assinaturaAluno) {
              return {
                vagaId: vagaItem.id,
                projeto: vagaItem.projeto.titulo,
                tipo: vagaItem.tipo,
                professor: vagaItem.projeto.professorResponsavel.nomeCompleto,
                pendenteDe: 'aluno',
              }
            }
            return null
          })
        )

        return termosPendentes.filter(Boolean)

      } else if (user.role === 'professor') {
        // Professor: termos pendentes de sua assinatura
        const vagasProfessor = await db.query.vagaTable.findMany({
          where: sql`${vagaTable.projetoId} IN (
            SELECT id FROM ${projetoTable} WHERE ${projetoTable.professorResponsavelId} = ${user.id}
          )`,
          with: {
            projeto: true,
            aluno: {
              with: { user: true }
            }
          }
        })

        const termosPendentes = await Promise.all(
          vagasProfessor.map(async (vagaItem) => {
            const assinaturaProfessor = await db.query.assinaturaDocumentoTable.findFirst({
              where: and(
                eq(assinaturaDocumentoTable.vagaId, vagaItem.id),
                eq(assinaturaDocumentoTable.tipoAssinatura, 'PROJETO_PROFESSOR_RESPONSAVEL')
              )
            })

            if (!assinaturaProfessor) {
              return {
                vagaId: vagaItem.id,
                projeto: vagaItem.projeto.titulo,
                tipo: vagaItem.tipo,
                aluno: vagaItem.aluno.user.username,
                pendenteDe: 'professor',
              }
            }
            return null
          })
        )

        return termosPendentes.filter(Boolean)

      } else {
        // Admin: todos os termos pendentes
        const todasVagas = await db.query.vagaTable.findMany({
          with: {
            projeto: {
              with: {
                professorResponsavel: true
              }
            },
            aluno: {
              with: { user: true }
            }
          }
        })

        const termosPendentes = await Promise.all(
          todasVagas.map(async (vagaItem) => {
            const assinaturas = await db.query.assinaturaDocumentoTable.findMany({
              where: eq(assinaturaDocumentoTable.vagaId, vagaItem.id)
            })

            const assinaturaAluno = assinaturas.find(a => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
            const assinaturaProfessor = assinaturas.find(a => a.tipoAssinatura === 'PROJETO_PROFESSOR_RESPONSAVEL')

            if (!assinaturaAluno || !assinaturaProfessor) {
              return {
                vagaId: vagaItem.id,
                projeto: vagaItem.projeto.titulo,
                tipo: vagaItem.tipo,
                aluno: vagaItem.aluno.user.username,
                professor: vagaItem.projeto.professorResponsavel.nomeCompleto,
                pendenteDe: !assinaturaAluno ? 'aluno' : 'professor',
                statusCompleto: !!(assinaturaAluno && assinaturaProfessor),
              }
            }
            return null
          })
        )

        return termosPendentes.filter(Boolean)
      }
    }),
})