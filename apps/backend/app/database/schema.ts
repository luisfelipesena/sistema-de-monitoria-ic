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
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  hashed_password: text('hashed_password').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
});

export const sessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
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
  departamentoId: integer('departamento_id').notNull(),
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
  professorResponsavelId: integer('professor_responsavel_id').notNull(),
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
  projetoId: integer('projeto_id').notNull(),
  disciplinaId: integer('disciplina_id').notNull(),
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
  projetoId: integer('projeto_id').notNull(),
  professorId: integer('professor_id').notNull(),
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
  projetoId: integer('projeto_id').notNull(),
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
  userId: integer('user_id').notNull(),
  departamentoId: integer('departamento_id').notNull(),
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
  userId: integer('user_id').notNull(),
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
  enderecoId: integer('endereco_id'),
  cursoId: integer('curso_id').notNull(),
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
  alunoId: integer('aluno_id').notNull(),
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
  projetoId: integer('projeto_id').notNull(),
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
  processoSeletivoId: integer('processo_seletivo_id').notNull(),
  alunoId: integer('aluno_id').notNull(),
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
  inscricaoId: integer('inscricao_id').notNull(),
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
  alunoId: integer('aluno_id').notNull(),
  projetoId: integer('projeto_id').notNull(),
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
