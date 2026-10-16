import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/api/root'
import { randomUUID } from 'node:crypto'
import { logger } from '@/utils/logger'
import { createTRPCContext } from '@/server/api/trpc'

const handler = (req: Request) => {
  const requestId = randomUUID()
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    responseMeta: () => ({ headers: { 'x-request-id': requestId } }),
    onError: ({ error, path, type, ctx }) => {
      logger.error(
        {
          requestId,
          path,
          type,
          code: error.code,
          userId: ctx?.user?.id ?? null,
          revision: process.env.GIT_REV ?? 'development',
        },
        'tRPC request failed'
      )
    },
  })
}

export { handler as GET, handler as POST }
