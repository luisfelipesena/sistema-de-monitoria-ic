-- =============================================
-- DEMO SEED FOR TCC TESTING (PRODUCTION READY)
-- =============================================
-- Creates complete testing environment with:
-- - DCC department, BCC course, MATA37 discipline
-- - 3 demo users with complete onboarding (bypass onboarding screen)
-- - Active enrollment period (14 days)
-- - 1 approved project with 2 scholarships available
--
-- CREDENTIALS:
--   Admin:     demo.admin@ufba.br / password123
--   Professor: demo.professor@ufba.br / password123
--   Student:   demo.student@ufba.br / password123
-- =============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- 1) DEPARTAMENTO DCC
-- ========================================
INSERT INTO "departamento" (unidade_universitaria, nome, sigla, email)
SELECT 'Instituto de Computação', 'Departamento de Ciência da Computação', 'DCC', 'dcc@ufba.br'
WHERE NOT EXISTS (SELECT 1 FROM "departamento" WHERE sigla = 'DCC');

-- ========================================
-- 2) CURSO BCC
-- ========================================
INSERT INTO "curso" (nome, codigo, tipo, modalidade, duracao, departamento_id, carga_horaria, status)
SELECT
  'Bacharelado em Ciência da Computação',
  101,
  'BACHARELADO',
  'PRESENCIAL',
  8,
  d.id,
  3000,
  'ATIVO'
FROM "departamento" d
WHERE d.sigla = 'DCC'
  AND NOT EXISTS (
    SELECT 1 FROM "curso" c WHERE c.codigo = 101 AND c.departamento_id = d.id
  );

-- ========================================
-- 3) DEMO USERS
-- ========================================

-- Admin
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('demo.admin', 'demo.admin@ufba.br', 'admin', crypt('password123', gen_salt('bf', 10)), NOW())
ON CONFLICT (email) DO UPDATE SET email_verified_at = NOW();

-- Professor (with signature for onboarding bypass)
INSERT INTO "user" (username, email, role, password_hash, email_verified_at, assinatura_default, data_assinatura_default)
VALUES (
  'demo.professor',
  'demo.professor@ufba.br',
  'professor',
  crypt('password123', gen_salt('bf', 10)),
  NOW(),
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  email_verified_at = NOW(),
  assinatura_default = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  data_assinatura_default = NOW();

-- Student
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('demo.student', 'demo.student@ufba.br', 'student', crypt('password123', gen_salt('bf', 10)), NOW())
ON CONFLICT (email) DO UPDATE SET email_verified_at = NOW();

-- ========================================
-- 4) PROFESSOR PROFILE (with CPF - required for onboarding)
-- ========================================
INSERT INTO "professor" (user_id, nome_completo, departamento_id, matricula_siape, regime, email_institucional, cpf, genero)
SELECT u.id, 'Professor Demo', d.id, '9999999', 'DE', 'demo.professor@ufba.br', '12345678901', 'MASCULINO'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'demo.professor@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

UPDATE "professor" p
SET cpf = '12345678901', genero = 'MASCULINO'
FROM "user" u
WHERE p.user_id = u.id AND u.email = 'demo.professor@ufba.br' AND (p.cpf IS NULL OR p.genero IS NULL);

-- ========================================
-- 5) STUDENT PROFILE (with CPF + document - required for onboarding)
-- ========================================
INSERT INTO "aluno" (user_id, nome_completo, matricula, "CR", curso_id, email_institucional, genero, cpf, comprovante_matricula_file_id)
SELECT u.id, 'Student Demo', '202399999', 8.2, c.id, 'demo.student@ufba.br', 'FEMININO', '98765432100', 'demo-comprovante-fake-id'
FROM "user" u
CROSS JOIN "curso" c
CROSS JOIN "departamento" d
WHERE u.email = 'demo.student@ufba.br' AND c.codigo = 101 AND c.departamento_id = d.id AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "aluno" a WHERE a.user_id = u.id);

UPDATE "aluno" a
SET cpf = '98765432100', comprovante_matricula_file_id = 'demo-comprovante-fake-id'
FROM "user" u
WHERE a.user_id = u.id AND u.email = 'demo.student@ufba.br' AND (a.cpf IS NULL OR a.comprovante_matricula_file_id IS NULL);

