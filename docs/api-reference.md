# API Reference - Sistema de Monitoria IC

Documentação completa das APIs REST do Sistema de Monitoria IC.

## Base URL

```
Development: http://localhost:3000/api
Production: https://seu-dominio.com/api
```

## Autenticação

Todas as rotas protegidas requerem autenticação via sessão. O cookie de sessão é definido automaticamente após login bem-sucedido.

### Headers Necessários

```http
Cookie: auth-session=<session-id>
Content-Type: application/json
```

## Endpoints

### 🔐 Autenticação

#### Iniciar Login CAS

```http
GET /api/auth/cas-login
```

Redireciona o usuário para a página de login do CAS da UFBA.

**Query Parameters:**
- `returnTo` (opcional): URL para redirecionar após login bem-sucedido

**Response:**
```
302 Redirect to CAS login page
```

---

#### Callback CAS

```http
GET /api/auth/cas-callback
```

Endpoint de callback do CAS. Processa o ticket e cria a sessão do usuário.

**Query Parameters:**
- `ticket`: Ticket fornecido pelo CAS
- `service`: URL do serviço

**Response Success (302):**
Redireciona para `/home` ou URL especificada em `returnTo`

**Response Error (302):**
Redireciona para `/` com mensagem de erro

---

#### Logout

```http
POST /api/auth/logout
```

Encerra a sessão do usuário.

**Response:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

#### Usuário Atual

```http
GET /api/auth/me
```

Retorna os dados do usuário autenticado.

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@ufba.br",
    "role": "student",
    "nome": "João Silva",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 📋 Projetos

#### Listar Projetos

```http
GET /api/projeto
```

Lista todos os projetos visíveis para o usuário atual.

**Query Parameters:**
- `status`: Filtrar por status (DRAFT, SUBMITTED, APPROVED, REJECTED)
- `ano`: Filtrar por ano
- `semestre`: Filtrar por semestre (SEMESTRE_1, SEMESTRE_2)
- `departamentoId`: Filtrar por departamento

