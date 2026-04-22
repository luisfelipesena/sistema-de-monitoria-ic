import { createTRPCRouter, studentProtectedProcedure } from '@/server/api/trpc'
import { createInscricaoRepository } from '@/server/services/inscricao/inscricao-repository'
import { BusinessError } from '@/types/errors'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const alunoRouter = createTRPCRouter({
  /**
   * Retorna o perfil completo do aluno autenticado (endereço + dados bancários).
   * Usado para pre-preencher o wizard de inscrição.
   */
  getFullProfile: studentProtectedProcedure.input(z.void()).query(async ({ ctx }) => {
    const repo = createInscricaoRepository(ctx.db)
    const aluno = await repo.findAlunoFullByUserId(ctx.user.id)
    if (!aluno) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de aluno não encontrado' })
    }
    try {
      return {
        id: aluno.id,
        userId: aluno.userId,
        nomeCompleto: aluno.nomeCompleto,
        nomeSocial: aluno.nomeSocial ?? null,
        cpf: aluno.cpf ?? null,
        rg: aluno.rg ?? null,
        matricula: aluno.matricula ?? null,
        dataNascimento: aluno.dataNascimento ?? null,
        genero: aluno.genero ?? null,
        telefone: aluno.telefone ?? null,
        telefoneFixo: aluno.telefoneFixo ?? null,
        cursoNome: aluno.cursoNome ?? null,
        emailInstitucional: aluno.emailInstitucional ?? null,
        cr: aluno.cr ?? null,
        banco: aluno.banco ?? null,
        agencia: aluno.agencia ?? null,
        conta: aluno.conta ?? null,
        digitoConta: aluno.digitoConta ?? null,
        historicoEscolarFileId: aluno.historicoEscolarFileId ?? null,
        comprovanteMatriculaFileId: aluno.comprovanteMatriculaFileId ?? null,
        endereco: aluno.endereco
          ? {
              id: aluno.endereco.id,
              rua: aluno.endereco.rua,
              numero: aluno.endereco.numero ?? null,
              bairro: aluno.endereco.bairro,
              cidade: aluno.endereco.cidade,
              estado: aluno.endereco.estado,
              cep: aluno.endereco.cep,
              complemento: aluno.endereco.complemento ?? null,
            }
          : null,
        user: {
          id: aluno.user.id,
          username: aluno.user.username,
          email: aluno.user.email,
        },
      }
    } catch (error) {
      if (error instanceof BusinessError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
      throw error
    }
  }),
})
