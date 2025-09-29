# TODO - Sistema de Monitoria IC

## 🎯 TICKETS PENDENTES

### 3. EDITAL INTERNO DCC - CAMPOS ESPECÍFICOS
**TAREFA** - Admin define datas globais de prova para edital interno
**DESCRIÇÃO** - Admin define 2-3 datas possíveis para realização das provas de seleção. Professores só podem escolher entre essas datas
**CONTEXTO** - Ex: Admin define dia 03/09 e 04/09. Professor ao preencher edital só pode escolher uma dessas datas + horário
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - adicionar `datasProvasDisponiveis` ao `editalTable`
- `src/server/api/routers/edital/edital.ts` - adicionar gestão de datas
- `src/app/home/admin/edital-management/page.tsx` - UI para admin definir datas
**STATUS** - [ ] 🔴 PENDENTE

**TAREFA** - Professores preenchem horário/dia de seleção dentro das datas do admin
**DESCRIÇÃO** - Ao preencher dados do edital, professor escolhe UMA das datas definidas pelo admin + horário específico
**CONTEXTO** - Professor não pode escolher qualquer data, apenas as pré-definidas pelo admin
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - adicionar campos ao projeto: `dataSelecaoEscolhida`, `horarioSelecao`
- `src/app/home/professor/edital-interno/page.tsx` - criar nova página para professor preencher
**STATUS** - [ ] 🔴 PENDENTE

**TAREFA** - Campos de pontos da prova e bibliografia com padrões editáveis
**DESCRIÇÃO** - Professor preenche pontos da prova e bibliografia. Sistema oferece texto padrão da disciplina que professor pode usar ou editar
**CONTEXTO** - Template de disciplina contém pontos/bibliografia padrão. Professor pode aceitar ou customizar
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - adicionar `pontosProvaDefault`, `bibliografiaDefault` ao `projetoTemplateTable`
- `src/app/home/professor/edital-interno/page.tsx` - campos com valores pré-preenchidos editáveis
**STATUS** - [ ] 🔴 PENDENTE

**TAREFA** - Admin define número do edital interno e data de divulgação
**DESCRIÇÃO** - Admin preenche número oficial do edital interno DCC e data limite para divulgação dos resultados
**CONTEXTO** - Informações administrativas gerais do edital, não específicas por projeto
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - adicionar `dataDivulgacaoResultado` ao `editalTable`
- `src/app/home/admin/edital-management/page.tsx` - campos para admin
**STATUS** - [ ] 🔴 PENDENTE

### 4. APROVAÇÃO E PUBLICAÇÃO DE EDITAL
**TAREFA** - Fluxo de assinatura do chefe do departamento no edital
**DESCRIÇÃO** - Edital interno precisa ser assinado pelo CHEFE DO DEPARTAMENTO (pode não ser o admin). Sistema deve solicitar assinatura dele
**CONTEXTO** - Admin monta edital, mas chefe precisa aprovar/assinar antes de publicar
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - adicionar `chefeAssinouEm`, `chefeAssinatura` ao `editalTable`
- `src/server/api/routers/edital/edital.ts` - adicionar `requestChefeSignature`, `signAsChefe`
- `src/app/home/admin/edital-management/page.tsx` - botão para solicitar assinatura do chefe
**STATUS** - [ ] 🔴 PENDENTE

**TAREFA** - Envio automático de edital para listas de email após aprovação
**DESCRIÇÃO** - Após edital assinado pelo chefe, enviar automaticamente PDF do edital para listas de estudantes e professores
**CONTEXTO** - Divulgação digital automática do edital aprovado
**ARQUIVOS AFETADOS**:
- `src/server/api/routers/edital/edital.ts` - adicionar `publishAndNotify`
- `src/server/lib/email-service.ts` - template de divulgação de edital
**STATUS** - [ ] 🔴 PENDENTE

### 5. MELHORIAS NO SCHEMA DO BANCO
**TAREFA** - Adicionar campos de edital interno ao schema
**DESCRIÇÃO** - Criar campos necessários para edital interno DCC: datas de prova, pontos, bibliografia, data divulgação
**CONTEXTO** - Banco precisa armazenar dados específicos do edital interno
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - estender `editalTable` e `projetoTemplateTable`
- Criar migration: `drizzle/00XX_add_edital_interno_fields.sql`
**STATUS** - [ ] 🔴 PENDENTE

