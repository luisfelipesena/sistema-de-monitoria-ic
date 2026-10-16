import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import postgres from 'postgres'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'

vi.mock('@/server/lib/email', () => ({ sendDepartamentoConsolidationEmail: vi.fn() }))
vi.mock('@/server/lib/email/admin-emails', () => ({
  adminEmailService: { sendChefeConsolidacaoSignatureRequest: vi.fn() },
}))
const generation = vi.hoisted(() => ({ fail: false, emptyProjects: new Set<number>() }))
vi.mock('@/server/services/selecao/selecao-service', () => ({
  createSelecaoService: () => ({
    generateAtaData: vi.fn(async ({ projetoId }: { projetoId: string }) => {
      if (generation.fail) throw new Error('Project PDF failed')
      return {
        projeto: {
          titulo: `Project ${projetoId}`,
          ano: 2099,
          semestre: 'SEMESTRE_2',
          professorResponsavel: { nomeCompleto: 'QA Professor' },
          departamento: { nome: 'QA Department' },
        },
        inscricoesBolsista: [
          {
            id: 1,
            aluno: { nomeCompleto: 'Scholarship Candidate' },
            notaFinal: generation.emptyProjects.has(Number(projetoId)) ? 6 : 9,
          },
        ],
        inscricoesVoluntario: [
          {
            id: 2,
            aluno: { nomeCompleto: 'Volunteer Candidate' },
            notaFinal: generation.emptyProjects.has(Number(projetoId)) ? 6 : 8,
          },
        ],
      }
    }),
  }),
}))

import { createRelatoriosService } from '@/server/services/relatorios/relatorios-service'
import { createConsolidacaoPDFService } from '@/server/services/relatorios/consolidacao-pdf-service'
import { sendDepartamentoConsolidationEmail } from '@/server/lib/email'
import { createRelatoriosExportService } from '@/server/services/relatorios/relatorios-export-service'
import { createRelatoriosRepository } from '@/server/services/relatorios/relatorios-repository'
import { db } from '@/server/db'

const url = process.env.PROGRAD_TEST_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname) || !new URL(url).pathname.includes('_qa')) {
  throw new Error('PROGRAD_TEST_DATABASE_URL must point to a local disposable _qa database')
}
const sql = postgres(url, { max: 2 })
const service = createRelatoriosService(db)
let png: string
let adminId: number
let professorId: number

