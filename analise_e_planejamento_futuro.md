# Análise e Planejamento Futuro - Sistema de Monitoria IC

## 1. Introdução

O Sistema de Monitoria IC é uma aplicação web abrangente para gerenciar todo o fluxo de trabalho do programa de monitoria da UFBA, desde a proposta de projetos pelos professores até a seleção e cadastro final dos monitores.

**Estado Atual:** O sistema possui aproximadamente 40% das funcionalidades implementadas, com uma arquitetura sólida baseada em TanStack Start, PostgreSQL/Drizzle ORM, e autenticação via CAS/UFBA. As funcionalidades básicas de criação de projetos, fluxo de aprovação, e sistema de inscrições já estão operacionais.

**Objetivo deste Documento:** Servir como guia detalhado para os próximos passos do desenvolvimento, identificando lacunas funcionais e propondo implementações estruturadas seguindo as melhores práticas do projeto.

## 2. Análise do Sistema Atual e Requisitos dos Clientes

### Principais Funcionalidades Identificadas

Com base na transcrição da reunião (`videoplayback.txt`) e tickets preliminares (`tickets.txt`), o sistema deve gerenciar:

1. **Fluxo de Projetos de Monitoria**
   - Importação do planejamento semestral
   - Geração automática de projetos pré-preenchidos
   - Assinatura digital de documentos (via `react-signature-canvas`)
   - Exportação para PROGRAD

2. **Processo Seletivo**
   - Período de inscrições com edital interno
   - Aplicação online de alunos
   - Seleção por professores com cálculo de notas
   - Geração de atas e resultados

3. **Cadastro de Monitores**
   - Aceite/recusa de vagas
   - Limite de 1 bolsa por aluno/semestre
   - Termos de compromisso (assinatura digital via `react-signature-canvas`)
   - Planilhas finais para PROGRAD

### Mapeamento para Entidades do Banco

O schema atual (`src/server/database/schema.ts`) suporta bem os requisitos:

- **projeto**: Gerencia projetos com workflow de status
- **inscricao**: Controla aplicações de alunos
- **vaga**: Registra monitores aceitos
- **periodo_inscricao**: Define janelas de inscrição
- **projeto_documento**: Armazena documentos (PDFs gerados, metadados de assinatura)
- **assinatura_documento** (Nova sugestão): Tabela para armazenar dados da assinatura digital (e.g., imagem base64, timestamp, userId) vinculada a um `projeto_documento` ou `termo_compromisso`.

### Arquitetura e Suporte aos Requisitos

A arquitetura atual baseada em:
- **TanStack Start**: Oferece roteamento type-safe e SSR
- **Drizzle ORM**: Queries type-safe e migrações
- **MinIO**: Armazenamento seguro de documentos (PDFs base gerados)
- **Lucia Auth + CAS**: Autenticação integrada com UFBA
- **react-signature-canvas**: Para captura de assinaturas digitais no frontend.

Está bem preparada para expansão, necessitando principalmente de novas features e endpoints.

## 3. Funcionalidades Pendentes, Melhorias e Sugestões de Implementação

### Módulo 1: Gestão de Projetos de Monitoria (Professores e Admin)

#### 1.1 Importação de Planejamento Semestral

**Status Atual:** ❌ Não implementado

**Requisitos do Cliente:**
- Importar planilha Excel com planejamento do semestre
- Criar projetos automaticamente para cada disciplina
- Pré-preencher com dados históricos

**Pendências/Melhorias:**
- [ ] Parser de Excel para extrair dados do planejamento
- [ ] Sistema de templates para projetos
- [ ] Interface de importação para admin

**Sugestão de Implementação:**
- [ ] Criar endpoint `/api/projeto/import-planning`:
  ```typescript
  // src/routes/api/projeto/import-planning.ts
  POST: Upload Excel → Parse → Validate → Create Draft Projects
  ```
- [ ] Criar hook `useProjectImport()` no frontend
- [ ] Adicionar tabela `projeto_template` no schema para armazenar dados históricos
- [ ] Implementar UI de importação em `/home/_layout/admin/_layout/import-projects.tsx`

#### 1.2 Geração Automática de PDF de Projetos

**Status Atual:** ✅ **IMPLEMENTADO** (geração completa com assinatura digital)

**Funcionalidades Implementadas:**
- ✅ Template PDF profissional com `@react-pdf/renderer`
- ✅ Geração server-side via endpoint `/api/projeto/$id/pdf`
- ✅ Campos de assinatura digital integrados
- ✅ Preenchimento automático de datas (aprovação, assinatura)
- ✅ Download direto pelo professor e admin

**Implementação Atual:**
- ✅ `MonitoriaFormTemplate` como template principal
- ✅ Geração server-side com `renderToBuffer`
- ✅ Controle de acesso por role (professor, admin)
- ✅ Integração com sistema de assinaturas