**TAREFA** - Adicionar relacionamento projeto-edital
**DESCRIÇÃO** - Projeto deve referenciar qual edital interno está vinculado
**CONTEXTO** - Cada projeto participa de um edital interno específico do semestre
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - adicionar `editalInternoId` ao `projetoTable`
**STATUS** - [ ] 🔴 PENDENTE

---

## ✅ TICKETS COMPLETADOS

### 1. IMPORTAÇÃO DE PLANEJAMENTO - MELHORIAS CRÍTICAS ✅
**TAREFA** - Implementar parser de planilha Excel/CSV de planejamento
**DESCRIÇÃO** - Criar lógica para ler planilha do chefe do departamento com colunas: disciplina, turmas, professores (SIAPE), vagas
**CONTEXTO** - O planejamento é feito pelo chefe de departamento com disciplinas e professores. Sistema deve importar e detectar automaticamente se projeto é INDIVIDUAL (1 professor) ou COLETIVO (múltiplos professores)
**ARQUIVOS AFETADOS**:
- `src/server/lib/spreadsheet-parser.ts` - ✅ CRIADO - Parser flexível de Excel/CSV
- `src/server/api/routers/import-projects/import-projects.ts` - ✅ ATUALIZADO - Integração completa
- `src/app/home/admin/import-projects/page.tsx` - ✅ ATUALIZADO - UI melhorada com instruções
**STATUS** - [x] ✅ COMPLETO
**IMPLEMENTADO**:
- ✅ Parser de Excel com suporte a múltiplos formatos de coluna
- ✅ Validação de formato SIAPE (6-8 dígitos)
- ✅ Detecção automática de múltiplos professores separados por vírgula/ponto-e-vírgula
- ✅ Warnings e erros detalhados por linha
- ✅ Validação de estrutura antes de processar

**TAREFA** - Enviar emails automáticos após importação de planejamento
**DESCRIÇÃO** - Após importar planejamento, disparar emails para TODOS os professores relacionados pedindo para gerarem/assinarem seus projetos
**CONTEXTO** - Sistema deve notificar professores automaticamente: "Gerar projeto para disciplina X"
**ARQUIVOS AFETADOS**:
- `src/server/api/routers/import-projects/import-projects.ts` - ✅ ATUALIZADO - Email automático pós-importação
- `src/server/lib/email-service.ts` - ✅ ATUALIZADO - Template `sendProjectCreationNotification`
**STATUS** - [x] ✅ COMPLETO
**IMPLEMENTADO**:
- ✅ Template de email profissional com instruções claras
- ✅ Link direto para dashboard do professor
- ✅ Envio automático para todos os professores únicos
- ✅ Contador de emails enviados no retorno
- ✅ Logging de erros de email sem quebrar fluxo

**TAREFA** - Auto-criar projetos com templates na importação
**DESCRIÇÃO** - Ao importar planejamento, verificar se existe template da disciplina. Se existir, usar template como base do projeto. Se não, professor precisa criar template primeiro
**CONTEXTO** - Reduzir trabalho manual dos professores reutilizando templates de semestres anteriores
**ARQUIVOS AFETADOS**:
- `src/server/api/routers/import-projects/import-projects.ts` - ✅ ATUALIZADO - Integração com templates
**STATUS** - [x] ✅ COMPLETO
**IMPLEMENTADO**:
- ✅ Busca automática de template por disciplina
- ✅ Pré-preenchimento de: título, descrição, carga horária, público-alvo, atividades
- ✅ Warning quando template não existe (usa valores padrão)
- ✅ Suporte a atividades em formato JSON e string separada por ponto-e-vírgula
- ✅ Detecção automática INDIVIDUAL vs COLETIVA baseado em número de professores
- ✅ Auto-associação professor-disciplina para o semestre
- ✅ Criação de `professoresParticipantes` para projetos coletivos

