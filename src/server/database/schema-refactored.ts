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
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// --- Auth Schema ---
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'professor',
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

// --- Application Domain Schema ---
export const semesterEnum = pgEnum('semestre_enum', [
  'SEMESTRE_1',
  'SEMESTRE_2',
]);

export const proposalTypeEnum = pgEnum('tipo_proposicao_enum', [
  'INDIVIDUAL',
  'COLETIVA',
]);

export const positionTypeEnum = pgEnum('tipo_vaga_enum', [
  'BOLSISTA',
  'VOLUNTARIO',
]);

export const projectStatusEnum = pgEnum('projeto_status_enum', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
]);

export const genderEnum = pgEnum('genero_enum', [
  'MASCULINO',
  'FEMININO',
  'OUTRO',
]);

export const workRegimeEnum = pgEnum('regime_enum', ['20H', '40H', 'DE']);

export const applicationTypeEnum = pgEnum('tipo_inscricao_enum', [
  'BOLSISTA',
  'VOLUNTARIO',
  'ANY',
]);

export const projectDocumentTypeEnum = pgEnum('tipo_documento_projeto_enum', [
  'PROPOSTA_ORIGINAL',
  'PROPOSTA_ASSINADA_PROFESSOR',
  'PROPOSTA_ASSINADA_ADMIN',
  'ATA_SELECAO',
]);

export const applicationStatusEnum = pgEnum('status_inscricao_enum', [
  'SUBMITTED',
  'SELECTED_BOLSISTA',
  'SELECTED_VOLUNTARIO',
  'ACCEPTED_BOLSISTA',
  'ACCEPTED_VOLUNTARIO',
  'REJECTED_BY_PROFESSOR',
  'REJECTED_BY_STUDENT',
]);