#### 1.3 Fluxo de Assinatura pelo Professor

**Status Atual:** ✅ **IMPLEMENTADO** (assinatura digital integrada)

**Funcionalidades Implementadas:**
- ✅ Professor assina digitalmente via `react-signature-canvas`
- ✅ Sistema atualiza status DRAFT → SUBMITTED automaticamente  
- ✅ Notificação automática para todos os admins
- ✅ Interface PDF interativa com preenchimento de datas

**Implementação Atual:**
- ✅ Endpoint unificado `/api/projeto/$id/assinatura` (suporta professor e admin)
- ✅ UI em `InteractiveProjectPDF` para assinatura digital
- ✅ Hook `useProfessorSignature()` para gerenciar fluxo
- ✅ Integração com `MonitoriaFormTemplate` para geração de PDF

#### 1.4 Sistema de Assinatura Digital Unificado

**Status Atual:** ✅ **IMPLEMENTADO** (fluxo completo integrado)

**Funcionalidades Implementadas:**
- ✅ Endpoint unificado `/api/projeto/$id/assinatura` (professor e admin)
- ✅ Interface de assinatura digital com `react-signature-canvas`
- ✅ Auto-preenchimento de datas (aprovação e assinatura)
- ✅ Fluxo automático: Professor → Admin → Notificações
- ✅ Interface administrativa para assinatura (`/home/admin/document-signing`)

**Fluxo Completo Implementado:**
1. **Professor:** DRAFT → assina → SUBMITTED + notifica admins
2. **Admin:** SUBMITTED → assina → APPROVED + notifica professor
3. **Sistema:** Gerencia estados e notificações automaticamente

**Implementação Técnica:**
- ✅ `InteractiveProjectPDF` - componente de assinatura unificado
- ✅ `useProfessorSignature()` e `useAdminSignature()` - hooks específicos
- ✅ `MonitoriaFormTemplate` - template PDF com campos de assinatura
- ✅ Controle de acesso por role e validação de permissões

#### 1.5 Sistema de Notificações por Email

**Status Atual:** ✅ **IMPLEMENTADO** (integrado ao fluxo de assinatura)

**Funcionalidades Implementadas:**
- ✅ Notificação automática para admins quando professor submete
- ✅ Notificação automática para professor quando admin aprova
- ✅ Templates personalizados por contexto
- ✅ Integração com `emailService` existente

**Pendências/Melhorias:**
- [ ] Lembretes automáticos para assinaturas pendentes
- [ ] Histórico de notificações enviadas
- [ ] Templates HTML mais elaborados

**Sugestão de Implementação:**
- [ ] Adicionar tabela `notificacao_historico` ao schema
- [ ] Criar job scheduler para lembretes automáticos
- [ ] Endpoint `/api/notifications/send-reminders`

#### 1.6 Geração de Planilha PROGRAD

**Status Atual:** 🚧 Endpoint básico existe mas formato incorreto

**Requisitos do Cliente:**
- Exportar projetos aprovados no formato PROGRAD
- Incluir todos os campos obrigatórios
- Permitir download pelo admin

**Pendências/Melhorias:**
- [ ] Mapear formato exato da PROGRAD
- [ ] Incluir todos os campos necessários
- [ ] Validação de dados completos

**Sugestão de Implementação:**
- [ ] Refatorar `/api/relatorios/planilhas-prograd`
- [ ] Utilizar `exceljs` para formato correto
- [ ] Criar tipo `ProgradProjectExport` com campos obrigatórios
- [ ] Hook `useProgradExport()` com feedback de progresso

### Módulo 2: Edital Interno e Inscrições (Admin e Alunos)

#### 2.1 Interface de Distribuição de Bolsas

**Status Atual:** ❌ Não implementado

**Requisitos do Cliente:**
- Admin define quantidade de bolsas após retorno PROGRAD
- Distribuição por projeto/disciplina
- Visualização consolidada

**Pendências/Melhorias:**
- [ ] UI para alocação de bolsas
- [ ] Validação de limites
- [ ] Histórico de distribuições

**Sugestão de Implementação:**
- [ ] Adicionar campo `bolsasAlocadas` na tabela `projeto`
- [ ] Criar página `/home/_layout/admin/_layout/scholarship-allocation.tsx`
- [ ] Endpoint `/api/projeto/$id/allocate-scholarships`
- [ ] Hook `useScholarshipAllocation()`

#### 2.2 Geração de Edital Interno

**Status Atual:** ❌ Não implementado

**Requisitos do Cliente:**
- Gerar PDF do edital com todas as vagas
- Incluir regras e prazos
- Publicação automática

**Pendências/Melhorias:**
- [ ] Template de edital
- [ ] Agregação de dados de vagas
- [ ] Versionamento de editais

