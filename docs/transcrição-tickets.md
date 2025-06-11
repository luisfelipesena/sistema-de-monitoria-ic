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

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Importar planilha Excel com planejamento do semestre
- Criar projetos automaticamente para cada disciplina
- Pré-preencher com dados históricos

**Funcionalidades Implementadas:**
- ✅ Endpoint em `/api/projeto/import-planning` que processa arquivos .xlsx.
- ✅ Validação de dados da planilha com Zod.
- ✅ Criação de projetos em lote com status `PENDING_PROFESSOR_SIGNATURE`.
- ✅ Utilização de `projeto_template` para pré-preenchimento de dados.
- ✅ Interface de importação para admin em `/home/admin/import-projects` com drag-and-drop.
- ✅ Hook `useProjectImport` para gerenciar o upload e o estado da UI.
- ✅ Feedback de sucesso/erro via toasts.

**Sugestão de Implementação:**
- [x] Criar endpoint `/api/projeto/import-planning`:
  ```typescript
  // src/routes/api/projeto/import-planning.ts
  POST: Upload Excel → Parse → Validate → Create Draft Projects
  ```
- [x] Criar hook `useProjectImport()` no frontend
- [x] Adicionar tabela `projeto_template` no schema para armazenar dados históricos
- [x] Implementar UI de importação em `/home/_layout/admin/_layout/import-projects.tsx`

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

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Exportar projetos aprovados no formato PROGRAD
- Incluir todos os campos obrigatórios
- Permitir download pelo admin

**Funcionalidades Implementadas:**
- ✅ Endpoint `/api/relatorios/planilhas-prograd` refatorado para usar `exceljs`.
- ✅ Geração de planilhas .xlsx com abas separadas para "Projetos Aprovados" e "Monitores Selecionados".
- ✅ Cabeçalhos estilizados e colunas com largura definida para melhor legibilidade.
- ✅ Hook `useProgradExport` que gerencia o download e permite filtros por ano, semestre e departamento.
- ✅ Interface para admin em `/home/admin/relatorios` para selecionar filtros e baixar o relatório.
- ✅ Nomenclatura dinâmica de arquivos com base nos filtros selecionados.

**Sugestão de Implementação:**
- [x] Refatorar `/api/relatorios/planilhas-prograd`
- [x] Utilizar `exceljs` para formato correto
- [x] Criar tipo `ProgradProjectExport` com campos obrigatórios (implementado implicitamente na estrutura de dados)
- [x] Hook `useProgradExport()` com feedback de progresso

### Módulo 2: Edital Interno e Inscrições (Admin e Alunos)

#### 2.1 Interface de Distribuição de Bolsas

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Admin define quantidade de bolsas após retorno PROGRAD
- Distribuição por projeto/disciplina
- Visualização consolidada

**Funcionalidades Implementadas:**
- ✅ Campo `bolsasDisponibilizadas` na tabela `projeto` para armazenar alocações
- ✅ Página `/home/admin/scholarship-allocation` com interface completa para distribuir bolsas
- ✅ Endpoint `/api/projeto/$id/allocate-scholarships` com validação de admin e controle de acesso
- ✅ Hook `useScholarshipAllocation` para gerenciar estado da UI e invalidação de queries
- ✅ Tabela interativa mostrando projetos aprovados com inputs numéricos para definir bolsas
- ✅ Validação de dados com Zod e feedback de sucesso/erro via toasts
- ✅ Interface responsiva com loading states e controle de permissões

**Pendências/Melhorias:**
- [ ] Histórico de distribuições por semestre
- [ ] Validação de limites totais de bolsas disponíveis
- [ ] Relatórios de distribuição por departamento

**Implementação Técnica:**
- [x] Campo `bolsasDisponibilizadas` na tabela `projeto`
- [x] Página `/home/_layout/admin/_layout/scholarship-allocation.tsx`  
- [x] Endpoint `/api/projeto/$id/allocate-scholarships`
- [x] Hook `useScholarshipAllocation()` com invalidação automática