// --- Tables ---
export const departmentTable = pgTable('departamento', {
  id: serial('id').primaryKey(),
  universityUnit: varchar('unidade_universitaria'),
  name: varchar('nome').notNull(),
  acronym: varchar('sigla'),
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

export const selectDepartmentTableSchema = createSelectSchema(departmentTable);
export const insertDepartmentTableSchema = createInsertSchema(
  departmentTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const projectTable = pgTable('projeto', {
  id: serial('id').primaryKey(),
  departmentId: integer('departamento_id')
    .references(() => departmentTable.id)
    .notNull(),
  year: integer('ano').notNull(),
  semester: semesterEnum('semestre').notNull(),
  proposalType: proposalTypeEnum('tipo_proposicao').notNull(),
  requestedScholarships: integer('bolsas_solicitadas').notNull().default(0),
  requestedVolunteers: integer('voluntarios_solicitados').notNull().default(0),
  availableScholarships: integer('bolsas_disponibilizadas').default(0),
  weeklyHours: integer('carga_horaria_semana').notNull(),
  numberOfWeeks: integer('numero_semanas').notNull(),
  targetAudience: text('publico_alvo').notNull(),
  estimatedBeneficiaries: integer('estimativa_pessoas_benificiadas'),
  responsibleTeacherId: integer('professor_responsavel_id')
    .references(() => teacherTable.id)
    .notNull(),
  title: varchar('titulo').notNull(),
  description: text('descricao').notNull(),
  status: projectStatusEnum('status').notNull().default('DRAFT'),
  adminFeedback: text('feedback_admin'),
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

export const selectProjectTableSchema = createSelectSchema(projectTable);
export const insertProjectTableSchema = createInsertSchema(projectTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const projectSubjectTable = pgTable('projeto_disciplina', {
  id: serial('id').primaryKey(),
  projectId: integer('projeto_id')
    .references(() => projectTable.id, { onDelete: 'cascade' })
    .notNull(),
  subjectId: integer('disciplina_id')
    .references(() => subjectTable.id)
    .notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
});

export const projectParticipantTeacherTable = pgTable(
  'projeto_professor_participante',
  {
    id: serial('id').primaryKey(),
    projectId: integer('projeto_id')
      .references(() => projectTable.id, { onDelete: 'cascade' })
      .notNull(),
    teacherId: integer('professor_id')
      .references(() => teacherTable.id)
      .notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
);

export const projectActivityTable = pgTable('atividade_projeto', {
  id: serial('id').primaryKey(),
  projectId: integer('projeto_id')
    .references(() => projectTable.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('descricao').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
});

export const teacherTable = pgTable('professor', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  departmentId: integer('departamento_id')
    .references(() => departmentTable.id)
    .notNull(),
  fullName: varchar('nome_completo').notNull(),
  socialName: varchar('nome_social'),
  siapeRegistration: varchar('matricula_siape'),
  gender: genderEnum('genero').notNull(),
  workRegime: workRegimeEnum('regime').notNull(),
  genderSpecification: varchar('especificacao_genero'),
  cpf: varchar('cpf').notNull(),
  phone: varchar('telefone'),
  institutionalPhone: varchar('telefone_institucional'),
  institutionalEmail: varchar('email_institucional').notNull(),
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

export const selectTeacherTableSchema = createSelectSchema(teacherTable);
export const insertTeacherTableSchema = createInsertSchema(teacherTable).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const subjectTable = pgTable('disciplina', {
  id: serial('id').primaryKey(),
  name: varchar('nome').notNull(),
  code: varchar('codigo').notNull().unique(),
  departmentId: integer('departamento_id')
    .references(() => departmentTable.id)
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
});

export const studentTable = pgTable('aluno', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  fullName: varchar('nome_completo').notNull(),
  socialName: varchar('nome_social'),
  gender: genderEnum('genero').notNull(),
  genderSpecification: varchar('especificacao_genero'),
  institutionalEmail: varchar('email_institucional').notNull(),
  registration: varchar('matricula').notNull().unique(),
  rg: varchar('rg'),
  cpf: varchar('cpf').notNull().unique(),
  cr: real('CR').notNull(),
  phone: varchar('telefone'),
  addressId: integer('endereco_id').references(() => addressTable.id),
  courseId: integer('curso_id')
    .references(() => courseTable.id)
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

export const selectStudentTableSchema = createSelectSchema(studentTable);
export const insertStudentTableSchema = createInsertSchema(studentTable).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const addressTable = pgTable('endereco', {
  id: serial('id').primaryKey(),
  number: integer('numero'),
  street: varchar('rua').notNull(),
  neighborhood: varchar('bairro').notNull(),
  city: varchar('cidade').notNull(),
  state: varchar('estado').notNull(),
  zipCode: varchar('cep').notNull(),
  complement: varchar('complemento'),
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

export const courseTable = pgTable('curso', {
  id: serial('id').primaryKey(),
  name: varchar('nome').notNull(),
  code: integer('codigo'),
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

export const studentGradeTable = pgTable('nota_aluno', {
  id: serial('id').primaryKey(),
  studentId: integer('aluno_id')
    .references(() => studentTable.id, { onDelete: 'cascade' })
    .notNull(),
  subjectId: integer('disciplina_id')
    .references(() => subjectTable.id)
    .notNull(),
  grade: real('nota').notNull(),
  year: integer('ano').notNull(),
  semester: semesterEnum('semestre').notNull(),
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

export const applicationPeriodTable = pgTable('periodo_inscricao', {
  id: serial('id').primaryKey(),
  semester: semesterEnum('semestre').notNull(),
  year: integer('ano').notNull(),
  startDate: date('data_inicio', { mode: 'date' }).notNull(),
  endDate: date('data_fim', { mode: 'date' }).notNull(),
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

export const applicationTable = pgTable('inscricao', {
  id: serial('id').primaryKey(),
  applicationPeriodId: integer('periodo_inscricao_id')
    .references(() => applicationPeriodTable.id)
    .notNull(),
  projectId: integer('projeto_id')
    .references(() => projectTable.id)
    .notNull(),
  studentId: integer('aluno_id')
    .references(() => studentTable.id, { onDelete: 'cascade' })
    .notNull(),
  desiredPositionType: applicationTypeEnum('tipo_vaga_pretendida'),
  status: applicationStatusEnum('status').notNull().default('SUBMITTED'),
  teacherFeedback: text('feedback_professor'),
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

export const applicationDocumentTable = pgTable('inscricao_documento', {
  id: serial('id').primaryKey(),
  applicationId: integer('inscricao_id')
    .references(() => applicationTable.id, { onDelete: 'cascade' })
    .notNull(),
  fileId: text('file_id').notNull(),
  documentType: text('tipo_documento').notNull(),
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

export const projectDocumentTable = pgTable('projeto_documento', {
  id: serial('id').primaryKey(),
  projectId: integer('projeto_id')
    .references(() => projectTable.id, { onDelete: 'cascade' })
    .notNull(),
  fileId: text('file_id').notNull(),
  documentType: projectDocumentTypeEnum('tipo_documento').notNull(),
  signedByUserId: integer('assinado_por_user_id').references(
    () => userTable.id,
  ),
  observations: text('observacoes'),
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

export const selectProjectDocumentTableSchema =
  createSelectSchema(projectDocumentTable);
export const insertProjectDocumentTableSchema = createInsertSchema(
  projectDocumentTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const positionTable = pgTable('vaga', {
  id: serial('id').primaryKey(),
  studentId: integer('aluno_id')
    .references(() => studentTable.id)
    .notNull(),
  projectId: integer('projeto_id')
    .references(() => projectTable.id)
    .notNull(),
  applicationId: integer('inscricao_id')
    .references(() => applicationTable.id)
    .notNull()
    .unique(),
  type: positionTypeEnum('tipo').notNull(),
  startDate: date('data_inicio', { mode: 'date' }),
  endDate: date('data_fim', { mode: 'date' }),
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

// --- Relations ---
export const userRelations = relations(userTable, ({ many, one }) => ({
  sessions: many(sessionTable),
  teacherProfile: one(teacherTable, {
    fields: [userTable.id],
    references: [teacherTable.userId],
  }),
  studentProfile: one(studentTable, {
    fields: [userTable.id],
    references: [studentTable.userId],
  }),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const departmentRelations = relations(departmentTable, ({ many }) => ({
  projects: many(projectTable),
  teachers: many(teacherTable),
  subjects: many(subjectTable),
}));

export const projectRelations = relations(projectTable, ({ one, many }) => ({
  department: one(departmentTable, {
    fields: [projectTable.departmentId],
    references: [departmentTable.id],
  }),
  responsibleTeacher: one(teacherTable, {
    fields: [projectTable.responsibleTeacherId],
    references: [teacherTable.id],
  }),
  subjects: many(projectSubjectTable),
  participantTeachers: many(projectParticipantTeacherTable),
  activities: many(projectActivityTable),
  applications: many(applicationTable),
  positions: many(positionTable),
  documents: many(projectDocumentTable),
}));

export const projectSubjectRelations = relations(
  projectSubjectTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [projectSubjectTable.projectId],
      references: [projectTable.id],
    }),
    subject: one(subjectTable, {
      fields: [projectSubjectTable.subjectId],
      references: [subjectTable.id],
    }),
  }),
);

export const projectParticipantTeacherRelations = relations(
  projectParticipantTeacherTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [projectParticipantTeacherTable.projectId],
      references: [projectTable.id],
    }),
    teacher: one(teacherTable, {
      fields: [projectParticipantTeacherTable.teacherId],
      references: [teacherTable.id],
    }),
  }),
);

export const projectActivityRelations = relations(
  projectActivityTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [projectActivityTable.projectId],
      references: [projectTable.id],
    }),
  }),
);

export const teacherRelations = relations(teacherTable, ({ one, many }) => ({
  department: one(departmentTable, {
    fields: [teacherTable.departmentId],
    references: [departmentTable.id],
  }),
  user: one(userTable, {
    fields: [teacherTable.userId],
    references: [userTable.id],
  }),
  responsibleProjects: many(projectTable, {
    relationName: 'responsibleProjects',
  }),
  participantProjects: many(projectParticipantTeacherTable),
}));

export const subjectRelations = relations(subjectTable, ({ many, one }) => ({
  projectSubjects: many(projectSubjectTable),
  department: one(departmentTable, {
    fields: [subjectTable.departmentId],
    references: [departmentTable.id],
  }),
  studentGrades: many(studentGradeTable),
}));

export const studentRelations = relations(studentTable, ({ one, many }) => ({
  address: one(addressTable, {
    fields: [studentTable.addressId],
    references: [addressTable.id],
  }),
  course: one(courseTable, {
    fields: [studentTable.courseId],
    references: [courseTable.id],
  }),
  user: one(userTable, {
    fields: [studentTable.userId],
    references: [userTable.id],
  }),
  applications: many(applicationTable),
  grades: many(studentGradeTable),
  positions: many(positionTable),
}));

export const studentGradeRelations = relations(
  studentGradeTable,
  ({ one }) => ({
    student: one(studentTable, {
      fields: [studentGradeTable.studentId],
      references: [studentTable.id],
    }),
    subject: one(subjectTable, {
      fields: [studentGradeTable.subjectId],
      references: [subjectTable.id],
    }),
  }),
);

export const applicationPeriodRelations = relations(
  applicationPeriodTable,
  ({ many }) => ({
    applications: many(applicationTable),
  }),
);

export const applicationRelations = relations(
  applicationTable,
  ({ one, many }) => ({
    applicationPeriod: one(applicationPeriodTable, {
      fields: [applicationTable.applicationPeriodId],
      references: [applicationPeriodTable.id],
    }),
    project: one(projectTable, {
      fields: [applicationTable.projectId],
      references: [projectTable.id],
    }),
    student: one(studentTable, {
      fields: [applicationTable.studentId],
      references: [studentTable.id],
    }),
    documents: many(applicationDocumentTable),
    position: one(positionTable, {
      fields: [applicationTable.id],
      references: [positionTable.applicationId],
    }),
  }),
);

export const applicationDocumentRelations = relations(
  applicationDocumentTable,
  ({ one }) => ({
    application: one(applicationTable, {
      fields: [applicationDocumentTable.applicationId],
      references: [applicationTable.id],
    }),
  }),
);

export const projectDocumentRelations = relations(
  projectDocumentTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [projectDocumentTable.projectId],
      references: [projectTable.id],
    }),
    signedBy: one(userTable, {
      fields: [projectDocumentTable.signedByUserId],
      references: [userTable.id],
    }),
  }),
);

export const positionRelations = relations(positionTable, ({ one }) => ({
  student: one(studentTable, {
    fields: [positionTable.studentId],
    references: [studentTable.id],
  }),
  project: one(projectTable, {
    fields: [positionTable.projectId],
    references: [projectTable.id],
  }),
  application: one(applicationTable, {
    fields: [positionTable.applicationId],
    references: [applicationTable.id],
  }),
}));
