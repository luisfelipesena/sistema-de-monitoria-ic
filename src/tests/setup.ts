import type { TRPCContext } from '@/server/api/trpc'
import type { User } from '@/server/db/schema'
import { vi } from 'vitest'

// Mock database connection to prevent real DB connections
vi.mock('@/server/db', () => ({
  db: {
    query: {
      vagaTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      assinaturaDocumentoTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      alunoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      professorTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      projetoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      projetoDocumentoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      periodoInscricaoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      inscricaoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      userTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      departamentoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      disciplinaTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      cursoTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      editalTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      apiKeyTable: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    $count: vi.fn(),
    transaction: vi.fn(
      async (callback) =>
        await callback({
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([]),
          query: {
            assinaturaDocumentoTable: {
              findMany: vi.fn(),
              findFirst: vi.fn(),
            },
          },
        })
    ),
  },
}))

// Mock postgres connection
vi.mock('postgres', () => ({
  default: vi.fn(() => ({
    query: vi.fn(),
    end: vi.fn(),
  })),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock tRPC
vi.mock('@/utils/api', () => ({
  api: {},
}))

// Mock other global dependencies if necessary
vi.mock('@/utils/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('@/utils/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    NODE_ENV: 'test',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: '9000',
    MINIO_ACCESS_KEY: 'test',
    MINIO_SECRET_KEY: 'test',
    MINIO_BUCKET_NAME: 'test-bucket',
  },
}))

vi.mock('minio', () => ({
  Client: vi.fn().mockImplementation(() => ({
    bucketExists: vi.fn().mockResolvedValue(true),
    makeBucket: vi.fn().mockResolvedValue(true),
    putObject: vi.fn().mockResolvedValue('mock-etag'),
    getObject: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
    removeObject: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('@/server/lib/minio', () => {
  const mockClient = {
    bucketExists: vi.fn().mockResolvedValue(true),
    makeBucket: vi.fn().mockResolvedValue(true),
    putObject: vi.fn().mockResolvedValue('mock-etag'),
    getObject: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
    removeObject: vi.fn().mockResolvedValue(true),
    presignedGetObject: vi.fn().mockResolvedValue('http://mock-presigned-url'),
    listObjectsV2: vi.fn().mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield { name: 'mock-file.pdf', size: 1024, lastModified: new Date() }
      },
    }),
    statObject: vi.fn().mockResolvedValue({ size: 1024, lastModified: new Date() }),
  }

  return {
    default: vi.fn(() => mockClient), // getMinioClient function
    getMinioClient: vi.fn(() => mockClient),
    minioClient: mockClient, // Keep for backward compatibility
    bucketName: 'test-bucket',
    getBucketName: vi.fn(() => 'test-bucket'),
    ensureBucketExists: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/server/lib/pdf-service', () => ({
  generateAndStorePDF: vi.fn().mockResolvedValue('mock-file-path.pdf'),
  getStoredPDF: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data')),
}))

// Mock React PDF
vi.mock('@react-pdf/renderer', async () => {
  const actual = await vi.importActual('@react-pdf/renderer')
  return {
    ...actual,
    Font: {
      register: vi.fn(),
    },
    renderToBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')),
  }
})

// Mock PDF-lib
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPages: vi.fn().mockReturnValue([
        {
          drawImage: vi.fn(),
        },
      ]),
      embedPng: vi.fn().mockResolvedValue({
        scale: vi.fn().mockReturnValue({ width: 100, height: 50 }),
      }),
      save: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    }),
  },
}))

// Mock email service
vi.mock('@/server/lib/email-service', () => ({
  emailService: {
    sendGenericEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}))

export function createMockContext(user: User | null = null): TRPCContext {
  return {
    user,
    db: {
      query: {
        userTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        apiKeyTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        cursoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        departamentoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        disciplinaTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        projetoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        projetoDocumentoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        professorTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        alunoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        inscricaoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        vagaTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        editalTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        periodoInscricaoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        importacaoPlanejamentoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        notificacaoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        selecaoTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        termosTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        fileTable: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn(),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn(),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn(),
        }),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn(),
          orderBy: vi.fn(),
          limit: vi.fn(),
        }),
      }),
    } as never,
  }
}
