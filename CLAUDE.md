# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:push      # Sync database schema (recommended for development)
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio database viewer
npm run db:drop      # Drop all tables (dangerous!)
```

### Code Quality
```bash
npm run lint         # Run Biome linting
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Biome
```

### Testing
```bash
npm run test         # Run all tests
npm run test:ui      # Run tests with interactive UI
npm run test:coverage # Generate coverage report

# E2E Testing
npm run test:e2e:install    # Install Playwright browsers
npm run test:e2e           # Run E2E tests (requires app running)
npm run test:e2e:headed    # Run E2E tests with browser UI
npm run test:e2e:local     # Run complete local E2E pipeline
```

## Architecture Overview

### Stack
- **Frontend**: Next.js 15.1.4 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: tRPC v11 with Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Lucia Auth + API Keys
- **Storage**: MinIO (S3-compatible)
- **Testing**: Vitest

### Core Architecture

This is a **university monitoring system** for UFBA (Universidade Federal da Bahia) that manages the complete lifecycle of academic monitoring programs.

**Main Business Flow:**
1. **Professors** create monitoring projects (DRAFT → SUBMITTED → APPROVED/REJECTED)
2. **Students** apply to projects during open periods
3. **Selection process** determines monitor assignments (BOLSISTA/VOLUNTARIO)
4. **Document management** handles signatures and file storage
5. **Analytics** provide insights across the system

## Key tRPC Routers

### Core Business Logic
- `projeto` - Project lifecycle management (central entity)
- `inscricao` - Student applications and selections
- `selecao` - Monitor selection process
- `vagas` - Monitor position management

### Academic Structure
- `course` - University courses (BACHARELADO, LICENCIATURA, etc.)
- `departamento` - Department management
- `discipline` - Subject/discipline management

### User Management
- `me` - Current user profile
- `user` - User CRUD operations
- `auth` - Authentication procedures
- `apiKey` - API key management

### Administrative
- `edital` - Public notices/announcements
- `onboarding` - User setup flow
- `inviteProfessor` - Professor invitation system
- `importProjects` - Bulk project import
- `analytics` - System metrics and reporting

## Database Schema Key Points

### Main Entities
- `userTable` → `professorTable`/`alunoTable` (1:1 profile relationships)
- `projetoTable` - Central entity linking professors, disciplines, and students
- `inscricaoTable` - Student applications with status tracking
- `vagaTable` - Monitor positions (BOLSISTA/VOLUNTARIO)
- `departamentoTable` - Hierarchical department structure

### Status Flows
- **Project**: `DRAFT` → `SUBMITTED` → `APPROVED/REJECTED`
- **Inscription**: `SUBMITTED` → `SELECTED_*` → `ACCEPTED_*`/`REJECTED_*`
- **User Roles**: `admin`, `professor`, `student`

## Type System

### Type Organization (MANDATORY)
- **ALL types must be defined in `src/types/`** - never inline or local types
- **Import only via `@/types`** - never direct imports from subdirectories
- **Schema validation with Zod** - all inputs/outputs must be validated
- **Database compatibility** - ensure nullability matches Drizzle schema

### Key Type Files
- `src/types/index.ts` - Central export hub
- `src/types/enums.ts` - All enums with TypeScript const assertions
- `src/types/schemas.ts` - Reusable Zod validation schemas
- Domain-specific: `auth.ts`, `project.ts`, `inscription.ts`, etc.

## Authentication

### Dual System
1. **Lucia Sessions** - Primary web authentication (30-day expiration)
2. **API Keys** - Programmatic access with SHA256 hashing

### Authorization Levels
- `publicProcedure` - Open access
- `protectedProcedure` - Authenticated users only
- `adminProtectedProcedure` - Admin role required

## Development Guidelines

### Code Rules
- **Think before coding** - analyze existing patterns first
- **No inline types** - all types must be in `src/types/`
- **Type safety first** - build must pass without TypeScript errors
- **Minimal comments** - focus on self-documenting code
- **Follow existing patterns** - especially for tRPC routers and React components

### Testing
- All tests use strongly typed mocks (no `any` allowed)
- Database mocks must use `MockDatabase` type
- Test data must be completely typed
- Coverage reports are required for significant changes

### Biome Configuration
- Line width: 120 characters
- Indentation: 2 spaces
- Single quotes for JS/JSX
- Semicolons as needed
- Trailing commas: ES5 style

## File Organization

### Frontend (`src/app/`)
- `api/` - API routes and tRPC endpoint
- `home/` - Main application pages
- `docs/` - API documentation page

### Backend (`src/server/`)
- `api/routers/` - tRPC routers organized by domain
- `db/` - Database schema and connection
- `email-templates/` - Email notification templates
- `lib/` - Server utilities (auth, storage, PDF generation)

### Shared (`src/`)
- `components/` - React components with shadcn/ui
- `hooks/` - Custom React hooks
- `types/` - **ALL** type definitions
- `utils/` - Shared utilities

## Common Patterns

### tRPC Router Structure
```typescript
export const routerName = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    // Implementation
  }),
  
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
})
```

### Component Structure
- Use shadcn/ui components as base
- Implement proper form validation with React Hook Form + Zod
- State management with React Query for server state
- Tailwind CSS for styling

## External Integrations

- **MinIO** - File storage (documents, signatures, attachments)
- **Nodemailer** - Email notifications
- **PDF Generation** - React PDF + PDF-lib for document creation
- **CAS Authentication** - UFBA single sign-on integration
- **PostgreSQL** - Primary database with connection pooling

## E2E Testing

### Local E2E Testing Setup

The project includes comprehensive E2E tests that replicate the CI pipeline locally. Follow these steps:

#### Prerequisites
- PostgreSQL running locally or via Docker
- Node.js 20.19.3 (as specified in package.json)

#### Complete Local E2E Pipeline
```bash
# Run the complete pipeline (recommended)
npm run test:e2e:local
```

This script will:
1. Create/validate `.env.test` with proper test environment variables
2. Install dependencies with `npm ci`
3. Run linting, type checking, and build
4. Set up test database with `drizzle-kit push --force`
5. Seed test users and disciplines with `npm run seed:test-user`
6. Install Playwright browsers
7. Start the application in production mode
8. Run E2E tests
9. Clean up processes

#### Manual Setup
If you need to run tests manually:

```bash
# 1. Set up test database (Docker)
docker run --name postgres-test -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sistema_de_monitoria_ic_test -p 5432:5432 -d postgres:16