### 2. WORKFLOW DE BOLSAS - FLUXO COMPLETO ✅
**TAREFA** - Gerar planilha PROGRAD com links para projetos
**DESCRIÇÃO** - Após projetos aprovados, gerar automaticamente planilha Excel para enviar ao PROGRAD com links para visualizar PDFs dos projetos
**CONTEXTO** - Planilha enviada ao PROGRAD para decisão de quantas bolsas serão alocadas
**ARQUIVOS AFETADOS**:
- `src/server/api/routers/analytics/analytics.ts` - ✅ ATUALIZADO - adicionado campo `linkPDF` ao output
- `src/components/features/prograd/PlanilhaPROGRAD.tsx` - ✅ ATUALIZADO - nova coluna com links dos PDFs
**STATUS** - [x] ✅ COMPLETO
**IMPLEMENTADO**:
- ✅ Nova coluna "Link do PDF do Projeto" na planilha PROGRAD
- ✅ Links gerados automaticamente: `${CLIENT_URL}/api/projeto/${id}/pdf`
- ✅ Coluna ajustada para caber no layout landscape da planilha

**TAREFA** - Campo de input de número de bolsas retornadas pela PROGRAD
**DESCRIÇÃO** - Admin recebe resposta da PROGRAD com número total de bolsas. Criar campo para admin inserir esse número no sistema
**CONTEXTO** - PROGRAD define quantas bolsas serão disponibilizadas para o instituto
**ARQUIVOS AFETADOS**:
- `src/server/db/schema.ts` - ✅ ATUALIZADO - adicionado `totalBolsasPrograd` ao `periodoInscricaoTable`
- `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts` - ✅ ATUALIZADO - procedures `setTotalScholarshipsFromPrograd` e `getTotalProgradScholarships`
- `src/app/home/admin/scholarship-allocation/page.tsx` - ✅ ATUALIZADO - UI completa com dialog e visualização
**STATUS** - [x] ✅ COMPLETO
**IMPLEMENTADO**:
- ✅ Campo no schema para armazenar total PROGRAD
- ✅ Procedure para definir total de bolsas PROGRAD
- ✅ Procedure para buscar total configurado
- ✅ UI com card mostrando: Total PROGRAD, Alocadas, Restantes
- ✅ Dialog para admin definir total com validação
- ✅ Indicador visual de quanto resta alocar

**TAREFA** - Alocação de bolsas por disciplina com campos não-editáveis
**DESCRIÇÃO** - Admin aloca bolsas por disciplina/projeto. Número de bolsas alocadas deve aparecer AUTOMATICAMENTE e ser NÃO-EDITÁVEL pelos professores
**CONTEXTO** - Apenas Admin aloca bolsas. Professores veem o número mas não podem editar. Campo voluntários permanece editável
**ARQUIVOS AFETADOS**:
- `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts` - ✅ VERIFICADO - apenas admin tem acesso às procedures
- `src/app/home/professor/dashboard/page.tsx` - ✅ VERIFICADO - bolsas exibidas como span readonly
**STATUS** - [x] ✅ COMPLETO
**IMPLEMENTADO**:
- ✅ Professores veem bolsas apenas em modo leitura (não há input ou edição)
- ✅ Apenas procedures `adminProtectedProcedure` podem alterar `bolsasDisponibilizadas`
- ✅ Dashboard professor exibe bolsas como texto simples para projetos aprovados

**TAREFA** - Enviar email aos professores após alocação de bolsas
**DESCRIÇÃO** - Após admin alocar bolsas, disparar email para professores com bolsas pedindo para preencherem dados do edital interno DCC
**CONTEXTO** - Novo email disparado: "Suas bolsas foram alocadas, preencha informações do edital interno"
**ARQUIVOS AFETADOS**:
- `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts` - ✅ ATUALIZADO - procedure `notifyProfessorsAfterAllocation`
- `src/server/lib/email-service.ts` - ✅ ATUALIZADO - template `sendScholarshipAllocationNotification`
**STATUS** - [x] ✅ COMPLETO
**IMPLEMENTADO**:
- ✅ Template de email profissional com tabela de projetos e bolsas
- ✅ Agrupamento por professor para evitar emails duplicados
- ✅ Filtro automático para enviar apenas a professores COM bolsas alocadas
- ✅ Contador de emails enviados
- ✅ Tratamento de erros sem quebrar fluxo
- ✅ Botão "Notificar Professores" na UI com validação (desabilitado se nenhuma bolsa alocada)

