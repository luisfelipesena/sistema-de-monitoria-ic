# TODO - Sistema de Monitoria IC

## 🎯 TICKETS PENDENTES - REFATORAÇÃO DO SISTEMA

### 1. ONBOARDING DO PROFESSOR - SIMPLIFICAÇÃO
**TAREFA** - Remover documentos obrigatórios do onboarding professor
**DESCRIÇÃO** - Remover Curriculum Vitae e Comprovante de Vínculo como documentos obrigatórios no onboarding
**CONTEXTO** - Atualmente o onboarding força upload de documentos que não são necessários para o fluxo. O sistema deve focar apenas no essencial: dados pessoais e assinatura digital
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Remover vínculo de disciplinas do onboarding professor
**DESCRIÇÃO** - Retirar toda lógica de seleção/criação de disciplinas do onboarding do professor
**CONTEXTO** - As disciplinas devem ser vinculadas apenas no momento da criação do projeto, não no onboarding. Isso simplifica o onboarding e torna o fluxo mais natural
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Tornar assinatura digital obrigatória no onboarding professor
**DESCRIÇÃO** - Mover assinatura digital do "Meu Perfil" para o onboarding, tornando-a obrigatória para completar o cadastro
**CONTEXTO** - A assinatura digital é essencial para assinar projetos, deve estar disponível desde o onboarding
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Tornar SIAPE obrigatório no onboarding professor
**DESCRIÇÃO** - Alterar campo matriculaSiape para obrigatório no formulário de onboarding
**CONTEXTO** - SIAPE é identificador essencial do professor na universidade, deve ser obrigatório
**FEITA** - [x] ✅ COMPLETO

### 2. REMOÇÃO DE FUNCIONALIDADES DESNECESSÁRIAS
**TAREFA** - Remover "Minhas API Keys" do sistema
**DESCRIÇÃO** - Remover completamente a funcionalidade de API Keys do sidebar e sistema
**CONTEXTO** - Funcionalidade não é necessária para o fluxo principal do sistema de monitoria
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Remover "Minhas Disciplinas" e "Gerenciar Disciplinas" do sidebar professor
**DESCRIÇÃO** - Remover menu items de disciplinas do sidebar do professor
**CONTEXTO** - Disciplinas serão gerenciadas apenas na criação de projetos e pelo admin
**FEITA** - [x] ✅ COMPLETO

### 3. FLUXO DE ASSINATURA - SIMPLIFICAÇÃO
**TAREFA** - Remover assinatura do admin no fluxo de projetos
**DESCRIÇÃO** - Eliminar totalmente o status PENDING_ADMIN_SIGNATURE e fluxo de assinatura admin
**CONTEXTO** - Admin apenas aprova projetos, não precisa assinar. Apenas o professor assina o projeto
**FEITA** - [ ]

**TAREFA** - Remover página de assinatura documentos admin
**DESCRIÇÃO** - Deletar /src/app/home/admin/assinatura-documentos/ e referências
**CONTEXTO** - Com a remoção do fluxo de assinatura admin, esta página não é mais necessária
**FEITA** - [ ]

### 4. NOVO FLUXO DE CRIAÇÃO DE PROJETOS
**TAREFA** - Vincular professor a disciplina apenas na criação do projeto
**DESCRIÇÃO** - Implementar lógica para associar professor à disciplina no momento de criar projeto por semestre
**CONTEXTO** - O vínculo disciplina-professor deve ser dinâmico por semestre/projeto, não fixo no onboarding
**FEITA** - [ ]

**TAREFA** - Implementar sistema de templates de projeto por disciplina
**DESCRIÇÃO** - Criar fluxo para templates padrão obrigatórios por disciplina antes de gerar projeto específico
**CONTEXTO** - Cada disciplina deve ter um template base. Se não existir, professor deve criar antes do projeto
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Adicionar seleção de projetos existentes no novo projeto
**DESCRIÇÃO** - Mostrar botão "Projetos Existentes" com template da disciplina selecionada
**CONTEXTO** - Reaproveitar templates e facilitar criação de projetos recorrentes
**FEITA** - [ ]

**TAREFA** - Implementar campo de professores participantes em projetos coletivos
**DESCRIÇÃO** - Adicionar campo textual para nomes dos professores quando tipo COLETIVA for selecionado
**CONTEXTO** - Projetos coletivos precisam listar todos os professores participantes
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Ajustar valores padrão de carga horária
**DESCRIÇÃO** - Alterar padrão para Carga Horária Total: 204h, remover "Número de Semanas"
**CONTEXTO** - Padronizar com formato institucional de 204 horas totais
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Adicionar ação de editar antes de assinar projeto
**DESCRIÇÃO** - Incluir botão "Editar" na página de projetos do professor antes da assinatura
**CONTEXTO** - Professor deve poder revisar e editar projeto antes de assinar definitivamente
**FEITA** - [ ]

### 5. GESTÃO ADMIN MELHORADA
**TAREFA** - Separar projetos por semestre no painel admin
**DESCRIÇÃO** - Implementar seleção de semestre antes de exibir dashboard de projetos no admin
**CONTEXTO** - Admin precisa filtrar projetos por semestre para melhor organização
**FEITA** - [ ]

