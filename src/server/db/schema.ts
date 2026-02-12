import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

// --- Auth Schema ---

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'professor', // Added professor based on project description
  'student',
  // 'monitor', // Monitor is an implicit role based on 'vaga' association, not a direct user role initially
])

// Admin type - DCC or DCI (only applicable when role is 'admin')
export const adminTypeEnum = pgEnum('admin_type_enum', ['DCC', 'DCI'])

export const userTable = pgTable('user', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(), // UFBA Login
  email: text('email').notNull().unique(), // UFBA Email
  role: userRoleEnum('role').notNull().default('student'), // Default to student
  adminType: adminTypeEnum('admin_type'), // DCC or DCI - only for admins, null for others
  // Assinatura padrão para admins
  assinaturaDefault: text('assinatura_default'), // Base64 data URL da assinatura
  dataAssinaturaDefault: timestamp('data_assinatura_default', {
    withTimezone: true,
    mode: 'date',
  }),
  passwordHash: text('password_hash'),
  emailVerifiedAt: timestamp('email_verified_at', {
    withTimezone: true,
    mode: 'date',
  }),
  verificationToken: text('verification_token'),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at', {
    withTimezone: true,
    mode: 'date',
  }),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at', {
    withTimezone: true,
    mode: 'date',
  }),
})

export const sessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
})

export const userRelations = relations(userTable, ({ many, one }) => ({
  sessions: many(sessionTable),
  professorProfile: one(professorTable, {
    // Link to professor profile if role is professor
    fields: [userTable.id],
    references: [professorTable.userId],
  }),
  studentProfile: one(alunoTable, {
    // Link to student profile if role is student
    fields: [userTable.id],
    references: [alunoTable.userId],
  }),
}))

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}))

// --- Application Domain Schema ---

export const semestreEnum = pgEnum('semestre_enum', ['SEMESTRE_1', 'SEMESTRE_2'])

export const tipoProposicaoEnum = pgEnum('tipo_proposicao_enum', ['INDIVIDUAL', 'COLETIVA'])

export const tipoVagaEnum = pgEnum('tipo_vaga_enum', ['BOLSISTA', 'VOLUNTARIO'])

export const tipoEditalEnum = pgEnum('tipo_edital_enum', ['DCC', 'DCI'])

export const projetoStatusEnum = pgEnum('projeto_status_enum', [
  'DRAFT', // Professor creating the project
  'SUBMITTED', // Professor submitted for admin approval
  'APPROVED', // Admin approved (professor already signed)
  'REJECTED', // Admin rejected
  'PENDING_PROFESSOR_SIGNATURE', // Generated from import, needs professor signature
  'PENDING_REVISION', // Admin requested revision, professor can edit and re-sign
])

export const generoEnum = pgEnum('genero_enum', ['MASCULINO', 'FEMININO', 'OUTRO'])

export const regimeEnum = pgEnum('regime_enum', ['20H', '40H', 'DE'])

// Tipo do professor: substituto ou efetivo
export const tipoProfessorEnum = pgEnum('tipo_professor_enum', ['SUBSTITUTO', 'EFETIVO'])

// Status da conta do professor (para fluxo de convite)
export const professorAccountStatusEnum = pgEnum('professor_account_status_enum', ['PENDING', 'ACTIVE', 'INACTIVE'])

export const tipoInscricaoEnum = pgEnum('tipo_inscricao_enum', [
  'BOLSISTA',
  'VOLUNTARIO',
  'ANY', // Changed from QUALQUER for clarity
])

export const tipoDocumentoProjetoEnum = pgEnum('tipo_documento_projeto_enum', [
  'PROPOSTA_ORIGINAL',
  'PROPOSTA_ASSINADA_PROFESSOR',
  'PROPOSTA_ASSINADA_ADMIN',
  'ATA_SELECAO',
])

export const tipoAssinaturaEnum = pgEnum('tipo_assinatura_enum', [
  'PROJETO_PROFESSOR_RESPONSAVEL',
  'TERMO_COMPROMISSO_ALUNO',
  'EDITAL_ADMIN',
  'ATA_SELECAO_PROFESSOR',
  'PROJETO_COORDENADOR_DEPARTAMENTO',
])

export const statusInscricaoEnum = pgEnum('status_inscricao_enum', [
  'SUBMITTED', // Aluno aplicou
  'SELECTED_BOLSISTA', // Professor selecionou (bolsista)
  'SELECTED_VOLUNTARIO', // Professor selecionou (voluntário)
  'ACCEPTED_BOLSISTA', // Aluno aceitou (bolsista)
  'ACCEPTED_VOLUNTARIO', // Aluno aceitou (voluntário)
  'REJECTED_BY_PROFESSOR', // Professor rejeitou
  'REJECTED_BY_STUDENT', // Aluno recusou
  'WAITING_LIST', // Em lista de espera
  // 'INAPTO', 'APTO' seem less relevant if selection is direct
])

export const relatorioStatusEnum = pgEnum('relatorio_status_enum', ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])

