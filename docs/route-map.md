# Sistema de Monitoria IC – Mapa de Rotas

> Documento gerado para orientar a migração para **Next.js + tRPC**.
>
> Colunas:
> 1. **Path** – caminho atual exposto
> 2. **Arquivo** – localização do handler/componente
> 3. **Métodos** – métodos HTTP presentes (rotas API)  
> 4. **Auth** – exige autenticação? (sim/-/TBD)  
> 5. **Notas** – observações sobre funcionalidade crítica

---

## 1. Rotas Backend (API – createAPIFileRoute)

| Path | Arquivo | Métodos | Auth | Notas |
|------|---------|---------|------|-------|
| /api/admin/bulk-reminder | src/routes/api/admin/bulk-reminder.ts | POST | sim | envio de lembretes em lote |
| /api/admin/invite-professor | src/routes/api/admin/invite-professor.ts | POST | sim | fluxo de convite de professor |
| /api/admin/projeto-template | src/routes/api/admin/projeto-template/index.ts | GET POST | sim | CRUD templates |
| /api/admin/projeto-template/[id] | src/routes/api/admin/projeto-template/[id].ts | GET PUT DELETE | sim | CRUD templates |
| /api/analytics/dashboard | src/routes/api/analytics/dashboard.ts | GET | sim | métricas dashboard |
| /api/auth/cas-login | src/routes/api/auth/cas-login/index.ts | GET | – | redireciona CAS |
| /api/auth/cas-callback | src/routes/api/auth/cas-callback/index.ts | GET | – | callback CAS (cria sessão) |
| /api/auth/logout | src/routes/api/auth/logout/index.ts | POST | sim | encerra sessão |
| /api/auth/me | src/routes/api/auth/me/index.ts | GET | sim | dados do usuário logado |
| /api/auth/validate-invitation | src/routes/api/auth/validate-invitation/index.ts | GET | – | valida token convite |
| /api/auth/accept-invitation | src/routes/api/auth/accept-invitation/index.ts | POST | sim | aceita convite professor |
| /api/course | src/routes/api/course/index.ts | GET POST | sim | cursos |
| /api/course/$id | src/routes/api/course/$id/index.ts | GET PUT DELETE | sim | cursos |
| /api/department | src/routes/api/department/index.ts | GET POST | sim | departamentos |
| /api/department/$id | src/routes/api/department/$id/index.ts | GET PUT DELETE | sim | departamentos |
| /api/disciplina | src/routes/api/disciplina/index.ts | GET POST | sim | disciplinas |
| /api/disciplina/$id | src/routes/api/disciplina/$id/index.ts | GET PUT DELETE | sim | disciplinas |
| /api/disciplina/$id/professor | src/routes/api/disciplina/$id/professor.ts | GET | sim | professor responsável |
| /api/disciplina/vincular-professor | src/routes/api/disciplina/vincular-professor.ts | POST DELETE | sim | vínculo professor-disciplina |
| /api/files/upload | src/routes/api/files/upload/index.ts | POST | sim | upload genérico (MinIO) |
| /api/files/metadata | src/routes/api/files/metadata/index.ts | POST | sim | metadados arquivo |
| /api/files/access | src/routes/api/files/access/index.ts | POST | sim | access link usuário |
| /api/files/admin/list | src/routes/api/files/admin/list.ts | GET | sim(admin) | listar arquivos |
| /api/files/admin/delete | src/routes/api/files/admin/delete.ts | POST | sim(admin) | deletar |
| /api/files/admin/presigned-url | src/routes/api/files/admin/presigned-url.ts | POST | sim(admin) | presigned |
| /api/monitoria/vagas | src/routes/api/monitoria/vagas/index.ts | GET | sim | vagas disponíveis |
| /api/monitoria/inscricao | src/routes/api/monitoria/inscricao/index.ts | POST | sim | nova inscrição |
| /api/onboarding/status | src/routes/api/onboarding/status/index.ts | GET | sim | status onboarding |
| /api/periodo-inscricao | src/routes/api/periodo-inscricao/index.ts | GET POST | sim | períodos inscrição |
| /api/periodo-inscricao/[id] | src/routes/api/periodo-inscricao/[id].ts | GET PUT DELETE | sim | períodos inscrição |
| /api/edital | src/routes/api/edital/index.ts | GET POST | sim | CRUD edital |
| /api/edital/[id] | src/routes/api/edital/[id].ts | GET PUT DELETE | sim | detalhes edital |
| /api/edital/[id]/generate-pdf | src/routes/api/edital/[id]/generate-pdf.ts | GET | sim | gera HTML PDF |
| /api/edital/[id]/upload-signed | src/routes/api/edital/[id]/upload-signed.ts | POST | sim | upload PDF assinado |
| /api/edital/[id]/publish | src/routes/api/edital/[id]/publish.ts | PATCH | sim | publicar edital |
| /api/edital/[id]/download | src/routes/api/edital/[id]/download.ts | GET | sim | download PDF |
| /api/edital/generate | src/routes/api/edital/generate.ts | POST | sim | gera edital completo |
| /api/professor | src/routes/api/professor/index.ts | GET POST | sim | perfil professor |
| /api/professor/list | src/routes/api/professor/list.ts | GET | sim(admin) | listar professores |
| /api/professor/disciplinas | src/routes/api/professor/disciplinas/index.ts | GET POST | sim(prof) | vínculo disciplinas |
| /api/professor/disciplinas/$id | src/routes/api/professor/disciplinas/$id.ts | DELETE | sim(prof) | desvincular |
| /api/projecto… **(rotas de projeto abaixo)** |
| /api/projeto | src/routes/api/projeto/index.ts | GET POST | sim | lista/cria projeto |
| /api/projeto/importar-planejamento | src/routes/api/projeto/importar-planejamento.ts | POST | sim(admin) | import XLSX planejamento |
| /api/projeto/import-planning | src/routes/api/projeto/import-planning.ts | POST | sim | legacy import |
| /api/projeto/$id | src/routes/api/projeto/$id/index.ts | GET PUT DELETE | sim | detalhe/atualiza/remove |
| /api/projeto/$id/submit | …/submit.ts | POST | sim(prof) | submeter |
| /api/projeto/$id/approve | …/approve.ts | POST | sim(admin) | aprovar + bolsas |
| /api/projeto/$id/reject | …/reject.ts | POST | sim(admin) | rejeitar |
| /api/projeto/$id/status | …/status.ts | PUT | sim | altera status |
| /api/projeto/$id/pdf | …/pdf.ts | GET | sim | gera PDF (HTML) |
| /api/projeto/$id/pdf-data | …/pdf-data.ts | GET | sim | dados JSON PDF |
| /api/projeto/$id/assinatura | …/assinatura.ts | POST | sim | **assinatura digital (crítico)** |
| /api/projeto/$id/upload-document | …/upload-document.ts | POST | sim | upload documento assinado |
| /api/projeto/$id/documents | …/documents.ts | GET | sim | lista docs |
| /api/projeto/$id/inscricoes | …/inscricoes.ts | GET | sim | aplicações |
| /api/projeto/$id/selection-process | …/selection-process.ts | GET POST | sim | processo seletivo |
| /api/projeto/$id/finalize-selection | …/finalize-selection.ts | POST | sim | finalizar seleção |
| /api/projeto/$id/notify-results | …/notify-results.ts | POST | sim | notificar resultados |
| /api/projeto/$id/notify-signing | …/notify-signing.ts | POST | sim | lembrete assinatura prof |
| /api/projeto/$id/gerar-ata | …/gerar-ata.ts | GET | sim | PDF ata |
| /api/projeto/$id/gerar-ata-data | …/gerar-ata-data.ts | GET | sim | dados ata |
| /api/projeto/$id/publish-results-data | …/publish-results-data.ts | GET | sim | dados divulgação |
| /api/projeto/$id/allocate-scholarships | …/allocate-scholarships.ts | POST | sim(admin) | definir bolsas |
| /api/public/documents/[...all] | src/routes/api/public/documents/[...all].ts | GET | – | arquivos públicos |
| /api/relatorios/planilhas-prograd | src/routes/api/relatorios/planilhas-prograd.ts | GET | sim(admin) | XLSX resumo |
| /api/relatorios/pedidos-monitoria-prograd | src/routes/api/relatorios/pedidos-monitoria-prograd.ts | GET | sim(admin) | relatório PROGRAD |
| /api/user | src/routes/api/user/index.ts | GET | sim(admin) | lista usuários |
| /api/user/$userId | src/routes/api/user/$userId/index.ts | PUT DELETE | sim(admin) | alterar / remover |
| /api/user/signature | src/routes/api/user/signature/index.ts | GET POST DELETE | sim | **assinatura default usuário** |
| /api/user/documents | src/routes/api/user/documents/index.ts | GET | sim | lista docs usuário |

