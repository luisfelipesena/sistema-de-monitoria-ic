# Documentação do Schema do Banco de Dados

Este documento explica o schema do banco de dados definido em `apps/backend/app/database/schema.ts`, vinculando cada tabela e coluna aos requisitos coletados nas notas do cliente.

## Tabelas Principais

### `userTable`

*   **Propósito:** Armazena informações básicas do usuário e lida com a autenticação.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único para o usuário (provavelmente do Lucia-auth).
    *   `email`: Endereço de e-mail do usuário (único, necessário para login).
    *   `hashed_password`: Senha do usuário armazenada de forma segura (gerenciada pelo Lucia-auth).
    *   `role`: (`userRoleEnum`) Papel do usuário no sistema (`admin`, `monitor`, `student`). Determina permissões.

### `sessionTable`

*   **Propósito:** Gerencia sessões de login do usuário (gerenciada pelo Lucia-auth).
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único da sessão.
    *   `userId`: (Chave Estrangeira para `userTable`) Vincula a sessão a um usuário.
    *   `expiresAt`: Timestamp indicando quando a sessão expira.

## Tabelas Específicas da Aplicação

### `departmentTable`

*   **Propósito:** Representa os departamentos da universidade envolvidos na monitoria (ex: DCC, DCI).
*   **Contexto:** Necessário para agrupar disciplinas e potencialmente para gerar relatórios/planilhas específicos do departamento.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único do departamento.
    *   `name`: Nome completo do departamento (ex: "Departamento de Ciência da Computação").
    *   `initials`: Sigla/acrônimo curto para o departamento (ex: "DCC").

### `professorTable`

*   **Propósito:** Vincula uma entrada da `userTable` a um perfil de professor, permitindo funcionalidades e relacionamentos específicos do professor.
*   **Contexto:** Necessário para identificar professores responsáveis e participantes dos projetos.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único do professor.
    *   `userId`: (Chave Estrangeira para `userTable`) Vincula à conta de usuário correspondente. É único para garantir um perfil de professor por usuário.

### `semesterTable`

*   **Propósito:** Representa semestres acadêmicos (ex: 2025.1).
*   **Contexto:** Projetos, vagas e períodos de inscrição estão vinculados a semestres específicos.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único do semestre.
    *   `year`: O ano acadêmico (ex: 2025).
    *   `period`: O período dentro do ano (ex: 1 para o primeiro semestre, 2 para o segundo).

### `disciplineTable`

*   **Propósito:** Armazena informações sobre disciplinas/cursos universitários.
*   **Contexto:** Projetos de monitoria estão associados a disciplinas específicas.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único da disciplina.
    *   `name`: Nome completo da disciplina (ex: "Algoritmos e Estruturas de Dados I").
    *   `code`: Código oficial da universidade para a disciplina (ex: "MATA40"). Único.
    *   `departmentId`: (Chave Estrangeira para `departmentTable`) Vincula a disciplina ao seu departamento pai.

### `projectTable`

*   **Propósito:** Representa um único projeto de monitoria para uma disciplina específica em um semestre.
*   **Contexto:** Entidade central para o fluxo de trabalho da Fase 1 (criação, submissão, aprovação da proposta). Também vinculada a vagas, inscrições e arquivos.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único do projeto.
    *   `semesterId`: (Chave Estrangeira para `semesterTable`) O semestre ao qual o projeto pertence.
    *   `disciplineId`: (Chave Estrangeira para `disciplineTable`) A disciplina para a qual o projeto é.
    *   `responsibleProfessorId`: (Chave Estrangeira para `professorTable`) O professor principal gerenciando o projeto.
    *   `objectives`: Campo de texto para descrever os objetivos do projeto.
    *   `status`: (`projectStatusEnum`) Status atual do projeto (`draft`, `submitted`, `approved`, `rejected`).
    *   `signedProposalFileId`: (Chave Estrangeira para `projectFileTable`) Vínculo opcional ao documento da proposta assinada e enviada.
    *   `ataFileId`: (Chave Estrangeira para `projectFileTable`) Vínculo opcional à ata da reunião de seleção enviada (`ata`).
    *   `createdAt`: Timestamp da criação do projeto.
    *   `updatedAt`: Timestamp da última atualização do projeto.

### `projectProfessorTable`

