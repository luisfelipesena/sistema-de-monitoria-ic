# Plano de Desenvolvimento: Sistema de Monitoria IC

Este plano descreve as fases de desenvolvimento para o Sistema de Gerenciamento de Monitoria, dividindo os requisitos do cliente em etapas acionáveis.

## Fase 1: Proposta de Projeto e Configuração Inicial (Foco no Backend)

**Objetivo:** Permitir que professores criem, enviem e gerenciem propostas de projetos de monitoria para um determinado semestre. Permitir que Administradores gerenciem professores e dados básicos do sistema.

**Dependências do Schema:** `userTable`, `professorTable`, `departmentTable`, `disciplineTable`, `semesterTable`, `projectTable`, `projectProfessorTable`, `projectFileTable`, `projectStatusEnum`, `fileTypeEnum`.

**Backend (`@backend/`)**

1.  **Endpoints da API - CRUD:**
    *   `/departments`: GET (listar), POST (criar - Somente Admin)
    *   `/disciplines`: GET (listar, filtrar por departamento), POST (criar - Somente Admin)
    *   `/semesters`: GET (listar), POST (criar - Somente Admin)
    *   `/professors`: GET (listar), POST (vincular usuário ao professor - Somente Admin) - *Requer integração com gerenciamento de usuários.*
    *   `/projects`:
        *   POST / (Criar rascunho do projeto - Professor)
        *   GET / (Listar projetos - Filtrar por professor, semestre, status, disciplina - Professor/Admin)
        *   GET /:id (Obter detalhes do projeto - Professor/Admin)
        *   PUT /:id (Atualizar detalhes do projeto, objetivos - Professor Responsável, somente se for rascunho)
        *   POST /:id/submit (Mudar status para 'submitted' - Professor Responsável)
        *   POST /:id/approve (Mudar status para 'approved' - Admin)
        *   POST /:id/reject (Mudar status para 'rejected' - Admin)
        *   POST /:id/professors (Adicionar professor participante - Professor Responsável)
        *   DELETE /:id/professors/:profId (Remover professor participante - Professor Responsável)
2.  **Manuseio de Arquivos:**
    *   Configurar armazenamento de arquivos (ex: disco local para dev, S3 para prod).
    *   Endpoint da API: `POST /projects/:id/upload/:fileType` (Upload de PDF da proposta, proposta assinada - Professor/Admin). Requer `fileTypeEnum`. Registra informações do arquivo na `projectFileTable`.
    *   Endpoint da API: `GET /files/:fileId` (Download de arquivo - Usuários autenticados com permissões apropriadas).
3.  **Lógica de Negócios:**
    *   Permissões: Implementar controle de acesso baseado em função (Admin, Professor, Aluno). Professores devem modificar apenas seus próprios projetos (a menos que sejam Admin).
    *   Transições de Status: Forçar transições de status válidas do projeto (ex: não pode editar se não for 'draft').
4.  **Autenticação:**
    *   Garantir que a autenticação Lucia existente proteja todos os endpoints relevantes. Atualizar funções conforme necessário.
5.  **Migrações do Banco de Dados:**
    *   Gerar e aplicar migrações baseadas no `schema.ts` atualizado.

**Frontend (`@frontend/`)**

1.  **Telas de Admin:**
    *   Interfaces CRUD básicas para Departamentos, Disciplinas, Semestres.
    *   Tela para vincular Usuários existentes a perfis de Professor.
    *   Dashboard para visualizar/aprovar/rejeitar projetos enviados.
2.  **Telas de Professor:**
    *   Dashboard para visualizar projetos próprios por semestre/status.
    *   Formulário para criar/editar um Projeto de Monitoria (selecionar disciplina, adicionar objetivos, adicionar professores participantes).
    *   Tela para upload do PDF da proposta/proposta assinada.
    *   Mecanismo para submeter o projeto para aprovação.

**Tarefas:**

*   [ ] Backend: Implementar API CRUD de Departamentos
*   [ ] Backend: Implementar API CRUD de Disciplinas
*   [ ] Backend: Implementar API CRUD de Semestres
*   [ ] Backend: Implementar API de vinculação de Professor
*   [ ] Backend: Implementar API CRUD de Projetos e Mudança de Status
*   [ ] Backend: Implementar API de Upload/Download de Arquivos e Configuração de Armazenamento
*   [ ] Backend: Implementar Controle de Acesso Baseado em Função para novas APIs
*   [ ] Backend: Gerar e Aplicar Migrações do BD
*   [ ] Frontend: Implementar telas Admin para Gerenciamento de Dept/Disc/Sem/Prof
*   [ ] Frontend: Implementar dashboard Admin de revisão de projetos
*   [ ] Frontend: Implementar formulário Professor de criação/edição de projeto
*   [ ] Frontend: Implementar dashboard Professor e upload de arquivos

