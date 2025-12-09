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
- MAT (id: 13), EST (id: 14), FIS (id: 15), COMP (id: 16)

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
  - Projetos criados: 5 (MATC02, MATC99, MATC04, MATC05, MATC06)
  - Professores notificados por email
  - Status dos projetos: `PENDING_PROFESSOR_SIGNATURE`

**Validação no banco:**
```sql
SELECT id, titulo, status, professor_responsavel_id FROM projeto
WHERE ano = 2025 AND semestre = 'SEMESTRE_1' ORDER BY id DESC;
```

**Lógica de busca de professores:**
- Sistema busca por `nome_completo` usando `ILIKE %nome%`
- "Professor Demo" → encontra professor id=24
- "Carlos Silva" → encontra professor id=20
- "Ana Pereira" → encontra professor id=21
- "João Santos" → encontra professor id=22

---

### 1.2 Professor - Visualizar Projetos Pendentes

> **Rota**: `/home/professor/dashboard`
> **Sidebar**: Meus Projetos → Dashboard

- [ ] Login como `demo.professor@ufba.br`
- [ ] Visualizar projetos com status "Aguardando Assinatura"
- [ ] Ver projetos importados: MATC02, MATC99

---

### 1.3 Professor - Editar Projeto

- [ ] Selecionar projeto (ex: MATC02 - Estruturas de Dados)
- [ ] Clicar "Editar"
- [ ] Ajustar campos:
  - Título
  - Descrição/Objetivos
  - Bolsas solicitadas (ex: 2)
  - Voluntários solicitados (ex: 1)
  - Atividades do monitor
- [ ] Salvar alterações

---

### 1.4 Professor - Assinar e Submeter Projeto

- [ ] Localizar projeto editado
- [ ] Clicar "Assinar e Submeter"
- [ ] Desenhar assinatura no canvas digital
- [ ] Confirmar assinatura
- [ ] Status muda para `SUBMITTED`

**Resultado esperado:**
- PDF gerado e salvo no MinIO
- Assinatura registrada em `projeto.assinatura_professor`
- Email enviado ao admin

---

## FASE 2: Aprovação e Envio para PROGRAD

### 2.1 Admin - Listar Projetos Submetidos

> **Rota**: `/home/admin/manage-projects`
> **Sidebar**: Projetos → Gerenciar Projetos

- [ ] Login como `demo.admin@ufba.br`
- [ ] Filtrar por Ano: 2025, Semestre: 1
- [ ] Filtrar status: "Aguardando Aprovação" (`SUBMITTED`)

---

### 2.2 Admin - Visualizar e Aprovar Projeto

- [ ] Clicar no projeto para detalhes
- [ ] Visualizar PDF com assinatura do professor
- [ ] Clicar "Aprovar"
- [ ] Adicionar feedback (opcional)
- [ ] Status muda para `APPROVED`

**Resultado esperado:** Projeto visível em "Vagas Disponíveis" para alunos.

---

### 2.3 Admin - Gerar Planilha para Instituto

> **Rota**: `/home/admin/relatorios`
> **Sidebar**: Sistema → Relatórios PROGRAD

- [ ] Selecionar período 2025.1
- [ ] Gerar planilha Excel com projetos aprovados
- [ ] Planilha contém links para PDFs

---

## FASE 3: Alocação de Bolsas e Edital Interno DCC

### 3.1 Admin - Definir Total de Bolsas PROGRAD

> **Rota**: `/home/admin/scholarship-allocation`
> **Sidebar**: Projetos → Alocação de Bolsas

- [ ] Selecionar período 2025.1
- [ ] Definir total de bolsas (ex: 10)
- [ ] Sistema atualiza `periodo_inscricao.total_bolsas_prograd`

---

### 3.2 Admin - Alocar Bolsas por Projeto

- [ ] Ver projetos aprovados
- [ ] Alocar bolsas (ex: MATC02 = 2 bolsas, MATC99 = 2 bolsas)
- [ ] Sistema valida: soma ≤ total PROGRAD
- [ ] Salvar alocação

**Campo atualizado:** `projeto.bolsas_disponibilizadas`

---

### 3.3 Admin - Notificar Professores

- [ ] Clicar "Notificar Professores"
- [ ] Email enviado com tabela de bolsas alocadas

---

### 3.4 Admin - Criar Edital Interno DCC

> **Rota**: `/home/admin/edital-management`
> **Sidebar**: Editais → Gerenciar Editais