# 2. Create .env.test (copy from .env.sample and update DATABASE_URL)
cp .env.sample .env.test
# Edit .env.test to use: postgresql://postgres:postgres@localhost:5432/sistema_de_monitoria_ic_test

# 3. Set up database schema and seed data
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_de_monitoria_ic_test"
npx drizzle-kit push --force
npm run seed:test-user

# 4. Install Playwright
npm run test:e2e:install

# 5. Build and start application
npm run build
NODE_ENV=production npm run start &

# 6. Run E2E tests
npm run test:e2e
```

#### Test Users
The seed script creates these test users:
- **Admin**: admin@ufba.br / password123
- **Professor**: professor@ufba.br / password123 (with complete onboarding)
- **Student**: student@ufba.br / password123 (with complete onboarding)

#### Test Data
- 8 test disciplines in DCC department (MATA40, MATA37, etc.)
- Test department: "Departamento de Ciência da Computação"
- Test course: "Ciência da Computação"

### CI Pipeline
The GitHub Actions workflow (`ci.yml`) runs:
1. Lint, TypeCheck, Unit Tests & Build
2. E2E Tests with Docker (PostgreSQL service)

### Development and Testing Workflow for New Features

When implementing new features, follow this comprehensive E2E validation process:

#### 1. Port Configuration for Parallel Testing
```bash
# Use alternative port to avoid conflicts with development server
export DATABASE_URL="postgresql://postgres:postgres@localhost:5434/sistema_de_monitoria_ic_test"
```

#### 2. Environment Setup
```bash
# Set up test database with Docker
docker run --name postgres-test-5434 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sistema_de_monitoria_ic_test -p 5434:5432 -d postgres:16

# Push schema and seed test data
npx drizzle-kit push --force
npm run seed:test-user
```

#### 3. Application Build and Start
```bash
# Build in production mode for E2E testing
npm run build

# Start application with test database
NODE_ENV=production npm run start &
```

#### 4. E2E Test Development Strategy
- **Test business workflows end-to-end**, not individual UI components
- **Handle timeout issues** by simplifying complex form interactions when necessary
- **Focus on core functionality validation** rather than detailed UI interactions
- **Use descriptive test names** that clearly indicate the workflow being tested
- **Add console.log messages** for debugging in CI environments

#### 5. Test Reliability Best Practices
- **Avoid .clear() and .fill() operations** on complex forms if they cause timeouts
- **Use .isVisible({ timeout: 1000-3000 })** for optional elements
- **Implement graceful fallbacks** for missing elements in clean test environments
- **Test both success and edge cases** (empty states, missing data)

#### 6. Validation Process
```bash
# Run all E2E tests
npm run test:e2e

# Expected outcome: All tests should pass
# ✓ 64 passed (X.Xm) - Example from successful run
```

#### 7. Test Organization
- **Workflow-based test files**: `admin-approval-workflow.spec.ts`, `professor-template-workflow.spec.ts`
- **Feature-specific test files**: `edital-publication-workflow.spec.ts`, `chief-signature-workflow.spec.ts`
- **Cross-cutting test files**: `auth-flow.spec.ts`, `student-application-workflow.spec.ts`

#### 8. Debugging Failed Tests
- **Review console.log outputs** from test runs for insights
- **Check for element timeout issues** - may need to simplify interactions
- **Verify database state** - ensure test data exists for complex workflows
- **Run tests individually** with `npx playwright test specific-test.spec.ts` for debugging

## Performance Considerations

- Database queries use Drizzle's query builder for type safety
- File operations are handled asynchronously with proper error handling
- Pagination is implemented for large datasets
- Email sending is queued for better performance

## Security Notes

- All user inputs are validated with Zod schemas
- API keys are SHA256 hashed with optional expiration
- File uploads are validated and virus-scanned
- Database connections use connection pooling
- Sensitive data is never logged or exposed in errors