-- =============================================
-- REPLACE DEMO USERS WITH NEW TEST USERS
-- =============================================
-- Deletes old demo users and creates new ones that require onboarding:
--   Admin:     luis.sena+admin@ufba.br / password123
--   Professor: luis.sena+professor@ufba.br / password123
--   Student:   luis.sena+student@ufba.br / password123
-- =============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- 1) CLEANUP ALL FK REFERENCES FOR DEMO USERS
-- ========================================

-- Get demo user IDs into temp table for easier reference
CREATE TEMP TABLE demo_users AS
SELECT id FROM "user" WHERE email IN (
  'demo.admin@ufba.br',
  'demo.professor@ufba.br',
  'demo.student@ufba.br'
);

-- Get demo professor ID
CREATE TEMP TABLE demo_professor AS
SELECT p.id FROM "professor" p
JOIN "user" u ON p.user_id = u.id
WHERE u.email = 'demo.professor@ufba.br';

-- Get demo student ID
CREATE TEMP TABLE demo_student AS
SELECT a.id FROM "aluno" a
JOIN "user" u ON a.user_id = u.id
WHERE u.email = 'demo.student@ufba.br';

-- Delete from tables with FK to aluno
DELETE FROM "inscricao" WHERE aluno_id IN (SELECT id FROM demo_student);
DELETE FROM "notificacao_historico" WHERE aluno_id IN (SELECT id FROM demo_student);

-- Delete from tables with FK to professor
DELETE FROM "disciplina_professor_responsavel" WHERE professor_id IN (SELECT id FROM demo_professor);
DELETE FROM "professor_invitation" WHERE professor_id IN (SELECT id FROM demo_professor);
DELETE FROM "projeto_professor_participante" WHERE professor_id IN (SELECT id FROM demo_professor);

-- Delete projeto related data (cascade through all projeto FKs)
DELETE FROM "notificacao_historico" WHERE projeto_id IN (
  SELECT pr.id FROM "projeto" pr WHERE pr.professor_responsavel_id IN (SELECT id FROM demo_professor)
);
DELETE FROM "projeto_disciplina" WHERE projeto_id IN (
  SELECT pr.id FROM "projeto" pr WHERE pr.professor_responsavel_id IN (SELECT id FROM demo_professor)
);
DELETE FROM "inscricao" WHERE projeto_id IN (
  SELECT pr.id FROM "projeto" pr WHERE pr.professor_responsavel_id IN (SELECT id FROM demo_professor)
);
DELETE FROM "projeto_documento" WHERE projeto_id IN (
  SELECT pr.id FROM "projeto" pr WHERE pr.professor_responsavel_id IN (SELECT id FROM demo_professor)
);
DELETE FROM "public_pdf_token" WHERE projeto_id IN (
  SELECT pr.id FROM "projeto" pr WHERE pr.professor_responsavel_id IN (SELECT id FROM demo_professor)
);
DELETE FROM "projeto_professor_participante" WHERE projeto_id IN (
  SELECT pr.id FROM "projeto" pr WHERE pr.professor_responsavel_id IN (SELECT id FROM demo_professor)
);
DELETE FROM "ata_selecao" WHERE projeto_id IN (
  SELECT pr.id FROM "projeto" pr WHERE pr.professor_responsavel_id IN (SELECT id FROM demo_professor)
);

-- Delete projetos
DELETE FROM "projeto" WHERE professor_responsavel_id IN (SELECT id FROM demo_professor);

-- Delete professor and aluno profiles
DELETE FROM "professor" WHERE id IN (SELECT id FROM demo_professor);
DELETE FROM "aluno" WHERE id IN (SELECT id FROM demo_student);

-- Delete from tables with FK to user (nullify or delete)
DELETE FROM "session" WHERE user_id IN (SELECT id FROM demo_users);
DELETE FROM "api_key" WHERE user_id IN (SELECT id FROM demo_users);
DELETE FROM "audit_log" WHERE user_id IN (SELECT id FROM demo_users);
DELETE FROM "notificacao_historico" WHERE remetente_user_id IN (SELECT id FROM demo_users);
DELETE FROM "assinatura_documento" WHERE user_id IN (SELECT id FROM demo_users);
DELETE FROM "projeto_documento" WHERE assinado_por_user_id IN (SELECT id FROM demo_users);
DELETE FROM "projeto_template" WHERE criado_por_user_id IN (SELECT id FROM demo_users);
UPDATE "projeto_template" SET ultima_atualizacao_user_id = NULL WHERE ultima_atualizacao_user_id IN (SELECT id FROM demo_users);
DELETE FROM "relatorio_template" WHERE criado_por_user_id IN (SELECT id FROM demo_users);
DELETE FROM "public_pdf_token" WHERE created_by_user_id IN (SELECT id FROM demo_users);
DELETE FROM "ata_selecao" WHERE gerado_por_user_id IN (SELECT id FROM demo_users);
DELETE FROM "importacao_planejamento" WHERE importado_por_user_id IN (SELECT id FROM demo_users);
DELETE FROM "edital_signature_token" WHERE requested_by_user_id IN (SELECT id FROM demo_users);
DELETE FROM "reminder_execution_log" WHERE executed_by_user_id IN (SELECT id FROM demo_users);

