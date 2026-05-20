# Backend Architecture - Senior-Level 3-Layer Pattern

## Core Principles

### 1. Single Responsibility
- **Routers**: tRPC definitions + validation only
- **Services**: Business logic orchestration only
- **Repositories**: Data access only
- **Types**: Centralized in `src/types/` - NEVER export from services

### 2. Type Safety (Single Source of Truth)
```
Database (pgEnum) → src/types/enums.ts → Zod Schemas → Routers/Components
```

**Flow:**
1. Extract DB enums: `export const SEMESTRE_1 = 'SEMESTRE_1' as const`
2. Create TS type: `export type Semestre = typeof SEMESTRE_1 | typeof SEMESTRE_2`
3. Use in Zod: `z.enum([SEMESTRE_1, SEMESTRE_2])`
4. Import everywhere: `import { SEMESTRE_1, type Semestre } from '@/types'`

**NEVER:**
- ❌ Hard strings: `z.enum(['SEMESTRE_1', 'SEMESTRE_2'])`
- ❌ Type exports from services: `export type CreateProjetoInput = {...}`
- ❌ Local type definitions in routers (use `@/types`)

### 3. Error Handling (Domain Errors)

**Centralized Errors** (`src/server/lib/errors.ts`):
```typescript
// Base error - ALL domain errors extend this
export class BusinessError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'BusinessError'
  }
}

// Specific errors with proper signatures
export class NotFoundError extends BusinessError {
  constructor(resource: string, id: number | string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND')
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}
```

**Usage Pattern:**
```typescript
// Service throws domain errors
throw new NotFoundError('Projeto', projetoId)  // ✅
throw new BusinessError('Invalid state', 'BAD_REQUEST')  // ✅

// Router catches and transforms
try {
  return await service.getProjeto(id)
} catch (error) {
  if (error instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  throw error
}
```

**Re-exported** in `src/types/errors.ts` for convenience.

---

## Layer Responsibilities

### Router Layer (`src/server/api/routers/{domain}/*.ts`)
**Max: 500 lines** (split if over)

**ONLY:**
- tRPC procedure definitions
- Input/output Zod schemas (or import from `@/types`)
- Call service methods
- Transform domain errors → TRPCError

**NEVER:**
- Database queries
- Business logic
- Type definitions (use `@/types`)

```typescript
export const projetoRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .output(projetoSchema)
    .query(async ({ ctx, input }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.getProjeto(ctx.user.id, ctx.user.role, input.id)
      } catch (error) {
        throw transformError(error)  // Domain error → TRPCError
      }
    }),
})
```

### Service Layer (`src/server/services/{domain}/*-service.ts`)
**Max: 400 lines** (split by subdomain if over)

**Factory Pattern:**
```typescript
export function createProjetoService(db: Database) {
  const repo = createProjetoRepository(db)

  return {
    async getProjeto(userId: number, userRole: UserRole, id: number) {
      // 1. Authorization
      requireAdminOrProfessor(userRole)

      // 2. Data retrieval
      const projeto = await repo.findById(id)
      if (!projeto) {
        throw new NotFoundError('Projeto', id)
      }

      // 3. Business logic
      if (!isAdmin(userRole) && projeto.professorResponsavelId !== userId) {
        throw new ForbiddenError('Acesso negado')
      }

      // 4. Return enriched data
      return projeto
    }
  }
}
```

**ONLY:**
- Business logic orchestration
- Coordinate multiple repositories
- Call external services (email, PDF)
- Throw domain errors
- Handle transactions

**NEVER:**
- Direct database queries (use repository)
- Export types (use `@/types/*-inputs.ts`)
- tRPC definitions

### Repository Layer (`src/server/services/{domain}/*-repository.ts`)
**Max: 400 lines** (split by query type if over)

**Factory Pattern:**
```typescript
export function createProjetoRepository(db: Database) {
  return {
    async findById(id: number) {
      return db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, id),
        with: {
          disciplinas: { with: { disciplina: true } },
          professorResponsavel: true,
        }
      })
    },

    async create(data: ProjetoInsert) {
      const [projeto] = await db.insert(projetoTable).values(data).returning()
      return projeto
    }
  }
}
```

**ONLY:**
- Drizzle queries
- Data transformation (DB ↔ Domain)
- Complex joins