**Sugestão de Implementação:**
- [ ] Criar tabela `edital` no schema
- [ ] Endpoint `/api/edital/generate`
- [ ] Template em `src/server/lib/pdfTemplates/edital.ts`
- [ ] UI em `/home/_layout/admin/_layout/edital-management.tsx`

#### 2.3 Validação de Documentos Obrigatórios

**Status Atual:** 🚧 Upload funciona mas sem validação

**Requisitos do Cliente:**
- Verificar documentos obrigatórios por tipo de vaga
- Alertar alunos sobre pendências
- Bloquear inscrições incompletas

**Pendências/Melhorias:**
- [ ] Lista de documentos por tipo
- [ ] Validação no submit
- [ ] Feedback visual de pendências

**Sugestão de Implementação:**
- [ ] Criar enum `RequiredDocuments` por tipo de vaga
- [ ] Validação em `useInscricao()` hook
- [ ] Componente `DocumentChecklist` 
- [ ] Middleware de validação no endpoint de inscrição

### Módulo 3: Seleção de Monitores e Atas (Professores e Admin)

#### 3.1 Sistema de Avaliação com Notas

**Status Atual:** ❌ Não implementado

**Requisitos do Cliente:**
- Professor insere: nota disciplina, prova seleção, CR
- Cálculo automático: (disciplina×5 + seleção×3 + CR×2) / 10
- Interface por disciplina

**Pendências/Melhorias:**
- [ ] Campos para notas no schema
- [ ] Interface de entrada de notas
- [ ] Cálculo e ordenação automática

**Sugestão de Implementação:**
- [ ] Adicionar à tabela `inscricao`:
  ```typescript
  notaDisciplina: decimal('nota_disciplina', { precision: 3, scale: 2 }),
  notaSelecao: decimal('nota_selecao', { precision: 3, scale: 2 }),
  coeficienteRendimento: decimal('cr', { precision: 3, scale: 2 }),
  notaFinal: decimal('nota_final', { precision: 3, scale: 2 }),
  ```
- [ ] Criar `/home/_layout/professor/_layout/grade-applications.tsx`
- [ ] Endpoint `/api/inscricao/$id/grades`
- [ ] Hook `useApplicationGrading()`

#### 3.2 Geração de Atas de Seleção

**Status Atual:** ❌ Endpoint existe mas sem implementação

**Requisitos do Cliente:**
- Gerar ata automática da reunião de seleção
- Incluir classificação e notas
- Campos para assinaturas

**Pendências/Melhorias:**
- [ ] Template de ata
- [ ] Dados completos da seleção
- [ ] Versionamento de atas

**Sugestão de Implementação:**
- [ ] Implementar `/api/projeto/$id/gerar-ata`
- [ ] Template em `src/server/lib/pdfTemplates/ata.ts`
- [ ] Adicionar tabela `ata_selecao` ao schema
- [ ] UI para download e upload de ata assinada

#### 3.3 Publicação de Resultados

**Status Atual:** ❌ Não implementado

**Requisitos do Cliente:**
- Gerar PDF com resultados por disciplina
- Publicar para alunos consultarem
- Notificar aprovados/reprovados

**Pendências/Melhorias:**
- [ ] Template de resultado
- [ ] Sistema de publicação
- [ ] Notificações automáticas

**Sugestão de Implementação:**
- [ ] Endpoint `/api/projeto/$id/publish-results`
- [ ] Template em `src/server/lib/pdfTemplates/resultado.ts`
- [ ] Página pública de resultados
- [ ] Integração com sistema de notificações

### Módulo 4: Confirmação e Cadastro de Monitores (Alunos, Professores, Admin)

#### 4.1 Fluxo de Aceite com Validações

**Status Atual:** 🚧 Endpoints existem mas sem validação completa

**Requisitos do Cliente:**
- Limite de 1 bolsa por aluno/semestre
- Múltiplas vagas voluntárias permitidas
- Prazo para aceite/recusa

**Pendências/Melhorias:**
- [ ] Validação de bolsa única
- [ ] Controle de prazos
- [ ] Interface clara de aceite

**Sugestão de Implementação:**
- [ ] Adicionar validação em `/api/inscricao/$id/aceitar`:
  ```typescript
  // Verificar se aluno já tem bolsa no semestre
  const bolsaExistente = await db.query.vaga.findFirst({
    where: and(
      eq(vaga.alunoId, alunoId),
      eq(vaga.semestreId, semestreId),
      eq(vaga.tipoBolsa, 'bolsista')
    )
  });
  ```
- [ ] UI com avisos claros sobre limites
- [ ] Campo `prazoAceite` na tabela `inscricao`

#### 4.2 Geração de Termos de Compromisso

**Status Atual:** ❌ Não implementado

