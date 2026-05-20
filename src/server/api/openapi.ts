import { env } from '@/utils/env'
import { generateOpenApiDocument } from 'trpc-to-openapi'
import { appRouter } from './root'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (env.CLIENT_URL) {
    return env.CLIENT_URL
  }

  const port = env.PORT || '3000'
  return `http://localhost:${port}`
}

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Sistema de Monitoria API',
  description:
    'A comprehensive REST API for managing all endpoints of the sistema de monitoria. Built with tRPC and Next.js, providing full CRUD operations with type safety.',
  version: '1.0.0',
  baseUrl: `${getBaseUrl()}/api/openapi`,
  docsUrl: `${getBaseUrl()}/docs`,
  tags: ['sistema-de-monitoria'],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token obtido via autenticação CAS da UFBA',
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key',
      description: 'API Key para autenticação programática. Também aceita Authorization: Bearer <api-key>',
    },
  },
})
