import { relations, sql } from 'drizzle-orm';
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
  boolean,
  uniqueIndex,
  primaryKey,
  foreignKey,
  decimal,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
// --- Auth Schema ---

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
  'DRAFT', // Professor creating the project
  'SUBMITTED', // Professor submitted for admin approval
  'APPROVED', // Admin approved and signed
  'REJECTED', // Admin rejected
  'PENDING_ADMIN_SIGNATURE', // Admin approved but needs to sign (optional status)
  'PENDING_PROFESSOR_SIGNATURE', // Generated from import, needs professor signature
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

export const tipoDocumentoProjetoEnum = pgEnum('tipo_documento_projeto_enum', [
  'PROPOSTA_ORIGINAL',
  'PROPOSTA_ASSINADA_PROFESSOR',
  'PROPOSTA_ASSINADA_ADMIN',
  'ATA_SELECAO',
]);

export const tipoAssinaturaEnum = pgEnum('tipo_assinatura_enum', [
  'PROJETO_PROFESSOR_RESPONSAVEL',
  'TERMO_COMPROMISSO_ALUNO',
  'EDITAL_ADMIN',
  'ATA_SELECAO_PROFESSOR',
  'PROJETO_COORDENADOR_DEPARTAMENTO',
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
  unidadeUniversitaria: varchar('unidade_universitaria').notNull(),
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

export const selectDepartamentoTableSchema =
  createSelectSchema(departamentoTable);

export const insertDepartamentoTableSchema = createInsertSchema(
  departamentoTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  assinaturaProfessor: text('assinatura_professor'), // base64 data URL
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

export const selectProjetoTableSchema = createSelectSchema(projetoTable);
export const insertProjetoTableSchema = createInsertSchema(projetoTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
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

export const selectAtividadeProjetoTableSchema = createSelectSchema(atividadeProjetoTable);

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
});
export const selectProfessorTableSchema = createSelectSchema(professorTable);
export const insertProfessorTableSchema = createInsertSchema(
  professorTable,
).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const disciplinaTable = pgTable('disciplina', {
  id: serial('id').primaryKey(),
  nome: varchar('nome').notNull(),
  codigo: varchar('codigo').notNull(),
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
},
(table) => {
  return {
    codigoUnicoPorDepartamento: uniqueIndex(
      'codigo_unico_por_departamento_idx',
    ).on(table.codigo, table.departamentoId),
  };
},
);

export const selectDisciplinaTableSchema = createSelectSchema(disciplinaTable);
export const insertDisciplinaTableSchema = createInsertSchema(
  disciplinaTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
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
});
export const selectAlunoTableSchema = createSelectSchema(alunoTable);
export const insertAlunoTableSchema = createInsertSchema(alunoTable).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
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
  codigo: integer('codigo').notNull(), // Nullable?
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

export const selectCursoTableSchema = createSelectSchema(cursoTable);
export const insertCursoTableSchema = createInsertSchema(cursoTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
});

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
});

// Join table for documents related to a project (e.g., proposal, signed documents)
export const projetoDocumentoTable = pgTable('projeto_documento', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull(),
  fileId: text('file_id').notNull(), // Unique identifier for the uploaded document in the object storage
  tipoDocumento: tipoDocumentoProjetoEnum('tipo_documento').notNull(),
  assinadoPorUserId: integer('assinado_por_user_id').references(
    () => userTable.id,
  ), // Who signed this document (professor or admin)
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
});

