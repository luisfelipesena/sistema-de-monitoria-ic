# Validação E2E Completa - Sistema de Monitoria IC

**Baseado em**: [Programa de Monitoria UFBA - PROGRAD](https://prograd.ufba.br/programa-de-monitoria)
**Valor da bolsa 2025**: R$ 700,00 (210 bolsas disponíveis por semestre)

---

## Credenciais de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | demo.admin@ufba.br | password123 |
| Professor | demo.professor@ufba.br | password123 |
| Aluno | demo.student@ufba.br | password123 |

---

## Estado Atual do Banco (Verificado)

### Usuários
- `admin` (admin@ufba.br) - Admin
- `demo.admin` (demo.admin@ufba.br) - Admin
- `demo.professor` (demo.professor@ufba.br) - Professor (Professor Demo)
- `demo.student` (demo.student@ufba.br) - Student
- Carlos Silva, Ana Pereira, João Santos, Maria Costa - Professores

### Departamentos
- DCC (id: 12) - Departamento de Ciência da Computação
- MAT (id: 13), FIS (id: 15), COMP (id: 16)

### Disciplinas DCC
- MATC99 - Introdução à Programação
- MATC02 - Estruturas de Dados
- MATC04 - Banco de Dados
- MATC05 - Engenharia de Software
- MATC06 - Redes de Computadores

### Período de Inscrição
- 2025.1: 01/01/2025 - 31/12/2025 (ativo para testes)

---

## FASE 1: Planejamento e Criação de Projetos

### 1.1 Admin - Importar Planejamento via Planilha

> **Rota**: `/home/admin/import-projects`
> **Sidebar**: Projetos → Importar Planejamento
> **Arquivo de teste**: `docs/test-import-2025-1.csv`

**Formato da planilha DCC (colunas necessárias):**
- `DISCIPLINA` - Código (ex: MATC02)
- `TURMA` - Número da turma
- `NOME DISCIPLINA` - Nome completo
- `DOCENTE` - Nome do professor (última coluna)
- `CH` - Carga horária (opcional)

**Passos:**
- [ ] Login como `demo.admin@ufba.br`
- [ ] Acessar Projetos → Importar Planejamento
- [ ] Clicar em "Importar Planilha"
- [ ] Selecionar Ano: 2025, Semestre: 1º Semestre
- [ ] Upload do arquivo `docs/test-import-2025-1.csv`
- [ ] Clicar "Importar"
- [ ] Aguardar processamento
- [ ] Verificar resultado:
  - Projetos criados: 1 (MATC02)
  - Professor Demo notificado por email
  - Status do projeto: `PENDING_PROFESSOR_SIGNATURE`

**Comportamento do sistema:**
- Identifica automaticamente projetos individuais (1 professor) vs coletivos (múltiplos)
- Cria projetos com base em templates de semestres anteriores (se existirem)
- Envia emails automáticos aos professores

**Validação no banco:**
```sql
SELECT id, titulo, status, professor_responsavel_id FROM projeto
WHERE ano = 2025 AND semestre = 'SEMESTRE_1' ORDER BY id DESC;
```

**Lógica de busca de professores:**
- Sistema busca por `nome_completo` usando fuzzy matching
- "Professor Demo" → encontra professor id=24

---

### 1.2 Professor - Visualizar Projetos Pendentes

> **Rota**: `/home/professor/dashboard`
> **Sidebar**: Meus Projetos → Dashboard

- [ ] Login como `demo.professor@ufba.br`
- [ ] Visualizar projetos com status "Aguardando Assinatura"
- [ ] Ver projeto importado: MATC02

---

### 1.3 Professor - Criar/Editar Template (se necessário)

> **Rota**: `/home/professor/dashboard`

Para disciplinas sem template:
- [ ] Criar template padrão (título, descrição, atividades, carga horária)
- [ ] Template será usado em importações futuras

---

### 1.4 Professor - Editar e Assinar Projeto

- [ ] Selecionar projeto MATC02
- [ ] Clicar "Editar"
- [ ] Ajustar campos:
  - Título
  - Descrição/Objetivos
  - Bolsas solicitadas (ex: 2)
  - Voluntários solicitados (ex: 1)
  - Atividades do monitor
- [ ] Salvar alterações
- [ ] Clicar "Assinar e Submeter"
- [ ] Desenhar assinatura no canvas digital
- [ ] Confirmar assinatura
- [ ] Status muda para `SUBMITTED`

**Resultado esperado:**
- PDF gerado e salvo no MinIO
- Assinatura registrada em `projeto.assinatura_professor`
- Email enviado ao admin

---

## FASE 2: Aprovação e Envio para Instituto

### 2.1 Admin - Listar Projetos Submetidos

> **Rota**: `/home/admin/manage-projects`
> **Sidebar**: Projetos → Gerenciar Projetos

- [ ] Login como `demo.admin@ufba.br`
- [ ] Filtrar por Ano: 2025, Semestre: 1
- [ ] Filtrar status: "Aguardando Aprovação" (`SUBMITTED`)

---

### 2.2 Admin - Aprovar/Rejeitar Projeto

- [ ] Clicar no projeto para detalhes
- [ ] Visualizar PDF com assinatura do professor
- [ ] Clicar "Aprovar" (ou "Rejeitar" com feedback)
- [ ] Status muda para `APPROVED`

**Resultado esperado:** Projeto visível em "Vagas Disponíveis" para alunos.

---

### 2.3 Admin - Gerar Planilha para Instituto

> **Rota**: `/home/admin/planilha-prograd`
> **Sidebar**: Sistema → Planilha PROGRAD

- [ ] Selecionar período 2025.1
- [ ] Gerar planilha Excel com projetos aprovados
- [ ] Planilha contém links públicos para PDFs (tokens de acesso)
- [ ] Enviar planilha por email ao INSTITUTO (IC)

**Nota:** Instituto encaminha para PROGRAD solicitando bolsas. PROGRAD responde via email geral com total de bolsas por instituto.

---

## FASE 3: Alocação de Bolsas e Edital Interno DCC

### 3.1 Admin - Definir Total de Bolsas PROGRAD

> **Rota**: `/home/admin/scholarship-allocation`
> **Sidebar**: Projetos → Alocação de Bolsas

- [ ] Selecionar período 2025.1
- [ ] Definir total de bolsas informado pela PROGRAD (ex: 10)
- [ ] Sistema atualiza `periodo_inscricao.total_bolsas_prograd`

---

### 3.2 Admin - Alocar Bolsas por Projeto

- [ ] Ver todos os projetos aprovados
- [ ] Alocar bolsas conforme decisão da comissão (ex: MATC02 = 2 bolsas)
- [ ] Sistema valida: soma ≤ total PROGRAD
- [ ] Salvar alocação

**Campo atualizado:** `projeto.bolsas_disponibilizadas`

---

### 3.3 Admin - Notificar Professores

- [ ] Clicar "Notificar Professores"
- [ ] Email enviado a TODOS os professores que submeteram projetos
- [ ] Email contém tabela de bolsas alocadas

---

### 3.4 Professor - Configurar Projeto para Edital

> **Rota**: `/home/professor/dashboard`

- [ ] Ver bolsas alocadas (campo NÃO editável)
- [ ] Definir voluntários adicionais (campo editável)
- [ ] Escolher data/horário da seleção (entre 2-3 opções do admin)
- [ ] Editar/confirmar pontos da prova (modelo sugerido)
- [ ] Editar/confirmar bibliografia (modelo sugerido)

---

### 3.5 Admin - Criar Edital Interno DCC

> **Rota**: `/home/admin/edital-management`
> **Sidebar**: Editais → Gerenciar Editais

- [ ] Clicar "Novo Edital"
- [ ] Preencher:
  - Número do edital: "001/2025"
  - Período de inscrição
  - 2-3 datas possíveis para provas
  - Data limite divulgação resultado
  - Valor bolsa: R$ 700,00
- [ ] Salvar

---

### 3.6 Admin - Solicitar Assinatura do Chefe

- [ ] Selecionar edital criado
- [ ] Clicar "Solicitar Assinatura"
- [ ] Informar email do chefe do departamento
- [ ] Email enviado com link + token (expira em 72h)

---

### 3.7 Chefe do Departamento - Assinar Edital

- [ ] Acessar link recebido por email
- [ ] Visualizar preview do edital
- [ ] Assinar digitalmente
- [ ] Campos atualizados: `edital.chefe_assinou_em`, `edital.chefe_assinatura`

---

### 3.8 Admin - Publicar Edital

- [ ] Verificar assinatura do chefe
- [ ] Clicar "Publicar"
- [ ] `edital.publicado = true`
- [ ] Sistema envia PDF automaticamente para:
  - Todos os estudantes do instituto
  - Todos os professores do instituto

---

## FASE 4: Inscrições e Seleção de Monitores

### 4.1 Aluno - Receber Edital e Ver Vagas

> **Rota**: `/home/student/vagas`
> **Sidebar**: Monitoria → Vagas Disponíveis

- [ ] Receber email com PDF do edital
- [ ] Login como `demo.student@ufba.br`
- [ ] Ver projetos com bolsas e vagas de voluntário
- [ ] Filtrar por departamento, tipo de vaga

---

### 4.2 Aluno - Realizar Inscrição

> **Rota**: `/home/student/inscricao-monitoria`
> **Sidebar**: Monitoria → Inscrição em Monitoria

- [ ] Selecionar projeto
- [ ] Clicar "Inscrever-se"
- [ ] Escolher tipo: BOLSISTA, VOLUNTARIO ou AMBOS
- [ ] Confirmar inscrição

**Sistema captura automaticamente:**
- Nota na disciplina (do histórico)
- CR (Coeficiente de Rendimento) do aluno
- Considera disciplinas equivalentes (ex: MATA37 LP = MATE045)

---

### 4.3 Professor - Gerenciar Candidatos

> **Rota**: `/home/professor/candidatos`
> **Sidebar**: Processo Seletivo → Gerenciar Candidatos

- [ ] Ver lista de inscritos
- [ ] Dados: nome, nota disciplina, CR, tipo pretendido

---

### 4.4 Professor - Avaliar Candidatos

> **Rota**: `/home/professor/grade-applications`
> **Sidebar**: Processo Seletivo → Avaliar Candidatos

- [ ] Atribuir notas (prova e/ou entrevista)
- [ ] Sistema calcula nota final automaticamente
- [ ] Campos: `inscricao.nota_selecao`, `inscricao.nota_final`

---

### 4.5 Professor - Selecionar Monitores

> **Rota**: `/home/professor/select-monitors`
> **Sidebar**: Processo Seletivo → Selecionar Monitores

- [ ] Ver ranking por nota final
- [ ] Selecionar bolsistas (até limite alocado)
- [ ] Selecionar voluntários (até limite definido)
- [ ] Status: `SELECTED_BOLSISTA` ou `SELECTED_VOLUNTARIO`

---

### 4.6 Professor - Publicar Resultados

> **Rota**: `/home/professor/publicar-resultados`
> **Sidebar**: Processo Seletivo → Publicar Resultados

- [ ] Revisar seleção
- [ ] Clicar "Publicar Resultados"
- [ ] Sistema notifica alunos por email

---

### 4.7 Aluno - Ver Resultado e Aceitar/Rejeitar

> **Rota**: `/home/student/resultados`
> **Sidebar**: Monitoria → Resultados das Seleções

- [ ] Receber email com resultado
- [ ] Ver status: selecionado, lista de espera, não selecionado
- [ ] Se selecionado: clicar "Aceitar" ou "Rejeitar"
- [ ] Se bolsista e aceitar: preencher dados bancários (banco, agência, conta, dígito)
- [ ] Status: `ACCEPTED_BOLSISTA` ou `ACCEPTED_VOLUNTARIO`
- [ ] Registro criado em tabela `vaga`

---

## FASE 5: Consolidação Final e Relatório PROGRAD

### 5.1 Admin - Consolidação PROGRAD

> **Rota**: `/home/admin/consolidacao-prograd`
> **Sidebar**: Sistema → Consolidação PROGRAD

- [ ] Selecionar período (ano/semestre)
- [ ] Validar dados (todos bolsistas com dados bancários completos?)
- [ ] Gerar planilha Excel BOLSISTAS (com dados de pagamento)
- [ ] Gerar planilha Excel VOLUNTÁRIOS (separada)
- [ ] Enviar planilhas ao DEPARTAMENTO (DCC)

**Nota:** Chefe do departamento encaminha para PROGRAD que processa os pagamentos.

---

## FASE 6: Relatórios Finais e Certificados

### 6.1 Admin - Iniciar Relatórios

> **Rota**: `/home/admin/relatorio-disciplina`
> **Sidebar**: Relatórios → Relatórios Disciplina

- [ ] Clicar "Gerar Relatórios"
- [ ] Sistema notifica professores por email

---

### 6.2 Professor - Gerar Relatórios

> **Rota**: `/home/professor/relatorios-finais`

- [ ] Receber notificação
- [ ] Gerar relatório final da disciplina:
  - Pode usar template de semestres anteriores
  - Editar conforme necessário
  - Assinar digitalmente
- [ ] Gerar relatório individual para cada monitor:
  - Sistema pré-preenche com dados do aluno
  - Revisar e assinar
- [ ] Sistema notifica alunos automaticamente

---

### 6.3 Aluno - Assinar Relatório

> **Rota**: `/home/student/relatorios`

- [ ] Receber notificação: "Relatório pendente de assinatura"
- [ ] Visualizar relatório
- [ ] Assinar digitalmente

---

### 6.4 Admin - Validação e Certificados

> **Rota**: `/home/admin/consolidacao-prograd`

- [ ] Validar que todos os relatórios estão assinados
- [ ] Gerar texto padrão para ata do departamento:
  - "Professor X solicita aprovação do relatório de monitoria do aluno Y, nota Z, semestre W, disciplina V"
- [ ] Gerar 3 planilhas com links PDF:
  - Certificados de monitores bolsistas
  - Certificados de monitores voluntários
  - Relatórios finais das disciplinas
- [ ] Enviar planilhas ao DEPARTAMENTO
- [ ] Departamento encaminha certificados para NUMOP

---

## Funcionalidades Auxiliares

### A0. Sistema de Notificações Proativas

> **Rota**: `/home/admin/notificacoes`
> **Sidebar**: Sistema → Notificações

**Funcionamento:**
O sistema envia lembretes **automaticamente** quando o admin acessa o Dashboard.

**Tipos de lembretes automáticos:**
| Tipo | Intervalo | Descrição |
|------|-----------|-----------|
| `assinatura_projeto_pendente` | 24h | Projetos aguardando assinatura admin |
| `assinatura_termo_pendente` | 24h | Termos de compromisso pendentes |
| `aceite_vaga_pendente` | 12h | Alunos com aceite pendente |
| `periodo_inscricao_proximo_fim` | 24h | 3 dias antes do fim das inscrições |
| `relatorio_final_pendente` | 48h | Relatórios finais pendentes |
| `relatorio_monitor_pendente` | 48h | Relatórios de monitores pendentes |

---

### A1. Equivalências de Disciplinas

> **Rota**: `/home/admin/equivalencias`
> **Sidebar**: Configurações → Equivalências de Disciplinas

**Propósito:** Quando aluno se inscreve, sistema busca nota na disciplina. Se não encontrar, verifica equivalentes (ex: MATA37 LP = MATE045).

---

### A2. Templates de Projeto

> **Rota**: `/home/admin/projeto-templates`
> **Sidebar**: Editais → Templates de Projeto

**Propósito:** Pré-preencher projetos na importação.

---

### A3. Atas de Seleção

> **Rota Admin**: `/home/admin/atas-selecao`
> **Rota Professor**: `/home/professor/atas-selecao`

- [ ] Selecionar projeto com seleção concluída
- [ ] Gerar ata em PDF
- [ ] Assinar digitalmente

---

### A4. Termos de Compromisso

> **Rota**: `/home/professor/termos-compromisso`

- [ ] Ver monitores que aceitaram
- [ ] Gerar termo individual
- [ ] Monitor assina → Professor assina

---

## Verificação no Banco

```bash
# Projetos
docker exec sistema-de-monitoria-ic-db psql -U postgres -d sistema_de_monitoria_ic \
  -c "SELECT id, titulo, status, ano, semestre FROM projeto ORDER BY id DESC LIMIT 10;"

# Inscrições
docker exec sistema-de-monitoria-ic-db psql -U postgres -d sistema_de_monitoria_ic \
  -c "SELECT id, projeto_id, aluno_id, tipo_vaga_pretendida, status FROM inscricao ORDER BY id DESC;"

# Vagas efetivadas
docker exec sistema-de-monitoria-ic-db psql -U postgres -d sistema_de_monitoria_ic \
  -c "SELECT id, aluno_id, projeto_id, tipo FROM vaga ORDER BY id DESC;"

# Editais
docker exec sistema-de-monitoria-ic-db psql -U postgres -d sistema_de_monitoria_ic \
  -c "SELECT id, numero_edital, publicado, chefe_assinou_em FROM edital;"

# Equivalências
docker exec sistema-de-monitoria-ic-db psql -U postgres -d sistema_de_monitoria_ic \
  -c "SELECT e.id, d1.codigo, d2.codigo FROM disc_equiv e JOIN disciplina d1 ON e.disc_origem_id = d1.id JOIN disciplina d2 ON e.disc_equiv_id = d2.id;"

# Período ativo
docker exec sistema-de-monitoria-ic-db psql -U postgres -d sistema_de_monitoria_ic \
  -c "SELECT * FROM periodo_inscricao WHERE data_fim > NOW();"
```

---

## Resumo de Rotas por Role

### Admin
| Funcionalidade | Rota |
|----------------|------|
| Dashboard | `/home/admin/dashboard` |
| Gerenciar Projetos | `/home/admin/manage-projects` |
| Importar Planejamento | `/home/admin/import-projects` |
| Alocação de Bolsas | `/home/admin/scholarship-allocation` |
| Gerenciar Editais | `/home/admin/edital-management` |
| Templates de Projeto | `/home/admin/projeto-templates` |
| Todos os Usuários | `/home/admin/users` |
| Professores | `/home/admin/professores` |
| Alunos | `/home/admin/alunos` |
| Departamentos | `/home/admin/departamentos` |
| Disciplinas | `/home/admin/disciplinas` |
| Equivalências | `/home/admin/equivalencias` |
| Notificações | `/home/admin/notificacoes` |
| Logs de Auditoria | `/home/admin/audit-logs` |
| Planilha PROGRAD | `/home/admin/planilha-prograd` |
| Consolidação PROGRAD | `/home/admin/consolidacao-prograd` |
| **Atas de Seleção** | `/home/admin/atas-selecao` |
| **Inscrições** | `/home/admin/inscricoes` |
| **Seleção** | `/home/admin/selecao` |
| **Relatório Disciplina** | `/home/admin/relatorio-disciplina` |
| **Relatório Monitor** | `/home/admin/relatorio-monitor` |

### Professor
| Funcionalidade | Rota |
|----------------|------|
| Dashboard/Projetos | `/home/professor/dashboard` |
| Gerenciar Candidatos | `/home/professor/candidatos` |
| Avaliar Candidatos | `/home/professor/grade-applications` |
| Selecionar Monitores | `/home/professor/select-monitors` |
| Publicar Resultados | `/home/professor/publicar-resultados` |
| Atas de Seleção | `/home/professor/atas-selecao` |
| Termos de Compromisso | `/home/professor/termos-compromisso` |
| Relatórios Finais | `/home/professor/relatorios-finais` |
| Gerenciar Voluntários | `/home/professor/volunteer-management` |

### Aluno
| Funcionalidade | Rota |
|----------------|------|
| Dashboard | `/home/student/dashboard` |
| Inscrição em Monitoria | `/home/student/inscricao-monitoria` |
| Vagas Disponíveis | `/home/student/vagas` |
| Resultados das Seleções | `/home/student/resultados` |
| Relatórios Finais | `/home/student/relatorios` |
| Meu Status | `/home/common/status` |

### Comum
| Funcionalidade | Rota |
|----------------|------|
| Meu Perfil | `/home/common/profile` |

---

## Arquivo de Importação de Teste

**Localização:** `docs/test-import-2025-1.csv`

**Conteúdo atual (1 item para teste):**
```csv
DISCIPLINA,TURMA,NOME DISCIPLINA,...,DOCENTE
MATC02,1,ESTRUTURAS DE DADOS,...,Professor Demo
```

**Professor mapeado:**
- Professor Demo → id=24 (DCC)

**Resultado esperado:** 1 projeto criado com status `PENDING_PROFESSOR_SIGNATURE`

---

## Atores Externos (não interagem com sistema)

### Instituto (IC)
- Recebe planilha de projetos do admin
- Encaminha para PROGRAD
- Conversa com departamentos sobre divisão de bolsas

### PROGRAD
- Recebe planilha de projetos (via Instituto) - MANUAL
- Define e publica total de bolsas via email geral - MANUAL
- Recebe consolidação final (via Departamento) - MANUAL
- Processa pagamentos - MANUAL
- **IMPORTANTE:** PROGRAD não tem acesso ao sistema

### NUMOP
- Recebe planilhas de certificados (via Departamento)
- Emite certificados oficiais de monitoria
