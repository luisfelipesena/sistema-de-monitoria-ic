# Checklist de Validação em Produção

**Data:** ___/___/______
**Responsável:** _____________________

---

## 🔧 PRÉ-REQUISITOS

### 1. Validar Banco de Dados de Produção
```bash
# No servidor de produção (via SSH)
dokku postgres:connect sistema-de-monitoria < docs/validate-prod-db.sql

# OU executar manualmente:
dokku postgres:connect sistema-de-monitoria
```

**Verificar:**
- [ ] Tabelas `public_pdf_token`, `reminder_execution_log`, `audit_log` existem
- [ ] Usuários demo existem (`demo.admin@ufba.br`, `demo.professor@ufba.br`, `demo.student@ufba.br`)
- [ ] Departamento DCC existe (id esperado: 12)
- [ ] Disciplinas DCC existem (MATC99, MATC02, etc.)
- [ ] Período de inscrição 2025.1 está ativo

### 2. Aplicar Migrations (se necessário)
```bash
# No servidor de produção
dokku run sistema-de-monitoria npm run db:migrate
```

---

## 📋 VALIDAÇÃO E2E POR FASE

### FASE 1: Planejamento e Criação de Projetos

| # | Ação | Rota | Status |
|---|------|------|--------|
| 1.1 | Login Admin: `demo.admin@ufba.br` / `password123` | `/login` | [ ] |
| 1.2 | Importar Planilha DCC | `/home/admin/import-projects` | [ ] |
| 1.3 | Verificar projetos criados | `/home/admin/manage-projects` | [ ] |
| 1.4 | Login Professor: `demo.professor@ufba.br` | `/login` | [ ] |
| 1.5 | Visualizar projetos pendentes | `/home/professor/dashboard` | [ ] |
| 1.6 | Editar projeto | `/home/professor/dashboard` | [ ] |
| 1.7 | Assinar e submeter projeto | `/home/professor/dashboard` | [ ] |

### FASE 2: Aprovação e Envio para PROGRAD

| # | Ação | Rota | Status |
|---|------|------|--------|
| 2.1 | Admin - Ver projetos submetidos | `/home/admin/manage-projects` | [ ] |
| 2.2 | Aprovar projeto | `/home/admin/manage-projects` | [ ] |
| 2.3 | Gerar planilha PROGRAD (com links PDF) | `/home/admin/relatorios` | [ ] |

### FASE 3: Alocação de Bolsas e Edital

| # | Ação | Rota | Status |
|---|------|------|--------|
| 3.1 | Definir total bolsas PROGRAD | `/home/admin/scholarship-allocation` | [ ] |
| 3.2 | Alocar bolsas por projeto | `/home/admin/scholarship-allocation` | [ ] |
| 3.3 | Notificar professores | `/home/admin/scholarship-allocation` | [ ] |
| 3.4 | Criar edital interno | `/home/admin/edital-management` | [ ] |
| 3.5 | Solicitar assinatura chefe | `/home/admin/edital-management` | [ ] |
| 3.6 | Publicar edital | `/home/admin/edital-management` | [ ] |

### FASE 4: Inscrições e Seleção

| # | Ação | Rota | Status |
|---|------|------|--------|
| 4.1 | Login Aluno: `demo.student@ufba.br` | `/login` | [ ] |
| 4.2 | Ver vagas disponíveis | `/home/student/vagas` | [ ] |
| 4.3 | Realizar inscrição | `/home/student/inscricao-monitoria` | [ ] |
| 4.4 | Professor - Ver candidatos | `/home/professor/candidatos` | [ ] |
| 4.5 | Avaliar candidatos | `/home/professor/grade-applications` | [ ] |
| 4.6 | Selecionar monitores | `/home/professor/select-monitors` | [ ] |
| 4.7 | Publicar resultados | `/home/professor/publicar-resultados` | [ ] |
| 4.8 | Aluno - Ver resultado | `/home/student/resultados` | [ ] |
| 4.9 | Aceitar monitoria | `/home/student/resultados` | [ ] |

### FASE 5: Consolidação

| # | Ação | Rota | Status |
|---|------|------|--------|
| 5.1 | Admin - Consolidação PROGRAD | `/home/admin/consolidacao-prograd` | [ ] |
| 5.2 | Gerar planilha bolsistas | `/home/admin/consolidacao-prograd` | [ ] |
| 5.3 | Gerar planilha voluntários | `/home/admin/consolidacao-prograd` | [ ] |

### FASE 6: Relatórios e Certificados

| # | Ação | Rota | Status |
|---|------|------|--------|
| 6.1 | Admin - Iniciar relatórios | `/home/admin/validacao-relatorios` | [ ] |
| 6.2 | Professor - Gerar relatório | `/home/professor/relatorios-finais` | [ ] |
| 6.3 | Aluno - Assinar relatório | `/home/student/relatorios` | [ ] |
| 6.4 | Admin - Gerar certificados | `/home/admin/consolidacao-prograd` | [ ] |

---

## 🆕 FUNCIONALIDADES NOVAS (GAPs)

### GAP-001: Links PDF Públicos
| # | Ação | Status |
|---|------|--------|
| 1 | Gerar planilha com links em `/home/admin/relatorios` | [ ] |
| 2 | Testar link público (sem autenticação) | [ ] |
| 3 | Verificar token expira após 30 dias | [ ] |

### GAP-002: Certificados
| # | Ação | Status |
|---|------|--------|
| 1 | Admin notifica sobre certificados | [ ] |
| 2 | Aluno baixa certificado PDF | [ ] |

### GAP-003: Notificações Proativas
| # | Ação | Status |
|---|------|--------|
| 1 | Admin acessa Dashboard | [ ] |
| 2 | Toast aparece com lembretes enviados | [ ] |
| 3 | Verificar em `/home/admin/notificacoes` | [ ] |
| 4 | Testar execução manual | [ ] |

---

## ✅ FUNCIONALIDADES AUXILIARES

| Funcionalidade | Rota | Status |
|----------------|------|--------|
| Equivalências de Disciplinas | `/home/admin/equivalencias` | [ ] |
| Configuração de Emails | `/home/admin/configuracoes` | [ ] |
| Templates de Projeto | `/home/admin/projeto-templates` | [ ] |
| Atas de Seleção | `/home/professor/atas-selecao` | [ ] |
| Termos de Compromisso | `/home/professor/termos-compromisso` | [ ] |
| Analytics | `/home/admin/analytics` | [ ] |
| Logs de Auditoria | `/home/admin/audit-logs` | [ ] |

---

## 📊 VERIFICAÇÃO FINAL

```sql
-- Executar no banco após testes:

-- Verificar projetos criados
SELECT id, titulo, status FROM projeto ORDER BY id DESC LIMIT 5;

-- Verificar inscrições
SELECT id, projeto_id, aluno_id, status FROM inscricao ORDER BY id DESC LIMIT 5;

-- Verificar vagas efetivadas
SELECT id, projeto_id, aluno_id, tipo FROM vaga ORDER BY id DESC LIMIT 5;

-- Verificar execuções de lembretes
SELECT * FROM reminder_execution_log ORDER BY executed_at DESC LIMIT 10;

-- Verificar tokens PDF
SELECT id, projeto_id, expires_at FROM public_pdf_token ORDER BY id DESC LIMIT 5;

-- Verificar audit logs
SELECT id, action, entity_type, timestamp FROM audit_log ORDER BY id DESC LIMIT 10;
```

---

## 📝 OBSERVAÇÕES

_Espaço para anotações durante a validação:_

```




```

---

**Validação concluída em:** ___/___/______ às ___:___

**Assinatura:** _____________________
