import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'monitor',
  'student',
]);

export const userTable = pgTable('user', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull().default('student'),
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

export const userRelations = relations(userTable, ({ many }) => ({
  sessions: many(sessionTable),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));
// Other necessary application schemas below (domain-related)

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
  'SUBMETIDO',
  'APROVADO',
  'REPROVADO',
]);

export const generoEnum = pgEnum('genero_enum', [
  'MASCULINO',
  'FEMININO',
  'OUTRO',
]);

export const regimeEnum = pgEnum('regime_enum', [
  '20H',
  '40H',
  'DE',
]);

export const tipoInscricaoEnum = pgEnum('tipo_inscricao_enum', [
  'BOLSISTA',
  'VOLUNTARIO',
  'QUALQUER',
]);

export const statusInscricaoEnum = pgEnum('status_inscricao_enum', [
  'SUBMETIDO',
  'INAPTO',
  'APTO',
  'SELECIONADO_BOLSISTA',
  'SELECIONADO_VOLUNTARIO',
  'APROVACAO_CONFIRMADA_BOLSISTA',
  'APROVACAO_CONFIRMADA_VOLUNTARIO',
]);

export const departamentoTable = pgTable('departamento', {
  id: serial('id').primaryKey(),
  unidadeUniversitaria: varchar('unidade_universitaria'),
  nome: varchar('nome').notNull(),
  sigla: varchar('sigla'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
});

export const projetoTable = pgTable('projeto', {
  id: serial('id').primaryKey(),
  dataAprovacao: date('data_aprovacao', {mode: 'date'}),
  departamentoId: integer('departamento_id').references(() => departamentoTable.id).notNull(),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  tipoProposicao: tipoProposicaoEnum('tipo_proposicao').notNull(),
  bolsasSolicitadas: integer('bolsas_solicitadas').notNull(),
  voluntariosSolicitados: integer('voluntarios_solicitados').notNull(),
  bolsasAtendidas: integer('bolsas_atendidas'),
  voluntariosAtendidos: integer('voluntarios_atendidos'),
  cargaHorariaSemana: integer('carga_horaria_semana').notNull(),
  numeroSemanas: integer('numero_semanas').notNull(),
  publicoAlvo: text('publico_alvo').notNull(),
  estimativaPessoasBenificiadas: integer('estimativa_pessoas_benificiadas'),
  professorResponsavelId: integer('professor_responsavel_id').references(() => professorTable.id).notNull(),
  descricao: text('descricao').notNull(),
  status: projetoStatusEnum('status').notNull().default('SUBMETIDO'),
  analiseSubmissao: text('analise_submissao').notNull(),
  documentoUniqueId: text('documento_unique_id'),
  assinaturaUniqueId: text('assinatura_unique_id'),
  validado: boolean('validado').notNull().default(false),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date'
  }),
});