---

## Fase 2: Definição de Vagas e Configuração da Inscrição

**Objetivo:** Permitir que Admins definam vagas de bolsista (`bolsista`), Professores definam vagas de voluntário (`voluntario`), e Admins configurem períodos de inscrição.

**Dependências do Schema:** `projectTable`, `vacancyTable`, `vacancyTypeEnum`, `applicationPeriodTable`, `semesterTable`, `projectFileTable`.

**Backend (`@backend/`)**

1.  **Endpoints da API:**
    *   `/projects/:id/vacancies`:
        *   POST / (Definir vagas - Admin para 'bolsista', Professor Responsável para 'voluntario')
        *   PUT /:vacancyId (Atualizar quantidade de vagas - Permissões como acima)
        *   GET / (Listar vagas para um projeto)
    *   `/application-periods`:
        *   POST / (Criar período de inscrição para um semestre - Admin)
        *   PUT /:id (Atualizar datas - Admin)
        *   GET / (Listar períodos, filtrar por semestre)
        *   POST /:id/upload-edital (Upload do PDF do edital oficial - Admin) - Usa infraestrutura da `projectFileTable`.

**Frontend (`@frontend/`)**

1.  **Telas de Admin:**
    *   Interface na visualização do Projeto ou seção separada para definir números de vagas 'bolsista' por projeto.
    *   Interface para criar/gerenciar Períodos de Inscrição por semestre (definir datas, upload do edital).
2.  **Telas de Professor:**
    *   Interface na visualização do Projeto para definir números de vagas 'voluntario'.

**Tarefas:**

*   [ ] Backend: Implementar API de Gerenciamento de Vagas (POST, PUT, GET)
*   [ ] Backend: Implementar API de Gerenciamento de Período de Inscrição (POST, PUT, GET, Upload Edital)
*   [ ] Backend: Atualizar Controle de Acesso para APIs de Vagas/Períodos
*   [ ] Backend: Gerar e Aplicar Migrações do BD (se o schema mudou)
*   [ ] Frontend: Implementar interface Admin para vagas 'bolsista'
*   [ ] Frontend: Implementar interface Admin para Períodos de Inscrição
*   [ ] Frontend: Implementar interface Professor para vagas 'voluntario'

---

## Fase 3: Inscrição de Alunos e Seleção

**Objetivo:** Permitir que alunos se inscrevam para vagas de monitoria durante o período de inscrição. Permitir que professores revisem inscrições, selecionem candidatos e façam upload dos resultados da seleção (`ata`).

**Dependências do Schema:** `applicationTable`, `applicationStatusEnum`, `userTable`, `projectTable`, `projectFileTable`, `fileTypeEnum`, `vacancyTable`.

**Backend (`@backend/`)**

1.  **Endpoints da API:**
    *   `/applications`:
        *   POST / (Submeter inscrição - Aluno, requer período de inscrição ativo)
        *   GET / (Listar inscrições - Aluno vê as próprias, Professor vê para seus projetos, Admin vê todas)
        *   GET /:id (Obter detalhes da inscrição - Como acima)
    *   `/projects/:id/applications/:appId/select`: POST (Marcar inscrição como 'selected' - Professor Responsável) - *Potencialmente definir prazo de aceitação?*
    *   `/projects/:id/applications/:appId/reject`: POST (Marcar inscrição como 'rejected' - Professor Responsável)
    *   `/projects/:id/upload/:fileType`: Estender upload existente para lidar com tipo 'ata' (Professor Responsável) - Vincula a `projectTable.ataFileId`.
    *   `/projects/:id/notify-results`: POST (Disparar notificações por email para candidatos sobre seu status - Professor Responsável) - *Requer integração de email (Resend).*

**Frontend (`@frontend/`)**

1.  **Telas de Aluno:**
    *   Visualizar projetos de monitoria disponíveis durante um período de inscrição ativo.
    *   Formulário de inscrição (vincular ao projeto, potencialmente adicionar justificativa).
    *   Dashboard para visualizar o status da própria inscrição.
2.  **Telas de Professor:**
    *   Visualizar inscrições recebidas para seus projetos.
    *   Interface para marcar inscrições como 'selected' ou 'rejected'.
    *   Tela/Mecanismo para upload do arquivo `ata` da seleção.
    *   Botão para disparar notificações de resultado.