export const departamentoTable = pgTable('departamento', {
  id: serial('id').primaryKey(),
  unidadeUniversitaria: varchar('unidade_universitaria').notNull(),
  nome: varchar('nome').notNull(),
  sigla: varchar('sigla'),
  emailInstituto: text('email_instituto'),
  emailChefeDepartamento: text('email_chefe_departamento'),
  coordenador: varchar('coordenador'),
  email: varchar('email'),
  telefone: varchar('telefone'),
  descricao: text('descricao'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
})

export const projetoTable = pgTable('projeto', {
  id: serial('id').primaryKey(),
  // dataAprovacao: date('data_aprovacao', { mode: 'date' }), // Approval date might be inferred from status change
  departamentoId: integer('departamento_id').references(() => departamentoTable.id),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  tipoProposicao: tipoProposicaoEnum('tipo_proposicao').notNull(),
  bolsasSolicitadas: integer('bolsas_solicitadas').notNull().default(0), // Professor defines
  voluntariosSolicitados: integer('voluntarios_solicitados').notNull().default(0), // Professor defines
  bolsasDisponibilizadas: integer('bolsas_disponibilizadas').default(0), // Admin defines after approval
  // voluntariosAtendidos: integer('voluntarios_atendidos'), // Calculated from accepted 'vaga'
  cargaHorariaSemana: integer('carga_horaria_semana').notNull(),
  numeroSemanas: integer('numero_semanas').notNull(),
  publicoAlvo: text('publico_alvo').notNull(),
  estimativaPessoasBenificiadas: integer('estimativa_pessoas_benificiadas'),
  professorResponsavelId: integer('professor_responsavel_id')
    .references(() => professorTable.id)
    .notNull(),
  titulo: varchar('titulo').notNull(), // Added title
  disciplinaNome: varchar('disciplina_nome'), // Main disciplina name for PROGRAD spreadsheet
  descricao: text('descricao').notNull(), // Objectives/Justification
  professoresParticipantes: text('professores_participantes'), // Names of participating professors for collective projects
  // Campos específicos para edital interno DCC
  editalInternoId: integer('edital_interno_id').references(() => editalTable.id), // Optional reference to internal DCC edital
  dataSelecaoEscolhida: date('data_selecao_escolhida', { mode: 'date' }), // Data escolhida pelo professor dentre as disponíveis
  horarioSelecao: varchar('horario_selecao', { length: 20 }), // Horário da seleção (ex: "14:00-16:00")
  localSelecao: varchar('local_selecao', { length: 255 }), // Local da seleção (ex: "Sala 101, PAF I")
  bibliografia: text('bibliografia'), // Bibliografia para seleção
  pontosProva: text('pontos_prova'), // Pontos/tópicos da prova de seleção
  importacaoPlanejamentoId: integer('importacao_planejamento_id').references(() => importacaoPlanejamentoTable.id, {
    onDelete: 'set null',
  }),
  status: projetoStatusEnum('status').notNull().default('DRAFT'),
  assinaturaProfessor: text('assinatura_professor'), // base64 data URL
  // analiseSubmissao: text('analise_submissao'), // Renamed/Repurposed
  feedbackAdmin: text('feedback_admin'), // Admin feedback on approval/rejection
  mensagemRevisao: text('mensagem_revisao'), // Admin's revision request message
  revisaoSolicitadaEm: timestamp('revisao_solicitada_em', {
    withTimezone: true,
    mode: 'date',
  }), // When revision was requested
  // documentoUniqueId: text('documento_unique_id'), // Link to separate document table
  // assinaturaUniqueId: text('assinatura_unique_id'), // Link to separate signature process/table
  // validado: boolean('validado').notNull().default(false), // Status handles validation
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
})

export const projetoDisciplinaTable = pgTable('projeto_disciplina', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull(),
  disciplinaId: integer('disciplina_id')
    .references(() => disciplinaTable.id)
    .notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  // deletedAt: timestamp('deleted_at', {
  //   withTimezone: true,
  //   mode: 'date',
  // }), // Usually handled by removing the row
})

// --- Tabela de Equivalência de Disciplinas ---
export const equivalenciaDisciplinasTable = pgTable('disc_equiv', {
  id: serial('id').primaryKey(),

  disciplinaOrigemId: integer('disc_origem_id')
    .notNull()
    .references(() => disciplinaTable.id, { onDelete: 'cascade' }),

  disciplinaEquivalenteId: integer('disc_equiv_id')
    .notNull()
    .references(() => disciplinaTable.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
})

export const equivalenciaDisciplinasRelations = relations(equivalenciaDisciplinasTable, ({ one }) => ({
  disciplinaOrigem: one(disciplinaTable, {
    fields: [equivalenciaDisciplinasTable.disciplinaOrigemId],
    references: [disciplinaTable.id],
    relationName: 'equivalenciasOrigem',
  }),
  disciplinaEquivalente: one(disciplinaTable, {
    fields: [equivalenciaDisciplinasTable.disciplinaEquivalenteId],
    references: [disciplinaTable.id],
    relationName: 'equivalenciasEquivalente',
  }),
}))

// Participating professors (excluding the main responsible one)
export const projetoProfessorParticipanteTable = pgTable('projeto_professor_participante', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull(),
  professorId: integer('professor_id')
    .references(() => professorTable.id)
    .notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
})

export const atividadeProjetoTable = pgTable('atividade_projeto', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull(),
  descricao: text('descricao').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  // deletedAt: timestamp('deleted_at', {
  //   withTimezone: true,
  //   mode: 'date',
  // }),
})

export const professorTable = pgTable('professor', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // Link to auth user
  departamentoId: integer('departamento_id').references(() => departamentoTable.id),
  nomeCompleto: varchar('nome_completo').notNull(),
  nomeSocial: varchar('nome_social'),
  matriculaSiape: varchar('matricula_siape'),
  genero: generoEnum('genero'),
  regime: regimeEnum('regime'),
  tipoProfessor: tipoProfessorEnum('tipo_professor').notNull().default('EFETIVO'),
  accountStatus: professorAccountStatusEnum('account_status').notNull().default('ACTIVE'),
  especificacaoGenero: varchar('especificacao_genero'),
  cpf: varchar('cpf'), // Unique?
  telefone: varchar('telefone'),
  telefoneInstitucional: varchar('telefone_institucional'),
  emailInstitucional: varchar('email_institucional'),
  // Document file IDs for professor documents
  curriculumVitaeFileId: text('curriculum_vitae_file_id'),
  comprovanteVinculoFileId: text('comprovante_vinculo_file_id'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  // deletedAt handled by user deletion cascade?
})

