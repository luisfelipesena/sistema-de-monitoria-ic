import { vi } from 'vitest'

// Mock database connection to prevent real DB connections
vi.mock('@/server/db', () => ({
  db: {
    query: {},
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    $count: vi.fn(),
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

vi.mock('@/server/lib/minio', () => ({
  minioClient: {
    bucketExists: vi.fn().mockResolvedValue(true),
    makeBucket: vi.fn().mockResolvedValue(true),
    putObject: vi.fn().mockResolvedValue('mock-etag'),
    getObject: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
    removeObject: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('@/server/lib/pdf-service', () => ({
  generateAndStorePDF: vi.fn().mockResolvedValue('mock-file-path.pdf'),
  getStoredPDF: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data')),
}))