> **Observação:** rotas de assinatura digital e geração de PDF são cruciais. Manter compatibilidade na migração.

---

## 2. Rotas Front-end (createFileRoute)

| Path | Arquivo (componente) | Notas |
|------|---------------------|-------|
| / | src/routes/index.tsx | landing/login |
| /auth/cas-callback | src/routes/auth/cas-callback.tsx | redirect pós-CAS |
| /auth/accept-invitation | src/routes/auth/accept-invitation/index.tsx | aceite convite |
| /public/editais | src/routes/public/editais.tsx | lista editais publicados |
| /home/_layout & children | src/routes/home/_layout.tsx etc. | Shell principal |
| /home/common/* | status, profile, onboarding, selecao-monitores |
| /home/student/dashboard | …student/_layout/dashboard.tsx | painel aluno |
| /home/student/inscricao-monitoria | …student/_layout/inscricao-monitoria.tsx | inscrição |
| /home/student/resultados | …student/_layout/resultados.tsx | resultados |
| /home/professor/dashboard | …professor/_layout/dashboard.tsx | painel prof |
| /home/professor/projects | …/projects.tsx | lista/criar projeto |
| /home/professor/document-signing | …/document-signing.tsx | **assinatura prof** |
| /home/professor/gerar-ata | …/gerar-ata.tsx | gera ata |
| /home/professor/* outros | grade-applications, project-applications, volunteer-management, publish-results, disciplinas |
| /home/admin/dashboard | …admin/_layout/dashboard.tsx | painel admin |
| /home/admin/document-signing | …admin/_layout/document-signing.tsx | **assinatura admin** |
| /home/admin/manage-projects | …admin/_layout/manage-projects.tsx | gerenciar projetos |
| /home/admin/* | users, cursos, departamentos, etc. |

> Front-end depende extensivamente de **TanStack Router** + **React Query**. Será migrado para **Next app router** + **tRPC hooks**.

---

### Próximos passos
1. Migrar esquemas Zod para package compartilhado.
2. Recriar rotas tRPC refletindo a tabela acima.
3. Atualizar componentes para consumir `trpc` hooks.