export const disciplinaTable = pgTable(
  'disciplina',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome').notNull(),
    codigo: varchar('codigo').notNull(),
    departamentoId: integer('departamento_id')
      .references(() => departamentoTable.id)
      .notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => {
    return {
      codigoUnicoPorDepartamento: uniqueIndex('codigo_departamento_idx').on(table.codigo, table.departamentoId),
    }
  }
)

export const alunoTable = pgTable('aluno', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // Link to auth user
  nomeCompleto: varchar('nome_completo').notNull(),
  nomeSocial: varchar('nome_social'),
  genero: generoEnum('genero'),
  especificacaoGenero: varchar('especificacao_genero'),
  emailInstitucional: varchar('email_institucional'),
  matricula: varchar('matricula').unique(), // Make unique
  rg: varchar('rg'), // Nullable?
  cpf: varchar('cpf').unique(), // Make unique
  cr: real('CR'),
  telefone: varchar('telefone'),
  // Dados Bancários para Bolsistas
  banco: varchar('banco', { length: 100 }),
  agencia: varchar('agencia', { length: 20 }),
  conta: varchar('conta', { length: 30 }),
  digitoConta: varchar('digito_conta', { length: 2 }),
  enderecoId: integer('endereco_id').references(() => enderecoTable.id), // Nullable
  cursoNome: varchar('curso_nome', { length: 255 }), // Nome do curso por extenso
  // Document file IDs for student documents
  historicoEscolarFileId: text('historico_escolar_file_id'),
  comprovanteMatriculaFileId: text('comprovante_matricula_file_id'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  // deletedAt handled by user deletion cascade?
})

export const enderecoTable = pgTable('endereco', {
  id: serial('id').primaryKey(),
  numero: integer('numero'),
  rua: varchar('rua').notNull(),
  bairro: varchar('bairro').notNull(),
  cidade: varchar('cidade').notNull(),
  estado: varchar('estado').notNull(),
  cep: varchar('cep').notNull(),
  complemento: varchar('complemento'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  // deletedAt: timestamp('deleted_at', {
  //   withTimezone: true,
  //   mode: 'date',
  // }), // Usually not soft deleted
})

export const notaAlunoTable = pgTable('nota_aluno', {
  id: serial('id').primaryKey(),
  alunoId: integer('aluno_id')
    .references(() => alunoTable.id, { onDelete: 'cascade' })
    .notNull(),
  disciplinaId: integer('disciplina_id')
    .references(() => disciplinaTable.id)
    .notNull(), // Reference disciplina table
  nota: real('nota').notNull(),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  // deletedAt: timestamp('deleted_at', {
  //   withTimezone: true,
  //   mode: 'date',
  // }),
})

// Represents the period when students can apply for projects in a given semester
export const periodoInscricaoTable = pgTable('periodo_inscricao', {
  id: serial('id').primaryKey(),
  semestre: semestreEnum('semestre').notNull(),
  ano: integer('ano').notNull(),
  // editalUniqueId: text('edital_unique_id'), // Link to document table
  dataInicio: date('data_inicio', { mode: 'date' }).notNull(),
  dataFim: date('data_fim', { mode: 'date' }).notNull(),
  totalBolsasPrograd: integer('total_bolsas_prograd').default(0), // Total de bolsas disponibilizadas pela PROGRAD
  numeroEditalPrograd: varchar('numero_edital_prograd', { length: 100 }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  // Unique constraint for year/semester?
})

// Represents a student's application to a specific project during an application period
export const inscricaoTable = pgTable('inscricao', {
  id: serial('id').primaryKey(),
  // processoSeletivoId: integer('processo_seletivo_id').references(() => processoSeletivoTable.id).notNull(), // Replaced by periodoInscricaoId + projetoId?
  periodoInscricaoId: integer('periodo_inscricao_id')
    .references(() => periodoInscricaoTable.id)
    .notNull(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id)
    .notNull(),
  alunoId: integer('aluno_id')
    .references(() => alunoTable.id, { onDelete: 'cascade' })
    .notNull(),
  tipoVagaPretendida: tipoInscricaoEnum('tipo_vaga_pretendida'), // What the student wants
  status: statusInscricaoEnum('status').notNull().default('SUBMITTED'),
  notaDisciplina: decimal('nota_disciplina', { precision: 4, scale: 2 }),
  notaSelecao: decimal('nota_selecao', { precision: 4, scale: 2 }),
  coeficienteRendimento: decimal('cr', { precision: 4, scale: 2 }),
  notaFinal: decimal('nota_final', { precision: 4, scale: 2 }),
  feedbackProfessor: text('feedback_professor'), // Reason for selection/rejection
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  // deletedAt: timestamp('deleted_at', {
  //   withTimezone: true,
  //   mode: 'date',
  // }),
  // Unique constraint: (periodoInscricaoId, projetoId, alunoId)
})

// Join table for documents related to an application (e.g., transcript)
export const inscricaoDocumentoTable = pgTable('inscricao_documento', {
  id: serial('id').primaryKey(),
  inscricaoId: integer('inscricao_id')
    .references(() => inscricaoTable.id, { onDelete: 'cascade' })
    .notNull(),
  fileId: text('file_id').notNull(), // Unique identifier for the uploaded document in the object storage
  tipoDocumento: text('tipo_documento').notNull(), // e.g., 'HISTORICO_ESCOLAR'
  // validado: boolean('validado'), // Potentially handled by admin/professor review
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
})

// Join table for documents related to a project (e.g., proposal, signed documents)
export const projetoDocumentoTable = pgTable('projeto_documento', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull(),
  fileId: text('file_id').notNull(), // Unique identifier for the uploaded document in the object storage
  tipoDocumento: tipoDocumentoProjetoEnum('tipo_documento').notNull(),
  assinadoPorUserId: integer('assinado_por_user_id').references(() => userTable.id), // Who signed this document (professor or admin)
  observacoes: text('observacoes'), // Optional notes about the document
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
})

// Represents an accepted position (monitor role fulfillment)
export const vagaTable = pgTable('vaga', {
  id: serial('id').primaryKey(),
  alunoId: integer('aluno_id')
    .references(() => alunoTable.id)
    .notNull(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id)
    .notNull(),
  inscricaoId: integer('inscricao_id')
    .references(() => inscricaoTable.id)
    .notNull()
    .unique(), // Link back to the accepted inscription
  tipo: tipoVagaEnum('tipo').notNull(), // Bolsista or Voluntario
  dataInicio: date('data_inicio', { mode: 'date' }),
  dataFim: date('data_fim', { mode: 'date' }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  // Unique constraint: (alunoId, projetoId, tipo) for a given period?
})

// --- Relations ---

export const departamentoRelations = relations(departamentoTable, ({ many }) => ({
  projetos: many(projetoTable),
  professores: many(professorTable),
  disciplinas: many(disciplinaTable),
}))

export const projetoRelations = relations(projetoTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [projetoTable.departamentoId],
    references: [departamentoTable.id],
  }),
  professorResponsavel: one(professorTable, {
    fields: [projetoTable.professorResponsavelId],
    references: [professorTable.id],
  }),
  editalInterno: one(editalTable, {
    fields: [projetoTable.editalInternoId],
    references: [editalTable.id],
  }),
  importacaoPlanejamento: one(importacaoPlanejamentoTable, {
    fields: [projetoTable.importacaoPlanejamentoId],
    references: [importacaoPlanejamentoTable.id],
  }),
  disciplinas: many(projetoDisciplinaTable),
  professoresParticipantes: many(projetoProfessorParticipanteTable),
  atividades: many(atividadeProjetoTable),
  inscricoes: many(inscricaoTable),
  vagas: many(vagaTable),
  documentos: many(projetoDocumentoTable),
  relatorioFinal: one(relatorioFinalDisciplinaTable),
}))