**NEVER:**
- Business logic
- Authorization checks
- External service calls

---

## Type Organization

### Central Type Location: `src/types/`

**Structure:**
```
src/types/
├── index.ts                 # Barrel export (ONLY place to export)
├── enums.ts                 # DB enum extraction + TS types
├── schemas.ts               # Reusable Zod schemas
├── errors.ts                # Error re-exports + utilities
├── {domain}.ts              # Domain types (Projeto, Edital, etc)
└── {domain}-inputs.ts       # Service input DTOs
```

**Input DTOs Pattern** (`src/types/projeto-inputs.ts`):
```typescript
import type { UserRole, Semestre, TipoProposicao } from './enums'

export type CreateProjetoInput = {
  userId: number
  userRole: UserRole
  titulo: string
  semestre: Semestre              // ✅ Typed enum
  tipoProposicao: TipoProposicao  // ✅ Typed enum
  // ... more fields
}

export type UpdateProjetoInput = Partial<CreateProjetoInput> & { id: number }
```

**Barrel Export** (`src/types/index.ts`):
```typescript
// Enums and base types
export * from './enums'
export * from './schemas'
export * from './errors'

// Input DTOs
export * from './projeto-inputs'
export * from './edital-inputs'
export * from './selecao-inputs'

// Domain types
export * from './project'
export * from './edital'
export * from './inscription'
```

**Import Pattern** (Services/Routers):
```typescript
// ✅ ALWAYS use barrel import
import {
  SEMESTRE_1,
  SEMESTRE_2,
  type Semestre,
  type CreateProjetoInput
} from '@/types'

// ❌ NEVER import directly
import { Semestre } from '@/types/enums'  // Wrong!
```

---

## File Size Limits

| Layer | Target | Max | Action if Over |
|-------|--------|-----|----------------|
| Router | 200-400 | 500 | Split by subdomain |
| Service | 200-300 | 400 | Split by responsibility |
| Repository | 150-250 | 400 | Split by query type |
| Utilities | <200 | 300 | Extract to separate files |

**Splitting Strategy:**
```
projeto-service.ts (749 lines) ❌
→ projeto-core-service.ts (CRUD)
→ projeto-selection-service.ts (atas/seleção)
→ projeto-signature-service.ts (assinaturas/PDF)
```

---

## Complete Example

### 1. Types (`src/types/projeto-inputs.ts`)
```typescript
import type { UserRole, Semestre, TipoProposicao, ProjetoStatus } from './enums'

export type CreateProjetoInput = {
  userId: number
  userRole: UserRole
  titulo: string
  semestre: Semestre
  tipoProposicao: TipoProposicao
  status?: ProjetoStatus
}
```

### 2. Repository (`src/server/services/projeto/projeto-repository.ts`)
```typescript
export function createProjetoRepository(db: Database) {
  return {
    async findById(id: number) {
      return db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, id)
      })
    }
  }
}
```

### 3. Service (`src/server/services/projeto/projeto-service.ts`)
```typescript
import { NotFoundError, type CreateProjetoInput } from '@/types'

export function createProjetoService(db: Database) {
  const repo = createProjetoRepository(db)

  return {
    async create(input: CreateProjetoInput) {
      const professor = await repo.findProfessorByUserId(input.userId)
      if (!professor) {
        throw new NotFoundError('Professor', input.userId)
      }

      return repo.create({
        titulo: input.titulo,
        semestre: input.semestre,
        professorResponsavelId: professor.id
      })
    }
  }
}
```

### 4. Router (`src/server/api/routers/projeto/projeto.ts`)
```typescript
import { createProjetoService } from '@/server/services/projeto/projeto-service'
import { NotFoundError, BusinessError, type CreateProjetoInput } from '@/types'

export const projetoRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createProjetoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createProjetoService(ctx.db)
        return await service.create(input as CreateProjetoInput)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        throw error
      }
    })
})
```

---

## Migration Checklist

When refactoring a router:

- [ ] Create `{domain}-repository.ts` with factory function
- [ ] Create `{domain}-service.ts` with factory function
- [ ] Create `src/types/{domain}-inputs.ts` for input DTOs
- [ ] Move types from service to `src/types/`
- [ ] Export types in `src/types/index.ts`
- [ ] Update service to import from `@/types`
- [ ] Update router to call service (no direct DB queries)
- [ ] Add proper error handling (domain errors → TRPCError)
- [ ] Verify file sizes (<400 lines)
- [ ] Run `npm run lint` and `npm run build`