#### 2.2 Geração de Edital Interno

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Gerar PDF do edital com todas as vagas
- Incluir regras e prazos
- Publicação automática

**Funcionalidades Implementadas:**
- ✅ Tabela `editalTable` no schema com todos os campos necessários
- ✅ Endpoint `/api/edital/generate` para gerar editais com validação de admin
- ✅ Template profissional `EditalTemplate` em `src/server/lib/pdfTemplates/edital.tsx`
- ✅ Interface completa em `/home/admin/edital-management` para gerenciar editais
- ✅ Agregação automática de projetos aprovados por período
- ✅ Geração de PDF com informações de vagas, datas e regras
- ✅ Sistema de publicação/despublicação de editais
- ✅ Download de editais gerados
- ✅ Armazenamento seguro no MinIO com nomenclatura organizada
- ✅ Build funcionando sem erros de lint

**Implementação Técnica:**
- [x] Tabela `edital` no schema
- [x] Endpoint `/api/edital/generate`
- [x] Template em `src/server/lib/pdfTemplates/edital.tsx`
- [x] UI em `/home/_layout/admin/_layout/edital-management.tsx`
- [x] Hooks `useGenerateEdital`, `useEditalList`, `useDownloadEdital`, `usePublishEdital`
- [x] Integração com períodos de inscrição
- [x] Validação de dados e controle de acesso
- [x] Sidebar atualizada para apontar para `/home/admin/edital-management`

**Pendências/Melhorias:**
- [ ] Versionamento de editais (histórico de mudanças)
- [ ] Assinatura digital de editais
- [ ] Templates personalizáveis por departamento

#### 2.3 Validação de Documentos Obrigatórios

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Verificar documentos obrigatórios por tipo de vaga
- Alertar alunos sobre pendências
- Bloquear inscrições incompletas

**Funcionalidades Implementadas:**
- ✅ Enum `RequiredDocumentType` definindo tipos de documentos por vaga (`BOLSISTA`, `VOLUNTARIO`, `ANY`)
- ✅ Biblioteca de validação em `src/lib/document-validation.ts` com metadados completos
- ✅ Componente `DocumentChecklist` com interface visual para upload e validação
- ✅ Validação no endpoint `/api/monitoria/inscricao/index.ts` que bloqueia inscrições incompletas
- ✅ Hooks `useCriarInscricao()` e `useUploadInscricaoDocument()` para gerenciar o fluxo
- ✅ Interface integrada no modal de inscrição com feedback visual em tempo real
- ✅ Sistema de upload com preview, remoção e validação de tipos de arquivo

**Implementação Técnica:**
- [x] Criar enum `RequiredDocuments` por tipo de vaga
- [x] Validação em `useInscricao()` hook  
- [x] Componente `DocumentChecklist` com upload visual
- [x] Middleware de validação no endpoint de inscrição
- [x] Interface responsiva com progresso e feedback de erro
- [x] Metadados por documento (formatos aceitos, tamanho máximo, descrições)

**Documentos por Tipo de Vaga:**
- **BOLSISTA**: Histórico Escolar, Comprovante de Matrícula, Comprovante de CR, RG/CPF, Foto 3x4
- **VOLUNTARIO**: Histórico Escolar, Comprovante de Matrícula, Comprovante de CR  
- **ANY**: Histórico Escolar, Comprovante de Matrícula, Comprovante de CR

**Pendências/Melhorias:**
- [ ] Validação adicional de conteúdo dos documentos
- [ ] Histórico de documentos enviados por aluno
- [ ] Notificações automáticas para documentos pendentes

### Módulo 3: Seleção de Monitores e Atas (Professores e Admin)

#### 3.1 Sistema de Avaliação com Notas

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Professor insere: nota disciplina, prova seleção, CR
- Cálculo automático: (disciplina×5 + seleção×3 + CR×2) / 10
- Interface por disciplina