**Response:**
```json
[
  {
    "id": 1,
    "titulo": "Monitoria de Algoritmos",
    "departamentoId": 1,
    "departamentoNome": "DCC",
    "professorResponsavelId": 1,
    "professorResponsavelNome": "Dr. Silva",
    "disciplinas": [
      {
        "id": 1,
        "codigo": "MATA40",
        "nome": "Algoritmos e Estruturas de Dados I"
      }
    ],
    "status": "APPROVED",
    "ano": 2024,
    "semestre": "SEMESTRE_1",
    "bolsasSolicitadas": 2,
    "voluntariosSolicitados": 3,
    "bolsasDisponibilizadas": 2,
    "totalInscritos": 15,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### Criar Projeto

```http
POST /api/projeto
```

**Requer:** Role `professor`

**Request Body:**
```json
{
  "titulo": "Monitoria de Algoritmos",
  "objetivos": "Auxiliar alunos nas disciplinas de algoritmos...",
  "departamentoId": 1,
  "disciplinaIds": [1, 2],
  "professoresParticipantes": [2, 3],
  "atividades": ["Plantão de dúvidas", "Correção de exercícios"],
  "bolsasSolicitadas": 2,
  "voluntariosSolicitados": 3,
  "cargaHorariaSemana": 12,
  "numeroSemanas": 16,
  "publicoAlvo": "Alunos do 1º ao 3º semestre",
  "estimativaPessoasBenificiadas": 60,
  "tipoProposicao": "INDIVIDUAL",
  "justificativa": "Alta demanda de alunos com dificuldades..."
}
```

**Response (201):**
```json
{
  "id": 1,
  "titulo": "Monitoria de Algoritmos",
  "status": "DRAFT",
  // ... todos os campos do projeto
}
```

---

#### Detalhes do Projeto

```http
GET /api/projeto/:id
```

**Response:**
```json
{
  "id": 1,
  "titulo": "Monitoria de Algoritmos",
  "objetivos": "...",
  "professorResponsavel": {
    "id": 1,
    "nomeCompleto": "Dr. Silva"
  },
  "departamento": {
    "id": 1,
    "nome": "DCC"
  },
  "disciplinas": [...],
  "professoresParticipantes": [...],
  "atividades": [...],
  // ... todos os campos e relacionamentos
}
```

---

#### Submeter Projeto

```http
POST /api/projeto/:id/submit
```

**Requer:** Ser o professor responsável

Muda o status de DRAFT para SUBMITTED.

**Response:**
```json
{
  "success": true,
  "projeto": {
    "id": 1,
    "status": "SUBMITTED"
  }
}
```

---

#### Aprovar Projeto

```http
POST /api/projeto/:id/approve
```

**Requer:** Role `admin`

**Request Body:**
```json
{
  "bolsasDisponibilizadas": 2
}
```

**Response:**
```json
{
  "success": true,
  "projeto": {
    "id": 1,
    "status": "PENDING_ADMIN_SIGNATURE",
    "bolsasDisponibilizadas": 2
  }
}
```

---

#### Rejeitar Projeto

```http
POST /api/projeto/:id/reject
```

**Requer:** Role `admin`

**Request Body:**
```json
{
  "motivo": "Justificativa insuficiente para o número de bolsas solicitadas"
}
```

**Response:**
```json
{
  "success": true,
  "projeto": {
    "id": 1,
    "status": "REJECTED",
    "feedbackAdmin": "Justificativa insuficiente..."
  }
}
```

### 📝 Inscrições

#### Minhas Inscrições

```http
GET /api/inscricao
```

**Requer:** Role `student`

Lista todas as inscrições do aluno autenticado.

**Response:**
```json
[
  {
    "id": 1,
    "projetoId": 1,
    "projeto": {
      "titulo": "Monitoria de Algoritmos",
      "professorResponsavel": {...}
    },
    "tipoVagaPretendida": "BOLSISTA",
    "status": "SELECTED_BOLSISTA",
    "feedbackProfessor": null,
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

---

#### Criar Inscrição

```http
POST /api/monitoria/inscricao
```

**Requer:** Role `student`

**Request Body:**
```json
{
  "projetoId": 1,
  "tipoVagaPretendida": "BOLSISTA" // BOLSISTA, VOLUNTARIO, ANY
}
```

**Response (201):**
```json
{
  "success": true,
  "inscricao": {
    "id": 1,
    "status": "SUBMITTED"
  }
}
```

---

#### Aceitar Vaga

```http
POST /api/inscricao/:id/aceitar
```

**Requer:** Role `student` e ser o dono da inscrição

Aceita uma oferta de vaga (SELECTED_BOLSISTA ou SELECTED_VOLUNTARIO).

**Validações:**
- Máximo 1 bolsa por semestre
- Status deve ser SELECTED_*

**Response:**
```json
{
  "success": true,
  "message": "Monitoria aceita com sucesso!",
  "inscricao": {
    "id": 1,
    "status": "ACCEPTED_BOLSISTA"
  },
  "vaga": {
    "id": 1,
    "tipo": "BOLSISTA",
    "dataInicio": "2024-02-01"
  }
}
```

---

#### Recusar Vaga

```http
POST /api/inscricao/:id/recusar
```

**Requer:** Role `student` e ser o dono da inscrição

**Request Body (opcional):**
```json
{
  "motivo": "Conflito de horários"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Monitoria recusada",
  "inscricao": {
    "id": 1,
    "status": "REJECTED_BY_STUDENT"
  }
}
```

---

#### Listar Inscrições do Projeto

```http
GET /api/projeto/:id/inscricoes
```

**Requer:** Ser professor do projeto ou admin

Lista todas as inscrições de um projeto específico.

**Response:**
```json
[
  {
    "id": 1,
    "aluno": {
      "id": 1,
      "nomeCompleto": "João Silva",
      "matricula": "2020123456",
      "curso": "Ciência da Computação",
      "cr": 8.5
    },
    "tipoVagaPretendida": "BOLSISTA",
    "status": "SUBMITTED",
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

### 📊 Relatórios

#### Planilhas PROGRAD

```http
GET /api/relatorios/planilhas-prograd
```

**Requer:** Role `admin`

Gera arquivo Excel com dados dos monitores para envio à PROGRAD.

**Query Parameters:**
- `ano`: Ano do período (padrão: ano atual)
- `semestre`: SEMESTRE_1 ou SEMESTRE_2 (padrão: semestre atual)
- `departamentoId`: Filtrar por departamento (opcional)

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="monitores-2024-1-completo.xlsx"

[Binary Excel File]
```

O arquivo Excel contém:
- Aba 1: Resumo por Departamento
- Aba 2: Monitores Ativos
- Aba 3: Projetos Aprovados
- Aba 4: Informações do Relatório

### 🏫 Gestão Acadêmica

#### Listar Departamentos

```http
GET /api/department
```

**Response:**
```json
[
  {
    "id": 1,
    "nome": "Departamento de Ciência da Computação",
    "sigla": "DCC",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### Listar Disciplinas

```http
GET /api/disciplina
```

**Query Parameters:**
- `departamentoId`: Filtrar por departamento

**Response:**
```json
[
  {
    "id": 1,
    "codigo": "MATA40",
    "nome": "Algoritmos e Estruturas de Dados I",
    "departamentoId": 1,
    "departamentoNome": "DCC",
    "professorResponsavelId": 1,
    "professorResponsavelNome": "Dr. Silva"
  }
]
```

---

#### Períodos de Inscrição

```http
GET /api/periodo-inscricao
```

**Response:**
```json
[
  {
    "id": 1,
    "ano": 2024,
    "semestre": "SEMESTRE_1",
    "dataInicio": "2024-01-15",
    "dataFim": "2024-01-30",
    "ativo": true
  }
]
```

### 📁 Upload de Arquivos

#### Upload de Arquivo

```http
POST /api/files/upload
```

**Request:** Multipart form data
- `file`: Arquivo para upload
- `type`: Tipo do arquivo (PROPOSTA, EDITAL, etc)

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_123abc",
    "filename": "proposta-monitoria.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "url": "/api/files/access/file_123abc"
  }
}
```

---

#### Acessar Arquivo

```http
GET /api/files/access/:fileId
```

Retorna o arquivo ou redireciona para URL presigned do MinIO.

**Response:**
```
Content-Type: [mime-type do arquivo]
Content-Disposition: inline; filename="arquivo.pdf"

[Binary file data]
```

## Status Codes

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados inválidos ou faltando
- `401 Unauthorized`: Não autenticado
- `403 Forbidden`: Sem permissão para acessar
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito com estado atual (ex: já inscrito)
- `500 Internal Server Error`: Erro no servidor

## Rate Limiting

- 100 requisições por minuto por IP
- 1000 requisições por hora por usuário autenticado

## Versionamento

A API atualmente não possui versionamento. Mudanças breaking serão comunicadas com antecedência.

## Exemplos de Uso

### cURL

```bash
# Login (abre no browser)
open "http://localhost:3000/api/auth/cas-login"

# Criar projeto (com cookie de sessão)
curl -X POST http://localhost:3000/api/projeto \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-session=..." \
  -d '{
    "titulo": "Monitoria de Algoritmos",
    "objetivos": "..."
  }'

# Listar projetos
curl http://localhost:3000/api/projeto \
  -H "Cookie: auth-session=..."
```

### JavaScript/TypeScript

```typescript
// Usando o apiClient configurado
import { apiClient } from '@/utils/api-client';

// GET request
const projetos = await apiClient.get('/api/projeto').json();

// POST request
const novoProjeto = await apiClient.post('/api/projeto', {
  json: {
    titulo: 'Monitoria de Algoritmos',
    objetivos: '...'
  }
}).json();

// Com React Query
import { useQuery, useMutation } from '@tanstack/react-query';

function useProjetos() {
  return useQuery({
    queryKey: ['projetos'],
    queryFn: () => apiClient.get('/api/projeto').json()
  });
}
```