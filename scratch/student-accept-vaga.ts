import { db } from '@/server/db'
import { createVagasService } from '@/server/services/vagas/vagas-service'

async function main() {
  const service = createVagasService(db)

  // Accept vaga for Inscrição ID 6 (voluntário)
  // userRole: 'student', userId: 51 (aluno1 user ID)
  const res = await service.acceptVaga('6', 'VOLUNTARIO', 51, 'student')
  console.log('Result:', res)
}

main().catch(console.error)
