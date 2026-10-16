import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { relatoriosRouter } from '@/server/api/routers/relatorios/relatorios'
import { createMockContext } from '@/tests/setup'
import type { User } from '@/server/db/schema'

const methods = vi.hoisted(() => ({
  getConsolidacaoSignatureStatus: vi.fn(),
  solicitarAssinaturaChefeConsolidacao: vi.fn(),
  getConsolidacaoPDFBuffer: vi.fn(),
}))
vi.mock('@/server/services/relatorios/relatorios-service', () => ({ createRelatoriosService: () => methods }))

const admin: User = {
  id: 16,
  username: 'admin-qa',
  email: 'admin@example.invalid',
  role: 'admin',
  adminType: 'DCC',
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
  passwordHash: null,
  emailVerifiedAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
}
const period = { ano: 2026, semestre: 'SEMESTRE_2' as const }
const legacyRequest = { ...period, chefeNome: 'QA Chief', chefeEmail: 'chief@example.invalid' }

beforeEach(() => vi.clearAllMocks())

describe('PROGRAD requests from a page opened before deployment', () => {
  it.each(['status', 'request', 'download'] as const)(
    'returns an actionable error for legacy %s without side effects',
    async (operation) => {
      const caller = relatoriosRouter.createCaller(createMockContext(admin))
      const result =
        operation === 'status'
          ? caller.getConsolidacaoSignatureStatus(period)
          : operation === 'request'
            ? caller.solicitarAssinaturaChefeConsolidacao(legacyRequest)
            : caller.downloadConsolidacaoPDF(period)
      await expect(result).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('Recarregue'),
      })
      for (const method of Object.values(methods)) expect(method).not.toHaveBeenCalled()
    }
  )

  it('returns the reload instruction to the old HTTP client without technical Zod JSON', async () => {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: new Request('http://localhost/api/trpc/solicitarAssinaturaChefeConsolidacao', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: legacyRequest }),
      }),
      router: relatoriosRouter,
      createContext: () => createMockContext(admin),
    })
    expect(response.status).toBe(412)
    const body = await response.json()
    expect(body.error.json.message).toContain('Recarregue')
    expect(body.error.json.message).not.toContain('invalid_type')
    expect(methods.solicitarAssinaturaChefeConsolidacao).not.toHaveBeenCalled()
  })

  it.each(['BOLSISTA', 'VOLUNTARIO'] as const)('passes explicit %s to the signature service', async (tipo) => {
    methods.solicitarAssinaturaChefeConsolidacao.mockResolvedValue({ success: true })
    const caller = relatoriosRouter.createCaller(createMockContext(admin))
    await caller.solicitarAssinaturaChefeConsolidacao({ ...legacyRequest, tipo })
    expect(methods.solicitarAssinaturaChefeConsolidacao).toHaveBeenCalledWith(
      2026,
      'SEMESTRE_2',
      'chief@example.invalid',
      'QA Chief',
      16,
      tipo,
      false
    )
  })

  it.each(['BOLSISTA', 'VOLUNTARIO'] as const)('keeps status and PDF scoped to explicit %s', async (tipo) => {
    methods.getConsolidacaoSignatureStatus.mockResolvedValue({ isSigned: false })
    methods.getConsolidacaoPDFBuffer.mockResolvedValue(Buffer.from('pdf'))
    const caller = relatoriosRouter.createCaller(createMockContext(admin))
    await caller.getConsolidacaoSignatureStatus({ ...period, tipo })
    await caller.downloadConsolidacaoPDF({ ...period, tipo })
    expect(methods.getConsolidacaoSignatureStatus).toHaveBeenCalledWith(2026, 'SEMESTRE_2', tipo)
    expect(methods.getConsolidacaoPDFBuffer).toHaveBeenCalledWith(2026, 'SEMESTRE_2', 16, tipo)
  })

  it('keeps authentication required for legacy requests', async () => {
    const caller = relatoriosRouter.createCaller(createMockContext())
    await expect(caller.solicitarAssinaturaChefeConsolidacao(legacyRequest)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(methods.solicitarAssinaturaChefeConsolidacao).not.toHaveBeenCalled()
  })
})