-- ========================================
-- 6) DISCIPLINA MATA37
-- ========================================
INSERT INTO "disciplina" (nome, codigo, turma, departamento_id)
SELECT 'Algoritmos e Programação', 'MATA37', 'T01', d.id
FROM "departamento" d
WHERE d.sigla = 'DCC'
ON CONFLICT (codigo, departamento_id) DO NOTHING;

-- ========================================
-- 7) PERÍODO DE INSCRIÇÃO ATIVO (14 days)
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

-- ========================================
-- 8) PROJETO APROVADO COM BOLSAS
-- ========================================
WITH projeto_vars AS (
  SELECT
    EXTRACT(YEAR FROM NOW())::int AS ano,
    (CASE WHEN EXTRACT(MONTH FROM NOW()) <= 6 THEN 'SEMESTRE_1'::semestre_enum ELSE 'SEMESTRE_2'::semestre_enum END) AS semestre
),
prof_data AS (
  SELECT p.id AS professor_id, p.departamento_id
  FROM "professor" p
  JOIN "user" u ON u.id = p.user_id
  WHERE u.email = 'demo.professor@ufba.br'
  LIMIT 1
),
disc_data AS (
  SELECT di.id AS disciplina_id, di.nome AS disciplina_nome
  FROM "disciplina" di
  JOIN "departamento" d ON d.id = di.departamento_id
  WHERE di.codigo = 'MATA37' AND d.sigla = 'DCC'
  LIMIT 1
)
INSERT INTO "projeto" (
  departamento_id, ano, semestre, tipo_proposicao, bolsas_solicitadas, voluntarios_solicitados,
  bolsas_disponibilizadas, carga_horaria_semana, numero_semanas, publico_alvo, estimativa_pessoas_benificiadas,
  professor_responsavel_id, titulo, disciplina_nome, descricao, professores_participantes, status, feedback_admin
)
SELECT
  prof_data.departamento_id,
  projeto_vars.ano,
  projeto_vars.semestre,
  'INDIVIDUAL',
  2,
  1,
  2, -- bolsas disponibilizadas
  12,
  16,
  'Alunos de graduação interessados em programação',
  100,
  prof_data.professor_id,
  'Projeto TCC Demo - MATA37',
  disc_data.disciplina_nome,
  'Atividades de apoio: resolução de exercícios, plantões e monitorias.',
  NULL,
  'APPROVED',
  'Projeto aprovado para testes do TCC'
FROM projeto_vars, prof_data, disc_data
WHERE NOT EXISTS (
  SELECT 1 FROM "projeto" pr
  WHERE pr.titulo = 'Projeto TCC Demo - MATA37' AND pr.ano = projeto_vars.ano AND pr.semestre = projeto_vars.semestre AND pr.deleted_at IS NULL
);

-- ========================================
-- 9) VINCULAR DISCIPLINA AO PROJETO
-- ========================================
WITH projeto_vars AS (
  SELECT EXTRACT(YEAR FROM NOW())::int AS ano, (CASE WHEN EXTRACT(MONTH FROM NOW()) <= 6 THEN 'SEMESTRE_1'::semestre_enum ELSE 'SEMESTRE_2'::semestre_enum END) AS semestre
),
projeto_data AS (
  SELECT pr.id AS projeto_id FROM "projeto" pr CROSS JOIN projeto_vars v
  WHERE pr.titulo = 'Projeto TCC Demo - MATA37' AND pr.ano = v.ano AND pr.semestre = v.semestre AND pr.deleted_at IS NULL
  LIMIT 1
),
disc_data AS (
  SELECT di.id AS disciplina_id FROM "disciplina" di JOIN "departamento" d ON d.id = di.departamento_id
  WHERE di.codigo = 'MATA37' AND d.sigla = 'DCC'
  LIMIT 1
)
INSERT INTO "projeto_disciplina" (projeto_id, disciplina_id)
SELECT projeto_data.projeto_id, disc_data.disciplina_id
FROM projeto_data, disc_data
WHERE NOT EXISTS (
  SELECT 1 FROM "projeto_disciplina" pd WHERE pd.projeto_id = projeto_data.projeto_id AND pd.disciplina_id = disc_data.disciplina_id
);

COMMIT;