export const projetoDisciplinaRelations = relations(projetoDisciplinaTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [projetoDisciplinaTable.projetoId],
    references: [projetoTable.id],
  }),
  disciplina: one(disciplinaTable, {
    fields: [projetoDisciplinaTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
}))

export const projetoProfessorParticipanteRelations = relations(projetoProfessorParticipanteTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [projetoProfessorParticipanteTable.projetoId],
    references: [projetoTable.id],
  }),
  professor: one(professorTable, {
    fields: [projetoProfessorParticipanteTable.professorId],
    references: [professorTable.id],
  }),
}))

export const atividadeProjetoRelations = relations(atividadeProjetoTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [atividadeProjetoTable.projetoId],
    references: [projetoTable.id],
  }),
}))

export const professorRelations = relations(professorTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [professorTable.departamentoId],
    references: [departamentoTable.id],
  }),
  user: one(userTable, {
    fields: [professorTable.userId],
    references: [userTable.id],
  }),
  projetosResponsavel: many(projetoTable, {
    relationName: 'projetosResponsavel',
  }),
  projetosParticipante: many(projetoProfessorParticipanteTable),
  disciplinasResponsavel: many(disciplinaProfessorResponsavelTable),
}))

export const disciplinaRelations = relations(disciplinaTable, ({ many, one }) => ({
  projetoDisciplinas: many(projetoDisciplinaTable),
  departamento: one(departamentoTable, {
    fields: [disciplinaTable.departamentoId],
    references: [departamentoTable.id],
  }),
  notasAlunos: many(notaAlunoTable),
  professoresResponsaveis: many(disciplinaProfessorResponsavelTable),
  equivalenciasOrigem: many(equivalenciaDisciplinasTable, {
    relationName: 'equivalenciasOrigem',
  }),
  equivalenciasEquivalente: many(equivalenciaDisciplinasTable, {
    relationName: 'equivalenciasEquivalente',
  }),
}))

export const alunoRelations = relations(alunoTable, ({ one, many }) => ({
  endereco: one(enderecoTable, {
    fields: [alunoTable.enderecoId],
    references: [enderecoTable.id],
  }),
  user: one(userTable, {
    fields: [alunoTable.userId],
    references: [userTable.id],
  }),
  inscricoes: many(inscricaoTable),
  notas: many(notaAlunoTable),
  vagas: many(vagaTable),
}))

export const notaAlunoRelations = relations(notaAlunoTable, ({ one }) => ({
  aluno: one(alunoTable, {
    fields: [notaAlunoTable.alunoId],
    references: [alunoTable.id],
  }),
  disciplina: one(disciplinaTable, {
    fields: [notaAlunoTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
}))

export const periodoInscricaoRelations = relations(periodoInscricaoTable, ({ many, one }) => ({
  inscricoes: many(inscricaoTable),
  edital: one(editalTable, {
    fields: [periodoInscricaoTable.id],
    references: [editalTable.periodoInscricaoId],
  }),
}))

export const inscricaoRelations = relations(inscricaoTable, ({ one, many }) => ({
  periodoInscricao: one(periodoInscricaoTable, {
    fields: [inscricaoTable.periodoInscricaoId],
    references: [periodoInscricaoTable.id],
  }),
  projeto: one(projetoTable, {
    fields: [inscricaoTable.projetoId],
    references: [projetoTable.id],
  }),
  aluno: one(alunoTable, {
    fields: [inscricaoTable.alunoId],
    references: [alunoTable.id],
  }),
  documentos: many(inscricaoDocumentoTable),
  vaga: one(vagaTable, {
    // Link to the resulting Vaga if accepted
    fields: [inscricaoTable.id],
    references: [vagaTable.inscricaoId],
  }),
  relatorioFinal: one(relatorioFinalMonitorTable),
}))

export const inscricaoDocumentoRelations = relations(inscricaoDocumentoTable, ({ one }) => ({
  inscricao: one(inscricaoTable, {
    fields: [inscricaoDocumentoTable.inscricaoId],
    references: [inscricaoTable.id],
  }),
}))

export const projetoDocumentoRelations = relations(projetoDocumentoTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [projetoDocumentoTable.projetoId],
    references: [projetoTable.id],
  }),
  assinadoPor: one(userTable, {
    fields: [projetoDocumentoTable.assinadoPorUserId],
    references: [userTable.id],
  }),
}))

