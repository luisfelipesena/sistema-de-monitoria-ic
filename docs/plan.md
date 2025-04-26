# Plano de Desenvolvimento: Sistema de Monitoria IC

Este plano descreve as fases de desenvolvimento para o Sistema de Gerenciamento de Monitoria, dividindo os requisitos do cliente em etapas acionáveis, considerando a estrutura unificada do projeto com Vinxi.

## Fase 1: Proposta de Projeto e Configuração Inicial

**Objetivo:** Permitir que professores criem, enviem e gerenciem propostas de projetos de monitoria para um determinado semestre. Permitir que Administradores gerenciem professores e dados básicos do sistema.

**Dependências do Schema:** `userTable`, `professorTable`, `departmentTable`, `disciplineTable`, `semesterTable`, `projectTable`, `projectProfessorTable`, `projectFileTable`, `projectStatusEnum`, `fileTypeEnum` (Definidos em `src/server/database/schema.ts` ou similar).

**API Endpoints (Implementados em `src/routes/api/...` ou `src/server/routes/...`)**

1.  **CRUD:**
    - `/api/departments`: GET (listar), POST (criar - Somente Admin)
    - `/api/disciplines`: GET (listar, filtrar por departamento), POST (criar - Somente Admin)
    - `/api/semesters`: GET (listar), POST (criar - Somente Admin)
    - `/api/professors`: GET (listar), POST (vincular usuário ao professor - Somente Admin) - _Requer integração com gerenciamento de usuários._
    - `/api/projects`:
      - POST / (Criar rascunho do projeto - Professor)
      - GET / (Listar projetos - Filtrar por professor, semestre, status, disciplina - Professor/Admin)
      - GET /:id (Obter detalhes do projeto - Professor/Admin)
      - PUT /:id (Atualizar detalhes do projeto, objetivos - Professor Responsável, somente se for rascunho)
      - POST /:id/submit (Mudar status para 'submitted' - Professor Responsável)
      - POST /:id/approve (Mudar status para 'approved' - Admin)
      - POST /:id/reject (Mudar status para 'rejected' - Admin)
      - POST /:id/professors (Adicionar professor participante - Professor Responsável)
      - DELETE /:id/professors/:profId (Remover professor participante - Professor Responsável)
2.  **Manuseio de Arquivos:**
    - Configurar armazenamento de arquivos (ex: disco local para dev, S3/MinIO para prod - via variáveis de ambiente).
    - Endpoint da API: `POST /api/projects/:id/upload/:fileType` (Upload de PDF da proposta, proposta assinada - Professor/Admin). Requer `fileTypeEnum`. Registra informações do arquivo na `projectFileTable`.
    - Endpoint da API: `GET /api/files/:fileId` (Download de arquivo - Usuários autenticados com permissões apropriadas).
3.  **Lógica de Negócios (Implementada nos handlers da API ou serviços em `src/server/lib/...`)**
    - Permissões: Implementar controle de acesso baseado em função (Admin, Professor, Aluno) usando middleware ou verificações nos handlers.
    - Transições de Status: Forçar transições de status válidas do projeto.
4.  **Autenticação:**
    - Garantir que a autenticação Lucia (configurada em `src/server/lib/auth` ou similar) proteja todos os endpoints relevantes.
5.  **Migrações do Banco de Dados:**
    - Gerar (`npm run db:generate`) e aplicar (`npm run db:migrate`) migrações baseadas no schema (`src/server/database/schema.ts`).

**Componentes e Rotas do Cliente (Implementados em `src/routes/...`, `src/components/...`)**

1.  **Telas de Admin:**
    - Interfaces CRUD básicas para Departamentos, Disciplinas, Semestres (ex: `src/routes/admin/departments.tsx`).
    - Tela para vincular Usuários existentes a perfis de Professor.
    - Dashboard para visualizar/aprovar/rejeitar projetos enviados.
2.  **Telas de Professor:**
    - Dashboard para visualizar projetos próprios por semestre/status (ex: `src/routes/home/projects.tsx`).
    - Formulário para criar/editar um Projeto de Monitoria.
    - Componente/Tela para upload do PDF da proposta/proposta assinada.
    - Mecanismo (botão/ação) para submeter o projeto para aprovação.

**Tarefas:**

