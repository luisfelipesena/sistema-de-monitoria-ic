import { relations } from 'drizzle-orm';
import {
  date,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// --- Auth Schema --- TODO: Review if all user fields are needed directly in lucia attributes

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'professor', // Added professor based on project description
  'student',
  // 'monitor', // Monitor is an implicit role based on 'vaga' association, not a direct user role initially
]);

export const userTable = pgTable('user', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(), // UFBA Login
  email: text('email').notNull().unique(), // UFBA Email
  role: userRoleEnum('role').notNull().default('student'), // Default to student
});

export const sessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
});

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
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

// --- Application Domain Schema ---

export const semestreEnum = pgEnum('semestre_enum', [
  'SEMESTRE_1',
  'SEMESTRE_2',
]);

export const tipoProposicaoEnum = pgEnum('tipo_proposicao_enum', [
  'INDIVIDUAL',
  'COLETIVA',
]);

export const tipoVagaEnum = pgEnum('tipo_vaga_enum', [
  'BOLSISTA',
  'VOLUNTARIO',
]);

export const projetoStatusEnum = pgEnum('projeto_status_enum', [
  'DRAFT', // Added Draft status
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
]);

export const generoEnum = pgEnum('genero_enum', [
  'MASCULINO',
  'FEMININO',
  'OUTRO',
]);

export const regimeEnum = pgEnum('regime_enum', ['20H', '40H', 'DE']);

export const tipoInscricaoEnum = pgEnum('tipo_inscricao_enum', [
  'BOLSISTA',
  'VOLUNTARIO',
  'ANY', // Changed from QUALQUER for clarity
]);

export const statusInscricaoEnum = pgEnum('status_inscricao_enum', [
  'SUBMITTED', // Aluno aplicou
  'SELECTED_BOLSISTA', // Professor selecionou (bolsista)
  'SELECTED_VOLUNTARIO', // Professor selecionou (voluntário)
  'ACCEPTED_BOLSISTA', // Aluno aceitou (bolsista)
  'ACCEPTED_VOLUNTARIO', // Aluno aceitou (voluntário)
  'REJECTED_BY_PROFESSOR', // Professor rejeitou
  'REJECTED_BY_STUDENT', // Aluno recusou
  // 'INAPTO', 'APTO' seem less relevant if selection is direct
]);

export const departamentoTable = pgTable('departamento', {
  id: serial('id').primaryKey(),
  unidadeUniversitaria: varchar('unidade_universitaria'),
  nome: varchar('nome').notNull(),
  sigla: varchar('sigla'),
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
});

export const projetoTable = pgTable('projeto', {
  id: serial('id').primaryKey(),
  // dataAprovacao: date('data_aprovacao', { mode: 'date' }), // Approval date might be inferred from status change
  departamentoId: integer('departamento_id')
    .references(() => departamentoTable.id)
    .notNull(),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  tipoProposicao: tipoProposicaoEnum('tipo_proposicao').notNull(),
  bolsasSolicitadas: integer('bolsas_solicitadas').notNull().default(0), // Professor defines
  voluntariosSolicitados: integer('voluntarios_solicitados')
    .notNull()
    .default(0), // Professor defines
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
  descricao: text('descricao').notNull(), // Objectives/Justification
  status: projetoStatusEnum('status').notNull().default('DRAFT'),
  // analiseSubmissao: text('analise_submissao'), // Renamed/Repurposed
  feedbackAdmin: text('feedback_admin'), // Admin feedback on approval/rejection
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
});

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
});

// Participating professors (excluding the main responsible one)
export const projetoProfessorParticipanteTable = pgTable(
  'projeto_professor_participante',
  {
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
  },
);

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
});

export const professorTable = pgTable('professor', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // Link to auth user
  departamentoId: integer('departamento_id')
    .references(() => departamentoTable.id)
    .notNull(),
  nomeCompleto: varchar('nome_completo').notNull(),
  nomeSocial: varchar('nome_social'),
  matriculaSiape: varchar('matricula_siape'),
  genero: generoEnum('genero').notNull(),
  regime: regimeEnum('regime').notNull(),
  especificacaoGenero: varchar('especificacao_genero'),
  cpf: varchar('cpf').notNull(), // Unique?
  telefone: varchar('telefone'),
  telefoneInstitucional: varchar('telefone_institucional'),
  emailInstitucional: varchar('email_institucional').notNull(),
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
});

export const disciplinaTable = pgTable('disciplina', {
  id: serial('id').primaryKey(),
  nome: varchar('nome').notNull(),
  codigo: varchar('codigo').notNull().unique(), // Make code unique
  departamentoId: integer('departamento_id')
    .references(() => departamentoTable.id)
    .notNull(), // Add department link
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
});

export const alunoTable = pgTable('aluno', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // Link to auth user
  nomeCompleto: varchar('nome_completo').notNull(),
  nomeSocial: varchar('nome_social'),
  genero: generoEnum('genero').notNull(),
  especificacaoGenero: varchar('especificacao_genero'),
  emailInstitucional: varchar('email_institucional').notNull(),
  matricula: varchar('matricula').notNull().unique(), // Make unique
  rg: varchar('rg'), // Nullable?
  cpf: varchar('cpf').notNull().unique(), // Make unique
  cr: real('CR').notNull(),
  telefone: varchar('telefone'),
  enderecoId: integer('endereco_id').references(() => enderecoTable.id), // Nullable
  cursoId: integer('curso_id')
    .references(() => cursoTable.id)
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
  // deletedAt handled by user deletion cascade?
});

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
});