---

## Current Status

### ✅ Fully Refactored (Following Pattern)
- **projeto**: Router → Service → Repository (centralised types)
- **edital**: Router → Service → Repository (centralised types)
- **selecao**: Router → Service → Repository (centralised types)
- **inscricao**: Router → Service → Repository (centralised types)
- **relatorios**: Router → Service → Repository (centralised types)
- **vagas**: Router → Service → Repository (centralised types)
- **user**: Router → Service → Repository

### ✅ Type Centralization Complete
- All input DTOs moved to `src/types/*-inputs.ts`
- All enums extracted from DB to `src/types/enums.ts`
- Zero hard strings in backend
- Single source of truth established

### ⚠️ Needs File Splitting (Over 400 lines)
- `projeto-service.ts` (749 lines) → Split into 3 files
- `relatorios-service.ts` (702 lines) → Split into 3 files
- `edital-service.ts` (521 lines) → Split into 2 files

---

## Anti-Patterns to Avoid

❌ **Type exports from services**
```typescript
// service.ts
export type CreateInput = {...}  // WRONG
```

❌ **Hard strings for enums**
```typescript
z.enum(['SEMESTRE_1', 'SEMESTRE_2'])  // WRONG
z.enum([SEMESTRE_1, SEMESTRE_2])      // CORRECT
```

❌ **Business logic in routers**
```typescript
// router.ts
const projeto = await ctx.db.query.projetoTable.findFirst(...)  // WRONG
const projeto = await service.getProjeto(id)                     // CORRECT
```

❌ **Database queries in services**
```typescript
// service.ts
await db.query.projetoTable.findFirst(...)  // WRONG
await repo.findById(id)                      // CORRECT
```

❌ **Missing error codes**
```typescript
throw new BusinessError('Invalid')           // WRONG
throw new BusinessError('Invalid', 'BAD_REQUEST')  // CORRECT
```

---

## Frontend Table Filters - Senior-Level Pattern

### Architecture Overview

```
useUrlFilters (base)
    ├── useUrlColumnFilters  → Client-side filtering + URL persistence
    └── useServerPagination  → Server-side pagination + filtering + URL persistence
```

### Hook Selection Guide

| Scenario | Hook | When to Use |
|----------|------|-------------|
| < 500 rows, complex client filtering | `useUrlColumnFilters` | Most admin pages |
| > 500 rows, scalability needed | `useServerPagination` | Large datasets |
| No URL persistence needed | `useColumnFilters` | Dialogs, modals |

### File Structure

```
src/hooks/
├── useUrlFilters.ts        # Base hook (shared logic) - DO NOT USE DIRECTLY
├── useUrlColumnFilters.ts  # Client-side filtering with URL state
├── useServerPagination.ts  # Server-side pagination with URL state
└── useColumnFilters.ts     # Simple state (no URL persistence)
```

### Usage Pattern - Client-Side Filtering

```typescript
// Page component
import { useUrlColumnFilters } from '@/hooks/useUrlColumnFilters'
import { TableComponent, multiselectFilterFn } from '@/components/layout/TableComponent'

export default function AdminPage() {
  // Hook provides URL-synced filters with optional current semester defaults
  const { columnFilters, setColumnFilters } = useUrlColumnFilters({
    useCurrentSemester: false  // NEVER use true - filters should not be pre-selected
  })

  const columns = useMemo(() => createColumns(), [])

  return (
    <TableComponent
      columns={columns}
      data={data}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
    />
  )
}
```

### Usage Pattern - Server-Side Pagination

```typescript
import { useServerPagination } from '@/hooks/useServerPagination'

export default function LargeDatasetPage() {
  const {
    page, pageSize, setPage, setPageSize,
    columnFilters, setColumnFilters,
    apiFilters  // Ready-to-use object for API calls
  } = useServerPagination({ defaultPageSize: 20, useCurrentSemester: false })

  const { data, isLoading } = api.entity.list.useQuery({
    ...apiFilters,  // Contains limit, offset, and all filter values
  })

  return (
    <TableComponent
      columns={columns}
      data={data?.items || []}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      isLoading={isLoading}
      serverPagination={{
        totalCount: data?.total ?? 0,
        pageIndex: page,
        pageSize: pageSize,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
      }}
    />
  )
}
```