- [ ] API: Implementar CRUD de Departamentos
- [ ] API: Implementar CRUD de Disciplinas
- [ ] API: Implementar CRUD de Semestres
- [ ] API: Implementar vinculação de Professor
- [ ] API: Implementar CRUD de Projetos e Mudança de Status
- [ ] API: Implementar Upload/Download de Arquivos e Configuração de Armazenamento
- [ ] API: Implementar Controle de Acesso Baseado em Função
- [ ] DB: Gerar e Aplicar Migrações Iniciais
- [ ] UI: Implementar telas Admin para Gerenciamento de Dept/Disc/Sem/Prof
- [ ] UI: Implementar dashboard Admin de revisão de projetos
- [ ] UI: Implementar formulário Professor de criação/edição de projeto
- [ ] UI: Implementar dashboard Professor e upload de arquivos

---

## Fase 2: Definição de Vagas e Configuração da Inscrição

**Objetivo:** Permitir que Admins definam vagas de bolsista (`bolsista`), Professores definam vagas de voluntário (`voluntario`), e Admins configurem períodos de inscrição.

**Dependências do Schema:** `projectTable`, `vacancyTable`, `vacancyTypeEnum`, `applicationPeriodTable`, `semesterTable`, `projectFileTable`.

**API Endpoints (`src/routes/api/...` ou `src/server/routes/...`)**

1.  `/api/projects/:id/vacancies`:
    - POST / (Definir vagas - Admin para 'bolsista', Professor Responsável para 'voluntario')
    - PUT /:vacancyId (Atualizar quantidade de vagas - Permissões como acima)
    - GET / (Listar vagas para um projeto)
2.  `/api/application-periods`:
    - POST / (Criar período de inscrição para um semestre - Admin)
    - PUT /:id (Atualizar datas - Admin)
    - GET / (Listar períodos, filtrar por semestre)
    - POST /:id/upload-edital (Upload do PDF do edital oficial - Admin) - Usa infraestrutura da `projectFileTable`.

**Componentes e Rotas do Cliente (`src/routes/...`, `src/components/...`)**

1.  **Telas de Admin:**
    - Interface na visualização do Projeto ou seção separada para definir números de vagas 'bolsista'.
    - Interface para criar/gerenciar Períodos de Inscrição por semestre.
2.  **Telas de Professor:**
    - Interface na visualização do Projeto para definir números de vagas 'voluntario'.

**Tarefas:**

- [ ] API: Implementar Gerenciamento de Vagas (POST, PUT, GET)
- [ ] API: Implementar Gerenciamento de Período de Inscrição (POST, PUT, GET, Upload Edital)
- [ ] API: Atualizar Controle de Acesso
- [ ] DB: Gerar e Aplicar Migrações (se necessário)
- [ ] UI: Implementar interface Admin para vagas 'bolsista'
- [ ] UI: Implementar interface Admin para Períodos de Inscrição
- [ ] UI: Implementar interface Professor para vagas 'voluntario'

---

## Fase 3: Inscrição de Alunos e Seleção

**Objetivo:** Permitir que alunos se inscrevam para vagas de monitoria durante o período de inscrição. Permitir que professores revisem inscrições, selecionem candidatos e façam upload dos resultados da seleção (`ata`).

**Dependências do Schema:** `applicationTable`, `applicationStatusEnum`, `userTable`, `projectTable`, `projectFileTable`, `fileTypeEnum`, `vacancyTable`.

**API Endpoints (`src/routes/api/...` ou `src/server/routes/...`)**

1.  `/api/applications`:
    - POST / (Submeter inscrição - Aluno, requer período de inscrição ativo)
    - GET / (Listar inscrições - Aluno vê as próprias, Professor vê para seus projetos, Admin vê todas)
    - GET /:id (Obter detalhes da inscrição - Como acima)
2.  `/api/projects/:id/applications/:appId/select`: POST (Marcar inscrição como 'selected' - Professor Responsável)
3.  `/api/projects/:id/applications/:appId/reject`: POST (Marcar inscrição como 'rejected' - Professor Responsável)
4.  `/api/projects/:id/upload/:fileType`: Estender upload existente para lidar com tipo 'ata' (Professor Responsável) - Vincula a `projectTable.ataFileId`.
5.  `/api/projects/:id/notify-results`: POST (Disparar notificações por email para candidatos - Professor Responsável) - _Requer integração de email (Resend) na lógica do servidor._

**Componentes e Rotas do Cliente (`src/routes/...`, `src/components/...`)**

