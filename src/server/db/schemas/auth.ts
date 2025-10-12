import { relations } from 'drizzle-orm'
import { integer, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { alunoTable } from './student'
import { professorTable } from './professor'

// --- Auth Schema ---

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'professor', // Added professor based on project description
  'student',
  // 'monitor', // Monitor is an implicit role based on 'vaga' association, not a direct user role initially
])

export const userTable = pgTable('user', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(), // UFBA Login
  email: text('email').notNull().unique(), // UFBA Email
  role: userRoleEnum('role').notNull().default('student'), // Default to student
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

export const apiKeyTable = pgTable('api_key', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.id),
  name: text('name').notNull(),
  key_hash: text('key_hash').notNull(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .defaultNow(),
  lastUsedAt: timestamp('last_used_at', {
    withTimezone: true,
    mode: 'date',
  }),
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
  apiKeys: many(apiKeyTable),
}))

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}))

export const apiKeyRelations = relations(apiKeyTable, ({ one }) => ({
  user: one(userTable, {
    fields: [apiKeyTable.userId],
    references: [userTable.id],
  }),
}))

// Type exports
export type User = typeof userTable.$inferSelect
export type NewUser = typeof userTable.$inferInsert
export type Session = typeof sessionTable.$inferSelect
export type NewSession = typeof sessionTable.$inferInsert
export type ApiKey = typeof apiKeyTable.$inferSelect
export type NewApiKey = typeof apiKeyTable.$inferInsert
