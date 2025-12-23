-- =============================================
-- SEED: IC-UFBA Professors Import
-- Generated: 2025-12-16
-- Source: https://computacao.ufba.br/pt-br/docentes
-- =============================================
-- This migration seeds all IC-UFBA professors from the website.
-- Professors will need to use "Forgot Password" to set their password
-- and complete onboarding with remaining required fields.
--
-- Fields pre-filled: nomeCompleto, departamentoId, regime, tipoProfessor, accountStatus
-- Fields to complete in onboarding: matriculaSiape, cpf, genero, assinatura
-- =============================================

BEGIN;

-- Ensure DCC department exists
INSERT INTO "departamento" (unidade_universitaria, nome, sigla, email)
SELECT 'Instituto de Computação', 'Departamento de Ciência da Computação', 'DCC', 'dcc@ufba.br'
WHERE NOT EXISTS (SELECT 1 FROM "departamento" WHERE sigla = 'DCC');

-- Ensure DCI department exists
INSERT INTO "departamento" (unidade_universitaria, nome, sigla, email)
SELECT 'Instituto de Computação', 'Departamento de Computação Interdisciplinar', 'DCI', 'dci@ufba.br'
WHERE NOT EXISTS (SELECT 1 FROM "departamento" WHERE sigla = 'DCI');

-- ========================================
-- DCC Professors (26 total + 1 to verify)
-- ========================================

