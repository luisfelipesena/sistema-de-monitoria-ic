import { db } from '@/server/db'
import {
  alunoTable,
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import type { StatusInscricao, TipoVaga } from '@/types'
import { eq, and } from 'drizzle-orm'

async function seedConsolidationPhase5() {
  console.log('🌱 Seeding complete consolidated data with CPF, RG and Telefone...')

  // 1. Ensure approved projects exist for 2025.1
  const projects = await db
    .select()
    .from(projetoTable)
    .where(and(eq(projetoTable.ano, 2025), eq(projetoTable.status, 'APPROVED')))

  if (projects.length === 0) {
    console.error('❌ No approved projects found for 2025')
    process.exit(1)
  }

  const project1 = projects[0]
  const project2 = projects[1] || projects[0]

  // Ensure period exists
  const period = await db.query.periodoInscricaoTable.findFirst({
    where: eq(periodoInscricaoTable.ano, 2025),
  })

  if (!period) {
    console.error('❌ Period for 2025 not found')
    process.exit(1)
  }

  // 2. Prepare test monitors with CPF, RG and Telefone
  const monitors: Array<{
    email: string
    nome: string
    matricula: string
    cpf: string
    rg: string
    telefone: string
    cr: number
    banco: string
    agencia: string
    conta: string
    digitoConta: string
    tipo: TipoVaga
    projetoId: number
  }> = [
    {
      email: 'aluno1@ufba.br',
      nome: 'Ana Clara Lima',
      matricula: '202310001',
      cpf: '111.222.333-44',
      rg: '1234567890',
      telefone: '(71) 98888-1111',
      cr: 8.5,
      banco: '077 - Banco Inter',
      agencia: '0001',
      conta: '16215539',
      digitoConta: '5',
      tipo: 'BOLSISTA',
      projetoId: project1.id,
    },
    {
      email: 'aluno2@ufba.br',
      nome: 'Bruno Souza Santos',
      matricula: '202310002',
      cpf: '222.333.444-55',
      rg: '2345678901',
      telefone: '(71) 98888-2222',
      cr: 8.2,
      banco: '001 - Banco do Brasil',
      agencia: '1234',
      conta: '987654',
      digitoConta: '3',
      tipo: 'BOLSISTA',
      projetoId: project1.id,
    },
    {
      email: 'aluno3@ufba.br',
      nome: 'Carla Beatriz Oliveira',
      matricula: '202310003',
      cpf: '333.444.555-66',
      rg: '3456789012',
      telefone: '(71) 98888-3333',
      cr: 8.8,
      banco: '341 - Itaú Unibanco',
      agencia: '0456',
      conta: '12345',
      digitoConta: '8',
      tipo: 'VOLUNTARIO',
      projetoId: project2.id,
    },
    {
      email: 'aluno4@ufba.br',
      nome: 'Diego Fernandes Costa',
      matricula: '202310004',
      cpf: '444.555.666-77',
      rg: '4567890123',
      telefone: '(71) 98888-4444',
      cr: 7.9,
      banco: '104 - Caixa Econômica',
      agencia: '0890',
      conta: '54321',
      digitoConta: '1',
      tipo: 'VOLUNTARIO',
      projetoId: project2.id,
    },
  ]

  for (const item of monitors) {
    // Find user
    const [user] = await db.select().from(userTable).where(eq(userTable.email, item.email)).limit(1)
    if (!user) continue

    // Find/update aluno profile
    const [aluno] = await db.select().from(alunoTable).where(eq(alunoTable.userId, user.id)).limit(1)
    if (aluno) {
      await db
        .update(alunoTable)
        .set({
          nomeCompleto: item.nome,
          matricula: item.matricula,
          cpf: item.cpf,
          rg: item.rg,
          telefone: item.telefone,
          cr: item.cr,
          banco: item.banco,
          agencia: item.agencia,
          conta: item.conta,
          digitoConta: item.digitoConta,
        })
        .where(eq(alunoTable.id, aluno.id))
    }

    if (!aluno) continue

    // Check existing inscricao
    let [inscricao] = await db
      .select()
      .from(inscricaoTable)
      .where(and(eq(inscricaoTable.alunoId, aluno.id), eq(inscricaoTable.projetoId, item.projetoId)))
      .limit(1)

    const statusInscricao: StatusInscricao = item.tipo === 'BOLSISTA' ? 'ACCEPTED_BOLSISTA' : 'ACCEPTED_VOLUNTARIO'

    if (!inscricao) {
      ;[inscricao] = await db
        .insert(inscricaoTable)
        .values({
          periodoInscricaoId: period.id,
          projetoId: item.projetoId,
          alunoId: aluno.id,
          tipoVagaPretendida: item.tipo,
          status: statusInscricao,
          notaDisciplina: '9.00',
          notaSelecao: '8.50',
          coeficienteRendimento: item.cr.toString(),
          notaFinal: '8.75',
          cursouComponente: true,
        })
        .returning()
    } else {
      await db
        .update(inscricaoTable)
        .set({ status: statusInscricao, tipoVagaPretendida: item.tipo })
        .where(eq(inscricaoTable.id, inscricao.id))
    }

    // Check existing vaga
    const existingVaga = await db.select().from(vagaTable).where(eq(vagaTable.inscricaoId, inscricao.id)).limit(1)

    if (existingVaga.length === 0) {
      await db.insert(vagaTable).values({
        alunoId: aluno.id,
        projetoId: item.projetoId,
        inscricaoId: inscricao.id,
        tipo: item.tipo,
        dataInicio: new Date('2025-02-24'),
        dataFim: new Date('2025-06-26'),
      })
    }
  }

  console.log('✅ Consolidation data seeded successfully with CPF, RG, Telefone!')
  process.exit(0)
}

seedConsolidationPhase5().catch((err) => {
  console.error('Error seeding consolidation phase 5 data:', err)
  process.exit(1)
})
