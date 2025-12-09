-- =====================================================
-- SCRIPT DE VALIDAÇÃO DO BANCO DE PRODUÇÃO
-- Execute via: dokku postgres:connect sistema-de-monitoria < docs/validate-prod-db.sql
-- Ou: ssh usuario@servidor "dokku postgres:connect sistema-de-monitoria" < docs/validate-prod-db.sql
-- =====================================================

\echo '=============================================='
\echo '1. TABELAS EXISTENTES'
\echo '=============================================='
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

\echo ''
\echo '=============================================='
\echo '2. TABELAS NOVAS (GAPs implementados)'
\echo '=============================================='
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('public_pdf_token', 'reminder_execution_log', 'audit_log');

\echo ''
\echo '=============================================='
\echo '3. USUÁRIOS DE DEMO (para validação E2E)'
\echo '=============================================='
SELECT id, username, email, role 
FROM "user" 
WHERE email LIKE '%demo%' OR username LIKE 'demo%'
ORDER BY role;

\echo ''
\echo '=============================================='
\echo '4. PROFESSORES CADASTRADOS'
\echo '=============================================='
SELECT p.id, p.nome_completo, u.email, d.sigla as depto
FROM professor p 
JOIN "user" u ON p.user_id = u.id 
LEFT JOIN departamento d ON p.departamento_id = d.id
ORDER BY p.id;

\echo ''
\echo '=============================================='
\echo '5. DEPARTAMENTOS'
\echo '=============================================='
SELECT id, sigla, nome FROM departamento ORDER BY id;

\echo ''
\echo '=============================================='
\echo '6. DISCIPLINAS DCC'
\echo '=============================================='
SELECT d.codigo, d.nome 
FROM disciplina d 
JOIN departamento dep ON d.departamento_id = dep.id 
WHERE dep.sigla = 'DCC'
ORDER BY d.codigo;

\echo ''
\echo '=============================================='
\echo '7. PERÍODOS DE INSCRIÇÃO ATIVOS'
\echo '=============================================='
SELECT id, ano, semestre, data_inicio, data_fim, total_bolsas_prograd
FROM periodo_inscricao 
WHERE data_fim > NOW()
ORDER BY ano DESC, semestre;

\echo ''
\echo '=============================================='
\echo '8. PROJETOS (últimos 10)'
\echo '=============================================='
SELECT id, titulo, status, ano, semestre 
FROM projeto 
ORDER BY id DESC 
LIMIT 10;

\echo ''
\echo '=============================================='
\echo '9. EDITAIS'
\echo '=============================================='
SELECT id, numero_edital, publicado, chefe_assinou_em 
FROM edital 
ORDER BY id DESC 
LIMIT 5;

\echo ''
\echo '=============================================='
\echo '10. ALUNOS CADASTRADOS'
\echo '=============================================='
SELECT a.id, a.nome_completo, u.email, a.matricula
FROM aluno a 
JOIN "user" u ON a.user_id = u.id
ORDER BY a.id
LIMIT 10;

\echo ''
\echo '=============================================='
\echo 'VALIDAÇÃO CONCLUÍDA!'
\echo '=============================================='
