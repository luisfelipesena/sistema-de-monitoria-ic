import { db } from '@/server/db'
import {
  alunoTable,
  assinaturaDocumentoTable,
  ataSelecaoTable,
  departamentoTable,
  disciplinaProfessorResponsavelTable,
  disciplinaTable,
  editalTable,
  enderecoTable,
  importacaoPlanejamentoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  notaAlunoTable,
  notificacaoHistoricoTable,
  periodoInscricaoTable,
  professorInvitationTable,
  professorTable,
  projetoDisciplinaTable,
  projetoDocumentoTable,
  projetoProfessorParticipanteTable,
  projetoTable,
  projetoTemplateTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  relatorioTemplateTable,
  sessionTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { hashSync } from 'bcryptjs'
import { eq } from 'drizzle-orm'

const log = logger.child({ context: 'DatabaseSeed' })

async function seedDatabase() {
  log.info('🌱 Iniciando seed do banco de dados...')

  try {
    // 1. Limpar dados existentes (em ordem correta para evitar conflitos de FK)
    log.info('🧹 Limpando dados existentes...')
    // Relatórios e templates
    await db.delete(relatorioFinalMonitorTable)
    await db.delete(relatorioFinalDisciplinaTable)
    await db.delete(relatorioTemplateTable)
    // Assinaturas e documentos
    await db.delete(assinaturaDocumentoTable)
    await db.delete(inscricaoDocumentoTable)
    await db.delete(projetoDocumentoTable)
    await db.delete(ataSelecaoTable)
    // Vaga depende de inscricao e projeto
    await db.delete(vagaTable)
    // Inscricao depende de projeto, aluno, periodo
    await db.delete(inscricaoTable)
    // Notificações
    await db.delete(notificacaoHistoricoTable)
    // Importações (depende de user)
    await db.delete(importacaoPlanejamentoTable)
    // Edital depende de periodo e user
    await db.delete(editalTable)
    // Projetos e relacionados
    await db.delete(projetoProfessorParticipanteTable)
    await db.delete(projetoDisciplinaTable)
    await db.delete(projetoTable)
    // Templates de projeto (depende de disciplina e user)
    await db.delete(projetoTemplateTable)
    // Disciplinas e professores
    await db.delete(disciplinaProfessorResponsavelTable)
    await db.delete(notaAlunoTable)
    // Periodo
    await db.delete(periodoInscricaoTable)
    // Convites
    await db.delete(professorInvitationTable)
    // Perfis (depende de user)
    await db.delete(alunoTable)
    await db.delete(professorTable)
    // Sessions e users
    await db.delete(sessionTable)
    await db.delete(userTable)
    // Base tables
    await db.delete(disciplinaTable)
    await db.delete(enderecoTable)
    await db.delete(departamentoTable)

    // 2. Criar Departamentos
    log.info('🏢 Criando departamentos...')
    const departamentos = await db
      .insert(departamentoTable)
      .values([
        {
          unidadeUniversitaria: 'Instituto de Matemática e Estatística',
          nome: 'Departamento de Ciência da Computação',
          sigla: 'DCC',
          coordenador: 'Prof. Dr. Carlos Silva',
          email: 'dcc@ufba.br',
          telefone: '(71) 3283-6666',
          descricao: 'Departamento responsável pelos cursos de Ciência da Computação',
        },
        {
          unidadeUniversitaria: 'Instituto de Matemática e Estatística',
          nome: 'Departamento de Matemática',
          sigla: 'MAT',
          coordenador: 'Prof. Dr. Ana Santos',
          email: 'mat@ufba.br',
          telefone: '(71) 3283-6667',
          descricao: 'Departamento responsável pelos cursos de Matemática',
        },
        {
          unidadeUniversitaria: 'Instituto de Matemática e Estatística',
          nome: 'Departamento de Estatística',
          sigla: 'EST',
          coordenador: 'Prof. Dr. João Oliveira',
          email: 'est@ufba.br',
          telefone: '(71) 3283-6668',
          descricao: 'Departamento responsável pelos cursos de Estatística',
        },
        {
          unidadeUniversitaria: 'Instituto de Física',
          nome: 'Departamento de Física',
          sigla: 'FIS',
          coordenador: 'Prof. Dr. Maria Costa',
          email: 'fis@ufba.br',
          telefone: '(71) 3283-6669',
          descricao: 'Departamento responsável pelos cursos de Física',
        },
        {
          unidadeUniversitaria: 'Escola Politécnica',
          nome: 'Departamento de Engenharia de Computação',
          sigla: 'COMP',
          coordenador: 'Prof. Dr. Pedro Almeida',
          email: 'comp@ufba.br',
          telefone: '(71) 3283-6670',
          descricao: 'Departamento responsável pelos cursos de Engenharia de Computação',
        },
      ])
      .returning()

    // 3. Criar Disciplinas
    log.info('📚 Criando disciplinas...')
    const disciplinas = await db
      .insert(disciplinaTable)
      .values([
        // Disciplinas de Ciência da Computação
        { nome: 'Introdução à Programação', codigo: 'MATC99', departamentoId: departamentos[0].id },
        { nome: 'Programação Orientada a Objetos', codigo: 'MATC01', departamentoId: departamentos[0].id },
        { nome: 'Estruturas de Dados', codigo: 'MATC02', departamentoId: departamentos[0].id },
        { nome: 'Algoritmos e Programação', codigo: 'MATC03', departamentoId: departamentos[0].id },
        { nome: 'Banco de Dados', codigo: 'MATC04', departamentoId: departamentos[0].id },
        { nome: 'Engenharia de Software', codigo: 'MATC05', departamentoId: departamentos[0].id },
        { nome: 'Redes de Computadores', codigo: 'MATC06', departamentoId: departamentos[0].id },
        { nome: 'Inteligência Artificial', codigo: 'MATC07', departamentoId: departamentos[0].id },
        { nome: 'Sistemas Operacionais', codigo: 'MATC08', departamentoId: departamentos[0].id },
        { nome: 'Computação Gráfica', codigo: 'MATC09', departamentoId: departamentos[0].id },

        // Disciplinas de Matemática
        { nome: 'Cálculo I', codigo: 'MATA37', departamentoId: departamentos[1].id },
        { nome: 'Cálculo II', codigo: 'MATA38', departamentoId: departamentos[1].id },
        { nome: 'Álgebra Linear', codigo: 'MATA07', departamentoId: departamentos[1].id },
        { nome: 'Geometria Analítica', codigo: 'MATA08', departamentoId: departamentos[1].id },
        { nome: 'Matemática Discreta', codigo: 'MATA09', departamentoId: departamentos[1].id },

        // Disciplinas de Estatística
        { nome: 'Estatística Descritiva', codigo: 'MATE01', departamentoId: departamentos[2].id },
        { nome: 'Probabilidade', codigo: 'MATE02', departamentoId: departamentos[2].id },
        { nome: 'Inferência Estatística', codigo: 'MATE03', departamentoId: departamentos[2].id },
        { nome: 'Análise de Regressão', codigo: 'MATE04', departamentoId: departamentos[2].id },

        // Disciplinas de Física
        { nome: 'Física I', codigo: 'FISA01', departamentoId: departamentos[3].id },
        { nome: 'Física II', codigo: 'FISA02', departamentoId: departamentos[3].id },
        { nome: 'Física III', codigo: 'FISA03', departamentoId: departamentos[3].id },
        { nome: 'Mecânica Clássica', codigo: 'FISA04', departamentoId: departamentos[3].id },

        // Disciplinas de Engenharia de Computação
        { nome: 'Circuitos Digitais', codigo: 'COMP01', departamentoId: departamentos[4].id },
        { nome: 'Microprocessadores', codigo: 'COMP02', departamentoId: departamentos[4].id },
        { nome: 'Sistemas Embarcados', codigo: 'COMP03', departamentoId: departamentos[4].id },
        { nome: 'Arquitetura de Computadores', codigo: 'COMP04', departamentoId: departamentos[4].id },
      ])
      .returning()

    // 4. Criar Endereços
    log.info('🏠 Criando endereços...')
    const enderecos = await db
      .insert(enderecoTable)
      .values([
        {
          numero: 123,
          rua: 'Rua das Flores',
          bairro: 'Federação',
          cidade: 'Salvador',
          estado: 'BA',
          cep: '40170-110',
          complemento: 'Apt 101',
        },
        {
          numero: 456,
          rua: 'Av. Sete de Setembro',
          bairro: 'Corredor da Vitória',
          cidade: 'Salvador',
          estado: 'BA',
          cep: '40060-001',
          complemento: 'Casa',
        },
        {
          numero: 789,
          rua: 'Rua João das Botas',
          bairro: 'Canela',
          cidade: 'Salvador',
          estado: 'BA',
          cep: '40110-160',
          complemento: 'Bloco A',
        },
      ])
      .returning()

    // 5. Criar Usuários
    log.info('👤 Criando usuários...')
    const defaultPasswordHash = hashSync('123456', 10)
    const now = new Date()

    const usuarios = await db
      .insert(userTable)
      .values([
        {
          username: 'admin',
          email: 'admin@ufba.br',
          role: 'admin',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
          assinaturaDefault: null,
        },
        {
          username: 'carlos.silva',
          email: 'carlos.silva@ufba.br',
          role: 'professor',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
        {
          username: 'ana.pereira',
          email: 'ana.pereira@ufba.br',
          role: 'professor',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
        {
          username: 'joao.santos',
          email: 'joao.santos@ufba.br',
          role: 'professor',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
        {
          username: 'maria.costa',
          email: 'maria.costa@ufba.br',
          role: 'professor',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
        {
          username: 'aluno1',
          email: 'aluno1@ufba.br',
          role: 'student',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
        {
          username: 'aluno2',
          email: 'aluno2@ufba.br',
          role: 'student',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
        {
          username: 'aluno3',
          email: 'aluno3@ufba.br',
          role: 'student',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
        {
          username: 'aluno4',
          email: 'aluno4@ufba.br',
          role: 'student',
          passwordHash: defaultPasswordHash,
          emailVerifiedAt: now,
        },
      ])
      .returning()

    // 6. Criar Professores
    log.info('👨‍🏫 Criando professores...')
    const professores = await db
      .insert(professorTable)
      .values([
        {
          userId: usuarios[1].id,
          departamentoId: departamentos[0].id,
          nomeCompleto: 'Carlos Silva',
          genero: 'MASCULINO',
          regime: 'DE',
          cpf: '123.456.789-01',
          telefone: '(71) 99999-1234',
          emailInstitucional: 'carlos.silva@ufba.br',
          matriculaSiape: '1234567',
        },
        {
          userId: usuarios[2].id,
          departamentoId: departamentos[0].id,
          nomeCompleto: 'Ana Pereira',
          genero: 'FEMININO',
          regime: 'DE',
          cpf: '123.456.789-02',
          telefone: '(71) 99999-1235',
          emailInstitucional: 'ana.pereira@ufba.br',
          matriculaSiape: '1234568',
        },
        {
          userId: usuarios[3].id,
          departamentoId: departamentos[1].id,
          nomeCompleto: 'João Santos',
          genero: 'MASCULINO',
          regime: 'DE',
          cpf: '123.456.789-03',
          telefone: '(71) 99999-1236',
          emailInstitucional: 'joao.santos@ufba.br',
          matriculaSiape: '1234569',
        },
        {
          userId: usuarios[4].id,
          departamentoId: departamentos[3].id,
          nomeCompleto: 'Maria Costa',
          genero: 'FEMININO',
          regime: 'DE',
          cpf: '123.456.789-04',
          telefone: '(71) 99999-1237',
          emailInstitucional: 'maria.costa@ufba.br',
          matriculaSiape: '1234570',
        },
      ])
      .returning()

    // 7. Criar Alunos
    log.info('👨‍🎓 Criando alunos...')
    const alunos = await db
      .insert(alunoTable)
      .values([
        {
          userId: usuarios[5].id,
          nomeCompleto: 'João da Silva',
          genero: 'MASCULINO',
          emailInstitucional: 'aluno1@ufba.br',
          matricula: '202110001',
          cpf: '123.456.789-05',
          cr: 8.5,
          telefone: '(71) 99999-2001',
          cursoNome: 'Ciência da Computação',
          enderecoId: enderecos[0].id,
          banco: '077 - Banco Inter',
          agencia: '0001',
          conta: '16215539',
          digitoConta: '5',
        },
        {
          userId: usuarios[6].id,
          nomeCompleto: 'Maria Oliveira',
          genero: 'FEMININO',
          emailInstitucional: 'aluno2@ufba.br',
          matricula: '202110002',
          cpf: '123.456.789-06',
          cr: 9.0,
          telefone: '(71) 99999-2002',
          cursoNome: 'Ciência da Computação',
          enderecoId: enderecos[1].id,
          banco: '001 - Banco do Brasil',
          agencia: '1234',
          conta: '987654',
          digitoConta: '3',
        },
        {
          userId: usuarios[7].id,
          nomeCompleto: 'Pedro Santos',
          genero: 'MASCULINO',
          emailInstitucional: 'aluno3@ufba.br',
          matricula: '202110003',
          cpf: '123.456.789-07',
          cr: 7.8,
          telefone: '(71) 99999-2003',
          cursoNome: 'Sistemas de Informação',
          enderecoId: enderecos[2].id,
          banco: '341 - Itaú Unibanco',
          agencia: '0456',
          conta: '12345',
          digitoConta: '8',
        },
        {
          userId: usuarios[8].id,
          nomeCompleto: 'Ana Costa',
          genero: 'FEMININO',
          emailInstitucional: 'aluno4@ufba.br',
          matricula: '202110004',
          cpf: '123.456.789-08',
          cr: 8.2,
          telefone: '(71) 99999-2004',
          cursoNome: 'Matemática',
          enderecoId: enderecos[0].id,
          banco: '104 - Caixa Econômica',
          agencia: '0890',
          conta: '54321',
          digitoConta: '1',
        },
      ])
      .returning()

    // 8. Criar Período de Inscrição
    log.info('📅 Criando período de inscrição...')
    const periodos = await db
      .insert(periodoInscricaoTable)
      .values([
        {
          semestre: 'SEMESTRE_1',
          ano: 2025,
          dataInicio: new Date('2025-01-15'),
          dataFim: new Date('2025-02-15'),
        },
        {
          semestre: 'SEMESTRE_2',
          ano: 2025,
          dataInicio: new Date('2025-07-15'),
          dataFim: new Date('2025-08-15'),
        },
        {
          semestre: 'SEMESTRE_1',
          ano: 2026,
          dataInicio: new Date('2026-01-15'),
          dataFim: new Date('2026-02-15'),
          totalBolsasPrograd: 10,
        },
        {
          semestre: 'SEMESTRE_2',
          ano: 2026,
          dataInicio: new Date('2026-07-15'),
          dataFim: new Date('2026-12-31'),
          totalBolsasPrograd: 10,
        },
      ])
      .returning()

    // 9. Criar Responsabilidades de Disciplina
    log.info('📋 Criando responsabilidades de disciplina...')
    await db.insert(disciplinaProfessorResponsavelTable).values([
      {
        disciplinaId: disciplinas[0].id, // Introdução à Programação
        professorId: professores[0].id, // Carlos Silva
        ano: 2026,
        semestre: 'SEMESTRE_2',
      },
      {
        disciplinaId: disciplinas[1].id, // POO
        professorId: professores[1].id, // Ana Pereira
        ano: 2026,
        semestre: 'SEMESTRE_2',
      },
      {
        disciplinaId: disciplinas[2].id, // Estruturas de Dados
        professorId: professores[0].id, // Carlos Silva
        ano: 2026,
        semestre: 'SEMESTRE_2',
      },
      {
        disciplinaId: disciplinas[10].id, // Cálculo I
        professorId: professores[2].id, // João Santos
        ano: 2026,
        semestre: 'SEMESTRE_2',
      },
      {
        disciplinaId: disciplinas[19].id, // Física I
        professorId: professores[3].id, // Maria Costa
        ano: 2026,
        semestre: 'SEMESTRE_2',
      },
    ])

    // 10. Criar Projetos de Monitoria
    log.info('📋 Criando projetos de monitoria...')
    const projetos = await db
      .insert(projetoTable)
      .values([
        {
          departamentoId: departamentos[0].id,
          ano: 2026,
          semestre: 'SEMESTRE_2',
          tipoProposicao: 'INDIVIDUAL',
          bolsasSolicitadas: 4,
          bolsasDisponibilizadas: 4,
          voluntariosSolicitados: 2,
          cargaHorariaSemana: 12,
          numeroSemanas: 16,
          publicoAlvo: 'Estudantes de Ciência da Computação cursando disciplinas introdutórias',
          estimativaPessoasBenificiadas: 50,
          professorResponsavelId: professores[0].id,
          titulo: 'Monitoria de Introdução à Programação',
          descricao:
            'Projeto de monitoria para auxiliar estudantes na disciplina de Introdução à Programação, focando em conceitos fundamentais de programação e resolução de problemas.',
          status: 'APPROVED',
        },
        {
          departamentoId: departamentos[0].id,
          ano: 2026,
          semestre: 'SEMESTRE_2',
          tipoProposicao: 'INDIVIDUAL',
          bolsasSolicitadas: 3,
          bolsasDisponibilizadas: 3,
          voluntariosSolicitados: 2,
          cargaHorariaSemana: 8,
          numeroSemanas: 16,
          publicoAlvo: 'Estudantes de Ciência da Computação em disciplinas avançadas',
          estimativaPessoasBenificiadas: 30,
          professorResponsavelId: professores[1].id,
          titulo: 'Monitoria de Programação Orientada a Objetos',
          descricao:
            'Projeto de monitoria para apoiar estudantes na compreensão dos conceitos de programação orientada a objetos, incluindo herança, polimorfismo e encapsulamento.',
          status: 'APPROVED',
        },
        {
          departamentoId: departamentos[1].id,
          ano: 2026,
          semestre: 'SEMESTRE_2',
          tipoProposicao: 'INDIVIDUAL',
          bolsasSolicitadas: 2,
          bolsasDisponibilizadas: 2,
          voluntariosSolicitados: 1,
          cargaHorariaSemana: 10,
          numeroSemanas: 16,
          publicoAlvo: 'Estudantes de diversos cursos que cursam Cálculo I',
          estimativaPessoasBenificiadas: 80,
          professorResponsavelId: professores[2].id,
          titulo: 'Monitoria de Cálculo I',
          descricao:
            'Projeto de monitoria para auxiliar estudantes em conceitos fundamentais de cálculo diferencial e integral, com foco em resolução de exercícios e esclarecimento de dúvidas.',
          status: 'APPROVED',
        },
        {
          departamentoId: departamentos[3].id,
          ano: 2026,
          semestre: 'SEMESTRE_2',
          tipoProposicao: 'INDIVIDUAL',
          bolsasSolicitadas: 1,
          voluntariosSolicitados: 2,
          cargaHorariaSemana: 8,
          numeroSemanas: 16,
          publicoAlvo: 'Estudantes de Física e Engenharia',
          estimativaPessoasBenificiadas: 40,
          professorResponsavelId: professores[3].id,
          titulo: 'Monitoria de Física I',
          descricao:
            'Projeto de monitoria para suporte em conceitos de mecânica clássica e resolução de listas de exercícios.',
          status: 'APPROVED',
        },
      ])
      .returning()

    // 11. Associar Disciplinas aos Projetos
    log.info('🔗 Associando disciplinas aos projetos...')
    await db.insert(projetoDisciplinaTable).values([
      {
        projetoId: projetos[0].id,
        disciplinaId: disciplinas[0].id, // Introdução à Programação
      },
      {
        projetoId: projetos[1].id,
        disciplinaId: disciplinas[1].id, // POO
      },
      {
        projetoId: projetos[2].id,
        disciplinaId: disciplinas[10].id, // Cálculo I
      },
      {
        projetoId: projetos[3].id,
        disciplinaId: disciplinas[19].id, // Física I
      },
    ])

    // 12. Criar Edital Interno de teste
    log.info('📜 Criando edital de teste...')
    const [edital] = await db
      .insert(editalTable)
      .values({
        periodoInscricaoId: periodos[3].id, // 2026.2
        tipo: 'DCC',
        numeroEdital: '001/2026',
        titulo: 'Edital Interno de Seleção de Monitores DCC 2026.2',
        descricaoHtml: '<p>Edital interno de seleção para o semestre 2026.2.</p>',
        valorBolsa: '400.00',
        datasProvasDisponiveis: JSON.stringify([
          { data: '2026-09-10', horario: '14:00-16:00' },
          { data: '2026-09-11', horario: '09:00-11:00' },
        ]),
        dataInicioSelecao: new Date('2026-09-01'),
        dataFimSelecao: new Date('2026-09-15'),
        horarioInicioSelecao: '08:00',
        horarioFimSelecao: '18:00',
        dataDivulgacaoResultado: new Date('2026-09-20'),
        criadoPorUserId: usuarios[0].id,
        publicado: false,
      })
      .returning()

    for (const proj of projetos) {
      await db.update(projetoTable).set({ editalInternoId: edital.id }).where(eq(projetoTable.id, proj.id))
    }

    log.info('✅ Seed concluído com sucesso!')
    log.info(`📊 Dados criados:
      - ${departamentos.length} departamentos
      - ${disciplinas.length} disciplinas
      - ${usuarios.length} usuários
      - ${professores.length} professores
      - ${alunos.length} alunos
      - ${periodos.length} períodos de inscrição
      - ${projetos.length} projetos de monitoria
    `)

    log.info('🔑 Credenciais de acesso:')
    log.info('  Admin: admin@ufba.br / 123456')
    log.info('  Professor: carlos.silva@ufba.br / 123456')
    log.info('  Aluno: aluno1@ufba.br / 123456')
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)), '❌ Erro durante o seed:')
    throw error
  }
}

// Executar o seed se chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      log.info('🎉 Seed executado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      log.error('💥 Erro ao executar seed:', error)
      process.exit(1)
    })
}

export { seedDatabase }
