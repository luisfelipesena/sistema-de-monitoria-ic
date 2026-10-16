import { describe, expect, it, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { logger } from '@/utils/logger'

vi.mock('@/server/api/trpc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/api/trpc')>()),
  createTRPCContext: vi.fn().mockResolvedValue({ user: null, db: {} }),
}))
vi.mock('@/server/api/root', async () => {
  const { createTRPCRouter, publicProcedure } = await import('@/server/api/trpc')
  return {
    appRouter: createTRPCRouter({
      traceFailure: publicProcedure.query(() => {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'secret-token-and-signature' })
      }),
      validateInput: publicProcedure.input(z.object({ tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']) })).query(() => 'ok'),
    }),
  }
})

import { GET } from '@/app/api/trpc/[trpc]/route'

describe('HTTP tRPC error tracing', () => {
  it('correlates the response with a safe log without logging error payloads', async () => {
    vi.clearAllMocks()
    const response = await GET(new Request('http://localhost/api/trpc/traceFailure'))
    expect(response.status).toBe(400)
    const requestId = response.headers.get('x-request-id')
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(logger.error).toHaveBeenCalledWith(
      {
        requestId,
        path: 'traceFailure',
        type: 'query',
        code: 'BAD_REQUEST',
        userId: null,
        revision: process.env.GIT_REV ?? 'development',
      },
      'tRPC request failed'
    )
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain('secret-token-and-signature')
  })

  it('also logs input validation failures before the resolver runs', async () => {
    vi.clearAllMocks()
    const response = await GET(new Request('http://localhost/api/trpc/validateInput?input=%7B%22json%22%3A%7B%7D%7D'))
    expect(response.status).toBe(400)
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: response.headers.get('x-request-id'),
        path: 'validateInput',
        code: 'BAD_REQUEST',
      }),
      'tRPC request failed'
    )
  })
})
