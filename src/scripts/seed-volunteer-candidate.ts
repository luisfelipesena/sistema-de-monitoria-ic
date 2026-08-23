import { db } from "@/server/db"
import {
  alunoTable,
  enderecoTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoTable,
  userTable,
} from "@/server/db/schema"
import { hashSync } from "bcryptjs"
import { eq } from "drizzle-orm"

async function main() {
  console.log("🌱 Creating volunteer student candidate for testing...")

  // 1. Encontrar o professor Carlos Silva
  const carlosUser = await db.query.userTable.findFirst({
    where: eq(userTable.email, "carlos.silva@ufba.br"),
  })

  if (!carlosUser) {
    throw new Error("Usuário Carlos Silva não encontrado")
  }

  const carlosProf = await db.query.professorTable.findFirst({
    where: eq(professorTable.userId, carlosUser.id),
  })

  if (!carlosProf) {
    throw new Error("Professor Carlos Silva não encontrado")
  }

  // 2. Encontrar o projeto do professor
  const projeto = await db.query.projetoTable.findFirst({
    where: eq(projetoTable.professorResponsavelId, carlosProf.id),
  })

  if (!projeto) {
    throw new Error("Projeto de Carlos Silva não encontrado")
  }

  // 3. Encontrar ou criar período de inscrição
  const periodo = await db.query.periodoInscricaoTable.findFirst()
  if (!periodo) {
    throw new Error("Período de inscrição não encontrado")
  }

  // 4. Criar Endereço para o novo aluno
  const [endereco] = await db
    .insert(enderecoTable)
    .values({
      rua: "Av. Adhemar de Barros",
      numero: 500,
      bairro: "Ondina",
      cidade: "Salvador",
      estado: "BA",
      cep: "40170-110",
      complemento: "Apt 302",
    })
    .returning()

  // 5. Criar Usuário aluno5 (Lucas Ferreira) se não existir
  let lucasUser = await db.query.userTable.findFirst({
    where: eq(userTable.email, "lucas.ferreira@ufba.br"),
  })

  if (!lucasUser) {
    const passwordHash = hashSync("123456", 10)
    ;[lucasUser] = await db
      .insert(userTable)
      .values({
        username: "lucas.ferreira",
        email: "lucas.ferreira@ufba.br",
        role: "student",
        passwordHash,
        emailVerifiedAt: new Date(),
      })
      .returning()
  }

  // 6. Criar Perfil de Aluno para Lucas Ferreira
  let lucasAluno = await db.query.alunoTable.findFirst({
    where: eq(alunoTable.userId, lucasUser.id),
  })

  if (!lucasAluno) {
    ;[lucasAluno] = await db
      .insert(alunoTable)
      .values({
        userId: lucasUser.id,
        nomeCompleto: "Lucas Ferreira Lima",
        genero: "MASCULINO",
        emailInstitucional: "lucas.ferreira@ufba.br",
        matricula: "202110005",
        cpf: "123.456.789-09",
        cr: 9.1,
        telefone: "(71) 99999-2005",
        cursoNome: "Ciência da Computação",
        enderecoId: endereco.id,
      })
      .returning()
  }

  // 7. Criar inscrição de Voluntário para Lucas Ferreira no projeto
  const inscricaoExistente = await db.query.inscricaoTable.findFirst({
    where: eq(inscricaoTable.alunoId, lucasAluno.id),
  })

  if (!inscricaoExistente) {
    await db.insert(inscricaoTable).values({
      periodoInscricaoId: periodo.id,
      projetoId: projeto.id,
      alunoId: lucasAluno.id,
      tipoVagaPretendida: "VOLUNTARIO",
      status: "SELECTED_VOLUNTARIO",
      notaDisciplina: "9.00",
      notaSelecao: "9.50",
      coeficienteRendimento: "8.80",
      notaFinal: "9.25",
      feedbackProfessor: "Candidato classificado como voluntário com ótimo desempenho acadêmico.",
    })
  } else {
    await db
      .update(inscricaoTable)
      .set({
        tipoVagaPretendida: "VOLUNTARIO",
        status: "SELECTED_VOLUNTARIO",
        notaDisciplina: "9.00",
        notaSelecao: "9.50",
        coeficienteRendimento: "8.80",
        notaFinal: "9.25",
      })
      .where(eq(inscricaoTable.id, inscricaoExistente.id))
  }

  // 8. Atualizar também uma inscrição existente para VOLUNTARIO (ex: Maria Oliveira / aluno2)
  const mariaUser = await db.query.userTable.findFirst({
    where: eq(userTable.email, "aluno2@ufba.br"),
  })
  if (mariaUser) {
    const mariaAluno = await db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, mariaUser.id),
    })
    if (mariaAluno) {
      const mariaInscricao = await db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.alunoId, mariaAluno.id),
      })
      if (mariaInscricao) {
        await db
          .update(inscricaoTable)
          .set({
            tipoVagaPretendida: "VOLUNTARIO",
            status: "SELECTED_VOLUNTARIO",
            notaDisciplina: "8.50",
            notaSelecao: "9.00",
            notaFinal: "8.75",
          })
          .where(eq(inscricaoTable.id, mariaInscricao.id))
      }
    }
  }

  console.log("✅ Candidate 'Lucas Ferreira Lima' successfully created and enrolled as VOLUNTARIO!")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
