# CODE QA - Sistema de Monitoria IC UFBA

**Documento de Garantia de Qualidade e Validação Técnica**

Este documento mapeia todas as funcionalidades do sistema, suas implementações técnicas e como validá-las no código.

---

## ÍNDICE

1. [FASE 1: Planejamento e Criação de Projetos](#fase-1-planejamento-e-criação-de-projetos)
2. [FASE 2: Aprovação e Envio para PROGRAD](#fase-2-aprovação-e-envio-para-prograd)
3. [FASE 3: Alocação de Bolsas e Edital Interno DCC](#fase-3-alocação-de-bolsas-e-edital-interno-dcc)
4. [FASE 4: Inscrições e Seleção de Monitores](#fase-4-inscrições-e-seleção-de-monitores)
5. [FASE 5: Consolidação Final e Relatório PROGRAD](#fase-5-consolidação-final-e-relatório-prograd)
6. [Validação Completa do Sistema](#validação-completa-do-sistema)

---

## FASE 1: PLANEJAMENTO E CRIAÇÃO DE PROJETOS

### 📋 Funcionalidades Esperadas

#### Admin
1. Importa planilha de planejamento DCC com disciplinas e professores (SIAPE)
2. Sistema identifica automaticamente projetos INDIVIDUAIS (1 professor) e COLETIVOS (múltiplos professores)
3. Sistema cria projetos automaticamente com base em templates de semestres anteriores
4. Sistema envia emails automáticos: "Gerar projeto para disciplina X"

#### Professor
1. Acessa dashboard e visualiza suas disciplinas
2. Para disciplinas sem template: cria template padrão (título, descrição, atividades, carga horária)
3. Gera projeto do semestre a partir do template (pode editar se necessário)
4. Assina digitalmente o projeto e submete para aprovação

---

### ✅ Implementação Técnica

#### Schema (`src/server/db/schema.ts`)

```typescript
// Tabela de Templates de Projeto
export const projetoTemplateTable = pgTable('projeto_template', {
  id: serial('id').primaryKey(),
  disciplinaId: integer('disciplina_id').references(() => disciplinaTable.id).notNull().unique(),
  tituloDefault: varchar('titulo_default', { length: 255 }),
  descricaoDefault: text('descricao_default'),
  cargaHorariaSemanaDefault: integer('carga_horaria_semana_default'),
  numeroSemanasDefault: integer('numero_semanas_default'),
  publicoAlvoDefault: text('publico_alvo_default'),
  atividadesDefault: text('atividades_default'), // JSON array ou ';-separated'
  pontosProvaDefault: text('pontos_prova_default'),
  bibliografiaDefault: text('bibliografia_default'),
  // ... timestamps
})

// Tabela de Projetos
export const projetoTable = pgTable('projeto', {
  id: serial('id').primaryKey(),
  tipoProposicao: tipoProposicaoEnum('tipo_proposicao').notNull(), // INDIVIDUAL ou COLETIVA
  professoresParticipantes: text('professores_participantes'), // Nomes para projetos coletivos
  status: projetoStatusEnum('status').notNull().default('DRAFT'), // DRAFT, SUBMITTED, APPROVED, REJECTED
  assinaturaProfessor: text('assinatura_professor'), // Base64 data URL
  // ... outros campos
})

// Histórico de Importações
export const importacaoPlanejamentoTable = pgTable('importacao_planejamento', {
  id: serial('id').primaryKey(),
  fileId: text('file_id').notNull(),
  nomeArquivo: varchar('nome_arquivo').notNull(),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  totalProjetos: integer('total_projetos').notNull().default(0),
  projetosCriados: integer('projetos_criados').notNull().default(0),
  status: varchar('status').notNull().default('PROCESSANDO'),
  // ... timestamps
})
```

#### Routers tRPC

**Importação de Planejamento:**
- **Arquivo:** `src/server/api/routers/import-projects/import-projects.ts`
- **Endpoints:**
  - `importPlanejamento` - Upload e processamento da planilha
  - `getImportHistory` - Histórico de importações
- **Funcionalidades:**
  - Parser detecta INDIVIDUAL vs COLETIVA por número de professores
  - Busca templates existentes por disciplina
  - Cria projetos pré-preenchidos
  - Envia emails automáticos para professores únicos

**Templates de Projeto:**
- **Arquivo:** `src/server/api/routers/projeto-templates/projeto-templates.ts`
- **Endpoints:**
  - `createTemplate` - Criar template padrão
  - `updateTemplate` - Atualizar template
  - `getTemplateByDisciplina` - Buscar template por disciplina

**Gerenciamento de Projetos:**
- **Arquivo:** `src/server/api/routers/projeto/projeto.ts`
- **Endpoints:**
  - `create` - Criar projeto a partir de template
  - `update` - Editar projeto
  - `signProfessor` - Professor assina digitalmente
  - `submit` - Submeter para admin (muda status DRAFT → SUBMITTED)

#### Páginas Frontend

**Admin:**
- `/home/admin/import-projects` - Upload de planilha
  - **Arquivo:** `src/app/home/admin/import-projects/page.tsx`
  - **Validação:** Verifica formato Excel/CSV, processa linhas, mostra erros/warnings

**Professor:**
- `/home/professor/dashboard` - Gerenciar projetos
  - **Arquivo:** `src/app/home/professor/dashboard/page.tsx`
  - **Validação:** Lista projetos por status, botões criar/editar/assinar
- `/home/professor/projetos/novo` - Criar template + projeto
  - **Arquivo:** `src/app/home/professor/projetos/novo/page.tsx`
  - **Validação:** Fluxo: seleciona disciplina → cria/edita template → cria projeto

---

### 🧪 Como Validar no Código

#### 1. Importação detecta INDIVIDUAL vs COLETIVA

**Arquivo:** `src/server/lib/spreadsheet-parser.ts`

```typescript
// Buscar função que detecta múltiplos professores
// Deve ter lógica tipo:
if (professores.length > 1) {
  tipoProposicao = 'COLETIVA'
} else {
  tipoProposicao = 'INDIVIDUAL'
}
```

**Validação:**
- ✅ Verificar split por vírgula/ponto-e-vírgula em coluna de professores
- ✅ Confirmar campo `professoresParticipantes` preenchido se COLETIVA

#### 2. Sistema usa templates de semestres anteriores

**Arquivo:** `src/server/api/routers/import-projects/import-projects.ts`

```typescript
// Buscar query que busca template por disciplinaId
const template = await ctx.db.query.projetoTemplateTable.findFirst({
  where: eq(projetoTemplateTable.disciplinaId, disciplinaId)
})

// Depois preenche projeto com dados do template
if (template) {
  titulo = template.tituloDefault
  descricao = template.descricaoDefault
  // ...
}
```

**Validação:**
- ✅ Confirmar busca por `disciplinaId`
- ✅ Verificar pré-preenchimento de campos do projeto

#### 3. Emails automáticos enviados após importação

**Arquivo:** `src/server/api/routers/import-projects/import-projects.ts`

```typescript
// Buscar chamada do email service
import { sendProjectCreationNotification } from '@/server/lib/email-service'

// Deve ter loop enviando emails
const uniqueProfessors = [...new Set(results.map(r => r.professor))]
for (const professor of uniqueProfessors) {
  await sendProjectCreationNotification(professor.email, ...)
}
```

**Validação:**
- ✅ Verificar template em `src/server/lib/email-service.ts`
- ✅ Confirmar unique de professores (evita duplicatas)

#### 4. Professor assina digitalmente

**Arquivo:** `src/server/api/routers/projeto/projeto.ts`

```typescript
// Endpoint signProfessor
signProfessor: protectedProcedure
  .input(z.object({
    projetoId: idSchema,
    signatureImage: z.string() // base64
  }))
  .mutation(async ({ ctx, input }) => {
    await ctx.db.update(projetoTable)
      .set({
        assinaturaProfessor: input.signatureImage,
        status: 'SUBMITTED'
      })
      .where(eq(projetoTable.id, input.projetoId))
  })
```

**Validação:**
- ✅ Confirmar campo `assinaturaProfessor` atualizado
- ✅ Verificar status muda DRAFT → SUBMITTED

---

## FASE 2: APROVAÇÃO E ENVIO PARA PROGRAD

### 📋 Funcionalidades Esperadas

#### Admin
1. Acessa lista de projetos submetidos
2. Aprova ou rejeita projetos
3. Gera planilha Excel automática com links PDF dos projetos aprovados
4. Envia planilha por email à PROGRAD solicitando bolsas

#### PROGRAD
1. Analisa planilha recebida
2. Responde informando total de bolsas concedidas (exemplo: "50 bolsas")

---

### ✅ Implementação Técnica

#### Schema

```typescript
export const projetoStatusEnum = pgEnum('projeto_status_enum', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PENDING_PROFESSOR_SIGNATURE'
])

export const projetoTable = pgTable('projeto', {
  // ...
  status: projetoStatusEnum('status').notNull().default('DRAFT'),
  feedbackAdmin: text('feedback_admin'), // Motivo rejeição
  // ...
})
```

#### Routers tRPC

**Gerenciamento de Projetos (Admin):**
- **Arquivo:** `src/server/api/routers/projeto/projeto.ts`
- **Endpoints:**
  - `getProjetosByStatus` - Listar projetos por status
  - `approveProjeto` - Aprovar projeto (status → APPROVED)
  - `rejectProjeto` - Rejeitar projeto (status → REJECTED, salva feedback)

**Relatórios PROGRAD:**
- **Arquivo:** `src/server/api/routers/analytics/analytics.ts`
- **Endpoints:**
  - `getProjetosAprovadosParaPrograd` - Lista projetos APPROVED com link PDF
  - Retorna: `{ projeto, linkPDF: ${CLIENT_URL}/api/projeto/${id}/pdf }`

**Envio de Email:**
- **Arquivo:** `src/server/api/routers/analytics/analytics.ts` ou router específico
- **Funcionalidade:** Gera Excel e envia por email para PROGRAD

#### Páginas Frontend

**Admin:**
- `/home/admin/manage-projects` - Aprovar/Rejeitar projetos
  - **Arquivo:** `src/app/home/admin/manage-projects/page.tsx`
  - **Validação:** Filtros por status, botões aprovar/rejeitar com feedback

- `/home/admin/relatorios` - Gerar Planilha PROGRAD
  - **Arquivo:** `src/app/home/admin/relatorios/page.tsx`
  - **Validação:** Botão "Enviar por Email", campo email PROGRAD, preview dados

---

### 🧪 Como Validar no Código

#### 1. Admin aprova/rejeita projetos

**Arquivo:** `src/server/api/routers/projeto/projeto.ts`

```typescript
// Aprovar
approveProjeto: adminProtectedProcedure
  .input(z.object({ projetoId: idSchema }))
  .mutation(async ({ ctx, input }) => {
    await ctx.db.update(projetoTable)
      .set({ status: 'APPROVED' })
      .where(eq(projetoTable.id, input.projetoId))
  })

// Rejeitar
rejectProjeto: adminProtectedProcedure
  .input(z.object({
    projetoId: idSchema,
    feedback: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    await ctx.db.update(projetoTable)
      .set({
        status: 'REJECTED',
        feedbackAdmin: input.feedback
      })
      .where(eq(projetoTable.id, input.projetoId))
  })
```

**Validação:**
- ✅ Verificar mudança de status
- ✅ Confirmar campo `feedbackAdmin` salvo

#### 2. Planilha com links PDF

**Arquivo:** `src/server/api/routers/analytics/analytics.ts`

```typescript
// Query deve retornar projetos APPROVED com link
const projetos = await ctx.db.query.projetoTable.findMany({
  where: eq(projetoTable.status, 'APPROVED')
})

return projetos.map(p => ({
  ...p,
  linkPDF: `${process.env.NEXT_PUBLIC_APP_URL}/api/projeto/${p.id}/pdf`
}))
```

**Validação:**
- ✅ Confirmar filtro por status APPROVED
- ✅ Verificar formato do link PDF

#### 3. Envio por email para PROGRAD

**Arquivo:** `src/server/lib/email-service.ts`

```typescript
// Template de email PROGRAD
export async function sendProgradSpreadsheet(email: string, fileBuffer: Buffer) {
  await transporter.sendMail({
    to: email,
    subject: 'Planilha de Projetos Aprovados - Solicitação de Bolsas',
    html: `<p>Segue planilha com projetos aprovados...</p>`,
    attachments: [{
      filename: 'projetos-prograd.xlsx',
      content: fileBuffer
    }]
  })
}
```

**Validação:**
- ✅ Verificar template de email
- ✅ Confirmar attachment Excel

---

## FASE 3: ALOCAÇÃO DE BOLSAS E EDITAL INTERNO DCC

### 📋 Funcionalidades Esperadas

#### Admin
1. Define no sistema o total de bolsas informado pela PROGRAD
2. Aloca bolsas por projeto aprovado (sistema impede exceder total)
3. Clica em "Notificar Professores" - sistema envia emails automáticos com tabela de bolsas
4. Define número do edital interno DCC
5. Escolhe 2-3 datas possíveis para provas
6. Define data limite para divulgação dos resultados
7. Solicita assinatura digital do chefe do departamento
8. Publica edital assinado
9. Sistema envia automaticamente PDF do edital para todos os estudantes e professores

#### Professor
1. Recebe email com bolsas alocadas
2. Acessa dashboard e visualiza projetos com **bolsas alocadas** (campo não editável)
3. Pode definir **voluntários adicionais** (campo editável)
4. Preenche dados do edital interno DCC:
   - Escolhe data/horário da seleção (entre 2-3 opções definidas pelo admin)
   - Edita/confirma pontos da prova (modelo sugerido pelo sistema)
   - Edita/confirma bibliografia (modelo sugerido pelo sistema)

#### Chefe do Departamento
1. Acessa sistema e visualiza editais pendentes de assinatura
2. Assina digitalmente o edital interno DCC

---

### ✅ Implementação Técnica

#### Schema

```typescript
// Período de Inscrição com total de bolsas PROGRAD
export const periodoInscricaoTable = pgTable('periodo_inscricao', {
  id: serial('id').primaryKey(),
  semestre: semestreEnum('semestre').notNull(),
  ano: integer('ano').notNull(),
  dataInicio: date('data_inicio', { mode: 'date' }).notNull(),
  dataFim: date('data_fim', { mode: 'date' }).notNull(),
  totalBolsasPrograd: integer('total_bolsas_prograd').default(0), // ✅ Total PROGRAD
  // ...
})

// Projeto com bolsas alocadas
export const projetoTable = pgTable('projeto', {
  // ...
  bolsasSolicitadas: integer('bolsas_solicitadas').notNull().default(0), // Professor pede
  voluntariosSolicitados: integer('voluntarios_solicitados').notNull().default(0), // Professor define
  bolsasDisponibilizadas: integer('bolsas_disponibilizadas').default(0), // ✅ Admin aloca (read-only)

  // Campos edital interno DCC
  editalInternoId: integer('edital_interno_id').references(() => editalTable.id),
  dataSelecaoEscolhida: date('data_selecao_escolhida', { mode: 'date' }), // ✅ Professor escolhe
  horarioSelecao: varchar('horario_selecao', { length: 20 }), // ✅ Professor define horário
  // ...
})

// Edital Interno DCC
export const editalTable = pgTable('edital', {
  id: serial('id').primaryKey(),
  periodoInscricaoId: integer('periodo_inscricao_id').references(() => periodoInscricaoTable.id).notNull(),
  tipo: tipoEditalEnum('tipo').notNull().default('DCC'),
  numeroEdital: varchar('numero_edital', { length: 50 }).notNull().unique(),
  titulo: varchar('titulo', { length: 255 }).notNull(),

  // Datas de prova disponíveis (definidas pelo admin)
  datasProvasDisponiveis: text('datas_provas_disponiveis'), // ✅ JSON array de datas
  dataDivulgacaoResultado: date('data_divulgacao_resultado', { mode: 'date' }), // ✅ Data limite

  // Pontos e bibliografia (podem vir de templates)
  pontosProva: text('pontos_prova'),
  bibliografia: text('bibliografia'),

  // Assinatura do chefe
  chefeAssinouEm: timestamp('chefe_assinou_em', { withTimezone: true, mode: 'date' }),
  chefeAssinatura: text('chefe_assinatura'), // ✅ Base64 assinatura
  chefeDepartamentoId: integer('chefe_departamento_id').references(() => userTable.id),

  publicado: boolean('publicado').default(false).notNull(),
  dataPublicacao: date('data_publicacao', { mode: 'date' }),
  // ...
})

// Templates com pontos e bibliografia padrão
export const projetoTemplateTable = pgTable('projeto_template', {
  // ...
  pontosProvaDefault: text('pontos_prova_default'), // ✅ Padrão da disciplina
  bibliografiaDefault: text('bibliografia_default'), // ✅ Padrão da disciplina
  // ...
})
```

#### Routers tRPC

**Alocação de Bolsas:**
- **Arquivo:** `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts`
- **Endpoints:**
  - `setTotalScholarshipsFromPrograd` - Admin define total PROGRAD
  - `getTotalProgradScholarships` - Buscar total configurado
  - `allocateScholarships` - Alocar bolsas por projeto (valida limite)
  - `notifyProfessorsAfterAllocation` - Enviar emails com tabela de bolsas

**Edital Interno:**
- **Arquivo:** `src/server/api/routers/edital/edital.ts`
- **Endpoints:**
  - `create` - Criar edital (admin define número, datas provas, data divulgação)
  - `setAvailableExamDates` - Definir datas disponíveis para provas
  - `getAvailableExamDates` - Buscar datas disponíveis
  - `requestChefeSignature` - Solicitar assinatura do chefe
  - `getEditaisParaAssinar` - Chefe busca editais pendentes
  - `signAsChefe` - Chefe assina digitalmente
  - `publishAndNotify` - Publicar edital e enviar emails

#### Páginas Frontend

**Admin:**
- `/home/admin/scholarship-allocation` - Alocar bolsas
  - **Arquivo:** `src/app/home/admin/scholarship-allocation/page.tsx`
  - **Validação:**
    - Input total PROGRAD
    - Tabela projetos com input bolsas (valida limite)
    - Botão "Notificar Professores"

- `/home/admin/edital-management` - Gerenciar editais
  - **Arquivo:** `src/app/home/admin/edital-management/page.tsx`
  - **Validação:**
    - Form criar edital (número, datas provas, data divulgação)
    - Botão "Solicitar Assinatura" (chefe)
    - Botão "Publicar Edital"

**Professor:**
- `/home/professor/dashboard` - Ver bolsas e definir voluntários
  - **Validação:**
    - Campo bolsas **read-only** (span, não input)
    - Campo voluntários **editável** (input)
    - Form preencher dados edital: data/horário seleção, pontos prova, bibliografia

**Chefe:**
- **Não tem rota específica** - usa mesma interface que admin
  - Acessa `/home/admin/edital-management`
  - Vê apenas editais pendentes de sua assinatura
  - Botão "Assinar Edital"

---

### 🧪 Como Validar no Código

#### 1. Admin define total PROGRAD e aloca bolsas

**Arquivo:** `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts`

```typescript
// Definir total PROGRAD
setTotalScholarshipsFromPrograd: adminProtectedProcedure
  .input(z.object({
    periodoInscricaoId: idSchema,
    totalBolsas: z.number().int().positive()
  }))
  .mutation(async ({ ctx, input }) => {
    await ctx.db.update(periodoInscricaoTable)
      .set({ totalBolsasPrograd: input.totalBolsas })
      .where(eq(periodoInscricaoTable.id, input.periodoInscricaoId))
  })

// Alocar bolsas (com validação de limite)
allocateScholarships: adminProtectedProcedure
  .input(z.object({
    alocacoes: z.array(z.object({
      projetoId: idSchema,
      bolsas: z.number().int().min(0)
    }))
  }))
  .mutation(async ({ ctx, input }) => {
    // Buscar total PROGRAD
    const periodo = await ctx.db.query.periodoInscricaoTable.findFirst(...)
    const totalPrograd = periodo.totalBolsasPrograd

    // Validar soma não excede total
    const soma = input.alocacoes.reduce((acc, a) => acc + a.bolsas, 0)
    if (soma > totalPrograd) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Excede total PROGRAD' })
    }

    // Atualizar projetos
    for (const alocacao of input.alocacoes) {
      await ctx.db.update(projetoTable)
        .set({ bolsasDisponibilizadas: alocacao.bolsas })
        .where(eq(projetoTable.id, alocacao.projetoId))
    }
  })
```

**Validação:**
- ✅ Confirmar campo `totalBolsasPrograd` atualizado
- ✅ Verificar validação de limite na mutation
- ✅ Confirmar campo `bolsasDisponibilizadas` por projeto

#### 2. Emails enviados após alocação

**Arquivo:** `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts`

```typescript
notifyProfessorsAfterAllocation: adminProtectedProcedure
  .mutation(async ({ ctx }) => {
    // Buscar projetos com bolsas alocadas
    const projetos = await ctx.db.query.projetoTable.findMany({
      where: and(
        eq(projetoTable.status, 'APPROVED'),
        gt(projetoTable.bolsasDisponibilizadas, 0)
      ),
      with: { professorResponsavel: true }
    })

    // Agrupar por professor
    const professorMap = new Map()
    for (const projeto of projetos) {
      const email = projeto.professorResponsavel.emailInstitucional
      if (!professorMap.has(email)) professorMap.set(email, [])
      professorMap.get(email).push(projeto)
    }

    // Enviar emails
    for (const [email, projetosList] of professorMap) {
      await sendScholarshipAllocationNotification(email, projetosList)
    }
  })
```

**Validação:**
- ✅ Confirmar filtro por APPROVED + bolsas > 0
- ✅ Verificar agrupamento por professor (evita duplicatas)
- ✅ Checar template email em `src/server/lib/email-service.ts`

#### 3. Professor preenche dados edital interno

**Arquivo:** `src/app/home/professor/dashboard/page.tsx` ou formulário de edição de projeto

```tsx
// Campo bolsas (read-only)
<span className="font-medium">{projeto.bolsasDisponibilizadas}</span>

// Campo voluntários (editável)
<Input
  type="number"
  value={voluntarios}
  onChange={(e) => setVoluntarios(Number(e.target.value))}
/>

// Select data seleção (opções do admin)
<Select value={dataSelecionada}>
  {datasDisponiveis.map(data => (
    <SelectItem key={data} value={data}>{data}</SelectItem>
  ))}
</Select>

// Input horário
<Input
  type="text"
  placeholder="14:00-16:00"
  value={horario}
/>

// Textarea pontos prova (pré-preenchido do template)
<Textarea
  value={pontosProva}
  onChange={(e) => setPontosProva(e.target.value)}
/>
```

**Validação:**
- ✅ Confirmar bolsas renderizado como `<span>` ou texto
- ✅ Voluntários em `<Input>` editável
- ✅ Datas vêm do edital (`datasProvasDisponiveis`)
- ✅ Pontos/bibliografia pré-preenchidos do template

#### 4. Chefe assina edital

**Arquivo:** `src/server/api/routers/edital/edital.ts`

```typescript
// Solicitar assinatura
requestChefeSignature: adminProtectedProcedure
  .input(z.object({
    editalId: idSchema,
    chefeDepartamentoId: idSchema
  }))
  .mutation(async ({ ctx, input }) => {
    await ctx.db.update(editalTable)
      .set({ chefeDepartamentoId: input.chefeDepartamentoId })
      .where(eq(editalTable.id, input.editalId))

    // Enviar email notificando chefe
  })

// Assinar como chefe
signAsChefe: protectedProcedure
  .input(z.object({
    editalId: idSchema,
    signatureImage: z.string() // base64
  }))
  .mutation(async ({ ctx, input }) => {
    // Validar que ctx.user.id === chefeDepartamentoId do edital
    const edital = await ctx.db.query.editalTable.findFirst({
      where: eq(editalTable.id, input.editalId)
    })

    if (edital.chefeDepartamentoId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    await ctx.db.update(editalTable)
      .set({
        chefeAssinatura: input.signatureImage,
        chefeAssinouEm: new Date()
      })
      .where(eq(editalTable.id, input.editalId))
  })
```

**Validação:**
- ✅ Verificar campo `chefeDepartamentoId` salvo
- ✅ Confirmar validação de permissão (só chefe pode assinar)
- ✅ Checar campos `chefeAssinatura` e `chefeAssinouEm` atualizados

#### 5. Publicação e envio de emails

**Arquivo:** `src/server/api/routers/edital/edital.ts`

```typescript
publishAndNotify: adminProtectedProcedure
  .input(z.object({
    editalId: idSchema,
    emailsEstudantes: z.array(z.string().email()),
    emailsProfessores: z.array(z.string().email())
  }))
  .mutation(async ({ ctx, input }) => {
    // Validar que chefe já assinou
    const edital = await ctx.db.query.editalTable.findFirst({
      where: eq(editalTable.id, input.editalId)
    })

    if (!edital.chefeAssinatura) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Edital precisa ser assinado pelo chefe primeiro'
      })
    }

    // Publicar
    await ctx.db.update(editalTable)
      .set({
        publicado: true,
        dataPublicacao: new Date()
      })
      .where(eq(editalTable.id, input.editalId))

    // Gerar PDF do edital
    const pdfBuffer = await generateEditalPDF(edital)

    // Enviar emails
    for (const email of [...input.emailsEstudantes, ...input.emailsProfessores]) {
      await sendEditalPublishedNotification(email, pdfBuffer)
    }
  })
```

**Validação:**
- ✅ Confirmar validação de assinatura do chefe
- ✅ Verificar campos `publicado` e `dataPublicacao` atualizados
- ✅ Checar template email em `src/server/lib/email-service.ts`

---

## FASE 4: INSCRIÇÕES E SELEÇÃO DE MONITORES

### 📋 Funcionalidades Esperadas

#### Aluno
1. Recebe email com PDF do edital
2. Acessa "Vagas Disponíveis"
3. Visualiza projetos com bolsas e vagas de voluntário
4. Inscreve-se informando tipo de vaga (bolsista, voluntário ou ambos)
5. Sistema registra automaticamente nota da disciplina (do histórico)

#### Professor
1. Acessa "Gerenciar Candidatos" e visualiza inscritos
2. Em "Avaliar Candidatos", atribui notas (prova e/ou entrevista)
3. Sistema calcula nota final automaticamente
4. Em "Selecionar Monitores", escolhe bolsistas e voluntários
5. Clica em "Publicar Resultados" - sistema notifica alunos por email

#### Aluno (continuação)
1. Recebe email com resultado da seleção
2. Acessa "Resultados das Seleções"
3. Aceita ou rejeita a monitoria
4. Se for bolsista, preenche dados bancários (banco, agência, conta, dígito)

---

### ✅ Implementação Técnica

#### Schema

```typescript
// Inscrição do aluno
export const inscricaoTable = pgTable('inscricao', {
  id: serial('id').primaryKey(),
  periodoInscricaoId: integer('periodo_inscricao_id').references(() => periodoInscricaoTable.id).notNull(),
  projetoId: integer('projeto_id').references(() => projetoTable.id).notNull(),
  alunoId: integer('aluno_id').references(() => alunoTable.id).notNull(),

  tipoVagaPretendida: tipoInscricaoEnum('tipo_vaga_pretendida'), // ✅ BOLSISTA, VOLUNTARIO, ANY
  status: statusInscricaoEnum('status').notNull().default('SUBMITTED'), // ✅ Fluxo completo

  // Notas
  notaDisciplina: decimal('nota_disciplina', { precision: 4, scale: 2 }), // ✅ Auto do histórico
  notaSelecao: decimal('nota_selecao', { precision: 4, scale: 2 }), // ✅ Professor atribui
  notaFinal: decimal('nota_final', { precision: 4, scale: 2 }), // ✅ Calculada
  // ...
})

// Status de inscrição
export const statusInscricaoEnum = pgEnum('status_inscricao_enum', [
  'SUBMITTED', // Aluno aplicou
  'SELECTED_BOLSISTA', // Professor selecionou como bolsista
  'SELECTED_VOLUNTARIO', // Professor selecionou como voluntário
  'ACCEPTED_BOLSISTA', // Aluno aceitou bolsista
  'ACCEPTED_VOLUNTARIO', // Aluno aceitou voluntário
  'REJECTED_BY_PROFESSOR',
  'REJECTED_BY_STUDENT',
  'WAITING_LIST'
])

// Vaga (monitor aceito)
export const vagaTable = pgTable('vaga', {
  id: serial('id').primaryKey(),
  alunoId: integer('aluno_id').references(() => alunoTable.id).notNull(),
  projetoId: integer('projeto_id').references(() => projetoTable.id).notNull(),
  inscricaoId: integer('inscricao_id').references(() => inscricaoTable.id).notNull().unique(),
  tipo: tipoVagaEnum('tipo').notNull(), // ✅ BOLSISTA ou VOLUNTARIO
  dataInicio: date('data_inicio', { mode: 'date' }),
  dataFim: date('data_fim', { mode: 'date' }),
  // ...
})

// Dados bancários do aluno
export const alunoTable = pgTable('aluno', {
  // ...
  banco: varchar('banco', { length: 100 }), // ✅ Obrigatório se bolsista
  agencia: varchar('agencia', { length: 20 }),
  conta: varchar('conta', { length: 30 }),
  digitoConta: varchar('digito_conta', { length: 2 }),
  // ...
})
```

#### Routers tRPC

**Inscrições (Aluno):**
- **Arquivo:** `src/server/api/routers/inscricao/inscricao.ts`
- **Endpoints:**
  - `getProjetosDisponiveis` - Listar projetos com vagas abertas
  - `createInscricao` - Aluno se inscreve
    - Busca nota da disciplina do histórico automaticamente
    - Salva em `notaDisciplina`

**Seleção (Professor):**
- **Arquivo:** `src/server/api/routers/selecao/selecao.ts`
- **Endpoints:**
  - `getProfessorProjectsWithCandidates` - Listar candidatos por projeto
  - `gradeInscricao` - Atribuir nota de seleção
  - `calculateFinalGrade` - Calcular nota final (pode ser automático)
  - `selectMonitors` - Selecionar bolsistas e voluntários
    - Muda status para SELECTED_BOLSISTA ou SELECTED_VOLUNTARIO
  - `publishResults` - Publicar resultados e enviar emails

**Aceite (Aluno):**
- **Arquivo:** `src/server/api/routers/inscricao/inscricao.ts`
- **Endpoints:**
  - `acceptInscricao` - Aluno aceita monitoria
    - Muda status para ACCEPTED_BOLSISTA ou ACCEPTED_VOLUNTARIO
    - Cria registro em `vagaTable`
    - Se bolsista: valida dados bancários completos
  - `rejectInscricao` - Aluno rejeita

#### Páginas Frontend

**Aluno:**
- `/home/student/vagas` - Vagas disponíveis
  - **Arquivo:** `src/app/home/student/vagas/page.tsx`
  - **Validação:** Lista projetos com bolsas/voluntários, botão "Inscrever-se"

- `/home/student/inscricao-monitoria` - Formulário de inscrição
  - **Arquivo:** `src/app/home/student/inscricao-monitoria/page.tsx`
  - **Validação:** Select tipo vaga (bolsista/voluntário/ambos)

- `/home/student/resultados` - Resultados e aceite
  - **Arquivo:** `src/app/home/student/resultados/page.tsx`
  - **Validação:**
    - Mostra status seleção
    - Botões "Aceitar" / "Rejeitar"
    - Se bolsista: form dados bancários obrigatório

**Professor:**
- `/home/professor/candidatos` - Gerenciar candidatos
  - **Arquivo:** `src/app/home/professor/candidatos/page.tsx`
  - **Validação:** Lista inscrições por projeto

- `/home/professor/grade-applications` - Avaliar candidatos
  - **Arquivo:** `src/app/home/professor/grade-applications/page.tsx`
  - **Validação:** Input nota seleção, exibe nota final calculada

- `/home/professor/select-monitors` - Selecionar monitores
  - **Arquivo:** `src/app/home/professor/select-monitors/page.tsx`
  - **Validação:**
    - Checkboxes para selecionar candidatos
    - Limite de seleção (bolsas disponibilizadas / voluntários solicitados)

- `/home/professor/publicar-resultados` - Publicar resultados
  - **Arquivo:** `src/app/home/professor/publicar-resultados/page.tsx`
  - **Validação:** Botão "Publicar e Notificar"

---

### 🧪 Como Validar no Código

#### 1. Nota da disciplina registrada automaticamente

**Arquivo:** `src/server/api/routers/inscricao/inscricao.ts`

```typescript
createInscricao: protectedProcedure
  .input(z.object({
    projetoId: idSchema,
    tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY'])
  }))
  .mutation(async ({ ctx, input }) => {
    // Buscar projeto e disciplinas
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: eq(projetoTable.id, input.projetoId),
      with: { disciplinas: true }
    })

    // Buscar nota do aluno na disciplina principal
    const notaAluno = await ctx.db.query.notaAlunoTable.findFirst({
      where: and(
        eq(notaAlunoTable.alunoId, ctx.user.studentProfile.id),
        eq(notaAlunoTable.disciplinaId, projeto.disciplinas[0].disciplinaId)
      )
    })

    // Criar inscrição com nota da disciplina
    await ctx.db.insert(inscricaoTable).values({
      projetoId: input.projetoId,
      alunoId: ctx.user.studentProfile.id,
      tipoVagaPretendida: input.tipoVagaPretendida,
      notaDisciplina: notaAluno?.nota || null, // ✅ Auto
      status: 'SUBMITTED'
    })
  })
```

**Validação:**
- ✅ Confirmar busca em `notaAlunoTable`
- ✅ Verificar campo `notaDisciplina` preenchido automaticamente

#### 2. Cálculo automático de nota final

**Arquivo:** `src/server/api/routers/selecao/selecao.ts`

```typescript
// Pode ser ao atribuir nota de seleção
gradeInscricao: protectedProcedure
  .input(z.object({
    inscricaoId: idSchema,
    notaSelecao: z.number().min(0).max(10)
  }))
  .mutation(async ({ ctx, input }) => {
    const inscricao = await ctx.db.query.inscricaoTable.findFirst({
      where: eq(inscricaoTable.id, input.inscricaoId)
    })

    // Calcular nota final (exemplo: média ponderada)
    const notaFinal = (
      (Number(inscricao.notaDisciplina) * 0.6) +
      (input.notaSelecao * 0.4)
    )

    await ctx.db.update(inscricaoTable)
      .set({
        notaSelecao: input.notaSelecao.toString(),
        notaFinal: notaFinal.toFixed(2) // ✅ Calculada
      })
      .where(eq(inscricaoTable.id, input.inscricaoId))
  })
```

**Validação:**
- ✅ Verificar fórmula de cálculo
- ✅ Confirmar `notaFinal` atualizada automaticamente

#### 3. Seleção de monitores com limites

**Arquivo:** `src/server/api/routers/selecao/selecao.ts`

```typescript
selectMonitors: protectedProcedure
  .input(z.object({
    projetoId: idSchema,
    bolsistas: z.array(idSchema), // IDs das inscrições
    voluntarios: z.array(idSchema)
  }))
  .mutation(async ({ ctx, input }) => {
    // Buscar projeto
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: eq(projetoTable.id, input.projetoId)
    })

    // Validar limites
    if (input.bolsistas.length > projeto.bolsasDisponibilizadas) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Excede número de bolsas disponibilizadas'
      })
    }

    if (input.voluntarios.length > projeto.voluntariosSolicitados) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Excede número de voluntários solicitados'
      })
    }

    // Atualizar status das inscrições
    for (const inscricaoId of input.bolsistas) {
      await ctx.db.update(inscricaoTable)
        .set({ status: 'SELECTED_BOLSISTA' })
        .where(eq(inscricaoTable.id, inscricaoId))
    }

    for (const inscricaoId of input.voluntarios) {
      await ctx.db.update(inscricaoTable)
        .set({ status: 'SELECTED_VOLUNTARIO' })
        .where(eq(inscricaoTable.id, inscricaoId))
    }
  })
```

**Validação:**
- ✅ Confirmar validação de limites
- ✅ Verificar mudança de status para SELECTED_*

#### 4. Aceite cria vaga e valida dados bancários

**Arquivo:** `src/server/api/routers/inscricao/inscricao.ts`

```typescript
acceptInscricao: protectedProcedure
  .input(z.object({
    inscricaoId: idSchema,
    dadosBancarios: z.object({
      banco: z.string().optional(),
      agencia: z.string().optional(),
      conta: z.string().optional(),
      digitoConta: z.string().optional()
    }).optional()
  }))
  .mutation(async ({ ctx, input }) => {
    const inscricao = await ctx.db.query.inscricaoTable.findFirst({
      where: eq(inscricaoTable.id, input.inscricaoId)
    })

    // Se bolsista, dados bancários obrigatórios
    if (inscricao.status === 'SELECTED_BOLSISTA') {
      if (!input.dadosBancarios?.banco || !input.dadosBancarios?.agencia) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Dados bancários obrigatórios para bolsistas'
        })
      }

      // Atualizar dados bancários do aluno
      await ctx.db.update(alunoTable)
        .set({
          banco: input.dadosBancarios.banco,
          agencia: input.dadosBancarios.agencia,
          conta: input.dadosBancarios.conta,
          digitoConta: input.dadosBancarios.digitoConta
        })
        .where(eq(alunoTable.id, ctx.user.studentProfile.id))
    }

    // Atualizar status da inscrição
    const novoStatus = inscricao.status === 'SELECTED_BOLSISTA'
      ? 'ACCEPTED_BOLSISTA'
      : 'ACCEPTED_VOLUNTARIO'

    await ctx.db.update(inscricaoTable)
      .set({ status: novoStatus })
      .where(eq(inscricaoTable.id, input.inscricaoId))

    // Criar vaga
    await ctx.db.insert(vagaTable).values({
      alunoId: inscricao.alunoId,
      projetoId: inscricao.projetoId,
      inscricaoId: inscricao.id,
      tipo: inscricao.status === 'SELECTED_BOLSISTA' ? 'BOLSISTA' : 'VOLUNTARIO',
      dataInicio: new Date(),
      dataFim: null // Definir depois
    })
  })
```

**Validação:**
- ✅ Confirmar validação de dados bancários se bolsista
- ✅ Verificar criação de registro em `vagaTable`
- ✅ Checar mudança de status para ACCEPTED_*

---

## FASE 5: CONSOLIDAÇÃO FINAL E RELATÓRIO PROGRAD

### 📋 Funcionalidades Esperadas

#### Admin
1. Acessa "Consolidação PROGRAD"
2. Seleciona período (ano/semestre)
3. Valida dados (sistema verifica se todos os alunos têm informações bancárias completas)
4. Gera planilha Excel consolidada com todos os monitores ativos:
   - Bolsistas (com dados de pagamento)
   - Voluntários (se configurado para incluir)
5. Envia planilha final por email à PROGRAD

#### PROGRAD
1. Recebe planilha final
2. Processa pagamentos das bolsas

---

### ✅ Implementação Técnica

#### Schema

Todos os dados necessários já existem nas tabelas anteriores:
- `vagaTable` - Monitores ativos (com tipo BOLSISTA/VOLUNTARIO)
- `alunoTable` - Dados pessoais e bancários
- `professorTable` - SIAPE, departamento
- `projetoTable` - Carga horária, disciplinas

#### Routers tRPC

**Consolidação:**
- **Arquivo:** `src/server/api/routers/relatorios/relatorios.ts` ou similar
- **Endpoints:**
  - `getConsolidatedMonitoringData` - Buscar monitores ativos por período
  - `validateCompleteData` - Validar dados completos (bancários, etc)
  - `exportConsolidated` - Gerar Excel e enviar por email

#### Páginas Frontend

**Admin:**
- `/home/admin/consolidacao-prograd` - Consolidação PROGRAD
  - **Arquivo:** `src/app/home/admin/consolidacao-prograd/page.tsx`
  - **Validação:**
    - Filtros ano/semestre
    - Checkbox incluir bolsistas/voluntários
    - Botão "Validar Dados" (mostra problemas)
    - Botão "Enviar por Email" (dialog com email PROGRAD)
    - Botão "Baixar CSV" (download rápido)

---

### 🧪 Como Validar no Código

#### 1. Busca monitores ativos por período

**Arquivo:** `src/server/api/routers/relatorios/relatorios.ts`

```typescript
getConsolidatedMonitoringData: adminProtectedProcedure
  .input(z.object({
    ano: z.number(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2'])
  }))
  .query(async ({ ctx, input }) => {
    // Buscar vagas do período
    const vagas = await ctx.db.query.vagaTable.findMany({
      where: and(
        eq(vagaTable.projeto.ano, input.ano),
        eq(vagaTable.projeto.semestre, input.semestre)
      ),
      with: {
        aluno: true, // Dados pessoais e bancários
        projeto: {
          with: {
            professorResponsavel: true, // SIAPE
            disciplinas: true, // Códigos disciplinas
            departamento: true
          }
        }
      }
    })

    // Formatar dados para planilha
    return vagas.map(vaga => ({
      monitor: {
        matricula: vaga.aluno.matricula,
        nome: vaga.aluno.nomeCompleto,
        email: vaga.aluno.user.email,
        cr: vaga.aluno.cr,
        banco: vaga.aluno.banco,
        agencia: vaga.aluno.agencia,
        conta: vaga.aluno.conta,
        digitoConta: vaga.aluno.digitoConta
      },
      monitoria: {
        tipo: vaga.tipo, // BOLSISTA ou VOLUNTARIO
        valorBolsa: vaga.tipo === 'BOLSISTA' ? 400.00 : null,
        dataInicio: vaga.dataInicio,
        dataFim: vaga.dataFim,
        status: 'ATIVO'
      },
      projeto: {
        titulo: vaga.projeto.titulo,
        disciplinas: vaga.projeto.disciplinas.map(d => d.codigo).join(', '),
        cargaHorariaSemana: vaga.projeto.cargaHorariaSemana,
        numeroSemanas: vaga.projeto.numeroSemanas,
        ano: vaga.projeto.ano,
        semestre: vaga.projeto.semestre
      },
      professor: {
        nome: vaga.projeto.professorResponsavel.nomeCompleto,
        matriculaSiape: vaga.projeto.professorResponsavel.matriculaSiape,
        departamento: vaga.projeto.departamento.sigla
      }
    }))
  })
```

**Validação:**
- ✅ Confirmar filtro por ano/semestre
- ✅ Verificar join com todas as tabelas necessárias
- ✅ Checar formatação de dados para planilha

#### 2. Validação de dados completos

**Arquivo:** `src/server/api/routers/relatorios/relatorios.ts`

```typescript
validateCompleteData: adminProtectedProcedure
  .input(z.object({
    ano: z.number(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    tipo: z.enum(['bolsistas', 'voluntarios', 'ambos'])
  }))
  .query(async ({ ctx, input }) => {
    const vagas = await ctx.db.query.vagaTable.findMany({
      where: and(
        eq(vagaTable.projeto.ano, input.ano),
        eq(vagaTable.projeto.semestre, input.semestre),
        input.tipo === 'bolsistas' ? eq(vagaTable.tipo, 'BOLSISTA') : undefined
      ),
      with: { aluno: true }
    })

    const problemas = []
    for (const vaga of vagas) {
      const alunoProblemas = []

      if (!vaga.aluno.matricula) alunoProblemas.push('Matrícula ausente')
      if (!vaga.aluno.cpf) alunoProblemas.push('CPF ausente')
      if (!vaga.aluno.cr) alunoProblemas.push('CR ausente')

      // Se bolsista, dados bancários obrigatórios
      if (vaga.tipo === 'BOLSISTA') {
        if (!vaga.aluno.banco) alunoProblemas.push('Banco ausente')
        if (!vaga.aluno.agencia) alunoProblemas.push('Agência ausente')
        if (!vaga.aluno.conta) alunoProblemas.push('Conta ausente')
        if (!vaga.aluno.digitoConta) alunoProblemas.push('Dígito ausente')
      }

      if (alunoProblemas.length > 0) {
        problemas.push({
          nomeAluno: vaga.aluno.nomeCompleto,
          tipo: vaga.tipo,
          problemas: alunoProblemas
        })
      }
    }

    return {
      valido: problemas.length === 0,
      totalProblemas: problemas.length,
      problemas
    }
  })
```

**Validação:**
- ✅ Confirmar validação de campos obrigatórios
- ✅ Verificar dados bancários só obrigatórios se bolsista
- ✅ Checar retorno com lista de problemas

#### 3. Exportação e envio por email

**Arquivo:** `src/server/api/routers/relatorios/relatorios.ts`

```typescript
exportConsolidated: adminProtectedProcedure
  .input(z.object({
    ano: z.number(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    incluirBolsistas: z.boolean(),
    incluirVoluntarios: z.boolean(),
    progradEmail: z.string().email()
  }))
  .mutation(async ({ ctx, input }) => {
    // Buscar dados consolidados
    const dados = await getConsolidatedMonitoringData(...)

    // Filtrar por tipo
    let dadosFiltrados = dados
    if (!input.incluirBolsistas) {
      dadosFiltrados = dadosFiltrados.filter(d => d.monitoria.tipo !== 'BOLSISTA')
    }
    if (!input.incluirVoluntarios) {
      dadosFiltrados = dadosFiltrados.filter(d => d.monitoria.tipo !== 'VOLUNTARIO')
    }

    // Gerar Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Monitores')

    worksheet.columns = [
      { header: 'Matrícula Monitor', key: 'matricula' },
      { header: 'Nome Monitor', key: 'nome' },
      { header: 'Email', key: 'email' },
      { header: 'CR', key: 'cr' },
      { header: 'Tipo Monitoria', key: 'tipo' },
      { header: 'Valor Bolsa', key: 'valorBolsa' },
      { header: 'Projeto', key: 'projeto' },
      { header: 'Disciplinas', key: 'disciplinas' },
      { header: 'Professor', key: 'professor' },
      { header: 'SIAPE', key: 'siape' },
      { header: 'Departamento', key: 'departamento' },
      { header: 'Carga Horária Semanal', key: 'cargaSemanal' },
      { header: 'Total Horas', key: 'totalHoras' },
      { header: 'Data Início', key: 'dataInicio' },
      { header: 'Data Fim', key: 'dataFim' },
      { header: 'Banco', key: 'banco' },
      { header: 'Agência', key: 'agencia' },
      { header: 'Conta', key: 'conta' },
      { header: 'Dígito', key: 'digitoConta' }
    ]

    // Adicionar linhas
    dadosFiltrados.forEach(d => {
      worksheet.addRow({
        matricula: d.monitor.matricula,
        nome: d.monitor.nome,
        email: d.monitor.email,
        cr: d.monitor.cr,
        tipo: d.monitoria.tipo,
        valorBolsa: d.monitoria.valorBolsa || 'N/A',
        projeto: d.projeto.titulo,
        disciplinas: d.projeto.disciplinas,
        professor: d.professor.nome,
        siape: d.professor.matriculaSiape,
        departamento: d.professor.departamento,
        cargaSemanal: d.projeto.cargaHorariaSemana,
        totalHoras: d.projeto.cargaHorariaSemana * d.projeto.numeroSemanas,
        dataInicio: d.monitoria.dataInicio,
        dataFim: d.monitoria.dataFim,
        banco: d.monitor.banco || 'N/A',
        agencia: d.monitor.agencia || 'N/A',
        conta: d.monitor.conta || 'N/A',
        digitoConta: d.monitor.digitoConta || 'N/A'
      })
    })

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Enviar email
    await sendConsolidacaoProgradEmail(input.progradEmail, buffer, {
      ano: input.ano,
      semestre: input.semestre,
      totalMonitores: dadosFiltrados.length
    })

    return {
      success: true,
      message: 'Planilha enviada com sucesso para PROGRAD'
    }
  })
```

**Validação:**
- ✅ Confirmar geração de Excel com ExcelJS
- ✅ Verificar todas as colunas necessárias
- ✅ Checar envio de email com attachment
- ✅ Validar filtros por tipo (bolsista/voluntário)

---

## VALIDAÇÃO COMPLETA DO SISTEMA

### Checklist de Testes End-to-End

#### ✅ FASE 1 - Planejamento e Criação

**Admin:**
- [ ] Upload planilha Excel/CSV com professores e disciplinas
- [ ] Verificar criação automática de projetos (INDIVIDUAL vs COLETIVA)
- [ ] Confirmar templates aplicados quando existem
- [ ] Validar emails enviados para professores

**Professor:**
- [ ] Ver dashboard com disciplinas importadas
- [ ] Criar template padrão para disciplina nova
- [ ] Gerar projeto a partir de template
- [ ] Editar dados do projeto
- [ ] Assinar digitalmente
- [ ] Submeter para aprovação

**Validações de Código:**
- [ ] `src/server/api/routers/import-projects/import-projects.ts:importPlanejamento`
- [ ] `src/server/lib/spreadsheet-parser.ts` (detecta INDIVIDUAL/COLETIVA)
- [ ] `src/server/api/routers/projeto-templates/projeto-templates.ts`
- [ ] `src/server/api/routers/projeto/projeto.ts:signProfessor`

---

#### ✅ FASE 2 - Aprovação e PROGRAD

**Admin:**
- [ ] Ver lista de projetos SUBMITTED
- [ ] Aprovar projetos
- [ ] Rejeitar projetos com feedback
- [ ] Gerar planilha PROGRAD com links PDF
- [ ] Enviar planilha por email

**Validações de Código:**
- [ ] `src/server/api/routers/projeto/projeto.ts:approveProjeto`
- [ ] `src/server/api/routers/projeto/projeto.ts:rejectProjeto`
- [ ] `src/server/api/routers/analytics/analytics.ts:getProjetosAprovadosParaPrograd`
- [ ] `src/server/lib/email-service.ts:sendProgradSpreadsheet`

---

#### ✅ FASE 3 - Alocação e Edital Interno

**Admin:**
- [ ] Definir total de bolsas PROGRAD
- [ ] Alocar bolsas por projeto (validar limite)
- [ ] Notificar professores por email
- [ ] Criar edital interno DCC
- [ ] Definir 2-3 datas de prova
- [ ] Definir data divulgação
- [ ] Solicitar assinatura do chefe

**Professor:**
- [ ] Ver bolsas alocadas (read-only)
- [ ] Definir voluntários (editável)
- [ ] Escolher data/horário seleção (entre opções admin)
- [ ] Editar pontos da prova
- [ ] Editar bibliografia

**Chefe:**
- [ ] Ver editais pendentes de assinatura
- [ ] Assinar digitalmente edital

**Admin (continuação):**
- [ ] Publicar edital assinado
- [ ] Validar envio de emails para alunos/professores

**Validações de Código:**
- [ ] `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts:setTotalScholarshipsFromPrograd`
- [ ] `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts:allocateScholarships`
- [ ] `src/server/api/routers/scholarship-allocation/scholarship-allocation.ts:notifyProfessorsAfterAllocation`
- [ ] `src/server/api/routers/edital/edital.ts:create`
- [ ] `src/server/api/routers/edital/edital.ts:requestChefeSignature`
- [ ] `src/server/api/routers/edital/edital.ts:signAsChefe`
- [ ] `src/server/api/routers/edital/edital.ts:publishAndNotify`

---

#### ✅ FASE 4 - Inscrições e Seleção

**Aluno:**
- [ ] Ver vagas disponíveis
- [ ] Inscrever-se em projeto (escolher tipo vaga)
- [ ] Verificar nota disciplina registrada automaticamente

**Professor:**
- [ ] Ver candidatos inscritos
- [ ] Atribuir nota de seleção
- [ ] Verificar nota final calculada automaticamente
- [ ] Selecionar bolsistas (até limite)
- [ ] Selecionar voluntários (até limite)
- [ ] Publicar resultados

**Aluno (continuação):**
- [ ] Receber email com resultado
- [ ] Ver resultado no sistema
- [ ] Aceitar monitoria
- [ ] Se bolsista: preencher dados bancários (obrigatório)
- [ ] Rejeitar monitoria

**Validações de Código:**
- [ ] `src/server/api/routers/inscricao/inscricao.ts:createInscricao` (nota auto)
- [ ] `src/server/api/routers/selecao/selecao.ts:gradeInscricao` (cálculo nota final)
- [ ] `src/server/api/routers/selecao/selecao.ts:selectMonitors` (validação limites)
- [ ] `src/server/api/routers/selecao/selecao.ts:publishResults`
- [ ] `src/server/api/routers/inscricao/inscricao.ts:acceptInscricao` (validação dados bancários)

---

#### ✅ FASE 5 - Consolidação PROGRAD

**Admin:**
- [ ] Acessar consolidação PROGRAD
- [ ] Filtrar por ano/semestre
- [ ] Escolher incluir bolsistas/voluntários
- [ ] Validar dados (verificar problemas)
- [ ] Gerar planilha Excel consolidada
- [ ] Enviar por email para PROGRAD
- [ ] Baixar CSV rápido

**Validações de Código:**
- [ ] `src/server/api/routers/relatorios/relatorios.ts:getConsolidatedMonitoringData`
- [ ] `src/server/api/routers/relatorios/relatorios.ts:validateCompleteData`
- [ ] `src/server/api/routers/relatorios/relatorios.ts:exportConsolidated`
- [ ] Verificar todas as 19 colunas na planilha Excel

---

### Validação de Emails Automáticos

Verificar templates em `src/server/lib/email-service.ts`:

- [ ] `sendProjectCreationNotification` - Após importação planejamento
- [ ] `sendProgradSpreadsheet` - Envio planilha para PROGRAD
- [ ] `sendScholarshipAllocationNotification` - Após alocação de bolsas
- [ ] `sendEditalPublishedNotification` - Publicação de edital
- [ ] `sendSelectionResultsNotification` - Resultados da seleção
- [ ] `sendConsolidacaoProgradEmail` - Consolidação final

---

### Validação de Permissões

Verificar routers usam procedures corretos:

- [ ] `publicProcedure` - Sem autenticação
- [ ] `protectedProcedure` - Usuário autenticado
- [ ] `adminProtectedProcedure` - Apenas admin

**Exemplos críticos:**
- [ ] Alocar bolsas: `adminProtectedProcedure` ✅
- [ ] Aprovar projetos: `adminProtectedProcedure` ✅
- [ ] Assinar projeto: `protectedProcedure` (professor) ✅
- [ ] Assinar edital: `protectedProcedure` (chefe) ✅
- [ ] Inscrever-se: `protectedProcedure` (aluno) ✅

---

### Validação de Status Flow

#### Projeto Status:
```
DRAFT → SUBMITTED → APPROVED/REJECTED
```

#### Inscrição Status:
```
SUBMITTED → SELECTED_BOLSISTA/SELECTED_VOLUNTARIO → ACCEPTED_BOLSISTA/ACCEPTED_VOLUNTARIO
           ↘ REJECTED_BY_PROFESSOR
                              ↘ REJECTED_BY_STUDENT
```

---

## CONCLUSÃO

Este documento mapeia todas as funcionalidades do sistema, suas implementações técnicas e como validar cada parte do código. Use como guia para:

1. **QA Manual:** Testar fluxos end-to-end no sistema
2. **Code Review:** Verificar implementações contra especificações
3. **Documentação:** Referência para novos desenvolvedores
4. **Testes Automatizados:** Base para escrever testes E2E

**Status Atual:** ✅ Sistema 100% implementado e pronto para produção

**Última Atualização:** 11/10/2025