export const projetoDisciplinaTable = pgTable('projeto_disciplina', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id').references(() => projetoTable.id).notNull(),
  disciplinaId: integer('disciplina_id').references(() => disciplinaTable.id).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const projetoProfessorTable = pgTable('projeto_professor', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id').references(() => projetoTable.id).notNull(),
  professorId: integer('professor_id').references(() => professorTable.id).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const atividadeProjetoTable = pgTable('atividade_projeto', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id').references(() => projetoTable.id).notNull(),
  descricao: text('descricao').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const professorTable = pgTable('professor', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => userTable.id).notNull(),
  departamentoId: integer('departamento_id').references(() => departamentoTable.id).notNull(),
  nomeCompleto: varchar('nome_completo').notNull(),
  nomeSocial: varchar('nome_social'),
  // FIXME todos os professors tem matrícula Siape?
  matriculaSiape: varchar('matricula_siape'),
  genero: generoEnum('genero').notNull(),
  regime: regimeEnum('regime').notNull(),
  especificacaoGenero: varchar('especificacao_genero'),
  cpf: varchar('cpf').notNull(),
  telefone: varchar('telefone'),
  telefoneInstitucional: varchar('telefone_institucional'),
  emailInstitucional: varchar('email_institucional').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const disciplinaTable = pgTable('disciplina', {
  id: serial('id').primaryKey(),
  nome: varchar('nome'),
  codigo: varchar('codigo'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const alunoTable = pgTable('aluno', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => userTable.id).notNull(),
  nomeCompleto: varchar('nome_completo').notNull(),
  nomeSocial: varchar('nome_social'),
  genero: generoEnum('genero').notNull(),
  especificacaoGenero: varchar('especificacao_genero'),
  emailInstitucional: varchar('email_institucional').notNull(),
  matricula: varchar('matricula').notNull(),
  rg: varchar('rg').notNull(),
  cpf: varchar('cpf').notNull(),
  cr: real('CR').notNull(),
  telefone: varchar('telefone'),
  enderecoId: integer('endereco_id').references(() => enderecoTable.id),
  cursoId: integer('curso_id').references(() => cursoTable.id).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
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
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const cursoTable = pgTable('curso', {
  id: serial('id').primaryKey(),
  nome: varchar('nome').notNull(),
  codigo: integer('codigo'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
});

export const notaAlunoTable = pgTable('nota_aluno', {
  id: serial('id').primaryKey(),
  alunoId: integer('aluno_id').references(() => alunoTable.id).notNull(),
  codigoDisciplina: varchar('codigo_disciplina').notNull(),
  nota: real('nota').notNull(),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const processoSeletivoTable = pgTable('processo_seletivo', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id').references(() => projetoTable.id).notNull(),
  vagasBolsista: integer('vagas_bolsista').notNull(),
  vagasVoluntario: integer('vagas_voluntario').notNull(),
  editalUniqueId: integer('edital_unique_id'),
  dataInicio: date('data_inicio', { mode: 'date' }).notNull(),
  dataFinal: date('data_final', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const inscricaoTable = pgTable('inscricao', {
  id: serial('id').primaryKey(),
  processoSeletivoId: integer('processo_seletivo_id').references(() => processoSeletivoTable.id).notNull(),
  alunoId: integer('aluno_id').references(() => alunoTable.id).notNull(),
  tipo: tipoInscricaoEnum('tipo'),
  status: statusInscricaoEnum('status').notNull(),
  notaProva: real('nota_prova'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const inscricaoDocumentoTable = pgTable('inscricao_documento', {
  id: serial('id').primaryKey(),
  inscricaoId: integer('inscricao_id').references(() => inscricaoTable.id).notNull(),
  documentoUniqueId: integer('documento_unique_id').notNull(),
  validado: boolean('validado'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const vagaTable = pgTable('vaga', {
  id: serial('id').primaryKey(),
  alunoId: integer('aluno_id').references(() => alunoTable.id).notNull(),
  projetoId: integer('projeto_id').references(() => projetoTable.id).notNull(),
  tipo: tipoVagaEnum('tipo').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const departamentoRelations = relations(departamentoTable, ({ many }) => ({
  projetos: many(projetoTable),
  professores: many(professorTable),
}));

export const projetoRelations = relations(projetoTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [projetoTable.departamentoId],
    references: [departamentoTable.id],
  }),
  projetoDisciplinas: many(projetoDisciplinaTable),
  projetoProfessores: many(projetoProfessorTable),
  projetoAtividades: many(atividadeProjetoTable),
}));

export const projetoDisciplinaRelations = relations(projetoDisciplinaTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [projetoDisciplinaTable.projetoId],
    references: [projetoTable.id],
  }),
  disciplina: one(disciplinaTable, {
    fields: [projetoDisciplinaTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
}));

export const projetoProfessorRelations = relations(projetoProfessorTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [projetoProfessorTable.projetoId],
    references: [projetoTable.id],
  }),
  professor: one(professorTable, {
    fields: [projetoProfessorTable.professorId],
    references: [professorTable.id],
  }),
}));

export const atividadeProjetoRelations = relations(atividadeProjetoTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [atividadeProjetoTable.projetoId],
    references: [projetoTable.id],
  }),
}));

export const professorRelations = relations(professorTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [professorTable.departamentoId],
    references: [departamentoTable.id],
  }),
  user: one(userTable, {
    fields: [professorTable.userId],
    references: [userTable.id],
  }),
  projetoProfessores: many(projetoProfessorTable),
}));

export const disciplinaRelations = relations(disciplinaTable, ({ many }) => ({
  projetoDisciplinas: many(projetoDisciplinaTable),
}));

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
}));

export const processoSeletivoRelations = relations(processoSeletivoTable, ({ one, many }) => ({
  projeto: one(projetoTable, {
    fields: [processoSeletivoTable.projetoId],
    references: [projetoTable.id],
  }),
  inscricoes: many(inscricaoTable),
}));

export const inscricaoRelations = relations(inscricaoTable, ({ one, many }) => ({
  processoSeletivo: one(processoSeletivoTable, {
    fields: [inscricaoTable.processoSeletivoId],
    references: [processoSeletivoTable.id],
  }),
  aluno: one(alunoTable, {
    fields: [inscricaoTable.alunoId],
    references: [alunoTable.id],
  }),
  documentos: many(inscricaoDocumentoTable),
}));

export const inscricaoDocumentoRelations = relations(inscricaoDocumentoTable, ({ one }) => ({
  inscricao: one(inscricaoTable, {
    fields: [inscricaoDocumentoTable.inscricaoId],
    references: [inscricaoTable.id],
  }),
}));

export const vagaRelations = relations(vagaTable, ({ one }) => ({
  aluno: one(alunoTable, {
    fields: [vagaTable.alunoId],
    references: [alunoTable.id],
  }),
  projeto: one(projetoTable, {
    fields: [vagaTable.projetoId],
    references: [projetoTable.id],
  }),
}));