export const vagaRelations = relations(vagaTable, ({ one }) => ({
  aluno: one(alunoTable, {
    fields: [vagaTable.alunoId],
    references: [alunoTable.id],
  }),
  projeto: one(projetoTable, {
    fields: [vagaTable.projetoId],
    references: [projetoTable.id],
  }),
  inscricao: one(inscricaoTable, {
    fields: [vagaTable.inscricaoId],
    references: [inscricaoTable.id],
  }),
}))

export const disciplinaProfessorResponsavelTable = pgTable('disciplina_professor_responsavel', {
  id: serial('id').primaryKey(),
  disciplinaId: integer('disciplina_id')
    .references(() => disciplinaTable.id)
    .notNull(),
  professorId: integer('professor_id')
    .references(() => professorTable.id)
    .notNull(),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
})

export const disciplinaProfessorResponsavelRelations = relations(disciplinaProfessorResponsavelTable, ({ one }) => ({
  disciplina: one(disciplinaTable, {
    fields: [disciplinaProfessorResponsavelTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
  professor: one(professorTable, {
    fields: [disciplinaProfessorResponsavelTable.professorId],
    references: [professorTable.id],
  }),
}))

// Tabela para histórico de importações de planejamento
export const importacaoPlanejamentoTable = pgTable('importacao_planejamento', {
  id: serial('id').primaryKey(),
  fileId: text('file_id').notNull(), // ID do arquivo no MinIO
  nomeArquivo: varchar('nome_arquivo').notNull(),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  totalProjetos: integer('total_projetos').notNull().default(0),
  projetosCriados: integer('projetos_criados').notNull().default(0),
  projetosComErro: integer('projetos_com_erro').notNull().default(0),
  status: varchar('status').notNull().default('PROCESSANDO'), // PROCESSANDO, CONCLUIDO, ERRO
  erros: text('erros'), // JSON com detalhes dos erros
  professoresNotificadosEm: timestamp('professores_notificados_em', {
    withTimezone: true,
    mode: 'date',
  }), // Quando os professores foram notificados (null = ainda não notificados)
  importadoPorUserId: integer('importado_por_user_id')
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
})

export const importacaoPlanejamentoRelations = relations(importacaoPlanejamentoTable, ({ one, many }) => ({
  importadoPor: one(userTable, {
    fields: [importacaoPlanejamentoTable.importadoPorUserId],
    references: [userTable.id],
  }),
  projetos: many(projetoTable),
}))

export const statusEnvioEnum = pgEnum('status_envio_enum', ['ENVIADO', 'FALHOU'])

export const notificacaoHistoricoTable = pgTable('notificacao_historico', {
  id: serial('id').primaryKey(),
  destinatarioEmail: text('destinatario_email').notNull(),
  assunto: varchar('assunto', { length: 255 }).notNull(),
  tipoNotificacao: varchar('tipo_notificacao', { length: 100 }).notNull(),
  statusEnvio: statusEnvioEnum('status_envio').notNull(),
  dataEnvio: timestamp('data_envio', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  mensagemErro: text('mensagem_erro'),
  projetoId: integer('projeto_id').references(() => projetoTable.id),
  alunoId: integer('aluno_id').references(() => alunoTable.id),
  remetenteUserId: integer('remetente_user_id').references(() => userTable.id),
})

export const notificacaoHistoricoRelations = relations(notificacaoHistoricoTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [notificacaoHistoricoTable.projetoId],
    references: [projetoTable.id],
  }),
  aluno: one(alunoTable, {
    fields: [notificacaoHistoricoTable.alunoId],
    references: [alunoTable.id],
  }),
  remetente: one(userTable, {
    fields: [notificacaoHistoricoTable.remetenteUserId],
    references: [userTable.id],
  }),
}))

// Tabela para Editais
export const editalTable = pgTable('edital', {
  id: serial('id').primaryKey(),
  periodoInscricaoId: integer('periodo_inscricao_id')
    .references(() => periodoInscricaoTable.id)
    .notNull()
    .unique(),
  tipo: tipoEditalEnum('tipo').notNull().default('DCC'), // Tipo do edital: DCC ou DCI
  numeroEdital: varchar('numero_edital', { length: 50 }).notNull().unique(),
  titulo: varchar('titulo', { length: 255 }).notNull().default('Edital Interno de Seleção de Monitores'),
  descricaoHtml: text('descricao_html'),
  fileIdAssinado: text('file_id_assinado'), // PDF do edital assinado
  fileIdPdfExterno: text('file_id_pdf_externo'), // PDF externo (ex: PROGRAD gera externamente e faz upload)
  dataPublicacao: date('data_publicacao', { mode: 'date' }),
  publicado: boolean('publicado').default(false).notNull(),
  valorBolsa: numeric('valor_bolsa', { precision: 10, scale: 2 }).default('400.00').notNull(), // Valor da bolsa para este edital
  // Datas de inscrição (já existem no periodoInscricao, mas referenciadas aqui para clareza)
  // Datas de seleção (prova)
  dataInicioSelecao: date('data_inicio_selecao', { mode: 'date' }), // Data início da seleção/prova
  dataFimSelecao: date('data_fim_selecao', { mode: 'date' }), // Data fim da seleção/prova
  datasProvasDisponiveis: text('datas_provas_disponiveis'), // JSON array de datas disponíveis para provas
  dataDivulgacaoResultado: date('data_divulgacao_resultado', { mode: 'date' }), // Data limite para divulgação dos resultados
  // Link para formulário de inscrição
  linkFormularioInscricao: text('link_formulario_inscricao'), // URL do formulário de inscrição
  // Campos específicos para edital interno
  pontosProva: text('pontos_prova'), // Pontos/tópicos específicos da prova para este edital
  bibliografia: text('bibliografia'), // Bibliografia específica para este edital
  // Campos de assinatura do chefe do departamento
  chefeAssinouEm: timestamp('chefe_assinou_em', { withTimezone: true, mode: 'date' }), // Data/hora da assinatura do chefe
  chefeAssinatura: text('chefe_assinatura'), // Assinatura digital do chefe (base64 ou URL)
  chefeDepartamentoId: integer('chefe_departamento_id').references(() => userTable.id), // ID do usuário que assinou como chefe
  criadoPorUserId: integer('criado_por_user_id')
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
})

