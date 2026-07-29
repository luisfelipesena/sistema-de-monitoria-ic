# Requirements Document

## Introduction

Este documento especifica os requisitos para as funcionalidades FALTANTES no fluxo de seleção de datas e horários do sistema de monitoria DCC. O fluxo completo do sistema segue rigorosamente a ordem: (1) Admin configura edital com opções de data/horário para provas, (2) Professor escolhe um slot e preenche dados da seleção, (3) PDF do edital reflete os dados preenchidos.

Funcionalidades já existentes no sistema (NÃO cobertas aqui):
- Admin define total de bolsas da PROGRAD e aloca por projeto
- Admin clica "Notificar Professores" (envia e-mails com tabela de bolsas)
- Professor visualiza bolsas no dashboard (somente leitura)
- Admin define número do edital, data de divulgação, solicita assinatura digital do chefe
- Professor edita pontos de prova e bibliografia (já implementado no formulário do projeto)
- PDF template já renderiza condicionalmente seções 6.2.3, 6.2.4 e 6.3

## Glossary

- **Sistema**: O sistema de monitoria IC/DCC como um todo
- **Admin**: Usuário com role `admin` e tipo `DCC`, responsável por gerenciar editais internos
- **Professor**: Usuário com role `professor`, responsável por projetos de monitoria aprovados
- **Edital_Interno**: Entidade `edital` no banco de dados, representando o edital interno DCC
- **Projeto**: Entidade `projeto` no banco de dados, representando um projeto de monitoria vinculado a um edital
- **Slot_Data_Horario**: Objeto JSON contendo `data` (date) e `horario` (string, ex: "14:00-16:00"), armazenado no array `datasProvasDisponiveis` do Edital_Interno
- **Dashboard_Professor**: Página do dashboard onde o professor gerencia seus projetos aprovados
- **Pagina_Edital_Config**: Formulário de criação/edição de edital na área administrativa

## Requirements

### Requirement 1: Admin define opções de data/horário de prova no Edital

**User Story:** Como Admin, eu quero definir 2-3 opções de data e horário para provas de seleção ao configurar o Edital Interno DCC, para que os professores possam escolher a opção mais adequada ao seu projeto.

#### Acceptance Criteria

1. WHEN o Admin está criando ou editando um Edital_Interno, THE Pagina_Edital_Config SHALL exibir uma seção "Datas disponíveis para provas" com campos para adicionar entre 2 e 3 Slots_Data_Horario, cada um contendo data e horário.
2. WHEN o Admin tenta salvar o Edital_Interno com menos de 2 Slots_Data_Horario, THE Sistema SHALL exibir mensagem de validação informando que são necessários no mínimo 2 slots.
3. WHEN o Admin tenta adicionar mais de 3 Slots_Data_Horario, THE Sistema SHALL impedir a adição e informar que o máximo permitido é 3 slots.
4. WHEN o Admin salva o Edital_Interno com Slots_Data_Horario válidos, THE Sistema SHALL persistir os slots no campo `datasProvasDisponiveis` da tabela `edital` em formato JSON (array de objetos com `data` e `horario`).
5. WHEN o Admin edita um Edital_Interno que já possui Slots_Data_Horario salvos, THE Pagina_Edital_Config SHALL pré-carregar os slots existentes no formulário para edição.

### Requirement 2: Professor escolhe data/horário da seleção

**User Story:** Como Professor, eu quero escolher uma data e horário de seleção dentre as opções definidas pelo Admin no edital, para que minha prova de seleção de monitores fique agendada.

#### Acceptance Criteria

