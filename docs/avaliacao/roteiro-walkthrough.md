# Roteiro de Avaliação Qualitativa - Sistema de Monitoria-IC

## Informações Gerais

| Item | Detalhe |
|------|---------|
| **Metodologia** | Walkthrough Guiado + Think-Aloud + Entrevista Semiestruturada |
| **Participantes** | 2 (Prof. Rubisley - Admin, Prof. Fred - Professor) |
| **Duração estimada** | ~1h por participante |
| **Materiais** | Gravador de tela (OBS), gravador de áudio, termo de consentimento |

---

## Preparação Pré-Sessão

### Ambiente
- [ ] Sistema rodando localmente ou em staging
- [ ] Banco de dados limpo/preparado com dados de teste
- [ ] Planilha de planejamento DCC preparada (formato esperado pelo sistema)
- [ ] Email de teste configurado para receber notificações
- [ ] Gravação de tela configurada (OBS Studio)
- [ ] Gravador de áudio backup (celular)

### Dados de Teste Necessários
- [ ] Planilha de planejamento com pelo menos 2-3 disciplinas
- [ ] Uma disciplina atribuída ao Prof. Fred (para ele ver o projeto)
- [ ] Departamento DCC cadastrado
- [ ] Período de inscrição criado (ano/semestre atual)

---

## SESSÃO 1: Prof. Rubisley (Admin) - Parte 1

**Duração:** ~25 minutos
**Objetivo:** Importação de planejamento e verificação de notificações

### Instruções Iniciais (2 min)

> "Professor, vou pedir que você realize algumas tarefas no sistema enquanto pensa em voz alta. Diga tudo que está pensando: o que espera acontecer, se algo está confuso, se algo te surpreendeu. Não há respostas certas ou erradas - estamos avaliando o sistema, não você."

### Tarefa 1.1: Login como Admin (3 min)

**Ação:** Acessar `/auth/login` e fazer login com credenciais de admin

| Checkpoint | Observar |
|------------|----------|
| ☐ Encontrou a página de login facilmente? | |
| ☐ Campos de email/senha estão claros? | |
| ☐ Feedback após login (redirecionamento)? | |
| ☐ Dashboard admin carregou corretamente? | |

**Perguntas Think-Aloud:**
- "O que você espera ver após o login?"
- "A tela inicial faz sentido para você?"

---

### Tarefa 1.2: Navegar até Importação de Projetos (3 min)

**Ação:** Encontrar e acessar a área de importação de planejamento

| Checkpoint | Observar |
|------------|----------|
| ☐ Menu/navegação está visível? | |
| ☐ Encontrou "Importar Projetos" facilmente? | |
| ☐ Precisou de ajuda para localizar? | |

**Perguntas Think-Aloud:**
- "Onde você procuraria para importar o planejamento?"
- "O nome do menu está claro?"

---

### Tarefa 1.3: Importar Planilha de Planejamento (8 min)

**Ação:** Fazer upload da planilha de planejamento DCC

| Checkpoint | Observar |
|------------|----------|
| ☐ Instruções de formato estão visíveis? | |
| ☐ Área de upload é intuitiva? | |
| ☐ Selecionou ano/semestre corretamente? | |
| ☐ Feedback durante processamento? | |
| ☐ Mensagem de sucesso/erro clara? | |
| ☐ Quantos projetos foram criados? | |
| ☐ Erros foram explicados adequadamente? | |

**Perguntas Think-Aloud:**
- "O que você espera que aconteça após o upload?"
- "As informações exibidas fazem sentido?"
- "Algo te surpreendeu no resultado?"

---

### Tarefa 1.4: Verificar Professores Notificados (5 min)

**Ação:** Verificar se os professores foram notificados sobre os projetos

| Checkpoint | Observar |
|------------|----------|
| ☐ Conseguiu encontrar lista de notificações? | |
| ☐ Status de envio está visível? | |
| ☐ Identifica quais professores foram notificados? | |
| ☐ Consegue ver detalhes do projeto criado? | |

**Perguntas Think-Aloud:**
- "Como você saberia se o professor recebeu a notificação?"
- "As informações exibidas são suficientes?"

---

### Tarefa 1.5: Visualizar Projetos Criados (4 min)

**Ação:** Acessar lista de projetos e verificar os recém-criados