### 3. ONBOARDING DO PROFESSOR - SIMPLIFICAÇÃO ✅
**TAREFA** - Remover documentos obrigatórios do onboarding professor
**DESCRIÇÃO** - Remover Curriculum Vitae e Comprovante de Vínculo como documentos obrigatórios no onboarding
**CONTEXTO** - Atualmente o onboarding força upload de documentos que não são necessários para o fluxo. O sistema deve focar apenas no essencial: dados pessoais e assinatura digital
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Remover vínculo de disciplinas do onboarding professor
**DESCRIÇÃO** - Retirar toda lógica de seleção/criação de disciplinas do onboarding do professor
**CONTEXTO** - As disciplinas devem ser vinculadas apenas no momento da criação do projeto, não no onboarding. Isso simplifica o onboarding e torna o fluxo mais natural
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Tornar assinatura digital obrigatória no onboarding professor
**DESCRIÇÃO** - Mover assinatura digital do "Meu Perfil" para o onboarding, tornando-a obrigatória para completar o cadastro
**CONTEXTO** - A assinatura digital é essencial para assinar projetos, deve estar disponível desde o onboarding
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Tornar SIAPE obrigatório no onboarding professor
**DESCRIÇÃO** - Alterar campo matriculaSiape para obrigatório no formulário de onboarding
**CONTEXTO** - SIAPE é identificador essencial do professor na universidade, deve ser obrigatório
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Permitir login com e-mail
**DESCRIÇÃO** - Permitir login com e-mail para usuários que não possuem UFBA Login
**CONTEXTO** - Alguns usuários não possuem UFBA Login, devem ser permitidos acessar o sistema com e-mail
**STATUS** - [X] ✅ COMPLETO

### 4. REMOÇÃO DE FUNCIONALIDADES DESNECESSÁRIAS ✅
**TAREFA** - Remover "Minhas API Keys" do sistema
**DESCRIÇÃO** - Remover completamente a funcionalidade de API Keys do sidebar e sistema
**CONTEXTO** - Funcionalidade não é necessária para o fluxo principal do sistema de monitoria
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Remover "Minhas Disciplinas" e "Gerenciar Disciplinas" do sidebar professor
**DESCRIÇÃO** - Remover menu items de disciplinas do sidebar do professor
**CONTEXTO** - Disciplinas serão gerenciadas apenas na criação de projetos e pelo admin
**STATUS** - [x] ✅ COMPLETO

### 5. FLUXO DE ASSINATURA - SIMPLIFICAÇÃO ✅
**TAREFA** - Remover assinatura do admin no fluxo de projetos
**DESCRIÇÃO** - Eliminar totalmente o status PENDING_ADMIN_SIGNATURE e fluxo de assinatura admin
**CONTEXTO** - Admin apenas aprova projetos, não precisa assinar. Apenas o professor assina o projeto
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Remover página de assinatura documentos admin
**DESCRIÇÃO** - Deletar /src/app/home/admin/assinatura-documentos/ e referências
**CONTEXTO** - Com a remoção do fluxo de assinatura admin, esta página não é mais necessária
**STATUS** - [x] ✅ COMPLETO

### 6. NOVO FLUXO DE CRIAÇÃO DE PROJETOS ✅
**TAREFA** - Vincular professor a disciplina apenas na criação do projeto
**DESCRIÇÃO** - Implementar lógica para associar professor à disciplina no momento de criar projeto por semestre
**CONTEXTO** - O vínculo disciplina-professor deve ser dinâmico por semestre/projeto, não fixo no onboarding
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Implementar sistema de templates de projeto por disciplina
**DESCRIÇÃO** - Criar fluxo para templates padrão obrigatórios por disciplina antes de gerar projeto específico
**CONTEXTO** - Cada disciplina deve ter um template base. Se não existir, professor deve criar antes do projeto
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Adicionar seleção de projetos existentes no novo projeto
**DESCRIÇÃO** - Mostrar botão "Projetos Existentes" com template da disciplina selecionada
**CONTEXTO** - Reaproveitar templates e facilitar criação de projetos recorrentes
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Implementar campo de professores participantes em projetos coletivos
**DESCRIÇÃO** - Adicionar campo textual para nomes dos professores quando tipo COLETIVA for selecionado
**CONTEXTO** - Projetos coletivos precisam listar todos os professores participantes
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Ajustar valores padrão de carga horária
**DESCRIÇÃO** - Alterar padrão para Carga Horária Total: 204h, remover "Número de Semanas"
**CONTEXTO** - Padronizar com formato institucional de 204 horas totais
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Adicionar ação de editar antes de assinar projeto
**DESCRIÇÃO** - Incluir botão "Editar" na página de projetos do professor antes da assinatura
**CONTEXTO** - Professor deve poder revisar e editar projeto antes de assinar definitivamente
**STATUS** - [x] ✅ COMPLETO

