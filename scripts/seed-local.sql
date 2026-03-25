-- Fast local seed: runs in ~100ms via docker compose exec db psql
-- Usage: docker compose exec db psql -U postgres -d sistema_de_monitoria_ic -f /backup/seed-local.sql
-- Or:    npm run db:seed:fast

-- bcrypt hash of 'password123' (12 rounds)
\set pw '''$2a$12$iOELoHu8fVQn55jGA2uATez2co/K6rL163rY5F6aaNwrEytZz9P2W'''

BEGIN;

-- Departamento DCC (idempotent)
INSERT INTO departamento (unidade_universitaria, nome, sigla, email)
VALUES ('Instituto de Computacao', 'Departamento de Ciencia da Computacao', 'DCC', 'dcc@ufba.br')
ON CONFLICT DO NOTHING;

-- Admin user
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('admin_local', 'admin@ufba.br', 'admin', :pw, NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = :pw, email_verified_at = COALESCE("user".email_verified_at, NOW());

-- luis.sena+admin (auto-promoted to admin via admins.ts)
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('luis.sena+admin', 'luis.sena+admin@ufba.br', 'admin', :pw, NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = :pw, email_verified_at = COALESCE("user".email_verified_at, NOW());

-- Professor user
INSERT INTO "user" (username, email, role, password_hash, email_verified_at,
  assinatura_default, data_assinatura_default)
VALUES ('prof_local', 'professor@ufba.br', 'professor', :pw, NOW(),
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = :pw, email_verified_at = COALESCE("user".email_verified_at, NOW());

-- Professor profile (skip onboarding)
INSERT INTO professor (user_id, nome_completo, departamento_id, matricula_siape, regime, email_institucional, cpf, genero)
SELECT u.id, 'Joao Silva Professor',
  (SELECT id FROM departamento WHERE sigla = 'DCC' LIMIT 1),
  '1234567', 'DE', 'professor@ufba.br', '12345678901', 'MASCULINO'
FROM "user" u WHERE u.email = 'professor@ufba.br'
ON CONFLICT (user_id) DO NOTHING;

-- Student user
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('student_local', 'student@ufba.br', 'student', :pw, NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = :pw, email_verified_at = COALESCE("user".email_verified_at, NOW());

-- Student profile (skip onboarding)
INSERT INTO aluno (user_id, nome_completo, matricula, "CR", email_institucional, cpf, genero, comprovante_matricula_file_id)
SELECT u.id, 'Maria Santos Estudante', '202301234', 8.5, 'student@ufba.br', '98765432109', 'FEMININO', 'test-comprovante'
FROM "user" u WHERE u.email = 'student@ufba.br'
ON CONFLICT (user_id) DO NOTHING;

-- Test disciplines (unique on codigo + departamento_id)
INSERT INTO disciplina (nome, codigo, departamento_id)
SELECT d.nome, d.codigo, (SELECT id FROM departamento WHERE sigla = 'DCC' LIMIT 1)
FROM (VALUES
  ('Estruturas de Dados', 'MATA40'),
  ('Algoritmos e Programacao', 'MATA37'),
  ('Banco de Dados', 'MATA60'),
  ('Programacao Orientada a Objetos', 'MATA55'),
  ('Sistemas Operacionais', 'MATA58'),
  ('Redes de Computadores', 'MATA59'),
  ('Engenharia de Software', 'MATA62'),
  ('Inteligencia Artificial', 'MATA63')
) AS d(nome, codigo)
ON CONFLICT (codigo, departamento_id) DO NOTHING;

COMMIT;

-- Summary
SELECT role, COUNT(*) as total FROM "user" GROUP BY role ORDER BY role;
SELECT 'Seed complete. Login: admin@ufba.br / professor@ufba.br / student@ufba.br / luis.sena+admin@ufba.br  |  password: password123' AS info;