export const selectProjetoDocumentoTableSchema = createSelectSchema(
  projetoDocumentoTable,
);
export const insertProjetoDocumentoTableSchema = createInsertSchema(
  projetoDocumentoTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  documentos: many(projetoDocumentoTable),
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
    disciplinasResponsavel: many(disciplinaProfessorResponsavelTable),
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
    professoresResponsaveis: many(disciplinaProfessorResponsavelTable),
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
  ({ many, one }) => ({
    inscricoes: many(inscricaoTable),
    edital: one(editalTable, {
      fields: [periodoInscricaoTable.id],
      references: [editalTable.periodoInscricaoId],
    }),
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

export const projetoDocumentoRelations = relations(
  projetoDocumentoTable,
  ({ one }) => ({
    projeto: one(projetoTable, {
      fields: [projetoDocumentoTable.projetoId],
      references: [projetoTable.id],
    }),
    assinadoPor: one(userTable, {
      fields: [projetoDocumentoTable.assinadoPorUserId],
      references: [userTable.id],
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

export const disciplinaProfessorResponsavelTable = pgTable(
  'disciplina_professor_responsavel',
  {
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
  },
);

export const disciplinaProfessorResponsavelRelations = relations(
  disciplinaProfessorResponsavelTable,
  ({ one }) => ({
    disciplina: one(disciplinaTable, {
      fields: [disciplinaProfessorResponsavelTable.disciplinaId],
      references: [disciplinaTable.id],
    }),
    professor: one(professorTable, {
      fields: [disciplinaProfessorResponsavelTable.professorId],
      references: [professorTable.id],
    }),
  }),
);

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
});

export const importacaoPlanejamentoRelations = relations(
  importacaoPlanejamentoTable,
  ({ one }) => ({
    importadoPor: one(userTable, {
      fields: [importacaoPlanejamentoTable.importadoPorUserId],
      references: [userTable.id],
    }),
  }),
);

export const statusEnvioEnum = pgEnum('status_envio_enum', [
  'ENVIADO',
  'FALHOU',
]);

export const notificacaoHistoricoTable = pgTable('notificacao_historico', {
  id: serial('id').primaryKey(),
  destinatarioEmail: text('destinatario_email').notNull(),
  assunto: varchar('assunto', { length: 255 }).notNull(),
  tipoNotificacao: varchar('tipo_notificacao', { length: 100 }).notNull(),
  statusEnvio: statusEnvioEnum('status_envio').notNull(),
  dataEnvio: timestamp('data_envio', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  mensagemErro: text('mensagem_erro'),
  projetoId: integer('projeto_id').references(() => projetoTable.id),
  alunoId: integer('aluno_id').references(() => alunoTable.id),
  remetenteUserId: integer('remetente_user_id').references(() => userTable.id),
});

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
}));

// Tabela para Editais
export const editalTable = pgTable('edital', {
  id: serial('id').primaryKey(),
  periodoInscricaoId: integer('periodo_inscricao_id')
    .references(() => periodoInscricaoTable.id)
    .notNull()
    .unique(),
  numeroEdital: varchar('numero_edital', { length: 50 }).notNull().unique(),
  titulo: varchar('titulo', { length: 255 })
    .notNull()
    .default('Edital Interno de Seleção de Monitores'),
  descricaoHtml: text('descricao_html'),
  fileIdAssinado: text('file_id_assinado'), // PDF do edital assinado
  dataPublicacao: date('data_publicacao', { mode: 'date' }),
  publicado: boolean('publicado').default(false).notNull(),
  criadoPorUserId: integer('criado_por_user_id')
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .$onUpdate(() => new Date()),
});

export const editalRelations = relations(editalTable, ({ one }) => ({
  periodoInscricao: one(periodoInscricaoTable, {
    fields: [editalTable.periodoInscricaoId],
    references: [periodoInscricaoTable.id],
  }),
  criadoPor: one(userTable, {
    fields: [editalTable.criadoPorUserId],
    references: [userTable.id],
  }),
}));

// Enum para status de convite de professor
export const professorInvitationStatusEnum = pgEnum(
  'professor_invitation_status_enum',
  ['PENDING', 'ACCEPTED', 'EXPIRED'],
);

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
  acceptedByUserId: integer('accepted_by_user_id').references( // Usuário que aceitou (após criação/login)
    () => userTable.id,
  ),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .$onUpdate(() => new Date()),
});

export const professorInvitationRelations = relations(
  professorInvitationTable,
  ({ one }) => ({
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
  }),
);

// Tabela para armazenar dados de assinaturas digitais
export const assinaturaDocumentoTable = pgTable('assinatura_documento', {
  id: serial('id').primaryKey(),
  assinaturaData: text('assinatura_data').notNull(), // Base64 data URL da imagem da assinatura
  tipoAssinatura: tipoAssinaturaEnum('tipo_assinatura').notNull(),
  userId: integer('user_id').references(() => userTable.id).notNull(), // Quem assinou
  projetoId: integer('projeto_id').references(() => projetoTable.id), // Se assinatura de um projeto
  vagaId: integer('vaga_id').references(() => vagaTable.id), // Se assinatura de um termo (vinculado à vaga)
  editalId: integer('edital_id').references(() => editalTable.id), // Se assinatura de um edital
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

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
}));

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
  criadoPorUserId: integer('criado_por_user_id') 
    .references(() => userTable.id)
    .notNull(),
  ultimaAtualizacaoUserId: integer('ultima_atualizacao_user_id')
    .references(() => userTable.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .$onUpdate(() => new Date()),
});

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
}));

export const ataSelecaoTable = pgTable('ata_selecao', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .references(() => projetoTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // Cada projeto tem uma ata de seleção
  fileId: text('file_id'), // ID do PDF da ata no MinIO
  conteudoHtml: text('conteudo_html'), // Conteúdo da ata para renderização
  dataGeracao: timestamp('data_geracao', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  geradoPorUserId: integer('gerado_por_user_id')
    .references(() => userTable.id)
    .notNull(),
  assinado: boolean('assinado').default(false).notNull(),
  dataAssinatura: timestamp('data_assinatura', { withTimezone: true, mode: 'date' }),
});

export const ataSelecaoRelations = relations(ataSelecaoTable, ({ one }) => ({
    projeto: one(projetoTable, {
        fields: [ataSelecaoTable.projetoId],
        references: [projetoTable.id],
    }),
    geradoPor: one(userTable, {
        fields: [ataSelecaoTable.geradoPorUserId],
        references: [userTable.id],
    }),
}));

// Export all schemas and relations
// export * from './schema'; // This line seems to cause issues if present, ensure it's handled correctly or removed if not standard for the project setup