1. WHILE o Projeto está vinculado a um Edital_Interno que possui Slots_Data_Horario configurados, THE Dashboard_Professor SHALL exibir um botão "Definir Data da Seleção" (ou equivalente) na linha/card do projeto aprovado.
2. WHEN o Professor clica no botão "Definir Data da Seleção", THE Dashboard_Professor SHALL abrir um modal ou painel exibindo as opções de Slot_Data_Horario disponíveis (radio buttons ou cards selecionáveis).
3. WHEN o Professor seleciona um Slot_Data_Horario e confirma, THE Sistema SHALL salvar a data no campo `dataSelecaoEscolhida` e o horário no campo `horarioSelecao` do Projeto.
4. WHILE o Professor já possui data/horário escolhidos, THE Dashboard_Professor SHALL exibir a escolha atual no card/linha do projeto com um botão para alterar.
5. WHEN o Professor clica para alterar a escolha, THE Dashboard_Professor SHALL reabrir o modal com a opção atual pré-selecionada, permitindo escolher outro Slot_Data_Horario.
6. IF o Edital_Interno vinculado ao Projeto não possui Slots_Data_Horario configurados, THEN THE Dashboard_Professor SHALL desabilitar o botão de escolha de data e exibir tooltip informando que as datas ainda não foram definidas pelo Admin.

### Requirement 3: Professor define voluntários adicionais

**User Story:** Como Professor, eu quero definir o número de voluntários adicionais para meu projeto após receber a notificação de bolsas, para que o edital reflita corretamente as vagas totais do projeto.

#### Acceptance Criteria

1. WHILE o Projeto está com status aprovado e vinculado a um Edital_Interno, THE Dashboard_Professor SHALL exibir o campo "Voluntários" como editável na seção de dados da seleção.
2. WHEN o Professor informa o número de voluntários, THE Sistema SHALL salvar o valor no campo `voluntariosSolicitados` do Projeto.
3. WHILE o Projeto está com status aprovado, THE Dashboard_Professor SHALL exibir o campo "Bolsistas" como somente leitura, refletindo o valor `bolsasDisponibilizadas` definido pelo Admin.
4. WHEN o Professor tenta definir um valor negativo para voluntários, THE Sistema SHALL exibir erro de validação informando que o valor deve ser zero ou positivo.

### Requirement 4: Visualização consolidada dos dados de seleção no Dashboard

**User Story:** Como Professor, eu quero visualizar e preencher todos os dados da seleção (data/horário, voluntários, pontos de prova e bibliografia) em uma seção unificada no dashboard, para gerenciar tudo de forma integrada.

#### Acceptance Criteria

1. WHILE o Projeto está vinculado a um Edital_Interno, THE Dashboard_Professor SHALL exibir uma seção "Dados da Seleção" contendo: botão para definir data/horário, campo de voluntários, editor de pontos de prova e editor de bibliografia.
2. WHEN o Projeto possui pontos de prova do template da disciplina e o Professor ainda não editou, THE Sistema SHALL pré-preencher o editor de pontos de prova com os valores do template (modelo sugerido pelo sistema).
3. WHEN o Projeto possui bibliografia do template da disciplina e o Professor ainda não editou, THE Sistema SHALL pré-preencher o editor de bibliografia com os valores do template (modelo sugerido pelo sistema).
4. WHEN o Professor edita pontos de prova ou bibliografia, THE Sistema SHALL salvar os valores nos campos `pontosProva` e `bibliografia` do Projeto.

### Requirement 5: Reflexo dos dados no PDF do Edital Interno

**User Story:** Como Admin, eu quero que o PDF do edital interno seja gerado com as datas e horários escolhidos pelos professores, para que o documento oficial esteja correto e completo.

#### Acceptance Criteria

1. WHEN o Admin gera o PDF do Edital_Interno, THE Sistema SHALL incluir na seção 6.2.3 uma tabela contendo disciplina, professor, data da seleção e horário para cada Projeto que possui `dataSelecaoEscolhida` preenchida.
2. WHEN o Admin gera o PDF do Edital_Interno, THE Sistema SHALL incluir na seção 6.3 os pontos de prova e bibliografia de cada Projeto que possui esses campos preenchidos.
3. IF um Projeto vinculado ao Edital_Interno não possui `dataSelecaoEscolhida` preenchida, THEN THE Sistema SHALL omitir esse Projeto da seção 6.2.3 do PDF.
4. IF um Projeto não possui `pontosProva` nem `bibliografia` preenchidos e o template da disciplina também não possui valores padrão, THEN THE Sistema SHALL omitir esse Projeto da seção 6.3 do PDF.
5. WHEN o PDF é gerado, THE Sistema SHALL utilizar o valor de `voluntariosSolicitados` do Projeto para exibir o número de vagas de voluntários na tabela de disciplinas.