**Funcionalidades Implementadas:**
- ✅ Campos para `notaDisciplina`, `notaSelecao`, `coeficienteRendimento`, e `notaFinal` adicionados à tabela `inscricao`.
- ✅ Endpoint `/api/inscricao/$id/grades` para submeter as notas.
- ✅ O endpoint calcula a `notaFinal` automaticamente e a armazena no banco.
- ✅ Hook `useApplicationGrading` criado em `src/hooks/use-inscricao.ts` para interagir com a API.
- ✅ UI em `/home/professor/grade-applications` onde o professor pode selecionar um projeto e inserir as notas para cada candidato.
- ✅ A UI exibe a nota final calculada após salvar.

**Sugestão de Implementação:**
- [x] Adicionar à tabela `inscricao`:
  ```typescript
  notaDisciplina: decimal('nota_disciplina', { precision: 3, scale: 2 }),
  notaSelecao: decimal('nota_selecao', { precision: 3, scale: 2 }),
  coeficienteRendimento: decimal('cr', { precision: 3, scale: 2 }),
  notaFinal: decimal('nota_final', { precision: 3, scale: 2 }),
  ```
- [x] Criar `/home/_layout/professor/_layout/grade-applications.tsx`
- [x] Endpoint `/api/inscricao/$id/grades`
- [x] Hook `useApplicationGrading()`

#### 3.2 Geração de Atas de Seleção

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Gerar ata automática da reunião de seleção
- Incluir classificação e notas
- Campos para assinaturas

**Funcionalidades Implementadas:**
- ✅ Tabela `ata_selecao` adicionada ao schema para versionamento e rastreamento.
- ✅ Endpoint `/api/projeto/$id/gerar-ata-data` que coleta e formata os dados necessários para a ata.
- ✅ Template de PDF para a ata criado em `src/server/lib/pdfTemplates/ata.ts`.
- ✅ Hook `useGenerateAtaData` para buscar os dados da ata no frontend.
- ✅ UI em `/home/professor/gerar-ata` que permite ao professor selecionar um projeto e gerar a ata.
- ✅ A ata é renderizada no frontend com `<PDFViewer />`, permitindo visualização e download pelo professor.

**Sugestão de Implementação:**
- [x] Implementar `/api/projeto/$id/gerar-ata` (endpoint de dados foi criado em seu lugar).
- [x] Template em `src/server/lib/pdfTemplates/ata.ts`
- [x] Adicionar tabela `ata_selecao` ao schema
- [x] UI para download e upload de ata assinada (visualização e download implementados).

#### 3.3 Publicação de Resultados

**Status Atual:** ✅ **IMPLEMENTADO**

**Requisitos do Cliente:**
- Gerar PDF com resultados por disciplina
- Publicar para alunos consultarem
- Notificar aprovados/reprovados

**Funcionalidades Implementadas:**
- ✅ Endpoint `/api/projeto/$id/publish-results-data` que coleta e formata os dados dos aprovados.
- ✅ Template de PDF para o resultado final criado em `src/server/lib/pdfTemplates/resultado.ts`.
- ✅ Hook `usePublishResultsData` para buscar os dados do resultado no frontend.
- ✅ UI em `/home/professor/publish-results` que permite ao professor selecionar um projeto e gerar o PDF.
- ✅ O resultado é renderizado no frontend com `<PDFViewer />`, permitindo visualização e download.
- 🚧 A notificação automática para os alunos ainda precisa ser implementada como um passo separado.

**Sugestão de Implementação:**
- [x] Endpoint `/api/projeto/$id/publish-results` (endpoint de dados foi criado em seu lugar).
- [x] Template em `src/server/lib/pdfTemplates/resultado.ts`
- [ ] Página pública de resultados (implementado como página de professor por enquanto).
- [ ] Integração com sistema de notificações.

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