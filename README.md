# Sistema de Monitoria IC - UFBA

<p align="center">
  <img src="public/images/ic-logo-clean.png" alt="Logo IC UFBA" width="200" />
</p>

<p align="center">
  <strong>Sistema de Gerenciamento de Monitoria Acadêmica</strong><br>
  Instituto de Computação - Universidade Federal da Bahia
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.1.4-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.3-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tRPC-11.0.0-purple?style=flat-square&logo=trpc" alt="tRPC" />
  <img src="https://img.shields.io/badge/PostgreSQL-16.3-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Node.js-24.1.0-green?style=flat-square&logo=node.js" alt="Node.js" />
</p>

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Instalação e Execução](#-instalação-e-execução)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API e Documentação](#-api-e-documentação)
- [Fluxo de Trabalho](#-fluxo-de-trabalho)

## 🎯 Sobre o Projeto

O **Sistema de Monitoria IC** é uma plataforma completa para gerenciamento de programas de monitoria acadêmica da UFBA. O sistema automatiza todo o ciclo de vida da monitoria, desde a criação de projetos pelos professores até a seleção e acompanhamento dos monitores.

### Principais Objetivos

- **Digitalização Completa**: Eliminar processos manuais e documentos físicos
- **Transparência**: Processo seletivo claro e rastreável
- **Eficiência**: Reduzir tempo de processamento e aprovação
- **Integração**: Conectar com sistemas existentes da UFBA (CAS/SSO)

## ⚡ Funcionalidades

### 👨‍🏫 Para Professores

- **Gestão de Projetos de Monitoria**
  - Criação de projetos individuais ou coletivos
  - Definição de vagas para bolsistas e voluntários
  - Workflow de aprovação (Rascunho → Submetido → Aprovado/Rejeitado)
  - Assinatura digital de documentos

- **Seleção de Monitores**
  - Visualização de candidatos inscritos
  - Sistema de avaliação e classificação
  - Geração de atas de seleção
  - Feedback para candidatos

- **Gestão de Disciplinas**
  - Associação de disciplinas aos projetos
  - Definição de carga horária e atividades
  - Acompanhamento de monitores ativos

### 👨‍🎓 Para Alunos

- **Inscrição em Projetos**
  - Busca de vagas disponíveis por período
  - Upload de documentos (histórico, comprovante de matrícula)
  - Acompanhamento do status da inscrição
  - Visualização de resultados e feedback

- **Painel do Monitor**
  - Acesso aos detalhes do projeto
  - Download de documentos e certificados
  - Histórico de monitorias

### 👨‍💼 Para Administradores

- **Gestão Acadêmica**
  - Cadastro de departamentos, cursos e disciplinas
  - Configuração de períodos de inscrição
  - Importação em massa de projetos via planilha

- **Aprovação e Editais**
  - Fluxo de aprovação de projetos
  - Geração automática de editais
  - Alocação de bolsas por departamento

- **Relatórios e Analytics**
  - Dashboard com métricas em tempo real
  - Relatórios de desempenho por departamento
  - Exportação de dados para análise

- **Gestão de Usuários**
  - Sistema de convite para professores
  - Gerenciamento de permissões
  - Integração com CAS/UFBA

## 🏗️ Arquitetura

### Stack Tecnológica

#### Frontend
- **Framework**: Next.js 15.1.4 (App Router)
- **UI Components**: shadcn/ui + Radix UI
- **Estilização**: Tailwind CSS
- **Formulários**: React Hook Form + Zod
- **Estado**: TanStack Query (React Query)
- **PDF**: React PDF Renderer + PDF-lib

#### Backend
- **API**: tRPC v11 (Type-safe API)
- **ORM**: Drizzle ORM
- **Autenticação**: Lucia Auth + CAS UFBA
- **Storage**: MinIO (S3-compatible)
- **Email**: Nodemailer
- **Logs**: Pino

#### Infraestrutura
- **Database**: PostgreSQL 16.3
- **Container**: Docker + Docker Compose
- **Node**: v24.1.0
- **Package Manager**: npm 10.8.2

### Padrões e Boas Práticas

- **Type Safety**: TypeScript em todo o projeto
- **Code Quality**: Biome para linting e formatação
- **API Design**: RESTful via tRPC + OpenAPI
- **Security**: Autenticação JWT, API Keys, validação Zod
- **Performance**: Server Components, lazy loading, caching

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js 24.1.0
- npm 10.8.2
- Docker e Docker Compose
- Conta no MinIO ou S3

### Configuração do Ambiente

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/sistema-de-monitoria-ic.git
cd sistema-de-monitoria-ic
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.sample .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema-de-monitoria-ic"
CAS_SERVER_URL_PREFIX="https://autenticacao.ufba.br/ca"
SERVER_URL="http://localhost:3000/api"
CLIENT_URL="http://localhost:3000"
MINIO_ENDPOINT=sistema-de-monitoria-minio.app.ic.ufba.br
MINIO_ACCESS_KEY=yDuaIivNT94ngIToIlnS
MINIO_SECRET_KEY=y4R8w2faAJIwz3i9tAJ1vd9PBpewa3LqAuKEPvZ3
MINIO_BUCKET_NAME=sistema-de-monitoria-dev
NODE_ENV=development
EMAIL_USER="sistema.monitoria.ic@gmail.com"
EMAIL_PASS=""

VITE_ENABLE_STAGEWISE=true
```

4. **Inicie o banco de dados**
```bash
docker-compose up -d
```

5. **Execute as migrações**
```bash
npm run db:push
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

7. **Acesse a aplicação**
```
http://localhost:3000
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build e Produção
npm run build        # Build para produção
npm run start        # Inicia servidor de produção

# Database
npm run db:generate  # Gera migrações
npm run db:migrate   # Executa migrações
npm run db:push      # Sincroniza schema
npm run db:studio    # Abre Drizzle Studio
npm run db:drop      # Remove todas as tabelas

# Code Quality
npm run lint         # Executa linting
npm run lint:fix     # Corrige problemas de linting
npm run format       # Formata código

# Testes
npm run test         # Executa os testes unitários
npm run test:ui      # Inicia a UI interativa do Vitest
npm run test:coverage # Gera um relatório de cobertura de testes
```

## 📁 Estrutura do Projeto

```
sistema-de-monitoria-ic/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── cas-**/        # CAS authentication
│   │   │   ├── openapi/       # OpenAPI endpoints
│   │   │   └── trpc/          # tRPC endpoint
│   │   ├── docs/              # API documentation
│   │   └── home/              # Páginas da aplicação
│   │       ├── admin/         # Páginas administrativas
│   │       ├── professor/     # Páginas do professor
│   │       └── student/       # Páginas do aluno
│   │
│   ├── components/            # Componentes React
│   │   ├── features/          # Componentes específicos
│   │   ├── layout/            # Layout components
│   │   └── ui/                # shadcn/ui components
│   │
│   ├── server/                # Backend
│   │   ├── api/               # tRPC routers
│   │   │   └── routers/       # Rotas organizadas por domínio
│   │   ├── db/                # Database (Drizzle)
│   │   ├── email-templates/   # Templates de email
│   │   └── lib/               # Utilitários do servidor
│   │
│   ├── hooks/                 # React hooks customizados
│   ├── lib/                   # Utilitários compartilhados
│   └── utils/                 # Funções auxiliares
│
├── public/                    # Arquivos estáticos
├── docs/                      # Documentação adicional
├── drizzle/                   # Migrações do banco
├── src/tests/                 # Testes unitários e de integração
├── docker-compose.yml         # Configuração Docker
└── package.json              # Dependências e scripts
```

## 📡 API e Documentação

### OpenAPI/Swagger

A documentação interativa da API está disponível em:
[https://sistema-de-monitoria.app.ic.ufba.br/docs](https://sistema-de-monitoria.app.ic.ufba.br/docs)

### Endpoints tRPC

O sistema expõe os seguintes routers via tRPC:

- **Auth**: `/api/trpc/me.*`
- **Projetos**: `/api/trpc/projeto.*`
- **Inscrições**: `/api/trpc/inscricao.*`
- **Disciplinas**: `/api/trpc/discipline.*`
- **Departamentos**: `/api/trpc/departamento.*`
- **Usuários**: `/api/trpc/user.*`
- **Arquivos**: `/api/trpc/file.*`
- **Analytics**: `/api/trpc/analytics.*`

### Autenticação API

Para acesso programático, use API Keys:

```bash
# Header x-api-key
curl -H "x-api-key: your-api-key" http://localhost:3000/api/openapi/projeto/list

# Bearer Token
curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/openapi/projeto/list
```

## 🔄 Fluxo de Trabalho

### 1. Criação de Projeto

```mermaid
flowchart LR
    A[Rascunho] --> B[Submetido] --> C[Em Análise] --> D[Aprovado/Rejeitado]
```

### 2. Processo de Inscrição

```mermaid
flowchart LR
    A[Período Aberto] --> B[Inscrição] --> C[Análise] --> D[Seleção] --> E[Resultado]
```

### 3. Gestão de Documentos

```mermaid
flowchart LR
    A[Upload] --> B[Validação] --> C[Assinatura Digital] --> D[Arquivamento]
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Convenções de Código

- Use TypeScript com `strict: true`
- Siga as regras do Biome
- Mantenha componentes pequenos e focados
- Escreva testes para novas funcionalidades
- Documente APIs com JSDoc

## 📝 Licença

Este projeto é propriedade da Universidade Federal da Bahia (UFBA) e do Instituto de Computação (IC).

---

<p align="center">
  Desenvolvido com ❤️ pelo time de desenvolvimento do IC-UFBA
</p>