-- Handle editais created by demo users (cascade)
-- First nullify projeto references to these editais
UPDATE "projeto" SET edital_interno_id = NULL WHERE edital_interno_id IN (
  SELECT id FROM "edital" WHERE criado_por_user_id IN (SELECT id FROM demo_users)
);
DELETE FROM "edital_signature_token" WHERE edital_id IN (
  SELECT id FROM "edital" WHERE criado_por_user_id IN (SELECT id FROM demo_users)
);
DELETE FROM "edital" WHERE criado_por_user_id IN (SELECT id FROM demo_users);
-- Nullify chefe_departamento_id if referenced
UPDATE "edital" SET chefe_departamento_id = NULL WHERE chefe_departamento_id IN (SELECT id FROM demo_users);

-- Delete professor_invitation by user
DELETE FROM "professor_invitation" WHERE invited_by_user_id IN (SELECT id FROM demo_users);
DELETE FROM "professor_invitation" WHERE accepted_by_user_id IN (SELECT id FROM demo_users);

-- Finally delete demo users
DELETE FROM "user" WHERE id IN (SELECT id FROM demo_users);

-- Cleanup temp tables
DROP TABLE IF EXISTS demo_users;
DROP TABLE IF EXISTS demo_professor;
DROP TABLE IF EXISTS demo_student;

-- ========================================
-- 2) ALSO DELETE NEW USERS IF EXIST (idempotency)
-- ========================================
DELETE FROM "session" WHERE user_id IN (SELECT id FROM "user" WHERE email IN (
  'luis.sena+admin@ufba.br', 'luis.sena+professor@ufba.br', 'luis.sena+student@ufba.br'
));
DELETE FROM "professor" WHERE user_id IN (SELECT id FROM "user" WHERE email = 'luis.sena+professor@ufba.br');
DELETE FROM "aluno" WHERE user_id IN (SELECT id FROM "user" WHERE email = 'luis.sena+student@ufba.br');
DELETE FROM "user" WHERE email IN (
  'luis.sena+admin@ufba.br', 'luis.sena+professor@ufba.br', 'luis.sena+student@ufba.br'
);

-- ========================================
-- 3) ENSURE DCC DEPARTMENT EXISTS
-- ========================================
INSERT INTO "departamento" (unidade_universitaria, nome, sigla, email)
SELECT 'Instituto de Computação', 'Departamento de Ciência da Computação', 'DCC', 'dcc@ufba.br'
WHERE NOT EXISTS (SELECT 1 FROM "departamento" WHERE sigla = 'DCC');

-- Note: "curso" table was removed in migration 0045

-- ========================================
-- 5) CREATE NEW USERS (with password, requiring onboarding)
-- ========================================

-- Admin user (admins don't need onboarding)
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES (
  'luis.sena+admin',
  'luis.sena+admin@ufba.br',
  'admin',
  crypt('password123', gen_salt('bf', 10)),
  NOW()
);

-- Professor user (needs onboarding - no signature, no cpf, no genero)
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES (
  'luis.sena+professor',
  'luis.sena+professor@ufba.br',
  'professor',
  crypt('password123', gen_salt('bf', 10)),
  NOW()
);

-- Student user (needs onboarding - no cpf, no genero, no comprovante)
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES (
  'luis.sena+student',
  'luis.sena+student@ufba.br',
  'student',
  crypt('password123', gen_salt('bf', 10)),
  NOW()
);

-- ========================================
-- 6) CREATE PROFESSOR PROFILE (minimal - requires onboarding)
-- ========================================
INSERT INTO "professor" (user_id, nome_completo, departamento_id, matricula_siape, regime, email_institucional, account_status)
SELECT
  u.id,
  'Luis Felipe Sena (Professor)',
  d.id,
  '1234567',
  'DE',
  'luis.sena+professor@ufba.br',
  'ACTIVE'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'luis.sena+professor@ufba.br' AND d.sigla = 'DCC';

-- ========================================
-- 7) CREATE STUDENT PROFILE (minimal - requires onboarding)
-- ========================================
INSERT INTO "aluno" (user_id, nome_completo, matricula, "CR", curso_nome, email_institucional)
SELECT
  u.id,
  'Luis Felipe Sena (Student)',
  '202412345',
  7.5,
  'Bacharelado em Ciência da Computação',
  'luis.sena+student@ufba.br'
FROM "user" u
WHERE u.email = 'luis.sena+student@ufba.br';

-- ========================================
-- 8) ENSURE DISCIPLINA MATA37 EXISTS
-- ========================================
INSERT INTO "disciplina" (nome, codigo, departamento_id)
SELECT 'Algoritmos e Programação', 'MATA37', d.id
FROM "departamento" d
WHERE d.sigla = 'DCC'
ON CONFLICT (codigo, departamento_id) DO NOTHING;

-- ========================================
-- 9) ENSURE ACTIVE ENROLLMENT PERIOD (14 days)
-- ========================================
WITH periodo_vars AS (
  SELECT
    EXTRACT(YEAR FROM NOW())::int AS ano,
    (CASE WHEN EXTRACT(MONTH FROM NOW()) <= 6 THEN 'SEMESTRE_1'::semestre_enum ELSE 'SEMESTRE_2'::semestre_enum END) AS semestre,
    (NOW() - INTERVAL '1 day')::date AS data_inicio,
    (NOW() + INTERVAL '14 days')::date AS data_fim
)
INSERT INTO "periodo_inscricao" (semestre, ano, data_inicio, data_fim, total_bolsas_prograd)
SELECT v.semestre, v.ano, v.data_inicio, v.data_fim, 10
FROM periodo_vars v
WHERE NOT EXISTS (
  SELECT 1 FROM "periodo_inscricao" pi WHERE pi.ano = v.ano AND pi.semestre = v.semestre
);

COMMIT;