export const cursoTable = pgTable('curso', {
  id: serial('id').primaryKey(),
  nome: varchar('nome').notNull(),
  codigo: integer('codigo'), // Nullable?
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
});

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
});

// Represents the period when students can apply for projects in a given semester
export const periodoInscricaoTable = pgTable('periodo_inscricao', {
  id: serial('id').primaryKey(),
  semestre: semestreEnum('semestre').notNull(),
  ano: integer('ano').notNull(),
  // editalUniqueId: text('edital_unique_id'), // Link to document table
  dataInicio: date('data_inicio', { mode: 'date' }).notNull(),
  dataFim: date('data_fim', { mode: 'date' }).notNull(),
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
});

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
  // notaProva: real('nota_prova'), // If applicable
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
});

// Join table for documents related to an application (e.g., transcript)
export const inscricaoDocumentoTable = pgTable('inscricao_documento', {
  id: serial('id').primaryKey(),
  inscricaoId: integer('inscricao_id')
    .references(() => inscricaoTable.id, { onDelete: 'cascade' })
    .notNull(),
  // documentoUniqueId: text('documento_unique_id').notNull(), // Link to document table
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
});

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
});

// --- Relations ---

export const departamentoRelations = relations(
  departamentoTable,
  ({ many }) => ({
    projetos: many(projetoTable),
    professores: many(professorTable),
    disciplinas: many(disciplinaTable),
  }),
);

export const projetoRelations = relations(projetoTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [projetoTable.departamentoId],
    references: [departamentoTable.id],
  }),
  professorResponsavel: one(professorTable, {
    fields: [projetoTable.professorResponsavelId],
    references: [professorTable.id],
  }),
  disciplinas: many(projetoDisciplinaTable),
  professoresParticipantes: many(projetoProfessorParticipanteTable),
  atividades: many(atividadeProjetoTable),
  inscricoes: many(inscricaoTable),
  vagas: many(vagaTable),
}));

export const projetoDisciplinaRelations = relations(
  projetoDisciplinaTable,
  ({ one }) => ({
    projeto: one(projetoTable, {
      fields: [projetoDisciplinaTable.projetoId],
      references: [projetoTable.id],
    }),
    disciplina: one(disciplinaTable, {
      fields: [projetoDisciplinaTable.disciplinaId],
      references: [disciplinaTable.id],
    }),
  }),
);

export const projetoProfessorParticipanteRelations = relations(
  projetoProfessorParticipanteTable,
  ({ one }) => ({
    projeto: one(projetoTable, {
      fields: [projetoProfessorParticipanteTable.projetoId],
      references: [projetoTable.id],
    }),
    professor: one(professorTable, {
      fields: [projetoProfessorParticipanteTable.professorId],
      references: [professorTable.id],
    }),
  }),
);

export const atividadeProjetoRelations = relations(
  atividadeProjetoTable,
  ({ one }) => ({
    projeto: one(projetoTable, {
      fields: [atividadeProjetoTable.projetoId],
      references: [projetoTable.id],
    }),
  }),
);

export const professorRelations = relations(
  professorTable,
  ({ one, many }) => ({
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
  }),
);

export const disciplinaRelations = relations(
  disciplinaTable,
  ({ many, one }) => ({
    projetoDisciplinas: many(projetoDisciplinaTable),
    departamento: one(departamentoTable, {
      fields: [disciplinaTable.departamentoId],
      references: [departamentoTable.id],
    }),
    notasAlunos: many(notaAlunoTable),
  }),
);

export const alunoRelations = relations(alunoTable, ({ one, many }) => ({
  endereco: one(enderecoTable, {
    fields: [alunoTable.enderecoId],
    references: [enderecoTable.id],
  }),
  curso: one(cursoTable, {
    fields: [alunoTable.cursoId],
    references: [cursoTable.id],
  }),
  user: one(userTable, {
    fields: [alunoTable.userId],
    references: [userTable.id],
  }),
  inscricoes: many(inscricaoTable),
  notas: many(notaAlunoTable),
  vagas: many(vagaTable),
}));

export const notaAlunoRelations = relations(notaAlunoTable, ({ one }) => ({
  aluno: one(alunoTable, {
    fields: [notaAlunoTable.alunoId],
    references: [alunoTable.id],
  }),
  disciplina: one(disciplinaTable, {
    fields: [notaAlunoTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
}));

export const periodoInscricaoRelations = relations(
  periodoInscricaoTable,
  ({ many }) => ({
    inscricoes: many(inscricaoTable),
  }),
);

export const inscricaoRelations = relations(
  inscricaoTable,
  ({ one, many }) => ({
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
  }),
);

export const inscricaoDocumentoRelations = relations(
  inscricaoDocumentoTable,
  ({ one }) => ({
    inscricao: one(inscricaoTable, {
      fields: [inscricaoDocumentoTable.inscricaoId],
      references: [inscricaoTable.id],
    }),
  }),
);

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
}));

// Export all schemas and relations
export * from './schema';
