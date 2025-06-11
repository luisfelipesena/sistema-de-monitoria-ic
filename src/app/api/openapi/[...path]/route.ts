import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'
import { type NextRequest } from 'next/server'
import { createOpenApiFetchHandler } from 'trpc-to-openapi'

export const dynamic = 'force-dynamic'

const handler = (req: NextRequest) => {
  return createOpenApiFetchHandler({
    endpoint: '/api/openapi',
    router: appRouter,
    createContext: createTRPCContext,
    req,
  })
}

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
}