| Checkpoint | Observar |
|------------|----------|
| ☐ Lista de projetos está acessível? | |
| ☐ Filtros por status funcionam? | |
| ☐ Consegue identificar projetos pendentes? | |
| ☐ Detalhes do projeto são visíveis? | |

**Perguntas Think-Aloud:**
- "O status 'PENDING_PROFESSOR_SIGNATURE' está claro?"
- "O que você esperaria ver aqui?"

---

## INTERVALO - Troca de Participante

> Neste momento, pausar gravação, agradecer Prof. Rubisley, e preparar ambiente para Prof. Fred.

---

## SESSÃO 2: Prof. Fred (Professor)

**Duração:** ~30 minutos
**Objetivo:** Primeiro acesso, criação de template e submissão de projeto

### Instruções Iniciais (2 min)

> "Professor, você recebeu um email informando que há um projeto de monitoria aguardando sua assinatura. Vou pedir que você acesse o sistema pela primeira vez e complete as tarefas necessárias. Por favor, pense em voz alta enquanto navega."

### Tarefa 2.1: Primeiro Acesso - Recuperação de Senha (5 min)

**Ação:** Acessar `/auth/login`, clicar em "Esqueci minha senha", redefinir

| Checkpoint | Observar |
|------------|----------|
| ☐ Link "Esqueci minha senha" está visível? | |
| ☐ Campo de email está claro? | |
| ☐ Mensagem de confirmação de envio? | |
| ☐ Email de recuperação chegou? (verificar) | |
| ☐ Link no email funcionou? | |
| ☐ Formulário de nova senha é intuitivo? | |
| ☐ Requisitos de senha estão claros? | |
| ☐ Confirmação de redefinição bem-sucedida? | |

**Perguntas Think-Aloud:**
- "O processo está claro para você?"
- "Algo poderia ser mais simples?"

---

### Tarefa 2.2: Login e Onboarding (5 min)

**Ação:** Fazer login com a nova senha e completar onboarding

| Checkpoint | Observar |
|------------|----------|
| ☐ Login funcionou com nova senha? | |
| ☐ Redirecionou para onboarding? | |
| ☐ Campos obrigatórios estão indicados? | |
| ☐ Dados pré-preenchidos estão corretos? | |
| ☐ Campo de assinatura digital é intuitivo? | |
| ☐ Conseguiu criar/upload assinatura? | |
| ☐ Formulário foi salvo com sucesso? | |

**Perguntas Think-Aloud:**
- "Os campos fazem sentido para você?"
- "A assinatura digital ficou clara?"
- "Faltou alguma informação importante?"

---

### Tarefa 2.3: Visualizar Projeto Criado (3 min)

**Ação:** Acessar dashboard e ver o projeto criado pela importação

| Checkpoint | Observar |
|------------|----------|
| ☐ Dashboard mostra projetos pendentes? | |
| ☐ Projeto da disciplina está visível? | |
| ☐ Status do projeto está claro? | |
| ☐ Consegue acessar detalhes do projeto? | |

**Perguntas Think-Aloud:**
- "Você entende o que precisa fazer com esse projeto?"
- "As informações estão completas?"

---

### Tarefa 2.4: Criar/Editar Template Padrão (5 min)

**Ação:** Criar ou editar template padrão para a disciplina

| Checkpoint | Observar |
|------------|----------|
| ☐ Opção de template está visível? | |
| ☐ Campos do template são compreensíveis? | |
| ☐ Conseguiu preencher informações? | |
| ☐ Template foi salvo com sucesso? | |

**Perguntas Think-Aloud:**
- "Para que serve esse template na sua visão?"
- "Usaria isso em semestres futuros?"

---

### Tarefa 2.5: Editar Projeto do Semestre (5 min)

**Ação:** Editar o projeto criado, ajustando informações conforme necessário

| Checkpoint | Observar |
|------------|----------|
| ☐ Projeto pré-preencheu do template? | |
| ☐ Campos são editáveis? | |
| ☐ Bolsas/voluntários podem ser definidos? | |
| ☐ Atividades podem ser adicionadas? | |
| ☐ Validações de campos funcionam? | |

**Perguntas Think-Aloud:**
- "As informações pré-preenchidas estão corretas?"
- "Faltou algum campo importante?"

---

### Tarefa 2.6: Assinar e Submeter Projeto (5 min)

