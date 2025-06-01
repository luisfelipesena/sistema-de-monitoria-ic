# Arquitetura do Sistema de Monitoria IC

Este documento descreve a arquitetura técnica do Sistema de Monitoria IC, incluindo decisões de design, padrões utilizados e estrutura de código.

## Visão Geral da Arquitetura

O sistema segue uma arquitetura **monolítica modular** com separação clara entre frontend e backend, ambos servidos pelo mesmo servidor (TanStack Start/Vinxi).

```
┌──────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                      │
├──────────────────────────────────────────────────────────────┤
│                    React + TanStack Router                    │
│                         (SPA Frontend)                        │
├──────────────────────────────────────────────────────────────┤
│                     TanStack Start Server                     │
├─────────────────────┬────────────────────┬──────────────────┤
│   Static Assets     │   API Routes       │   SSR/Hydration  │
├─────────────────────┴────────────────────┴──────────────────┤
│                        Middleware Layer                       │
│              (Auth, Logging, Error Handling)                 │
├──────────────────────────────────────────────────────────────┤
│                      Business Logic Layer                     │
│                  (Services, Validators, Utils)                │
├─────────────────────┬────────────────────┬──────────────────┤
│    Drizzle ORM      │   File Storage     │   Email Service  │
├─────────────────────┼────────────────────┼──────────────────┤
│    PostgreSQL       │      MinIO         │   Nodemailer     │
└─────────────────────┴────────────────────┴──────────────────┘
```

## Padrões e Princípios

### 1. File-Based Routing

O sistema usa roteamento baseado em arquivos tanto para páginas quanto para APIs:

```
src/routes/
├── api/                    # Rotas de API
│   ├── auth/
│   │   └── login.ts       # POST /api/auth/login
│   └── projeto/
│       ├── index.ts       # GET/POST /api/projeto
│       └── $id/
│           └── index.ts   # GET/PUT/DELETE /api/projeto/:id
└── home/                  # Páginas do frontend
    └── _layout/          # Layout compartilhado
        ├── admin/        # /home/admin/*
        ├── professor/    # /home/professor/*
        └── student/      # /home/student/*
```

### 2. Type-Safe APIs

Todas as APIs são totalmente tipadas usando TypeScript:

```typescript
// Definição de tipos compartilhados
// src/routes/api/projeto/-types.ts
export interface ProjetoInput {
  titulo: string;
  objetivos: string;
  // ...
}

// API Route
// src/routes/api/projeto/index.ts
export const APIRoute = createAPIFileRoute('/api/projeto')({
  POST: createAPIHandler(async (ctx) => {
    const data: ProjetoInput = await ctx.request.json();
    // Validação com Zod
    const validated = projetoSchema.parse(data);
    // ...
  })
});

// Frontend Hook
// src/hooks/use-projeto.ts
export function useCreateProjeto() {
  return useMutation<ProjetoResponse, Error, ProjetoInput>({
    mutationFn: (data) => apiClient.post('/api/projeto', data)
  });
}
```

### 3. Middleware Pattern

Middlewares são compostos para adicionar funcionalidades às rotas:

```typescript
// src/server/middleware/auth.ts
export const withAuthMiddleware = (handler: APIHandler) => {
  return async (ctx: APIContext) => {
    const session = await validateSession(ctx);
    if (!session) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    ctx.state.user = session.user;
    return handler(ctx);
  };
};

// Uso em API route
export const APIRoute = createAPIFileRoute('/api/admin/users')({
  GET: createAPIHandler(
    withAuthMiddleware(
      withRoleMiddleware(['admin'])(
        async (ctx) => {
          // Handler com usuário autenticado e autorizado
        }
      )
    )
  )
});
```

### 4. Repository Pattern com Drizzle

Acesso a dados é abstraído através do Drizzle ORM:

```typescript
// src/server/database/repositories/projeto.ts
export class ProjetoRepository {
  async findById(id: number) {
    return db.query.projetoTable.findFirst({
      where: eq(projetoTable.id, id),
      with: {
        professorResponsavel: true,
        disciplinas: true,
      }
    });
  }

  async create(data: InsertProjeto) {
    const [projeto] = await db
      .insert(projetoTable)
      .values(data)
      .returning();
    return projeto;
  }
}
```

### 5. Component Composition

UI é construída com componentes reutilizáveis:

```typescript
// Componente base (shadcn/ui)
// src/components/ui/button.tsx
export const Button = React.forwardRef<...>(...);

// Componente de feature
// src/components/features/projects/ProjectCard.tsx
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectStatus status={project.status} />
        <ProjectActions project={project} />
      </CardContent>
    </Card>
  );
}

// Composição em página
// src/routes/home/_layout/professor/projects.tsx
export function ProjectsPage() {
  const { data: projects } = useProjects();
  return (
    <div className="grid gap-4">
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

## Fluxo de Dados

### 1. Query (Leitura)

```
Frontend                    API                     Database
   │                        │                          │
   ├─ useQuery ────────────►├─ GET /api/resource ────►│
   │                        │                          │
   │◄──────── JSON ─────────┤◄──────── SQL Result ────┤
   │                        │                          │
   └─ Render UI             └─ Transform/Validate     └─ Query
```

### 2. Mutation (Escrita)

```
Frontend                    API                     Database
   │                        │                          │
   ├─ useMutation ─────────►├─ POST /api/resource ───►│
   │                        │                          │
   │                        ├─ Validate (Zod)         │
   │                        ├─ Business Logic         │
   │                        ├─ Side Effects (Email)   │
   │                        │                          │
   │◄──────── JSON ─────────┤◄──────── SQL Result ────┤
   │                        │                          │
   └─ Update Cache          └─ Return Response       └─ Insert/Update
```

## Decisões de Design

### 1. Por que TanStack Start?

- **Unified Stack**: Frontend e backend no mesmo projeto
- **Type Safety**: Compartilhamento de tipos entre client/server
- **File-Based Routing**: Convenção sobre configuração
- **Modern**: Suporte nativo para React 19 e features modernas

### 2. Por que PostgreSQL + Drizzle?

- **PostgreSQL**: Robusto, confiável, excelente para dados relacionais
- **Drizzle**: Type-safe, migrations automáticas, ótima DX
- **Performance**: Queries otimizadas e lazy loading

### 3. Por que shadcn/ui?

- **Customizável**: Componentes copiados, não instalados
- **Acessível**: Baseado em Radix UI (a11y por padrão)
- **Consistente**: Design system pronto com Tailwind
- **Flexível**: Fácil modificar e estender

### 4. Por que Lucia Auth?

- **Flexível**: Suporta múltiplos providers (CAS no nosso caso)
- **Seguro**: Best practices de segurança implementadas
- **Simples**: API intuitiva e fácil de usar
- **Customizável**: Controle total sobre sessions e users

## Segurança

### 1. Autenticação

- Sessions server-side com cookies httpOnly
- Integração com CAS da UFBA
- Logout automático após inatividade

### 2. Autorização

- Role-based access control (RBAC)
- Middleware de autorização em todas as rotas protegidas
- Validação de ownership em recursos específicos

### 3. Validação de Dados

- Zod schemas em todas as entradas
- Sanitização de inputs
- Prepared statements via Drizzle (prevenção SQL injection)

### 4. File Upload

- Validação de tipo e tamanho
- Upload direto para MinIO (não passa pelo servidor)
- URLs presigned com expiração

## Performance

### 1. Caching

- React Query para cache client-side
- Stale-while-revalidate strategy
- Invalidação inteligente após mutations

### 2. Code Splitting

- Lazy loading de rotas
- Dynamic imports para componentes pesados
- Bundle optimization com Vite

### 3. Database

- Índices em foreign keys e campos de busca
- Queries otimizadas com joins apropriados
- Paginação em listagens grandes

## Monitoramento e Logging

### 1. Logging Estruturado

```typescript
// Pino logger com contexto
logger.info({
  userId: user.id,
  action: 'PROJECT_CREATED',
  projectId: project.id,
}, 'Projeto criado com sucesso');
```

### 2. Error Tracking

- Error boundaries para erros de UI
- Middleware de erro global para APIs
- Logs estruturados para debugging

### 3. Métricas

- Tempo de resposta das APIs
- Taxa de erro por endpoint
- Uso de recursos (CPU, memória)

## Escalabilidade

### Horizontal

- Stateless application (sessions em Redis)
- Assets em CDN
- Database connection pooling

### Vertical

- Otimização de queries pesadas
- Caching agressivo
- Background jobs para tarefas pesadas

## Manutenibilidade

### 1. Documentação

- README completo
- Documentação inline com JSDoc
- Tipos auto-documentados com TypeScript

### 2. Testes

- Unit tests para lógica de negócio
- Integration tests para APIs
- E2E tests para fluxos críticos

### 3. CI/CD

- Type checking em PRs
- Linting e formatting automático
- Deploy automático após merge

## Conclusão

A arquitetura foi desenhada para ser:

- **Simples**: Fácil de entender e modificar
- **Escalável**: Cresce com as necessidades
- **Manutenível**: Código limpo e bem organizado
- **Segura**: Best practices implementadas
- **Performática**: Otimizada para UX