export const editalRelations = relations(editalTable, ({ one, many }) => ({
  periodoInscricao: one(periodoInscricaoTable, {
    fields: [editalTable.periodoInscricaoId],
    references: [periodoInscricaoTable.id],
  }),
  criadoPor: one(userTable, {
    fields: [editalTable.criadoPorUserId],
    references: [userTable.id],
  }),
  projetos: many(projetoTable), // Projetos vinculados a este edital interno
  chefeDepartamento: one(userTable, {
    fields: [editalTable.chefeDepartamentoId],
    references: [userTable.id],
  }),
}))

// Enum para status de convite de professor
export const professorInvitationStatusEnum = pgEnum('professor_invitation_status_enum', [
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
])

// Tabela para armazenar convites para professores
export const professorInvitationTable = pgTable('professor_invitation', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(), // Email do professor convidado
  token: varchar('token', { length: 255 }).notNull().unique(), // Token único para o link do convite
  status: professorInvitationStatusEnum('status').notNull().default('PENDING'),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  invitedByUserId: integer('invited_by_user_id') // Admin que enviou o convite
    .references(() => userTable.id)
    .notNull(),
  acceptedByUserId: integer('accepted_by_user_id').references(
    // Usuário que aceitou (após criação/login)
    () => userTable.id
  ),
  // Campos para pré-criação do professor (preenchidos no convite)
  nomeCompleto: varchar('nome_completo', { length: 255 }),
  departamentoId: integer('departamento_id').references(() => departamentoTable.id),
  regime: regimeEnum('regime'),
  tipoProfessor: tipoProfessorEnum('tipo_professor').default('EFETIVO'),
  professorId: integer('professor_id').references(() => professorTable.id), // Professor criado ao enviar convite
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
})

export const professorInvitationRelations = relations(professorInvitationTable, ({ one }) => ({
  invitedByUser: one(userTable, {
    fields: [professorInvitationTable.invitedByUserId],
    references: [userTable.id],
    relationName: 'invitedByUser',
  }),
  acceptedByUser: one(userTable, {
    fields: [professorInvitationTable.acceptedByUserId],
    references: [userTable.id],
    relationName: 'acceptedByUser',
  }),
  departamento: one(departamentoTable, {
    fields: [professorInvitationTable.departamentoId],
    references: [departamentoTable.id],
  }),
  professor: one(professorTable, {
    fields: [professorInvitationTable.professorId],
    references: [professorTable.id],
  }),
}))

// Tabela para armazenar dados de assinaturas digitais
export const assinaturaDocumentoTable = pgTable('assinatura_documento', {
  id: serial('id').primaryKey(),
  assinaturaData: text('assinatura_data').notNull(), // Base64 data URL da imagem da assinatura
  tipoAssinatura: tipoAssinaturaEnum('tipo_assinatura').notNull(),
  userId: integer('user_id')
    .references(() => userTable.id)
    .notNull(), // Quem assinou
  projetoId: integer('projeto_id').references(() => projetoTable.id), // Se assinatura de um projeto
  vagaId: integer('vaga_id').references(() => vagaTable.id), // Se assinatura de um termo (vinculado à vaga)
  editalId: integer('edital_id').references(() => editalTable.id), // Se assinatura de um edital
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
})

export const assinaturaDocumentoRelations = relations(assinaturaDocumentoTable, ({ one }) => ({
  user: one(userTable, {
    fields: [assinaturaDocumentoTable.userId],
    references: [userTable.id],
  }),
  projeto: one(projetoTable, {
    fields: [assinaturaDocumentoTable.projetoId],
    references: [projetoTable.id],
  }),
  vaga: one(vagaTable, {
    fields: [assinaturaDocumentoTable.vagaId],
    references: [vagaTable.id],
  }),
  edital: one(editalTable, {
    fields: [assinaturaDocumentoTable.editalId],
    references: [editalTable.id],
  }),
}))

