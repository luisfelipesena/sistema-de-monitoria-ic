import { env } from '@/utils/env'
import { generateOpenApiDocument } from 'trpc-to-openapi'
import { appRouter } from './root'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`
  }

  const port = env.PORT || '3000'
  return `http://localhost:${port}`
}

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Sistema de Monitoria API',
  description: 'A comprehensive REST API for managing all endpoints of the sistema de monitoria. Built with tRPC and Next.js, providing full CRUD operations with type safety.',
  version: '1.0.0',
  baseUrl: `${getBaseUrl()}/api/openapi`,
  docsUrl: `${getBaseUrl()}/docs`,
  tags: ['sistema-de-monitoria'],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
}) 