-- Ivan do Carmo Machado (Diretor do IC)
-- NOTE: Email not found on website, using common pattern. Please verify before running.
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('ivan_machado', 'ivan.machado@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Ivan do Carmo Machado', d.id, 'DE', 'EFETIVO', 'PENDING', 'ivan.machado@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'ivan.machado@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Antonio Lopes Apolinario Junior
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('antonio_apolinario', 'antonio.apolinario@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Antonio Lopes Apolinario Junior', d.id, 'DE', 'EFETIVO', 'PENDING', 'antonio.apolinario@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'antonio.apolinario@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Bruno Pereira dos Santos
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('bruno_ps', 'bruno.ps@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Bruno Pereira dos Santos', d.id, 'DE', 'EFETIVO', 'PENDING', 'bruno.ps@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'bruno.ps@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Cássio Vinicius Serafim Prazeres
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('prazeres', 'prazeres@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Cássio Vinicius Serafim Prazeres', d.id, 'DE', 'EFETIVO', 'PENDING', 'prazeres@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'prazeres@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Christina von Flach Garcia Chavez
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('flach', 'flach@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Christina von Flach Garcia Chavez', d.id, 'DE', 'EFETIVO', 'PENDING', 'flach@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'flach@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Cláudio Nogueira Sant'Anna
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('santanna', 'santanna@dcc.ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Cláudio Nogueira Sant''Anna', d.id, 'DE', 'EFETIVO', 'PENDING', 'santanna@dcc.ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'santanna@dcc.ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Daniela Barreiro Claro
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('dclaro', 'dclaro@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Daniela Barreiro Claro', d.id, 'DE', 'EFETIVO', 'PENDING', 'dclaro@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'dclaro@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Danilo Barbosa Coimbra
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('coimbra_danilo', 'coimbra.danilo@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Danilo Barbosa Coimbra', d.id, 'DE', 'EFETIVO', 'PENDING', 'coimbra.danilo@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'coimbra.danilo@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Eduardo Santana de Almeida
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('esa', 'esa@dcc.ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Eduardo Santana de Almeida', d.id, 'DE', 'EFETIVO', 'PENDING', 'esa@dcc.ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'esa@dcc.ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Frederico Araújo Durão
-- NOTE: Correct email is fdurao@ufba.br (not fduaro - typo on UFBA website)
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('fdurao', 'fdurao@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Frederico Araújo Durão', d.id, 'DE', 'EFETIVO', 'PENDING', 'fdurao@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'fdurao@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- George Marconi de Araújo Lima
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('gmlima', 'gmlima@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'George Marconi de Araújo Lima', d.id, 'DE', 'EFETIVO', 'PENDING', 'gmlima@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'gmlima@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Gustavo Bittencourt Figueiredo
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('gustavobf', 'gustavobf@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Gustavo Bittencourt Figueiredo', d.id, 'DE', 'EFETIVO', 'PENDING', 'gustavobf@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'gustavobf@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Islame Felipe da Costa Fernandes
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('islame_felipe', 'islame.felipe@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Islame Felipe da Costa Fernandes', d.id, 'DE', 'EFETIVO', 'PENDING', 'islame.felipe@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'islame.felipe@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Karl Apaza Agüero
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('kaguero', 'kaguero@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Karl Apaza Agüero', d.id, 'DE', 'EFETIVO', 'PENDING', 'kaguero@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'kaguero@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Leobino Nascimento Sampaio
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('leobino', 'leobino@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Leobino Nascimento Sampaio', d.id, 'DE', 'EFETIVO', 'PENDING', 'leobino@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'leobino@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Luciano Rebouças de Oliveira
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('lrebouca', 'lrebouca@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Luciano Rebouças de Oliveira', d.id, '20H', 'EFETIVO', 'PENDING', 'lrebouca@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'lrebouca@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Manoel Gomes de Mendonça Neto
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('manoel_mendonca', 'manoel.mendonca@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Manoel Gomes de Mendonça Neto', d.id, 'DE', 'EFETIVO', 'PENDING', 'manoel.mendonca@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'manoel.mendonca@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Maycon Leone Maciel Peixoto
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('maycon_leone', 'maycon.leone@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Maycon Leone Maciel Peixoto', d.id, 'DE', 'EFETIVO', 'PENDING', 'maycon.leone@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'maycon.leone@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Rafael Augusto de Melo
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('rafael_melo', 'rafael.melo@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Rafael Augusto de Melo', d.id, 'DE', 'EFETIVO', 'PENDING', 'rafael.melo@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'rafael.melo@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Ricardo Araújo Rios
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('ricardoar', 'ricardoar@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Ricardo Araújo Rios', d.id, 'DE', 'EFETIVO', 'PENDING', 'ricardoar@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'ricardoar@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Rita Suzana Pitangueira Maciel
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('ritasuzana', 'ritasuzana@dcc.ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Rita Suzana Pitangueira Maciel', d.id, 'DE', 'EFETIVO', 'PENDING', 'ritasuzana@dcc.ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'ritasuzana@dcc.ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Robespierre Dantas da Rocha Pita
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('robespierre_pita', 'robespierre.pita@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Robespierre Dantas da Rocha Pita', d.id, 'DE', 'EFETIVO', 'PENDING', 'robespierre.pita@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'robespierre.pita@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Rodrigo Rocha Gomes e Souza
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('rodrigorgs', 'rodrigorgs@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Rodrigo Rocha Gomes e Souza', d.id, 'DE', 'EFETIVO', 'PENDING', 'rodrigorgs@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'rodrigorgs@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Rubisley de Paula Lemes
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('rubisley', 'rubisley@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Rubisley de Paula Lemes', d.id, 'DE', 'EFETIVO', 'PENDING', 'rubisley@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'rubisley@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Steffen Lewitzka
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('steffen_lewitzka', 'steffen.lewitzka@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Steffen Lewitzka', d.id, 'DE', 'EFETIVO', 'PENDING', 'steffen.lewitzka@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'steffen.lewitzka@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Tatiane Nogueira Rios
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('tatianenogueira', 'tatianenogueira@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Tatiane Nogueira Rios', d.id, 'DE', 'EFETIVO', 'PENDING', 'tatianenogueira@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'tatianenogueira@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Vaninha Vieira dos Santos
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('vaninha', 'vaninha@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Vaninha Vieira dos Santos', d.id, 'DE', 'EFETIVO', 'PENDING', 'vaninha@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'vaninha@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- ========================================
-- DCI Professors (moved to DCC as requested - 10 total)
-- ========================================

-- Alírio Santos de Sá
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('aliriosa', 'aliriosa@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Alírio Santos de Sá', d.id, 'DE', 'EFETIVO', 'PENDING', 'aliriosa@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'aliriosa@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Débora Abdalla Santos
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('abdalla', 'abdalla@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Débora Abdalla Santos', d.id, 'DE', 'EFETIVO', 'PENDING', 'abdalla@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'abdalla@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Flávio Morais de Assis Silva
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('fassis', 'fassis@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Flávio Morais de Assis Silva', d.id, 'DE', 'EFETIVO', 'PENDING', 'fassis@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'fassis@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Laís do Nascimento Salvador
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('laisns', 'laisns@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Laís do Nascimento Salvador', d.id, 'DE', 'EFETIVO', 'PENDING', 'laisns@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'laisns@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Luma da Rocha Seixas
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('seixas_luma', 'seixas.luma@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Luma da Rocha Seixas', d.id, 'DE', 'EFETIVO', 'PENDING', 'seixas.luma@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'seixas.luma@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Marlo Vieira dos Santos e Souza
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('msouza1', 'msouza1@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Marlo Vieira dos Santos e Souza', d.id, 'DE', 'EFETIVO', 'PENDING', 'msouza1@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'msouza1@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Paul Denis Etienne Regnier
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('pregnier', 'pregnier@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Paul Denis Etienne Regnier', d.id, 'DE', 'EFETIVO', 'PENDING', 'pregnier@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'pregnier@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Raimundo José de Araújo Macêdo
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('macedo', 'macedo@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Raimundo José de Araújo Macêdo', d.id, 'DE', 'EFETIVO', 'PENDING', 'macedo@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'macedo@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Roberto Freitas Parente
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('roberto_parente', 'roberto.parente@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Roberto Freitas Parente', d.id, 'DE', 'EFETIVO', 'PENDING', 'roberto.parente@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'roberto.parente@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

-- Sérgio Gorender
INSERT INTO "user" (username, email, role, password_hash, email_verified_at)
VALUES ('gorender', 'gorender@ufba.br', 'professor', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "professor" (user_id, nome_completo, departamento_id, regime, tipo_professor, account_status, email_institucional)
SELECT u.id, 'Sérgio Gorender', d.id, 'DE', 'EFETIVO', 'PENDING', 'gorender@ufba.br'
FROM "user" u
CROSS JOIN "departamento" d
WHERE u.email = 'gorender@ufba.br' AND d.sigla = 'DCC'
  AND NOT EXISTS (SELECT 1 FROM "professor" p WHERE p.user_id = u.id);

COMMIT;

-- =============================================
-- Summary:
-- Total professors: 37 (all assigned to DCC)
-- Regime DE: 36
-- Regime 20H: 1 (Luciano Rebouças de Oliveira)
-- Note: Ivan do Carmo Machado email needs verification
--
-- Next steps for professors:
-- 1. Go to /auth/login
-- 2. Click "Esqueci minha senha" (Forgot password)
-- 3. Set password via email link
-- 4. Complete onboarding with: SIAPE, CPF, Gênero, Assinatura
-- =============================================