3.  **Telas de Admin:**
    *   Visão geral de todas as inscrições, se necessário.

**Tarefas:**

*   [ ] Backend: Implementar API de Submissão de Inscrição (POST /applications)
*   [ ] Backend: Implementar API de Listagem/Detalhes de Inscrição (GET /applications, GET /applications/:id)
*   [ ] Backend: Implementar API de Seleção/Rejeição de Inscrição (POST .../select, POST .../reject)
*   [ ] Backend: Estender API de Upload de Arquivo para 'ata'
*   [ ] Backend: Implementar API de Disparo de Notificação por Email
*   [ ] Backend: Integrar Resend para notificações por email
*   [ ] Backend: Atualizar Controle de Acesso
*   [ ] Backend: Gerar e Aplicar Migrações do BD
*   [ ] Frontend: Implementar listagem de projetos/formulário de inscrição do Aluno
*   [ ] Frontend: Implementar dashboard de inscrição do Aluno
*   [ ] Frontend: Implementar interface de revisão/seleção de inscrição do Professor
*   [ ] Frontend: Implementar upload de 'ata' do Professor
*   [ ] Frontend: Implementar disparo de notificação do Professor

---

## Fase 4: Aceitação do Aluno e Finalização

**Objetivo:** Permitir que alunos selecionados aceitem ou recusem vagas de monitoria. Lidar com restrições (apenas uma vaga 'bolsista').

**Dependências do Schema:** `applicationTable`, `applicationStatusEnum`, `userTable`.

**Backend (`@backend/`)**

1.  **Endpoints da API:**
    *   `/applications/:id/accept-bolsista`: POST (Aluno aceita vaga 'bolsista' - Verifica se o aluno já aceitou outra vaga 'bolsista' no semestre). Define status para `accepted_bolsista`.
    *   `/applications/:id/accept-voluntario`: POST (Aluno aceita vaga 'voluntario'). Define status para `accepted_voluntario`.
    *   `/applications/:id/decline`: POST (Aluno recusa vaga oferecida). Define status para `declined`.
2.  **Lógica de Negócios:**
    *   Implementar verificação de restrição para aceitar vagas 'bolsista'.
    *   Lidar com potenciais prazos de aceitação (se implementado).

**Frontend (`@frontend/`)**

1.  **Telas de Aluno:**
    *   Atualizar dashboard de inscrição para mostrar status 'selected' com botões Aceitar/Recusar.
    *   Exibir avisos/erros se tentar aceitar mais de uma vaga 'bolsista'.

**Tarefas:**

*   [ ] Backend: Implementar API de Aceitação de Inscrição (Bolsista, Voluntario)
*   [ ] Backend: Implementar API de Recusa de Inscrição
*   [ ] Backend: Implementar lógica de restrição 'bolsista'
*   [ ] Backend: Atualizar Controle de Acesso
*   [ ] Backend: Gerar e Aplicar Migrações do BD (se o schema mudou)
*   [ ] Frontend: Atualizar dashboard do Aluno com ações Aceitar/Recusar
*   [ ] Frontend: Implementar feedback de violação de restrição

---

## Preocupações Transversais e Considerações Futuras

*   **Assinatura de Documentos:** Integrar DocuSign/it-br/SIPAC ou similar para assinaturas de propostas de projeto (Fase 1). Isso requer pesquisa sobre APIs e potencialmente novos elementos de schema. Docuseal é outra opção mencionada.
*   **Painel Admin:** Considerar o uso de Retool ou ferramenta similar para algumas telas Admin se a complexidade aumentar significativamente, ou construir telas personalizadas no aplicativo frontend principal.
*   **Geração de Planilhas:** Implementar lógica para gerar os arquivos `.xlsx` ou `.csv` necessários com base nos dados do projeto e vagas (Fases 1 e 2). Bibliotecas como `xlsx` ou `papaparse` (no frontend/backend) podem ser usadas.
*   **Geração/Edição de PDF:** Se o requisito for *gerar* PDFs editáveis a partir de modelos, bibliotecas como `pdf-lib` podem ser necessárias. Se for apenas upload de PDFs pré-preenchidos, o manuseio de arquivos atual é suficiente.
*   **Testes:** Implementar testes unitários e de integração para APIs e lógica de negócios do backend. Implementar testes de componentes e ponta a ponta para o frontend.
*   **Tratamento de Erros e Logging:** Implementar tratamento robusto de erros e logging em todo o backend e frontend.
*   **Deployment:** Definir pipelines de CI/CD para backend e frontend.
*   **UI/UX:** Refinar componentes de frontend e fluxos de usuário para melhor usabilidade. 