### Column Definition Pattern

```typescript
import { createFilterableHeader } from '@/components/layout/DataTableFilterHeader'
import { multiselectFilterFn } from '@/components/layout/TableComponent'
import { SEMESTRE_1, SEMESTRE_2, PROJETO_STATUS_APPROVED } from '@/types'

// ✅ CORRECT: Use typed enum constants for filter options
const statusOptions = [
  { value: PROJETO_STATUS_APPROVED, label: 'Aprovado' },
  { value: PROJETO_STATUS_DRAFT, label: 'Rascunho' },
]

const semestreOptions = [
  { value: SEMESTRE_1, label: '1º Semestre' },
  { value: SEMESTRE_2, label: '2º Semestre' },
]

// ❌ WRONG: Hard-coded strings
const badOptions = [
  { value: 'APPROVED', label: 'Aprovado' },  // Never do this!
]

export const columns: ColumnDef<MyType>[] = [
  {
    id: 'status',
    accessorKey: 'status',
    header: createFilterableHeader<MyType>({
      title: 'Status',
      filterType: 'multiselect',  // or 'text', 'number'
      filterOptions: statusOptions,
    }),
    filterFn: multiselectFilterFn,  // Required for array-based filters
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'nome',
    accessorKey: 'nome',
    header: createFilterableHeader<MyType>({
      title: 'Nome',
      filterType: 'text',
      filterPlaceholder: 'Buscar nome...',
      wide: true,  // Wider dropdown for long text
      autocompleteOptions: nomeOptions,  // Optional autocomplete suggestions
    }),
    filterFn: customTextFilterFn,  // Custom filter function
  },
]
```

### Filter Types

| Type | URL Format | Use Case |
|------|------------|----------|
| `multiselect` | `?status=A&status=B` | Enum values, multiple selection |
| `text` | `?nome=value` | Free text search |
| `number` | `?ano=2024&ano=2025` | Year selection, numeric multiselect |

### Supported Filter Keys

**Array Filters (multiselect):**
- `ano`, `semestre`, `status`, `role`, `departamentoId`, `regime`, `tipoProfessor`

**String Filters (text):**
- `disciplina`, `username`, `email`, `cursoNome`, `professorNome`, `nomeCompleto`, `emailInstitucional`, `codigo`, `nome`, `titulo`

### Adding New Filter Keys

1. Add to `ARRAY_FILTER_KEYS` or `STRING_FILTER_KEYS` in `useUrlFilters.ts`
2. Add to URL state definition in `useUrlFilters.ts`
3. Add to `hasExistingFilters` check
4. Add to `columnFilters` builder
5. (Server-side only) Add to `apiFilters` builder in `useServerPagination.ts`

### Anti-Patterns

❌ **Using legacy hooks for new features**
```typescript
import { useTableFilters } from '@/hooks/useTableFilters'  // DELETED - don't use
```

❌ **Hard-coded filter values**
```typescript
const options = [{ value: 'SEMESTRE_1', label: '1º' }]  // WRONG
const options = [{ value: SEMESTRE_1, label: '1º' }]    // CORRECT
```

❌ **Missing filterFn for multiselect columns**
```typescript
{
  id: 'status',
  accessorKey: 'status',
  header: createFilterableHeader({ filterType: 'multiselect', ... }),
  // filterFn: multiselectFilterFn,  // MISSING - filter won't work!
}
```

❌ **Using useUrlFilters directly**
```typescript
import { useUrlFilters } from '@/hooks/useUrlFilters'  // WRONG - internal hook
import { useUrlColumnFilters } from '@/hooks/useUrlColumnFilters'  // CORRECT
```

### DataTableColumnFilter UI

The filter dropdown (`DataTableColumnFilter`) provides:
- Header button with filter icon + active indicator (red dot)
- Clear button inline with title (avoids autocomplete overlap)
- Filter-specific input: text, multiselect, number with suggestions

```typescript
// Used internally by createFilterableHeader
<DataTableColumnFilter
  column={column}
  title="Status"
  type="multiselect"
  options={statusOptions}
  wide={false}  // true for wider dropdown
  autocompleteOptions={[]}  // Text filter suggestions
/>
```