- [ ] Clicar "Novo Edital"
- [ ] Preencher:
  - Número: "001/2025"
  - Período de inscrição
  - Datas de provas (2-3 opções)
  - Data divulgação resultado
  - Valor bolsa: R$ 700,00
- [ ] Salvar

---

### 3.5 Professor - Configurar Projeto para Edital

> **Rota**: `/home/professor/dashboard`

- [ ] Ver bolsas alocadas (campo não editável)
- [ ] Definir voluntários adicionais
- [ ] Escolher data/horário da seleção
- [ ] Editar pontos da prova
- [ ] Editar bibliografia

---

### 3.6 Admin - Solicitar Assinatura do Chefe

- [ ] Selecionar edital
- [ ] Clicar "Solicitar Assinatura"
- [ ] Informar email do chefe do departamento
- [ ] Email enviado com link + token

**Configurar email do chefe em:** `/home/admin/configuracoes`

---

### 3.7 Chefe - Assinar Edital (via link)

- [ ] Acessar link recebido por email
- [ ] Visualizar preview do edital
- [ ] Assinar digitalmente
- [ ] Campos atualizados: `edital.chefe_assinou_em`, `edital.chefe_assinatura`

---

### 3.8 Admin - Publicar Edital

- [ ] Verificar assinatura do chefe
- [ ] Clicar "Publicar"
- [ ] `edital.publicado = true`
- [ ] Email enviado para estudantes e professores

---

## FASE 4: Inscrições e Seleção de Monitores

### 4.1 Aluno - Ver Vagas Disponíveis

> **Rota**: `/home/student/vagas`
> **Sidebar**: Monitoria → Vagas Disponíveis

- [ ] Login como `demo.student@ufba.br`
- [ ] Ver projetos aprovados com vagas abertas
- [ ] Filtrar por departamento, tipo de vaga

---

### 4.2 Aluno - Realizar Inscrição

> **Rota**: `/home/student/inscricao-monitoria`
> **Sidebar**: Monitoria → Inscrição em Monitoria

- [ ] Selecionar projeto
- [ ] Clicar "Inscrever-se"
- [ ] Escolher tipo: BOLSISTA, VOLUNTARIO ou ANY
- [ ] Confirmar inscrição

**Sistema captura automaticamente:**
- Nota na disciplina (ou equivalente)
- CR do aluno
- Considera equivalências configuradas

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

- [ ] Atribuir nota de seleção (prova/entrevista)
- [ ] Sistema calcula nota final
- [ ] Campos: `inscricao.nota_selecao`, `inscricao.nota_final`

---

### 4.5 Professor - Selecionar Monitores

> **Rota**: `/home/professor/select-monitors`
> **Sidebar**: Processo Seletivo → Selecionar Monitores

- [ ] Ver ranking por nota final
- [ ] Selecionar bolsistas (até limite)
- [ ] Selecionar voluntários
- [ ] Status: `SELECTED_BOLSISTA` ou `SELECTED_VOLUNTARIO`

---

### 4.6 Professor - Publicar Resultados

> **Rota**: `/home/professor/publicar-resultados`
> **Sidebar**: Processo Seletivo → Publicar Resultados

- [ ] Revisar seleção
- [ ] Clicar "Publicar Resultados"
- [ ] Alunos notificados por email

---

### 4.7 Aluno - Ver Resultado

> **Rota**: `/home/student/resultados`
> **Sidebar**: Monitoria → Resultados das Seleções

- [ ] Ver status: selecionado, lista de espera, não selecionado
- [ ] Se selecionado: botões "Aceitar" / "Rejeitar"

---

### 4.8 Aluno - Aceitar Monitoria

- [ ] Clicar "Aceitar"
- [ ] Se bolsista, preencher dados bancários:
  - Banco, Agência, Conta, Dígito
- [ ] Status: `ACCEPTED_BOLSISTA` ou `ACCEPTED_VOLUNTARIO`
- [ ] Registro criado em tabela `vaga`

---

## FASE 5: Consolidação Final

### 5.1 Admin - Consolidação PROGRAD

> **Rota**: `/home/admin/consolidacao-prograd`
> **Sidebar**: Sistema → Consolidação PROGRAD

- [ ] Selecionar período
- [ ] Validar dados (todos bolsistas com dados bancários?)
- [ ] Gerar planilha BOLSISTAS
- [ ] Gerar planilha VOLUNTÁRIOS
- [ ] Enviar ao Departamento → PROGRAD

---