1.  **Telas de Aluno:**
    - Visualizar projetos disponíveis durante um período de inscrição ativo.
    - Formulário de inscrição.
    - Dashboard para visualizar o status da própria inscrição.
2.  **Telas de Professor:**
    - Visualizar inscrições recebidas para seus projetos.
    - Interface para marcar inscrições como 'selected' ou 'rejected'.
    - Componente/Mecanismo para upload do arquivo `ata` da seleção.
    - Botão para disparar notificações de resultado.
3.  **Telas de Admin:**
    - Visão geral de todas as inscrições, se necessário.

**Tarefas:**

- [ ] API: Implementar Submissão de Inscrição (POST /api/applications)
- [ ] API: Implementar Listagem/Detalhes de Inscrição (GET /api/applications, GET /api/applications/:id)
- [ ] API: Implementar Seleção/Rejeição de Inscrição
- [ ] API: Estender Upload de Arquivo para 'ata'
- [ ] API: Implementar Disparo de Notificação por Email (com integração Resend no servidor)
- [ ] API: Atualizar Controle de Acesso
- [ ] DB: Gerar e Aplicar Migrações
- [ ] UI: Implementar listagem de projetos/formulário de inscrição do Aluno
- [ ] UI: Implementar dashboard de inscrição do Aluno
- [ ] UI: Implementar interface de revisão/seleção de inscrição do Professor
- [ ] UI: Implementar upload de 'ata' do Professor
- [ ] UI: Implementar disparo de notificação do Professor

---

## Fase 4: Aceitação do Aluno e Finalização

**Objetivo:** Permitir que alunos selecionados aceitem ou recusem vagas de monitoria. Lidar com restrições (apenas uma vaga 'bolsista').

**Dependências do Schema:** `applicationTable`, `applicationStatusEnum`, `userTable`.

**API Endpoints (`src/routes/api/...` ou `src/server/routes/...`)**

1.  `/api/applications/:id/accept-bolsista`: POST (Aluno aceita vaga 'bolsista' - Verifica restrições no servidor). Define status para `accepted_bolsista`.
2.  `/api/applications/:id/accept-voluntario`: POST (Aluno aceita vaga 'voluntario'). Define status para `accepted_voluntario`.
3.  `/api/applications/:id/decline`: POST (Aluno recusa vaga oferecida). Define status para `declined`.
4.  **Lógica de Negócios (no Servidor):**
    - Implementar verificação de restrição para aceitar vagas 'bolsista'.
    - Lidar com potenciais prazos de aceitação.

**Componentes e Rotas do Cliente (`src/routes/...`, `src/components/...`)**

1.  **Telas de Aluno:**
    - Atualizar dashboard de inscrição para mostrar status 'selected' com botões Aceitar/Recusar.
    - Exibir avisos/erros se tentar aceitar mais de uma vaga 'bolsista'.

**Tarefas:**

- [ ] API: Implementar Aceitação de Inscrição (Bolsista, Voluntario)
- [ ] API: Implementar Recusa de Inscrição
- [ ] API: Implementar lógica de restrição 'bolsista' no servidor
- [ ] API: Atualizar Controle de Acesso
- [ ] DB: Gerar e Aplicar Migrações (se necessário)
- [ ] UI: Atualizar dashboard do Aluno com ações Aceitar/Recusar
- [ ] UI: Implementar feedback de violação de restrição

---

## Preocupações Transversais e Considerações Futuras

- **Assinatura de Documentos:** Integrar DocuSign/Docuseal/etc. para assinaturas (Fase 1). Requer pesquisa e implementação no **servidor** e componentes UI correspondentes.
- **Painel Admin:** Construir telas Admin dentro da aplicação principal (`src/routes/admin/...`).
- **Geração de Planilhas:** Implementar lógica no **servidor** para gerar os arquivos `.xlsx` e fornecer um endpoint para download (Fases 1 e 2).
- **Geração/Edição de PDF:** Se necessário gerar PDFs no servidor, usar bibliotecas como `pdf-lib`.
- **Testes:** Implementar testes unitários/integração para APIs/lógica do servidor (Vitest). Implementar testes de componentes/E2E para UI (Vitest/Playwright/Cypress).
- **Tratamento de Erros e Logging:** Implementar em todo o servidor e cliente.
- **Deployment:** Definir pipelines de CI/CD.
- **UI/UX:** Refinar componentes e fluxos.