**Ação:** Visualizar PDF, assinar digitalmente e submeter para aprovação

| Checkpoint | Observar |
|------------|----------|
| ☐ Botão de assinar está visível? | |
| ☐ Preview do PDF funcionou? | |
| ☐ Assinatura aparece no documento? | |
| ☐ Confirmação antes de submeter? | |
| ☐ Mensagem de sucesso após submissão? | |
| ☐ Status do projeto mudou? | |

**Perguntas Think-Aloud:**
- "O PDF está como você esperava?"
- "Confia que a assinatura foi registrada?"
- "O processo de submissão está claro?"

---

## SESSÃO 1: Prof. Rubisley (Admin) - Parte 2

**Duração:** ~15 minutos
**Objetivo:** Aprovação de projeto e geração de planilha PROGRAD

### Tarefa 1.6: Ver Projeto Submetido (3 min)

**Ação:** Acessar projetos e localizar o projeto submetido pelo Prof. Fred

| Checkpoint | Observar |
|------------|----------|
| ☐ Projeto aparece na lista de "Submetidos"? | |
| ☐ Consegue ver detalhes do projeto? | |
| ☐ Assinatura do professor está visível? | |
| ☐ PDF pode ser visualizado/baixado? | |

**Perguntas Think-Aloud:**
- "Como você identifica que esse projeto está pronto para análise?"
- "As informações são suficientes para aprovar?"

---

### Tarefa 1.7: Analisar e Aprovar Projeto (5 min)

**Ação:** Revisar projeto e aprovar

| Checkpoint | Observar |
|------------|----------|
| ☐ Opção de aprovar/rejeitar está clara? | |
| ☐ Campo de feedback é opcional? | |
| ☐ Confirmação antes de aprovar? | |
| ☐ Mensagem de sucesso? | |
| ☐ Status do projeto mudou para "APPROVED"? | |
| ☐ Professor foi notificado? (verificar email) | |

**Perguntas Think-Aloud:**
- "O fluxo de aprovação está intuitivo?"
- "Faltou alguma informação para tomar a decisão?"

---

### Tarefa 1.8: Gerar Planilha PROGRAD (5 min)

**Ação:** Gerar planilha Excel consolidada para envio ao Instituto/PROGRAD

| Checkpoint | Observar |
|------------|----------|
| ☐ Opção de gerar planilha está visível? | |
| ☐ Pode selecionar quais projetos incluir? | |
| ☐ Download funcionou? | |
| ☐ Planilha contém dados corretos? | |
| ☐ Links para PDFs estão inclusos? | |

**Perguntas Think-Aloud:**
- "A planilha gerada atende às necessidades?"
- "Faltou alguma informação importante?"

---

## ENTREVISTAS PÓS-USO

### Entrevista: Prof. Rubisley (Admin) - 15 min

```markdown
1. EXPERIÊNCIA GERAL
   - Descreva sua experiência geral com o sistema.
   - O que mais chamou sua atenção (positivo ou negativo)?

2. IMPORTAÇÃO
   - A importação da planilha funcionou como esperava?
   - O que poderia melhorar nesse processo?
   - Os erros (se houve) foram bem explicados?

3. FLUXO DE APROVAÇÃO
   - O fluxo de aprovação de projetos está claro?
   - As informações disponíveis são suficientes para aprovar/rejeitar?
   - Sentiu falta de alguma funcionalidade?

4. PLANILHA PROGRAD
   - A planilha gerada atende às necessidades reais?
   - Precisaria de ajustes manuais antes de enviar?

5. COMPARAÇÃO COM PROCESSO ATUAL
   - Comparando com o processo manual atual (planilhas, emails):
     * O que ficou mais fácil?
     * O que ainda parece complicado?
     * Quanto tempo economizaria?

6. ADOÇÃO
   - Conseguiria usar isso num semestre real?
   - Quais barreiras precisariam ser resolvidas?
   - Precisaria de treinamento adicional?

7. SUGESTÕES
   - O que mudaria ou adicionaria ao sistema?
   - Alguma funcionalidade crítica está faltando?
```

### Entrevista: Prof. Fred (Professor) - 15 min

