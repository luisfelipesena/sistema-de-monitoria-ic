import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
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
  unidadeUniversitaria: varchar('unidade_universitaria', {length: 255}),
  nome: varchar('nome', {length: 500}).notNull(),
  sigla: varchar('sigla', {length: 50}),
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