beforeAll(async () => {
  const image = await sharp({
    create: { width: 120, height: 35, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
  })
    .png()
    .toBuffer()
  png = `data:image/png;base64,${image.toString('base64')}`
  const [user] =
    await sql`insert into "user" (username,email,role) values ('prograd-qa','prograd-qa@example.invalid','admin') returning id`
  adminId = user.id
  const [professor] =
    await sql`insert into professor (user_id,nome_completo) values (${adminId},'QA Professor') returning id`
  professorId = professor.id
})
beforeEach(async () => {
  generation.fail = false
  generation.emptyProjects.clear()
  vi.clearAllMocks()
  await sql`delete from consolidacao_prograd_assinatura where ano=2099`
  await sql`delete from projeto where ano=2099`
})
afterAll(async () => {
  await sql`delete from consolidacao_prograd_assinatura where ano=2099`
  await sql`delete from projeto where ano=2099`
  await sql`delete from professor where id=${professorId}`
  await sql`delete from "user" where id=${adminId}`
  await sql.end()
})

async function request(tipo: 'BOLSISTA' | 'VOLUNTARIO', substituirAssinatura = false) {
  return service.solicitarAssinaturaChefeConsolidacao(
    2099,
    'SEMESTRE_2',
    'chief@example.invalid',
    'QA Chief',
    adminId,
    tipo,
    substituirAssinatura
  )
}

async function addProject(title: string) {
  const [project] =
    await sql`insert into projeto (ano,semestre,tipo_proposicao,carga_horaria_semana,numero_semanas,publico_alvo,professor_responsavel_id,titulo,descricao,status,voluntarios_solicitados,bolsas_disponibilizadas) values (2099,'SEMESTRE_2','INDIVIDUAL',12,16,'QA',${professorId},${title},'QA','APPROVED',1,1) returning id`
  return Number(project.id)
}

describe('PROGRAD modality isolation on PostgreSQL', () => {
  it('keeps a signed scholarship consolidation separate from volunteers', async () => {
    const scholarship = await request('BOLSISTA')
    await service.signConsolidacaoByToken(scholarship.token, png)
    expect((await service.getConsolidacaoSignatureStatus(2099, 'SEMESTRE_2', 'VOLUNTARIO')).isSigned).toBe(false)
    const volunteer = await request('VOLUNTARIO')
    await expect(service.signConsolidacaoByToken(volunteer.token, png)).resolves.toMatchObject({ success: true })
    expect((await service.getConsolidacaoSignatureStatus(2099, 'SEMESTRE_2', 'BOLSISTA')).isSigned).toBe(true)
    expect(await sql`select count(*)::int as n from consolidacao_prograd_assinatura where ano=2099`).toEqual([{ n: 2 }])
  })

  it('requires explicit replacement and invalidates the previous link', async () => {
    const first = await request('BOLSISTA')
    await service.signConsolidacaoByToken(first.token, png)
    await expect(request('BOLSISTA')).rejects.toThrow(/assinad/i)
    const replacement = await request('BOLSISTA', true)
    await expect(service.getConsolidacaoByToken(first.token)).rejects.toThrow()
    expect((await service.getConsolidacaoSignatureStatus(2099, 'SEMESTRE_2', 'BOLSISTA')).isSigned).toBe(false)
    await expect(service.signConsolidacaoByToken(replacement.token, png)).resolves.toMatchObject({ success: true })
  })

  it('allows only one concurrent signature and prevents overwriting it', async () => {
    const pending = await request('VOLUNTARIO')
    const results = await Promise.allSettled([
      service.signConsolidacaoByToken(pending.token, png, 'First signer'),
      service.signConsolidacaoByToken(pending.token, png, 'Second signer'),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
  })

  it('keeps one row under concurrent first requests and rejects superseded links', async () => {
    const requests = await Promise.all([request('VOLUNTARIO'), request('VOLUNTARIO')])
    expect(await sql`select count(*)::int as n from consolidacao_prograd_assinatura where ano=2099`).toEqual([{ n: 1 }])
    const results = await Promise.allSettled(
      requests.map((result) => service.signConsolidacaoByToken(result.token, png))
    )
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  })

  it('rejects malformed signature input without changing the pending request', async () => {
    const pending = await request('VOLUNTARIO')
    await expect(service.signConsolidacaoByToken(pending.token, 'not-an-image')).rejects.toThrow(/PNG/)
    await expect(service.signConsolidacaoByToken(pending.token, 'data:image/png;base64,YmFk')).rejects.toThrow(
      /inválida/
    )
    expect((await service.getConsolidacaoSignatureStatus(2099, 'SEMESTRE_2', 'VOLUNTARIO')).hasPendingToken).toBe(true)
  })

  it('rejects expired links and does not report them as pending', async () => {
    const pending = await request('VOLUNTARIO')
    await sql`update consolidacao_prograd_assinatura set signature_token_expires_at=now()-interval '1 minute' where ano=2099`
    await expect(service.getConsolidacaoByToken(pending.token)).rejects.toThrow(/expir/i)
    await expect(service.signConsolidacaoByToken(pending.token, png)).rejects.toThrow(/expir/i)
    expect((await service.getConsolidacaoSignatureStatus(2099, 'SEMESTRE_2', 'VOLUNTARIO')).hasPendingToken).toBe(false)
  })

  it('sends only the selected modality PDF without borrowing the scholarship signature', async () => {
    await addProject('Project with both modalities')
    const scholarship = await request('BOLSISTA')
    await service.signConsolidacaoByToken(scholarship.token, png, 'Scholarship Chief')
    const exporter = createRelatoriosExportService(createRelatoriosRepository(db), async () => ({
      valido: true,
      totalProblemas: 0,
      problemas: [],
    }))
    await exporter.exportConsolidated(2099, 'SEMESTRE_2', false, true, undefined, adminId, 'qa@example.invalid')
    const payload = vi.mocked(sendDepartamentoConsolidationEmail).mock.calls[0][0]
    expect(payload.anexos.map((file) => file.filename)).toEqual(['resultados-selecao-voluntarios-2099-2.pdf'])
    const text = execFileSync('pdftotext', ['-', '-'], { input: payload.anexos[0].buffer }).toString()
    expect(text).toContain('VOLUNTÁRIOS')
    expect(text).not.toContain('Scholarship Chief')
    await exporter.exportConsolidated(2099, 'SEMESTRE_2', true, true, undefined, adminId, 'qa@example.invalid')
    expect(vi.mocked(sendDepartamentoConsolidationEmail).mock.calls[1][0].anexos.map((file) => file.filename)).toEqual([
      'resultados-selecao-bolsistas-2099-2.pdf',
      'resultados-selecao-voluntarios-2099-2.pdf',
    ])
  })

  it.each(['BOLSISTA', 'VOLUNTARIO'] as const)('omits empty results from the real %s PDF', async (tipo) => {
    const included = await addProject('Approved candidates')
    const omitted = await addProject('No approved candidates')
    generation.emptyProjects.add(omitted)
    const buffer = await createConsolidacaoPDFService().generateConsolidatedResultadosPDF({
      ano: 2099,
      semestre: 'SEMESTRE_2',
      adminUserId: adminId,
      tipo,
    })
    const text = execFileSync('pdftotext', ['-', '-'], { input: buffer }).toString()
    expect(text).toContain(`Project ${included}`)
    expect(text).not.toContain(`Project ${omitted}`)
    expect(text).not.toContain('Nenhum candidato aprovado')
    expect((await PDFDocument.load(buffer)).getPageCount()).toBe(2)
  })

  it('rejects a consolidation with no approved candidates rather than returning a signed cover alone', async () => {
    const project = await addProject('No approved candidates')
    generation.emptyProjects.add(project)
    await expect(
      createConsolidacaoPDFService().generateConsolidatedResultadosPDF({
        ano: 2099,
        semestre: 'SEMESTRE_2',
        adminUserId: adminId,
        tipo: 'VOLUNTARIO',
      })
    ).rejects.toThrow('Nenhum candidato aprovado')
  })

  it('includes volunteer-only projects in the real volunteer PDF', async () => {
    const [project] =
      await sql`insert into projeto (ano,semestre,tipo_proposicao,carga_horaria_semana,numero_semanas,publico_alvo,professor_responsavel_id,titulo,descricao,status,voluntarios_solicitados,bolsas_disponibilizadas) values (2099,'SEMESTRE_2','INDIVIDUAL',12,16,'QA',${professorId},'Volunteer-only project','QA','APPROVED',1,0) returning id`
    const buffer = await createConsolidacaoPDFService().generateConsolidatedResultadosPDF({
      ano: 2099,
      semestre: 'SEMESTRE_2',
      adminUserId: adminId,
      tipo: 'VOLUNTARIO',
    })
    const text = execFileSync('pdftotext', ['-', '-'], { input: buffer }).toString()
    expect(text).toContain(`Project ${project.id}`)
    expect(text).toContain('Volunteer Candidate')
    expect(text).not.toContain('Scholarship Candidate')
    if (process.env.PROGRAD_EVIDENCE_DIR)
      writeFileSync(`${process.env.PROGRAD_EVIDENCE_DIR}/volunteer-after.pdf`, buffer)
    generation.fail = true
    await expect(
      createConsolidacaoPDFService().generateConsolidatedResultadosPDF({
        ano: 2099,
        semestre: 'SEMESTRE_2',
        adminUserId: adminId,
        tipo: 'VOLUNTARIO',
      })
    ).rejects.toThrow('Project PDF failed')
  })
})