### 7. GESTÃO ADMIN MELHORADA ✅
**TAREFA** - Separar projetos por semestre no painel admin
**DESCRIÇÃO** - Implementar seleção de semestre antes de exibir dashboard de projetos no admin
**CONTEXTO** - Admin precisa filtrar projetos por semestre para melhor organização
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Admin gerenciar disciplinas (CRUD completo)
**DESCRIÇÃO** - Criar página admin para CRUD completo de disciplinas do departamento
**CONTEXTO** - Admin deve poder criar/editar todas as disciplinas, deixando apenas código e nome
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Implementar fluxo de planilha PROGRAD via email
**DESCRIÇÃO** - Alterar download de planilha para envio por email com preview antes do envio
**CONTEXTO** - Ao invés de download, enviar planilha por email para PROGRAD com dados dos projetos aprovados
**STATUS** - [x] ✅ COMPLETO

### 8. SISTEMA DE EDITAIS MELHORADO ✅
**TAREFA** - Associar editais a semestres específicos
**DESCRIÇÃO** - Implementar lógica para editais DCC e PROGRAD por semestre
**CONTEXTO** - Editais devem ser específicos por semestre. PROGRAD fornece PDF, DCC tem informações complexas
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Implementar Anexo 1 com número do edital
**DESCRIÇÃO** - No PDF do projeto mostrar apenas número do edital do semestre selecionado
**CONTEXTO** - Anexo 1 deve referenciar o edital correto do semestre
**STATUS** - [x] ✅ COMPLETO

### 9. MELHORIAS DE UX/UI ✅
**TAREFA** - Remover cookie UFBA no logout
**DESCRIÇÃO** - Limpar cookies de sessão UFBA no processo de logout
**CONTEXTO** - Garantir logout completo do sistema CAS
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Remover "Ver Projetos" e deixar apenas dashboard professor
**DESCRIÇÃO** - Consolidar informações de projetos apenas no dashboard, removendo página separada
**CONTEXTO** - Simplificar navegação, concentrando informações no dashboard
**STATUS** - [x] ✅ COMPLETO

**TAREFA** - Remover "Novo Projeto" do sidebar
**DESCRIÇÃO** - Deixar criação de projeto apenas via dashboard
**CONTEXTO** - Simplificar sidebar e centralizar ações no dashboard
**STATUS** - [x] ✅ COMPLETO

---

## 🎉 MILESTONES CONCLUÍDOS

### MILESTONE 1 - IMPORTAÇÃO DE PLANEJAMENTO DCC
**Data**: 29/09/2025  
**Tickets**: 3/3 (100%)  
**Arquivos Criados**: `spreadsheet-parser.ts`, `planejamento-dcc-parser.ts`, `process-dcc.ts`  
**Build**: ✅ Passou com sucesso  

**Funcionalidades**:
- Parser de planilhas Excel/CSV flexível
- Auto-criação de projetos com templates
- Detecção automática INDIVIDUAL vs COLETIVA
- Notificação automática por email para professores
- Suporte ao formato DCC (busca por nome ao invés de SIAPE)

**Impacto**: Redução de ~80% no trabalho manual de criação de projetos

---

### MILESTONE 2 - WORKFLOW DE BOLSAS COMPLETO
**Data**: 29/09/2025  
**Tickets**: 4/4 (100%)  
**Build**: ✅ Passou sem erros  

**Funcionalidades**:
- Gestão de bolsas PROGRAD (definir total, alocar, validar limites)
- Planilha PROGRAD com links PDF dos projetos
- Notificação automática para professores após alocação
- Dashboard em tempo real (total, alocadas, restantes)
- Controle de permissões (admin aloca, professor visualiza)

**Impacto**: Workflow completo de gestão de bolsas com transparência e auditoria

---

**STATUS ATUAL**: 🟢 Workflow de planejamento e bolsas completo | 🔴 8 tickets pendentes (Edital Interno DCC)  
**PRÓXIMO PASSO**: Implementar edital interno DCC (seção 3)  
**ÚLTIMA ATUALIZAÇÃO**: 29/09/2025