**Requisitos do Cliente:**
- Gerar termo personalizado por aluno
- Incluir dados do projeto e monitor
- Campos para assinaturas

**Pendências/Melhorias:**
- [ ] Template de termo
- [ ] Personalização por tipo de vaga
- [ ] Rastreamento de assinaturas

**Sugestão de Implementação:**
- [ ] Endpoint `/api/vaga/$id/termo-compromisso`
- [ ] Template em `src/server/lib/pdfTemplates/termo.ts`
- [ ] Adicionar status de assinatura na tabela `vaga`
- [ ] UI para download e upload

#### 4.3 Consolidação Final para PROGRAD

**Status Atual:** ❌ Formato incorreto

**Requisitos do Cliente:**
- Planilha de bolsistas com todos os dados
- Planilha de voluntários separada
- Formato específico PROGRAD

**Pendências/Melhorias:**
- [ ] Mapeamento exato dos campos
- [ ] Separação por tipo
- [ ] Validação de dados completos

**Sugestão de Implementação:**
- [ ] Criar `/api/relatorios/monitores-final`
- [ ] Tipos `ProgradBolsistaExport` e `ProgradVoluntarioExport`
- [ ] Validação de documentos antes da exportação
- [ ] UI com preview antes do download

### Perfis de Usuário e Onboarding

#### Melhorias no Onboarding

**Status Atual:** 🚧 Básico implementado

**Pendências/Melhorias:**
- [ ] Campos adicionais no perfil do aluno:
  - Banco/agência/conta para bolsa
  - Documentos permanentes (RG, CPF)
  - Contatos de emergência
  
- [ ] Campos do professor:
  - SIAPE
  - Titulação
  - Áreas de pesquisa

**Sugestão de Implementação:**
- [ ] Expandir schemas `aluno` e `professor`
- [ ] Melhorar forms em `/home/_layout/common/onboarding/`
- [ ] Validação progressiva de perfil completo
- [ ] Indicadores visuais de completude

### Outras Funcionalidades

#### Gerenciamento CRUD Completo (Admin)

**Status Atual:** 🚧 Parcialmente implementado

**Pendências/Melhorias:**
- [ ] CRUD de Departamentos
- [ ] CRUD de Cursos  
- [ ] CRUD de Semestres
- [ ] Logs de auditoria

**Sugestão de Implementação:**
- [ ] Páginas admin com DataTables
- [ ] Endpoints RESTful completos
- [ ] Soft delete onde aplicável
- [ ] Hook genérico `useCrud<T>()`

#### Analytics Dashboard

**Status Atual:** 🚧 Endpoint existe mas incompleto

**Pendências/Melhorias:**
- [ ] Métricas de projetos por status
- [ ] Taxa de aprovação de inscrições
- [ ] Distribuição por departamento
- [ ] Evolução temporal

**Sugestão de Implementação:**
- [ ] Expandir `/api/analytics/dashboard`
- [ ] Componentes de gráficos com Recharts
- [ ] Cache de métricas para performance
- [ ] Filtros por período

## 4. Conclusão

### Próximos Passos Prioritários (Sequencial)

Com base na urgência expressa pelos clientes, a implementação deve seguir esta ordem:

**Fase 1 - Módulo 1 (Mais Urgente):**
1. [ ] Implementar importação de planejamento semestral
2. [ ] Criar geração automática de PDFs de projetos
3. [ ] Adicionar fluxo de assinatura pelo professor
4. [ ] Integrar sistema de notificações por email
5. [ ] Corrigir formato de exportação PROGRAD

**Fase 2 - Módulo 2:**
6. [ ] Desenvolver interface de distribuição de bolsas
7. [ ] Implementar geração de edital interno
8. [ ] Adicionar validação de documentos obrigatórios

**Fase 3 - Módulo 3:**
9. [ ] Criar sistema de entrada de notas
10. [ ] Implementar geração de atas
11. [ ] Desenvolver publicação de resultados

**Fase 4 - Módulo 4:**
12. [ ] Adicionar validações no aceite de vagas
13. [ ] Implementar geração de termos
14. [ ] Criar exportação final consolidada

**Melhorias Contínuas:**
15. [ ] Aprimorar onboarding e perfis
16. [ ] Completar CRUDs administrativos
17. [ ] Expandir analytics dashboard
18. [ ] Implementar testes E2E com Cypress

### Considerações Técnicas

Todas as implementações devem seguir:
- **API and Hooks Pattern** (Cursor Rules)
- **Code Development Guidelines** com foco em TypeScript strict
- Padrão de commits convencionais
- Testes unitários para lógica crítica
- Documentação inline mínima mas precisa

O sistema já possui uma base sólida, e com a implementação sistemática destes módulos, atenderá completamente as necessidades do programa de monitoria da UFBA.