**TAREFA** - Admin gerenciar disciplinas (CRUD completo)
**DESCRIÇÃO** - Criar página admin para CRUD completo de disciplinas do departamento
**CONTEXTO** - Admin deve poder criar/editar todas as disciplinas, deixando apenas código e nome
**FEITA** - [ ]

**TAREFA** - Implementar fluxo de planilha PROGRAD via email
**DESCRIÇÃO** - Alterar download de planilha para envio por email com preview antes do envio
**CONTEXTO** - Ao invés de download, enviar planilha por email para PROGRAD com dados dos projetos aprovados
**FEITA** - [ ]

### 6. SISTEMA DE EDITAIS MELHORADO
**TAREFA** - Associar editais a semestres específicos
**DESCRIÇÃO** - Implementar lógica para editais DCC e PROGRAD por semestre
**CONTEXTO** - Editais devem ser específicos por semestre. PROGRAD fornece PDF, DCC tem informações complexas
**FEITA** - [ ]

**TAREFA** - Implementar Anexo 1 com número do edital
**DESCRIÇÃO** - No PDF do projeto mostrar apenas número do edital do semestre selecionado
**CONTEXTO** - Anexo 1 deve referenciar o edital correto do semestre
**FEITA** - [ ]

### 7. MELHORIAS DE UX/UI
**TAREFA** - Remover cookie UFBA no logout
**DESCRIÇÃO** - Limpar cookies de sessão UFBA no processo de logout
**CONTEXTO** - Garantir logout completo do sistema CAS
**FEITA** - [x] ✅ COMPLETO

**TAREFA** - Remover "Ver Projetos" e deixar apenas dashboard professor
**DESCRIÇÃO** - Consolidar informações de projetos apenas no dashboard, removendo página separada
**CONTEXTO** - Simplificar navegação, concentrando informações no dashboard
**FEITA** - [ ]

**TAREFA** - Remover "Novo Projeto" do sidebar
**DESCRIÇÃO** - Deixar criação de projeto apenas via dashboard
**CONTEXTO** - Simplificar sidebar e centralizar ações no dashboard
**FEITA** - [ ]

## 🗂️ ARQUIVOS PRINCIPAIS AFETADOS

### Schema Database
- `src/server/db/schema.ts` - Remover campos de assinatura admin, ajustar SIAPE obrigatório

### Onboarding
- `src/app/home/common/onboarding/page.tsx` - Simplificar fluxo
- `src/components/features/onboarding/ProfessorOnboardingForm.tsx` - Remover docs e disciplinas, adicionar assinatura
- `src/server/api/routers/onboarding/onboarding.ts` - Ajustar validações e campos obrigatórios

### Criação de Projetos
- `src/app/home/professor/projetos/novo/page.tsx` - Implementar novo fluxo com templates e disciplinas
- `src/server/api/routers/projeto/projeto.ts` - Ajustar lógica de criação e assinatura

### Admin
- `src/app/home/admin/assinatura-documentos/` - **DELETAR COMPLETAMENTE**
- `src/app/home/admin/manage-projects/` - Adicionar filtro por semestre
- `src/app/home/admin/consolidacao-prograd/` - Implementar envio por email

### Sidebar
- `src/components/layout/Sidebar.tsx` - Remover menus desnecessários

### Fluxo de Aprovação
- Todos os routers que usam `PENDING_ADMIN_SIGNATURE` devem ser atualizados

---

## 🚀 PRÓXIMOS TICKETS PRIORITÁRIOS

### PRIORIDADE 1 - FUNDAÇÃO
1. **Ajustar Schema Database** - Remover assinatura admin e ajustar SIAPE
2. **Remover página admin/assinatura-documentos** - Deletar fluxo desnecessário
3. **Simplificar onboarding professor** - Focar no essencial

### PRIORIDADE 2 - FLUXOS PRINCIPAIS
4. **Novo fluxo criação de projetos** - Templates e disciplinas dinâmicas
5. **Admin gestão disciplinas** - CRUD completo
6. **Separação por semestre** - Filtros admin

### PRIORIDADE 3 - MELHORIAS
7. **Sistema editais melhorado** - Associação com semestres
8. **UX/UI improvements** - Simplificação sidebar e navegação

**STATUS ATUAL**: 🟡 **EM PROGRESSO** - 7 tickets completados (Templates, Professores Coletivos, Carga Horária 204h, Onboarding Professor Simplificado)
**META**: Implementar todos os tickets para versão final do sistema

### ✅ TICKETS COMPLETADOS
- ✅ **Implementar sistema de templates de projeto por disciplina** - Sistema completo com workflows de template/projeto
- ✅ **Implementar campo de professores participantes em projetos coletivos** - Campo condicional implementado
- ✅ **Ajustar valores padrão de carga horária** - Padrão 204h implementado
- ✅ **Remover documentos obrigatórios do onboarding professor** - Documentos CV e Comprovante removidos como obrigatórios
- ✅ **Remover vínculo de disciplinas do onboarding professor** - Disciplinas movidas para criação de projetos
- ✅ **Tornar assinatura digital obrigatória no onboarding professor** - Assinatura integrada ao fluxo obrigatório
- ✅ **Tornar SIAPE obrigatório no onboarding professor** - Campo matriculaSiape já configurado como obrigatório