// Tabela para templates de projeto, para pré-preenchimento na importação
export const projetoTemplateTable = pgTable('projeto_template', {
  id: serial('id').primaryKey(),
  disciplinaId: integer('disciplina_id')
    .references(() => disciplinaTable.id)
    .notNull()
    .unique(), // Cada disciplina pode ter um template
  tituloDefault: varchar('titulo_default', { length: 255 }),
  descricaoDefault: text('descricao_default'), // Objetivos/Justificativa padrão
  cargaHorariaSemanaDefault: integer('carga_horaria_semana_default'),
  numeroSemanasDefault: integer('numero_semanas_default'),
  publicoAlvoDefault: text('publico_alvo_default'),
  atividadesDefault: text('atividades_default'), // e.g., JSON array de strings ou ;-separadas
  // Campos específicos para edital interno DCC
  pontosProvaDefault: text('pontos_prova_default'), // Pontos da prova padrão para a disciplina
  bibliografiaDefault: text('bibliografia_default'), // Bibliografia padrão para a disciplina
  criadoPorUserId: integer('criado_por_user_id')
    .references(() => userTable.id)
    .notNull(),
  ultimaAtualizacaoUserId: integer('ultima_atualizacao_user_id').references(() => userTable.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
})

export const projetoTemplateRelations = relations(projetoTemplateTable, ({ one }) => ({
  disciplina: one(disciplinaTable, {
    fields: [projetoTemplateTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
  criadoPor: one(userTable, {
    fields: [projetoTemplateTable.criadoPorUserId],
    references: [userTable.id],
    relationName: 'templateCriadoPor',
  }),
  ultimaAtualizacaoPor: one(userTable, {
    fields: [projetoTemplateTable.ultimaAtualizacaoUserId],
    references: [userTable.id],
    relationName: 'templateAtualizadoPor',
  }),
}))

export const ataSelecaoTable = pgTable('ata_selecao', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // Cada projeto tem uma ata de seleção
  fileId: text('file_id'), // ID do PDF da ata no MinIO
  conteudoHtml: text('conteudo_html'), // Conteúdo da ata para renderização
  dataGeracao: timestamp('data_geracao', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  geradoPorUserId: integer('gerado_por_user_id')
    .references(() => userTable.id)
    .notNull(),
  assinado: boolean('assinado').default(false).notNull(),
  dataAssinatura: timestamp('data_assinatura', { withTimezone: true, mode: 'date' }),
})

export const ataSelecaoRelations = relations(ataSelecaoTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [ataSelecaoTable.projetoId],
    references: [projetoTable.id],
  }),
  geradoPor: one(userTable, {
    fields: [ataSelecaoTable.geradoPorUserId],
    references: [userTable.id],
  }),
}))

// --- Relatórios Finais ---

export const relatorioFinalDisciplinaTable = pgTable('relatorio_final_disciplina', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  conteudo: text('conteudo').notNull(), // JSON stringified
  status: relatorioStatusEnum('status').notNull().default('DRAFT'),
  professorAssinouEm: timestamp('professor_assinou_em', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
})

export const relatorioFinalDisciplinaRelations = relations(relatorioFinalDisciplinaTable, ({ one, many }) => ({
  projeto: one(projetoTable, {
    fields: [relatorioFinalDisciplinaTable.projetoId],
    references: [projetoTable.id],
  }),
  relatoriosMonitores: many(relatorioFinalMonitorTable),
}))

export const relatorioFinalMonitorTable = pgTable(
  'relatorio_final_monitor',
  {
    id: serial('id').primaryKey(),
    inscricaoId: integer('inscricao_id')
      .references(() => inscricaoTable.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    relatorioDisciplinaId: integer('relatorio_disciplina_id')
      .references(() => relatorioFinalDisciplinaTable.id, { onDelete: 'cascade' })
      .notNull(),
    conteudo: text('conteudo').notNull(), // JSON stringified
    status: relatorioStatusEnum('status').notNull().default('DRAFT'),
    alunoAssinouEm: timestamp('aluno_assinou_em', { withTimezone: true, mode: 'date' }),
    professorAssinouEm: timestamp('professor_assinou_em', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => [
    // Composite index for pending student signatures query
    index('relatorio_monitor_pending_signature_idx').on(table.status, table.alunoAssinouEm, table.inscricaoId),
  ]
)

export const relatorioFinalMonitorRelations = relations(relatorioFinalMonitorTable, ({ one }) => ({
  inscricao: one(inscricaoTable, {
    fields: [relatorioFinalMonitorTable.inscricaoId],
    references: [inscricaoTable.id],
  }),
  relatorioDisciplina: one(relatorioFinalDisciplinaTable, {
    fields: [relatorioFinalMonitorTable.relatorioDisciplinaId],
    references: [relatorioFinalDisciplinaTable.id],
  }),
}))

export const relatorioTemplateTable = pgTable('relatorio_template', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  conteudo: text('conteudo').notNull(), // JSON stringified
  criadoPorUserId: integer('criado_por_user_id')
    .references(() => userTable.id)
    .notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
})

export const relatorioTemplateRelations = relations(relatorioTemplateTable, ({ one }) => ({
  criadoPor: one(userTable, {
    fields: [relatorioTemplateTable.criadoPorUserId],
    references: [userTable.id],
  }),
}))

// Tabela para API Keys (autenticação alternativa para endpoints OpenAPI)
export const apiKeyTable = pgTable('api_key', {
  id: serial('id').primaryKey(),
  keyValue: varchar('key_value', { length: 64 }).notNull().unique(), // SHA256 hash da API key
  name: varchar('name', { length: 255 }).notNull(), // Nome descritivo da chave
  description: text('description'), // Descrição do uso pretendido
  userId: integer('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull(), // Usuário proprietário da chave
  isActive: boolean('is_active').default(true).notNull(), // Se a chave está ativa
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }), // Data de expiração (opcional)
  lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }), // Último uso
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
})

export const apiKeyRelations = relations(apiKeyTable, ({ one }) => ({
  user: one(userTable, {
    fields: [apiKeyTable.userId],
    references: [userTable.id],
  }),
}))

// --- Audit Log ---

export const auditActionEnum = pgEnum('audit_action_enum', [
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'SUBMIT',
  'SIGN',
  'LOGIN',
  'LOGOUT',
  'SEND_NOTIFICATION',
  'PUBLISH',
  'SELECT',
  'ACCEPT',
])

export const auditEntityEnum = pgEnum('audit_entity_enum', [
  'PROJETO',
  'INSCRICAO',
  'EDITAL',
  'RELATORIO',
  'VAGA',
  'USER',
  'PROFESSOR',
  'ALUNO',
  'NOTIFICATION',
])

export const auditLogTable = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => userTable.id),
    action: auditActionEnum('action').notNull(),
    entityType: auditEntityEnum('entity_type').notNull(),
    entityId: integer('entity_id'),
    details: text('details'), // JSON stringified
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_log_user_idx').on(table.userId),
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_timestamp_idx').on(table.timestamp),
  ]
)