## FASE 6: Relatórios Finais e Certificados

> **Nota**: Módulo especificado mas implementação parcial (trabalho futuro conforme TCC)

### 6.1 Admin - Iniciar Relatórios

> **Rota**: `/home/admin/validacao-relatorios`

- [ ] Clicar "Gerar Relatórios"
- [ ] Professores notificados

### 6.2 Professor - Gerar Relatórios

> **Rota**: `/home/professor/relatorios-finais`

- [ ] Relatório da disciplina
- [ ] Relatório individual por monitor
- [ ] Assinar digitalmente

### 6.3 Aluno - Assinar Relatório

> **Rota**: `/home/student/relatorios`

- [ ] Ver relatório pendente
- [ ] Assinar digitalmente

---

## Funcionalidades Auxiliares

### A1. Equivalências de Disciplinas

> **Rota**: `/home/admin/equivalencias`
> **Sidebar**: Configurações → Equivalências de Disciplinas

**Propósito:** Quando aluno se inscreve, sistema busca nota na disciplina. Se não encontrar, verifica equivalentes (ex: MATA37 = MATE045).

**Passos:**
- [ ] Clicar "Nova Equivalência"
- [ ] Disciplina A: MATA37 (Cálculo I)
- [ ] Disciplina B: MATA38 (Cálculo II) - exemplo fictício
- [ ] Criar equivalência

**Funcionamento:**
1. Aluno se inscreve em projeto da disciplina X
2. Sistema busca nota em X
3. Se não encontrar, consulta `disc_equiv`
4. Usa nota da disciplina equivalente

**Verificar no banco:**
```sql
SELECT e.id, d1.codigo as origem, d2.codigo as equivalente
FROM disc_equiv e
JOIN disciplina d1 ON e.disc_origem_id = d1.id
JOIN disciplina d2 ON e.disc_equiv_id = d2.id;
```

---

### A2. Configuração de Emails do Departamento

> **Rota**: `/home/admin/configuracoes`
> **Sidebar**: Configurações → Email

**Propósito:** Definir emails para comunicações oficiais.

**Campos por departamento:**
- **Email do Instituto**: Recebe planilha de projetos (FASE 2)
- **Email do Chefe Depto.**: Recebe link para assinar edital (FASE 3)

**Passos:**
- [ ] Localizar DCC na tabela
- [ ] Clicar engrenagem
- [ ] Preencher emails
- [ ] Salvar

---

### A3. Templates de Projeto

> **Rota**: `/home/admin/projeto-templates`
> **Sidebar**: Editais → Templates de Projeto

**Propósito:** Pré-preencher projetos na importação.

- [ ] Criar template para MATC02
- [ ] Definir: título, descrição, atividades, pontos da prova, bibliografia
- [ ] Na próxima importação, projeto MATC02 virá pré-preenchido

---

### A4. Atas de Seleção

> **Rota**: `/home/professor/atas-selecao`

- [ ] Selecionar projeto com seleção concluída
- [ ] Gerar ata em PDF
- [ ] Assinar digitalmente

---

### A5. Termos de Compromisso

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
| Cursos | `/home/admin/cursos` |
| Departamentos | `/home/admin/departamentos` |
| Disciplinas | `/home/admin/disciplinas` |
| Equivalências | `/home/admin/equivalencias` |
| Config. Email | `/home/admin/configuracoes` |
| Analytics | `/home/admin/analytics` |
| Relatórios PROGRAD | `/home/admin/relatorios` |
| Consolidação PROGRAD | `/home/admin/consolidacao-prograd` |
| Validação Relatórios | `/home/admin/validacao-relatorios` |

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

**Conteúdo:**
```csv
DISCIPLINA,TURMA,NOME DISCIPLINA,...,DOCENTE
MATC02,1,ESTRUTURAS DE DADOS,...,Professor Demo
MATC99,1,INTRODUÇÃO À PROGRAMAÇÃO,...,Professor Demo
MATC04,1,BANCO DE DADOS,...,Carlos Silva
MATC05,1,ENGENHARIA DE SOFTWARE,...,Ana Pereira
MATC06,1,REDES DE COMPUTADORES,...,João Santos
```

**Professores mapeados:**
- Professor Demo → id=24 (DCC)
- Carlos Silva → id=20 (DCC)
- Ana Pereira → id=21 (DCC)
- João Santos → id=22 (DCC)

**Resultado esperado:** 5 projetos criados com status `PENDING_PROFESSOR_SIGNATURE`