```markdown
1. EXPERIÊNCIA GERAL
   - Descreva sua experiência geral com o sistema.
   - O que mais chamou sua atenção (positivo ou negativo)?

2. PRIMEIRO ACESSO
   - O processo de primeiro acesso foi tranquilo?
   - A recuperação de senha funcionou bem?
   - O onboarding capturou as informações necessárias?

3. TEMPLATE E PROJETO
   - A criação de template foi útil?
   - Usaria templates em semestres futuros?
   - O projeto pré-preenchido economizou tempo?

4. ASSINATURA DIGITAL
   - O processo de assinatura digital foi intuitivo?
   - Confia que a assinatura foi registrada corretamente?
   - O PDF gerado atendeu às expectativas?

5. COMPARAÇÃO COM PROCESSO ATUAL
   - Comparando com planilhas e emails atuais:
     * O que ficou mais fácil?
     * O que prefere no processo atual?
     * Quanto tempo economizaria por semestre?

6. ADOÇÃO
   - Usaria esse sistema no próximo semestre?
   - O que está faltando para adoção real?
   - Recomendaria para outros professores?

7. SUGESTÕES
   - O que mudaria ou adicionaria?
   - Alguma informação importante está faltando nos formulários?
```

---

## Checklist Pós-Sessão

### Coleta de Dados
- [ ] Gravação de tela salva
- [ ] Gravação de áudio salva
- [ ] Notas de observação registradas
- [ ] Termo de consentimento assinado
- [ ] Screenshots de problemas capturados

### Análise Preliminar
- [ ] Listar problemas de usabilidade encontrados
- [ ] Listar sugestões dos participantes
- [ ] Identificar padrões entre os dois perfis
- [ ] Classificar severidade dos problemas (crítico/médio/baixo)

---

## Modelo de Notas de Observação

```markdown
## Sessão: [Prof. Rubisley / Prof. Fred]
## Data: ____/____/______
## Hora início: ____:____
## Hora fim: ____:____

### Tarefa X.X: [Nome da Tarefa]
- **Tempo gasto:** _____ minutos
- **Completou com sucesso:** ☐ Sim ☐ Não ☐ Parcial
- **Precisou de ajuda:** ☐ Sim ☐ Não
- **Comentários verbais:**
  -
  -
- **Problemas observados:**
  -
  -
- **Reações/expressões:**
  -
```

---

## Termo de Consentimento (Template)

```markdown
TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO

Você está sendo convidado(a) a participar de uma avaliação de usabilidade
do Sistema de Monitoria-IC, desenvolvido como Trabalho de Conclusão de Curso.

PROCEDIMENTOS:
- Você realizará tarefas no sistema enquanto pensa em voz alta
- A sessão será gravada (tela e áudio) para análise posterior
- Ao final, responderá perguntas sobre sua experiência
- Duração estimada: 1 hora

CONFIDENCIALIDADE:
- Os dados serão usados apenas para fins acadêmicos
- Seu nome poderá ser mencionado no TCC como participante
- As gravações não serão divulgadas publicamente

PARTICIPAÇÃO VOLUNTÁRIA:
- Sua participação é voluntária
- Você pode desistir a qualquer momento sem justificativa

Eu, _________________________________, declaro que li e entendi
as informações acima e concordo em participar desta avaliação.

Data: ____/____/______

Assinatura: _________________________________
```

---

## Cronograma Sugerido

| Horário | Atividade | Duração |
|---------|-----------|---------|
| 00:00 | Preparação ambiente | 15 min |
| 00:15 | Sessão Admin - Parte 1 (Rubisley) | 25 min |
| 00:40 | Intervalo/Troca | 5 min |
| 00:45 | Sessão Professor (Fred) | 30 min |
| 01:15 | Sessão Admin - Parte 2 (Rubisley) | 15 min |
| 01:30 | Entrevista Rubisley | 15 min |
| 01:45 | Entrevista Fred | 15 min |
| 02:00 | Encerramento | 10 min |

**Total:** ~2h10min (pode ser dividido em 2 sessões separadas)

---

## Mapeamento para TCC

Os dados coletados serão analisados usando **Análise Temática**:

1. **Transcrever** entrevistas (IA pode ajudar)
2. **Codificar** trechos relevantes
3. **Agrupar** códigos em temas
4. **Reportar** no capítulo de Resultados:
   - Temas identificados por perfil
   - Citações representativas
   - Problemas de usabilidade encontrados
   - Sugestões de melhoria
   - Validação dos objetivos específicos