*   **Propósito:** Tabela de junção muitos-para-muitos que vincula professores participantes (além do responsável) a um projeto.
*   **Contexto:** Cumpre o requisito de listar todos os professores envolvidos em um projeto.
*   **Colunas:**
    *   `projectId`: (Chave Estrangeira para `projectTable`)
    *   `professorId`: (Chave Estrangeira para `professorTable`)
    *   *(Chave Primária Composta em `projectId`, `professorId`)*

### `projectFileTable`

*   **Propósito:** Armazena metadados sobre arquivos enviados em relação a projetos ou períodos de inscrição.
*   **Contexto:** Necessário para armazenar propostas de projeto, documentos assinados, atas de seleção e o edital oficial.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único do arquivo.
    *   `projectId`: (Chave Estrangeira para `projectTable`) Vincula o arquivo a um projeto específico (pode ser nulo se for um arquivo global como um modelo de edital, embora atualmente vinculado).
    *   `uploaderId`: (Chave Estrangeira para `userTable`) Identifica o usuário que enviou o arquivo.
    *   `fileType`: (`fileTypeEnum`) Tipo do arquivo enviado (`proposal`, `signed_proposal`, `edital`, `ata`, `selection_result`).
    *   `filePath`: Caminho ou chave onde o arquivo real está armazenado (ex: chave S3, caminho local).
    *   `fileName`: Nome original do arquivo enviado.
    *   `fileSize`: Tamanho do arquivo em bytes.
    *   `mimeType`: Tipo MIME do arquivo (ex: `application/pdf`).
    *   `uploadedAt`: Timestamp do envio do arquivo.

### `vacancyTable`

*   **Propósito:** Define o número de vagas de monitoria disponíveis (bolsista ou voluntário) para um projeto específico.
*   **Contexto:** Aborda os requisitos da Fase 2 onde Admins definem números de bolsas (`bolsista`) e Professores definem números de voluntários (`voluntario`).
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único da vaga.
    *   `projectId`: (Chave Estrangeira para `projectTable`) Vincula a definição da vaga a um projeto.
    *   `type`: (`vacancyTypeEnum`) Tipo de vaga (`bolsista`, `voluntario`).
    *   `quantity`: Número de posições disponíveis para este tipo neste projeto.

### `applicationPeriodTable`

*   **Propósito:** Define as datas de início e fim para inscrições de alunos para um determinado semestre.
*   **Contexto:** Requisito principal para a Fase 2, habilitando a janela do processo de inscrição.
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único do período de inscrição.
    *   `semesterId`: (Chave Estrangeira para `semesterTable`) Vincula o período a um semestre.
    *   `startDate`: Timestamp de quando as inscrições abrem.
    *   `endDate`: Timestamp de quando as inscrições fecham.
    *   `editalFileId`: (Chave Estrangeira para `projectFileTable`) Vínculo opcional ao PDF do anúncio oficial (`edital`) para este período de inscrição.

### `applicationTable`

*   **Propósito:** Registra a inscrição de um aluno em um projeto de monitoria específico.
*   **Contexto:** Entidade central para a Fase 3 (inscrições de alunos) e Fase 4 (aceitação/rejeição de alunos).
*   **Colunas:**
    *   `id`: (Chave Primária) Identificador único da inscrição.
    *   `studentId`: (Chave Estrangeira para `userTable`) O aluno que se inscreve (usuário com papel 'student').
    *   `projectId`: (Chave Estrangeira para `projectTable`) O projeto para o qual o aluno está se inscrevendo.
    *   `applicationDate`: Timestamp de quando a inscrição foi enviada.
    *   `status`: (`applicationStatusEnum`) Status atual da inscrição (`submitted`, `selected`, `rejected`, `accepted_bolsista`, `accepted_voluntario`, `declined`).
    *   `acceptanceDeadline`: Timestamp opcional indicando até quando uma vaga oferecida deve ser aceita.

## Enums

*   `userRoleEnum`: (`admin`, `monitor`, `student`) - Definido em `userTable`.
*   `projectStatusEnum`: (`draft`, `submitted`, `approved`, `rejected`) - Usado em `projectTable`.
*   `fileTypeEnum`: (`proposal`, `signed_proposal`, `edital`, `ata`, `selection_result`) - Usado em `projectFileTable`.
*   `vacancyTypeEnum`: (`bolsista`, `voluntario`) - Usado em `vacancyTable`.
*   `applicationStatusEnum`: (`submitted`, `selected`, `rejected`, `accepted_bolsista`, `accepted_voluntario`, `declined`) - Usado em `applicationTable`. 