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
  <img src="https://img.shields.io/badge/Node.js-20.19.3-green?style=flat-square&logo=node.js" alt="Node.js" />
</p>

## 📋 Sumário

- [Sobre](#-sobre)
- [Funcionalidades](#-funcionalidades)
- [Tech Stack](#-tech-stack)
- [Arquitetura](#-arquitetura)
- [Deploy (Dokku)](#-deploy-dokku)
- [Começando](#-começando)
- [Estrutura](#-estrutura)
- [Scripts](#-scripts)
- [Contribuindo](#-contribuindo)

## 🎯 Sobre

Sistema completo para gerenciamento de programas de monitoria acadêmica da UFBA. Automatiza todo o ciclo de vida: criação de projetos, inscrições, seleção e acompanhamento de monitores.

**Objetivos**: Digitalização completa, transparência no processo seletivo, eficiência operacional e integração com sistemas UFBA.

## ⚡ Funcionalidades

### 👨‍🏫 Professor
- Criar/gerenciar projetos de monitoria (individual/coletivo)
- Avaliar e selecionar candidatos
- Gerar atas e termos de compromisso
- Gerenciar disciplinas e voluntários

### 👨‍🎓 Aluno
- Buscar e se inscrever em vagas
- Acompanhar status da inscrição
- Visualizar resultados e feedback
- Fazer upload de documentos

### 👨‍💼 Admin
- Gerenciar projetos, editais e aprovações
- Configurar cursos, departamentos e disciplinas
- Alocar bolsas por departamento
- Gerar relatórios e analytics
- Gerenciar usuários e permissões
- **Audit Logs**: Visualizar histórico de ações do sistema

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15.1.4 (App Router)
- **Components**: shadcn/ui + Radix UI (Atomic Design)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State**: TanStack Query
- **PDF**: React PDF + PDF-lib

### Backend
- **API**: tRPC v11 (type-safe, 3-layer architecture)
- **ORM**: Drizzle
- **Auth**: Lucia + CAS UFBA
- **Storage**: MinIO (S3)
- **Email**: Nodemailer
- **DB**: PostgreSQL 16.3

## 🏗️ Arquitetura
[Diagrama da Arquitetura](https://docs.google.com/presentation/d/1XnN4WE_xpnN4NS-1hLHdaVivDtbAuN0l97IwUsy6Olc/edit?usp=sharing)
### Backend - 3 Layer Pattern

```
Router (tRPC) → Service (business logic) → Repository (data access)
```

**Routers** (`src/server/api/routers/`): 50-150 lines
- tRPC definitions, validation (Zod)
- Delegate to services
- Transform domain errors → TRPCError

**Services** (`src/server/services/`): 200-300 lines
- Business logic orchestration
- Factory pattern: `createXService(db)`
- Coordinate repositories, external services
- Handle transactions

**Repositories** (`src/server/services/`): 150-250 lines
- CRUD + complex Drizzle queries
- Data transformation (DB → Domain)
- No business logic

### Frontend - Atomic Design

```
Atoms → Molecules → Organisms → Templates → Pages
```

**Atoms** (`src/components/atoms/`): Pure UI (<50 lines)
- StatusBadge, EmptyState, LoadingSpinner

**Molecules** (`src/components/molecules/`): Composite (<100 lines)
- DataCard, FormFieldWrapper

**Organisms** (`src/components/organisms/`): Complex blocks (<200 lines)
- FormDialog, PageHeader

**Features** (`src/components/features/`): Domain-specific (<300 lines)
- Organized by domain (admin, professor, profile, projects, etc.)

**Custom Hooks** (`src/hooks/`):
- `useTRPCMutation` - Auto toast + query invalidation
- `useDialogState` - Dialog state management
- `useTableFilters` - Table filtering/sorting
- `useErrorHandler` - Type-safe error handling

### Type System (`src/types/`)

**Single Source of Truth**:
```
DB (pgEnum) → TS Types → Zod Schemas → Routers/Components
```

- All types centralized in `@/types`
- No DTOs, use `z.infer<typeof schema>`
- Domain-specific files: `auth.ts`, `project.ts`, `inscription.ts`, etc.
- Utilities: `errors.ts`, `table.ts`, `forms.ts`

### Audit Log System

Sistema de auditoria para rastrear ações críticas no sistema.

**Estrutura**:
```
src/server/db/schema.ts          # auditLogTable + enums
src/types/audit.ts               # Types e constantes
src/server/services/audit/       # Repository + Service
src/server/api/routers/audit/    # Router (admin only)
src/app/home/admin/audit-logs/   # UI admin
```

**Ações rastreadas**: `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `SUBMIT`, `SIGN`, `LOGIN`, `LOGOUT`, `SEND_NOTIFICATION`, `PUBLISH`, `SELECT`, `ACCEPT`

**Entidades**: `PROJETO`, `INSCRICAO`, `EDITAL`, `RELATORIO`, `VAGA`, `USER`, `PROFESSOR`, `ALUNO`, `NOTIFICATION`

**Uso em services**:
```typescript
import { createAuditService } from '@/server/services/audit/audit-service'
import { AUDIT_ACTION_SEND_NOTIFICATION, AUDIT_ENTITY_NOTIFICATION } from '@/types'

const auditService = createAuditService(db)

await auditService.log({
  userId: ctx.user.id,
  action: AUDIT_ACTION_SEND_NOTIFICATION,
  entityType: AUDIT_ENTITY_NOTIFICATION,
  entityId: projetoId,  // opcional
  details: { ano, semestre, emailsEnviados },  // JSON opcional
  ipAddress: ctx.req?.ip,  // opcional
  userAgent: ctx.req?.headers['user-agent'],  // opcional
})
```

**Para adicionar novas ações/entidades**:
1. Adicionar valor ao enum em `src/server/db/schema.ts` (`auditActionEnum` ou `auditEntityEnum`)
2. Adicionar constante em `src/types/audit.ts`
3. Gerar migration: `npm run drizzle:generate`
4. Aplicar migration: `npm run drizzle:migrate`

## 🚀 Deploy (Dokku)

### Configuração do Servidor

O deploy é feito via SSH para Dokku em `app.ic.ufba.br`:

```bash
# Deploy manual
./deploy.sh

# Ou via git push
git push dokku main:master
```

**Configuração SSH** (`~/.ssh/config`):
```
Host app.ic.ufba.br
  HostName app.ic.ufba.br
  Port 9999
  User dokku
```

### MinIO (Storage S3)

O sistema usa MinIO para armazenamento de arquivos (PDFs, documentos).

**Gerenciamento de Access Keys**:

Access keys são globais por usuário (não por bucket). Para criar novas:

```bash
# Instalar mc (MinIO Client)
brew install minio/stable/mc

# Configurar alias (usar credenciais root do MinIO)
mc alias set minio-prod https://sistema-de-monitoria-minio.app.ic.ufba.br MINIO_ROOT_USER MINIO_ROOT_PASSWORD

# Criar nova access key
mc admin accesskey create minio-prod

# Atualizar no Dokku
ssh -t -p 9999 dokku@app.ic.ufba.br config:set sistema-de-monitoria \
  MINIO_ACCESS_KEY="NOVA_KEY" \
  MINIO_SECRET_KEY="NOVA_SECRET"
```

**Variáveis de ambiente necessárias**:
- `MINIO_ENDPOINT`: Host do MinIO (ex: `sistema-de-monitoria-minio.app.ic.ufba.br`)
- `MINIO_ACCESS_KEY`: Access key do MinIO
- `MINIO_SECRET_KEY`: Secret key do MinIO
- `MINIO_BUCKET_NAME`: Nome do bucket (ex: `sistema-de-monitoria-production`)

### Troubleshooting

**Erro "InvalidAccessKeyId"**: Recriar access key via `mc admin accesskey create`.

**Erro de conexão SSH**: Verificar se o IP em `/etc/hosts` está correto:
```bash
# Flush DNS cache (macOS)
sudo killall -HUP mDNSResponder

# Verificar resolução
ping app.ic.ufba.br
```

**Ver logs de produção**:
```bash
ssh -t -p 9999 dokku@app.ic.ufba.br logs sistema-de-monitoria --tail 100
```

## 🎬 Começando

### Pré-requisitos
- Node.js 20.19.3
- npm 10.8.2
- Docker + Docker Compose

### Setup Rápido

```bash
# Clone
git clone https://github.com/seu-usuario/sistema-de-monitoria-ic.git
cd sistema-de-monitoria-ic

# Install
npm install

# Env
cp .env.sample .env
# Edite .env com suas configurações

# Database
docker-compose up -d
npm run db:push

# Dev
npm run dev
```

Acesse: `http://localhost:3000`

## 📁 Estrutura

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # tRPC + CAS + OpenAPI
│   ├── docs/                # API docs
│   └── home/                # App pages
│       ├── admin/          # 25 admin pages
│       ├── professor/      # 14 professor pages
│       ├── student/        # 4 student pages
│       └── common/         # Shared pages
│
├── components/              # Atomic Design
│   ├── atoms/              # StatusBadge, EmptyState, LoadingSpinner
│   ├── molecules/          # DataCard, FormFieldWrapper
│   ├── organisms/          # FormDialog, PageHeader
│   ├── features/           # Domain components
│   │   ├── admin/
│   │   ├── profile/
│   │   └── projects/
│   ├── layout/             # Sidebar, PagesLayout
│   └── ui/                 # shadcn/ui
│
├── server/                  # Backend (3-layer)
│   ├── api/
│   │   └── routers/        # tRPC routers (50-150 lines)
│   ├── services/           # Business logic (200-300 lines)
│   │   ├── user/
│   │   ├── projeto/
│   │   └── */
│   ├── db/                 # Drizzle schema
│   └── lib/
│       ├── email/          # Email templates by domain
│       ├── pdf/            # PDF generation
│       └── errors.ts       # Domain errors
│
├── hooks/                   # Custom hooks
│   ├── useTRPCMutation.ts
│   ├── useDialogState.ts
│   ├── useErrorHandler.ts
│   └── features/           # Feature-specific hooks
│
├── types/                   # Type system (Single source)
│   ├── enums.ts            # All enums from DB
│   ├── errors.ts           # Error handling types
│   ├── table.ts            # Table utilities
│   ├── forms.ts            # Form utilities
│   └── [domain].ts         # Domain types
│
└── tests/                   # Vitest unit tests
```

## 🔧 Scripts

```bash
# Development
npm run dev              # Dev server

# Build
npm run build           # Production build
npm run start           # Production server

# Database
npm run db:push         # Sync schema (dev)
npm run db:generate     # Generate migrations
npm run db:migrate      # Run migrations
npm run db:studio       # Drizzle Studio GUI

# Code Quality
npm run lint            # Biome lint
npm run lint:fix        # Auto-fix lint issues

# Testing
npm run test            # Run unit tests
npm run test:ui         # Vitest UI
npm run test:coverage   # Coverage report
npm run test:e2e        # E2E tests (Playwright)
```

## 🎨 Design Patterns

### Component Pattern
```tsx
// Before: 789 lines monolithic file ❌
// After: Atomic composition ✅

import { PageHeader, FormDialog, DataCard } from '@/components/...'
import { useProjectManagement } from '@/hooks/features/...'

export default function Page() {
  const { data, handlers } = useProjectManagement()

  return (
    <PageHeader title="..." actions={...}>
      <DataCard icon={Icon} label="..." value={...} />
      {/* Clean composition */}
    </PageHeader>
  )
}
```

### Mutation Pattern
```tsx
// Before: 20 lines of boilerplate ❌
const mutation = api.projeto.create.useMutation({
  onSuccess: () => {
    toast({ title: "Success!" })
    queryClient.invalidateQueries()
    dialog.close()
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message })
  }
})

// After: 5 lines ✅
const mutation = useTRPCMutation(
  api.projeto.create.useMutation,
  {
    successMessage: "Projeto criado!",
    invalidateQueries: ["projeto"],
    onSuccess: () => dialog.close()
  }
)
```

### Error Handling Pattern
```tsx
// Before: error: any ❌
catch (error: any) {
  toast({ description: error.message || "Error" })
}

// After: Type-safe ✅
import { formatErrorResponse } from '@/types'

catch (error) {
  const { title, message } = formatErrorResponse(error)
  toast({ title, description: message, variant: "destructive" })
}
```

## 📊 Métricas

### Redução de Código
- `admin/manage-projects`: 789 → 178 lines (-77%)
- `home/profile`: 772 → 64 lines (-92%)
- `admin/departamentos`: 716 → 140 lines (-80%)

### Eliminação de Duplicação
- Status badges: 57+ → 1 component
- Toast patterns: 96+ → 1 hook
- Dialog states: 32+ → 1 hook
- Error handling: 55 `:any` → 0

### Qualidade
- ✅ 100% TypeScript strict mode
- ✅ Zero `:any` types
- ✅ All files <300 lines
- ✅ WCAG AA accessibility
- ✅ Atomic design compliance

## 🤝 Contribuindo

### Convenções
- **TypeScript**: `strict: true`, no `:any`
- **Files**: Max 300 lines (400 for routers)
- **Components**: Atomic design pattern
- **Backend**: 3-layer (Router → Service → Repository)
- **Types**: Centralized in `@/types`
- **Tests**: Coverage required for new features

### Git Flow
```bash
git checkout -b feature/amazing-feature
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

## 📝 Licença

© 2025 Universidade Federal da Bahia (UFBA) - Instituto de Computação (IC)

---

<p align="center">Desenvolvido com ❤️ pelo IC-UFBA</p>
