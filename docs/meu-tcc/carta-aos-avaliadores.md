# Carta aos Avaliadores — Sistema de Monitoria-IC (REIC)

Prezados Editores-Chefes (Profa. Celia Ralha e Prof. Carlos Pantoja) e prezados Avaliadores,

Agradecemos as contribuições da revisão. Abaixo respondemos, ponto a ponto, aos comentários do Avaliador A e ao reconhecimento do Avaliador C.

## Avaliador C — Aceitar

Agradecemos as notas "Excelente" em organização, fundamentação e qualidade técnica. A ressalva quanto à avaliação do software foi endereçada em conjunto com o ponto A5 abaixo: ampliamos a amostra e incluímos o perfil estudante, antes ausente.

## Avaliador A — Revisões Requeridas

### A1. Diferencial na tabela comparativa

A Tabela 2 (Seção 3.3) passou a ter uma coluna **"Diferencial do Sistema de Monitoria-IC"** para cada sistema (JúpiterWeb, SIGA, SIGAA, CAGR e SEI). O parágrafo logo após sintetiza os diferenciais coletivos: módulo fim-a-fim dedicado, *type-safety* de cliente a servidor, assinatura digital nativa e consolidação automática da planilha PROGRAD.

### A2. Arquitetura em camadas e impacto de desempenho

Criamos a subseção **4.2.1 "Justificativa da Arquitetura e Impacto de Desempenho"**, que trata a preocupação em três pontos: (i) as camadas são lógicas, não físicas, com chamadas *in-process* sem *overhead* de rede (Fowler, 2002; Martin, 2017); (ii) a suíte automatizada conclui em 1,07 s e o RNF02 (p95 < 100 ms) é cumprido em homologação; (iii) a arquitetura é precondição para escalar horizontalmente (réplicas PostgreSQL, MinIO distribuído, *containers* Docker). Alternativas (microsserviços segundo Newman, 2015; duas camadas) foram justificadamente descartadas. Três novas referências foram incorporadas.

### A3. Lista completa de requisitos

Adicionamos no corpo da Seção 4.1 a **Tabela 3 (15 RF)** e a **Tabela 4 (17 RNF)**, com três novos RNF (Auditabilidade, Observabilidade e Privacidade LGPD). O **Apêndice A** traz a especificação detalhada (Tabelas 7 e 8), com critério de aceitação, prioridade (Essencial / Importante / Desejável, na notação MoSCoW traduzida) e *status* (Atendido / Parcial / Futuro) por requisito.

### A4. Itálico em palavras estrangeiras

Aplicamos itálico de forma sistemática em termos como *workflow*, *dashboard*, *feedback*, *template*, *backend*, *frontend*, *full-stack*, *end-to-end*, *walkthrough*, *think-aloud*, *DevOps*, *pipeline*, *commit*, *build*, *linting*, *containers*, *framework*, *router*, *login*, *onboarding*, *cache*, *endpoints*, *type-safety*, *logs*, *backups*, *upload*, *tooltips*, *stakeholders*, *status*, *backlog*, entre outros. Preservamos "Internet" e "Web" com inicial maiúscula quando substantivos, conforme as Dicas da Escrita.

### A5. Ampliação da avaliação (perfil Aluno e N > 2)

A seção 5.2 foi reformulada e renomeada para **"Avaliação Formativa com Usuários"**, cobrindo duas rodadas e **cinco participantes (N=5)** nos três perfis do sistema: administrador (A1), professor (P1) e três estudantes de graduação em Computação da UFBA (E1, E2, E3). A Tabela 6 lista os participantes e as tarefas; a subseção **5.2.3** reporta os resultados com estudantes (tempo médio ~22 min, três categorias de achados e sugestões acionáveis já incorporadas ao *backlog*). Incluímos a **Figura 8** com a tela de resultados do aluno, antes ausente. A Seção 5.3 (Limitações) foi reescrita: removemos "ausência do perfil estudante" e passamos a declarar a natureza formativa da amostra, com planejamento explícito de estudo somativo (SUS, métricas quantitativas) no piloto institucional. O roteiro semiestruturado foi movido para o **Apêndice C**, conforme orientação do Prof. Durão.

### A6. Detalhamento de testes e casos consultáveis

A Tabela 5 (Seção 5.1 "Validação Técnica") reflete a contagem real do repositório: 15 arquivos unitários/integração em `src/tests/routers/` (Vitest) e 9 cenários *end-to-end* em `src/tests/e2e/` (Playwright), totalizando 24 arquivos. O **Apêndice B** (Tabela 9) apresenta 15 casos de teste representativos por módulo (auth, projeto, edital, inscricao, selecao, import, E2E), cada um com ID, objetivo, pré-condições e resultado esperado. O repositório público está referenciado no corpo e no apêndice: <https://github.com/luisfelipesena/sistema-de-monitoria-ic>, com reprodução local via `pnpm install && pnpm test` (Vitest) e `pnpm test:e2e` (Playwright).

## Ajustes adicionais (Dicas da Escrita do Prof. Durão)

- Agradecimentos em primeira pessoa do plural ("Agradecemos"), consistente com a coautoria.
- Questionário migrado para apêndice após as referências.
- Placements de figuras e tabelas ajustados para evitar páginas em branco.

Permanecemos à disposição para esclarecimentos adicionais.

Atenciosamente,

Luis Felipe Cordeiro Sena
Antoniel Magalhães de Souza
João Victor Leahy de Melo
Frederico Araújo Durão