export const auditLogRelations = relations(auditLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [auditLogTable.userId],
    references: [userTable.id],
  }),
}))

// --- Token para Assinatura de Edital pelo Chefe ---

export const editalSignatureTokenStatusEnum = pgEnum('edital_signature_token_status_enum', [
  'PENDING',
  'USED',
  'EXPIRED',
])

export const editalSignatureTokenTable = pgTable('edital_signature_token', {
  id: serial('id').primaryKey(),
  editalId: integer('edital_id')
    .references(() => editalTable.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  chefeEmail: varchar('chefe_email', { length: 255 }).notNull(),
  chefeNome: varchar('chefe_nome', { length: 255 }),
  status: editalSignatureTokenStatusEnum('status').notNull().default('PENDING'),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  requestedByUserId: integer('requested_by_user_id')
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
})

export const editalSignatureTokenRelations = relations(editalSignatureTokenTable, ({ one }) => ({
  edital: one(editalTable, {
    fields: [editalSignatureTokenTable.editalId],
    references: [editalTable.id],
  }),
  requestedBy: one(userTable, {
    fields: [editalSignatureTokenTable.requestedByUserId],
    references: [userTable.id],
  }),
}))

// --- Token para Acesso Público a PDFs de Projeto ---

export const publicPdfTokenTable = pgTable('public_pdf_token', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true, mode: 'date' }),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  createdByUserId: integer('created_by_user_id')
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
})

export const publicPdfTokenRelations = relations(publicPdfTokenTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [publicPdfTokenTable.projetoId],
    references: [projetoTable.id],
  }),
  createdBy: one(userTable, {
    fields: [publicPdfTokenTable.createdByUserId],
    references: [userTable.id],
  }),
}))

// --- Reminder Execution Log (para rastrear envios proativos) ---

export const reminderExecutionLogTable = pgTable(
  'reminder_execution_log',
  {
    id: serial('id').primaryKey(),
    reminderType: varchar('reminder_type', { length: 100 }).notNull(),
    executedAt: timestamp('executed_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    executedByUserId: integer('executed_by_user_id').references(() => userTable.id),
    isProactive: boolean('is_proactive').notNull().default(false),
    notificationsSent: integer('notifications_sent').notNull().default(0),
    details: text('details'), // JSON with additional info
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [index('idx_reminder_execution_type_date').on(table.reminderType, table.executedAt)]
)

export const reminderExecutionLogRelations = relations(reminderExecutionLogTable, ({ one }) => ({
  executedBy: one(userTable, {
    fields: [reminderExecutionLogTable.executedByUserId],
    references: [userTable.id],
  }),
}))

// --- System Configuration ---

export const configuracaoSistemaTable = pgTable('configuracao_sistema', {
  id: serial('id').primaryKey(),
  chave: varchar('chave', { length: 100 }).notNull().unique(),
  valor: text('valor'),
  descricao: text('descricao'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
})

// Export all table and relation types for use across the app
export type User = typeof userTable.$inferSelect
export type NewUser = typeof userTable.$inferInsert
export type Professor = typeof professorTable.$inferSelect
export type NewProfessor = typeof professorTable.$inferInsert
export type Aluno = typeof alunoTable.$inferSelect
export type NewAluno = typeof alunoTable.$inferInsert
export type Projeto = typeof projetoTable.$inferSelect
export type NewProjeto = typeof projetoTable.$inferInsert
export type Departamento = typeof departamentoTable.$inferSelect
export type NewDepartamento = typeof departamentoTable.$inferInsert
export type Disciplina = typeof disciplinaTable.$inferSelect
export type NewDisciplina = typeof disciplinaTable.$inferInsert
export type PeriodoInscricao = typeof periodoInscricaoTable.$inferSelect
export type NewPeriodoInscricao = typeof periodoInscricaoTable.$inferInsert
export type Inscricao = typeof inscricaoTable.$inferSelect
export type NewInscricao = typeof inscricaoTable.$inferInsert
export type Vaga = typeof vagaTable.$inferSelect
export type NewVaga = typeof vagaTable.$inferInsert
export type Edital = typeof editalTable.$inferSelect
export type NewEdital = typeof editalTable.$inferInsert
export type ApiKey = typeof apiKeyTable.$inferSelect
export type NewApiKey = typeof apiKeyTable.$inferInsert
export type ProfessorInvitation = typeof professorInvitationTable.$inferSelect
export type NewProfessorInvitation = typeof professorInvitationTable.$inferInsert
export type RelatorioFinalDisciplina = typeof relatorioFinalDisciplinaTable.$inferSelect
export type NewRelatorioFinalDisciplina = typeof relatorioFinalDisciplinaTable.$inferInsert
export type RelatorioFinalMonitor = typeof relatorioFinalMonitorTable.$inferSelect
export type NewRelatorioFinalMonitor = typeof relatorioFinalMonitorTable.$inferInsert
export type RelatorioTemplate = typeof relatorioTemplateTable.$inferSelect
export type NewRelatorioTemplate = typeof relatorioTemplateTable.$inferInsert
export type AuditLog = typeof auditLogTable.$inferSelect
export type NewAuditLog = typeof auditLogTable.$inferInsert
export type EditalSignatureToken = typeof editalSignatureTokenTable.$inferSelect
export type NewEditalSignatureToken = typeof editalSignatureTokenTable.$inferInsert
export type ReminderExecutionLog = typeof reminderExecutionLogTable.$inferSelect
export type NewReminderExecutionLog = typeof reminderExecutionLogTable.$inferInsert
export type ConfiguracaoSistema = typeof configuracaoSistemaTable.$inferSelect
export type NewConfiguracaoSistema = typeof configuracaoSistemaTable.$inferInsert
