
## Fase 4 — Fluxo de Inscrição de Monitoria (Aluno) ✅

Replica no sistema o Google Form DCC e gera os PDFs oficiais UFBA (Anexo III/IV + Anexo I Termo) assinados digitalmente, sem depender de upload externo do aluno. Mesmo padrão end-to-end usado no `MonitoriaFormTemplate.tsx` para projetos (React-PDF + assinatura inline + armazenamento MinIO).

- Wizard em 5 passos em `/home/student/inscricao-monitoria/[projetoId]/wizard`: Dados Pessoais → Declaração (tipo vaga + cursou componente + equivalência) → Documentos (RG, CPF, Histórico Escolar) → Assinatura digital → Revisar & Enviar ✅
- Geração automática do **Anexo III** (bolsista) ou **Anexo IV** (voluntário) com dados pré-preenchidos do aluno/projeto/disciplina e assinatura inline ✅
- Geração automática do **Anexo I** (Termo de Compromisso) com tabela bancária preenchida apenas quando BOLSISTA ✅
- PDF combinado (`pdf-lib` merge) equivalente ao que era submetido manualmente no Drive ✅
- Captura automática de CR + nota da disciplina com equivalência bidirecional (`findStudentGradeWithEquivalents`) ✅
- Declaração §3.1/§3.2.1 do Anexo IV/III: "cursou com aprovação?" + disciplina equivalente opcional ✅
- Patch de perfil inline (endereço, data de nascimento, dados bancários) quando o onboarding está incompleto — sem redirect ✅
- Persistência unificada: `inscricaoDocumentoTable` armazena uploads (RG/CPF/HIST) + PDFs gerados (Anexo III/IV, Anexo I, combinado) com novo enum `tipoDocumentoInscricaoEnum` ✅
- Endpoint `inscricao.getInscricaoDocumentos` com presigned URLs — aluno/professor do projeto/admin podem baixar ✅
- Endpoint `inscricao.regenerateDocumentos` para retry sem re-assinatura (usa `assinaturaAlunoFileId` salva) ✅
- Endpoint `aluno.getFullProfile` para pré-preencher o wizard com endereço + banking ✅
- Migration `0059_inscricao_wizard.sql` aplica enum + colunas novas em `aluno`/`inscricao`/`inscricao_documento` ✅
- Smoke test `scripts/test-inscricao-pdfs.ts` renderiza os 3 templates (~30 KB cada) — útil para regressão visual ✅

Arquivos adicionados/modificados:
- Templates: `src/server/lib/pdfTemplates/anexo-{iii-inscricao-bolsista,iv-inscricao-voluntario,i-termo-compromisso-monitor,shared-styles,ufba-header}.{tsx,ts}`
- Serviço PDF: `src/server/services/inscricao/pdf/inscricao-pdf-{generator,service}.{tsx,ts}`
- Router: `src/server/api/routers/aluno/aluno.ts` + extensões em `inscricao.ts`
- Wizard UI: `src/components/features/inscricao/wizard/InscricaoWizard.tsx` + rota `src/app/home/student/inscricao-monitoria/[projetoId]/wizard/page.tsx`
- Types: `src/types/inscricao-document.ts`, `src/types/inscricao-pdf-inputs.ts`, estensões em `inscription.ts`/`student.ts`
- Schema: `dataNascimento`, `telefoneFixo` em aluno; `cursouComponente`, `disciplinaEquivalenteId`, `assinaturaAlunoFileId`, `dataAssinaturaAluno`, `localAssinaturaAluno` em inscricao; `tipo_documento_inscricao_enum` em inscricao_documento

Verificação E2E manual: aluno seleciona projeto → percorre wizard → Anexo IV (voluntário) pg1 + Anexo I pg2 idênticos ao `docs/examples/voluntario - Liz Rabacal.pdf` (ou Anexo III pg1 + Anexo I pg2 se bolsista, com tabela bancária preenchida).

---

- Permitir historico para os professores verem seus projetos passados
- Admin DCC outro ADMIN com acesso DCI - cada um ve os projetos do seu departamento - ajustar isso ✅
  - Em /home/admin/planilha-prograd o DCI carregar somente projetos DCI e o DCC somente projetos do DCC ✅
  - Essas roles vão ser adminType: DCC | DCI ✅
- Adicionar Tipo do professor - substituto ou efetivo ✅
- Em professores, de fato criar o professor ao inves de so enviar o convite, dai ele tera que confirmar sua conta via email para ficar ativo ✅
- Remover Turma de Disciplinas e a aba de cursos pode dropar ✅
- Passar templates de Projeto para dentro da seção de Projetos no Sidebar ✅
- So adicionar Instituto de Computacao em /admin/configuracoes com email, sempre 1 email so
  - Dai no /home/admin/planilha-prograd quando cliar em enviar ao instuto eviar por padrao tanto pro departamento associado tanto pro instituto
- Remover botões em /home/admin/manage-projects como assinatura de documentos e agrupar por dpt, e add botao de notificiar professpres com projetos que vinheram  da importacao mas ele n criou o projeto e assinou, enviar email para esses profetores q estao pendentes
- PLanilha Prograd deve ser UNICA e nao variar por tab, e dar o link pro PDF do projeto, alem disso deve ter as colunas (**Unidade UniversitáriaÓrgão Responsável (Dept. ou Coord. Acadêmica)CODIGOComponente(s) Curricular(es): NOMEProfessor Responsável pelo Projeto (Proponente)Professores participantes (Projetos coletivos)**) - usar /home/admin/planilha-prograd
- Um edital pro DCI também, para cada departamento - como n tem edital PROGRAD remover esse - apenas DCI e DCC, pra PROGRAD eles geram o PDF então seria subir o PDF deles no sistema ✅
- O número do edital deve ser editável, permita editar o apenas o numero do edital ✅
- Deixar mais claro na criacao de novo edital, que a data de inicio e fim sao as datas de inicio de INSCRICAO e data fim da INSCRICAO ✅
- No priprio edital deve ter um link para o formulario de inscricao ✅
- Se tiver equivalencias deve constar no edital as equivalencias das matérias ✅
- Tem q adicionar outra Data de inicio da selecao e data  fim da selecao - da prova ✅
- Data de divulgacao do edital ✅
- Professores apos notificação eles devem indicar numeros de voluntarios e dia horario de selecao + bibiografia necessaria e pontos de prova ✅ (campos adicionados ao schema: localSelecao, bibliografia, pontosProva)
- remover cursos e no onboarding do aluno fazer ele botar seu curso por extenso ✅
- Add menu (subseção) no sidebar de inscricoes, e mesmos filtros por semestre e ver dados de inscrições  - por materia, semestre, volutanrio - bolsista
- E menu de Seleção → inscricao ja ocorreu, diate do edital mapeado o → o professor acesa o menu de selecao e cada um consegue ver sua view especifica aos projeta e ele - vai ter q gerar atas por projeto - tanto pro admin pra ver tudo, tanto pro professor
- Menus relatórios → com relatorios prograd e consolidação
  - Relatorio por disciplina
  - Relatorio por monitor - todos monitories em todas disciplinas
  - Apagar /home/admin/validacao-relatorios ✅
